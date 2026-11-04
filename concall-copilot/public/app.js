import { startCapture, startRecorder } from "./audio.js";
import { createLocal } from "./local-stt.js";
import { createDemo, createSoniox, createWebSpeech } from "./stt.js";

const $view = document.getElementById("view");
const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    ...opts,
    headers: opts.body && !(opts.body instanceof Blob) && !(opts.body instanceof ArrayBuffer) ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
};
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clock = (ms = 0) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
const toast = (msg, ms = 3800) => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), ms);
};
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/** 아주 작은 마크다운 렌더러 (제목, 목록, 굵게, 표, 링크). */
function md(src = "") {
  const lines = esc(src).split("\n");
  const out = [];
  let list = false;
  let table = [];
  const inline = (s) =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/_(.+?)_/g, "<em>$1</em>");
  const closeList = () => { if (list) { out.push("</ul>"); list = false; } };
  const closeTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r));
    out.push("<table>" + rows.map((r, i) => {
      const cells = r.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      const tag = i === 0 ? "th" : "td";
      return "<tr>" + cells.map((c) => `<${tag}>${c}</${tag}>`).join("") + "</tr>";
    }).join("") + "</table>");
    table = [];
  };
  for (const line of lines) {
    if (/^\s*\|/.test(line)) { closeList(); table.push(line.trim()); continue; }
    closeTable();
    const h = line.match(/^(#{1,3})\s+(.*)/);
    const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); }
    else if (li) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(li[1])}</li>`); }
    else if (line.trim()) { closeList(); out.push(`<p>${inline(line)}</p>`); }
    else closeList();
  }
  closeList();
  closeTable();
  return `<div class="md">${out.join("")}</div>`;
}

let status = { llm: false, stt: { soniox: false }, kb: { docs: 0, chunks: 0, folders: [] } };
async function refreshStatus() {
  try { status = await api("/api/status"); } catch {}
  document.getElementById("status").innerHTML = `
    <span class="pill ${status.llm ? "on" : "off"}" title="${esc(status.models?.live || "")}">${status.llm ? "분석 켜짐" : "오프라인 분석"}</span>
    <span class="pill ${status.stt.local || status.stt.soniox ? "on" : "off"}">${status.stt.local ? "로컬 전사 켜짐" : status.stt.soniox ? "음성인식 Soniox" : "로컬 전사 꺼짐"}</span>
    <span class="pill">내 자료 ${status.kb.docs}건</span>`;
}

// ── live session state (페이지 새로고침 시 사라짐: 녹음/자막은 서버에 이미 저장됨) ──
let live = null;

const LANGS = [["ko", "한국어"], ["en", "영어"], ["ja", "일본어"], ["zh", "중국어"]];

// ─────────────────────────────── 새 콜 ───────────────────────────────
function viewSetup() {
  const last = store.get("lastSetup", {});
  const available = { local: status.stt.local, soniox: status.stt.soniox, browser: true, demo: true };
  const mode = available[last.mode] ? last.mode : status.stt.local ? "local" : status.stt.soniox ? "soniox" : "demo";
  $view.innerHTML = `
  <div class="page">
    <h1>새 콜</h1>
    <p class="sub">콜 정보를 적어두면 실시간 카드와 질문이 훨씬 정확해져요. 비워둬도 시작할 수 있어요.</p>
    <div class="grid-2">
      <form class="card-box" id="setup">
        <div class="field"><label for="f-title">콜 제목</label><input id="f-title" name="title" placeholder="예: OO전자 3Q 실적 콜 / 전문가 콜 — 북미 데이터센터 전력" /></div>
        <div class="field"><label for="f-cp">상대 (회사·기관)</label><input id="f-cp" name="counterparty" placeholder="예: OO전자 IR, 전 OO사 엔지니어" /></div>
        <div class="field"><label for="f-pp">참석자</label><input id="f-pp" name="participants" placeholder="예: CFO, IR 상무" /></div>
        <div class="field"><label for="f-pu">콜 목적</label><input id="f-pu" name="purpose" placeholder="예: 가이던스 변화와 신규 고객 진척 확인" /></div>
        <div class="field"><label for="f-hy">내 가설 · 꼭 확인할 것</label><textarea id="f-hy" name="hypotheses" placeholder="한 줄에 하나씩. 통화 중 이 가설을 기준으로 판단 포인트를 띄워요."></textarea></div>
        <div class="field"><span class="label">대화 언어</span>
          <div class="row">${LANGS.map(([v, n]) => `<label class="check"><input type="checkbox" name="lang" value="${v}" ${(last.languages || ["ko", "en"]).includes(v) ? "checked" : ""}/> ${n}</label>`).join("")}</div>
        </div>
        <div class="field"><span class="label">음성 입력 방식</span>
          <div class="choices">
            <label class="choice ${status.stt.local ? "" : "disabled"}"><input type="radio" name="mode" value="local" ${mode === "local" ? "checked" : ""} ${status.stt.local ? "" : "disabled"}/>
              <div><strong>로컬 전사 (권장)</strong><span>이 컴퓨터에서 Whisper 모델이 직접 전사해요. 녹음이 외부로 나가지 않고 무료예요. 내 마이크와 상대 소리를 따로 받아 화자를 구분해요. ${status.stt.local ? "" : "— 터미널에서 <code>npm run stt</code> 로 전사 엔진을 먼저 켜주세요"}</span></div></label>
            <label class="choice ${status.stt.soniox ? "" : "disabled"}"><input type="radio" name="mode" value="soniox" ${mode === "soniox" ? "checked" : ""} ${status.stt.soniox ? "" : "disabled"}/>
              <div><strong>클라우드 음성인식 (Soniox)</strong><span>단어 단위로 가장 빠르게 뜨고 한·영 혼용·화자 분리가 강해요. 오디오가 Soniox 서버로 전송돼요. ${status.stt.soniox ? "" : "— SONIOX_API_KEY 설정 필요"}</span></div></label>
            <label class="choice"><input type="radio" name="mode" value="browser" ${mode === "browser" ? "checked" : ""}/>
              <div><strong>브라우저 내장 인식</strong><span>무료. Chrome 마이크만, 한 가지 언어만. 스피커폰 통화나 대면 미팅용.</span></div></label>
            <label class="choice"><input type="radio" name="mode" value="demo" ${mode === "demo" ? "checked" : ""}/>
              <div><strong>데모 콜 재생</strong><span>가상의 기업 실적 콜 대본으로 전체 흐름을 체험해요.</span></div></label>
          </div>
        </div>
        <div class="field" id="sources"><span class="label">소리 가져오기</span>
          <div class="row">
            <label class="check"><input type="checkbox" name="mic" ${last.mic !== false ? "checked" : ""}/> 내 마이크</label>
            <label class="check"><input type="checkbox" name="system" ${last.system !== false ? "checked" : ""}/> 상대 소리 (회의 탭·시스템 오디오)</label>
            <label class="check"><input type="checkbox" name="record" ${last.record !== false ? "checked" : ""}/> 녹음 저장</label>
          </div>
        </div>
        <div class="row">
          <button class="btn primary" type="submit">콜 시작</button>
          <button class="btn" type="button" id="prefill-demo">데모 정보 채우기</button>
        </div>
      </form>
      <aside class="card-box tips">
        <h2>통화 중 화면에 뜨는 것</h2>
        <ul>
          <li><strong>판단 포인트</strong> — 앞뒤 안 맞는 말, 회피성 답변, 내 메모와 다른 숫자</li>
          <li><strong>지금 물어볼 질문</strong> — 그대로 읽을 수 있는 후속 질문</li>
          <li><strong>기술 해석</strong> — 상대가 말한 기술·용어가 무슨 뜻이고 왜 중요한지</li>
          <li><strong>숫자</strong> — 매출·마진·가이던스·시점 정리</li>
          <li><strong>내 자료</strong> — 지난 콜 메모·리서치 노트의 관련 대목</li>
          <li><strong>웹 확인</strong> — 공개 정보로 사실 확인 (출처 포함)</li>
        </ul>
        <h2>상대 소리 가져오는 법</h2>
        <ul>
          <li>Zoom·Teams·Meet <strong>웹</strong>으로 들어가면: 공유 창에서 그 탭을 고르고 "탭 오디오 공유" 체크</li>
          <li>데스크톱 앱(Zoom 등)이면: Windows는 "전체 화면 + 시스템 오디오 공유", Mac은 BlackHole 같은 가상 오디오 장치를 쓰거나 웹 버전 사용</li>
          <li>전화·대면 미팅은 스피커폰으로 두고 "내 마이크"만 켜도 돼요</li>
        </ul>
        <p class="muted">녹음·자막·메모는 이 컴퓨터의 <code>data/</code> 폴더에만 저장돼요. 녹음 전에 상대방 동의를 받는 것을 잊지 마세요.</p>
        ${status.kb.docs === 0 ? `<p><button class="btn small" id="seed">데모용 내 자료 넣기</button></p>` : ""}
      </aside>
    </div>
  </div>`;

  const form = document.getElementById("setup");
  const syncSources = () => {
    const m = form.mode.value;
    document.getElementById("sources").hidden = m === "demo";
    form.system.disabled = m === "browser";
  };
  form.addEventListener("change", syncSources);
  syncSources();

  document.getElementById("prefill-demo").onclick = async () => {
    const s = await api("/api/demo/script");
    form.title.value = s.title; form.counterparty.value = s.counterparty; form.participants.value = s.participants;
    form.purpose.value = s.purpose; form.hypotheses.value = s.hypotheses;
    form.querySelector('input[name=mode][value=demo]').checked = true;
    syncSources();
  };
  document.getElementById("seed")?.addEventListener("click", async () => {
    const r = await api("/api/demo/seed", { method: "POST" });
    toast(`데모 자료 ${r.added}건을 넣었어요.`);
    await refreshStatus();
    viewSetup();
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const languages = [...form.querySelectorAll("input[name=lang]:checked")].map((i) => i.value);
    const opts = { mode: form.mode.value, mic: form.mic.checked, system: form.system.checked && form.mode.value !== "browser", record: form.record.checked, languages };
    store.set("lastSetup", opts);
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const call = await api("/api/calls", { method: "POST", body: JSON.stringify({ title: form.title.value, counterparty: form.counterparty.value, participants: form.participants.value, purpose: form.purpose.value, hypotheses: form.hypotheses.value, languages: languages.length ? languages : ["ko", "en"] }) });
      await startLive(call, opts);
      location.hash = `#/call/${call.id}`;
    } catch (err) {
      toast(err.message, 6000);
      btn.disabled = false;
    }
  };
}

