# 爪爪日记 PawDiary

面向犬、猫、鸟、蜥蜴、仓鼠、兔、龟、鱼等宠物家庭的手机网页，独立部署到 Vercel。

- 首次建档、多宠切换、原宠物绑定草稿、成长时间线、相册、克/公斤体重记录。
- 按物种选择的观察项目、护理计划、ICS日历导出、JSON备份导入导出、宠物归档恢复。
- Supabase 邮箱登录、私有云端快照和照片、版本冲突处理、家庭共同照护。
- 公开宠友资料、城市/全国同类筛选、社区发布、评论收藏关注、双方同意后的邀请聊天、屏蔽举报。
- 服务端反馈回执，家庭摄像头授权链接入口，减少动态效果支持。

## 开发

Node >=22.13，`npm ci` → 配置环境变量 → `npm run dev`。
`npm test` 运行回归与 PostgreSQL 集成测试，`npm run build` 构建，`npm start` 启动生产服务。

## 部署

逐步配置见 [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)。数据库初始化脚本是 [migrations/001_supabase.sql](migrations/001_supabase.sql)，变量名称见 `.env.example`，真实密码与密钥只保存在 Vercel 服务端环境变量中。

界面使用 public/ 内已打包的资源。原 Cloudflare 工具与 SQLite 迁移保留作历史参考，不是 Vercel 部署入口；新站不依赖 ChatGPT Sites 登录头或 Cloudflare 运行时。

原站后台数据不会自动搬迁；旧个人档案可通过 JSON 导入。正式域名切换前先测试 .vercel.app。
