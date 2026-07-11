# LLM Arcade 大模型街机厅

用人人看得懂的一句话造物任务，评测“模型 × 编码 harness”组合的完整 Agent 实战能力。访客可以直接试玩真实产物，再用完整排序或匿名 A/B 对战参与社区评价。

线上网站：<https://llm-arcade.pages.dev/>

## 当前赛道

| 赛道 | 状态 | 真实作品 | 入口 |
|---|---|---:|---|
| 一句话马里奥 | LIVE | 15 | <https://llm-arcade.pages.dev/mario/> |
| 一句话太阳系 | LIVE / CONTINUING | 7 | <https://llm-arcade.pages.dev/solar-system/> |

网站当前收录 22 份已核验真实作品：马里奥 15 份，太阳系 7 份。太阳系仍继续接收其余计划运行位，但现有作品已经开放试玩、完整排序、匿名 A/B 对战和 Elo 榜。

## 排行榜如何计算

每条赛道有两种互相独立的社区评价：

1. **匿名 A/B Elo**：身份隐藏，访客两边都体验后投票，同一访客不重复判断同一组合。
2. **完整排序**：访客把该赛道全部作品从最喜欢排到最不喜欢。每位访客保留一张榜单，重新提交会覆盖自己的旧榜单。

赛道分默认按以下权重合成：

```text
赛道分 = Elo 归一化分 × 60% + 完整排序归一化分 × 40%
综合分 = Σ（赛道分 × 当前有效赛道权重）
```

如果某种评价尚无真实数据，它不会制造占位结果，其权重自动归给已有数据的方法。尚未形成有效评测的赛道也不会提前占综合榜权重。当前计划赛道权重为马里奥 50%、太阳系 50%；一条赛道产生真实社区评测后才进入当前有效权重。网站综合榜的“查看算法与赛道权重”可以查看每个模型的逐项计算。

## 仓库结构

- `frontend/`：正式网站、赛道页面和线上试玩副本。
- `functions/`：Cloudflare Pages Functions，包括配对、投票、完整排序与综合榜 API。
- `db/migrations/`：D1 数据库结构和参赛者种子数据。
- `tracks/mario/`：马里奥官方参赛作品的冻结归档。
- `tracks/solar-system/`：太阳系统一协议、运行计划和已核验作品的冻结归档。
- `community-submissions/`：社区自行运行作品的提交说明和 manifest 模板，不会未经核验自动进入官方榜。
- `scripts/`：数据检查、运行计划、归档和前端数据生成脚本。
- `backend-docs/`：部署、后端协议和太阳系接入流程。

官方归档作品不得因页面展示、测试结果或用户反馈而修改。触屏控制、缩放和评测功能必须在网站外层实现。

## 本地运行

需要 Node.js 18+。

```bash
npm install
npm run db:migrate:local
npm run dev
```

本地地址通常为 <http://127.0.0.1:8788/>。运行纯逻辑测试：

```bash
npm run smoke
```

## 开放 API

- 马里奥 Elo 明细：<https://llm-arcade.pages.dev/api/leaderboard?track=mario>
- 马里奥完整排序：<https://llm-arcade.pages.dev/api/rankings?track=mario>
- 太阳系 Elo 明细：<https://llm-arcade.pages.dev/api/leaderboard?track=solar-system>
- 太阳系完整排序：<https://llm-arcade.pages.dev/api/rankings?track=solar-system>
- 跨评测方法与赛道的综合榜：<https://llm-arcade.pages.dev/api/arcade-index>

## 如何贡献

欢迎提交：

- 新赛道建议；
- 页面、手机端、评测算法或文档改进；
- 可复现的 Bug；
- 你使用模型和 Agent 自己运行完成的真实网页作品。

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。GitHub 已提供赛道提案、改进建议、Bug 和作品提交模板。社区作品可以通过 Issue 提供文件或链接，也可以按 `community-submissions/` 目录格式提交 Pull Request。

部署和运维说明见 [backend-docs/DEPLOY.md](backend-docs/DEPLOY.md)，太阳系运行与接入流程见 [backend-docs/SOLAR_SYSTEM.md](backend-docs/SOLAR_SYSTEM.md)。