async function startLive(call, opts) {
  const startedAt = Date.now();
  const segQueue = [];
  let flushTimer = null;
  const postSegments = () => {
    flushTimer = null;
    if (!segQueue.length) return;
    const batch = segQueue.splice(0);
    api(`/api/calls/${call.id}/segments`, { method: "POST", body: JSON.stringify({ segments: batch }) }).catch((e) => toast(e.message));
  };
  const handlers = {
    onPartial(key, speaker, text) { live?.partials.set(key, { speaker: speaker || key, text }); renderPartials(); },
    onFinal(seg) { segQueue.push(seg); flushTimer ??= setTimeout(postSegments, 300); },
    onError(msg) { toast(msg, 6000); },
    onDone() { toast("데모 대본이 끝났어요. ‘종료 & 메모’를 눌러 콜 메모를 만들어 보세요.", 6000); },
  };

  live = { callId: call.id, startedAt, paused: false, partials: new Map(), streams: [], capture: null, recorder: null, pausedMs: 0 };
  const context = {
    general: [
      { key: "domain", value: "investor conference call / expert call" },
      ...(call.title ? [{ key: "topic", value: call.title }] : []),
      ...(call.counterparty ? [{ key: "organization", value: call.counterparty }] : []),
    ],
    text: [call.purpose, call.hypotheses].filter(Boolean).join("\n").slice(0, 2000) || undefined,
  };

  if (opts.mode === "demo") {
    const speed = Number(new URLSearchParams(location.search).get("demoSpeed")) || 1;
    live.streams.push(await createDemo({ startedAt, handlers, speed }));
    return;
  }

  const capture = await startCapture({ mic: opts.mic, system: opts.system });
  live.capture = capture;
  if (opts.record) live.recorder = startRecorder(capture.mix, call.id, (e) => toast(e.message));

  if (opts.mode === "local") {
    const both = capture.sources.mic && capture.sources.system;
    if (capture.sources.system) live.streams.push(await createLocal(capture.sources.system, { label: "상대", callId: call.id, startedAt, handlers }));
    if (capture.sources.mic) live.streams.push(await createLocal(capture.sources.mic, { label: both ? "나" : "마이크", callId: call.id, startedAt, handlers }));
  } else if (opts.mode === "soniox") {
    const both = capture.sources.mic && capture.sources.system;
    if (capture.sources.system) {
      live.streams.push(await createSoniox(capture.sources.system, { label: "상대", diarize: true, languages: call.languages, context, startedAt, handlers }));
    }
    if (capture.sources.mic) {
      // 마이크만 쓰는 경우(스피커폰·대면)엔 화자분리로 여러 사람을 구분
      live.streams.push(await createSoniox(capture.sources.mic, { label: both ? "나" : "화자", diarize: !both, languages: call.languages, context, startedAt, handlers }));
    }
  } else {
    const lang = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" }[call.languages[0]] || "ko-KR";
    live.streams.push(createWebSpeech({ label: "마이크", lang, startedAt, handlers }));
  }
}

