# Data Sources

本文档说明宝可梦各项数据的来源。所有数据通过 `scripts/update-pokopia-data.mjs` 自动采集与合并。

## 字段来源总览

| 字段 | 来源 | 说明 |
|------|------|------|
| 名称 (name) | PokeAPI | 三语言：en / zh-Hant / ja |
| 编号 (id) | 本地映射表 | Pokopia 图鉴编号，非全国图鉴编号 |
| 属性 (types) | PokeAPI | 如 grass、poison |
| 图片 (image) | PokeAPI → R2 | 拉取 sprite 后上传至 Cloudflare R2 |
| 特长 (specialties) | Serebii / Game8 | 优先级：已有数据 > Serebii 列表 > Serebii 详情 > Game8 |
| 出现时间 (timeOfDay) | Serebii / Game8 | 优先级：已有数据 > Serebii 详情 > Game8 |
| 天气 (weather) | Serebii / Game8 | 优先级：已有数据 > Serebii 详情 > Game8 |
| 栖息地 (habitats) | Serebii | 含 ID、名称、稀有度；名称有三语言本地化 |

---

## 详细说明

### 1. 名称 (name)

- **来源**: [PokeAPI](https://pokeapi.co) — `GET /api/v2/pokemon-species/{name}`
- **字段**: `speciesData.names[]`，按 `language.name` 匹配
  - `en` → 英文名
  - `zh-hant` → 繁体中文名（fallback `zh-hans`）
  - `ja` → 日文名
- **触发时机**: 仅在新宝可梦首次入库时从 PokeAPI 拉取（`fetchNewPokemonBase()`）

### 2. 编号 (id)

- **来源**: Serebii 列表页 — 表格第 1 列的 `#xxx` 编号
- **格式**: Pokopia 图鉴编号（1-based），与全国图鉴编号无关
- **获取方式**: `scrapeSerebiiList()` 解析后作为 `entry.dexNumber` 传入 `fetchNewPokemonBase(slug, dexNumber)`
- **无需手动维护**: 编号直接来自 Serebii，不依赖本地映射表

### 3. 属性 (types)

- **来源**: [PokeAPI](https://pokeapi.co) — `GET /api/v2/pokemon/{id}`
- **字段**: `pokemonData.types[]`，按 `slot` 排序后取 `type.name`
- **示例**: `["grass", "poison"]`
- **触发时机**: 仅在新宝可梦首次入库时拉取

### 4. 图片 (image)

- **来源**: PokeAPI sprite → Cloudflare R2
- **优先顺序**:
  1. HOME sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{id}.png`
  2. Official Artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`
- **存储**: 上传至 R2 bucket，key 为 `pokemon/{slug}.png`
- **访问 URL**: `https://assets.pokopiaguide.com/pokemon/{slug}.png`
- **逻辑**: `uploadPokemonImage()` 先检查 R2 上是否已存在，不重复上传

### 5. 特长 (specialties)

- **来源**（按优先级）:
  1. **已有数据** — JSON 中已存在的 `pokopia.specialties` 不会被覆盖
  2. **Serebii 列表页** — `https://serebii.net/pokemonpokopia/availablepokemon.shtml`，解析表格第 4 列的 `<a><u>` 标签
  3. **Serebii 详情页** — 各宝可梦详情页中 "Speciality" 行
  4. **Game8** — `https://game8.co/games/Pokemon-Pokopia/archives/578286`，解析 30x30 特长图标的 alt 文本
- **校验**: 仅接受 `VALID_SPECIALTIES` 集合中的值（grow、burn、water、fly 等 30 种）
- **示例**: `["grow"]`、`["burn", "fly"]`

### 6. 出现时间 (timeOfDay)

- **来源**（按优先级）:
  1. **已有数据** — 不覆盖
  2. **Serebii 详情页** — "Habitats & Locations" 区块内嵌套表格的 "Time" 列，按 `<br>` 分割后映射
  3. **Game8** — 30x30 时间图标的 alt 文本
- **映射表**:
  | Serebii 原始值 | 内部值 |
  |---------------|--------|
  | morning | dawn |
  | day | day |
  | evening | dusk |
  | night | night |
- **示例**: `["dawn", "day", "dusk"]`、`null`（无限制时为 null）

### 7. 天气 (weather)

- **来源**（按优先级）:
  1. **已有数据** — 不覆盖
  2. **Serebii 详情页** — "Habitats & Locations" 区块嵌套表格的 "Weather" 列
  3. **Game8** — 30x30 天气图标的 alt 文本
- **映射表**:
  | Serebii 原始值 | 内部值 |
  |---------------|--------|
  | sun | sunny |
  | cloud | cloudy |
  | rain | rainy |
  | snow | snowy |
- **示例**: `["sunny", "cloudy", "rainy"]`、`null`

### 8. 栖息地 (habitats)

#### 数据（名称、ID、稀有度）

- **来源**: Serebii 详情页 — "Habitats & Locations" 区块
- **解析方式**: 按列解析（每列一个栖息地）
  - **名称行**: `td.fooevo` 中的 `<a>` 文本
  - **ID 行**: `td.cen` 中 `img[src*='habitatdex']` 的文件名数字（如 `/1.png` → id=1）
  - **稀有度行**: `td.fooinfo` 中 "Rarity:" 后的文本
- **稀有度映射**:
  | Serebii 原始值 | 内部值 |
  |---------------|--------|
  | common | common |
  | uncommon | rare |
  | rare | rare |
  | very rare | very-rare |
- **名称本地化**:
  - 英文：Serebii 原始名称
  - 日文：`content/habitat-mapping.json`（key = habitat ID → 日文名）
  - 中文：`content/habitat-mapping-zh.json`（key = habitat ID → 中文名）
- **示例**:
  ```json
  {
    "id": 1,
    "name": "Tall Grass",
    "rarity": "common"
  }
  ```

#### 图片

- **存放位置**: `public/images/habitats/habitat_{id}.png`
- **来源**: Serebii `habitatdex` 图片（URL 模式 `serebii.net/.../habitatdex/{id}.png`）
- **获取方式**: **手动下载**，无自动化脚本。脚本仅解析图片 URL 提取栖息地 ID，不会自动下载图片
- **引用方式**: 前端通过 `/images/habitats/habitat_{id}.png` 路径引用（如 `habitat_1.png`、`habitat_22.png`）
- **注意**: 新栖息地出现时需手动下载对应图片放入此目录

---

## 附加数据

以下字段也在脚本中处理，但不依赖外部抓取：

| 字段 | 来源 | 说明 |
|------|------|------|
| evolvesFrom / evolvesTo | PokeAPI | `pokemon-species` → `evolution_chain` |
| obtainMethod | 默认值 / 手动 | 默认 `"habitat"`，可手动改为 `"trade"` / `"evolution"` 等 |

## 运行脚本

```bash
# 正常运行（增量更新）
node scripts/update-pokopia-data.mjs

# 仅看输出，不写文件
node scripts/update-pokopia-data.mjs --dry-run

# 强制重新抓取所有
node scripts/update-pokopia-data.mjs --force

# 仅补传缺失图片
node scripts/update-pokopia-data.mjs --upload-images

# 持续监控模式（默认 30 分钟间隔）
node scripts/update-pokopia-data.mjs --watch --interval=60
```

## JSON 输出格式

每只宝可梦在 `content/{en,zh,ja}/pokemon/{slug}.json` 各有一份：

```json
{
  "id": 1,
  "slug": "bulbasaur",
  "name": "Bulbasaur",
  "types": ["grass", "poison"],
  "image": "https://assets.pokopiaguide.com/pokemon/bulbasaur.png",
  "pokopia": {
    "specialties": ["grow"],
    "timeOfDay": ["dawn", "day", "dusk", "night"],
    "weather": ["sunny", "cloudy", "rainy"],
    "obtainMethod": "habitat",
    "evolvesFrom": null,
    "evolvesTo": ["ivysaur"],
    "habitats": [
      { "id": 1, "name": "Tall Grass", "rarity": "common" }
    ]
  }
}
```
