# Hisab Pagar – AI Summary proxy

A tiny free serverless function that sits between the app and Google Gemini.
The app sends the month's numbers → this proxy adds the secret API key → Gemini
returns a plain-language summary. **The API key never ships inside the app.**

## 1. Get a free Gemini API key (2 min)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account → **Create API key**.
3. Copy the key (looks like `AIza...`). Keep it private.

Free tier is plenty for monthly summaries.

## 2. Deploy the proxy (free, ~5 min) — Cloudflare Workers

You need Node installed. Then:

```bash
cd ai-proxy
npm install -g wrangler         # one time
wrangler login                  # opens browser, sign up free
wrangler secret put GEMINI_API_KEY   # paste your Gemini key when asked
wrangler deploy
```

After `deploy`, Wrangler prints a URL like:

```
https://hisab-ai.<your-subdomain>.workers.dev
```

Copy that URL.

### Alternative: paste in the dashboard (no CLI)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker**.
2. Replace the code with the contents of `worker.js` → **Deploy**.
3. Worker → **Settings → Variables → Add variable** → name `GEMINI_API_KEY`,
   value = your key, click **Encrypt** → **Save**.
4. Copy the worker's URL (`*.workers.dev`).

## 3. Put the URL in the app

Open `src/utils/aiSummary.ts` and set:

```ts
export const AI_PROXY_URL = 'https://hisab-ai.<your-subdomain>.workers.dev';
```

Rebuild the app. Done — the "AI Summary" button on the Salary Due screen now works.

## Cost

Cloudflare Workers free tier = 100,000 requests/day. Gemini free tier covers
low volume. A monthly summary is one request, so this is effectively free.