async function stopLive() {
  if (!live) return;
  const l = live;
  live = null;
  await Promise.all(l.streams.map((s) => s.stop()));
  await l.recorder?.stop();
  await l.capture?.stop();
  clearInterval(l.tick);
}

// ─────────────────────────────── 콜 화면 (실시간 + 다시 보기) ───────────────────────────────
let es = null;
const TYPE_NAMES = { judgment: "판단", question: "질문", tech: "기술", number: "숫자", kb: "내 자료", web: "웹 확인", answer: "답변", brief: "브리핑" };

async function viewCall(id) {
  const data = await api(`/api/calls/${id}`);
  const { call } = data;
  const isLive = live?.callId === id;
  const segments = data.segments;
  const cards = new Map(data.cards.map((c) => [c.id, c]));
  const pins = new Set(store.get(`pins:${id}`, []));
  let filter = "all";
  let summary = data.summary;
  const shown = new Set(cards.keys()); // 이미 보여준 카드는 다시 애니메이션하지 않음

  $view.innerHTML = `
    <div class="callbar">
      <span class="title" title="${esc(call.title)}">${esc(call.title)}</span>
      <span class="rec ${isLive ? "live" : ""}" id="rec"><span class="dot"></span><span id="clock">${isLive ? "00:00" : new Date(call.startedAt).toLocaleString("ko-KR")}</span></span>
      <span class="meters" id="meters"></span>
      <span class="analyzing" id="analyzing"></span>
      <span class="spacer"></span>
      ${isLive ? `
        <button class="btn small" id="brief">사전 브리핑</button>
        <button class="btn small" id="pause">일시정지</button>
        <button class="btn small danger" id="end">종료 & 메모</button>` : `
        ${call.hasAudio ? `<audio controls preload="none" src="/api/calls/${id}/audio" id="player"></audio>` : ""}
        ${!call.endedAt ? `<button class="btn small" id="end">메모 만들기</button>` : ""}
        <a class="btn small" href="/api/calls/${id}/export.md">내보내기 (.md)</a>`}
    </div>
    <div class="tabs-mobile"><button data-tab="cards" class="active">카드</button><button data-tab="transcript">자막</button></div>
    <div class="split">
      <section class="pane" id="p-transcript">
        <div class="pane-head"><h2>실시간 자막</h2><span class="muted" id="segcount"></span></div>
        <div class="scroll" id="transcript"></div>
      </section>
      <section class="pane show" id="p-cards">
        <div class="summary-panel" id="summary" ${summary ? "" : "hidden"}></div>
        <div class="pane-head">
          <h2>판단 보조</h2>
          <div class="chips" id="chips">
            ${[["all", "전체"], ...Object.entries(TYPE_NAMES)].map(([k, n]) => `<button class="chip ${k === "all" ? "active" : ""}" data-f="${k}">${n}</button>`).join("")}
          </div>
        </div>
        <div class="scroll"><div class="cards" id="cards"></div></div>
        <form class="askbar" id="ask">
          <input name="q" autocomplete="off" placeholder="통화 중 궁금한 것 — 예: 방금 말한 수율이 경쟁사보다 높은 거 맞아?" />
          <button class="btn primary" type="submit">묻기</button>
        </form>
      </section>
    </div>`;

  const $t = document.getElementById("transcript");
  const $cards = document.getElementById("cards");

  const segHtml = (s) => `<div class="seg ${s.speaker === "나" ? "me" : ""}" data-t="${s.t}"><span class="t">${clock(s.t)}</span><div><span class="who">${esc(s.speaker)}</span><span class="txt">${esc(s.text)}</span></div></div>`;
  const nearBottom = () => $t.scrollHeight - $t.scrollTop - $t.clientHeight < 80;
  const renderTranscript = () => {
    $t.innerHTML = segments.length ? segments.map(segHtml).join("") + `<div id="partials"></div>` : `<div class="empty">${isLive ? "말소리를 기다리고 있어요…" : "저장된 자막이 없어요."}</div><div id="partials"></div>`;
    document.getElementById("segcount").textContent = segments.length ? `${segments.length}개 발화` : "";
    $t.scrollTop = $t.scrollHeight;
  };
  renderPartials = () => {
    const el = document.getElementById("partials");
    if (!el || !live) return;
    const stick = nearBottom();
    el.innerHTML = [...live.partials.values()].filter((p) => p.text).map((p) => `<div class="seg partial"><span class="t">…</span><div><span class="who">${esc(p.speaker)}</span><span class="txt">${esc(p.text)}</span></div></div>`).join("");
    if (stick) $t.scrollTop = $t.scrollHeight;
  };

  const cardHtml = (c) => {
    const srcs = (c.sources || []).map((s) => s.url
      ? `<a class="src" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.title)}</a>`
      : `<a class="src" href="#/kb?doc=${esc(s.docId)}" title="${esc(s.title)}">📄 ${esc(s.title)}</a>`).join("");
    const long = c.type === "answer" || c.type === "brief" || c.type === "web";
    const fresh = !shown.has(c.id);
    shown.add(c.id);
    return `<article class="icard t-${c.type} p${c.priority} ${fresh ? "fresh" : ""} ${c.status === "pending" ? "pending" : ""} ${pins.has(c.id) ? "pinned" : ""}" data-id="${c.id}">
      <div class="head"><span class="kind">${TYPE_NAMES[c.type] || c.type}</span><span class="ttl">${esc(c.title)}</span>
        ${c.t != null ? `<button class="when" data-jump="${c.t}" title="자막에서 보기">${clock(c.t)}</button>` : ""}
        <button class="pin ${pins.has(c.id) ? "on" : ""}" data-pin="${c.id}" aria-label="고정">${pins.has(c.id) ? "★" : "☆"}</button></div>
      <div class="body">${long ? md(c.body) : esc(c.body)}</div>
      ${c.quote ? `<div class="quote">“${esc(c.quote)}”</div>` : ""}
      ${srcs ? `<div class="srcs">${srcs}</div>` : ""}
      ${c.type === "question" ? `<button class="copy" data-copy="${esc(c.title)}">복사</button>` : ""}
    </article>`;
  };
  const renderCards = () => {
    const list = [...cards.values()]
      .filter((c) => filter === "all" || c.type === filter)
      .sort((a, b) => (pins.has(b.id) - pins.has(a.id)) || b.createdAt - a.createdAt);
    $cards.innerHTML = list.length ? list.map(cardHtml).join("") : `<div class="empty">${isLive ? "대화가 쌓이면 여기에 판단 포인트·질문·해석 카드가 떠요." : "카드가 없어요."}</div>`;
  };
  const renderSummary = () => {
    const el = document.getElementById("summary");
    if (!summary) return;
    el.hidden = false;
    el.innerHTML = md(summary);
  };
  renderTranscript();
  renderCards();
  renderSummary();

  // 상호작용
  document.getElementById("chips").onclick = (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll("#chips .chip").forEach((x) => x.classList.toggle("active", x === b));
    renderCards();
  };
  $cards.onclick = async (e) => {
    const pin = e.target.closest("[data-pin]");
    if (pin) {
      const cid = pin.dataset.pin;
      pins.has(cid) ? pins.delete(cid) : pins.add(cid);
      store.set(`pins:${id}`, [...pins]);
      return renderCards();
    }
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      await navigator.clipboard?.writeText(copy.dataset.copy).catch(() => {});
      return toast("질문을 복사했어요.");
    }
    const jump = e.target.closest("[data-jump]");
    if (jump) {
      const t = Number(jump.dataset.jump);
      const el = [...$t.querySelectorAll(".seg[data-t]")].reverse().find((x) => Number(x.dataset.t) <= t) || $t.querySelector(".seg[data-t]");
      if (el) {
        showTab("transcript");
        el.scrollIntoView({ block: "center" });
        el.classList.add("flash");
        setTimeout(() => el.classList.remove("flash"), 1600);
      }
      const player = document.getElementById("player");
      if (player) { player.currentTime = Math.max(0, t / 1000 - 3); player.play().catch(() => {}); }
    }
  };
  const showTab = (tab) => {
    document.querySelectorAll(".tabs-mobile button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.getElementById("p-cards").classList.toggle("show", tab === "cards");
    document.getElementById("p-transcript").classList.toggle("show", tab === "transcript");
  };
  document.querySelector(".tabs-mobile").onclick = (e) => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); };

  document.getElementById("ask").onsubmit = async (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    e.target.q.value = "";
    filter = "all";
    api(`/api/calls/${id}/ask`, { method: "POST", body: JSON.stringify({ question: q }) }).catch((err) => toast(err.message));
  };

  document.getElementById("brief")?.addEventListener("click", () => api(`/api/calls/${id}/brief`, { method: "POST" }).catch((err) => toast(err.message)));
  document.getElementById("pause")?.addEventListener("click", (e) => {
    if (!live) return;
    live.paused = !live.paused;
    live.streams.forEach((s) => (live.paused ? s.pause() : s.resume()));
    live.paused ? live.recorder?.pause() : live.recorder?.resume();
    e.target.textContent = live.paused ? "다시 시작" : "일시정지";
    document.getElementById("rec").classList.toggle("live", !live.paused);
  });
  document.getElementById("end")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    e.target.textContent = "메모 작성 중…";
    await stopLive();
    try {
      const r = await api(`/api/calls/${id}/end`, { method: "POST" });
      summary = r.summary;
      toast("콜 메모를 만들고 ‘내 자료’에 저장했어요. 다음 콜에서 참고돼요.", 5000);
      viewCall(id);
    } catch (err) {
      toast(err.message, 6000);
      e.target.disabled = false;
    }
  });

  // 실시간 시계·레벨 미터
  if (isLive) {
    const meters = document.getElementById("meters");
    const names = Object.keys(live.capture?.sources || {});
    meters.innerHTML = names.map((n) => `<span class="meter">${n === "mic" ? "나" : "상대"}<span class="bar"><span class="fill" id="lv-${n}"></span></span></span>`).join("");
    clearInterval(live.tick);
    live.tick = setInterval(() => {
      if (!live) return;
      document.getElementById("clock").textContent = clock(Date.now() - live.startedAt);
      for (const n of names) {
        const el = document.getElementById(`lv-${n}`);
        if (el) el.style.width = `${Math.round(live.capture.level(n) * 100)}%`;
      }
    }, 120);
  }

  // 서버 이벤트
  es?.close();
  es = new EventSource(`/api/calls/${id}/events`);
  es.addEventListener("segments", (ev) => {
    const stick = nearBottom();
    for (const s of JSON.parse(ev.data)) segments.push(s);
    renderTranscript();
    if (!stick) $t.scrollTop = $t.scrollHeight;
    renderPartials();
  });
  es.addEventListener("card", (ev) => {
    const c = JSON.parse(ev.data);
    cards.set(c.id, c);
    renderCards();
  });
  es.addEventListener("status", (ev) => {
    const s = JSON.parse(ev.data);
    const el = document.getElementById("analyzing");
    if (!el) return;
    if (s.error) toast(s.error);
    el.textContent = s.summarizing ? "메모 작성 중…" : s.analyzing ? "분석 중…" : "";
  });
}

