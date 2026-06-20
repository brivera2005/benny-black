# Benny Black — Official Artist Site

Modern pop country meets active hard rock. Static site with a custom player for official singles.

## Local preview

```bash
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080` (or the port shown).

## Deploy to Cloudflare Pages

### Option A — Wrangler CLI (direct upload)

```bash
npm install -g wrangler   # or use npx wrangler
wrangler login
npx wrangler pages deploy . --project-name=bennyblack --branch=main
```

### Option B — GitHub integration

1. Push this folder to `github.com/brivera2005/benny-black`
2. In Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Select the repo, set build command to empty, output directory to `/`

Custom domain (optional): add `bennyblack.com` or `music.bennyblack.com` in Pages settings.

## Tracks

Official singles live in `js/tracks.json` as a flat array sorted by Spotify play count (most played first). Each tile shows the artist (Benny Black or Hyperdose) with a genre badge. Tracks with verified local masters play from `audio/`; others use Apple Music previews with links to Spotify and Apple Music.

Deep link: `#music` or `#stream` for the unified grid.

## License

Music © Benny Black. Site code MIT.
