---
description: Clone the local database to the Google Cloud SQL instance
---

This workflow automates the process of dumping your local PostgreSQL data and importing it into your staging Cloud SQL environment.

1. Verify local database existence
   Check if the local PostgreSQL server is running and the database exists.
   git status

// turbo
2. Execute the sync script
   This will dump the local DB, upload to GCS, and import to Cloud SQL.
   ./scripts/sync-db.sh

3. Verify Cloud SQL Status
   Check if the import was successful by verifying the backend health.
   curl -s https://vangarments-backend-staging-827044800946.us-central1.run.app/health | grep "database"

4. Inform User
   Notify the user that the synchronization is complete and they can now log in with local credentials.
