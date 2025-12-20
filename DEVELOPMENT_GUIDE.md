# Development Workflow & Concepts Guide

This guide explains how your local environment interacts with Google Cloud and GitHub, and recommends a workflow for efficient development.

## 1. Concepts: Local vs. Cloud

Think of your app in two distinct "worlds":

| Feature | 💻 **Local Environment** (Your Computer) | ☁️ **Cloud Environment** (Google Cloud) |
| :--- | :--- | :--- |
| **Code Source** | The files in your `Documents/Vangarments` folder. | A copy of your code built into a "Docker Image". |
| **Running App** | Runs via `npm run dev`. | Runs on **Cloud Run** instances. |
| **Database** | **Local PostgreSQL**. Data lives on your Mac hard drive. | **Cloud SQL**. Data lives in Google's data center. |
| **Purpose** | Building, experimenting, breaking things safely. | Showing your work to others, real user access. |
| **Feedback Speed** | Instant (changes appear immediately/Hot Reload). | Slow (requires Build -> Push -> Deploy, ~5 mins). |

### Answers to your Questions

**1. Do they share databases?**
**No.** By default, they are completely separate.
*   **Local App** connecting to `localhost:5432` has its own users, items, and brands.
*   **Cloud App** connecting to `Cloud SQL` has a *different* set of users, items, and brands.
*   *Why?* This is good! You can delete/reset your local database while testing without accidentally deleting real user data in the cloud.

**2. Should I develop locally or on cloud?**
**Develop Exclusively Locally.**
*   Write code, save, and see results instantly on `localhost:3000`.
*   Debug errors locally (reading the terminal logs on VS Code is much easier).
*   Only deploy to the cloud when you have finished a feature and verified it works.

**3. What does Git Push do?**
`git push` uploads the **Source Code** files from your computer to GitHub.
*   It does **not** upload your database (users, products).
*   It does **not** automatically update the running Cloud website (unless you have set up a Continuous Deployment pipeline, but usually we run the deploy script manually).

---

## 2. Recommended Workflow

Follow this cycle for every new feature:

### Phase 1: Local Development (The "Sandbox")
1.  **Start Local Server**: Open VS Code terminal and run `npm run dev`.
2.  **Write Code**: Make changes to files.
3.  **Verify**: Open `http://localhost:3000` in Chrome.
    *   *Did it work?* Great!
    *   *Did it break?* Read the error in the VS Code terminal and fix it.
4.  **Repeat**: Keep editing and saving until the feature is perfect.

### Phase 2: Save Progress (Git)
Once the feature works locally:
1.  **Stage Changes**: `git add .`
2.  **Commit**: `git commit -m "Added new brand profile feature"`
3.  **Push**: `git push origin main`
    *   *Now your code is safely backed up on GitHub.*

### Phase 3: Go Live (Deployment)
Now that the code is safe and tested, modify the live cloud version:
1.  **Run Deploy Script**:
    ```bash
    ./scripts/gcp-deploy.sh staging
    ```
2.  **Wait**: The script sends your code to Google, builds a new "container", and replaces the old website with the new one.
3.  **Verify Cloud**: Open your `...run.app` URL. Check if the new feature works there too.

---

## 3. Troubleshooting

**"It works locally but fails on Cloud"**
This is common. It usually happens because:
*   **Environment Variables**: You set a key in your local `.env` file but forgot to add it to the Cloud Run configuration.
*   **Data Differences**: Your local database has "Brand X" created, but the Cloud database is empty. You usually need to re-create the test data on Cloud manually (or use a seed script).
*   **Network**: Local can access everything on your laptop. Cloud is stricter (e.g., CORS issues, which we just fixed!).

## Summary
*   **Code** locally.
*   **Test** locally.
*   **Push** to save.
*   **Deploy** to publish.
