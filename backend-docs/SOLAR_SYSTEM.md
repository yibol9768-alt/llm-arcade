# 一句话太阳系赛道接入流程

当前只公开统一协议和 15 个计划运行位。作品尚未运行时,不得创建试玩、截图、排行榜、评分或 D1 参赛者记录。

## 运行前

- 唯一来源:`tracks/solar-system/_run_plan.json`。
- 每个模型收到 `prompt_template`,只把 `【目标目录】` 替换为对应 `target_dir`。
- Claude Code 与 Codex 在 `vircs` 运行;其余模型在 Mac 的 Cursor 运行。
- 每个目标目录必须独立,入口必须是该目录内的 `index.html`。

运行 `npm run solar:plan` 可验证 15 个 slug、目标目录和机器映射没有重复或错位,并刷新前端计划数据。该命令不创建任何参赛作品。

## 15 个运行全部结束后

1. `npm run solar:collect`
   - 从 `vircs` 和 Mac 的真实目标目录读取作品;
   - 先把 15 份作品全部放入临时区;
   - 任意一个缺少 `index.html` 时整体停止;
   - 全部通过后才复制到 `tracks/solar-system/<slug>/`;
   - 不修改原始目标目录,已归档目录内容不同则拒绝覆盖。
2. `npm run solar:finalize`
   - 要求 15 份归档全部存在;
   - 检查 `index.html` 引用的本地 JS/CSS 等文件;
   - 逐目录复制到 `frontend/games/solar-system/`;
   - 生成真实公开数据 `frontend/assets/solar-system-data.js`;
   - 生成但不执行 `db/migrations/0005_seed_solar_system.sql`;
   - 状态只改为 `ready_for_publish`,不会自动宣称已经上线。
3. 浏览器逐项验收桌面端和手机端,补齐真实截图与赛道试玩/盲评页面。
4. 最终确认后才执行 0005 migration、提交 GitHub 并部署 Cloudflare。

这些步骤确保“计划运行位”“已完成产物”“正式参赛者”三个状态不会混在一起。
