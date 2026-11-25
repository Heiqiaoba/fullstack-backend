# Fullstack Backend

仓库地址：https://github.com/Heiqiaoba/fullstack-backend

独立后端项目：Node 22 + Fastify 5 + Drizzle ORM + PostgreSQL 16 + Better Auth。

业务契约（Zod schema 与推导类型）内嵌在 `src/contract.ts`，项目不依赖任何 workspace 包，可单独 clone 使用。

## 快速开始

```bash
cp .env.example .env
# 把 BETTER_AUTH_SECRET 换成强随机值：openssl rand -base64 32
pnpm install

# 启动数据库（本机需有 Docker）
docker run -d --name template-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app postgres:16-alpine

pnpm db:migrate       # 执行迁移
pnpm db:seed          # 可选：填充演示数据
pnpm dev              # http://localhost:3000
```

注册账号后把 user id 配到 `ADMIN_USER_IDS`，或执行
`pnpm set-role you@example.com admin` 获取管理员权限。

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（tsx watch） |
| `pnpm build` / `pnpm start` | 编译 / 启动生产服务 |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` / `pnpm format` | 代码检查 / 格式化 |
| `pnpm test` | 运行测试（读取 `.env.test`） |
| `pnpm db:generate` | 根据 schema 生成迁移 |
| `pnpm db:migrate` / `pnpm db:seed` | 执行迁移 / 填充种子数据 |
| `pnpm set-role <email> [admin\|user]` | 按邮箱设置用户角色 |
| `pnpm openapi:export` | 导出 OpenAPI 规范到 `openapi.json` |

## API 文档

开发环境 `ENABLE_DOCS=true` 时访问 `http://localhost:3000/docs`。

## Docker

构建上下文为本目录：

```bash
docker build -t my-backend .
```
