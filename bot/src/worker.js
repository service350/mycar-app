/* My Car WhatsApp bot: a Cloudflare Worker connected to the WhatsApp Business (Cloud) API.
   Settings (Worker > Settings > Variables):
     WHATSAPP_TOKEN   secret: the permanent access token from Meta
     PHONE_NUMBER_ID  the bot number's ID from Meta (WhatsApp > API setup)
     VERIFY_TOKEN     any word you choose; type the same word in Meta's webhook settings
     APP_SECRET       secret (recommended): the Meta app secret, to check messages really come from Meta
     CONFIG_URLS      optional: where to read prices from (comma separated). Default: the published app files on GitHub
   KV binding: STATE (remembers each customer's conversation for a day). */
import { setConfig, handle } from './bot.js';

const DEFAULT_URLS = 'https://service350.github.io/mycar-app/mycar-config.js,https://service350.github.io/mycar-app/app/config.js';
let CFG = null, CFG_AT = 0;

/* The newest published settings (the same files the app updates itself from), refreshed every 10 minutes. */
async function loadConfig(env) {
    if (CFG && Date.now() - CFG_AT < 600000) return CFG;
    const urls = String(env.CONFIG_URLS || DEFAULT_URLS).split(',').map((u) => u.trim()).filter(Boolean);
    let best = null;
    for (const u of urls) {
        try {
            const r = await fetch(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now(), { cf: { cacheTtl: 0 } });
            if (!r.ok) continue;
            const s = await r.text();
            const i = s.indexOf('{'), j = s.lastIndexOf('}');
            const c = JSON.parse(s.slice(i, j + 1));
            if (c && c.pricing && (!best || Number(c.publishedAt || 0) > Number(best.publishedAt || 0))) best = c;
        } catch (e) { /* try the next file */ }
    }
    if (best) { CFG = best; CFG_AT = Date.now(); setConfig(best); }
    if (!CFG) throw new Error('no price list');
    return CFG;
}

async function verifySignature(req, body, secret) {
    if (!secret) return true;
    const sig = req.headers.get('x-hub-signature-256') || '';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return sig === 'sha256=' + hex;
}

/* One bot reply -> WhatsApp messages (text, reply buttons, or a list). */
function toWhatsApp(to, r) {
    let text = r.text || '';
    if (r.url) text += `\n\n${r.url.title}: ${r.url.href}`;
    const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
    const out = [];
    const interactive = (body, action, type) => out.push({ ...base, type: 'interactive', interactive: { type, body: { text: body }, action } });
    if (r.buttons && r.buttons.length) {
        const action = { buttons: r.buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title.slice(0, 20) } })) };
        if (text.length <= 1024) interactive(text, action, 'button');
        else { out.push({ ...base, type: 'text', text: { body: text.slice(0, 4096), preview_url: true } }); interactive('👇', action, 'button'); }
    } else if (r.list && r.list.rows.length) {
        interactive(text.slice(0, 1024), { button: r.list.button.slice(0, 20), sections: [{ title: r.list.button.slice(0, 24), rows: r.list.rows.slice(0, 10).map((x) => ({ id: x.id, title: x.title.slice(0, 24), ...(x.description ? { description: x.description.slice(0, 72) } : {}) })) }] }, 'list');
    } else {
        out.push({ ...base, type: 'text', text: { body: text.slice(0, 4096), preview_url: true } });
    }
    return out;
}

async function send(env, payload) {
    const v = env.GRAPH_VERSION || 'v23.0';
    const r = await fetch(`https://graph.facebook.com/${v}/${env.PHONE_NUMBER_ID}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!r.ok) console.log('send failed', r.status, await r.text());
}

async function onMessage(env, m) {
    let msg = null;
    if (m.type === 'text') msg = { text: m.text.body };
    else if (m.type === 'interactive') msg = { id: (m.interactive.button_reply || m.interactive.list_reply || {}).id };
    else if (m.type === 'button') msg = { text: m.button.text };
    if (!msg || (!msg.text && !msg.id)) return;
    await loadConfig(env);
    const key = 'u:' + m.from;
    const raw = env.STATE ? await env.STATE.get(key) : null;
    const state = raw ? JSON.parse(raw) : null;
    const { state: next, replies } = handle(state, msg);
    if (env.STATE) await env.STATE.put(key, JSON.stringify(next), { expirationTtl: 86400 });
    for (const r of replies) for (const p of toWhatsApp(m.from, r)) await send(env, p);
}

export default {
    async fetch(req, env, ctx) {
        const url = new URL(req.url);
        /* Meta checks the webhook address once, when you connect it. */
        if (req.method === 'GET') {
            if (url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env.VERIFY_TOKEN) return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
            if (url.pathname === '/health') { try { const c = await loadConfig(env); return Response.json({ ok: true, cars: c.pricing.categories.length, publishedAt: c.publishedAt || null }); } catch (e) { return Response.json({ ok: false, error: e.message }, { status: 500 }); } }
            return new Response('My Car bot', { status: 200 });
        }
        if (req.method !== 'POST') return new Response('', { status: 405 });
        const body = await req.text();
        if (!(await verifySignature(req, body, env.APP_SECRET))) return new Response('bad signature', { status: 401 });
        let data;
        try { data = JSON.parse(body); } catch (e) { return new Response('', { status: 400 }); }
        const msgs = [];
        (data.entry || []).forEach((e) => (e.changes || []).forEach((c) => ((c.value || {}).messages || []).forEach((m) => msgs.push(m))));
        /* Answer Meta right away; the reply is sent in the background. */
        ctx.waitUntil(Promise.all(msgs.map((m) => onMessage(env, m).catch((err) => console.log('error', err && err.message)))));
        return new Response('ok', { status: 200 });
    },
};
