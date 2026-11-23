/* Sprachpfad – Lern-App (Vanilla JS, keine Build-Tools) */
(() => {
"use strict";

const STORE_KEY = "sprachpfad-v1";
const DAY = 86400000;
const NEW_PER_LESSON = 4;
const REVIEW_PER_LESSON = 4;
const REVIEW_SESSION = 12;

// ---------- Zustand ----------
const defaultState = () => ({
  lang: "es",
  settings: { apiKey: "", rate: 0.9, speak: true, autoplay: true, model: "claude-opus-5-5" },
  progress: {},
  streak: { count: 0, last: null },
});
let S = load();
function load() {
  try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); }
  catch { return defaultState(); }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
function prog(lang = S.lang) {
  if (!S.progress[lang]) S.progress[lang] = { items: {}, xp: 0, history: {}, answers: 0, correct: 0 };
  return S.progress[lang];
}
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Inhalte ----------
function itemsFor(lang) {
  const L = LANGS[lang];
  const out = [];
  CONTENT.forEach((u, ui) => u.items.forEach((row, ii) => {
    out.push({ id: `${ui}-${ii}`, unit: ui, de: row[0].replace("{L}", L.name), t: row[L.col] });
  }));
  return out;
}
let ITEMS = itemsFor(S.lang);
const byId = id => ITEMS.find(i => i.id === id);

// ---------- Spaced Repetition (SM-2-Variante) ----------
function srs(id) { return prog().items[id]; }
function grade(id, q) {
  const p = prog();
  const s = p.items[id] || { reps: 0, ease: 2.5, interval: 0, due: 0, lapses: 0 };
  if (q < 3) {
    s.reps = 0; s.interval = 0; s.lapses++;
    s.due = Date.now() + 10 * 60000;
  } else {
    s.reps++;
    s.interval = s.reps === 1 ? 1 : s.reps === 2 ? 3 : Math.round(s.interval * s.ease);
    s.ease = Math.max(1.3, s.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    s.due = Date.now() + s.interval * DAY;
  }
  p.items[id] = s;
}
const strength = s => !s ? 0 : Math.min(1, (s.interval || 0.15) / 21);
const isDue = s => s && s.due <= Date.now();
function dueItems() { return ITEMS.filter(i => isDue(srs(i.id))); }
function unitStats(ui) {
  const its = ITEMS.filter(i => i.unit === ui);
  const seen = its.filter(i => srs(i.id));
  const str = its.reduce((a, i) => a + strength(srs(i.id)), 0) / its.length;
  return { total: its.length, seen: seen.length, strength: str, due: seen.filter(i => isDue(srs(i.id))).length };
}
const unitUnlocked = ui => ui === 0 || unitStats(ui - 1).seen === unitStats(ui - 1).total;

// ---------- Textvergleich ----------
function norm(str, lang = S.lang) {
  let s = str.toLocaleLowerCase(lang === "tr" ? "tr" : undefined)
    .replace(/[đĐ]/g, "d").replace(/ı/g, "i").replace(/ß/g, "ss")
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/['’`´]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
  const nums = NUMBERS[lang];
  if (nums) s = s.replace(/\b(\d+)\b/g, (m, d) => (+d <= 10 ? norm(nums[+d], lang) : m));
  return s;
}
function exactNorm(str) { // behält Akzente
  return str.toLowerCase().replace(/['’`´]/g, " ").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().normalize("NFC");
}
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function similarity(a, b) {
  a = norm(a); b = norm(b);
  if (!a && !b) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}
function wordDiff(target, heard) {
  const h = new Set(norm(heard).split(" "));
  return target.split(/\s+/).map(w => {
    const ok = h.has(norm(w)) || [...h].some(x => x && similarity(x, w) >= 0.75);
    return `<span class="${ok ? "w-ok" : "w-miss"}">${esc(w)}</span>`;
  }).join(" ");
}

// ---------- Sprachausgabe ----------
let voices = [];
function loadVoices() { voices = speechSynthesis ? speechSynthesis.getVoices() : []; }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice(lang) {
  for (const code of LANGS[lang].tts) {
    const c = code.toLowerCase();
    const v = voices.find(v => v.lang.toLowerCase().replace("_", "-") === c) ||
              voices.find(v => v.lang.toLowerCase().startsWith(c.split("-")[0]) && c.length === 2);
    if (v) return v;
  }
  return null;
}
let lastUtter = null; // Referenz halten, sonst verwirft Safari die Ausgabe manchmal
let ttsUnlocked = false;
function unlockTTS() { // iOS: Sprachausgabe muss einmal direkt durch eine Berührung gestartet werden
  if (ttsUnlocked || !("speechSynthesis" in window)) return;
  ttsUnlocked = true;
  const u = new SpeechSynthesisUtterance(" "); u.volume = 0;
  speechSynthesis.speak(u);
  loadVoices();
}
document.addEventListener("touchend", unlockTTS, { passive: true });
document.addEventListener("click", unlockTTS);
function speak(text, opts = {}) {
  if (!("speechSynthesis" in window)) { toast("Dieser Browser kann nicht vorlesen."); return; }
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  speechSynthesis.resume();
  if (!voices.length) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(S.lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = LANGS[S.lang].tts[0];
  u.rate = (opts.slow ? 0.6 : 1) * S.settings.rate;
  u.volume = 1;
  u.onerror = e => { if (e.error !== "interrupted" && e.error !== "canceled") toast("Vorlesen fehlgeschlagen: " + e.error); };
  lastUtter = u;
  speechSynthesis.speak(u);
}
function voiceInfo() {
  const v = pickVoice(S.lang);
  if (!v) return `⚠️ Keine ${LANGS[S.lang].name}-Stimme gefunden (${voices.length} Stimmen insgesamt auf dem Gerät).`;
  const exact = v.lang.toLowerCase().startsWith(S.lang);
  return exact ? `Stimme: ${v.name}` : `Stimme: ${v.name} (${v.lang}, Ersatz – sehr ähnlich)`;
}

// ---------- Spracherkennung ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(onResult, onState) {
  if (!SR) { onResult(null, "Spracherkennung wird von diesem Browser nicht unterstützt (Chrome oder Safari nutzen)."); return () => {}; }
  const codes = LANGS[S.lang].stt.slice();
  let rec, stopped = false;
  const start = () => {
    rec = new SR();
    rec.lang = codes[0];
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onstart = () => onState && onState(true);
    rec.onend = () => onState && onState(false);
    rec.onerror = e => {
      if ((e.error === "language-not-supported" || e.error === "bad-grammar") && codes.length > 1) { codes.shift(); start(); return; }
      if (e.error === "no-speech") onResult(null, "Nichts gehört – bitte nochmal.");
      else if (e.error === "not-allowed") onResult(null, "Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.");
      else if (e.error !== "aborted") onResult(null, "Fehler bei der Spracherkennung: " + e.error);
    };
    rec.onresult = e => {
      const alts = [...e.results[0]].map(a => a.transcript);
      onResult(alts);
    };
    try { rec.start(); } catch (err) { onResult(null, String(err)); }
  };
  start();
  return () => { stopped = true; try { rec.stop(); } catch {} };
}

// ---------- Helfer ----------
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const tiles = t => t.split(/\s+/).map(w => w.replace(/^[¿¡]+|[,.!?]+$/g, "")).filter(Boolean);
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2500);
}
function addXP(n) {
  const p = prog(); p.xp += n; p.history[today()] = (p.history[today()] || 0) + n;
}
function bumpStreak() {
  const t = today(); const y = new Date(Date.now() - DAY).toISOString().slice(0, 10);
  if (S.streak.last === t) return;
  S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1;
  S.streak.last = t;
}

// ---------- Navigation ----------
let view = "path";
function go(v) { view = v; stopAll(); render(); window.scrollTo(0, 0); }
function stopAll() { if (window.speechSynthesis) speechSynthesis.cancel(); if (stopRec) { stopRec(); stopRec = null; } }
let stopRec = null;

function render() {
  const L = LANGS[S.lang];
  const streakAlive = S.streak.last === today() || S.streak.last === new Date(Date.now() - DAY).toISOString().slice(0, 10);
  $("#top").innerHTML = `
    <button class="lang-btn" data-act="langmenu">${L.flag} ${L.name} ▾</button>
    <div class="top-stats"><span title="Serie">🔥 ${streakAlive ? S.streak.count : 0}</span><span title="XP">⭐ ${prog().xp}</span></div>`;
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.go === view));
  $("nav").style.display = view === "lesson" ? "none" : "";
  const fn = { path: viewPath, review: viewReview, chat: viewChat, stats: viewStats, settings: viewSettings, lesson: viewLesson }[view];
  fn();
}

// ---------- Ansicht: Lernpfad ----------
function viewPath() {
  const due = dueItems().length;
  $("#main").innerHTML = `
    ${due ? `<div class="banner" data-act="startReview">🔁 ${due} Ausdrücke sind fällig zur Wiederholung <b>→</b></div>` : ""}
    <div class="path">
    ${CONTENT.map((u, ui) => {
      const st = unitStats(ui), open = unitUnlocked(ui);
      const pct = Math.round(st.strength * 100);
      return `<div class="unit ${open ? "" : "locked"}">
        <div class="unit-icon" style="--p:${pct}">${open ? u.icon : "🔒"}</div>
        <div class="unit-body">
          <h3>${ui + 1}. ${u.title}</h3>
          <div class="muted">${st.seen}/${st.total} gelernt · Stärke ${pct}%${st.due ? ` · ${st.due} fällig` : ""}</div>
          <div class="bar"><i style="width:${st.seen / st.total * 100}%"></i></div>
        </div>
        ${open ? `<button class="btn small" data-act="startUnit" data-u="${ui}">${st.seen < st.total ? (st.seen ? "Weiter" : "Start") : "Üben"}</button>` : ""}
      </div>`;
    }).join("")}
    </div>`;
}

// ---------- Ansicht: Wiederholen ----------
function viewReview() {
  const due = dueItems();
  const seen = ITEMS.filter(i => srs(i.id));
  $("#main").innerHTML = `
    <div class="card center">
      <div class="big-num">${due.length}</div>
      <div>Ausdrücke fällig</div>
      <p class="muted">Spaced Repetition: Was du gut kannst, kommt seltener. Was du falsch machst, kommt schnell wieder.</p>
      ${due.length ? `<button class="btn" data-act="startReview">Wiederholung starten</button>`
        : seen.length ? `<button class="btn ghost" data-act="startWeak">Schwächste ${Math.min(REVIEW_SESSION, seen.length)} üben</button>`
        : `<p>Starte zuerst eine Lektion im Lernpfad.</p>`}
    </div>
    ${seen.length ? `<h3>Deine Ausdrücke</h3><div class="list">${seen
      .sort((a, b) => strength(srs(a.id)) - strength(srs(b.id)))
      .map(i => { const s = srs(i.id); return `<div class="row" data-act="say" data-t="${esc(i.t)}">
        <div><b>${esc(i.t)}</b><div class="muted">${esc(i.de)}</div></div>
        <div class="pill" style="--p:${Math.round(strength(s) * 100)}">${isDue(s) ? "fällig" : relDays(s.due)}</div></div>`; }).join("")}</div>` : ""}`;
}
function relDays(ts) {
  const d = Math.round((ts - Date.now()) / DAY);
  if (d <= 0) return "heute"; if (d === 1) return "morgen"; return `in ${d} T.`;
}

// ---------- Lektion / Übungen ----------
let L = null; // aktuelle Lektion
function startLesson(items, newIds, title) {
  const queue = [];
  const fresh = items.filter(i => newIds.has(i.id));
  const old = items.filter(i => !newIds.has(i.id));
  fresh.forEach(i => queue.push({ type: "intro", item: i }));
  fresh.forEach(i => queue.push({ type: "mc_t2d", item: i }));
  shuffle(fresh).forEach(i => queue.push({ type: Math.random() < .5 ? "listen" : "mc_d2t", item: i }));
  shuffle(fresh).forEach(i => queue.push({ type: tiles(i.t).length >= 3 ? "build" : "type", item: i }));
  if (S.settings.speak && SR) shuffle(fresh).forEach(i => queue.push({ type: "speak", item: i }));
  old.forEach(i => queue.push({ type: hardType(i), item: i }));
  // Wiederholungen etwas einmischen
  L = { title, queue: interleave(queue, fresh.length), pos: 0, wrong: new Set(), retried: new Set(), correct: 0, total: 0, items };
  view = "lesson"; render();
}
function interleave(q, nFresh) {
  if (!nFresh) return shuffle(q);
  const intro = q.filter(e => e.type === "intro" || e.type === "mc_t2d");
  const rest = q.filter(e => !(e.type === "intro" || e.type === "mc_t2d"));
  // intro/mc paarweise: intro A, mc A, intro B, mc B …
  const pairs = [];
  const intros = intro.filter(e => e.type === "intro"), mcs = intro.filter(e => e.type === "mc_t2d");
  intros.forEach((e, k) => { pairs.push(e); pairs.push(mcs[k]); });
  return pairs.concat(rest);
}
function hardType(i) {
  const opts = ["mc_d2t", "listen", "type"];
  if (tiles(i.t).length >= 3) opts.push("build", "build");
  if (S.settings.speak && SR) opts.push("speak", "speak");
  return pick(opts);
}
function startUnit(ui) {
  const its = ITEMS.filter(i => i.unit === ui);
  const unseen = its.filter(i => !srs(i.id)).slice(0, NEW_PER_LESSON);
  let review = its.filter(i => srs(i.id)).sort((a, b) => (srs(a.id).due - srs(b.id).due)).slice(0, unseen.length ? REVIEW_PER_LESSON : 8);
  startLesson(unseen.concat(review), new Set(unseen.map(i => i.id)), CONTENT[ui].title);
}
function startReview(weak) {
  let its = weak
    ? ITEMS.filter(i => srs(i.id)).sort((a, b) => strength(srs(a.id)) - strength(srs(b.id))).slice(0, REVIEW_SESSION)
    : shuffle(dueItems()).slice(0, REVIEW_SESSION);
  startLesson(its, new Set(), weak ? "Schwächen üben" : "Wiederholung");
}

function optionsFor(item, field) {
  const pool = ITEMS.filter(i => i.id !== item.id && i[field] !== item[field]);
  const same = shuffle(pool.filter(i => i.unit === item.unit));
  const other = shuffle(pool.filter(i => i.unit !== item.unit));
  const picks = [];
  for (const i of same.concat(other)) { if (!picks.includes(i[field])) picks.push(i[field]); if (picks.length === 3) break; }
  return shuffle([item[field], ...picks]);
}

function viewLesson() {
  if (L.pos >= L.queue.length) return finishLesson();
  const ex = L.queue[L.pos], it = ex.item;
  const pct = L.pos / L.queue.length * 100;
  let body = "";
  const sayBtn = (t, cls = "") => `<button class="icon-btn ${cls}" data-act="say" data-t="${esc(t)}" title="Anhören">🔊</button><button class="icon-btn" data-act="sayslow" data-t="${esc(t)}" title="Langsam">🐢</button>`;
  switch (ex.type) {
    case "intro":
      body = `<div class="ex-label">Neuer Ausdruck</div>
        <div class="card center intro"><div class="target">${esc(it.t)}</div><div class="muted big">${esc(it.de)}</div>
        <div class="row-btns">${sayBtn(it.t)}</div></div>
        <button class="btn" data-act="next">Weiter</button>`;
      break;
    case "mc_t2d":
      body = `<div class="ex-label">Was bedeutet das?</div>
        <div class="card center"><div class="target">${esc(it.t)}</div><div class="row-btns">${sayBtn(it.t)}</div></div>
        <div class="opts">${optionsFor(it, "de").map(o => `<button class="opt" data-act="choose" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      break;
    case "mc_d2t":
      body = `<div class="ex-label">Wie sagt man …?</div>
        <div class="card center"><div class="target de">${esc(it.de)}</div></div>
        <div class="opts">${optionsFor(it, "t").map(o => `<button class="opt" data-act="choose" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      break;
    case "listen":
      body = `<div class="ex-label">Was hörst du?</div>
        <div class="card center"><div class="row-btns">${sayBtn(it.t, "huge")}</div></div>
        <div class="opts">${optionsFor(it, "t").map(o => `<button class="opt" data-act="choose" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      break;
    case "build": {
      const extra = shuffle(ITEMS.filter(i => i.unit === it.unit && i.id !== it.id).flatMap(i => tiles(i.t)))
        .filter(w => !tiles(it.t).map(norm).includes(norm(w))).slice(0, 2);
      ex.bank = ex.bank || shuffle(tiles(it.t).concat(extra)).map((w, k) => ({ w, k, used: false }));
      ex.answer = ex.answer || [];
      body = `<div class="ex-label">Bilde den Satz</div>
        <div class="card center"><div class="target de">${esc(it.de)}</div></div>
        <div class="answer-line">${ex.answer.map(k => `<button class="tile" data-act="untile" data-k="${k}">${esc(ex.bank[k].w)}</button>`).join("") || '<span class="muted">Tippe die Wörter an</span>'}</div>
        <div class="bank">${ex.bank.map(b => `<button class="tile ${b.used ? "used" : ""}" data-act="tile" data-k="${b.k}" ${b.used ? "disabled" : ""}>${esc(b.w)}</button>`).join("")}</div>
        <button class="btn" data-act="checkBuild" ${ex.answer.length ? "" : "disabled"}>Prüfen</button>`;
      break;
    }
    case "type":
      body = `<div class="ex-label">Schreibe auf ${LANGS[S.lang].name}</div>
        <div class="card center"><div class="target de">${esc(it.de)}</div></div>
        <input id="typeIn" class="input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Deine Antwort …">
        <div class="special">${specialChars().map(c => `<button class="tile small" data-act="char" data-c="${c}">${c}</button>`).join("")}</div>
        <button class="btn" data-act="checkType">Prüfen</button>`;
      break;
    case "speak":
      body = `<div class="ex-label">Sprich nach</div>
        <div class="card center"><div class="target">${esc(it.t)}</div><div class="muted">${esc(it.de)}</div><div class="row-btns">${sayBtn(it.t)}</div></div>
        <div id="speakFb" class="center muted">Tippe aufs Mikrofon und sprich den Satz.</div>
        <button class="mic" data-act="mic">🎤</button>
        <button class="btn ghost" data-act="skipSpeak">Kann gerade nicht sprechen</button>`;
      break;
  }
  $("#main").innerHTML = `
    <div class="lesson-top"><button class="icon-btn" data-act="quit">✕</button><div class="bar grow"><i style="width:${pct}%"></i></div></div>
    <div class="ex">${body}</div><div id="feedback"></div>`;
  if (S.settings.autoplay && ["intro", "mc_t2d", "listen", "speak"].includes(ex.type) && !ex.played) { ex.played = true; setTimeout(() => speak(it.t), 250); }
  if (ex.type === "type") { const inp = $("#typeIn"); inp.focus(); inp.addEventListener("keydown", e => { if (e.key === "Enter") act("checkType"); }); }
}
function specialChars() {
  return { es: ["á","é","í","ó","ú","ñ","¿","¡"], it: ["à","è","é","ì","ò","ù"], hr: ["č","ć","đ","š","ž"], bs: ["č","ć","đ","š","ž"], tr: ["ç","ğ","ı","İ","ö","ş","ü"] }[S.lang];
}

function answer(ok, extraHtml = "") {
  const ex = L.queue[L.pos], it = ex.item;
  L.total++; prog().answers++;
  if (ok) { L.correct++; prog().correct++; addXP(10); }
  else {
    L.wrong.add(it.id);
    const key = it.id + ex.type;
    if (!L.retried.has(key)) { L.retried.add(key); L.queue.push({ type: ex.type, item: it }); }
  }
  document.querySelectorAll(".ex button, .ex input").forEach(b => { if (!b.classList.contains("icon-btn")) b.disabled = true; });
  $("#feedback").innerHTML = `<div class="fb ${ok ? "ok" : "bad"}">
      <div><b>${ok ? pick(["Richtig!", "Super!", "Genau!", "Stark!"]) : "Nicht ganz."}</b>
      ${extraHtml}
      ${!ok || ex.type !== "intro" ? `<div class="sol">${esc(it.t)} <span class="muted">– ${esc(it.de)}</span></div>` : ""}</div>
      <button class="btn" data-act="next">Weiter</button></div>`;
  if (!ok || ex.type === "build" || ex.type === "type") speak(it.t);
  save();
  const xpEl = document.querySelector(".top-stats span:last-child"); if (xpEl) xpEl.textContent = "⭐ " + prog().xp;
}

function finishLesson() {
  const ids = new Set(L.items.map(i => i.id));
  ids.forEach(id => grade(id, L.wrong.has(id) ? 2 : 4));
  addXP(20); bumpStreak(); save();
  const acc = L.total ? Math.round(L.correct / L.total * 100) : 100;
  $("#main").innerHTML = `<div class="card center done">
      <div class="big-num">🎉</div><h2>${esc(L.title)} geschafft!</h2>
      <p>Genauigkeit: <b>${acc}%</b> · +${L.correct * 10 + 20} XP</p>
      ${L.wrong.size ? `<p class="muted">${L.wrong.size} Ausdrücke kommen bald zur Wiederholung.</p>` : ""}
      <button class="btn" data-act="home">Zurück zum Pfad</button></div>`;
}

// ---------- Ansicht: KI-Gesprächspartner ----------
let chat = null; // { scenario, history: [api messages], view: [{who, answer, correction, translation}] }
function viewChat() {
  if (!S.settings.apiKey) {
    $("#main").innerHTML = `<div class="card">
      <h2>🤖 KI-Gesprächspartner</h2>
      <p>Hier führst du echte Gespräche auf ${LANGS[S.lang].name} – per Sprache oder Text. Die KI spielt eine Rolle, korrigiert dich auf Deutsch und übersetzt.</p>
      <p>Dafür brauchst du einen eigenen <b>Anthropic-API-Schlüssel</b> (console.anthropic.com → API Keys). Die Nutzung kostet pro Nachricht ein paar Zehntel Cent.</p>
      <p class="muted">Der Schlüssel wird nur lokal in diesem Browser gespeichert und direkt an die Anthropic-API geschickt.</p>
      <button class="btn" data-go="settings">Schlüssel eintragen</button></div>`;
    return;
  }
  if (!chat) {
    $("#main").innerHTML = `<h2>Mit wem möchtest du sprechen?</h2>
      <div class="scen">${SCENARIOS.map(s => `<button class="scen-card" data-act="scenario" data-id="${s.id}"><span>${s.icon}</span>${s.title}</button>`).join("")}</div>`;
    return;
  }
  $("#main").innerHTML = `
    <div class="chat-head"><b>${chat.scenario.icon} ${chat.scenario.title}</b><button class="btn small ghost" data-act="endChat">Beenden</button></div>
    <div id="msgs" class="msgs">${chat.view.map(renderMsg).join("")}</div>
    <div class="composer">
      <button class="mic small" data-act="chatMic" title="Sprechen">🎤</button>
      <input id="chatIn" class="input" placeholder="Auf ${LANGS[S.lang].name} antworten …" autocomplete="off">
      <button class="btn small" data-act="send">➤</button>
    </div>
    <div class="special">${specialChars().map(c => `<button class="tile small" data-act="charChat" data-c="${c}">${c}</button>`).join("")}</div>`;
  const inp = $("#chatIn");
  inp.addEventListener("keydown", e => { if (e.key === "Enter") act("send"); });
  scrollMsgs();
}
function renderMsg(m, k) {
  if (m.who === "me") return `<div class="msg me">${esc(m.text)}</div>`;
  if (m.who === "err") return `<div class="msg err">${esc(m.text)}</div>`;
  return `<div class="msg ai">
    <div class="ai-text">${esc(m.answer || "…")}</div>
    ${m.answer ? `<div class="ai-tools"><button class="icon-btn" data-act="say" data-t="${esc(m.answer)}">🔊</button>
      <button class="icon-btn" data-act="sayslow" data-t="${esc(m.answer)}">🐢</button>
      ${m.translation ? `<details><summary>Übersetzung</summary>${esc(m.translation)}</details>` : ""}</div>` : ""}
    ${m.correction ? `<div class="corr">✏️ ${esc(m.correction)}</div>` : ""}
  </div>`;
}
const scrollMsgs = () => { const el = $("#msgs"); if (el) el.scrollTop = el.scrollHeight; };

function systemPrompt(sc) {
  const name = LANGS[S.lang].name;
  const extra = {
    bs: "Verwende bosnischen Standard (Ijekavica, bosnische Lexik wie hljeb, kahva/kafa, šta, historija).",
    hr: "Verwende kroatischen Standard (Ijekavica, kroatische Lexik wie kruh, kava, što, tisuća).",
    tr: "Verwende natürliches, gesprochenes Türkisch.",
    es: "Verwende europäisches Spanisch (Spanien).",
    it: "Verwende Standard-Italienisch.",
  }[S.lang];
  return `Du bist ein geduldiger Gesprächspartner für eine deutschsprachige Person, die ${name} auf Niveau A1–A2 lernt.
Rollenspiel: Du bist ${sc.role}. Bleib in der Rolle und führe das Gespräch aktiv weiter, meist mit einer einfachen Frage.
${extra}
Die Nachrichten des Lernenden stammen oft aus Spracherkennung: ignoriere fehlende Satzzeichen und Großschreibung, aber korrigiere echte Grammatik-, Wort- und Akzentfehler.

Antworte IMMER exakt in diesem Format, ohne weiteren Text:
<antwort>1–3 kurze, einfache Sätze auf ${name}.</antwort>
<korrektur>Wenn die letzte Nachricht des Lernenden Fehler hatte: die korrigierte Fassung und eine sehr kurze Erklärung auf Deutsch. Wenn sie fehlerfrei war: "Perfekt!". Wenn es noch keine Nachricht des Lernenden gab: leer lassen.</korrektur>
<uebersetzung>Deutsche Übersetzung deiner Antwort.</uebersetzung>`;
}
function parseTags(txt) {
  const get = tag => { const m = txt.match(new RegExp(`<${tag}>([\\s\\S]*?)(?:</${tag}>|$)`)); return m ? m[1].trim() : ""; };
  return { answer: get("antwort"), correction: get("korrektur"), translation: get("uebersetzung") };
}

let AnthropicMod = null;
async function client() {
  if (!AnthropicMod) AnthropicMod = (await import("./anthropic-sdk.js")).default;
  return new AnthropicMod({ apiKey: S.settings.apiKey, dangerouslyAllowBrowser: true });
}
async function sendChat(userText) {
  if (chat.busy) return;
  chat.busy = true;
  if (userText !== null) { chat.view.push({ who: "me", text: userText }); chat.history.push({ role: "user", content: userText }); }
  const aiMsg = { who: "ai", answer: "" }; chat.view.push(aiMsg);
  viewChat();
  try {
    const c = await client();
    const stream = c.beta.messages.stream({
      model: S.settings.model || "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: systemPrompt(chat.scenario),
      messages: chat.history,
    });
    let raw = "";
    stream.on("text", t => {
      raw += t; Object.assign(aiMsg, parseTags(raw));
      const nodes = document.querySelectorAll(".msg.ai .ai-text");
      if (nodes.length) nodes[nodes.length - 1].textContent = aiMsg.answer || "…";
      scrollMsgs();
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error("Die KI hat diese Anfrage abgelehnt. Formuliere bitte anders.");
    chat.history.push({ role: "assistant", content: msg.content });
    Object.assign(aiMsg, parseTags(raw));
    if (!aiMsg.answer) aiMsg.answer = raw.replace(/<[^>]+>/g, "").trim();
    viewChat();
    speak(aiMsg.answer);
  } catch (e) {
    chat.view.pop();
    if (userText !== null) chat.history.pop();
    let m = e && e.message ? e.message : String(e);
    if (e && e.status === 401) m = "API-Schlüssel ungültig. Bitte in den Einstellungen prüfen.";
    else if (e && e.status === 429) m = "Zu viele Anfragen – kurz warten und nochmal versuchen.";
    chat.view.push({ who: "err", text: "⚠️ " + m });
    viewChat();
  } finally { chat.busy = false; }
}

// ---------- Ansicht: Statistik ----------
function viewStats() {
  const p = prog();
  const seen = ITEMS.filter(i => srs(i.id));
  const mature = seen.filter(i => srs(i.id).interval >= 21).length;
  const acc = p.answers ? Math.round(p.correct / p.answers * 100) : 0;
  const days = [...Array(7)].map((_, k) => { const d = new Date(Date.now() - (6 - k) * DAY); return { d, xp: p.history[d.toISOString().slice(0, 10)] || 0 }; });
  const max = Math.max(50, ...days.map(d => d.xp));
  // Prognose: fällige Wiederholungen der nächsten 7 Tage
  const fc = [...Array(7)].map((_, k) => seen.filter(i => { const due = srs(i.id).due; const start = k === 0 ? 0 : Date.now() + k * DAY - DAY / 2; return due >= start && due < Date.now() + (k + 1) * DAY - DAY / 2; }).length);
  $("#main").innerHTML = `
    <div class="tiles4">
      <div class="stat"><div class="v">${seen.length}<small>/${ITEMS.length}</small></div><div class="l">gelernt</div></div>
      <div class="stat"><div class="v">${mature}</div><div class="l">gefestigt (≥ 21 T.)</div></div>
      <div class="stat"><div class="v">${acc}%</div><div class="l">Trefferquote</div></div>
      <div class="stat"><div class="v">${S.streak.count}</div><div class="l">Tage-Serie</div></div>
    </div>
    <div class="card"><h3>XP letzte 7 Tage</h3>
      <div class="bars">${days.map(d => `<div class="b"><span class="bv">${d.xp || ""}</span><i style="height:${d.xp / max * 100}%"></i><span>${d.d.toLocaleDateString("de-DE", { weekday: "short" })}</span></div>`).join("")}</div></div>
    <div class="card"><h3>Anstehende Wiederholungen</h3>
      <div class="bars">${fc.map((n, k) => `<div class="b"><span class="bv">${n || ""}</span><i class="alt" style="height:${n / Math.max(5, ...fc) * 100}%"></i><span>${k === 0 ? "heute" : new Date(Date.now() + k * DAY).toLocaleDateString("de-DE", { weekday: "short" })}</span></div>`).join("")}</div></div>
    <div class="card"><h3>Alle Sprachen</h3>${Object.keys(LANGS).map(l => {
      const pp = S.progress[l]; const n = pp ? Object.keys(pp.items).length : 0;
      return `<div class="row"><span>${LANGS[l].flag} ${LANGS[l].name}</span><span class="muted">${n} Ausdrücke · ${pp ? pp.xp : 0} XP</span></div>`; }).join("")}</div>`;
}

// ---------- Ansicht: Einstellungen ----------
function viewSettings() {
  const st = S.settings;
  $("#main").innerHTML = `<div class="card">
    <h3>Aussprache & Audio</h3>
    <label class="field">Sprechtempo <input type="range" min="0.6" max="1.2" step="0.05" value="${st.rate}" data-set="rate"></label>
    <label class="check"><input type="checkbox" ${st.autoplay ? "checked" : ""} data-set="autoplay"> Audio automatisch abspielen</label>
    <label class="check"><input type="checkbox" ${st.speak ? "checked" : ""} data-set="speak"> Sprechübungen (Mikrofon)</label>
    <p class="muted">${voiceInfo()}<br>${SR ? "Spracherkennung verfügbar ✓" : "⚠️ Spracherkennung nicht verfügbar – nutze Chrome (Android/Desktop) oder Safari (iOS)."}</p>
    <button class="btn ghost small" data-act="say" data-t="${esc(ITEMS[0].t)}">Stimme testen</button>
  </div>
  <div class="card">
    <h3>KI-Gesprächspartner</h3>
    <label class="field">Anthropic-API-Schlüssel <input class="input" type="password" value="${esc(st.apiKey)}" data-set="apiKey" placeholder="sk-ant-…"></label>
    <label class="field">Modell <select class="input" data-set="model">
      ${[["claude-opus-5-5", "Claude Opus 5.5 (beste Qualität)"], ["claude-sonnet-5-5", "Claude Sonnet 5.5 (günstiger)"], ["claude-haiku-5-5", "Claude Haiku 5.5 (am günstigsten, schnell)"]]
        .map(([v, n]) => `<option value="${v}" ${st.model === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <p class="muted">Wird nur lokal gespeichert. Gib die App mit eingetragenem Schlüssel nicht an andere weiter.</p>
  </div>
  <div class="card">
    <h3>Daten</h3>
    <div class="row-btns left"><button class="btn ghost small" data-act="export">Fortschritt exportieren</button>
    <label class="btn ghost small">Importieren<input type="file" accept="application/json" id="importFile" hidden></label>
    <button class="btn danger small" data-act="reset">${LANGS[S.lang].name}-Fortschritt löschen</button></div>
  </div>`;
  $("#importFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { const d = JSON.parse(t); const key = S.settings.apiKey; S = Object.assign(defaultState(), d); S.settings.apiKey = key; save(); ITEMS = itemsFor(S.lang); toast("Importiert ✓"); render(); })
      .catch(() => toast("Datei ungültig"));
  });
}

// ---------- Aktionen ----------
function act(a, el) {
  const d = el ? el.dataset : {};
  const ex = L && L.queue[L.pos];
  switch (a) {
    case "langmenu": {
      $("#modal").innerHTML = `<div class="sheet"><h3>Sprache wählen</h3>${Object.entries(LANGS).map(([k, v]) =>
        `<button class="lang-opt ${k === S.lang ? "active" : ""}" data-act="setLang" data-l="${k}">${v.flag} ${v.name}<span class="muted">${S.progress[k] ? Object.keys(S.progress[k].items).length + " gelernt" : ""}</span></button>`).join("")}</div>`;
      $("#modal").classList.add("open"); break;
    }
    case "setLang": S.lang = d.l; ITEMS = itemsFor(S.lang); chat = null; save(); $("#modal").classList.remove("open"); go("path"); break;
    case "say": speak(d.t); break;
    case "sayslow": speak(d.t, { slow: true }); break;
    case "startUnit": startUnit(+d.u); break;
    case "startReview": startReview(false); break;
    case "startWeak": startReview(true); break;
    case "quit": if (confirm("Lektion abbrechen? Der Fortschritt dieser Lektion geht verloren.")) go("path"); break;
    case "home": go("path"); break;
    case "next": if (ex.type === "intro") { /* zählt nicht als Antwort */ } L.pos++; stopAll(); viewLesson(); break;
    case "choose": {
      const ok = d.v === (ex.type === "mc_t2d" ? ex.item.de : ex.item.t);
      document.querySelectorAll(".opt").forEach(b => {
        if (b.dataset.v === (ex.type === "mc_t2d" ? ex.item.de : ex.item.t)) b.classList.add("right");
        else if (b === el) b.classList.add("wrong");
      });
      answer(ok); break;
    }
    case "tile": ex.bank[+d.k].used = true; ex.answer.push(+d.k); viewLesson(); break;
    case "untile": ex.bank[+d.k].used = false; ex.answer = ex.answer.filter(k => k !== +d.k); viewLesson(); break;
    case "checkBuild": {
      const s = ex.answer.map(k => ex.bank[k].w).join(" ");
      answer(norm(s) === norm(ex.item.t)); break;
    }
    case "char": { const i = $("#typeIn"); i.value += d.c; i.focus(); break; }
    case "charChat": { const i = $("#chatIn"); i.value += d.c; i.focus(); break; }
    case "checkType": {
      const v = $("#typeIn").value.trim(); if (!v) return;
      if (exactNorm(v) === exactNorm(ex.item.t)) answer(true);
      else if (norm(v) === norm(ex.item.t)) answer(true, `<div class="muted">Achte auf die Sonderzeichen/Akzente.</div>`);
      else if (similarity(v, ex.item.t) >= 0.9) answer(true, `<div class="muted">Kleiner Tippfehler – fast perfekt.</div>`);
      else answer(false, `<div class="muted">Deine Antwort: ${esc(v)}</div>`);
      break;
    }
    case "mic": {
      if (stopRec) { stopRec(); stopRec = null; return; }
      const fb = $("#speakFb");
      stopRec = listen((alts, err) => {
        stopRec = null;
        if (!alts) { fb.textContent = err; return; }
        const best = alts.map(a => ({ a, s: similarity(a, ex.item.t) })).sort((x, y) => y.s - x.s)[0];
        const pct = Math.round(best.s * 100);
        ex.tries = (ex.tries || 0) + 1;
        if (best.s >= 0.8) answer(true, `<div>Aussprache: <b>${pct}%</b></div><div class="heard">${wordDiff(ex.item.t, best.a)}</div>`);
        else if (ex.tries < 3) fb.innerHTML = `Verstanden: „${esc(best.a)}“ (${pct}%)<div class="heard">${wordDiff(ex.item.t, best.a)}</div>Nochmal versuchen (${3 - ex.tries} übrig).`;
        else answer(false, `<div>Verstanden: „${esc(best.a)}“ (${pct}%)</div>`);
      }, on => { const m = $(".mic"); if (m) m.classList.toggle("rec", on); if (on) fb.textContent = "Ich höre zu …"; });
      break;
    }
    case "skipSpeak": L.pos++; viewLesson(); break;
    case "scenario": {
      const sc = SCENARIOS.find(s => s.id === d.id);
      chat = { scenario: sc, history: [{ role: "user", content: "(Beginne das Gespräch in deiner Rolle.)" }], view: [] };
      sendChat(null); break;
    }
    case "endChat": chat = null; stopAll(); viewChat(); break;
    case "send": { const i = $("#chatIn"); const v = i.value.trim(); if (v && !chat.busy) { i.value = ""; sendChat(v); } break; }
    case "chatMic": {
      if (stopRec) { stopRec(); stopRec = null; return; }
      speechSynthesis && speechSynthesis.cancel();
      stopRec = listen((alts, err) => {
        stopRec = null;
        if (!alts) { toast(err); return; }
        $("#chatIn").value = alts[0]; sendChat(alts[0]); $("#chatIn").value = "";
      }, on => { const m = $(".composer .mic"); if (m) m.classList.toggle("rec", on); });
      break;
    }
    case "export": {
      const data = JSON.parse(JSON.stringify(S)); data.settings.apiKey = "";
      const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
      a2.download = `sprachpfad-${today()}.json`; a2.click(); break;
    }
    case "reset": if (confirm(`Gesamten ${LANGS[S.lang].name}-Fortschritt löschen?`)) { delete S.progress[S.lang]; save(); toast("Gelöscht"); render(); } break;
  }
}

document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) { go(g.dataset.go); return; }
  const el = e.target.closest("[data-act]"); if (el && !el.disabled) act(el.dataset.act, el);
  if (e.target.id === "modal") e.target.classList.remove("open");
});
document.addEventListener("change", e => {
  const k = e.target.dataset.set; if (!k) return;
  S.settings[k] = e.target.type === "checkbox" ? e.target.checked : e.target.type === "range" ? +e.target.value : e.target.value;
  save(); if (k !== "apiKey") render(); else toast("Gespeichert ✓");
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
render();
window.__app = { norm, similarity, startUnit, get state() { return S; } };
})();
