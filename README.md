# LLM Arcade 大模型街机厅

用人人看得懂的一句话造物任务，评测模型与编码 harness 组合的 agent 实战能力。

- `frontend/`：正式网站与 15 个可玩马里奥成品
- `functions/`：Cloudflare Pages Functions 投票 API
- `db/migrations/`：D1 数据库结构与马里奥赛道种子数据
- `tracks/mario/`：只读的原始参赛成品与赛道元数据
- `tracks/solar-system/`：太阳系统一协议、15 个计划运行位与未来只读归档

太阳系运行与接入闸门见 `backend-docs/SOLAR_SYSTEM.md`。当前没有已完成的太阳系参赛作品。

部署和运维说明见 `backend-docs/DEPLOY.md`。
