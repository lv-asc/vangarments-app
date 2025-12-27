---
description: Fix broken UI/missing styles (giant icons, unstyled text)
---

# /fix-broken-ui

Use this workflow when the application UI looks broken, styles are missing, icons are huge, or the layout is scattered. This is usually caused by a corrupted Next.js cache or zombie processes.

// turbo-all

1. Kill any existing development server instances on ports 3000-3002.
```bash
lsof -ti:3000,3001,3002 | xargs kill -9 || true
```

2. Clean the Next.js cache and temporary files.
```bash
rm -rf packages/web/.next
rm -rf packages/web/.turbo
rm -rf packages/backend/dist
```

3. Re-install dependencies to ensure consistency (optional but recommended for weird issues).
```bash
npm install
```

4. Restart the development server.
```bash
npm run dev
```
