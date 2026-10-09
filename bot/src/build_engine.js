/* Builds engine.gen.js: the app's pricing functions, copied verbatim from app.jsx, so the bot prices exactly like the app. */
const fs = require('fs');
const parser = require('/home/claude/web2/node_modules/@babel/parser');
const src = fs.readFileSync('/home/claude/web2/app.jsx', 'utf8');
const ast = parser.parse(src, { sourceType: 'script', plugins: ['jsx'] });
const WANT = ['PERIOD_KEYS', 'NEXT_PERIOD', 'ROLLOVER_KEY', 'applyScheduledPricing', 'fmtN', 'fmtShort', 'hasVal', 'localize',
  'stripMarks', 'PKG_UNIT_HOURS', 'REQ_HOURS', 'DAY_HE', 'dayShort', 'holyOn', 'holyCredit', 'holyNames',
  'packageLive', 'packageHours', 'packageCats', 'packageTracks', 'trackPrice', 'packageHasCatPrices', 'minTrackPrice', 'packageStart', 'packageHasHours',
  'hm', 'atMinutes', 'startAllowed', 'daysText', 'windowsText', 'packageWaiverPrice', 'packageYoungAllowed', 'packageYoungFee',
  'addonApplies', 'addonActive', 'addonCost', 'addonsTotal', 'pickPrice', 'extraUnitPrice', 'extraUnitWaiver', 'packageExtras', 'extraQty', 'packageQuote',
  'trackText', 'durationText', 'ALL_DAYS', 'DEFAULT_HAPPY_WINDOWS', 'happyWindows', 'inWindow', 'happyHourCount', 'ymd', 'seasonsList', 'seasonsOn', 'seasonCharge', 'calculateCost', 'parseDT', 'dtParts', 'audienceOk', 'youngWaiverOk', 'tx'];
const got = {};
for (const st of ast.program.body) {
  let names = [];
  if (st.type === 'FunctionDeclaration') names = [st.id.name];
  else if (st.type === 'VariableDeclaration') names = st.declarations.map((d) => d.id.name);
  const hit = names.find((n) => WANT.includes(n));
  if (hit) got[hit] = src.slice(st.start, st.end);
}
const missing = WANT.filter((n) => !got[n]);
if (missing.length) { console.error('missing', missing); process.exit(1); }
const body = WANT.map((n) => got[n]).join('\n\n').replace(/^window\.__\w+ = \w+;$/mg, '');
const texts = fs.readFileSync('/home/claude/web2/texts.js', 'utf8');
const out = `/* GENERATED from web2/app.jsx by build_engine.js. Do not edit; rebuild instead. */
/* The bot works in Israel wall-clock time: every Date's "local" fields are Israel time, whatever the server's time zone. */
${texts}
let APP = null, LANG = 'he';
const window = { get APP_CONFIG() { return APP; } };
const cfg = () => { if (APP && APP.pricing && APP.pricing.future && APP.__sched !== 'on') applyScheduledPricing(APP); return LANG === 'en' ? (APP.__en || (APP.__en = localize(APP))) : APP; };
const curLang = () => LANG;
const txp = (k, v) => stripMarks(tx(k, v));
/* Shabbat/holiday windows as Israel wall-clock times. */
let HOLY = { src: null, list: [] };
function holyWindows() {
  const h = (APP || {}).holy;
  const wall = (iso) => { const m = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})/.exec(iso); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : NaN; };
  if (HOLY.src !== h) HOLY = { src: h, list: ((h && h.windows) || []).map((w) => ({ s: wall(w[0]), e: wall(w[1]), name: w[2] || 'shabbat' })).filter((w) => w.e > w.s) };
  return HOLY.list;
}
/* "Now" and "today" in Israel. */
function israelNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
}
const todayStr = () => { const d = israelNow(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

${body}

export function setConfig(c) { APP = c; HOLY = { src: null, list: [] }; }
export function setLang(l) { LANG = l === 'en' ? 'en' : 'he'; }
export { cfg, tx, txp, israelNow, todayStr, calculateCost, happyHourCount, packageQuote, packageLive, packageHasHours, startAllowed, windowsText, trackText, durationText, addonsTotal,
  holyCredit, holyNames, holyOn, fmtN, fmtShort, hasVal, parseDT, dtParts, REQ_HOURS, PERIOD_KEYS, NEXT_PERIOD, ROLLOVER_KEY, youngWaiverOk, audienceOk };
`;
fs.writeFileSync('engine.gen.js', out);
console.log('engine.gen.js', out.length, 'bytes');
