# LLM Arcade 投票后端 API 契约

面向前端集成者。后端是 Cloudflare Pages Functions(与静态站同域部署),所有端点挂在 **同域 `/api/*`** 下,同源调用,无需处理 CORS。

- 所有响应均为 JSON(`Content-Type: application/json; charset=utf-8`)。
- 时间戳一律为 **Unix 秒**(不是毫秒)。
- 错误统一格式:`{"error": {"code": "<机器码>", "message": "<人读信息>"}}`。
- 本地联调:`npm run db:migrate:local && npm run dev`(详见 DEPLOY.md),base URL 为 `http://127.0.0.1:8788`。

## 防刷阈值一览(源码 `functions/_lib/config.js`,改这里即可调参)

| 参数 | 值 | 含义 |
|---|---|---|
| MIN_PLAY_SECONDS | 45 | 领取配对到投票的最短间隔(最短游玩时长) |
| MAX_PAIR_AGE_SECONDS | 7200 | pair token 有效期(2 小时) |
| DAILY_VOTE_LIMIT | 60 | 单访客指纹(voter_hash)每 UTC 日上限 |
| LEADERBOARD_CACHE_SECONDS | 60 | 榜单响应缓存时长(新票最多延迟 60s 上榜) |
| ELO_K / ELO_INITIAL | 32 / 1000 | Elo 回放参数 |
| BT_MIN_VOTES | 20 | 赛道总票数低于此值时 bt_score 全部为 null |

## 错误码表

| HTTP | code | 触发场景 |
|---|---|---|
| 400 | `bad_request` | 缺参/参数非法/body 不是 JSON 对象/winner 不在白名单 |
| 400 | `invalid_pair` | pair_id 签名校验失败(伪造或被篡改) |
| 400 | `too_early` | 领取配对后不足 45 秒就投票 |
| 400 | `pair_expired` | pair_id 已超过 2 小时有效期 |
| 404 | `track_not_found` | 赛道不存在或活跃参赛者不足 2 个 |
| 409 | `already_voted` | 该 pair_id 已投过票(一 token 一票) |
| 429 | `rate_limited` | 该访客当日票数已达 60 |
| 500 | `config_error` | 服务端未配置 PAIR_SECRET/SALT(部署问题) |
| 500 | `internal` | 其他服务端错误 |

前端处理建议:`too_early` 提示"再玩一会儿";`pair_expired`/`invalid_pair`/`already_voted` 直接换下一对;`rate_limited` 提示明日再来。

---

## 1. GET /api/health

存活探针。

```bash
curl -s https://<site>/api/health
```

```json
{ "ok": true, "ts": 1783738525 }
```

## 2. GET /api/pair?track=mario

服务端随机抽一对参赛者。采样"轻度平衡":优先票数最少的配对(候选 = 票数不超过最少值 +1 的所有配对,均匀随机取一),A/B 槽位随机分配,槽位不携带任何信息。

`pair_id` 是服务端 HMAC-SHA256 签名的不透明 token(编码 track、双方、签发时间和随机 nonce),**前端原样保存、原样回传即可,不要解析或修改**。同一配对每次领取的 pair_id 都不同,每个 pair_id 只能投一票。

```bash
curl -s "https://<site>/api/pair?track=mario"
```

```json
{
  "pair_id": "eyJ0IjoibWFyaW8iLCJhIjoi...In0.dUCzQ7UtGoYHT4AG...",
  "track": "mario",
  "a": { "slot": "A", "dir": "5.6luna" },
  "b": { "slot": "B", "dir": "grok4.5" },
  "issued_at": 1783738525
}
```

盲投提醒:响应里的 `dir` 是给前端加载 iframe 用的(`tracks/mario/<dir>/`),**渲染时不要把 dir 暴露给访客**,页面上只显示 A/B。

错误:400 `bad_request`(缺 track)、404 `track_not_found`。

## 3. POST /api/vote

```bash
curl -s -X POST https://<site>/api/vote \
  -H 'Content-Type: application/json' \
  -d '{"pair_id": "<原样回传>", "winner": "A"}'
```

Body:`{ "pair_id": string, "winner": "A" | "B" | "tie" }`(winner 严格白名单)。

服务端校验顺序:签名有效 → 距签发 ≥45s 且 ≤2h → 当日票数未超限 → pair_id 未用过。访客指纹 `voter_hash = SHA-256(client_ip + user_agent + 服务端盐)`,不存明文 IP。

成功(投完才揭晓身份,契合盲投流程):

```json
{ "ok": true, "revealed": { "a_dir": "fable5", "b_dir": "gpt5.5" } }
```

错误:400 `bad_request` / `invalid_pair` / `too_early` / `pair_expired`,409 `already_voted`,429 `rate_limited`。

## 4. GET /api/leaderboard?track=mario

现算榜单,服务端 Cache API 缓存 60 秒(投票后最多 60s 才反映到榜上,前端无需自己缓存)。

```bash
curl -s "https://<site>/api/leaderboard?track=mario"
```

```json
{
  "track": "mario",
  "total_votes": 60,
  "updated_at": 1783738622,
  "bt_min_votes": 20,
  "bt_ready": true,
  "entries": [
    {
      "dir": "composer2.5",
      "elo": 1079.2,
      "bt_score": 0.390943,
      "wins": 7, "losses": 1, "ties": 1, "games": 9
    }
  ]
}
```

字段说明:

- `entries` 按 `elo` 降序,包含该赛道 **全部** 活跃参赛者(零场次也在列,elo 为初始 1000)。
- `elo`:按时间序回放全部票,K=32,初始 1000,平局各计 0.5,保留 1 位小数。
- `bt_score`:Bradley-Terry 强度(MM 迭代,≤100 轮),归一化为所有有场次者之和 = 1,**只有相对大小有意义**。两种情况为 `null`:赛道总票数 < `bt_min_votes`(此时 `bt_ready: false`),或该参赛者零场次。前端在 Elo 与 BT 之间自行选用。
- `updated_at`:本份榜单的计算时间(受 60s 缓存影响,可能早于当前时间)。

错误:400 `bad_request`、404 `track_not_found`。

## 5. GET /api/stats

全站票数概览(含已注册但零票的赛道),不缓存。

```bash
curl -s https://<site>/api/stats
```

```json
{ "tracks": [ { "track": "mario", "votes": 60 } ], "total_votes": 60 }
```

---

## 前端对战盲投的推荐时序

1. 页面进入对战模式 → `GET /api/pair?track=mario`,保存 `pair_id`,用 `a.dir`/`b.dir` 加载两个 sandbox iframe,界面上只标 A/B。
2. 访客试玩;投票按钮建议前端也做 45s 倒计时禁用(与服务端 `too_early` 双保险)。
3. 访客选择 → `POST /api/vote` → 用 `revealed` 揭晓两侧真身,展示"下一对"按钮。
4. 探测后端是否存在:`GET /api/health` 200 即切真实票池,否则回落本地体验版。

## D1 schema 摘要(db/migrations/)

- `votes(id PK, track, a_dir, b_dir, winner CHECK in A/B/tie, pair_id UNIQUE, voter_hash, created_at)`,索引 `(track, created_at)`、`(voter_hash, created_at)`。
- `participants(track, dir, active, PK(track,dir))`:配对抽样来源;下架参赛者置 `active=0` 即可,不删历史票。
- 新赛道上线 = 往 `participants` 插入该赛道参赛者(参照 `0002_seed_mario.sql`),API 无需改码。
