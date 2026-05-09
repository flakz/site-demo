# Marno AI Chat Widget

Landing page with animated background, flip board effect, and integrated chat widget.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_WEBHOOK_URL` — n8n webhook endpoint
- `NEXT_PUBLIC_KB_SLUG` — Knowledge base slug
- `GEMINI_API_KEY` — Gemini API key (optional for local dev)
