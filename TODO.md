# TODO

## Pokemon Data Auto-Update Pipeline

### Background
- Pokemon data is fetched from PokeAPI via `scripts/fetch-pokemon.mjs`
- Images are stored on R2 (`assets.pokopiaguide.com`)
- Currently 96 confirmed Pokopia Pokemon, full roster (~300) will be known after game launch (2026-03-05)
- Script already supports incremental updates (skips existing R2 images)

### Plan
- Use **GitHub Actions** (not Cloudflare Workers) for scheduled data updates
- Maintain a `scripts/pokopia-dex.json` file with confirmed Pokemon IDs
- GitHub Actions workflow:
  1. Cron schedule (e.g. daily) or manual trigger
  2. Run `scripts/fetch-pokemon.mjs` to pull data from PokeAPI + upload images to R2
  3. Detect changes in `content/{en,cn,jp}/pokemon/` via `git diff`
  4. If changes exist, commit and push to trigger site rebuild
- Deployment platform TBD (Vercel / Cloudflare Pages / other)

### Prerequisites
- [ ] Decide on deployment platform
- [ ] Set up GitHub Actions workflow
- [ ] Extract Pokemon ID list from script into `scripts/pokopia-dex.json`
- [ ] Add R2 credentials as GitHub Actions secrets
- [ ] Configure deployment auto-trigger on push

### Notes
- No database needed for now — static JSON files are sufficient for ~300 Pokemon
- Revisit if user-interactive features (favorites, team builder, comments) are added
- Cloudflare Workers better suited for lightweight API / edge compute, not batch jobs

## Habitat Materials - Chinese Translation Verification

- `content/habitat-materials-zh.json` contains AI-translated Traditional Chinese item names (translated from Japanese source)
- These translations need verification against official in-game Traditional Chinese names
- Priority items to verify:
  - Furniture sets: 自然風/雅致/豪華/可愛/度假風/工業風/流行風/電競 series
  - Pokémon items: 皮卡丘/吉利蛋/飄浮泡泡/雷丘/風速狗/快龍/伊布/毽子草
  - Fossils: 翼之化石/頭蓋化石/頭錘化石/盾之化石/護盾化石/顎之化石/暴君化石/鰭之化石/凍原化石
- The English source file is missing many habitat IDs that exist in Japanese — Chinese file currently only covers IDs present in English
- Update script (`scripts/update-pokopia-data.mjs`) no longer overwrites zh file with English data

## Cooking Move Icons

- `public/images/cooking/moves/` needs 4 move icons: leafage.png, water-gun.png, cut.png, rock-smash.png
- User will provide screenshots later

## Item English Name Calibration

`content/item-name-mapping-en.json` — 775 entries total. ~670 sourced from Serebii (high confidence). The following need in-game verification:

| Category | Count | Confidence | Notes |
|----------|-------|------------|-------|
| Wallpapers (壁紙) | 20 | LOW | Not on Serebii, translated from Japanese |
| Kits (キット) | 28 | MEDIUM | From Game8 English, not verified |
| Paint Balloons (いろふうせん) | 19 | LOW | Color names translated, base name not on Serebii |
| Rugs (ラグ) | 10 | MEDIUM | Size/shape prefixes translated |
| Mysterious Slates (ナゾのせきばん) | 27 | MEDIUM-HIGH | Letter format needs verification |
| Garden ornament | 1 | LOW | Direct translation, not on Serebii |

## Item Chinese Translation Status

### Done (AI translated, 2026-03-13)
- `content/item-name-mapping-zh.json` — 787 entries (AI translated, needs official name verification)
- `content/item-obtain-mapping-zh.json` — 231 entries
- `content/item-recipe-mapping-zh.json` — 109 entries
- `content/item-desc-mapping-zh.json` — 581 entries (done, AI translated)