// ─────────────────────────────── 지난 콜 ───────────────────────────────
async function viewCalls() {
  const calls = await api("/api/calls");
  $view.innerHTML = `<div class="page"><h1>지난 콜</h1><p class="sub">녹음·자막·카드·콜 메모가 모두 남아 있어요. 끝난 콜의 메모는 자동으로 ‘내 자료’에 들어가 다음 콜에서 참고돼요.</p>
    <div class="list">${calls.length ? calls.map((c) => `
      <div class="item"><div class="main"><a class="name" href="#/call/${c.id}">${esc(c.title)}</a>
        <div class="muted">${new Date(c.startedAt).toLocaleString("ko-KR")}${c.counterparty ? " · " + esc(c.counterparty) : ""}${c.endedAt ? " · " + clock(c.endedAt - c.startedAt) : ""}</div></div>
        ${c.hasAudio ? `<span class="tag">녹음</span>` : ""}${c.summaryReady ? `<span class="tag">메모</span>` : `<span class="tag">진행/미정리</span>`}
      </div>`).join("") : `<div class="empty">아직 콜이 없어요.</div>`}</div></div>`;
}

// ─────────────────────────────── 내 자료 ───────────────────────────────
async function viewKb(params) {
  const docs = await api("/api/kb");
  const kindName = { note: "메모", file: "파일", call: "콜 메모" };
  $view.innerHTML = `<div class="page">
    <h1>내 자료</h1>
    <p class="sub">리서치 노트, 지난 콜 메모, 모델 가정, 기사 스크랩을 넣어두면 통화 중 관련 대목을 찾아 지금 발언과 비교해요.</p>
    <div class="grid-2">
      <form class="card-box" id="note">
        <h2>메모 붙여넣기</h2>
        <div class="field"><label for="n-title">제목</label><input id="n-title" name="title" placeholder="예: OO전자 2Q 콜 메모" /></div>
        <div class="field"><label for="n-text">내용</label><textarea id="n-text" name="text" rows="7" placeholder="예전 발언, 숫자, 내 가설, 확인할 것…"></textarea></div>
        <button class="btn primary" type="submit">저장</button>
      </form>
      <div class="card-box">
        <h2>파일 올리기</h2>
        <label class="drop" id="drop">여기로 끌어놓거나 눌러서 고르세요<br/><span class="muted">.md .txt .csv .json .pdf</span>
          <input type="file" id="file" multiple accept=".md,.txt,.csv,.json,.tsv,.pdf" hidden /></label>
        <h2 class="mt">폴더 연결</h2>
        <p class="muted">${status.kb.folders?.length ? `연결된 폴더: ${status.kb.folders.map(esc).join(", ")}` : "<code>.env</code> 의 KB_DIRS 에 Obsidian/메모 폴더 경로를 적으면 자동 색인돼요."}</p>
        ${status.kb.folders?.length ? `<button class="btn small" id="sync">지금 다시 색인</button>` : ""}
        <h2 class="mt">검색 테스트</h2>
        <form id="search" class="row"><input class="grow" name="q" placeholder="예: 하이브리드 본딩 일정" /><button class="btn small">찾기</button></form>
        <div id="results" class="muted"></div>
      </div>
    </div>
    <h2 class="mt">자료 ${docs.length}건</h2>
    <div class="list" id="docs">${docs.map((d) => `
      <div class="item" data-doc="${d.id}"><div class="main"><button class="name linklike" data-open="${d.id}">${esc(d.title)}</button>
        <div class="muted">${kindName[d.kind] || d.kind} · ${new Date(d.addedAt).toLocaleDateString("ko-KR")} · ${d.chars.toLocaleString()}자</div>
        <div class="doc-text" id="t-${d.id}" hidden></div></div>
        <button class="btn small" data-del="${d.id}">삭제</button></div>`).join("") || `<div class="empty">아직 자료가 없어요.</div>`}</div>
  </div>`;

  document.getElementById("note").onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/kb/note", { method: "POST", body: JSON.stringify({ title: e.target.title.value, text: e.target.text.value }) }).then(() => toast("저장했어요.")).catch((err) => toast(err.message));
    await refreshStatus(); viewKb();
  };
  const upload = async (files) => {
    for (const f of files) {
      try { await api(`/api/kb/upload?name=${encodeURIComponent(f.name)}`, { method: "POST", body: await f.arrayBuffer() }); toast(`${f.name} 추가했어요.`); }
      catch (err) { toast(`${f.name}: ${err.message}`, 6000); }
    }
    await refreshStatus(); viewKb();
  };
  const drop = document.getElementById("drop");
  document.getElementById("file").onchange = (e) => upload([...e.target.files]);
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); upload([...e.dataTransfer.files]); };
  document.getElementById("sync")?.addEventListener("click", async () => { const r = await api("/api/kb/sync", { method: "POST" }); toast(`새로 색인 ${r.added}건`); await refreshStatus(); viewKb(); });
  document.getElementById("search").onsubmit = async (e) => {
    e.preventDefault();
    const hits = await api(`/api/kb/search?q=${encodeURIComponent(e.target.q.value)}`);
    document.getElementById("results").innerHTML = hits.length ? hits.map((h) => `<p><strong>${esc(h.title)}</strong> (${h.score.toFixed(1)})<br/>${esc(h.text.slice(0, 180))}…</p>`).join("") : "<p>관련 대목이 없어요.</p>";
  };
  const openDoc = async (docId) => {
    const el = document.getElementById(`t-${docId}`);
    if (!el) return;
    if (!el.hidden) { el.hidden = true; return; }
    const { text } = await api(`/api/kb/${docId}`);
    el.innerHTML = md(text);
    el.hidden = false;
    el.scrollIntoView({ block: "nearest" });
  };
  document.getElementById("docs").onclick = async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!confirm("이 자료를 지울까요?")) return;
      await api(`/api/kb/${del.dataset.del}`, { method: "DELETE" });
      await refreshStatus(); return viewKb();
    }
    const open = e.target.closest("[data-open]");
    if (open) openDoc(open.dataset.open);
  };
  if (params?.get("doc")) openDoc(params.get("doc"));
}

// ─────────────────────────────── 라우팅 ───────────────────────────────
let renderPartials = () => {};
async function route() {
  const [pathPart, query] = location.hash.replace(/^#/, "").split("?");
  const parts = (pathPart || "/").split("/").filter(Boolean);
  const params = new URLSearchParams(query || "");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === (parts[0] || "setup")));
  if (parts[0] !== "call") { es?.close(); es = null; }
  try {
    if (parts[0] === "call" && parts[1]) await viewCall(parts[1]);
    else if (parts[0] === "calls") await viewCalls();
    else if (parts[0] === "kb") await viewKb(params);
    else {
      if (live) return (location.hash = `#/call/${live.callId}`);
      viewSetup();
    }
  } catch (err) {
    $view.innerHTML = `<div class="page"><div class="empty">${esc(err.message)}</div></div>`;
  }
}

window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", (e) => { if (live) { e.preventDefault(); e.returnValue = ""; } });
await refreshStatus();
route();
