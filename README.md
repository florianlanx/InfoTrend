# InfoTrend - Tech News Aggregator

A modern Chrome extension that aggregates tech news from multiple sources with AI-powered summaries.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)

[English](#features) | [中文](#功能特性)

## Features

- **Multi-Source Aggregation**: Support for 7+ data sources
  - GitHub Trending, Hacker News, ArXiv Papers
  - Dev.to, Reddit r/MachineLearning, Product Hunt, Echo JS
  - Custom RSS feed support
- **Side Panel**: Click the icon to open a Hacker News-style list view
- **AI Summaries**: Integrated LLM API for on-demand article summaries (cached for 7 days)
- **Favorites & Tags**: Save articles with AI-generated category tags
- **Internationalization**: Supports English and Simplified Chinese
- **Flexible Configuration**: Customize data sources, API keys, and model selection
- **Data Export**: Export to JSON or CSV format
- **Modern UI**: Sci-fi themed design with light/dark mode support

## 功能特性

- **多源信息聚合**: 支持 7+ 种数据源
  - GitHub Trending、Hacker News、ArXiv 论文
  - Dev.to、Reddit r/MachineLearning、Product Hunt、Echo JS
  - 通用 RSS 订阅支持
- **侧边悬浮窗**: 点击图标展开侧边栏，以 Hacker News 风格的列表展示信息
- **智能摘要**: 集成大模型 API，支持按需生成单条资讯摘要，结果缓存 7 天
- **收藏与标签**: 收藏任意资讯，AI 自动生成分类标签
- **国际化支持**: 支持简体中文和英文，自动跟随浏览器语言
- **灵活配置**: 支持自定义数据源、API 密钥、模型选择
- **数据导出**: 支持导出为 JSON 或 CSV 格式
- **UI**: 现代化设计，支持浅色/深色主题

## Tech Stack

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式方案
- **shadcn/ui** - UI 组件库
- **Zustand** - 状态管理
- **Vite** - 构建工具
- **Chrome Extension Manifest V3** - 扩展平台

## Installation

### From Source (Development)

1. Clone the repository
```bash
git clone https://github.com/florianlanx/InfoTrend.git
cd InfoTrend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 在 Chrome 中加载插件
   - 打开 `chrome://extensions/`
   - 启用 "开发者模式"
   - 点击 "加载已解压的扩展程序"
   - 选择 `dist` 目录

### 生产构建

```bash
npm run build
```

构建产物位于 `dist` 目录，可以打包为 `.crx` 文件进行分发。

## 使用说明

### 侧边栏

1. 点击浏览器工具栏中的 InfoTrend 图标
2. 侧边栏将自动展开，显示最新的技术热点
3. 使用搜索框和筛选器快速找到感兴趣的内容
4. 点击任意条目在新标签页中打开

### 设置页面

点击侧边栏中的设置图标，或访问 `chrome://extensions/` -> 找到 InfoTrend -> 点击 "详细信息" -> "选项"

#### 信息源管理
- 启用/禁用各种数据源
- 添加自定义 RSS 订阅
- 设置最大显示条目数
- 配置特殊参数（如 HN 最低分数、ArXiv 查询语句）

#### LLM API 配置
- 输入自定义 API 密钥（支持 OpenAI、Gemini 等兼容接口）
- 选择默认模型
- 留空使用免费模型

#### 数据管理
- 导出数据为 JSON 或 CSV 格式
- 导入之前导出的数据
- 清除所有数据

#### 外观设置
- 主题切换（浅色/深色）
- 语言设置（简体中文/英文/跟随系统）

## 支持的数据源

| 数据源 | 类型 | 说明 | 配置选项 |
|-------|------|------|---------|
| GitHub Trending | 内置 | 每日热门项目 | fetchCount |
| Hacker News | 内置 | 技术新闻聚合 | fetchCount, minScore |
| ArXiv | 内置 | AI/计算机科学论文 | fetchCount, query |
| Dev.to | 内置 | 开发者社区文章 | fetchCount |
| Reddit r/ML | 内置 | 机器学习讨论区 | fetchCount |
| Product Hunt | 内置 | 产品发现平台 | fetchCount |
| Echo JS | 内置 | JavaScript 新闻 | fetchCount |
| 自定义 RSS | 通用 | 任意 RSS 订阅 | url, fetchCount |

## 数据源架构

本项目采用插件化的数据源架构，核心设计：

```
BaseSource (抽象基类)
    ├── sourceName: string        // 数据源名称
    ├── fetch(options)           // 获取数据方法
    ├── safeFetch()              // 安全的 fetch 封装
    ├── safeExecute()            // 错误处理
    ├── generateId()             // ID 生成
    ├── parseTimestamp()          // 时间戳解析
    └── cleanString()           // 字符串清理

SourceRegistry (注册表)
    ├── register(source)          // 注册数据源
    ├── unregister(name)          // 注销数据源
    ├── fetchFrom(name, options)  // 从指定数据源获取
    └── getRegisteredNames()     // 获取所有已注册数据源
```

**架构优势：**
- 开闭原则：新增数据源无需修改核心代码
- 动态注册：通过装饰器 `@RegisterSource()` 自动注册
- 统一接口：所有数据源实现相同的 `fetch()` 方法
- 类型安全：完整的 TypeScript 类型定义

**接入新数据源：**
详见 `SOURCE_INTEGRATION.md` 文档，包含：
- BaseSource API 参考
- 代码示例
- 常见模式（JSON API、RSS、HTML 爬取）
- 最佳实践

## 项目结构

```
info-trend-chrome-extension/
├── src/
│   ├── background/       # 后台服务
│   │   └── service-worker.ts
│   ├── components/       # React 组件
│   │   ├── Sidebar/      # 侧边栏组件
│   │   └── ui/          # shadcn/ui 组件
│   ├── options/          # 设置页面
│   ├── services/         # 业务逻辑
│   │   ├── dataFetcher.ts
│   │   ├── aiService.ts
│   │   └── storage.ts
│   ├── stores/           # 状态管理 (Zustand)
│   │   └── favoriteStore.ts
│   ├── sources/          # 数据源（新架构）
│   │   ├── base/        # BaseSource 抽象基类
│   │   ├── SourceRegistry.ts  # 数据源注册表
│   │   ├── GitHubSource.ts
│   │   ├── HackerNewsSource.ts
│   │   ├── ArXivSource.ts
│   │   ├── DevToSource.ts
│   │   ├── RedditSource.ts
│   │   ├── ProductHuntSource.ts
│   │   ├── EchoJSSource.ts
│   │   └── RSSSource.ts
│   ├── i18n/            # 国际化
│   │   ├── locales/
│   │   └── context.tsx
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── public/               # 静态资源
├── manifest.json         # Chrome 扩展配置
├── SOURCE_INTEGRATION.md # 数据源接入指南
└── package.json
```

## 开发指南

### 添加新的数据源

本项目使用插件化的数据源架构，支持灵活扩展。

**快速方式（RSS Feed）：**
- 直接在设置页面添加 RSS 数据源，无需编码

**完整方式（新网站）：**
- 参考 `SOURCE_INTEGRATION.md` 详细文档
- 继承 `BaseSource` 类
- 使用 `@RegisterSource()` 装饰器自动注册
- 示例：查看 `src/sources/GitHubSource.ts`

**数据源架构特性：**
- 统一的 `BaseSource` 接口
- 自动注册机制（通过 `SourceRegistry`）
- 内置错误处理和工具方法
- 支持自定义参数（如 `query`、`minScore`）

### 自定义 UI 主题

编辑 `tailwind.config.js` 文件中的主题配置：

```javascript
theme: {
  extend: {
    colors: {
      wechat: { /* 微信绿主题 */ },
      scifi: { /* 科幻风格背景 */ },
    },
  },
}
```

### 国际化 (i18n)

添加或修改翻译：
- 编辑 `src/i18n/locales/zh-CN.ts`（简体中文）
- 编辑 `src/i18n/locales/en-US.ts`（英文）
- 在组件中使用 `useI18n()` hook 获取 `t()` 函数

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**We especially welcome:**
- New data sources (see [SOURCE_INTEGRATION.md](SOURCE_INTEGRATION.md))
- UI/UX improvements
- Performance optimizations
- Translations
- Bug fixes

## Documentation

- [Source Integration Guide](SOURCE_INTEGRATION.md) - How to add new data sources
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Changelog](docs/changelog.md) - Version history

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
