# Google Cloud Platform Setup Guide

This guide covers everything you need to set up the Google Cloud Platform (GCP) environment for Vangarments.

## 1. Install Google Cloud SDK

The `gcloud` CLI is required for deployment and managing cloud resources.

- **macOS (Homebrew)**:
  ```bash
  brew install --cask google-cloud-sdk
  ```
- **Linux/Windows**:
  Follow the [official installation guide](https://cloud.google.com/sdk/docs/install).

After installation, initialize the SDK:
```bash
gcloud init
```

## 2. Create a GCP Project

1. Go to the [GCP Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `vangarments-prod`).
3. Enable Billing for the project.

## 3. Enable Required APIs

Run the following command to enable all necessary services:

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  vision.googleapis.com \
  storage-api.googleapis.com
```

## 4. Set Up Application Credentials

For local development and backend integration, you need a Service Account key.

1. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create vangarments-sa \
       --display-name="Vangarments Service Account"
   ```

2. **Assign Roles**:
   ```bash
   # Storage Admin
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
       --member="serviceAccount:vangarments-sa@[PROJECT_ID].iam.gserviceaccount.com" \
       --role="roles/storage.admin"

   # Vision AI User
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
       --member="serviceAccount:vangarments-sa@[PROJECT_ID].iam.gserviceaccount.com" \
       --role="roles/visionai.user"
   ```

3. **Generate JSON Key**:
   ```bash
   gcloud iam service-accounts keys create ./packages/backend/gcp-key.json \
       --iam-account=vangarments-sa@[PROJECT_ID].iam.gserviceaccount.com
   ```

> [!CAUTION]
> Never commit `gcp-key.json` to GitHub. It is already added to `.gitignore`.

## 5. Configure Storage Buckets

Create buckets for image storage and database backups:

```bash
# Main Storage
gsutil mb -l us-central1 gs://vangarments-storage

# Database Backups
gsutil mb -l us-central1 gs://vangarments-backups
```

## 6. Deployment

Once the environment is set up, you can deploy using the automated script:

```bash
chmod +x scripts/gcp-deploy.sh
./scripts/gcp-deploy.sh staging
```

For more details on deployment, see [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md).
