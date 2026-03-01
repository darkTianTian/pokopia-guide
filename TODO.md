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
