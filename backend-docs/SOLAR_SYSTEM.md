# 一句话太阳系赛道接入流程

当前 15 个计划运行位均已完成真实产物归档与核验，并开放试玩、完整排序、匿名 A/B 对战和排行榜。

## 运行前

- 唯一来源:`tracks/solar-system/_run_plan.json`。
- 每个模型收到 `prompt_template`,只把 `【目标目录】` 替换为对应 `target_dir`。
- GPT 系列通过 Codex 在 `vircs` 运行，Claude 系列通过 Claude Code 在 `vircs` 运行。
- DeepSeek V4 Pro 通过 Mac 上的 Claude Code + Claude Code Router 运行；其余非 GPT/Claude 模型通过 Mac 上的 Cursor 运行。
- 每个目标目录必须独立,入口必须是该目录内的 `index.html`。

运行 `npm run solar:plan` 可验证 15 个 slug、目标目录和机器映射没有重复或错位,并刷新前端计划数据。该命令不创建任何参赛作品。

## 单个作品完成后

- 先从真实目标目录复制到 `tracks/solar-system/<slug>/`，归档后不得修改作品源码。
- 对原目录和归档目录做逐文件哈希校验，并用浏览器实际验收。
- 运行 `npm run solar:finalize -- --partial`，只发布已有真实归档的试玩。
- 单个核验作品即可写入 D1 参赛者表，作为该赛道的真实参赛记录。
- 少于 2 份作品时不开放配对或排行榜；达到 2 份后才启用匿名盲评。

## 15 个运行全部结束后

1. `npm run solar:collect`
   - 从 `vircs` 和 Mac 的真实目标目录读取作品;
   - 先把 15 份作品全部放入临时区;
   - 任意一个缺少 `index.html` 时整体停止;
   - 全部通过后才复制到 `tracks/solar-system/<slug>/`;
   - 不修改原始目标目录,已归档目录内容不同则拒绝覆盖。
2. `npm run solar:finalize`
   - 不带 `--partial` 时要求 15 份归档全部存在;
   - 检查 `index.html` 引用的本地 JS/CSS 等文件;
   - 逐目录复制到 `frontend/games/solar-system/`;
   - 生成真实公开数据 `frontend/assets/solar-system-data.js`;
   - 生成但不执行 `db/migrations/0005_seed_solar_system.sql`;
   - 状态只改为 `ready_for_publish`,不会自动宣称已经上线。
3. 浏览器逐项验收桌面端和手机端，再开放完整赛道的试玩/盲评页面。
4. 最终确认后才执行 0005 migration、提交 GitHub 并部署 Cloudflare。

这些步骤确保“计划运行位”“已完成产物”“正式参赛者”三个状态不会混在一起。
