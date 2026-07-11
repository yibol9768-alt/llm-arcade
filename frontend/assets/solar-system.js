(() => {
  "use strict";
  const plan = window.SOLAR_SYSTEM_RUN_PLAN;
  const data = window.SOLAR_SYSTEM_DATA || { entrants: [] };
  const meta = window.ARCADE_ENTRANT_META || {};
  if (!plan) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const gameURL = (dir) => `../games/solar-system/${encodeURIComponent(dir)}/index.html`;
  const entrantByDir = new Map(data.entrants.map((entrant) => [entrant.dir, entrant]));
  const modelMeta = (entrant) => Object.values(meta).find((item) => item.model === entrant.display_name) || null;
  const identity = (dir) => {
    const entrant = entrantByDir.get(dir);
    return entrant ? `${entrant.vendor} · ${entrant.display_name} × ${entrant.harness}` : dir;
  };
  const logoHTML = (entrant) => {
    const item = modelMeta(entrant);
    const mark = item ? item.vendor_mark : entrant.vendor.slice(0, 2);
    const logo = item?.vendor_logo
      ? `<img src="${esc(item.vendor_logo)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="vendor-fallback">${esc(mark)}</span>`
      : esc(mark);
    return `<span class="vendor-mark vendor-${esc(item?.vendor_class || "unknown")}" title="${esc(entrant.vendor)}">${logo}</span>`;
  };
  const identityHTML = (entrant) => `${logoHTML(entrant)}<span class="identity-copy"><b>${esc(entrant.vendor)}</b><strong>${esc(entrant.display_name)}</strong><small>${esc(entrant.harness)} · ${esc(entrant.machine)}</small></span>`;

  $("#solar-prompt").textContent = plan.prompt_template;
  $("#solar-complete-count").textContent = String(data.entrants.length);

  const groups = [
    { title: "Claude Code", machine: "vircs", runs: plan.runs.filter((run) => run.harness === "Claude Code") },
    { title: "Codex", machine: "vircs", runs: plan.runs.filter((run) => run.harness === "Codex") },
    { title: "Cursor", machine: "Mac", runs: plan.runs.filter((run) => run.harness === "Cursor") },
  ];
  $("#solar-run-groups").innerHTML = groups.map((group) => `
    <section class="solar-run-group"><div class="solar-run-group-head"><div><span>${esc(group.machine)}</span><h2>${esc(group.title)}</h2></div><b>${group.runs.length} 个计划运行位</b></div>
    <div class="solar-run-list">${group.runs.map((run, index) => `<article class="solar-run-row"><span class="solar-run-no">${String(index + 1).padStart(2, "0")}</span><div class="solar-run-model"><span><b>${esc(run.model)}</b><small>${esc(run.vendor)} · ${esc(run.harness)}</small></span></div><code>${esc(run.target_dir)}</code><em class="${run.status === "completed_verified" ? "is-verified" : ""}">${run.status === "completed_verified" ? "已核验" : "未运行"}</em></article>`).join("")}</div></section>`).join("");

  let modalIndex = 0;
  const openModal = (index) => {
    if (!data.entrants.length) return;
    modalIndex = (index + data.entrants.length) % data.entrants.length;
    const entrant = data.entrants[modalIndex];
    $("#solar-modal-position").textContent = `${String(modalIndex + 1).padStart(2, "0")} / ${String(data.entrants.length).padStart(2, "0")}`;
    $("#solar-modal-code").textContent = entrant.dir;
    $("#solar-modal-identity").textContent = identity(entrant.dir);
    $("#solar-modal-frame-wrap").innerHTML = `<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen; autoplay" title="${esc(entrant.display_name)} 的太阳系作品" src="${esc(gameURL(entrant.dir))}"></iframe>`;
    $("#solar-play-modal").classList.add("open");
    document.body.style.overflow = "hidden";
    $("#solar-modal-close").focus();
  };
  const closeModal = () => {
    $("#solar-play-modal").classList.remove("open");
    $("#solar-modal-frame-wrap").innerHTML = "";
    document.body.style.overflow = "";
  };

  const entrantGrid = $("#solar-entrants");
  if (!data.entrants.length) {
    entrantGrid.innerHTML = '<div class="empty-hint">作品正在收集中。真实产物通过核验后会出现在这里。</div>';
  } else {
    entrantGrid.innerHTML = data.entrants.map((entrant, index) => `<article class="card lift entrant-card" data-solar-index="${index}">
      <div class="preview solar-live-preview" data-solar-preview="${esc(entrant.dir)}" role="button" tabindex="0" aria-label="试玩 ${esc(entrant.display_name)}"><iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock" title="" tabindex="-1" aria-hidden="true" src="${esc(gameURL(entrant.dir))}"></iframe><span class="live-dot">LIVE</span></div>
      <div class="entrant-body"><div class="entrant-identity">${logoHTML(entrant)}<span class="identity-copy"><b>${esc(entrant.vendor)}</b><strong>${esc(entrant.display_name)} × ${esc(entrant.harness)}</strong><small>${esc(entrant.machine)} · 原始作品已核验</small></span></div><div class="entrant-name"><span class="code">${esc(entrant.dir)}</span><span class="tag-internal">内部代号</span></div><div class="feat-badges"><span class="feat on">✓ 可加载</span><span class="feat on">🪐 九大行星</span><span class="feat on">🖱 可交互</span></div><div class="entrant-meta num"><span>${entrant.files} 个文件</span><span>${(entrant.bytes / 1024).toFixed(1)} KB</span><span>${entrant.code_lines} 行</span></div><button class="btn btn-primary play-btn" data-solar-open="${index}">▶ 试玩</button></div>
    </article>`).join("");
    $$('[data-solar-open]').forEach((button) => button.addEventListener("click", () => openModal(Number(button.dataset.solarOpen))));
    $$('[data-solar-preview]').forEach((preview) => {
      const open = () => openModal(Number(preview.closest("[data-solar-index]").dataset.solarIndex));
      preview.addEventListener("click", open);
      preview.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    });
  }
  $("#solar-modal-close").addEventListener("click", closeModal);
  $("#solar-modal-next").addEventListener("click", () => openModal(modalIndex + 1));
  $("#solar-play-modal").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && $("#solar-play-modal").classList.contains("open")) closeModal(); });
  $("#copy-link").addEventListener("click", async (event) => {
    try { await navigator.clipboard.writeText(location.href.split("#")[0]); event.currentTarget.textContent = "已复制 ✓"; }
    catch { event.currentTarget.textContent = "复制失败"; }
  });

  const battle = { mode: "local", pair: null, pairId: null, played: { a: false, b: false }, voted: false, judged: 0 };
  const votesKey = "arcade_solar_system_votes_v1";
  const loadVotes = () => { try { return JSON.parse(localStorage.getItem(votesKey) || "[]"); } catch { return []; } };
  const saveVotes = (votes) => localStorage.setItem(votesKey, JSON.stringify(votes));
  const api = async (path, options = {}) => {
    const response = await fetch(`/api${path}`, options);
    const body = await response.json().catch(() => null);
    if (!response.ok) { const error = new Error(body?.error?.message || `HTTP ${response.status}`); error.code = body?.error?.code; throw error; }
    return body;
  };

  /* 完整排序与 A/B Elo 分开记录，每位访客在本赛道保留一张可更新榜单。 */
  const rankingDraftKey = "arcade_solar_system_complete_ranking_draft_v1";
  const completeRanking = { order: [], saved: [], loading: true };
  const validCompleteOrder = (order) => {
    if (!Array.isArray(order) || order.length !== data.entrants.length) return false;
    const expected = new Set(data.entrants.map((entrant) => entrant.dir));
    return new Set(order).size === expected.size && order.every((dir) => expected.has(dir));
  };
  const shuffledEntrantDirs = () => {
    const order = data.entrants.map((entrant) => entrant.dir);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };
  const saveRankingDraft = () => {
    try { localStorage.setItem(rankingDraftKey, JSON.stringify(completeRanking.order)); } catch { /* ignore */ }
  };
  const rankingEntrant = (dir) => entrantByDir.get(dir);
  const renderCompleteRankingEditor = () => {
    const list = $("#solar-ranking-sort-list");
    if (!list) return;
    list.innerHTML = completeRanking.order.map((dir, index) => {
      const entrant = rankingEntrant(dir);
      const entrantIndex = data.entrants.findIndex((item) => item.dir === dir);
      return `<li class="ranking-sort-item" draggable="true" data-ranking-dir="${esc(dir)}" data-ranking-index="${index}">
        <span class="ranking-position">${String(index + 1).padStart(2, "0")}</span>
        <span class="ranking-drag" aria-hidden="true">⠿</span>
        <span class="ranking-item-identity">${identityHTML(entrant)}</span>
        <span class="ranking-item-actions">
          <button type="button" class="ranking-play" data-ranking-play="${entrantIndex}" aria-label="探索 ${esc(entrant.display_name)}">探索</button>
          <button type="button" data-ranking-move="up" ${index === 0 ? "disabled" : ""} aria-label="将 ${esc(entrant.display_name)} 上移">↑</button>
          <button type="button" data-ranking-move="down" ${index === completeRanking.order.length - 1 ? "disabled" : ""} aria-label="将 ${esc(entrant.display_name)} 下移">↓</button>
        </span>
      </li>`;
    }).join("");
    $$('[data-ranking-move]', list).forEach((button) => button.addEventListener("click", () => {
      const from = Number(button.closest("[data-ranking-index]").dataset.rankingIndex);
      const to = button.dataset.rankingMove === "up" ? from - 1 : from + 1;
      if (to < 0 || to >= completeRanking.order.length) return;
      [completeRanking.order[from], completeRanking.order[to]] = [completeRanking.order[to], completeRanking.order[from]];
      saveRankingDraft();
      renderCompleteRankingEditor();
      $(`[data-ranking-index="${to}"] [data-ranking-move="${button.dataset.rankingMove}"]`, list)?.focus();
      $("#solar-ranking-save-status").textContent = "排序已修改，提交后计入大家的结果。";
    }));
    $$('[data-ranking-play]', list).forEach((button) => button.addEventListener("click", () => openModal(Number(button.dataset.rankingPlay))));
    $$(".ranking-sort-item", list).forEach((item) => {
      item.addEventListener("dragstart", (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.dataset.rankingIndex);
        item.classList.add("is-dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("is-dragging"));
      item.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData("text/plain"));
        const to = Number(item.dataset.rankingIndex);
        if (!Number.isInteger(from) || from === to) return;
        const [moved] = completeRanking.order.splice(from, 1);
        completeRanking.order.splice(to, 0, moved);
        saveRankingDraft();
        renderCompleteRankingEditor();
        $("#solar-ranking-save-status").textContent = "排序已修改，提交后计入大家的结果。";
      });
    });
  };
  const renderCompleteRankingConsensus = (payload) => {
    const box = $("#solar-ranking-consensus-list");
    if (!box) return;
    const total = Number(payload.total_ballots || 0);
    $("#solar-ranking-ballot-count").textContent = `${total} 份榜单`;
    if (!total) {
      box.innerHTML = '<div class="empty-hint">还没有完整排序票。提交第一张榜单后，这里会显示平均名次。</div>';
      return;
    }
    box.innerHTML = payload.entries.map((entry, index) => {
      const entrant = rankingEntrant(entry.dir);
      return `<div class="ranking-consensus-row"><span class="ranking-consensus-rank">#${index + 1}</span><span class="ranking-consensus-identity">${identityHTML(entrant)}</span><span class="ranking-average"><b>${Number(entry.average_rank).toFixed(2)}</b><small>平均名次</small></span></div>`;
    }).join("");
  };
  const loadCompleteRanking = async () => {
    const status = $("#solar-ranking-save-status");
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(rankingDraftKey) || "null"); } catch { draft = null; }
    try {
      const payload = await api("/rankings?track=solar-system");
      completeRanking.saved = validCompleteOrder(payload.my_order) ? [...payload.my_order] : [];
      completeRanking.order = completeRanking.saved.length ? [...completeRanking.saved] : validCompleteOrder(draft) ? [...draft] : shuffledEntrantDirs();
      renderCompleteRankingConsensus(payload);
      status.textContent = completeRanking.saved.length ? "已载入你上次提交的榜单，可以修改后再次提交。" : "初始顺序已随机打乱，请从最喜欢排到最不喜欢。";
    } catch {
      completeRanking.order = validCompleteOrder(draft) ? [...draft] : shuffledEntrantDirs();
      status.textContent = "暂时未连接到完整排序票池；你的调整会先保存在这台设备。";
    }
    completeRanking.loading = false;
    saveRankingDraft();
    renderCompleteRankingEditor();
  };
  const initCompleteRanking = () => {
    const list = $("#solar-ranking-sort-list");
    if (!list || data.entrants.length < 2) return;
    $("#solar-ranking-shuffle").addEventListener("click", () => {
      completeRanking.order = shuffledEntrantDirs(); saveRankingDraft(); renderCompleteRankingEditor();
      $("#solar-ranking-save-status").textContent = "已重新随机打乱，提交后才会计入结果。";
    });
    $("#solar-ranking-reset").addEventListener("click", () => {
      completeRanking.order = completeRanking.saved.length ? [...completeRanking.saved] : shuffledEntrantDirs(); saveRankingDraft(); renderCompleteRankingEditor();
      $("#solar-ranking-save-status").textContent = completeRanking.saved.length ? "已恢复到你上次提交的榜单。" : "你还没有提交记录，已生成新的随机顺序。";
    });
    $("#solar-ranking-submit").addEventListener("click", async (event) => {
      if (completeRanking.loading || !validCompleteOrder(completeRanking.order)) return;
      const button = event.currentTarget;
      button.disabled = true;
      $("#solar-ranking-save-status").textContent = "正在提交完整排序…";
      try {
        const payload = await api("/rankings?track=solar-system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: completeRanking.order }) });
        completeRanking.saved = [...completeRanking.order];
        renderCompleteRankingConsensus(payload);
        $("#solar-ranking-save-status").textContent = "提交成功。以后重新排序并提交，会覆盖你自己的上一张榜单。";
      } catch (error) {
        $("#solar-ranking-save-status").textContent = `提交失败：${error.message}。当前顺序已保存在这台设备。`;
      } finally { button.disabled = false; }
    });
    loadCompleteRanking();
  };
  initCompleteRanking();

  const pairKey = (a, b) => [a, b].sort().join("|");
  const localPair = () => {
    const seen = new Set(loadVotes().map((vote) => pairKey(vote.a, vote.b)));
    const candidates = [];
    for (let i = 0; i < data.entrants.length; i++) for (let j = i + 1; j < data.entrants.length; j++) if (!seen.has(pairKey(data.entrants[i].dir, data.entrants[j].dir))) candidates.push([data.entrants[i].dir, data.entrants[j].dir]);
    if (!candidates.length) return null;
    const pair = candidates[Math.floor(Math.random() * candidates.length)];
    return Math.random() < .5 ? { a: pair[0], b: pair[1] } : { a: pair[1], b: pair[0] };
  };
  const setGate = (text) => { $("#solar-battle-gate").textContent = text; };
  const updateGate = () => {
    const ready = battle.pair && battle.played.a && battle.played.b && !battle.voted;
    $$('[data-solar-vote]').forEach((button) => { button.disabled = !ready; });
    if (battle.voted) setGate("已投票，点『下一对』继续");
    else if (battle.pair && !ready) setGate("A、B 都打开探索一次后即可投票");
    else if (ready) setGate("两边都试过了？选出你心中更好的一款");
  };
  const mountSide = (side) => {
    const other = side === "a" ? "b" : "a";
    $(`#solar-battle-${other} iframe`)?.remove();
    $(`#solar-battle-${other}`).classList.remove("is-playing");
    const box = $(`#solar-battle-${side}`);
    const frameBox = $(".battle-frame", box);
    frameBox.querySelector("iframe")?.remove();
    frameBox.insertAdjacentHTML("beforeend", `<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen" title="匿名作品 ${side.toUpperCase()}" src="${esc(gameURL(battle.pair[side]))}"></iframe>`);
    box.classList.add("is-playing");
    $(".battle-cover", box).style.display = "none";
    battle.played[side] = true;
    updateGate();
  };
  const buildSide = (side) => {
    const box = $(`#solar-battle-${side}`);
    box.innerHTML = `<div class="battle-panel-top"><span class="who">作品 ${side.toUpperCase()} <span class="revealed"></span></span></div><div class="battle-frame"><button class="battle-cover"><span class="big">▶</span><span class="battle-cover-label">点击开始探索 ${side.toUpperCase()}<br><small style="font-weight:400;color:var(--ink-3)">切换作品时，另一边会自动关闭</small></span></button></div>`;
    $(".battle-cover", box).addEventListener("click", () => mountSide(side));
  };
  const startBattle = async () => {
    if (data.entrants.length < 2) return;
    battle.pair = null; battle.pairId = null; battle.played = { a: false, b: false }; battle.voted = false;
    $("#solar-battle-result").textContent = "";
    $("#solar-battle-next").style.display = "none";
    $("#solar-battle-stage").classList.add("on");
    document.body.style.overflow = "hidden";
    setGate("正在领取匿名配对…");
    try {
      if (battle.mode === "online") {
        const pair = await api("/pair?track=solar-system");
        battle.pair = { a: pair.a.dir, b: pair.b.dir }; battle.pairId = pair.pair_id; battle.judged = Number(pair.judged_matchups || 0);
      } else battle.pair = localPair();
      if (!battle.pair) { setGate("当前不同对决已经全部判断"); return; }
      buildSide("a"); buildSide("b"); updateGate();
    } catch (error) { setGate(error.code === "track_complete" ? "你已判断当前全部不同组合" : `领取配对失败：${error.message}`); }
  };
  const closeBattle = () => { $("#solar-battle-stage").classList.remove("on"); $$("#solar-battle-stage iframe").forEach((frame) => frame.remove()); document.body.style.overflow = ""; };
  const renderLeaderboard = async () => {
    if (battle.mode !== "online") return;
    try {
      const board = await api("/leaderboard?track=solar-system");
      $("#solar-net-board").hidden = false;
      $("#solar-net-meta").textContent = `共 ${board.total_votes} 票`;
      $("#solar-net-table-box").innerHTML = `<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>模型</th><th>Elo</th><th>胜</th><th>平</th><th>负</th><th>场次</th></tr></thead><tbody>${board.entries.map((entry, index) => `<tr><td class="num">${index + 1}</td><td>${esc(identity(entry.dir))}</td><td class="num">${entry.elo}</td><td class="num">${entry.wins}</td><td class="num">${entry.ties}</td><td class="num">${entry.losses}</td><td class="num">${entry.games}</td></tr>`).join("")}</tbody></table></div>`;
    } catch { $("#solar-net-board").hidden = true; }
  };
  const castVote = async (result) => {
    if (!battle.pair || battle.voted || !battle.played.a || !battle.played.b) return;
    try {
      if (battle.mode === "online") await api("/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pair_id: battle.pairId, winner: result === "a" ? "A" : result === "b" ? "B" : "tie" }) });
      else { const votes = loadVotes(); votes.push({ a: battle.pair.a, b: battle.pair.b, r: result, t: Date.now() }); saveVotes(votes); }
      battle.voted = true;
      $("#solar-battle-a .revealed").textContent = `= ${identity(battle.pair.a)}`;
      $("#solar-battle-b .revealed").textContent = `= ${identity(battle.pair.b)}`;
      $("#solar-battle-result").textContent = battle.mode === "online" ? "身份已揭晓，这票已进入全网票池。" : "身份已揭晓，这票已记在本机。";
      $("#solar-battle-next").style.display = "inline-flex";
      updateGate(); renderLeaderboard();
    } catch (error) { $("#solar-battle-result").textContent = `提交失败：${error.message}`; updateGate(); }
  };

  if (data.entrants.length < 2) {
    $("#solar-battle-badge").innerHTML = '<span class="dot orange"></span>等待第二份作品';
    $("#solar-battle-note-title").textContent = "已接入用户评测体系：";
    $("#solar-battle-note-body").textContent = `当前只有 ${data.entrants.length} 份真实作品，无法组成匿名对战。第二份核验作品加入后将自动开放配对、投票和 Elo 榜。`;
    $("#solar-battle-start").disabled = true;
    $("#solar-battle-start").textContent = "等待第二份作品";
  } else {
    $("#solar-battle-note-title").textContent = "匿名盲评：";
    $("#solar-battle-note-body").textContent = "系统优先补齐最缺票的组合，同一位访客不会重复判断同一组。";
    api("/health").then((health) => { battle.mode = health?.ok ? "online" : "local"; }).catch(() => { battle.mode = "local"; }).finally(() => {
      $("#solar-battle-badge").innerHTML = battle.mode === "online" ? '<span class="dot"></span>🌐 全网票池' : '<span class="dot orange"></span>💻 本机体验版';
      renderLeaderboard();
    });
  }
  $("#solar-battle-start").addEventListener("click", startBattle);
  $("#solar-battle-next").addEventListener("click", startBattle);
  $("#solar-battle-close").addEventListener("click", closeBattle);
  $$('[data-solar-vote]').forEach((button) => button.addEventListener("click", () => castVote(button.dataset.solarVote)));
})();
