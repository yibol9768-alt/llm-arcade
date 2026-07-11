# LLM Arcade · 前端(静态站)

纯手写 HTML/CSS/vanilla JS,零框架、零 npm 依赖、零 CDN/外部字体/外部图片。
本目录 `frontend/` 即 Cloudflare Pages 的发布根目录。

## 本地预览(两种)

**纯静态(无投票后端,对战区自动回落「💻 本机体验版」):**

```bash
cd frontend && python3 -m http.server 8642
# 打开 http://127.0.0.1:8642/
```

直接 `file://` 打开也能工作(数据走 `assets/data.js` 的 `<script>` 注入,不用 fetch)。

**带投票后端(同域 /api/*,对战区自动切「🌐 全网票池」):**

```bash
cd /root/Desktop/llm-arcade   # 项目根,不是 frontend/
npm install                   # 装 wrangler(锁 3.x,本机 Node 18;Node 22+ 可升 4)
npm run db:migrate:local      # 本地 D1 建表 + 种子(.wrangler/state/)
npm run dev                   # wrangler pages dev,http://127.0.0.1:8788
```

本地密钥在根目录 `.dev.vars`(dev-only)。后端契约见 `backend-docs/API.md`。

## 目录说明

```
frontend/
  index.html            首页(大厅:赛道一览 + 静态检查榜 + 方法论)
  mario/index.html      马里奥赛道页(试玩 + 对战盲投 + 检查表 + 披露)
  assets/
    style.css           全站样式(AA 风白底图表风,浅色主题,响应式)
    app.js              全站逻辑(图表 SVG 渲染、活预览、modal、对战、排序表格)
    data.js             生成物:window.ARCADE_DATA(勿手改)
    shots/*.png         生成物:全部游戏的首屏截图(卡片预览底图)
  games/mario/<代号>/   生成物:tracks/mario/ 的逐字节副本(勿手改)
```

`tracks/` 是只读评测成品,一个字节都不许改;`frontend/games/` 里只是它的拷贝。

## 三个脚本(仓库根 `scripts/`)与重跑顺序

| 顺序 | 脚本 | 作用 | 产物 |
|---|---|---|---|
| 1 | `node scripts/inspect_games.mjs` | 静态检查全部游戏(文件数/体积/行数/音效/触屏/存档/README/可加载),算静态检查分 | `data/mario_checklist.json` |
| 2 | `bash scripts/sync_games.sh` | 先清目标再整目录拷贝游戏 | `frontend/games/mario/` |
| 3 | `node scripts/take_shots.mjs`(可选) | 用本机 headless chromium 给全部游戏截首屏图;找不到浏览器则自动跳过 | `frontend/assets/shots/*.png` |
| 4 | `node scripts/build_data.mjs` | 合成 `_track.json` + 检查结果 + 截图有无 | `frontend/assets/data.js` |

tracks/ 内容变化后按 1→2→3→4 重跑即可。

## 静态检查分(透明公示)

可加载 40 + 音效 20 + 触屏支持 15 + 本地存档 15 + README 10,满分 100。

- 可加载 = index.html 存在且其引用的本地 js/css 全部存在;
- 触屏 = 源码监听 touchstart / ontouch / pointerdown;Pointer Events 的
  pointerdown 同样覆盖触屏,故一并计入;
- 该分只反映代码静态特征,不代表好玩程度,页面脚注同文公示。

## 卡片「活预览」方案(实际采用:截图垫底 + 活 iframe)

- 预览区 16:10,底图是 `take_shots.mjs` 截的真实首屏图,秒开;
- 进入视口(IntersectionObserver,threshold 0.35)后叠加一个懒加载 iframe
  (960×600,`transform: scale` 缩放进卡片,`pointer-events: none`),游戏画面实时运行;
- 同屏最多 3 个活 iframe,滚出视口立即卸载 src 并把名额让给下一个;
- `prefers-reduced-motion` 或 `navigator.connection.saveData` 时不开活预览,只显示截图;
- iframe 加载失败/无截图时退化为代号首字母的几何图案占位(`monogramSVG`)。

## 对战盲投(双模式,进对战区时自动探测)

进入赛道页时 `GET /api/health`(1.5s 超时):在线 →「🌐 全网票池」,离线/超时 →
「💻 本机体验版」,当前模式徽章显示在对战区标题旁。

**🌐 全网票池模式**(后端契约见 `backend-docs/API.md`):

- 「开始一场对战」→ `GET /api/pair?track=mario`,拿服务端签名的 `pair_id`,
  界面只显示匿名 A / B(dir 仅用于加载 iframe,不渲染);
- 解锁投票只需要 A、B 都点开试玩过;没有倒计时。对战为全屏界面,
  同一时间只保留一个游戏 iframe,切到另一边时自动关闭当前作品;
- 投票 `POST /api/vote {pair_id, winner: "A"|"B"|"tie"}`,用响应里的
  `revealed` 揭晓身份;
- 评测次数与每日票数不限,同一组对决只能判断一次;配对优先补齐全网最缺数据的组合;
- 错误处理:`already_voted` / `matchup_already_voted` 锁票提示;`pair_expired`/
  `invalid_pair` 一键换下一对;网络错误可把这票落到本机票箱(明确标注不入全网池);
- 对战区榜单为 `GET /api/leaderboard` 的全网榜(Elo、BT 强度、胜平负、总票数、
  更新时间;总票 <20 时 BT 列为 – 并注明);本机 Elo 榜降级为折叠的「本机记录」小节。

**💻 本机体验版模式**(无后端时):

- 本机评测次数不限且同一组不重复,优先平衡各参赛者在这台设备上的出场次数;
- 票存 `localStorage`,key = `arcade_mario_votes_v1`,格式
  `[{a, b, r: "a"|"b"|"t", t: 时间戳}, ...]`;
- 本机 Elo:K=32,初始 1000,按投票时间顺序回放全部对局逐场更新
  (`ra += K * (sa - ea)`,`ea = 1/(1+10^((rb-ra)/400))`,平局 sa=0.5);
- 清空:赛道页「清空本机投票」按钮,或 DevTools 里
  `localStorage.removeItem("arcade_mario_votes_v1")`。

首页顶部接全网榜并每 15 秒刷新。零票且 Agent 初评尚未录入时显示「初始榜筹备中」;
产生有效盲投后自动显示实时 Elo。

## 自测钩子(headless 验收用)

- `mario/?selftest=1`:本机体验版套件(离线环境跑);
- `mario/?selftest=online`:mock fetch 的在线全流程套件(不依赖后端,覆盖
  双边打开即投票、单 iframe、already_voted、网络回落、429、pair_expired);
- `mario/?selftest=live`:直连同域真实 `/api` 的只读 + 错误路径套件
  (wrangler pages dev 下跑,不产生真实票);
- 结果写进页面里的隐藏节点 `#selftest-result`,headless `--dump-dom` 后 grep 即可。

## 部署

Cloudflare Pages 静态托管:`wrangler.toml` 已设 `pages_build_output_dir = "frontend"`,
`functions/` 自动挂到同域 `/api/*`(部署细节见 `backend-docs/DEPLOY.md`)。
og:image 未设置(需要站点定域后的绝对 URL,上线时补)。
