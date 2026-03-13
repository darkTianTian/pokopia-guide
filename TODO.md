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

## Crafting Icon Accuracy

- Some crafting icon mappings in `CRAFTING_ICON_STATIC_MAP` (update-pokopia-data.mjs) may be inaccurate:
  - fire-hydrant → trafficcone (may not be correct match)
  - mine-cart → cart (may not be correct match)
- Need in-game verification
