/* My Car price bot: understands a free-text question, asks for what is missing (with buttons), and prices the trip
   with the app's own engine (engine.gen.js), the same way the app's "when do you need the car" mode does:
   every way of renting (hourly/daily/weekly/monthly, discounted hours, packages), cheapest first, Shabbat/holiday hours free. */
import * as E from './engine.gen.js';

/* ---------- words the bot says ---------- */
const S = {
    he: {
        hello: 'שלום! 👋 אני הבוט של *מחשבון My Car*.\nשאלו אותי כמה תעלה נסיעה, למשל:\n_כמה עולה רכב קטן ל-3 שעות מחר ב-10, 60 ק"מ_',
        btnPrice: 'חישוב מחיר', btnPackages: 'חבילות', btnFaq: 'שאלות נפוצות',
        askCar: 'איזה רכב? 🚗', askCarBtn: 'בחירת רכב',
        askHours: 'לכמה זמן? ⏱️\nאפשר ללחוץ או לכתוב, למשל "4 שעות" או "יומיים".',
        askKm: 'כמה קילומטרים בערך? 🛣️\nאפשר ללחוץ או לכתוב מספר.',
        h1: 'שעה', h3: '3 שעות', d1: 'יום', km30: '30 ק"מ', km60: '60 ק"מ', km120: '120 ק"מ',
        hours: (n) => (n === 1 ? 'שעה' : n === 2 ? 'שעתיים' : n % 24 === 0 && n >= 24 ? (n === 24 ? 'יום' : n === 48 ? 'יומיים' : `${n / 24} ימים`) : `${n} שעות`),
        km: (n) => `${n} ק"מ`,
        start: 'התחלה', assumed: '(לא צוינה שעה)',
        best: 'הכי משתלם', others: 'אפשרויות נוספות',
        time: 'זמן', distance: 'ק"מ', season: (n) => `תוספת עונה (${n})`, waiver: 'ביטול השתתפות', young: 'תוספת נהג צעיר', addons: 'תוספות',
        tipChange: 'לשינוי כתבו למשל: _ואם 5 שעות?_ · _רכב משפחתי_ · _עם ביטול השתתפות_ · _נהג צעיר_ · _מחר ב-9_',
        disclaimer: 'הערכה בלבד, לפי המחירון באפליקציה.',
        youngNoCar: (car, list) => `🧒 ${car} לא זמין לנהג חדש/צעיר. אפשר: ${list}`,
        noWaiverYoung: '🛡️ ביטול השתתפות לא זמין לנהג חדש/צעיר.',
        noWaiverCar: '🛡️ לרכב הזה אין ביטול השתתפות.',
        youngOn: '🧒 מחושב לנהג חדש/צעיר', waiverOn: '🛡️ כולל ביטול השתתפות',
        holy: (h, names) => `🕯️ ${h} שעות בתוך ${names} ללא חיוב`,
        shift: (t, save) => `💡 כדאי להתחיל ב-${t} ולחסוך ₪${save}`,
        noPackages: 'אין כרגע חבילות פעילות.', packagesTitle: '📦 *החבילות שלנו*',
        from: 'החל מ-', faqPick: 'בחרו שאלה:', faqBtn: 'שאלות', noFaq: 'אין כרגע שאלות נפוצות.',
        notUnderstood: 'לא הבנתי 🙂 נסו למשל: _רכב קטן ל-3 שעות מחר ב-10, 60 ק"מ_',
        app: 'להורדת האפליקציה',
        period: { hourly: 'לפי שעה', daily: 'לפי יום', weekly: 'לפי שבוע', monthly: 'לפי חודש', happy: 'שעות מוזלות' },
        days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
        today: 'היום', tomorrow: 'מחר',
    },
    en: {
        hello: 'Hi! 👋 I\'m the *My Car calculator* bot.\nAsk me what a trip will cost, for example:\n_How much is a small car for 3 hours tomorrow at 10, 60 km?_',
        btnPrice: 'Get a price', btnPackages: 'Packages', btnFaq: 'FAQ',
        askCar: 'Which car? 🚗', askCarBtn: 'Choose a car',
        askHours: 'For how long? ⏱️\nTap or type, e.g. "4 hours" or "2 days".',
        askKm: 'About how many km? 🛣️\nTap or type a number.',
        h1: '1 hour', h3: '3 hours', d1: '1 day', km30: '30 km', km60: '60 km', km120: '120 km',
        hours: (n) => (n === 1 ? '1 hour' : n % 24 === 0 && n >= 24 ? (n === 24 ? '1 day' : `${n / 24} days`) : `${n} hours`),
        km: (n) => `${n} km`,
        start: 'Start', assumed: '(no time given)',
        best: 'Best value', others: 'Other options',
        time: 'time', distance: 'km', season: (n) => `seasonal surcharge (${n})`, waiver: 'deductible waiver', young: 'young driver', addons: 'extras',
        tipChange: 'To change, type e.g.: _what about 5 hours?_ · _family car_ · _with waiver_ · _young driver_ · _tomorrow at 9_',
        disclaimer: 'Estimate only, based on the app\'s price list.',
        youngNoCar: (car, list) => `🧒 ${car} is not available to new/young drivers. Available: ${list}`,
        noWaiverYoung: '🛡️ Deductible waiver is not available to new/young drivers.',
        noWaiverCar: '🛡️ This car has no deductible waiver.',
        youngOn: '🧒 Priced for a new/young driver', waiverOn: '🛡️ Includes deductible waiver',
        holy: (h, names) => `🕯️ ${h} hours fall on ${names} and are not charged`,
        shift: (t, save) => `💡 Start at ${t} and save ₪${save}`,
        noPackages: 'No active packages right now.', packagesTitle: '📦 *Our packages*',
        from: 'From ', faqPick: 'Pick a question:', faqBtn: 'Questions', noFaq: 'No FAQ yet.',
        notUnderstood: 'Sorry, I didn\'t get that 🙂 Try: _small car for 3 hours tomorrow at 10, 60 km_',
        app: 'Get the app',
        period: { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', happy: 'Discounted hours' },
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        today: 'today', tomorrow: 'tomorrow',
    },
};

/* ---------- reading the message ---------- */
const HE_DAYS = [['ראשון', "א'"], ['שני', "ב'"], ['שלישי', "ג'"], ['רביעי', "ד'"], ['חמישי', "ה'"], ['שישי', "ו'"], ['שבת', "ש'"]];
const EN_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WORD_NUM = { 'אחת': 1, 'אחד': 1, 'שתיים': 2, 'שניים': 2, 'שתי': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6, 'שבע': 7, 'שבעה': 7, 'שמונה': 8, 'תשע': 9, 'תשעה': 9, 'עשר': 10, 'עשרה': 10, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };

function norm(t) {
    return String(t || '').replace(/[״“”]/g, '"').replace(/[׳‘’`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}
const isHebrew = (t) => /[֐-׿]/.test(t);

/* Turns "12 בצהריים", "8pm", "20:30" into hours and minutes. */
function fixHour(h, m, part) {
    if (h > 24 || m > 59) return null;
    if (part) {
        if (/בבוקר|am|a\.m/.test(part)) { if (h === 12) h = 0; }
        else if (/בצהר|צהריים/.test(part)) { if (h < 6) h += 12; }
        else if (/אחה|אחר הצהר|pm|p\.m|בערב|evening/.test(part)) { if (h < 12) h += 12; }
        else if (/בלילה|night/.test(part)) { if (h >= 8 && h < 12) h += 12; }
    }
    if (h === 24) h = 0;
    return { h, m };
}
const PART = '(בבוקר|בצהריים|בצהרים|צהריים|אחה"צ|אחר הצהריים|בערב|בלילה|am|pm|a\\.m\\.?|p\\.m\\.?|in the evening|at night)';

export function parse(raw, cats, now) {
    let t = ' ' + norm(raw) + ' ';
    const out = {};
    /* commands */
    if (/^\s*(היי|שלום|הי|hello|hi|hey|start|התחל|התחלה|תפריט|menu|עזרה|help)\s*[!.?]*\s*$/.test(t)) out.cmd = 'hello';
    if (/^\s*(חדש|חישוב חדש|איפוס|reset|new|restart)\s*$/.test(t)) out.cmd = 'reset';
    if (/^\s*(חבילות|packages?)\s*[?!.]*\s*$/.test(t)) out.cmd = 'packages';
    if (/^\s*(שאלות נפוצות|שאלות|faq)\s*[?!.]*\s*$/.test(t)) out.cmd = 'faq';
    Object.entries(WORD_NUM).forEach(([w, n]) => { t = t.replace(new RegExp(`(^|\\s)${w}(?=\\s)`, 'g'), `$1${n}`); });

    /* driver and waiver */
    if (/(נהג(ת)? (צעיר|חדש)|צעיר|מתחת ל-?\s?24|young|new driver|under 24)/.test(t)) out.young = true;
    if (/(נהג(ת)? ותיק|ותיק|experienced|not young|לא צעיר)/.test(t)) out.young = false;
    if (/(בלי|ללא|without|no) (ביטול השתתפות|waiver)/.test(t)) out.waiver = false;
    else if (/(ביטול השתתפות|waiver)/.test(t)) out.waiver = true;

    /* km */
    t = t.replace(/(\d+(?:\.\d+)?)\s*(ק"מ|קמ|ק'מ|קילומטר\S*|km|kms|kilomet\S*)/g, (m0, n) => { out.km = Math.round(Number(n)); return ' '; });

    /* date */
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const addDays = (n) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
    t = t.replace(/(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/g, (m0, d, mo, y) => {
        let yy = y ? Number(y) : base.getFullYear(); if (yy < 100) yy += 2000;
        let dt = new Date(yy, Number(mo) - 1, Number(d));
        if (!y && dt < base) dt = new Date(yy + 1, Number(mo) - 1, Number(d));
        out.date = dt; return ' ';
    });
    if (/מחרתיים|day after tomorrow/.test(t)) { out.date = addDays(2); t = t.replace(/מחרתיים|day after tomorrow/g, ' '); }
    if (/(^|\s)(מחר|tomorrow)(\s|$)/.test(t)) { out.date = addDays(1); t = t.replace(/(^|\s)(מחר|tomorrow)(?=\s|$)/g, ' '); }
    if (/(^|\s)(היום|today|now|עכשיו)(\s|$)/.test(t)) { out.date = out.date || addDays(0); if (/עכשיו|now/.test(t)) out.now = true; t = t.replace(/(^|\s)(היום|today|now|עכשיו)(?=\s|$)/g, ' '); }
    const dayAt = (wd) => { const diff = (wd - base.getDay() + 7) % 7; return addDays(diff); };
    HE_DAYS.forEach(([name, letter], wd) => {
        const re = new RegExp(`(ב?יום\\s+(${name}|${letter.replace("'", "'?")})|(^|\\s)ב(${name})(?=\\s))`, 'g');
        if (re.test(t)) { out.date = dayAt(wd); t = t.replace(re, ' '); }
    });
    if (/(^|\s)(בשבת|שבת)(?=\s)/.test(t) && !out.date) { out.date = dayAt(6); t = t.replace(/(^|\s)(בשבת|שבת)(?=\s)/g, ' '); }
    EN_DAYS.forEach((name, wd) => { const re = new RegExp(`(on )?${name}`, 'g'); if (re.test(t)) { out.date = dayAt(wd); t = t.replace(re, ' '); } });

    /* a time range: "מ-10 עד 14", "בין 10 ל-14", "from 10 to 14" */
    const T = `(\\d{1,2})(?::(\\d{2}))?\\s*${PART}?`;
    const range = new RegExp(`(?:מ-?|משעה|מהשעה|בין|from|between)\\s*${T}\\s*(?:עד|ל-?|until|till|to|and|-)\\s*(?:השעה\\s*)?${T}`);
    let m = range.exec(t);
    if (m) {
        const a = fixHour(Number(m[1]), Number(m[2] || 0), m[3]);
        const b = fixHour(Number(m[4]), Number(m[5] || 0), m[6] || (m[3] && Number(m[4]) < Number(m[1]) ? null : m[3]));
        if (a && b) {
            out.time = a; let dh = (b.h * 60 + b.m - a.h * 60 - a.m) / 60; if (dh <= 0) dh += 24;
            out.hours = Math.max(1, Math.ceil(dh - 1e-9)); t = t.replace(m[0], ' ');
        }
    }
    /* a single time: "בשעה 12", "ב-12:30", "12 בצהריים", "at 8pm" */
    if (!out.time) {
        const times = [
            new RegExp(`(?:בשעה|בשעות|ב-|ב|at|@)\\s*(\\d{1,2}):(\\d{2})\\s*${PART}?`),
            new RegExp(`(?:בשעה|בשעות|ב-|at|@)\\s*(\\d{1,2})()\\s*${PART}?(?!\\s*(?:שעות|שעה|ימים|יום|ק|km|hours?|days?|h\\b))`),
            new RegExp(`(?:^|\\s)ב(\\d{1,2})()\\s*${PART}?(?=\\s)(?!\\s*(?:שעות|שעה|ימים|יום|ק|km|hours?|days?))`),
            new RegExp(`(\\d{1,2}):(\\d{2})\\s*${PART}?`),
            new RegExp(`(\\d{1,2})()\\s*${PART}`),
        ];
        for (const re of times) {
            m = re.exec(t);
            if (m) {
                /* "בערב בשעה 8": the part of day can come before the time too */
                const part = m[3] || (new RegExp(PART).exec(t) || [])[1];
                const v = fixHour(Number(m[1]), Number(m[2] || 0), part);
                if (v) { out.time = v; t = t.replace(m[0], ' '); break; }
            }
        }
    }
    /* duration */
    const dur = [
        [/(\d+(?:\.\d+)?)\s*(שעות|ש'|hours?|hrs?|h)(?=\s|$|[?.!,])/, (n) => Number(n)],
        [/(\d+(?:\.\d+)?)\s*(ימים|יום|days?)(?=\s|$|[?.!,])/, (n) => Number(n) * 24],
        [/(\d+)\s*(שבועות|שבוע|weeks?)/, (n) => Number(n) * 168],
        [/(\d+)\s*(חודשים|חודש|months?)/, (n) => Number(n) * 720],
        [/שעתיים|2 hours/, () => 2], [/יומיים/, () => 48], [/שבועיים/, () => 336], [/חודשיים/, () => 1440],
        [/(^|\s)(ל|ל-|של |for (a |an |one )?)?(שעה|hour)(?=\s|$|[?.!,])/, () => 1],
        [/(^|\s)(ל|ל-|של |for (a |one )?)?(יום|day)(?=\s|$|[?.!,])/, () => 24],
        [/(^|\s)(ל|ל-|של |for (a |one )?)?(שבוע|week)(?=\s|$|[?.!,])/, () => 168],
        [/(^|\s)(ל|ל-|של |for (a |one )?)?(חודש|month)(?=\s|$|[?.!,])/, () => 720],
        [/חצי יום|half (a )?day/, () => 12],
    ];
    if (!out.hours) for (const [re, f] of dur) { m = re.exec(t); if (m) { out.hours = Math.max(1, Math.ceil(f(m[1]) - 1e-9)); t = t.replace(m[0], ' '); break; } }

    /* car */
    let best = null;
    (cats || []).forEach((c) => {
        const names = [c.name, c.name_en, ...(CAR_ALIASES[c.id] || [])].filter(Boolean).map(norm);
        names.forEach((n) => {
            const toks = n.replace(/\(.*?\)/g, ' ').split(/\s+/).filter((x) => x && !['רכב', 'car', 'a', 'the'].includes(x));
            if (!toks.length) return;
            const ok = toks.every((k) => (/^\d+$/.test(k) ? new RegExp(`(^|\\s)${k}\\s*(מקומות|מושבים|seats?|seater)`).test(t) : t.includes(k)));
            if (ok && (!best || toks.length > best.n)) best = { id: c.id, n: toks.length };
        });
    });
    if (best) out.car = best.id;
    out.rest = t.trim();
    /* a bare number answers whatever the bot just asked */
    const bare = /^\s*(\d+(?:\.\d+)?)\s*$/.exec(t);
    if (bare) out.number = Number(bare[1]);
    return out;
}
const CAR_ALIASES = { small: ['קטן', 'קטנה', 'small', 'mini'], family: ['משפחתי', 'משפחתית', 'family'], electric: ['חשמלי', 'חשמלית', 'electric', 'ev'], commercial: ['מסחרי', 'מסחרית', 'commercial', 'van', 'טנדר'] };

/* ---------- pricing: the app's "when do you need the car" logic ---------- */
function quote(st) {
    const c = E.cfg(), F = c.features || {};
    const cat = c.pricing.categories.find((x) => x.id === st.car);
    const periods = E.PERIOD_KEYS.filter((k) => (F.periods || {})[k] !== false);
    const young = F.youngDriver !== false && !!st.young;
    const waiverOn = F.waiver !== false && !!st.waiver && !(young && !E.youngWaiverOk()) && !!cat.deductibleWaiver;
    const sd = st.start;
    const credit = E.holyCredit(sd, st.hours);
    const H = Math.max(1, st.hours - credit.credit);
    const suggest = F.packageSuggestions !== false ? (c.packages || []).filter((p) => p.suggest !== false && E.packageLive(p)) : [];
    const opts = [];
    const withAddons = (r, hours) => r.total + E.addonsTotal(cat, 'regular', {}, young, hours, st.km, r.timeCost + r.kmCost).sum;
    periods.forEach((p) => {
        if (!E.hasVal(cat.rates[p] && cat.rates[p].timePrice)) return;
        const prevUnit = { daily: 1, weekly: 24, monthly: 168 }[p];
        if (prevUnit && H <= prevUnit) return;
        const units = Math.max(1, Math.ceil(H / E.REQ_HOURS[p] - 1e-9));
        const r = E.calculateCost(cat.id, p, units, st.km, waiverOn, young, false, null, sd);
        opts.push({ kind: 'period', period: p, units, r, cost: withAddons(r, units * E.REQ_HOURS[p]) });
    });
    if (F.happyHour !== false && cat.happyHourRate && periods.includes('hourly') && sd) {
        const hc = E.happyHourCount(sd, H);
        const whole = (F.happyRule || 'whole') !== 'partial';
        if (whole ? hc === H : hc > 0) {
            const r = E.calculateCost(cat.id, 'hourly', H, st.km, waiverOn, young, true, whole ? null : hc, sd);
            opts.push({ kind: 'happy', period: 'hourly', units: H, r, cost: withAddons(r, H) });
        }
    }
    suggest.forEach((p) => {
        const q = E.packageQuote(p, cat, H, st.km, sd, waiverOn, young, {});
        if (!q) return;
        opts.push({ kind: 'package', p, q, cost: q.cost + E.addonsTotal(cat, 'packages', {}, young, H, st.km, q.base).sum });
    });
    opts.sort((a, b) => a.cost - b.cost);
    return { cat, opts, credit, H, young, waiverOn };
}

/* "Start at 18:00 instead of 17:55 and save": nearby start times, 5-minute steps, same Shabbat credit. */
function shiftTip(st, base) {
    const F = E.cfg().features || {};
    if (F.shiftTips === false || !st.start || !base.opts.length) return null;
    const max = Math.min(240, Math.max(5, Number(F.shiftMax) || 60));
    const now = E.israelNow().getTime();
    let best = null;
    for (let m = 5; m <= max; m += 5) {
        for (const dir of [1, -1]) {
            const sd = new Date(st.start.getTime() + dir * m * 60000);
            if (sd.getTime() < now) continue;
            const q = quote({ ...st, start: sd, hours: st.hours });
            const o = q.opts[0];
            if (o && base.opts[0].cost - o.cost >= 1 && (!best || o.cost < best.cost - 0.009)) best = { sd, cost: o.cost, save: base.opts[0].cost - o.cost };
        }
    }
    return best;
}

/* ---------- writing the answer ---------- */
const money = (n) => '₪' + E.fmtN(n);
function optLabel(o, L) {
    if (o.kind === 'package') return `📦 ${String(o.p.name).trim()} (${E.trackText(o.q.track)})`;
    if (o.kind === 'happy') return `🕒 ${L.period.happy} · ${L.hours(o.units)}`;
    const unitWord = { hourly: L.hours(o.units), daily: L === S.he ? (o.units === 1 ? 'יום' : `${o.units} ימים`) : (o.units === 1 ? '1 day' : `${o.units} days`), weekly: L === S.he ? (o.units === 1 ? 'שבוע' : `${o.units} שבועות`) : (o.units === 1 ? '1 week' : `${o.units} weeks`), monthly: L === S.he ? (o.units === 1 ? 'חודש' : `${o.units} חודשים`) : (o.units === 1 ? '1 month' : `${o.units} months`) }[o.period];
    return `${L.period[o.period]} · ${unitWord}`;
}
function whenText(d, L) {
    const now = E.israelNow();
    const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((dd - day0) / 86400000);
    const hhmm = E.dtParts(d).time;
    const dayName = L === S.he ? `יום ${L.days[d.getDay()]}` : L.days[d.getDay()];
    if (diff === 0) return `${L.today} ${hhmm}`;
    if (diff === 1) return `${L.tomorrow} (${dayName}) ${hhmm}`;
    return `${dayName} ${d.getDate()}/${d.getMonth() + 1} ${hhmm}`;
}

function priceReply(st, L) {
    const c = E.cfg();
    const q = quote(st);
    if (!q.opts.length) return [{ text: L.notUnderstood }];
    const b = q.opts[0];
    const lines = [];
    lines.push(`🚗 *${String(q.cat.name).trim()}* · ${L.hours(st.hours)} · ${L.km(st.km)}`);
    lines.push(`🕒 ${L.start}: ${whenText(st.start, L)}${st.assumedTime ? ' ' + L.assumed : ''}`);
    lines.push('');
    lines.push(`💰 *${money(b.cost)}* · ${optLabel(b, L)}`);
    if (b.kind !== 'package') {
        const r = b.r, parts = [`${L.time} ${money(r.timeCost)}`, `${L.distance} ${money(r.kmCost)}`];
        if (r.waiverCost) parts.push(`${L.waiver} ${money(r.waiverCost)}`);
        if (r.youthSurcharge) parts.push(`${L.young} ${money(r.youthSurcharge)}`);
        if (r.seasonCost) parts.push(`${L.season(r.seasonNames.join(' + '))} ${money(r.seasonCost)}`);
        const add = b.cost - r.total;
        if (add > 0.009) parts.push(`${L.addons} ${money(add)}`);
        lines.push('   ' + parts.join(' · '));
    } else if (b.q.over > 0) {
        lines.push('   ' + E.txp('pkg.overKm', { 'קמ': E.fmtShort(b.q.over) }));
    }
    if (q.credit.credit > 0) lines.push(L.holy(q.credit.credit, E.holyNames(q.credit.names)));
    if (q.young) lines.push(L.youngOn);
    if (q.waiverOn) lines.push(L.waiverOn);
    else if (st.waiver && q.young && !E.youngWaiverOk()) lines.push(L.noWaiverYoung);
    else if (st.waiver && !q.cat.deductibleWaiver) lines.push(L.noWaiverCar);
    const rest = q.opts.slice(1, 3);
    if (rest.length) {
        lines.push('');
        lines.push(`${L.others}:`);
        rest.forEach((o) => lines.push(`• ${optLabel(o, L)}: ${money(o.cost)}`));
    }
    const tip = shiftTip(st, q);
    if (tip) { lines.push(''); lines.push(L.shift(E.dtParts(tip.sd).time + (E.dtParts(tip.sd).date !== E.dtParts(st.start).date ? ` (${tip.sd.getDate()}/${tip.sd.getMonth() + 1})` : ''), E.fmtN(tip.save))); }
    lines.push('');
    lines.push(L.tipChange);
    lines.push(`_${L.disclaimer}_`);
    const appUrl = String((c.distribution || {}).apkUrl || '').replace(/[^/]*$/, '');
    return [{ text: lines.join('\n'), buttons: [{ id: 'cmd:reset', title: L === S.he ? 'חישוב חדש' : 'New quote' }, { id: 'cmd:packages', title: L.btnPackages }], url: appUrl ? { title: L.app, href: appUrl } : null }];
}

function carList(L, young) {
    const c = E.cfg();
    const rows = c.pricing.categories.filter((x) => !young || x.youngAllowed).slice(0, 10).map((x) => {
        const r = x.rates.hourly && x.rates.hourly.timePrice;
        return { id: 'car:' + x.id, title: x.name.slice(0, 24), description: E.hasVal(r) ? `${money(r)} ${E.txp('unit.hourly')}` : '' };
    });
    return { text: L.askCar, list: { button: L.askCarBtn, rows } };
}

function packagesReply(L) {
    const c = E.cfg();
    const ps = (c.packages || []).filter((p) => E.packageLive(p));
    if (!ps.length) return [{ text: L.noPackages }];
    const lines = [L.packagesTitle, ''];
    ps.forEach((p) => {
        const tracks = (p.tracks || []).filter((t) => E.hasVal(t.price));
        const min = tracks.length ? Math.min(...tracks.map((t) => Number(t.price))) : null;
        lines.push(`*${String(p.name).trim()}*${min != null ? ` · ${L.from}${money(min)}` : ''}`);
        if (p.description) lines.push(String(p.description).trim());
        lines.push(`⏱️ ${E.durationText(p)}${E.windowsText(p) ? ' · ' + E.windowsText(p) : ''}`);
        tracks.forEach((t) => lines.push(`• ${E.trackText(t)}: ${money(Number(t.price))}`));
        lines.push('');
    });
    return [{ text: lines.join('\n').trim() }];
}

function faqItems() {
    const c = E.cfg();
    const items = [];
    (c.screens || []).filter((s) => !s.hidden).forEach((s) => (s.blocks || []).forEach((b) => { if (b.type === 'faq') (b.items || []).forEach((it) => items.push(it)); }));
    return items;
}

/* ---------- the conversation ---------- */
export function setConfig(c) { E.setConfig(c); }

/* state: what we know so far about this customer's trip. msg: { text } or { id } (a tapped button/list row). */
export function handle(state, msg) {
    const st = { ...(state || {}) };
    const text = msg.id ? '' : String(msg.text || '');
    if (text && (isHebrew(text) || !st.lang)) st.lang = isHebrew(text) ? 'he' : (/[a-z]/i.test(text) ? 'en' : st.lang || 'he');
    st.lang = st.lang || 'he';
    E.setLang(st.lang);
    const L = S[st.lang];
    const c = E.cfg();
    const now = E.israelNow();
    if (st.start) st.start = new Date(st.start);

    let p = {};
    if (msg.id) {
        const [k, v] = msg.id.split(':');
        if (k === 'car') p.car = v;
        else if (k === 'hours') p.hours = Number(v);
        else if (k === 'km') p.km = Number(v);
        else if (k === 'cmd') p.cmd = v;
        else if (k === 'faq') { const it = faqItems()[Number(v)]; return { state: st, replies: it ? [{ text: `*${String(it.q).trim()}*\n${String(it.a).trim()}` }] : [] }; }
    } else {
        p = parse(text, c.pricing.categories, now);
    }

    if (p.cmd === 'hello' || (!state && !p.car && !p.hours && !p.km && !p.time && !p.date && p.cmd !== 'packages' && p.cmd !== 'faq')) {
        const fresh = { lang: st.lang };
        return { state: fresh, replies: [{ text: L.hello, buttons: [{ id: 'cmd:price', title: L.btnPrice }, { id: 'cmd:packages', title: L.btnPackages }, { id: 'cmd:faq', title: L.btnFaq }] }] };
    }
    if (p.cmd === 'reset' || p.cmd === 'price') {
        const fresh = { lang: st.lang, young: st.young };
        return { state: { ...fresh, awaiting: 'car' }, replies: [carList(L, fresh.young)] };
    }
    if (p.cmd === 'packages') return { state: st, replies: packagesReply(L) };
    if (p.cmd === 'faq') {
        const items = faqItems();
        if (!items.length) return { state: st, replies: [{ text: L.noFaq }] };
        return { state: st, replies: [{ text: L.faqPick, list: { button: L.faqBtn, rows: items.slice(0, 10).map((it, i) => ({ id: 'faq:' + i, title: String(it.q).trim().slice(0, 24), description: String(it.q).trim().length > 24 ? String(it.q).trim().slice(24, 96) : '' })) } }] };
    }

    /* a bare number answers the open question */
    if (p.number != null && !p.hours && !p.km) {
        if (st.awaiting === 'km') p.km = Math.round(p.number);
        else if (st.awaiting === 'hours') p.hours = Math.max(1, Math.ceil(p.number));
    }
    ['car', 'hours', 'km', 'young', 'waiver'].forEach((k) => { if (p[k] !== undefined) st[k] = p[k]; });
    if (p.time || p.date || p.now) {
        const base = p.date || (st.start ? new Date(st.start) : new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        let start;
        if (p.time) start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), p.time.h, p.time.m);
        else if (p.now) start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
        else start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), st.start ? new Date(st.start).getHours() : 10, st.start ? new Date(st.start).getMinutes() : 0);
        if (!p.date && p.time && start < now) start = new Date(start.getTime() + 86400000);
        st.start = start;
        st.assumedTime = !p.time && !p.now;
    }

    const understood = ['car', 'hours', 'km', 'young', 'waiver', 'time', 'date', 'now'].some((k) => p[k] !== undefined) || p.number != null;
    if (!understood) return { state: st, replies: [{ text: L.notUnderstood, buttons: [{ id: 'cmd:price', title: L.btnPrice }, { id: 'cmd:packages', title: L.btnPackages }, { id: 'cmd:faq', title: L.btnFaq }] }] };

    /* young drivers: only some cars */
    const young = (c.features || {}).youngDriver !== false && !!st.young;
    if (st.car && young) {
        const cat = c.pricing.categories.find((x) => x.id === st.car);
        if (cat && !cat.youngAllowed) {
            const ok = c.pricing.categories.filter((x) => x.youngAllowed).map((x) => x.name).join(', ');
            st.car = null;
            return { state: { ...st, awaiting: 'car' }, replies: [{ text: L.youngNoCar(cat.name, ok) }, carList(L, true)] };
        }
    }
    if (!st.car) return { state: { ...st, awaiting: 'car' }, replies: [carList(L, young)] };
    if (!st.hours) return { state: { ...st, awaiting: 'hours' }, replies: [{ text: L.askHours, buttons: [{ id: 'hours:1', title: L.h1 }, { id: 'hours:3', title: L.h3 }, { id: 'hours:24', title: L.d1 }] }] };
    if (st.km == null) return { state: { ...st, awaiting: 'km' }, replies: [{ text: L.askKm, buttons: [{ id: 'km:30', title: L.km30 }, { id: 'km:60', title: L.km60 }, { id: 'km:120', title: L.km120 }] }] };
    if (!st.start) { st.start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0); st.assumedTime = true; }
    st.awaiting = null;
    return { state: st, replies: priceReply(st, L) };
}
export { quote };
