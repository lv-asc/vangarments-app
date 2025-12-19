# GCP Deployment Guide (Cloud Run)

This guide explains how to deploy the Vangarments platform to Google Cloud Platform using **Cloud Run**.

> [!TIP]
> You can use the automated script [gcp-deploy.sh](file:///Users/lv/Documents/Vangarments/vangarments-app/scripts/gcp-deploy.sh) to handle the build and deployment process in one command.

## Prerequisites

1.  **Google Cloud SDK**: [Install gcloud CLI](https://cloud.google.com/sdk/docs/install)
2.  **GCP Project**: Create a project and enable billing.
3.  **Enabled APIs**:
    ```bash
    gcloud services enable \
      run.googleapis.com \
      sqladmin.googleapis.com \
      artifactregistry.googleapis.com \
      cloudbuild.googleapis.com
    ```

## 1. Container Registry Setup

Create a repository in Google Artifact Registry:

```bash
gcloud artifacts repositories create vangarments-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Vangarments Docker images"
```

## 2. Database (Cloud SQL)

1. Create a PostgreSQL instance:
   ```bash
   gcloud sql instances create vangarments-db \
       --database-version=POSTGRES_15 \
       --tier=db-f1-micro \
       --region=us-central1
   ```
2. Create the database and user:
   ```bash
   gcloud sql databases create vangarments_prod --instance=vangarments-db
   gcloud sql users set-password postgres --instance=vangarments-db --password=YOUR_PASSWORD
   ```

## 3. Deploy Backend API

Build and deploy the backend container to Cloud Run:

```bash
# Build & Push (running from root)
gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/vangarments-repo/backend:latest ./packages/backend

# Deploy
gcloud run deploy vangarments-backend \
    --image us-central1-docker.pkg.dev/[PROJECT_ID]/vangarments-repo/backend:latest \
    --set-env-vars="DB_HOST=/cloudsql/[PROJECT_ID]:us-central1:vangarments-db,DB_NAME=vangarments_prod" \
    --add-cloudsql-instances=[PROJECT_ID]:us-central1:vangarments-db \
    --allow-unauthenticated \
    --region=us-central1
```

## 4. Deploy Next.js Web App

```bash
# Build & Push
gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/vangarments-repo/web:latest ./packages/web

# Deploy
gcloud run deploy vangarments-web \
    --image us-central1-docker.pkg.dev/[PROJECT_ID]/vangarments-repo/web:latest \
    --set-env-vars="NEXT_PUBLIC_API_URL=https://vangarments-backend-xxx-uc.a.run.app" \
    --allow-unauthenticated \
    --region=us-central1
```

## Why this choice?

- **Cloud Run**: Best for Next.js and Express. It handles the server-side rendering and auto-scales to zero when no one is using the app, saving you money during development.
- **Firebase**: Use the Firebase Console to add your GCP project for Authentication and Push Notifications (FCM) for the Expo app.
