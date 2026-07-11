/* LLM Arcade — 全站逻辑(vanilla JS,零依赖)
 * 数据源:assets/data.js(window.ARCADE_DATA,由 scripts/build_data.mjs 生成)
 * 页面分发:document.body.dataset.page = "home" | "mario"
 */
(() => {
  "use strict";
  const D = window.ARCADE_DATA;
  if (!D) return;
  const ENTRANT_META = window.ARCADE_ENTRANT_META || {};

  /* ---------- 工具 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtKB = (b) => (b / 1024).toFixed(1) + " KB";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GAME_BASE = document.body.dataset.gameBase || "games/mario/";
  const gameURL = (dir) => GAME_BASE + encodeURIComponent(dir) + "/index.html";
  const SANDBOX = "allow-scripts allow-same-origin allow-pointer-lock";
  const metaFor = (dir) => ENTRANT_META[dir] || {
    vendor: "厂商待确认", vendor_mark: "?", vendor_class: "unknown",
    model: dir, harness: "Harness 待确认", verified: false,
  };
  function identityHTML(dir, compact = false) {
    const m = metaFor(dir);
    return `<span class="vendor-mark vendor-${esc(m.vendor_class)}">${esc(m.vendor_mark)}</span>
      <span class="identity-copy"><b>${esc(m.vendor)}</b><strong>${esc(m.model)}${compact ? "" : ` × ${esc(m.harness)}`}</strong>
      ${compact ? "" : `<small>内部代号 ${esc(dir)}${m.verified ? "" : " · 待核对"}</small>`}</span>`;
  }

  /* 按静态分降序的名次表(并列同分按代号字典序) */
  const ranked = [...D.entrants].sort((a, b) => b.score - a.score || a.dir.localeCompare(b.dir));
  const topScore = ranked.length ? ranked[0].score : 0;

  const ACCENT = "#e8710a";
  const BAR = "#3b82f6";

  /* ---------- 本机投票与 Elo ---------- */
  const VOTES_KEY = "arcade_mario_votes_v1";
  function loadVotes() {
    try {
      const v = JSON.parse(localStorage.getItem(VOTES_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  function saveVotes(votes) {
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
    } catch {
      /* 隐私模式下静默失败,页面仍可玩 */
    }
  }
  /* 简单 Elo:K=32,初始 1000,按投票时间顺序回放 */
  function computeElo(votes) {
    const K = 32;
    const st = new Map(D.entrants.map((e) => [e.dir, { dir: e.dir, elo: 1000, w: 0, t: 0, l: 0, games: 0 }]));
    for (const v of votes) {
      const A = st.get(v.a);
      const B = st.get(v.b);
      if (!A || !B) continue;
      const ea = 1 / (1 + Math.pow(10, (B.elo - A.elo) / 400));
      const sa = v.r === "a" ? 1 : v.r === "b" ? 0 : 0.5;
      A.elo += K * (sa - ea);
      B.elo += K * (1 - sa - (1 - ea));
      A.games++; B.games++;
      if (v.r === "a") { A.w++; B.l++; }
      else if (v.r === "b") { B.w++; A.l++; }
      else { A.t++; B.t++; }
    }
    return [...st.values()].sort((x, y) => y.elo - x.elo || y.games - x.games || x.dir.localeCompare(y.dir));
  }

  /* ---------- SVG 图表 ---------- */
  /* 右端 4px 圆角、左端贴基线的横条 path */
  function barPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return `M${x},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} Z`;
  }
  /* 顶端圆角竖条 */
  function colPath(x, yTop, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return `M${x},${yTop + h} v-${h - r} a${r},${r} 0 0 1 ${r},-${r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} Z`;
  }

  /* 首页主榜横向条形图 */
  function renderBarChart(container) {
    const rows = ranked;
    const labelW = 128, valueW = 52, plotW = 640;
    const rowH = 36, barH = 20, padTop = 10, axisH = 30;
    const W = labelW + plotW + valueW + 12;
    const H = padTop + rows.length * rowH + axisH;
    const x0 = labelW + 6;
    const sx = (v) => x0 + (v / 100) * plotW;

    let g = "";
    for (const v of [0, 25, 50, 75, 100]) {
      g += `<line class="grid" x1="${sx(v)}" y1="${padTop - 4}" x2="${sx(v)}" y2="${padTop + rows.length * rowH}"/>`;
      g += `<text class="axis-label" x="${sx(v)}" y="${padTop + rows.length * rowH + 18}" text-anchor="middle">${v}</text>`;
    }
    rows.forEach((e, i) => {
      const y = padTop + i * rowH + (rowH - barH) / 2;
      const w = Math.max((e.score / 100) * plotW, 2);
      const fill = e.score === topScore ? ACCENT : BAR;
      g += `<text class="bar-label mono" x="${labelW}" y="${y + barH / 2 + 4.5}" text-anchor="end">${esc(e.dir)}</text>`;
      g += `<path class="bar-rect" style="animation-delay:${i * 55}ms" d="${barPath(x0, y, w, barH, 4)}" fill="${fill}"/>`;
      g += `<text class="bar-value" x="${sx(e.score) + 8}" y="${y + barH / 2 + 4.5}">${e.score}</text>`;
    });
    container.innerHTML =
      `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="9 位参赛者静态检查分横向条形图">${g}</svg>`;
  }

  /* Hero 装饰迷你竖条图 */
  function renderHeroChart(container) {
    const rows = ranked;
    const W = 440, H = 230, padB = 26, padT = 14;
    const plotH = H - padB - padT;
    const colW = 30, gap = (W - rows.length * colW) / (rows.length + 1);
    let g = "";
    for (const v of [25, 50, 75, 100]) {
      const y = H - padB - (v / 100) * plotH;
      g += `<line class="grid" x1="8" y1="${y}" x2="${W - 8}" y2="${y}"/>`;
    }
    rows.forEach((e, i) => {
      const h = Math.max((e.score / 100) * plotH, 4);
      const x = gap + i * (colW + gap);
      const y = H - padB - h;
      const fill = e.score === topScore ? ACCENT : BAR;
      g += `<path d="${colPath(x, y, colW, h, 4)}" fill="${fill}" opacity="${e.score === topScore ? 1 : 0.82}"/>`;
      g += `<text class="axis-label" x="${x + colW / 2}" y="${y - 6}" text-anchor="middle">${e.score}</text>`;
    });
    g += `<line x1="8" y1="${H - padB}" x2="${W - 8}" y2="${H - padB}" stroke="#d1d5db" stroke-width="1"/>`;
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>`;
  }

  /* 体积 vs 静态分 散点图(带 hover tooltip) */
  function renderScatter(wrap) {
    const rows = D.entrants;
    const W = 720, H = 400, mL = 56, mR = 24, mT = 18, mB = 48;
    const kbs = rows.map((e) => e.bytes / 1024);
    const xMax = Math.ceil(Math.max(...kbs) / 20) * 20 + 20;
    const xMin = 0, yMin = 0, yMax = 100;
    const sx = (v) => mL + ((v - xMin) / (xMax - xMin)) * (W - mL - mR);
    const sy = (v) => H - mB - ((v - yMin) / (yMax - yMin)) * (H - mT - mB);

    let g = "";
    for (let v = 0; v <= xMax; v += 20) {
      g += `<line class="grid" x1="${sx(v)}" y1="${mT}" x2="${sx(v)}" y2="${H - mB}"/>`;
      g += `<text class="axis-label" x="${sx(v)}" y="${H - mB + 18}" text-anchor="middle">${v}</text>`;
    }
    for (let v = 0; v <= 100; v += 25) {
      g += `<line class="grid" x1="${mL}" y1="${sy(v)}" x2="${W - mR}" y2="${sy(v)}"/>`;
      g += `<text class="axis-label" x="${mL - 10}" y="${sy(v) + 4}" text-anchor="end">${v}</text>`;
    }
    g += `<text class="axis-label" x="${(mL + W - mR) / 2}" y="${H - 8}" text-anchor="middle">总体积 (KB)</text>`;
    g += `<text class="axis-label" x="14" y="${(mT + H - mB) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(mT + H - mB) / 2})">静态检查分</text>`;
    rows.forEach((e, i) => {
      const fill = e.score === topScore ? ACCENT : BAR;
      g += `<circle class="pt" data-i="${i}" cx="${sx(e.bytes / 1024)}" cy="${sy(e.score)}" r="6.5" fill="${fill}" stroke="#ffffff" stroke-width="2"/>`;
    });
    wrap.innerHTML =
      `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="体积与静态检查分散点图">${g}</svg>` +
      `<div class="tooltip" role="status"></div>`;

    const tip = $(".tooltip", wrap);
    $$("circle.pt", wrap).forEach((c) => {
      const e = rows[+c.dataset.i];
      const show = () => {
        const wb = wrap.getBoundingClientRect();
        const cb = c.getBoundingClientRect();
        tip.innerHTML = `<span class="t-code">${esc(e.dir)}</span><br>体积 ${fmtKB(e.bytes)} · 静态分 ${e.score}`;
        tip.style.left = cb.left - wb.left + cb.width / 2 + "px";
        tip.style.top = cb.top - wb.top + "px";
        tip.classList.add("on");
        c.setAttribute("r", "8.5");
      };
      const hide = () => { tip.classList.remove("on"); c.setAttribute("r", "6.5"); };
      c.addEventListener("mouseenter", show);
      c.addEventListener("mouseleave", hide);
      c.addEventListener("focus", show);
      c.addEventListener("blur", hide);
      c.setAttribute("tabindex", "0");
    });
  }

  /* ---------- 首页 ---------- */
  function boolCell(v) {
    return v ? '<span class="check">✓</span>' : '<span class="cross">–</span>';
  }

  let homeRankingTimer = null;
  function renderHomeRanking(lb) {
    const box = $("#home-ranking-list");
    if (!box) return;
    const total = Number(lb && lb.total_votes || 0);
    const sv = $("#stat-votes");
    const rv = $("#ranking-votes");
    const poolStatus = $("#home-pool-status");
    const source = $("#ranking-source");
    const updated = $("#ranking-updated");
    if (sv) sv.textContent = total.toLocaleString("zh-CN");
    if (rv) rv.textContent = total.toLocaleString("zh-CN");
    if (poolStatus) poolStatus.textContent = "全网票池在线";

    if (!total || !lb.entries || !lb.entries.some((e) => e.games > 0)) {
      if (source) source.textContent = "初始榜筹备中";
      if (updated) updated.textContent = "等待 Agent 初评或社区有效盲投";
      box.innerHTML = '<div class="ranking-pending">初始榜筹备中。5.6sol Agent 初评尚未录入，社区产生有效盲投后将自动显示实时 Elo。</div>';
      return;
    }

    if (source) source.textContent = "社区实时 Elo";
    if (updated) {
      const stamp = Number(lb.updated_at || 0) * 1000;
      updated.textContent = stamp ? `更新于 ${new Date(stamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : "刚刚更新";
    }
    box.innerHTML = lb.entries.map((e, i) => {
      const m = metaFor(e.dir);
      return `<article class="ranking-entry${i === 0 ? " is-top" : ""}">
      <span class="rank">#${String(i + 1).padStart(2, "0")}${i === 0 ? "<i></i>" : ""}</span>
      <span class="ranking-brand">${identityHTML(e.dir, true)}</span>
      <strong class="name">${esc(m.model)}</strong>
      <b class="rating num">${e.elo}</b>
      <small class="games num">${e.games} 场 · ${e.wins}胜 ${e.ties}平 ${e.losses}负</small>
    </article>`;
    }).join("");
  }

  async function refreshHomeRanking() {
    try {
      renderHomeRanking(await apiFetch("/leaderboard?track=mario", {}, 4500));
    } catch {
      const poolStatus = $("#home-pool-status");
      const source = $("#ranking-source");
      if (poolStatus) poolStatus.textContent = "票池暂时离线";
      if (source) source.textContent = "连接中断，稍后重试";
    }
  }

  function initCabinetCarousel() {
    const shell = $(".hero-cabinet");
    const main = $("#cabinet-main-shot");
    const identity = $("#cabinet-identity");
    const count = $("#cabinet-count");
    const thumbs = $("#cabinet-thumbs");
    const prev = $("#cabinet-prev");
    const next = $("#cabinet-next");
    const toggle = $("#cabinet-toggle");
    if (!shell || !main || !identity || !thumbs) return;

    const rows = D.entrants.filter((e) => e.shot);
    let idx = 0;
    let timer = null;
    let paused = REDUCED;
    thumbs.innerHTML = rows.map((e, i) => {
      const m = metaFor(e.dir);
      return `<button type="button" data-slide="${i}" aria-label="查看 ${esc(m.vendor)} ${esc(m.model)}"${i === 0 ? ' class="active" aria-current="true"' : ""}>
        <img src="${esc(e.shot)}" alt="" loading="eager"><span>${esc(m.vendor_mark)}</span>
      </button>`;
    }).join("");

    function schedule() {
      clearInterval(timer);
      if (!paused && rows.length > 1) timer = setInterval(() => show(idx + 1), 3600);
    }
    function show(nextIdx, manual = false) {
      idx = (nextIdx + rows.length) % rows.length;
      const e = rows[idx];
      const m = metaFor(e.dir);
      main.classList.remove("slide-in");
      main.classList.add("slide-out");
      setTimeout(() => {
        main.src = e.shot;
        main.alt = `${m.vendor} ${m.model} 生成的游戏首屏`;
        identity.innerHTML = identityHTML(e.dir);
        count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(rows.length).padStart(2, "0")}`;
        $$("button[data-slide]", thumbs).forEach((button, i) => {
          button.classList.toggle("active", i === idx);
          if (i === idx) button.setAttribute("aria-current", "true");
          else button.removeAttribute("aria-current");
        });
        const active = $(`button[data-slide="${idx}"]`, thumbs);
        active?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest", inline: "center" });
        main.classList.remove("slide-out");
        main.classList.add("slide-in");
      }, REDUCED ? 0 : 170);
      if (manual) schedule();
    }
    function setPaused(value) {
      paused = value;
      toggle.textContent = paused ? "▶" : "Ⅱ";
      toggle.setAttribute("aria-label", paused ? "继续自动轮播" : "暂停自动轮播");
      schedule();
    }
    $$("button[data-slide]", thumbs).forEach((button) => button.addEventListener("click", () => show(+button.dataset.slide, true)));
    prev?.addEventListener("click", () => show(idx - 1, true));
    next?.addEventListener("click", () => show(idx + 1, true));
    toggle?.addEventListener("click", () => setPaused(!paused));
    shell.addEventListener("mouseenter", () => { clearInterval(timer); });
    shell.addEventListener("mouseleave", schedule);
    shell.addEventListener("focusin", () => { clearInterval(timer); });
    shell.addEventListener("focusout", schedule);
    schedule();
  }

  function initHome() {
    const se = $("#stat-entrants");
    if (se) se.textContent = D.entrants.length;
    const heroBox = $("#hero-chart");
    if (heroBox) renderHeroChart(heroBox);

    const chartBox = $("#lb-chart");
    if (chartBox) {
      renderBarChart(chartBox);
      /* 进入视口才播放一次生长动画(reduced-motion 下 CSS 全局禁用) */
      if (!REDUCED && "IntersectionObserver" in window) {
        chartBox.classList.add("pending-anim");
        const paths = $$(".bar-rect", chartBox);
        paths.forEach((p) => (p.style.animationPlayState = "paused"));
        const io = new IntersectionObserver((es) => {
          if (es.some((e) => e.isIntersecting)) {
            paths.forEach((p) => (p.style.animationPlayState = "running"));
            io.disconnect();
          }
        }, { threshold: 0.3 });
        io.observe(chartBox);
      }
    }

    const tbody = $("#lb-table tbody");
    if (tbody) {
      tbody.innerHTML = ranked
        .map((e, i) => {
          const rank1 = e.score === topScore;
          return `<tr>
            <td class="num${rank1 ? " rank-1" : ""}">${i + 1}${rank1 ? ' <span class="medal">●</span>' : ""}</td>
            <td><span class="table-identity">${identityHTML(e.dir, true)}</span><small class="table-harness">${esc(metaFor(e.dir).harness)} · ${esc(e.dir)}</small></td>
            <td class="num${rank1 ? " best" : ""}">${e.score}</td>
            <td>${boolCell(e.has_audio)}</td>
            <td>${boolCell(e.has_touch)}</td>
            <td>${boolCell(e.uses_localstorage)}</td>
            <td>${boolCell(e.has_readme)}</td>
            <td class="num">${fmtKB(e.bytes)}</td>
          </tr>`;
        })
        .join("");
    }

    refreshHomeRanking();
    initCabinetCarousel();
    clearInterval(homeRankingTimer);
    homeRankingTimer = setInterval(refreshHomeRanking, 15000);
    $$("[data-formula]").forEach((n) => (n.textContent = D.score_formula_zh));
  }

  /* ---------- 赛道页:参赛卡片与活预览 ---------- */
  function monogramSVG(dir) {
    let h = 0;
    for (const ch of dir) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    const c1 = `hsl(${hue} 45% 88%)`;
    const c2 = `hsl(${(hue + 40) % 360} 50% 78%)`;
    const letter = dir[0].toUpperCase();
    return `<svg viewBox="0 0 320 200" aria-hidden="true" style="width:100%;height:100%;display:block">
      <rect width="320" height="200" fill="${c1}"/>
      <circle cx="258" cy="36" r="70" fill="${c2}" opacity=".7"/>
      <rect x="-30" y="140" width="200" height="90" rx="16" fill="${c2}" opacity=".5" transform="rotate(-8 70 185)"/>
      <text x="160" y="122" text-anchor="middle" font-family="var(--mono)" font-size="72" font-weight="700" fill="#475569">${esc(letter)}</text>
    </svg>`;
  }

  const liveFrames = new Set(); /* 需要随窗口缩放重排的 {frame, box} */
  function fitFrame(iframe, box) {
    const s = box.clientWidth / 960;
    iframe.style.transform = `scale(${s})`;
  }

  const HANDHELD_KEYS = {
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
    Space: " ", KeyX: "x", Enter: "Enter",
  };
  function sendGameKey(frame, code, type) {
    try {
      const w = frame.contentWindow;
      const target = frame.contentDocument || w;
      const event = new w.KeyboardEvent(type, {
        code,
        key: HANDHELD_KEYS[code] || code,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      if (type === "keydown") frame.focus();
    } catch {
      /* iframe 未完成加载时忽略本次按键 */
    }
  }
  function mountHandheldControls(host, frame, compact = false) {
    $$(".handheld-controls", host).forEach((n) => n.remove());
    host.classList.add("has-handheld");
    const deck = document.createElement("div");
    deck.className = "handheld-controls" + (compact ? " compact" : "");
    deck.setAttribute("aria-label", "复古掌机触屏操作");
    deck.innerHTML = `<div class="handheld-speaker" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="handheld-dpad" aria-label="方向键">
        <button data-code="ArrowUp" class="d-up" aria-label="向上">▲</button>
        <button data-code="ArrowLeft" class="d-left" aria-label="向左">◀</button>
        <span aria-hidden="true"></span>
        <button data-code="ArrowRight" class="d-right" aria-label="向右">▶</button>
        <button data-code="ArrowDown" class="d-down" aria-label="向下">▼</button>
      </div>
      <div class="handheld-center"><b>LLM ARCADE</b><small>TOUCH DECK</small><button data-code="Enter" class="start-key">START</button></div>
      <div class="handheld-actions">
        <label><button data-code="KeyX" aria-label="B 冲刺">B</button><small>RUN</small></label>
        <label><button data-code="Space" aria-label="A 跳跃">A</button><small>JUMP</small></label>
      </div>`;
    host.appendChild(deck);
    $$("button[data-code]", deck).forEach((button) => {
      const code = button.dataset.code;
      let down = false;
      const press = (event) => {
        event.preventDefault();
        if (down) return;
        down = true;
        button.classList.add("pressed");
        button.setPointerCapture?.(event.pointerId);
        sendGameKey(frame, code, "keydown");
      };
      const release = (event) => {
        event.preventDefault();
        if (!down) return;
        down = false;
        button.classList.remove("pressed");
        sendGameKey(frame, code, "keyup");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
  }
  window.addEventListener("resize", () => {
    for (const it of liveFrames) fitFrame(it.frame, it.box);
  });

  function initPreviews(cards) {
    if (REDUCED || (navigator.connection && navigator.connection.saveData)) return; /* 截图模式即可 */
    if (!("IntersectionObserver" in window)) return;
    const MAX_LIVE = 3;
    const state = new Map(); /* preview el -> {dir, iframe, visible} */
    let liveCount = 0;

    function activate(pv) {
      const st = state.get(pv);
      if (st.iframe || liveCount >= MAX_LIVE) return;
      const f = document.createElement("iframe");
      f.className = "live";
      f.setAttribute("sandbox", SANDBOX);
      f.setAttribute("tabindex", "-1");
      f.setAttribute("aria-hidden", "true");
      f.setAttribute("title", "");
      f.src = gameURL(st.dir);
      f.addEventListener("load", () => f.classList.add("on"));
      pv.appendChild(f);
      fitFrame(f, pv);
      const rec = { frame: f, box: pv };
      liveFrames.add(rec);
      st.iframe = f;
      st.rec = rec;
      liveCount++;
      pv.classList.add("is-live");
    }
    function deactivate(pv) {
      const st = state.get(pv);
      if (!st.iframe) return;
      st.iframe.remove();
      liveFrames.delete(st.rec);
      st.iframe = null;
      liveCount--;
      pv.classList.remove("is-live");
    }
    function reconcile() {
      for (const [pv, st] of state) if (st.visible && !st.iframe && liveCount < MAX_LIVE) activate(pv);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const st = state.get(en.target);
          st.visible = en.isIntersecting;
          if (!en.isIntersecting) deactivate(en.target);
        }
        reconcile();
      },
      { threshold: 0.35 }
    );
    cards.forEach((card) => {
      const pv = $(".preview", card);
      state.set(pv, { dir: pv.dataset.dir, iframe: null, visible: false });
      io.observe(pv);
    });
  }

  function featBadges(e) {
    const items = [
      ["♪ 音效", e.has_audio],
      ["📱 触屏", e.has_touch],
      ["💾 存档", e.uses_localstorage],
      ["📄 README", e.has_readme],
    ];
    return items.map(([t, on]) => `<span class="feat${on ? " on" : ""}">${t}</span>`).join("");
  }

  function renderEntrants(grid) {
    grid.innerHTML = ranked
      .map((e, i) => {
        const visual = e.shot
          ? `<img class="shot" src="../${esc(e.shot)}" alt="${esc(e.dir)} 游戏首屏截图" loading="lazy">`
          : `<div class="mono-fallback">${monogramSVG(e.dir)}</div>`;
        return `<article class="card lift entrant-card" data-idx="${i}">
          <div class="preview" data-dir="${esc(e.dir)}" role="button" tabindex="0" aria-label="试玩 ${esc(e.dir)}">
            ${visual}
            <span class="live-dot">LIVE</span>
          </div>
          <div class="entrant-body">
            <div class="entrant-identity">${identityHTML(e.dir)}</div>
            <div class="entrant-name"><span class="code">${esc(e.dir)}</span><span class="tag-internal">内部代号</span></div>
            <div class="feat-badges">${featBadges(e)}</div>
            <div class="entrant-meta num">
              <span>${e.files} 个文件</span><span>${fmtKB(e.bytes)}</span><span>${e.code_lines} 行</span>
            </div>
            <div class="entrant-score">
              <span class="v num" style="color:${e.score === topScore ? ACCENT : "inherit"}">${e.score}</span>
              <span class="k">静态检查分 / 100</span>
            </div>
            <button class="btn btn-primary play-btn" data-idx="${i}">▶ 试玩</button>
          </div>
        </article>`;
      })
      .join("");

    $$(".play-btn", grid).forEach((b) => b.addEventListener("click", () => openModal(+b.dataset.idx, b)));
    $$(".preview", grid).forEach((pv) => {
      const open = () => {
        const card = pv.closest(".entrant-card");
        openModal(+card.dataset.idx, pv);
      };
      pv.addEventListener("click", open);
      pv.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); }
      });
    });
    initPreviews($$(".entrant-card", grid));
  }

  /* ---------- 试玩 Modal ---------- */
  let modalIdx = -1;
  let modalOpener = null;
  function openModal(idx, opener) {
    const modal = $("#play-modal");
    modalIdx = idx;
    modalOpener = opener || null;
    const e = ranked[idx];
    $("#modal-code").textContent = e.dir;
    const wrap = $("#modal-frame-wrap");
    wrap.innerHTML = "";
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", SANDBOX);
    f.setAttribute("title", `${e.dir} 的马里奥式游戏`);
    f.src = gameURL(e.dir);
    f.addEventListener("load", () => f.focus());
    wrap.appendChild(f);
    mountHandheldControls(wrap, f);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onModalKey);
  }
  function closeModal() {
    const modal = $("#play-modal");
    $("#modal-frame-wrap").innerHTML = ""; /* 卸载 src,停掉游戏循环和音乐 */
    modal.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKey);
    if (modalOpener && modalOpener.isConnected) modalOpener.focus();
    modalIdx = -1;
  }
  function nextGame() {
    if (modalIdx < 0) return;
    openModal((modalIdx + 1) % ranked.length, modalOpener);
  }
  function onModalKey(ev) {
    if (ev.key === "Escape") closeModal();
  }

  /* ---------- API 客户端(同域 /api/*,由 Cloudflare Pages Functions 提供) ---------- */
  async function apiFetch(path, opts = {}, timeoutMs = 6000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("/api" + path, { ...opts, signal: ctrl.signal });
      let data = null;
      try { data = await res.json(); } catch { /* 非 JSON 响应 */ }
      if (!res.ok) {
        const err = new Error((data && data.error && data.error.message) || "HTTP " + res.status);
        err.code = (data && data.error && data.error.code) || "http_" + res.status;
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (!e.code) {
        const err = new Error(e.name === "AbortError" ? "请求超时" : "网络错误");
        err.code = "network";
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 对战盲投(在线=全网票池 / 离线=本机体验版) ---------- */
  const battle = {
    mode: "local",                /* "online" | "local" */
    ready: null,                  /* initBattle 的探测 promise,selftest 等它 */
    pair: null,                   /* {a:{dir}, b:{dir}}(本地模式下是完整参赛对象) */
    pairId: null,
    played: { a: false, b: false },
    voted: false,
    frames: { a: null, b: null },
    activeSide: null,
  };
  let netTotalVotes = null;       /* 最近一次全网榜的 total_votes */

  function pickPair() {
    const n = ranked.length;
    const i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * (n - 1));
    if (j >= i) j++;
    return { a: ranked[i], b: ranked[j] };
  }

  function unmountBattleSide(side) {
    const rec = battle.frames[side];
    if (rec) {
      rec.frame.remove();
      liveFrames.delete(rec.fitRecord);
      battle.frames[side] = null;
    }
    const box = $(`#battle-${side}`);
    if (!box) return;
    $$(".handheld-controls", box).forEach((n) => n.remove());
    box.classList.remove("is-playing");
    const cover = $(".battle-cover", box);
    if (cover) {
      cover.style.display = "flex";
      const label = $(".battle-cover-label", cover);
      if (label && battle.played[side]) label.firstChild.textContent = `继续试玩 ${side.toUpperCase()}`;
    }
    if (battle.activeSide === side) battle.activeSide = null;
  }

  function closeBattleStage() {
    unmountBattleSide("a");
    unmountBattleSide("b");
    $("#battle-stage").classList.remove("on");
    document.body.style.overflow = "";
  }

  function buildPanel(side) {
    const box = $(`#battle-${side}`);
    box.innerHTML = `
      <div class="battle-panel-top">
        <span class="who">作品 ${side.toUpperCase()} <span class="revealed"></span></span>
        <button class="btn btn-secondary btn-sm reload-btn" disabled aria-label="重新加载作品 ${side.toUpperCase()}">↻ 重玩</button>
      </div>
      <div class="battle-frame">
        <button class="battle-cover">
          <span class="big">▶</span>
          <span class="battle-cover-label">点击开始试玩 ${side.toUpperCase()}<br><small style="font-weight:400;color:var(--ink-3)">切换作品时，另一边会自动关闭</small></span>
        </button>
      </div>`;
    const frameBox = $(".battle-frame", box);
    const cover = $(".battle-cover", box);
    const reloadBtn = $(".reload-btn", box);
    function mount() {
      const other = side === "a" ? "b" : "a";
      unmountBattleSide(other);
      unmountBattleSide(side);
      const f = document.createElement("iframe");
      f.setAttribute("sandbox", SANDBOX);
      f.setAttribute("title", `匿名作品 ${side.toUpperCase()}`);
      f.src = gameURL(battle.pair[side].dir);
      f.addEventListener("load", () => f.focus());
      frameBox.appendChild(f);
      fitFrame(f, frameBox);
      const fitRecord = { frame: f, box: frameBox };
      liveFrames.add(fitRecord);
      battle.frames[side] = { frame: f, fitRecord };
      battle.activeSide = side;
      box.classList.add("is-playing");
      cover.style.display = "none";
      mountHandheldControls(box, f, true);
    }
    cover.addEventListener("click", () => {
      mount();
      battle.played[side] = true;
      reloadBtn.disabled = false;
      updateVoteGate();
    });
    reloadBtn.addEventListener("click", mount);
  }

  function setGate(text) {
    $("#battle-gate").textContent = text;
  }

  function updateVoteGate() {
    const both = battle.played.a && battle.played.b;
    const unlocked = !!battle.pair && both && !battle.voted;
    $$("#battle-vote button[data-vote]").forEach((b) => (b.disabled = !unlocked));
    if (battle.voted) setGate("已投票,点「下一对」继续");
    else if (!battle.pair) return; /* 领取配对失败等场景,setGate 已给出具体文案 */
    else if (!both) setGate("A、B 都打开试玩一次后即可投票");
    else setGate("两边都试过了?选出你心中更好的一款");
  }

  async function startBattle() {
    unmountBattleSide("a");
    unmountBattleSide("b");
    battle.played = { a: false, b: false };
    battle.voted = false;
    battle.pair = null;
    battle.pairId = null;
    $("#battle-stage").classList.add("on");
    document.body.style.overflow = "hidden";
    $("#battle-result").innerHTML = "";
    $("#battle-next").style.display = "none";
    $("#battle-start").textContent = "⚔ 换一对(不投票)";
    if (battle.mode === "online") {
      setGate("正在向服务器领取匿名配对…");
      $$("#battle-vote button[data-vote]").forEach((b) => (b.disabled = true));
      try {
        const p = await apiFetch("/pair?track=mario");
        battle.pair = { a: { dir: p.a.dir }, b: { dir: p.b.dir } };
        battle.pairId = p.pair_id;
      } catch (e) {
        setGate(`领取配对失败(${e.message}),点「开始/换一对」重试`);
        return;
      }
    } else {
      battle.pair = pickPair();
    }
    buildPanel("a");
    buildPanel("b");
    updateVoteGate();
  }

  function reveal(aDir, bDir) {
    const a = metaFor(aDir), b = metaFor(bDir);
    $("#battle-a .revealed").textContent = `= ${a.vendor} ${a.model} × ${a.harness} [${aDir}]`;
    $("#battle-b .revealed").textContent = `= ${b.vendor} ${b.model} × ${b.harness} [${bDir}]`;
  }
  function voteMsg(r, aDir, bDir) {
    return r === "t"
      ? "你投了平局"
      : `你投给了 <span class="mono">${esc(r === "a" ? aDir : bDir)}</span>`;
  }
  function finishReveal(r, aDir, bDir, suffix) {
    battle.voted = true;
    reveal(aDir, bDir);
    $("#battle-result").innerHTML =
      `揭晓:A = <span class="mono">${esc(aDir)}</span> · B = <span class="mono">${esc(bDir)}</span>,${voteMsg(r, aDir, bDir)}。${suffix}`;
    $("#battle-next").style.display = "inline-flex";
    updateVoteGate();
  }

  /* 网络故障时把这票落进本机票箱(明确标注不入全网池) */
  function saveVoteLocally(r) {
    const votes = loadVotes();
    votes.push({ a: battle.pair.a.dir, b: battle.pair.b.dir, r, t: Date.now() });
    saveVotes(votes);
    finishReveal(r, battle.pair.a.dir, battle.pair.b.dir, "已记入本机票箱(未入全网池)。");
    renderEloTable();
    renderBattleStats();
  }

  function handleVoteError(e, r) {
    const result = $("#battle-result");
    switch (e.code) {
      case "already_voted":
        finishReveal(r, battle.pair.a.dir, battle.pair.b.dir, "这一对已经投过票了(一 token 一票),这次没有重复计票。");
        break;
      case "rate_limited":
        result.innerHTML = "今天投满了(单设备每日 60 票),明天再来。游戏还能继续玩,投票明日解锁。";
        setGate("今日票数已用完");
        $$("#battle-vote button[data-vote]").forEach((b) => (b.disabled = true));
        $("#battle-next").style.display = "inline-flex";
        break;
      case "pair_expired":
      case "invalid_pair":
        result.innerHTML = "这对配对已过期或无效,点「下一对」换一对继续。";
        setGate("配对已失效");
        $$("#battle-vote button[data-vote]").forEach((b) => (b.disabled = true));
        $("#battle-next").style.display = "inline-flex";
        break;
      default: {
        result.innerHTML =
          `提交失败(${esc(e.message)}),这票还没进全网池。可以重试,或 ` +
          `<button class="link-btn" id="battle-fallback">把这票记到本机票箱(不入全网池)</button>`;
        const fb = $("#battle-fallback");
        if (fb) fb.addEventListener("click", () => saveVoteLocally(r), { once: true });
        updateVoteGate();
      }
    }
  }

  async function castVote(r) {
    if (!battle.pair || battle.voted || !(battle.played.a && battle.played.b)) return;

    if (battle.mode === "local") {
      const votes = loadVotes();
      votes.push({ a: battle.pair.a.dir, b: battle.pair.b.dir, r, t: Date.now() });
      saveVotes(votes);
      finishReveal(r, battle.pair.a.dir, battle.pair.b.dir, "已计入本机 Elo。");
      renderEloTable();
      renderBattleStats();
      return;
    }

    const winner = r === "a" ? "A" : r === "b" ? "B" : "tie";
    $$("#battle-vote button[data-vote]").forEach((b) => (b.disabled = true));
    setGate("正在提交到全网票池…");
    try {
      const res = await apiFetch("/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair_id: battle.pairId, winner }),
      });
      const aDir = (res.revealed && res.revealed.a_dir) || battle.pair.a.dir;
      const bDir = (res.revealed && res.revealed.b_dir) || battle.pair.b.dir;
      finishReveal(r, aDir, bDir, "已计入全网票池(新票最多延迟 60 秒上榜)。");
      refreshNetBoard();
      renderBattleStats();
    } catch (e) {
      handleVoteError(e, r);
    }
  }

  function renderBattleStats() {
    const local = loadVotes().length;
    if (battle.mode === "online") {
      const net = netTotalVotes == null ? "" : `全网累计 ${netTotalVotes} 票 · `;
      $("#battle-stats").textContent = net + (local ? `本机票箱 ${local} 票` : "本机票箱为空");
    } else {
      $("#battle-stats").textContent = local ? `本机已投 ${local} 票` : "本机还没有投票";
    }
  }

  /* ---------- 全网榜(GET /api/leaderboard) ---------- */
  async function refreshNetBoard() {
    const box = $("#net-table-box");
    try {
      const lb = await apiFetch("/leaderboard?track=mario");
      netTotalVotes = lb.total_votes;
      $("#net-meta").textContent =
        `共 ${lb.total_votes} 票 · 更新于 ${new Date(lb.updated_at * 1000).toLocaleTimeString("zh-CN")}`;
      const btNote = $("#net-bt-note");
      if (!lb.bt_ready) {
        btNote.textContent = `Bradley-Terry 强度需满 ${lb.bt_min_votes} 票才启用(当前 ${lb.total_votes} 票),此前 BT 列显示为 –,榜单按 Elo 排序。`;
        btNote.hidden = false;
      } else {
        btNote.hidden = true;
      }
      box.innerHTML = `<div class="table-wrap"><table class="data">
        <thead><tr><th>#</th><th>代号</th><th>Elo</th><th>BT 强度</th><th>胜</th><th>平</th><th>负</th><th>场次</th></tr></thead>
        <tbody>${lb.entries
          .map(
            (e, i) => `<tr>
              <td class="num">${i + 1}</td>
              <td><span class="table-identity">${identityHTML(e.dir, true)}</span><small class="table-harness">${esc(metaFor(e.dir).harness)} · ${esc(e.dir)}</small></td>
              <td class="num${i === 0 && e.games > 0 ? " best" : ""}">${e.elo}</td>
              <td class="num">${e.bt_score == null ? '<span class="cross">–</span>' : e.bt_score.toFixed(3)}</td>
              <td class="num">${e.wins}</td><td class="num">${e.ties}</td><td class="num">${e.losses}</td>
              <td class="num">${e.games}</td>
            </tr>`
          )
          .join("")}</tbody></table></div>`;
      renderBattleStats();
    } catch (e) {
      box.innerHTML = `<div class="empty-hint">全网榜加载失败(${esc(e.message)}),稍后自动重试或刷新页面。</div>`;
    }
  }

  /* ---------- 模式探测与应用 ---------- */
  function applyMode() {
    const badge = $("#battle-mode-badge");
    const title = $("#battle-note-title");
    const body = $("#battle-note-body");
    if (battle.mode === "online") {
      badge.innerHTML = '<span class="dot"></span>🌐 全网票池';
      title.textContent = "全网票池:";
      body.textContent =
        "你的投票会进入全网 Elo / Bradley-Terry 统计。规则:A、B 都打开试玩过即可投票;单设备每日上限 60 票;投完即时揭晓身份。切换作品时另一边自动关闭。";
      $("#net-board").hidden = false;
      $("#local-board").removeAttribute("open"); /* 本机记录降级为折叠小节 */
    } else {
      badge.innerHTML = '<span class="dot orange"></span>💻 本机体验版';
      title.textContent = "本机体验版:";
      body.textContent =
        "未检测到投票后端,投票只存在你这台设备的浏览器里(localStorage),下方 Elo 榜仅统计你自己的投票;全网票池部署后本页自动切换。";
      $("#net-board").hidden = true;
      $("#local-board").setAttribute("open", "");
    }
  }

  function renderEloTable() {
    const votes = loadVotes();
    const box = $("#elo-table-box");
    if (!votes.length) {
      box.innerHTML = `<div class="empty-hint">还没有投票。打完一场对战,这里会用你的投票算出本机 Elo 榜(K=32,初始 1000)。</div>`;
      return;
    }
    const rows = computeElo(votes);
    box.innerHTML = `<div class="table-wrap"><table class="data">
      <thead><tr><th>#</th><th>代号</th><th>本机 Elo</th><th>胜</th><th>平</th><th>负</th><th>场次</th></tr></thead>
      <tbody>${rows
        .map(
          (r, i) => `<tr>
            <td class="num">${i + 1}</td>
            <td><span class="table-identity">${identityHTML(r.dir, true)}</span><small class="table-harness">${esc(metaFor(r.dir).harness)} · ${esc(r.dir)}</small></td>
            <td class="num${i === 0 && r.games > 0 ? " best" : ""}">${Math.round(r.elo)}</td>
            <td class="num">${r.w}</td><td class="num">${r.t}</td><td class="num">${r.l}</td>
            <td class="num">${r.games}</td>
          </tr>`
        )
        .join("")}</tbody></table></div>`;
  }

  function initBattle() {
    $("#battle-start").addEventListener("click", startBattle);
    $("#battle-next").addEventListener("click", startBattle);
    $("#battle-close").addEventListener("click", closeBattleStage);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && $("#battle-stage").classList.contains("on") && !$("#play-modal").classList.contains("open")) closeBattleStage();
    });
    $$("#battle-vote button[data-vote]").forEach((b) =>
      b.addEventListener("click", () => castVote(b.dataset.vote))
    );
    $("#battle-clear").addEventListener("click", () => {
      if (confirm("清空本机全部盲投记录?此操作只影响这台设备。")) {
        localStorage.removeItem(VOTES_KEY);
        renderEloTable();
        renderBattleStats();
      }
    });
    renderEloTable();
    renderBattleStats();
    /* 模式探测:health 1.5s 超时,在线走全网票池,否则回落本机体验版 */
    battle.ready = (async () => {
      try {
        const h = await apiFetch("/health", {}, 1500);
        battle.mode = h && h.ok ? "online" : "local";
      } catch {
        battle.mode = "local";
      }
      applyMode();
      renderBattleStats();
      if (battle.mode === "online") await refreshNetBoard();
      return battle.mode;
    })();
  }

  /* ---------- 检查表(可排序 + 极值高亮) ---------- */
  const COLS = [
    { key: "dir", label: "代号", type: "str" },
    { key: "score", label: "静态分", type: "num", best: "max" },
    { key: "files", label: "文件数", type: "num", best: "min" },
    { key: "bytes", label: "体积", type: "num", best: "min", fmt: fmtKB },
    { key: "code_lines", label: "代码行", type: "num", best: "min" },
    { key: "single_file", label: "单文件", type: "bool" },
    { key: "loads_ok", label: "可加载", type: "bool" },
    { key: "has_audio", label: "音效", type: "bool" },
    { key: "has_touch", label: "触屏", type: "bool" },
    { key: "uses_localstorage", label: "存档", type: "bool" },
    { key: "has_readme", label: "README", type: "bool" },
  ];
  const sortState = { key: "score", asc: false };

  function renderChecklist() {
    const table = $("#checklist");
    const rows = [...D.entrants].sort((a, b) => {
      const col = COLS.find((c) => c.key === sortState.key);
      let va = a[col.key], vb = b[col.key];
      if (col.type === "str") return sortState.asc ? String(va).localeCompare(vb) : String(vb).localeCompare(va);
      va = Number(va); vb = Number(vb);
      return sortState.asc ? va - vb : vb - va;
    });
    const bests = {};
    for (const c of COLS) {
      if (!c.best) continue;
      const vals = D.entrants.map((e) => Number(e[c.key]));
      bests[c.key] = c.best === "max" ? Math.max(...vals) : Math.min(...vals);
    }
    table.querySelector("thead").innerHTML =
      "<tr>" +
      COLS.map((c) => {
        const active = c.key === sortState.key;
        const arrow = active ? (sortState.asc ? "▲" : "▼") : "";
        const ariaSort = active ? (sortState.asc ? "ascending" : "descending") : "none";
        return `<th class="sortable" data-key="${c.key}" aria-sort="${ariaSort}" scope="col" role="columnheader" tabindex="0">${c.label} <span class="arrow">${arrow}</span></th>`;
      }).join("") +
      "</tr>";
    table.querySelector("tbody").innerHTML = rows
      .map(
        (e) =>
          "<tr>" +
          COLS.map((c) => {
            const v = e[c.key];
            if (c.type === "bool") return `<td>${boolCell(v)}</td>`;
            if (c.key === "dir") return `<td><span class="table-identity">${identityHTML(e.dir, true)}</span><small class="table-harness">${esc(metaFor(e.dir).harness)} · ${esc(e.dir)}</small></td>`;
            const isBest = c.best && Number(v) === bests[c.key];
            return `<td class="num${isBest ? " best" : ""}">${c.fmt ? c.fmt(v) : v}</td>`;
          }).join("") +
          "</tr>"
      )
      .join("");
    $$("th.sortable", table).forEach((th) => {
      const act = () => {
        const k = th.dataset.key;
        if (sortState.key === k) sortState.asc = !sortState.asc;
        else { sortState.key = k; sortState.asc = COLS.find((c) => c.key === k).type === "str"; }
        renderChecklist();
      };
      th.addEventListener("click", act);
      th.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); act(); }
      });
    });
  }

  /* ---------- 复制链接 ---------- */
  function initCopyLink() {
    const btn = $("#copy-link");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const url = location.href.split("#")[0];
      let ok = false;
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = ok ? "已复制 ✓" : "复制失败";
      setTimeout(() => (btn.textContent = old), 1600);
    });
  }

  /* ---------- 赛道页入口 ---------- */
  function initMario() {
    const st = new URLSearchParams(location.search).get("selftest");
    if (st === "online") installFetchMock(); /* 必须在 initBattle 的 health 探测之前装 mock */
    renderEntrants($("#entrants"));
    renderChecklist();
    renderScatter($("#scatter"));
    initBattle();
    initCopyLink();
    $("#modal-close").addEventListener("click", closeModal);
    $("#modal-next").addEventListener("click", nextGame);
    $("#play-modal").addEventListener("click", (ev) => {
      if (ev.target === ev.currentTarget) closeModal();
    });
    $$("[data-formula]").forEach((n) => (n.textContent = D.score_formula_zh));
    if (st !== null) setTimeout(runSelfTest, 60);
  }

  /* ---------- 自测(headless 验收用,对普通访客无副作用)----------
   * ?selftest=1      本机体验版套件(离线环境,如 python3 -m http.server)
   * ?selftest=online mock fetch 的在线全流程套件(不依赖后端)
   * ?selftest=live   直连同域真实 /api 的只读+错误路径套件(wrangler pages dev 下跑)
   */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function installFetchMock() {
    const voteQueue = ["ok", "already_voted", "network", "rate_limited", "pair_expired"];
    let votes = 0;
    const J = (status, data) => Promise.resolve({ ok: status < 400, status, json: async () => data });
    window.fetch = (url) => {
      const u = String(url);
      if (u.includes("/api/health")) return J(200, { ok: true, ts: 0 });
      if (u.includes("/api/pair"))
        return J(200, {
          pair_id: "mock-pair-" + Math.random().toString(36).slice(2),
          track: "mario",
          a: { slot: "A", dir: ranked[0].dir },
          b: { slot: "B", dir: ranked[1].dir },
          issued_at: Math.floor(Date.now() / 1000),
        });
      if (u.includes("/api/leaderboard"))
        return J(200, {
          track: "mario",
          total_votes: votes,
          updated_at: Math.floor(Date.now() / 1000),
          bt_min_votes: 20,
          bt_ready: false,
          entries: ranked.map((e) => ({ dir: e.dir, elo: 1000, bt_score: null, wins: 0, losses: 0, ties: 0, games: 0 })),
        });
      if (u.includes("/api/vote")) {
        const k = voteQueue.shift() || "ok";
        if (k === "ok") { votes++; return J(200, { ok: true, revealed: { a_dir: ranked[0].dir, b_dir: ranked[1].dir } }); }
        if (k === "network") return Promise.reject(new TypeError("Failed to fetch"));
        const map = {
          already_voted: [409, "this pair_id has already been used"],
          rate_limited: [429, "daily vote limit reached (60 per day)"],
          pair_expired: [400, "pair_id has expired, request a new pair"],
        };
        return J(map[k][0], { error: { code: k, message: map[k][1] } });
      }
      return J(404, { error: { code: "not_found", message: u } });
    };
  }

  async function selftestLocal(ok) {
    await battle.ready;
    ok("mode_local", battle.mode === "local");
    ok("badge_local", $("#battle-mode-badge").textContent.includes("本机体验版"));
    ok("net_board_hidden", $("#net-board").hidden);
    ok("local_board_open", $("#local-board").open);
    /* 1) Elo 数学:d1 两胜一平 d2 */
    localStorage.removeItem(VOTES_KEY);
    const d1 = ranked[0].dir, d2 = ranked[1].dir;
    saveVotes([
      { a: d1, b: d2, r: "a", t: 1 },
      { a: d1, b: d2, r: "a", t: 2 },
      { a: d1, b: d2, r: "t", t: 3 },
    ]);
    const tb = computeElo(loadVotes());
    const r1 = tb.find((r) => r.dir === d1), r2 = tb.find((r) => r.dir === d2);
    ok("elo_winner_gt_1000", r1.elo > 1000);
    ok("elo_loser_lt_1000", r2.elo < 1000);
    ok("elo_zero_sum", Math.abs(r1.elo + r2.elo - 2000) < 1e-6);
    ok("elo_counts", r1.w === 2 && r1.t === 1 && r1.l === 0 && r2.l === 2 && r2.t === 1 && r1.games === 3);
    localStorage.removeItem(VOTES_KEY);
    /* 2) 对战流程:开战 -> 未玩不可投 -> 双开后可投 -> 投票入库并揭晓 -> 投后锁票 */
    await startBattle();
    ok("battle_fullscreen_open", $("#battle-stage").classList.contains("on") && document.body.style.overflow === "hidden");
    ok("gate_locked_before_play", $$("#battle-vote button[data-vote]").every((b) => b.disabled));
    $$(".battle-cover").forEach((c) => c.click());
    ok("gate_open_after_both_played", $$("#battle-vote button[data-vote]").every((b) => !b.disabled));
    ok("one_battle_iframe_only", $$(".battle-frame iframe").length === 1);
    await castVote("a");
    ok("vote_stored", loadVotes().length === 1);
    ok("codenames_revealed", $("#battle-result").textContent.includes("揭晓"));
    ok("gate_locked_after_vote", $$("#battle-vote button[data-vote]").every((b) => b.disabled));
    ok("elo_table_rendered", $$("#elo-table-box tbody tr").length === D.entrants.length);
    localStorage.removeItem(VOTES_KEY);
    /* 3) modal 生命周期:打开 -> 换一个 -> Esc 关闭并卸载 iframe */
    openModal(0);
    ok("modal_open_with_iframe", $("#play-modal").classList.contains("open") && !!$("#modal-frame-wrap iframe"));
    ok("handheld_controls_mounted", $$("#modal-frame-wrap .handheld-controls button[data-code]").length === 7);
    nextGame();
    ok("modal_next_switches", $("#modal-code").textContent === ranked[1].dir);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    ok("modal_esc_unloads", !$("#play-modal").classList.contains("open") && !$("#modal-frame-wrap iframe"));
    renderEloTable();
    renderBattleStats();
  }

  async function selftestOnline(ok) {
    localStorage.removeItem(VOTES_KEY);
    await battle.ready;
    ok("mode_online", battle.mode === "online");
    ok("badge_online", $("#battle-mode-badge").textContent.includes("全网票池"));
    ok("net_board_visible", !$("#net-board").hidden);
    ok("local_board_collapsed", !$("#local-board").open);
    ok("net_table_rendered", $$("#net-table-box tbody tr").length === D.entrants.length);
    ok("bt_note_shown_when_not_ready", !$("#net-bt-note").hidden);
    await startBattle();
    ok("pair_id_saved", typeof battle.pairId === "string" && battle.pairId.length > 0);
    ok("anonymous_no_dir_leak",
      !$("#battle-a").textContent.includes(battle.pair.a.dir) && !$("#battle-b").textContent.includes(battle.pair.b.dir));
    ok("gate_locked_before_play", $$("#battle-vote button[data-vote]").every((b) => b.disabled));
    $$(".battle-cover").forEach((c) => c.click());
    updateVoteGate();
    ok("gate_open_after_both_played", $$("#battle-vote button[data-vote]").every((b) => !b.disabled));
    ok("exclusive_single_iframe", $$(".battle-frame iframe").length === 1);
    /* 成功票:服务端 revealed 揭晓,不落本机票箱 */
    await castVote("a");
    ok("vote_success_net_pool", $("#battle-result").textContent.includes("全网票池"));
    ok("revealed_from_server", $("#battle-a .revealed").textContent.includes(ranked[0].dir));
    ok("online_vote_not_stored_locally", loadVotes().length === 0);
    ok("next_shown", $("#battle-next").style.display !== "none");
    await sleep(80);
    ok("net_meta_refreshed", $("#net-meta").textContent.includes("票"));
    /* 错误路径 2:already_voted -> 锁票并提示 */
    battle.voted = false;
    await castVote("b");
    ok("already_voted_locks", battle.voted === true && $("#battle-result").textContent.includes("投过"));
    /* 错误路径 3:网络错误 -> 提供本机票箱回落 */
    battle.voted = false;
    await castVote("b");
    ok("network_offers_local_fallback", !!$("#battle-fallback"));
    $("#battle-fallback").click();
    ok("fallback_saved_locally", loadVotes().length === 1 && $("#battle-result").textContent.includes("本机票箱"));
    /* 错误路径 4:429 日限 */
    battle.voted = false;
    await castVote("a");
    ok("rate_limited_friendly", $("#battle-result").textContent.includes("投满"));
    /* 错误路径 5:pair_expired -> 一键换一对 */
    battle.voted = false;
    await castVote("a");
    ok("pair_expired_offers_next",
      $("#battle-result").textContent.includes("过期") && $("#battle-next").style.display !== "none");
    localStorage.removeItem(VOTES_KEY);
  }

  async function selftestLive(ok) {
    await battle.ready;
    ok("live_mode_online", battle.mode === "online");
    ok("live_badge", $("#battle-mode-badge").textContent.includes("全网票池"));
    ok("live_net_table", $$("#net-table-box tbody tr").length === D.entrants.length);
    await startBattle();
    ok("live_pair_id_signed", typeof battle.pairId === "string" && battle.pairId.includes("."));
    $$(".battle-cover").forEach((c) => c.click());
    updateVoteGate();
    ok("live_gate_open_after_both", $$("#battle-vote button[data-vote]").every((b) => !b.disabled));
    ok("live_exclusive_single_iframe", $$(".battle-frame iframe").length === 1);
    /* 伪造 token 应得 invalid_pair */
    let code = null;
    try {
      await apiFetch("/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair_id: "forged.token", winner: "A" }),
      });
    } catch (e) { code = e.code; }
    ok("live_forged_invalid_pair", code === "invalid_pair");
  }

  async function runSelfTest() {
    const st = new URLSearchParams(location.search).get("selftest");
    const out = [];
    const ok = (name, cond) => out.push((cond ? "PASS" : "FAIL") + " " + name);
    try {
      if (st === "online") await selftestOnline(ok);
      else if (st === "live") await selftestLive(ok);
      else await selftestLocal(ok);
    } catch (err) {
      out.push("FAIL exception: " + err.message);
    }
    const div = document.createElement("div");
    div.id = "selftest-result";
    div.hidden = true;
    div.textContent = out.join(" | ");
    document.body.appendChild(div);
  }

  const page = document.body.dataset.page;
  if (page === "home") initHome();
  else if (page === "mario") initMario();
})();
