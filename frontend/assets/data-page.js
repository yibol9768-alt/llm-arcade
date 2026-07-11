(() => {
  "use strict";
  const meta = window.ARCADE_ENTRANT_META || {};
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function identity(entry) {
    const item = meta[entry.dir] || { vendor: "待确认", model: entry.dir, harness: "待确认", vendor_mark: "?", vendor_class: "unknown", vendor_logo: "" };
    const logo = item.vendor_logo
      ? `<img src="${esc(item.vendor_logo)}" alt="" referrerpolicy="no-referrer"><span>${esc(item.vendor_mark)}</span>`
      : `<span>${esc(item.vendor_mark)}</span>`;
    return `<div class="data-model"><i class="vendor-mark vendor-${esc(item.vendor_class)}" title="${esc(item.vendor)}">${logo}</i><span><b>${esc(item.model)}</b><small>${esc(item.vendor)} · ${esc(item.harness)} · ${esc(entry.dir)}</small></span></div>`;
  }

  function formatTime(seconds) {
    if (!seconds) return "尚无更新时间";
    return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(seconds * 1000));
  }

  async function loadBoard() {
    const status = $("#data-status");
    const refresh = $("#data-refresh");
    refresh.disabled = true;
    status.className = "data-status loading";
    status.textContent = "正在连接全网投票池…";
    try {
      const response = await fetch("../api/leaderboard?track=mario", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      $("#data-total-votes").textContent = Number(data.total_votes || 0).toLocaleString("zh-CN");
      $("#data-updated").textContent = `最近更新 ${formatTime(data.updated_at)}`;
      $("#data-board-body").innerHTML = data.entries.map((entry, index) => `<tr>
        <td><span class="data-rank${index < 3 ? ` top-${index + 1}` : ""}">${String(index + 1).padStart(2, "0")}</span></td>
        <td>${identity(entry)}</td>
        <td><strong class="data-elo">${Number(entry.elo).toFixed(1)}</strong></td>
        <td>${entry.wins}</td><td>${entry.ties}</td><td>${entry.losses}</td><td>${entry.games}</td>
        <td>${entry.bt_score == null ? `<span class="data-pending">待解锁</span>` : (entry.bt_score * 100).toFixed(2) + "%"}</td>
      </tr>`).join("");
      status.className = "data-status ready";
      status.textContent = `${data.entries.length} 个参赛组合 · ${data.total_votes} 张有效选票 · ${data.bt_ready ? "BT 强度已启用" : `BT 强度将在 ${data.bt_min_votes} 票后启用`}`;
    } catch (error) {
      status.className = "data-status error";
      status.textContent = "排行榜暂时没有连上，请稍后刷新。原始数据接口仍可单独打开。";
      $("#data-board-body").innerHTML = `<tr><td colspan="8" class="data-empty">暂时无法读取排行榜</td></tr>`;
    } finally {
      refresh.disabled = false;
    }
  }

  $("#data-refresh").addEventListener("click", loadBoard);
  document.querySelectorAll("[data-copy-api]").forEach((button) => button.addEventListener("click", async (event) => {
    const label = event.currentTarget.textContent;
    const url = new URL(event.currentTarget.dataset.copyApi, location.href).href;
    try { await navigator.clipboard.writeText(url); event.currentTarget.textContent = "已复制 ✓"; }
    catch { event.currentTarget.textContent = "复制失败，请长按地址"; }
    setTimeout(() => { event.currentTarget.textContent = label; }, 1800);
  }));
  loadBoard();
})();
