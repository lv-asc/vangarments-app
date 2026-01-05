---
description: Systematic Git Pull from remote
---

1. Check git status
   git status

// turbo
2. Stash changes (if any)
   git stash

3. Pull from remote
   git pull origin main

// turbo
4. Pop stashed changes (if any)
   git stash pop

5. Verify Pull Success
   echo "✅ Verification:" && git log -1 --format="%h - %s (%cr)" && echo "Current status:" && git status
