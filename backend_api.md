# 后端接口文档

本文档描述了小程序云函数 `quickstartFunctions` 提供的后端接口。所有接口通过 `wx.cloud.callFunction` 调用，`name` 固定为 `quickstartFunctions`，`data` 参数中需包含 `type` 字段指定具体操作。

## 1. 用户与认证 (User & Auth)

### 1.1 用户注册 (registerUser)
- **Type**: `registerUser`
- **参数 (data)**:
  - `name` (String): 姓名 (2-4个汉字)
  - `phone` (String): 手机号 (11位)
  - `region` (String): 地区/区县 (必须在白名单内)
  - `county` (String, 可选): 同 `region`
  - `grid` (String, 可选): 网格名称
  - `password` (String): 密码 (>=6位)
  - `passwordHashed` (String, 可选): 客户端哈希过的密码
- **返回**:
  - 成功: `{ "success": true }`
  - 失败: `{ "success": false, "errCode": "...", "errMsg": "..." }`

### 1.2 用户登录 (loginUser)
- **Type**: `loginUser`
- **参数 (data)**:
  - `phone` (String): 手机号
  - `password` (String, 可选): 密码
  - `passwordHashed` (String, 可选): 客户端哈希过的密码
- **返回**:
  - 成功: `{ "success": true, "data": { "name": "...", "phone": "...", "region": "...", "session": { "token": "...", "csrf": "..." } } }`
  - 失败: `{ "success": false, "errMsg": "..." }`

### 1.3 校验会话 (verifySession)
- **Type**: `verifySession`
- **参数 (data)**:
  - `token` (String): 会话Token
- **返回**:
  - 成功: `{ "success": true, "data": { "name": "...", "phone": "..." } }`

### 1.4 获取用户信息 (getUserProfile)
- **Type**: `getUserProfile`
- **参数 (data)**:
  - `phone` (String): 手机号
- **返回**:
  - 成功: `{ "success": true, "data": { "name": "...", "phone": "...", "region": "...", "grid": "..." } }`

## 2. 装维人员管理 (Staff Management)

### 2.1 获取人员列表 (listStaff)
- **Type**: `listStaff`
- **参数 (data)**:
  - `page` (Number): 页码，默认1
  - `pageSize` (Number): 每页数量，默认10
  - `keyword` (String, 可选): 搜索关键字（姓名或手机号）
  - `filter` (Object, 可选): `{ "grid": "...", "county": "..." }`
  - `sortBy` (String): 排序字段，默认 `createdAt`
  - `sortOrder` (String): `asc` 或 `desc`
- **返回**:
  - `{ "success": true, "data": [ ... ], "total": 100 }`

### 2.2 新增人员 (createStaff)
- **Type**: `createStaff`
- **参数 (data)**:
  - `name` (String): 姓名
  - `phone` (String): 手机号
  - `county` (String): 所属区县
  - `grid` (String): 所属网格
- **返回**:
  - `{ "success": true, "id": "..." }`

### 2.3 更新人员 (updateStaff)
- **Type**: `updateStaff`
- **参数 (data)**:
  - `id` (String): 人员ID
  - `name` (String): 姓名
  - `phone` (String): 手机号
- **返回**:
  - `{ "success": true }`

### 2.4 删除人员 (deleteStaff)
- **Type**: `deleteStaff`
- **参数 (data)**:
  - `id` (String): 人员ID
- **返回**:
  - `{ "success": true }`

## 3. 设备领取管理 (Receipts)

### 3.1 获取领取记录 (listReceipts)
- **Type**: `listReceipts`
- **参数 (data)**:
  - `page` (Number): 页码
  - `pageSize` (Number): 每页数量
  - `keyword` (String): 搜索关键字（设备名/型号/人员名/手机号）
  - `filter` (Object): `{ "grid": "...", "county": "..." }`
- **返回**:
  - `{ "success": true, "data": [ ... ], "total": 100 }`

### 3.2 创建领取单 (createReceipt)
- **Type**: `createReceipt`
- **需要认证**: 是 (需提供 `sessionToken`, `csrf`)
- **参数 (data)**:
  - `staffId` (String): 装维人员ID
  - `staffName` (String): 装维人员姓名
  - `staffPhone` (String): 装维人员电话
  - `deviceName` (String): 设备名称
  - `deviceModel` (String): 设备型号
  - `quantity` (Number): 数量
  - `snList` (Array<String>): SN码列表
  - `county` (String): 区县
  - `grid` (String): 网格
- **返回**:
  - `{ "success": true, "id": "..." }`

## 4. 库存管理 (Inventory)

### 4.1 获取库存列表 (listInventory)
- **Type**: `listInventory`
- **参数 (data)**:
  - `page` (Number): 页码
  - `pageSize` (Number): 每页数量
  - `keyword` (String): 搜索关键字 (SN/CEMI/设备名称)
- **返回**:
  - `{ "success": true, "data": [ ... ], "total": 100 }`

### 4.2 导入库存 (importInventory)
- **Type**: `importInventory`
- **需要认证**: 是
- **参数 (data)**:
  - `fileBase64` (String): Excel文件的Base64编码
- **返回**:
  - `{ "success": true, "added": 10, "updated": 5, "failed": 0 }`

### 4.3 删除库存条目 (deleteInventory)
- **Type**: `deleteInventory`
- **参数 (data)**:
  - `id` (String): 库存记录ID
- **返回**:
  - `{ "success": true }`

## 5. 设备配置 (Device Config)

### 5.1 获取设备选项 (getDeviceConfig)
- **Type**: `getDeviceConfig`
- **返回**:
  - `{ "success": true, "data": { "路由器": ["AX3000", "AX6000"], "光猫": ["EPON", "GPON"] } }`

### 5.2 更新/新建设备配置 (upsertDeviceConfig)
- **Type**: `upsertDeviceConfig`
- **需要认证**: 是
- **参数 (data)**:
  - `name` (String): 设备名称
  - `models` (Array<String>): 型号列表
- **返回**:
  - `{ "success": true }`

### 5.3 追加设备型号 (appendDeviceModel)
- **Type**: `appendDeviceModel`
- **需要认证**: 是
- **参数 (data)**:
  - `name` (String): 设备名称
  - `models` (Array<String>): 新增型号列表
- **返回**:
  - `{ "success": true }`

## 6. 数据导出 (Export)

### 6.1 创建导出任务 (createExportJob)
- **Type**: `createExportJob`
- **参数 (data)**:
  - `filters` (Object): `{ "startTime": "...", "endTime": "...", "staffName": "...", "deviceNames": [], "deviceModels": [] }`
  - `groupBy` (String): `"staff"` (按人员分组) 或 `"model"` (按型号分组)
- **返回**:
  - `{ "success": true, "jobId": "...", "total": 100 }`

### 6.2 获取导出任务结果 (getExportJob)
- **Type**: `getExportJob`
- **参数 (data)**:
  - `jobId` (String): 任务ID (fileID)
- **返回**:
  - `{ "success": true, "job": { "status": "done" }, "url": "https://..." }`
