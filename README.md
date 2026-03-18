# 🍴 Mealio - 智能餐厅探索与个性化美食导航

Mealio 是一款基于 **React Native (Expo)** 与 **Flask** 开发的跨平台移动应用。它旨在解决用户在寻找餐厅时的信息不对称问题，通过 LBS (基于位置的服务) 和自定义推荐算法，提供从“餐厅发现”到“心愿清单管理”的一站式美食导航体验。

-----

## 🌟 核心特性

  * **智能餐厅探索**：支持菜系、价格、距离等多维度筛选，利用 **MongoDB 2dsphere** 地理空间索引实现精准定位。
  * **个性化推荐引擎**：内置综合评分算法，平衡用户价格偏好、餐厅评分、流行度及物理距离。
  * **交互式地图**：集成 `react-native-maps`，支持丝滑的地图缩放、区域餐厅重载及一键导航功能。
  * **原生移动体验**：支持调用相机/相册修改头像、拨号预约、触感反馈及流转动画。
  * **无状态安全认证**：采用 **JWT + bcrypt** 方案，支持账号密码及手机验证码 (OTP) 双重登录模式。
  * **实时交互反馈**：购物车状态全局同步，底部导航栏角标随数据变化实时更新。

-----

## 🛠 技术栈

### 前端 (Mobile)

  * **框架**: React Native (Expo SDK 50+)
  * **路由**: Expo Router (基于文件系统的路由)
  * **状态管理**: Context API (用于 Auth 鉴权与购物车状态)
  * **动画**: React Native Reanimated
  * **地图**: Google Maps / Apple Maps (via `react-native-maps`)

### 后端 (API)

  * **框架**: Flask + Flask-RESTX (自动生成交互式 Swagger 文档)
  * **数据库**: MongoDB (NoSQL)
  * **缓存**: Redis (采用 Cache-Aside 模式优化读取性能)
  * **存储**: 阿里云 OSS (用于用户头像等静态资源)
  * **安全**: PyJWT, Passlib (bcrypt)

-----

## 📂 项目结构

```text
Mealio/
├── mealio/                # 前端 Expo 项目
│   ├── app/               # 页面路由 (Index, Auth, Details, Cart)
│   ├── components/        # 高复用 UI 组件 (Card, Filter, Loader)
│   ├── services/          # API 请求封装 (Axios 拦截器)
│   ├── constants/         # 全局常量 (颜色配置、API_BASE_URL)
│   └── hooks/             # 自定义 Hooks (useLocation, useAuth)
├── backend/               # 后端 Flask 项目
│   ├── app/
│   │   ├── apis/          # RESTX Namespaces (auth, user, restaurant, cart)
│   │   ├── models/        # MongoDB 数据模型与逻辑封装
│   │   └── utils/         # JWT 装饰器、OSS 客户端、推荐算法逻辑
│   └── run.py             # 后端服务启动入口
└── nginx.conf             # 生产环境反向代理配置示例
```

-----

## 🚀 快速开始

### 1\. 后端配置 (Flask)

确保本地已安装并启动 **MongoDB** 和 **Redis**。

```bash
cd backend
# 创建并激活虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows 用户: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务 (默认端口 5001)
python run.py
```

  * **Swagger 文档**: 访问 [http://localhost:5001/api/v1/docs](https://www.google.com/search?q=http://localhost:5001/api/v1/docs) 查看接口详情。

### 2\. 前端配置 (Expo)

确保已安装 **Node.js 18+**。

```bash
cd mealio
# 安装依赖
npm install

# 配置 API 地址
# 编辑 mealio/constants/Api.ts，将 API_BASE_URL 改为你的局域网 IP

# 启动 Expo 开发服务器
npx expo start
```

  * **真机调试**: 使用手机下载 **Expo Go**，扫描终端二维码即可预览（需确保手机与电脑在同一 WiFi 下）。

-----

## 🧠 系统设计要点

### 1\. 推荐算法模型

系统采用加权评分机制计算餐厅的综合得分 $S$：

$$S = (w_1 \cdot \text{Rating}) + (w_2 \cdot \text{Popularity}) - (w_3 \cdot \text{Distance}) - (w_4 \cdot |\text{Price} - \text{Pref}|)$$

  * **Rating**: 餐厅基础评分。
  * **Popularity**: 评论数代表的热度。
  * **Distance**: 用户与餐厅的物理距离。
  * **Price Deviation**: 餐厅人均与用户偏好价格的偏差。

### 2\. 缓存策略

采用 **Cache-Aside (旁路缓存)** 模式：

  * **读操作**：App → Redis (命中?) → 返回；若未命中 → MongoDB → 写入 Redis → 返回。
  * **写操作**：更新 MongoDB → 删除 Redis 对应缓存，确保数据最终一致性。

-----

## 📝 开发与调试记录

  * **权限处理**：针对 `expo-location` (位置) 和 `expo-image-picker` (相机/相册) 实现了完善的拒绝访问降级逻辑。
  * **接口规范**：严格遵守 Swagger 定义，利用 `@token_required` 装饰器实现 AOP 面向切面的鉴权控制，自动处理 Token 解析。
  * **性能优化**：
      * 餐厅列表实现**流式分页加载**。
      * 地图移动触发查询应用了**防抖 (Debounce)** 策略，减少无效的 API 请求。
      * 生产环境建议升级 **HTTPS** 协议以增强安全性。

-----

## 👥 贡献与联系

如果您有任何改进建议或发现了 Bug，欢迎提交 Issue 或 Pull Request！

-----
