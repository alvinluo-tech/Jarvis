# 🪐 Jarvis | 个人 AI 智能控制中心

<div align="center">

**一个安全、极速、多端同步的个人 AI 统一控制层。基于 Tauri 2.0 与 Hono 构建，完美整合您日常的对话、任务、阅读和记忆。**

[![Language](https://img.shields.io/badge/Language-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-blue.svg)](#-)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white&color=FFC130)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white&color=61DAFB)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.7-orange?logo=hono&logoColor=white&color=E36049)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🌐 English Edition](./README.md) | [🇨🇳 简体中文](./README_zh.md)

</div>

---

## 👁️ 核心愿景

**Jarvis** 不仅仅是一个 AI 助手，它是您数字生活的**统一大脑**。通过将 AI 的工具调用（Tool Calling）能力与您的个人数据紧密绑定，Jarvis 将聊天（Chat）、待办任务（Todo）、阅读清单（Reading）和复盘复盘（Review）无缝贯通。

无论您是在寻找完全离线私密、零配置的**本地优先体验**，还是需要无缝跨端、多设备协同的**云端同步**，Jarvis 的动态数据库切换架构都能完美胜任。

---

## ✨ 核心特性

- 🖥️ **Tauri 2.0 强力驱动**：极致的轻量级桌面客户端，极低的内存占用，完美的原生系统视窗集成（包含自定义科幻风格毛玻璃标题栏）。
- 🔀 **存储工厂三合一 (Dynamic Storage Factory)**：
  - **本地 SQLite**：零配置开箱即用，隐私安全至上，数据全本地归档。
  - **外接 Supabase**：一键开启多设备云同步，提供完整的企业级云存储体验。
  - **通用 PostgreSQL**：兼容 Neon.tech, AWS RDS, Aiven 等通用云端 PG 数据库。
- ⚡ **无感热切换 & 一键迁移**：无需重启客户端即可在本地和云端数据库之间无缝热插拔切换，支持动态测试连通性，并能在云端一键自动初始化（Migrate）所有必需的数据表结构。
- 🧠 **多模型智能流式交互**：原生支持流式输出（Streaming SSE）、自然语言任务解析与工具自动调用。支持接入 **DeepSeek**、**Kimi**、**OpenRouter** 等主流 LLM。
- 🧹 **Windows 开发守护工具链**：根目录内置自动解除占用与强杀僵尸进程的快捷指令，解决 Windows 环境下编译文件锁定的老大难问题。

---

## 🏗️ 架构设计

```mermaid
graph TD
    Client[Tauri 2.0 桌面端 - React/TS] <-->|IPC / HTTP| Daemon[Hono 后端守护进程 - Node.js]
    Daemon <-->|多模型统一网关| LLM[LLM 智能体层 - DeepSeek/Kimi/OpenRouter]
    
    subgraph 存储引擎层 (Storage Factory)
        Daemon <-->|Drizzle ORM| SQLite[(本地 SQLite)]
        Daemon <-->|Drizzle ORM / pg| Postgres[(通用 PostgreSQL)]
        Daemon <-->|Drizzle ORM / Supabase SDK| Supabase[(外接 Supabase)]
    end
```

---

## 📅 业务板块

| 模块名称 | 视觉标识 | 核心功能描述 |
| :--- | :---: | :--- |
| **智能对话 (Chat)** | `💬` | 支持多模型流式交互，自动分析上下文，绑定多维度工具函数进行信息整合与命令执行。 |
| **任务看板 (Todo)** | `📅` | 智能任务管理，支持优先级划分、到期提醒、自定义标签，并支持 AI 自然语言一键建单。 |
| **阅读清单 (Reading)** | `📖` | 收集并跟踪您的日常阅读计划，记录阅读进度，支持 AI 智能摘要与深度剖析。 |
| **系统复盘 (Review)** | `📊` | 每日及每周的交互、任务完成度深度分析，以精美的图表与数据看板为您生成个人复盘报告。 |
| **数据库配置 (Database)** | `🔧` | **存储控制面板**。支持测试连通性、一键初始化数据库表结构并实施热切换。 |

---

## 🚀 快速开始

### 📋 前置要求
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`
- **Rust**: 安装最新版 Rust 环境（用于 Tauri 编译）

### 1. 克隆并安装依赖
```bash
git clone https://github.com/your-username/Jarvis.git
cd Jarvis
pnpm install
```

### 2. 环境变量配置
在根目录下创建 `.env` 文件（或复制 `.env.example`）：
```properties
# AI API 配置
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
MIMO_API_KEY=your_key_here

# 守护进程端口
DAEMON_PORT=3001

# 数据库文件路径（本地模式）
SQLITE_DB_PATH=./daemon/data/jarvis.db
```

### 3. 一键启动开发环境
```bash
pnpm dev
```
该命令会同时拉起 **Hono 后端守护进程** 与 **Tauri 桌面端开发视窗**。

---

## 🛠️ 实用开发者工具

针对 Windows 环境下 Tauri 二进制文件经常被系统独占锁定、导致编译报错 `os error 5 (拒绝访问)` 的痛点，我们在根目录配置了以下实用快捷指令：

* **清理前端残留进程**：
  ```bash
  pnpm clean:app
  ```
* **清理后端占用端口 (3001 端口)**：
  ```bash
  pnpm clean:daemon
  ```
* **一键双清（最推荐）**：
  ```bash
  pnpm clean:all
  ```

---

## 📂 项目结构

```text
Jarvis/
├── daemon/               # Node.js 后端守护进程 (Hono 服务端)
│   ├── src/
│   │   ├── api/          # 统一的 REST API 路由接口
│   │   ├── db/           # 数据库持久层配置与仓库模式实现
│   │   ├── config/       # 环境变量校验与持久化配置存储
│   │   └── index.ts      # Hono 后端入口
│   └── data/             # 本地 SQLite 存储目录
├── frontend/             # Tauri 2.0 桌面端 (Vite + React)
│   ├── src/
│   │   ├── components/   # 高颜值科幻风组件（包含 TitleBar 及 DbPage）
│   │   ├── stores/       # Zustand 状态管理仓库
│   │   └── main.tsx      # React 渲染入口
│   ├── src-tauri/        # Rust 原生客户端代码
│   │   ├── icons/        # 包含自动生成的全平台适配图标 (52 个格式尺寸)
│   │   └── src/lib.rs    # Rust Tauri 初始化与原生窗口逻辑
│   └── public/           # 桌面端公共静态资源
└── package.json          # Monorepo 根配置与进程管理工具链
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源许可协议。

---

<div align="center">

**🪐 Jarvis - 精心雕琢，只为您更智能、更优雅的数字生活体验。**

</div>
