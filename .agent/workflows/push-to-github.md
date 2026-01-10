---
description: Upload all current changes to GitHub
---

1. Check git status
   git status

// turbo
2. Add all changes
   git add .

3. Commit changes (Replace message with a specific summary of work done)
   git commit -m "feat/fix/chore: [Detailed description of changes]"

4. Push to remote
   git push origin main

5. Verify Push Success
   echo "✅ Verification:" && git log -1 --format="%h - %s (%cr)" && echo "Uploaded to:" && git remote get-url origin
