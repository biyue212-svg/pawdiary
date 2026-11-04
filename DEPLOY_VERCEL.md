# Vercel 部署：爪爪日记

本分支是独立 Next.js 版本。页面和本机记录无需环境变量即可运行；未配置后台时会明确提示，反馈、注册、云端同步和真实社区写入不会伪装为成功。

## 1. 创建 Supabase 项目（只需一次）

1. 在 Supabase 新建项目，数据库密码由你保管。
2. 打开 SQL Editor，粘贴并运行仓库 `migrations/001_supabase.sql` 的全部内容。脚本创建表、开启 RLS、禁止匿名直接访问表，并建立私有 `pawdiary-private` 存储桶。不要把桶改成公开。
3. 从项目 Connect 面板复制 **Transaction pooler** 的 PostgreSQL URI（通常端口6543）。将密码占位符替换为真实密码；密码中的特殊字符应进行 URL 编码。这是 DATABASE_URL，不能只填项目网页地址。驱动已关闭预编译语句。
4. 从项目 API 设置获取项目 URL、anon/publishable key、service_role/secret key。推荐按面板对应的 Legacy anon 与 service_role 复制，勿混用。
5. Authentication 中开启 Email 登录，保留邮箱验证。设置 Site URL 为 `https://你的Vercel域名/account`，Redirect URLs 加入同一地址。绑定正式域名后增加 `https://petdiary212.fun/account` 并更新 Site URL。
6. 正式向其他用户开放注册前，在 Supabase 配置邮件发送服务（SMTP）。默认邮件服务有收件人与速率限制；测试邮件可检查垃圾邮件。

## 2. Vercel 导入 GitHub

- Repository: biyue212-svg/pawdiary
- Branch: main
- Project Name: pawdiary
- Root Directory: ./
- Framework: Next.js
- Build / Install / Output: 默认即可；仓库已配置 npm ci 和 npm run build。
- 在 Environment Variables 添加以下4项，Production 与 Preview 均勾选：

| Key | Value来源 |
|---|---|
| DATABASE_URL | 上述 Transaction pooler PostgreSQL URI |
| SUPABASE_URL | Supabase Project URL |
| SUPABASE_ANON_KEY | anon 或 publishable key |
| SUPABASE_SERVICE_ROLE_KEY | service_role 或 server secret key |

这4项都是服务端变量。不要加 NEXT_PUBLIC_ 前缀，不要把真实值写进 GitHub，不要把含完整值的截图发到聊天。

部署为 Ready 后，访问 `/api/health`，`backendConfigured` 应为 true（只检查配置项是否齐全，不代替连通性测试）。

## 3. 验证再切换域名

先通过 .vercel.app 测试：页面、建档、照片、记录、备份导入导出、反馈回执、邮箱验证登录、云端连接和退出、两账号的公开资料与邀请消息。Supabase SQL/Storage/Auth 必须配置完整，才能做后台实测。

在 Vercel Settings → Domains 添加 petdiary212.fun，按项目实际返回的 DNS 参数替换阿里云旧 A 记录。不要使用旧托管平台的两个IP。TXT记录按新托管端要求增删，保留邮箱和其他用途的记录。证书有效后，用实际面试官访问环境测试；Vercel 仍是境外托管，迁移本身不保证所有地区或网络都可达。

## 数据与功能边界

- 原站点的 D1/R2 数据不会自动进入新 Supabase。旧域名里的个人记录请先导出 JSON，新站用“导入与恢复备份”追加导入，再连接云端。
- 新邮箱身份与旧 ChatGPT 身份独立。旧社区内容、反馈、邀请和会话不会自动迁移；需要分别导出迁移，勿声称已搬迁。
- 新增照护记录、家庭共享、邀请聊天、公开资料等服务端流程已移植；具体项目的数据库与邮件连通性需在你配置后验证。
- Vercel 请求体有限制。当前云端同步在客户端限制单次档案约4MB，超出时明确提醒并保留本机内容；可先备份、减少照片。大规模照片档案应后续改为直接上传存储。
- 监控仍只保存本机的设备授权网页/视频地址，不自动绑定厂商 App，不支持直接 RTSP/ONVIF。
- `npm test` 运行备份、草稿、PostgreSQL流程和会话验证测试。`npm run build` 验证标准 Next.js 生产构建。
