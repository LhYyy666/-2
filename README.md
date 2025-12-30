# 管理员后台项目说明

## 目录结构
- `web-admin/`: 前端 Vue 3 项目代码
- `cloud-functions/adminService/`: 云函数代码

## 快速开始

### 1. 部署云函数
1. 将 `cloud-functions/adminService` 目录上传/部署到微信云开发环境。
2. 在微信开发者工具 → 云开发 → 选择环境 → 云函数 → 选择 `adminService` → 开启「HTTP 访问服务」（即云函数 URL 化/HTTP 触发）。
3. 绑定路由：在「HTTP 访问服务」页的「域名关联资源」点击「新建」→ 填写路径 `/adminService` → 方法选择 `ANY/POST` → 关联资源选择「云函数」并选中 `adminService` → 访问权限选「公开访问」→ 保存。
4. 获取云函数的 HTTP 访问地址（保存后控制台会生成，如：`https://xxxx.service.tcloudbase.com/adminService`）。
4. 在云函数配置中添加环境变量 `JWT_SECRET`，设置一个复杂的字符串作为密钥。
5. 确保云函数已安装依赖 (`wx-server-sdk`, `jsonwebtoken`, `bcryptjs`)。

### 2. 数据库准备
1. 在云数据库中创建 `admins` 集合。
2. 插入一条管理员记录。注意：`password` 字段需要存储 bcrypt 加密后的哈希值。
   - 为了方便测试，你可以临时修改云函数 `index.js` 中的登录逻辑，允许明文密码，登录成功后再改回。
   - 或者使用在线 bcrypt 生成器生成一个哈希值存入数据库。
3. 确保 `users` 集合存在。

### 3. 启动前端
1. 进入 `web-admin` 目录：
   ```bash
   cd web-admin
   npm install
   ```
2. 打开 `src/api/request.js`，将 `CLOUD_FUNCTION_URL` 替换为你第一步获取的云函数 HTTP 地址。
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 打开浏览器访问控制台输出的地址（通常是 `http://localhost:5173`）。

## 功能说明
- **登录**：使用 `admins` 集合中的账号登录，获取 JWT Token。
- **用户管理**：查看 `users` 集合数据，支持搜索、修改权限、删除用户。
