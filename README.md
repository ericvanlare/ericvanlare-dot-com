# ericvanlare.com

Personal website built with [Astro](https://astro.build/) and React islands.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # Preview the build locally
```

## Architecture

- **Astro** for static site generation (SSG)
- **React islands** for interactive components (Header, PaintMyCity, Admin)
- **Tailwind CSS v4** for styling
- **Cloudflare Pages** for hosting
- **Cloudflare Worker** (in `worker/`) for API endpoints

## Structure

```
src/
  pages/           # Astro pages (file-based routing)
  layouts/         # Astro layouts
  components/      # Astro + React components
  react/           # React-only components (interactive islands)
  blog-content/    # Blog post TSX components
  data/            # Post metadata
  hooks/           # React hooks
  utils/           # Utility functions
  styles/          # Global CSS
worker/            # Cloudflare Worker API (separate deployment)
public/            # Static assets
```

## Adding a Blog Post

1. Create a new TSX component in `src/blog-content/posts/`
2. Add the post metadata to `src/data/posts.ts`

Posts are rendered as static HTML at build time for SEO.
