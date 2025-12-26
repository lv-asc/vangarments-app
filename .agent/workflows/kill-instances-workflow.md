---
description: Surgical zombie npm run dev killer
---

# /kill-instances-workflow

This workflow terminates ONLY the processes running on ports 3000, 3001, and 3002. This avoids crashing the IDE background processes while ensuring the web application starts from a fresh state.

// turbo-all

1. Kill processes on application ports (3000, 3001, 3002).
```bash
lsof -ti:3000,3001,3002 | xargs kill -9 || true
```

2. Start the development server freshly.
```bash
npm run dev > dev.log 2>&1 &
```
