#!/usr/bin/env node
// thrive: the THRIVE terminal for your shell. It only reads: no keys, no signing.
// Rebalancing a wallet is signed in the web terminal, where the wallet itself confirms each step.
const VERSION = "1.0.0";
const DEFAULT_URL = "https://thrive.example";   // set to the live domain before publishing
const SERVER = (process.env.THRIVE_URL || DEFAULT_URL).replace(/\/$/, "");

const tty = (process.stdout.isTTY || !!process.env.FORCE_COLOR) && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const gold = c("38;2;155;141;240"), safe = c("38;2;112;150;240"), wild = c("38;2;214;120;222"), ok = c("38;2;110;210;150"), bad = c("38;2;255;128;110");
const dim = c("2"), bold = c("1");
const out = (s = "") => process.stdout.write(s + "\n");
const strip = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "");
const pad = (s, n, right = false) => { const g = Math.max(0, n - strip(s).length); return right ? " ".repeat(g) + s : s + " ".repeat(g); };
const usd = (x, d = 2) => (x == null ? "–" : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (x, d = 2) => (x == null ? "–" : (x > 0 ? "+" : "") + Number(x).toFixed(d) + "%");
const signed = (x, s) => (x >= 0 ? ok(s) : bad(s));
const ago = (t) => { if (!t) return "–"; const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`; };
const zoneCol = (k) => (k === "panic" ? safe : k === "euphoria" ? wild : (s) => s);

async function get(path) {
  let r;
  try { r = await fetch(SERVER + path, { headers: { "user-agent": "thrive-cli/" + VERSION } }); }
  catch { throw new Error(`Cannot reach ${SERVER}. Check your connection, or set THRIVE_URL.`); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

function head(title) {
  out();
  out(`  ${gold("✦")} ${bold("THRIVE")} ${dim("·")} ${title}`);
  out(dim("  " + "─".repeat(58)));
}

// a 1–10 scale with the needle where the score sits
function meter(score, w = 46) {
  const i = Math.round(((score - 1) / 9) * (w - 1));
  let bar = "";
  for (let k = 0; k < w; k++) { const ch = k === i ? "●" : "─"; const at = k / (w - 1); bar += k === i ? bold(ch) : at < 0.23 ? safe(ch) : at > 0.77 ? wild(ch) : dim(ch); }
  return `  ${bar}\n  ${dim(pad("1 winter", 12) + pad("3", 12) + pad("8", 12) + pad("10 bloom", 10, true))}`;
}

const PART = { memeVolume: "Meme volume", memeBuyShare: "Meme buying", launches: "New launches", eth: "ETH", stocks: "Stock tokens", news: "Headlines" };
function partVal(k, p) {
  if (p.value == null) return "–";
  return k === "news" ? (p.value > 0 ? "+" : "") + p.value.toFixed(2) : k === "memeVolume" ? `${p.value} ETH/h` : k === "memeBuyShare" ? `${p.value}%` : k === "launches" ? `${p.value}/h` : pct(p.value, 2);
}

async function score() {
  const s = await get("/api/state");
  head("market score");
  if (s.score == null) { out("  The first score lands a few minutes after the server starts."); return out(); }
  out();
  out(`  ${bold(gold(s.score.toFixed(1)))}${dim("/10")}   ${zoneCol(s.zone.key)(s.zone.label.toUpperCase())}   ${dim("updated " + ago(s.scoreAt))}`);
  out();
  out(meter(s.score));
  out();
  out("  " + (s.why || `${s.zone.label}: ${s.zone.act}.`));
  out();
  out(dim("  READING            VALUE           HEAT        WEIGHT"));
  for (const [k, p] of Object.entries(s.parts || {})) {
    const h = Math.round((p.heat || 0) * 10), heat = "▮".repeat(h) + dim("▯".repeat(10 - h));
    out(`  ${pad(PART[k] || k, 19)}${pad(partVal(k, p), 16)}${p.heat > 0.6 ? wild(heat) : p.heat < 0.4 ? safe(heat) : heat}  ${dim(Math.round(s.weights[k] * 100) + "%")}`);
  }
  out();
}

async function record() {
  const s = await get("/api/state"), H = s.house || {};
  head("the record");
  out(dim(`  Four paper books of ${(s.start || 1000).toLocaleString()} USDG${s.houseStarted ? ", opened " + new Date(s.houseStarted).toLocaleDateString() : ""}. Live quotes, all fees in.`));
  out();
  out(dim("  BOOK              RETURN      EQUITY      RULE"));
  for (const [k, b] of Object.entries(H)) out(`  ${pad(k === "barbell" ? gold(b.name) : b.name, 18)}${pad(signed(b.ret, pct(b.ret)), 12)}${pad(usd(b.equity), 12)}${dim(b.note)}`);
  const t = H.barbell?.trades || [];
  if (t.length) {
    out();
    out(dim(`  WHAT ${(H.barbell.name || "").toUpperCase()} DID`));
    for (const x of t.slice(0, 8)) out(`  ${pad(dim(ago(x.t)), 10)}${pad(x.side === "buy" ? ok(x.side) : x.side === "sell" ? bad(x.side) : dim(x.side), 7)}${pad(usd(x.usd), 12)}${x.what}  ${dim(x.why)}`);
  }
  out();
}

async function picks() {
  const s = await get("/api/state");
  head("memes it may buy now");
  out(dim("  Busiest Pons tokens of the last 24 h, older than 6 h, still on their curve, rug risk under 30."));
  out();
  if (!s.picks?.length) out("  No memecoin passes the scan right now.");
  else {
    out(dim("  TOKEN           24H VOLUME    RUG RISK   CA"));
    for (const p of s.picks) out(`  ${pad(gold("$" + p.symbol), 16)}${pad(p.volEth + " ETH", 14)}${pad(p.risk + "/100", 11)}${dim(p.token)}`);
  }
  out(dim(`\n  scanned ${ago(s.picksAt)}`));
  out();
}

async function bar(address, target) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || "")) throw new Error("Usage: thrive garden <0x wallet address> [--target 20]");
  const q = `/api/look?address=${address}` + (target != null ? `&target=${target}` : "");
  if (tty) process.stdout.write(dim("  reading the wallet from the chain…") + "\r");
  const [v, s] = await Promise.all([get(q), get("/api/state")]);
  if (tty) process.stdout.write(" ".repeat(40) + "\r");
  const h = v.holdings, total = h.safeUsd + h.memeUsd, share = total ? h.memeUsd / total : 0, tgt = v.policy.target;
  head(`bar of ${address.slice(0, 6)}…${address.slice(-4)}`);
  out();
  out(`  ${bold(usd(total))} ${dim("on the bar")}   ${dim("score")} ${s.score?.toFixed(1) ?? "–"} ${zoneCol(s.zone?.key)(s.zone?.label || "")}`);
  out();
  const w = 46, cut = Math.round((1 - share) * w), tm = Math.round((1 - tgt) * w);
  let line = ""; for (let k = 0; k < w; k++) line += k === tm ? gold("┃") : !total ? dim("─") : k < cut ? safe("█") : wild("█");
  out("  " + line);
  out(`  ${safe(total ? `safe ${((1 - share) * 100).toFixed(1)}%` : "safe –")}${" ".repeat(8)}${dim(`target ${Math.round(tgt * 100)}% meme`)}${" ".repeat(8)}${wild(`meme ${(share * 100).toFixed(1)}%`)}`);
  out();
  out(safe("  SAFE SIDE"));
  if (!h.safe.length) out(dim("  no stock tokens or USDG"));
  for (const x of h.safe) out(`  ${pad(x.sym, 10)}${pad(x.amount.toLocaleString("en-US", { maximumFractionDigits: 4 }), 16, true)}${pad(usd(x.usd), 14, true)}`);
  out(wild("\n  MEME SIDE"));
  if (!h.meme.length) out(dim("  no Pons memecoin traded in the last week"));
  for (const x of h.meme) out(`  ${pad("$" + x.symbol, 26)}${pad(usd(x.usd), 14, true)}`);
  out(dim(`\n  ETH for gas: ${h.eth.amount.toFixed(5)} (${usd(h.eth.usd)})`));
  out();
  const p = v.plan;
  const title = p.action === "trim" ? `Harvest ${usd(p.usd)} of bloom profit into the roots` : p.action === "topup" ? `Plant ${usd(p.usd)} of blooms with root money` : "Hold. The bar is where it should be.";
  out(`  ${gold("THE PLAN")}  ${bold(title)}`);
  out("  " + dim(p.reason));
  p.steps.forEach((t, i) => out(`  ${gold(String(i + 1))}  ${t}`));
  if (p.steps.length) out(`\n  Sign these steps with your wallet at ${gold(SERVER + "/app#bar")}`);
  out();
}

function help() {
  out();
  out(`  ${gold("✦")} ${bold("THRIVE")} ${dim("v" + VERSION + " · roots steady, blooms run")}`);
  out();
  out(`  ${bold("thrive")}                    the live score, its six readings and the note`);
  out(`  ${bold("thrive record")}             the four house books and what Thrive did`);
  out(`  ${bold("thrive picks")}              memes that pass the rug scan right now`);
  out(`  ${bold("thrive garden")} ${dim("<0x…>")}       roots, blooms and the plan for a wallet`);
  out(`  ${bold("thrive watch")}              the score, refreshed every minute`);
  out();
  out(dim("  Read-only. No keys, no signing: trades are signed in the web terminal."));
  out(dim(`  Server: ${SERVER} (override with THRIVE_URL)`));
  out();
}

async function watch() {
  const tick = async () => { if (tty) process.stdout.write("\x1b[2J\x1b[H"); try { await score(); } catch (e) { out(bad("  " + e.message)); } out(dim("  refreshing every minute · ctrl+c to stop")); };
  await tick(); setInterval(tick, 60_000);
}

const [cmd = "score", ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf("--" + n); return i < 0 ? null : rest[i + 1]; };
const run = { score, record, picks, watch, bar: () => bar(rest[0], flag("target")), garden: () => bar(rest[0], flag("target")), help, "--help": help, "-h": help, "--version": () => out(VERSION), "-v": () => out(VERSION) }[cmd];
if (!run) { out(bad(`  Unknown command: ${cmd}`)); help(); process.exit(1); }
Promise.resolve().then(run).catch((e) => { out(bad("\n  " + e.message + "\n")); process.exit(1); });
