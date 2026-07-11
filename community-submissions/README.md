# Community Submissions

这里接收社区使用模型和 Agent 自行运行完成的真实作品。每次提交使用独立目录：

```text
community-submissions/<track>/<github-user>-<submission-slug>/
├── manifest.json
└── artifact/
    ├── index.html
    └── ...
```

步骤：

1. 复制 `manifest.template.json` 到你的提交目录，并重命名为 `manifest.json`。
2. 把未经人工修改的最终产物完整放入 `artifact/`。
3. 确认 `artifact/index.html` 可以通过本地 HTTP 服务打开。
4. 填写真实运行次数、中断、harness、机器和 `human_code_edits`。
5. 使用 GitHub 的“真实作品提交”Pull Request 模板。

不要修改其他提交，不要把作品直接放入官方 `tracks/`，不要提交密钥、Cookie、账号信息或包含私人路径的日志。

社区提交不会自动进入官方排行榜。正式收录前会单独完成协议、身份、文件哈希和浏览器验收。
