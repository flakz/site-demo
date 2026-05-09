# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marno AI Chat Widget — Next.js 15 chat widget that connects to n8n webhook backend.

## Commands

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
npm run clean   # Clear .next cache
```

## Environment Variables

- `NEXT_PUBLIC_WEBHOOK_URL` — n8n webhook endpoint (default: `https://n8n.marno.pro/webhook/marno-chat`)
- `NEXT_PUBLIC_KB_SLUG` — Knowledge base slug (default: `kbase`)
- `GEMINI_API_KEY` — Gemini API key (for local dev)

Copy `.env.example` to `.env.local` and fill in values.

## Architecture

**Single-page app** — All logic in `app/page.tsx`:

- Chat state: `messages[]` array with `{id, role: 'user'|'model'|'system', text}`
- Session persistence via `sessionIdRef` (ref, not state — survives re-renders)
- Webhook integration: POSTs `{query, sessionId, slug}` to `WEBHOOK_URL`

**Streaming animation** — Text streams character-by-character:
```typescript
for (let i = 0; i < chars.length; i += 2) {
  fullText += chars.slice(i, i + 2).join("");
  setMessages(prev => prev.map(m => m.id === modelMessageId ? {...m, text: fullText} : m));
  await new Promise(r => setTimeout(r, 10));
}
```

**Message rendering** — Messages split on `\n\n` for paragraph grouping, rendered via `react-markdown` with `remarkBreaks`.

## Styling

- Tailwind CSS 4 with `@tailwindcss/typography` plugin
- Custom scrollbar-hide utility (CSS-based, check `globals.css`)
- Karla font via `next/font/google`
- Motion/react for animations (layout animations on messages, mount/unmount transitions on chat panel)

## Key Patterns

- `'use client'` directive on components using hooks
- `AnimatePresence` from motion/react wraps conditional elements
- `layoutId` on suggestions enables animation between suggestion buttons and chat bubbles
- `sessionIdRef` re-generates on mount (empty dependency array in useEffect)
