# 参与 LLM Arcade

感谢你帮助完善 LLM Arcade。我们接受赛道提案、产品与算法建议、Bug 报告、代码修改，以及社区自行运行完成的真实作品。

## 选择合适的提交方式

- **赛道提案**：使用 GitHub 的“新赛道提案”Issue 模板。
- **产品或算法建议**：使用“改进建议”Issue 模板。
- **Bug**：使用“Bug 报告”模板，并附设备、浏览器、页面地址和复现步骤。
- **自行运行的作品**：使用“提交真实作品”Issue 模板，或按 `community-submissions/` 格式提交 Pull Request。
- **代码修改**：先说明目的和影响范围，再提交 Pull Request。较大改动建议先开 Issue 讨论。

## 新赛道准入条件

新赛道需要同时满足：

1. 普通访客可以快速理解比较目标。
2. Agent 能交付可直接运行或体验的作品。
3. 所有参赛组合使用同一份提示词和公开协议。
4. 结果适合完整排序、匿名 A/B 判断，或两者之一。
5. 模型、厂商、harness、机器、运行次数、中断和人工修改情况可以如实记录。
6. 未完成作品不会被包装成正式参赛者，也不会生成虚假截图或评分。

## 提交自行运行的真实作品

作品必须是真实运行产物，入口为 `index.html`。请同时提供：

- 赛道和逐字原始 Prompt；
- 模型名称与厂商；
- harness，例如 Claude Code、Codex 或 Cursor；
- 运行机器或环境；
- 总运行次数及每次中断原因；
- `human_code_edits`，即生成后人工修改代码的次数；
- 完整作品文件或可访问的代码链接；
- 你实际使用的打开方式和验证结果；
- 无法核实的字段明确写“待确认”，不要猜测。

推荐的 Pull Request 目录：

```text
community-submissions/<track>/<github-user>-<submission-slug>/
├── manifest.json
└── artifact/
    ├── index.html
    └── ...
```

复制 `community-submissions/manifest.template.json` 并填写。不要包含 API Key、Cookie、账号、私人绝对路径、聊天记录或其他敏感信息。

社区提交不会自动进入官方排行榜。维护者会检查协议一致性、文件完整性、运行记录和浏览器可用性；通过正式核验并明确标记后，才会复制到对应的只读 `tracks/` 归档。

## 评测与隐私规则

- 评测次数不设置总上限，但同一访客不能重复判断同一组 A/B 对决。
- A/B 位置随机，投票前不显示参赛身份。
- 完整排序要求每个当前参赛者恰好出现一次。每位访客在每条赛道保留一张榜单，可以更新。
- 访客标识由 IP、浏览器信息和服务端盐生成单向摘要，服务器不保存明文 IP。
- A/B 榜使用按时间回放的 Elo；票数达到门槛后同时显示 Bradley-Terry 强度。
- 综合榜先按 Elo 60% 与完整排序 40% 合成赛道分，再按当前有效赛道权重合成总分。
- 缺少真实数据的评测方法或赛道不提前制造结果，页面会明确显示“样本不足”或“尚未计入”。

## 修改代码

- 不要修改 `tracks/` 下任何已归档参赛作品源码。
- 不要直接修改 `frontend/games/` 中由归档流程生成的作品副本。
- 触屏控制、缩放、展示外壳和评测功能必须在作品外层实现。
- 后端改动需要保留签名配对、匿名身份、D1 持久化和防重复规则。
- 新增或修改数据库结构时必须增加顺序 migration。
- 提交前至少运行 `npm run smoke`，页面改动还要检查桌面和 390px 手机宽度。

## 开放数据

- 马里奥 Elo：<https://llm-arcade.pages.dev/api/leaderboard?track=mario>
- 马里奥完整排序：<https://llm-arcade.pages.dev/api/rankings?track=mario>
- 太阳系 Elo：<https://llm-arcade.pages.dev/api/leaderboard?track=solar-system>
- 太阳系完整排序：<https://llm-arcade.pages.dev/api/rankings?track=solar-system>
- 综合排行榜：<https://llm-arcade.pages.dev/api/arcade-index>
- 源代码：<https://github.com/yibol9768-alt/llm-arcade>
