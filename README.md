# Pokopia 攻略站

最全面的 Pokopia 游戏攻略与数据查询平台。提供宝可梦图鉴、攻略文章、道具数据和技能查询。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, 静态导出) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 包管理 | pnpm |
| 内容 | MDX (攻略文章) + JSON (结构化数据) |
| 部署 | Cloudflare Pages |

## 项目结构

```
pokopia-guide/
├── content/                  # 内容数据
│   ├── pokemon/              # 宝可梦数据 (JSON)
│   ├── guides/               # 攻略文章 (MDX)
│   ├── items/                # 道具数据
│   └── moves/                # 技能数据
├── scripts/
│   └── generate-sitemap.mjs  # 构建时生成 sitemap
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首页
│   │   ├── pokedex/
│   │   │   ├── page.tsx      # 图鉴列表页
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # 宝可梦详情页
│   │   └── guides/
│   │       ├── page.tsx      # 攻略列表页
│   │       └── [slug]/
│   │           └── page.tsx  # 攻略详情页
│   ├── components/
│   │   ├── layout/           # 页头、页脚
│   │   ├── pokemon/          # 宝可梦卡片、属性标签
│   │   ├── guides/           # 攻略卡片
│   │   └── ui/               # shadcn/ui 基础组件
│   └── lib/
│       ├── types.ts          # 类型定义
│       ├── pokemon.ts        # 宝可梦数据加载
│       ├── guides.ts         # 攻略数据加载
│       └── utils.ts          # 工具函数
└── public/
    ├── images/pokemon/       # 宝可梦图片
    ├── robots.txt
    └── sitemap.xml           # 构建时自动生成
```

## 开始开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

浏览器打开 http://localhost:3000 查看。

## 构建与预览

```bash
# 构建静态文件（输出到 out/ 目录）
pnpm build

# 本地预览构建产物
pnpm preview
```

## 添加内容

### 添加宝可梦

在 `content/pokemon/` 下新建 JSON 文件，例如 `bulbasaur.json`：

```json
{
  "id": 1,
  "slug": "bulbasaur",
  "name": "妙蛙种子",
  "types": ["grass", "poison"],
  "stats": {
    "hp": 45,
    "attack": 49,
    "defense": 49,
    "spAtk": 65,
    "spDef": 65,
    "speed": 45
  },
  "abilities": ["茂盛", "叶绿素"],
  "description": "描述文本",
  "image": "/images/pokemon/bulbasaur.png"
}
```

### 添加攻略

在 `content/guides/` 下新建 MDX 文件，例如 `battle-tips.mdx`：

```mdx
---
title: "战斗技巧进阶"
description: "提升对战水平的实用技巧。"
category: "进阶攻略"
date: "2026-03-01"
author: "Pokopia 攻略组"
---

正文内容...
```

添加完内容后重新 `pnpm build` 即可，页面会自动生成。

## 部署

项目配置为静态导出 (`output: "export"`)，构建产物为 `out/` 目录下的纯静态文件。

**Cloudflare Pages:**

1. 连接 Git 仓库
2. 构建命令: `pnpm build`
3. 输出目录: `out`

或使用 CLI: `npx wrangler pages deploy out`
