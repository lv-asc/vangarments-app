#!/bin/bash

# Vangarments GCP Deployment Script (Cloud Run)
# Usage: ./scripts/gcp-deploy.sh [staging|production]

ENVIRONMENT=${1:-staging}
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
REPO_NAME="vangarments-repo"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: GCP Project ID not set. Please run 'gcloud config set project [PROJECT_ID]'"
  exit 1
fi

echo "🚀 Deploying Vangarments to $ENVIRONMENT ($PROJECT_ID)..."

# 1. Build and push Backend
echo "📦 Building Backend..."
IMAGE_BACKEND="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"
gcloud builds submit --tag "$IMAGE_BACKEND" ./packages/backend

# 2. Deploy Backend to Cloud Run
echo "☁️ Deploying Backend to Cloud Run..."
DB_INSTANCE="$PROJECT_ID:$REGION:vangarments-db"
gcloud run deploy "vangarments-backend-$ENVIRONMENT" \
    --image "$IMAGE_BACKEND" \
    --set-env-vars="NODE_ENV=$ENVIRONMENT,DB_HOST=/cloudsql/$DB_INSTANCE" \
    --add-cloudsql-instances="$DB_INSTANCE" \
    --allow-unauthenticated \
    --region="$REGION"

BACKEND_URL=$(gcloud run services describe "vangarments-backend-$ENVIRONMENT" --region="$REGION" --format='value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# 3. Build and push Web
echo "📦 Building Web Frontend..."
IMAGE_WEB="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/web:latest"
gcloud builds submit --tag "$IMAGE_WEB" ./packages/web

# 4. Deploy Web to Cloud Run
echo "☁️ Deploying Web to Cloud Run..."
gcloud run deploy "vangarments-web-$ENVIRONMENT" \
    --image "$IMAGE_WEB" \
    --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL,NODE_ENV=$ENVIRONMENT" \
    --allow-unauthenticated \
    --region="$REGION"

WEB_URL=$(gcloud run services describe "vangarments-web-$ENVIRONMENT" --region="$REGION" --format='value(status.url)')
echo "✅ Web deployed at: $WEB_URL"

echo "🎉 Deployment complete for $ENVIRONMENT!"
