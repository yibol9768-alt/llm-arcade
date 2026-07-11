(() => {
  "use strict";
  const plan = window.SOLAR_SYSTEM_RUN_PLAN;
  const meta = window.ARCADE_ENTRANT_META || {};
  if (!plan) return;

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const modelMeta = (model) => Object.values(meta).find((item) => item.model === model) || null;
  const logoHTML = (run) => {
    const item = modelMeta(run.model);
    const mark = item ? item.vendor_mark : run.vendor.slice(0, 2);
    const logo = item && item.vendor_logo
      ? `<img src="${esc(item.vendor_logo)}" alt="" referrerpolicy="no-referrer">`
      : "";
    return `<span class="vendor-mark vendor-${esc(item ? item.vendor_class : "unknown")}" title="${esc(run.vendor)}">${logo}<span class="vendor-fallback">${esc(mark)}</span></span>`;
  };

  const prompt = document.querySelector("#solar-prompt");
  if (prompt) prompt.textContent = plan.prompt_template;
  const count = document.querySelector("#solar-plan-count");
  if (count) count.textContent = String(plan.runs.length);

  const groups = [
    { key: "Claude Code · vircs", title: "Claude Code", machine: "vircs", runs: plan.runs.filter((r) => r.harness === "Claude Code") },
    { key: "Codex · vircs", title: "Codex", machine: "vircs", runs: plan.runs.filter((r) => r.harness === "Codex") },
    { key: "Cursor · Mac", title: "Cursor", machine: "Mac", runs: plan.runs.filter((r) => r.harness === "Cursor") },
  ];
  const root = document.querySelector("#solar-run-groups");
  if (!root) return;
  root.innerHTML = groups.map((group) => `
    <section class="solar-run-group">
      <div class="solar-run-group-head">
        <div><span>${esc(group.machine)}</span><h2>${esc(group.title)}</h2></div>
        <b>${group.runs.length} 个计划运行位</b>
      </div>
      <div class="solar-run-list">
        ${group.runs.map((run, index) => `
          <article class="solar-run-row">
            <span class="solar-run-no">${String(index + 1).padStart(2, "0")}</span>
            <div class="solar-run-model">${logoHTML(run)}<span><b>${esc(run.model)}</b><small>${esc(run.vendor)} · ${esc(run.harness)}</small></span></div>
            <code>${esc(run.target_dir)}</code>
            <em>未运行</em>
          </article>`).join("")}
      </div>
    </section>`).join("");
})();
