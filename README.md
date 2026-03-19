# AssetManager - 通用资产全生命周期管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=flat&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.109+-blue?style=flat&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19+-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-blue?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/SQLite-WAL-green?style=flat&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/License-Apache%202.0-green?style=flat" alt="License">
</p>

通用资产全生命周期管理系统框架，支持快速二次开发为不同业务场景（办公设备、图书、工具等）。

## 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [快速开始](#快速开始)
- [配置驱动](#配置驱动)
- [二次开发](#二次开发)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [API 参考](#api-参考)
- [部署指南](#部署指南)

---

## 项目概述

AssetManager 是一个配置驱动的通用资产管理系统框架。通过 YAML 配置文件定义资产类型、字段和生命周期，无需修改代码即可适应不同的业务场景。

**典型应用场景：**
- 办公设备管理（电脑、打印机、投影仪）
- 图书资料管理
- 工具仪器管理
- 办公用品管理

### 核心特性

| 特性 | 说明 |
|------|------|
| **配置驱动** | 通过 YAML 文件定义字段、生命周期、验证规则 |
| **完整生命周期** | 申购 → 采购 → 入库 → 库存 → 借还 → 保修 → 消耗/报废 |
| **审批流** | 支持申购审批，管理员可配置审批规则 |
| **多角色支持** | admin、user、public 三种角色 |
| **会话管理** | 支持多设备登录、设备踢出、IP 限制 |
| **暗黑模式** | 完整的暗色主题支持 |
| **服务端分页** | 大数据量场景下采用服务端分页 |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/AssetManager.git
cd AssetManager
```

### 2. 安装依赖

```bash
# 后端
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
SECRET_KEY=your-secret-key-here
DEBUG=true
ENV=development
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your-password
DEFAULT_ADMIN_FULL_NAME=系统管理员
```

### 4. 启动服务

```bash
# 后端
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端 (新终端)
cd frontend
npm run dev
```

访问 http://localhost:5173

---

## 配置驱动

### 配置文件结构

```
config/
├── entity.yaml           # 默认配置（通用资产）
└── presets/
    └── equipment.yaml    # 办公设备预设
```

### entity.yaml 核心配置

```yaml
entity:
  code: "asset"
  name: "资产"

lifecycle:
  stages:
    - key: "request"      # 申购
    - key: "purchasing"  # 采购中
    - key: "stock_in"    # 入库
    - key: "in_storage"  # 库存
    - key: "borrowed"    # 已借出
    - key: "maintenance"  # 保修中
    - key: "consumed"    # 已用完
    - key: "scrapped"     # 已报废

fields:
  - key: "code"
    label: "资产编号"
    type: "string"
    required: true
    unique: true

  - key: "name"
    label: "资产名称"
    type: "string"
    required: true

  - key: "category"
    label: "分类"
    type: "select"

  - key: "location"
    label: "存放位置"
    type: "string"
```

### 生命周期流程

```
申购 → 审批 → 采购中 → 入库 → 库存
                              ↓
                        借出/保修
                              ↓
                        归还/维修完成
                              ↓
                        库存/已用完/已报废
```

---

## 二次开发

### 方式一：使用预设

1. 复制预设配置
   ```bash
   cp config/presets/equipment.yaml config/presets/my_project.yaml
   ```

2. 修改配置文件
   ```yaml
   # config/presets/my_project.yaml
   entity:
     name: "我的资产"
   ```

3. 在 `app/config/entity_loader.py` 中指定预设

### 方式二：自定义开发

如需更复杂的业务逻辑，可继承框架类：

```python
from app.api.assets import router as asset_router

class MyAssetRouter(asset_router):
    async def create_asset(self, ...):
        # 自定义逻辑
        return await super().create_asset(...)
```

---

## 技术栈

### 后端技术

| 技术 | 说明 |
|------|------|
| FastAPI | 异步高性能 Web 框架 |
| SQLModel | 类型安全的数据库 ORM |
| SQLite | 轻量级嵌入式数据库（WAL 模式） |
| python-jose | JWT 认证（RS256/HS256） |
| pydantic | 数据验证 |
| PyYAML | 配置文件解析 |

### 前端技术

| 技术 | 说明 |
|------|------|
| React 19 | 声明式 UI 库 |
| TypeScript | 带类型检查的 JavaScript |
| TanStack Table | 功能强大的数据表格 |
| React Hook Form | 表单管理 |
| Valibot | 表单验证 |
| Zustand | 轻量级状态管理 |
| Tailwind CSS | 样式框架 |
| Vite | 前端构建工具 |

---

## 项目结构

```
AssetManager/
├── config/                    # 配置文件
│   ├── entity.yaml            # 默认配置
│   └── presets/               # 业务场景预设
│
├── app/
│   ├── main.py               # FastAPI 应用入口
│   ├── database.py           # 数据库配置
│   ├── config/
│   │   └── entity_loader.py # 配置加载器
│   ├── api/
│   │   ├── assets.py        # 资产 API
│   │   ├── orders.py        # 订单 API
│   │   └── users.py         # 用户 API
│   ├── models/
│   │   ├── asset.py          # 资产模型
│   │   ├── order.py          # 订单模型
│   │   └── borrow_log.py    # 借用日志
│   └── core/
│       ├── auth.py           # 认证
│       └── config.py         # 应用配置
│
└── frontend/src/
    ├── config/
    │   └── entity.ts         # 前端配置
    ├── pages/
    │   ├── Assets.tsx        # 资产管理页面
    │   └── Requests.tsx      # 申购管理页面
    └── lib/
        ├── entityValidation.ts # 动态验证
        └── entityStatusMap.ts  # 状态映射
```

---

## API 参考

### 资产 API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/assets` | 获取资产列表 |
| POST | `/api/assets` | 创建资产 |
| GET | `/api/assets/{id}` | 获取资产详情 |
| PUT | `/api/assets/{id}` | 更新资产 |
| DELETE | `/api/assets/{id}` | 删除资产 |
| POST | `/api/assets/{id}/borrow` | 借用资产 |
| POST | `/api/assets/{id}/return` | 归还资产 |

### 订单 API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/orders` | 获取订单列表 |
| POST | `/api/orders` | 创建订单 |
| POST | `/api/orders/{id}/approve` | 审批通过 |
| POST | `/api/orders/{id}/reject` | 驳回订单 |

### 认证 API

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/users/login` | 用户登录 |
| POST | `/api/users/logout` | 用户登出 |
| GET | `/api/users/me` | 获取当前用户 |

---

## 部署指南

### 1. 构建前端

```bash
cd frontend
npm run build
```

### 2. 配置生产环境

```bash
SECRET_KEY=生成随机密钥
DEBUG=false
ENV=production
DEFAULT_ADMIN_PASSWORD=your-password
```

### 3. 启动后端

```bash
pip install gunicorn

gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

### 4. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
    }

    location /static {
        alias /path/to/AssetManager/static;
    }
}
```

---

## 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE) 文件

---

**版本**: 1.0.0
**最后更新**: 2026-03-18
