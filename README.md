# Tyrantware Archive

专有恶意软件档案库 — 收集、核验和公开检索专有软件中的恶意行为记录。

本项目受 [GNU 专有软件文档](https://gnu.org/proprietary/) 启发，记录包括监视、后门、DRM、欺诈、强制捆绑、成瘾性设计等各类侵害用户权益的行为。

## 本地开发

### 初始化环境

```bash
cp apps/api/.env.example apps/api/.env
bun install
bun run init:api
```

请在 `apps/api/.env` 中配置 `JWT_SECRET` 等必要环境变量。

默认会准备 `apps/api/tyrantware.db` 的数据库结构。

### 启动服务

分别打开 3 个终端执行：

```bash
bun run dev:api
bun run dev:public
bun run dev:admin
```

## 环境变量

后端环境变量示例见 `apps/api/.env.example`。

## Serverless 部署

### 创建数据库

- 去 Turso 官网控制台手动创建数据库
- 在控制台复制数据库连接地址和 `auth token`

### 创建后端

- 在 Vercel 创建一个项目，选 Github 仓库
- Root Directory 设为 `apps/api`
- Framework Preset 选 Other，Output Directory 留空
- 填入必要的环境变量，包括 `DATABASE_URL` 和 `DATABASE_AUTH_TOKEN` 等

### 创建前端

- 分别单独部署 `apps/public` 和 `apps/admin` 即可
