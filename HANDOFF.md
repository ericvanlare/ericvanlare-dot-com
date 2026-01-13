# Handoff: ericvanlare-dot-com

## Current State

Personal site redesigned from resume-style to blog-first. Built with React 19, React Router, Tailwind v4, Vite, TypeScript.

**Pages:**
- `/` - Home with tagline + featured post card
- `/posts` - All posts as cards
- `/posts/:slug` - Individual post
- `/about` - Bio + project cards (Naiad Lens, PaintMyCity)
- `/projects/paintmycity` - Interactive neural style transfer app

**Posts system:**
- Posts defined in `src/data/posts.tsx`
- Content as React components in `src/content/posts/`
- One post in progress: "Designing a Diagramming Agent for Codebases"

## What We Did Last Session

1. Removed thumbnails from ProjectCard, made entire cards clickable
2. Updated Posts page to use card styling consistent with Home/About
3. Updated About bio: "AI engineer and founder building AI tools and new experiences"
4. Drafted skeleton for first post about grounded codebase diagrams
5. Committed and pushed to main

## What We Did This Session

1. Deployed site to Cloudflare Pages (Git-connected, auto-deploys on push)
2. Fixed `base` path issue — was hardcoded for GitHub Pages, now conditional via `GITHUB_PAGES` env var
3. Fixed `BrowserRouter basename` — now uses `import.meta.env.BASE_URL`
4. Rewrote first blog post "A Prompt for Grounded Codebase Diagrams" with actual prompt and usage examples
5. Transferred DNS management to Cloudflare (nameservers changed from Namecheap)
6. Added custom domain `ericvanlare.com` — SSL active

**Live URLs:**
- Production: https://ericvanlare.com
- Pages: https://ericvanlare-dot-com.pages.dev
- GitHub Pages (backup): https://ericvanlare.github.io/ericvanlare-dot-com/

## First Post Status ✅ COMPLETE

Post published at `/posts/designing-a-diagramming-agent` with:
- The prompt for generating grounded diagrams
- Three usage methods (paste, shell alias, skill file)
- Example output (.mmd and .naiad files)

Future enhancement: add interactive Naiad viewer

## Cloudflare Migration Plan

### Phase 1: Deploy to Cloudflare Pages ✅ COMPLETE

1. **Create project:** Cloudflare Dashboard → Pages → Create project → Connect to Git → Select `ericvanlare/ericvanlare-dot-com`

2. **Build settings:**
   - Framework preset: Vite
   - Build command: `pnpm run build`
   - Build output directory: `dist`

3. **Environment variables:**
   - `NODE_VERSION=20`

4. **Custom domain:** After first deploy → Custom domains → Add `ericvanlare.com`

5. **Disable GitHub Pages:** Once CF works, disable in GitHub repo Settings → Pages

### Phase 2: Add Admin Panel

Add `/admin` route with:
- Blog post management (create/edit/delete)
- AI site modification UI (like webcomic-sandbox)

This will be a client-side React page that calls the Worker API.

### Phase 3: Cloudflare Access Protection

Protect `/admin` before it goes live:
1. Zero Trust → Access → Applications → Add self-hosted app
2. Application domain: `ericvanlare.com/admin*`
3. Policy: Allow emails matching your email

### Phase 4: Worker API

Separate Cloudflare Worker (like webcomic-sandbox pattern) for:
- Write operations (if posts move to a CMS/database)
- AI site modification endpoints:
  - `POST /api/ai-mod/request` - Create GitHub issue assigned to Copilot
  - `GET /api/ai-mod/status` - Poll for PR + preview URL
  - `POST /api/ai-mod/approve` - Merge PR
  - `POST /api/ai-mod/reject` - Close PR
  - `POST /api/ai-mod/revise` - Request changes
  - `POST /api/ai-mod/revert` - Undo merged changes

**Worker secrets needed:**
- `GITHUB_TOKEN` - For GitHub API (issue/PR management)
- `ADMIN_ORIGIN` - CORS (e.g., `https://ericvanlare.com`)

**Pages env vars needed:**
- `PUBLIC_WORKER_URL` - Points to the Worker

### Architecture Reference (from webcomic-sandbox)

```
ericvanlare.com (Cloudflare Pages)
├── / (public)
├── /posts/* (public)
├── /about (public)
├── /admin (protected by CF Access)
│   └── calls Worker API for writes
│
ericvanlare-api.workers.dev (Cloudflare Worker)
├── POST /api/ai-mod/request
├── GET /api/ai-mod/status
├── POST /api/ai-mod/approve
├── POST /api/ai-mod/reject
└── CORS: only allows ADMIN_ORIGIN
```

## Commands

```bash
pnpm dev      # Local dev server
pnpm build    # Build for production (runs tsc then vite build)
pnpm preview  # Preview production build
pnpm lint     # ESLint
```

## Notes

- Using Tailwind v4 with custom accent colors (blues 400-900) in `src/index.css`
- Dark mode via `useDarkMode` hook, persists to localStorage, swaps favicon
- Mobile nav uses sm breakpoint (640px) not md
- PaintMyCity uses TensorFlow.js for neural style transfer (large bundle ~1.2MB)
