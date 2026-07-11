# 投票后端部署手册(Cloudflare Pages Functions + D1)

技术形态:静态站(`frontend/`)+ 同仓库 `functions/`(自动挂到同域 `/api/*`)+ D1 存票。零 npm 运行时依赖,wrangler 仅作 devDependency。

**版本注意**:本工作站 Node 为 18.19,wrangler 4.x 要求 Node >= 22,因此 package.json 锁定 `wrangler@^3`(3.114 实测可用)。若换到 Node 22+ 的机器,可升 wrangler 4,命令不变。

**发布根目录注意**:`wrangler.toml` 里 `pages_build_output_dir = "frontend"`(按定案:frontend/ 即发布根)。如果前端最终改为 Next.js 构建产物(如 `frontend/out`),把这一行改成对应目录即可,functions/ 不受影响。

---

## 一、本地开发(不需要 Cloudflare 账号)

```bash
cd /root/Desktop/llm-arcade
npm install                 # 装 wrangler(devDependency)
npm run db:migrate:local    # 对本地 D1(.wrangler/state/)依次跑全部 migration
npm run dev                 # = wrangler pages dev,默认 http://127.0.0.1:8788
```

- 本地密钥在根目录 `.dev.vars`(已提供 dev-only 值,**严禁用于生产**;若项目日后 git 化,把 `.dev.vars` 加进 .gitignore)。
- 本地 D1 数据在 `.wrangler/state/` 下,想重置就删掉该目录再跑 migration,或:
  `npx wrangler d1 execute llm-arcade-votes --local --command "DELETE FROM votes;"`
- 纯逻辑单测(不需要 wrangler):`npm run smoke`(backend-docs/smoke-test.mjs,17 项断言)。
- 投票不再设置最短试玩时长。拿到有效 `pair_id` 后,前端只需确认 A、B 都打开过即可提交。

## 二、生产部署(逐条命令)

> 标 **[需登录]** 的步骤需要用户本人的 Cloudflare 账号;先执行一次 `npx wrangler login`(浏览器 OAuth)。全部命令在项目根目录执行。

1. **[需登录]** 登录:

   ```bash
   npx wrangler login
   ```

2. **[需登录]** 创建 D1 数据库:

   ```bash
   npx wrangler d1 create llm-arcade-votes
   ```

   输出里有 `database_id = "xxxx-..."`,**把它填进根目录 `wrangler.toml` 的 `database_id`(替换 "TO_BE_FILLED")**。

3. **[需登录]** 对生产库跑 migrations(按序):

   ```bash
   npx wrangler d1 execute llm-arcade-votes --remote --file db/migrations/0001_init.sql
   npx wrangler d1 execute llm-arcade-votes --remote --file db/migrations/0002_seed_mario.sql
   npx wrangler d1 execute llm-arcade-votes --remote --file db/migrations/0003_voter_pair_claims.sql
   npx wrangler d1 execute llm-arcade-votes --remote --file db/migrations/0004_seed_mario_additions.sql
   # 或一条:npm run db:migrate:remote
   ```

4. **[需登录]** 创建 Pages 项目(项目名 llm-arcade,与 wrangler.toml 的 name 一致):

   ```bash
   npx wrangler pages project create llm-arcade --production-branch main
   ```

5. **[需登录]** 设置两个 secret(值自己生成,例如 `openssl rand -hex 32`,两个不要相同;不入库不入代码):

   ```bash
   npx wrangler pages secret put PAIR_SECRET --project-name llm-arcade
   npx wrangler pages secret put SALT --project-name llm-arcade
   ```

   注意:**轮换 PAIR_SECRET 会使已发出未投票的 pair token 立即失效**(影响窗口最多 2 小时);轮换 SALT 会重置所有访客的"当日票数"指纹。都可轮换,选流量低谷做。

6. **[需登录]** 部署(wrangler 会读 wrangler.toml,自动带上 functions/ 与 D1 绑定):

   ```bash
   npx wrangler pages deploy
   ```

   若走 GitHub 集成自动构建(PLAN 里的推送-即-部署路线),则在 Pages 控制台确认:构建输出目录 = `frontend`;仓库根含 `wrangler.toml` 时 D1 绑定与 secrets 会沿用,首次仍需在控制台或用上面第 5 步命令补 secrets。

7. 验收:

   ```bash
   curl -s https://<pages 域名>/api/health          # {"ok":true,...}
   curl -s "https://<pages 域名>/api/pair?track=mario"
   curl -s "https://<pages 域名>/api/leaderboard?track=mario"
   ```

## 三、日常运维

- **新增赛道**:写一个 `db/migrations/000N_seed_<track>.sql`(参照 0002),`wrangler d1 execute ... --remote --file` 跑一遍即可,代码零改动。
- **下架参赛者**(不删历史票):

  ```bash
  npx wrangler d1 execute llm-arcade-votes --remote \
    --command "UPDATE participants SET active=0 WHERE track='mario' AND dir='xxx';"
  ```

- **调防刷阈值**:改 `functions/_lib/config.js`,重新 deploy。
- **看票**:

  ```bash
  npx wrangler d1 execute llm-arcade-votes --remote \
    --command "SELECT track, COUNT(*) c FROM votes GROUP BY track;"
  ```

## 四、需要用户亲自做的动作清单(汇总)

1. `npx wrangler login`(浏览器授权)。
2. `wrangler d1 create` 并把 database_id 回填 wrangler.toml。
3. 跑两条 remote migration。
4. `wrangler pages project create llm-arcade`(或在控制台连 GitHub 仓库)。
5. 生成并设置 PAIR_SECRET、SALT 两个 secret。
6. `wrangler pages deploy` 首发,并用第 7 步 curl 验收。