### TODO: Item Name Official Verification
- Current zh item names are AI-translated, NOT official in-game names
- Need to verify against official Traditional Chinese game data
- Potential sources: in-game screenshots, community wikis, datamine
- Priority: high-visibility items (materials, furniture, tools) first
- No comprehensive zh item database found online as of 2026-03-13

## Item Korean Translation Status

### Done (AI translated, 2026-03-14)
- `content/item-name-mapping-ko.json` — 787 entries
- `content/item-obtain-mapping-ko.json` — 231 entries
- `content/item-recipe-mapping-ko.json` — 109 entries
- `content/item-desc-mapping-ko.json` — 946 entries

### Other Korean translations (AI translated, 2026-03-14)
- `content/habitat-mapping-ko.json` — 210 entries (habitat names)
- `content/habitat-materials-ko.json` — 212 entries (habitat material lists)
- `content/material-name-mapping.json` — 283 entries (ko field added)
- `content/cooking-name-mapping-ko.json` — 64 entries (recipes, ingredients, tools, etc.)
- `content/crafting-name-mapping-ko.json` — 98 entries (recipes, materials)
- `src/i18n/ko.json` — UI translations
- `content/ko/pokemon/` — 303 files (names from PokeAPI official, habitats EN fallback)
- `content/ko/guides/` — copied from EN, not yet translated
- `content/ko/events/` — copied from EN, not yet translated

### TODO: Korean Official Verification
- Only Pokemon names are official (from PokeAPI)
- ALL other Korean translations are AI-generated, NOT verified against in-game data
- Need to verify against official Korean game data when available
- Potential sources: Korean gaming sites (Namu Wiki, GameToc), in-game screenshots, community
- Priority: item names, habitat names, crafting/cooking names

## New Page Development (from Korean search trends, 2026-03-14)

Based on Korean 7-day Google Trends analysis. These pages will serve all locales (en/zh/ja/ko).

### Stamp Collection Guide (스탬프)
- **Search trend**: RISING +2,200% (fastest growing)
- Content: stamp locations, how to collect, rewards
- Route: `/guides/stamps`
- Priority: HIGH

### Environment Level Guide (환경 레벨)
- **Search trend**: RISING +500%
- Content: what environment levels do, how to raise them, shop unlocks per level, per-town breakdown
- Route: `/guides/environment-level`
- Priority: HIGH

### Developer Island Guide (개발자 섬)
- **Search trend**: RISING (breakout)
- Content: how to unlock, what's available, secrets
- Route: `/guides/developer-island`
- Priority: HIGH

### Town Overview Page (마을)
- **Search trend**: TOP +300%
- Content: all towns with shop inventory, environment level requirements, key NPCs, unlockable content
- Towns: Palette Town (まっさらな街), Rocky Ridges (ゴツゴツやまの街), Gloomy Seaside (ドンヨリうみべの街), Dusty Desert (パサパサこうやの街), Sparkling Skylands (キラキラうきしまの街)
- Route: `/guides/towns` or dedicated `/towns` section
- Priority: MEDIUM-HIGH
- Can leverage existing shop/habitat data

### Game Boy Collection Guide (게임 보이)
- **Search trend**: RISING +550%
- Content: Game Boy item locations, how to collect
- Route: `/guides/game-boy`
- Priority: MEDIUM

### Crystal Guide (크리스탈)
- **Search trend**: RISING +600%
- Content: crystal types, locations, uses
- Route: `/guides/crystals`
- Priority: MEDIUM

### Dream Island Guide (꿈섬)
- **Search trend**: TOP + RISING +550%
- Content: Dream Island mechanics, Monster Ball spawns, rare items
- Route: `/guides/dream-island`
- Priority: MEDIUM

## Crafting Icon Accuracy

- Some crafting icon mappings in `CRAFTING_ICON_STATIC_MAP` (update-pokopia-data.mjs) may be inaccurate:
  - fire-hydrant → trafficcone (may not be correct match)
  - mine-cart → cart (may not be correct match)
- Need in-game verification
