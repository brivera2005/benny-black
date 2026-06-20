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
npx wrangler pages deploy . --project-name=benny-black
```

### Option B — GitHub integration

1. Push this folder to `github.com/brivera2005/benny-black`
2. In Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Select the repo, set build command to empty, output directory to `/`

Custom domain (optional): add `bennyblack.com` or `music.bennyblack.com` in Pages settings.

## Tracks

Official singles are listed in `js/tracks.json`. Tracks with verified local masters play from `audio/`; others embed the official Spotify release player with links to Apple Music.

## License

Music © Benny Black. Site code MIT.
