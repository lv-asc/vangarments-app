#!/bin/bash

# Vangarments Database Sync Script (Local -> Cloud)
# This script clones your local PostgreSQL database to your Google Cloud SQL instance.

# 1. Configuration
ENVIRONMENT="staging"
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
DB_INSTANCE="vangarments-db"
BUCKET_NAME="vangarments-backups"
LOCAL_SQL_FILE="./local_dump.sql"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: GCP Project ID not set."
  exit 1
fi

echo "🔄 Starting Database Sync (Local -> Cloud SQL)..."

# 2. Extract local database URL from .env
# We assume the local app is in packages/backend
ENV_FILE="./packages/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  No .env file found in packages/backend. Please ensure you have local credentials configured."
    exit 1
fi

# Extract DATABASE_URL
LOCAL_DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2-)

if [ -z "$LOCAL_DB_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in $ENV_FILE"
    exit 1
fi

echo "📦 Dumping local database..."
# Use pg_dump to create a SQL file compatible with Cloud SQL
# Note: Cloud SQL import prefers plain SQL format
pg_dump "$LOCAL_DB_URL" --no-owner --no-privileges --plain > "$LOCAL_SQL_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Error: Local database dump failed."
    exit 1
fi

echo "✅ Local dump created: $LOCAL_SQL_FILE"

# 3. Upload to Google Cloud Storage
echo "☁️  Uploading dump to GCS bucket: gs://$BUCKET_NAME/"
gsutil cp "$LOCAL_SQL_FILE" "gs://$BUCKET_NAME/$LOCAL_SQL_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Error: Upload to GCS failed."
    exit 1
fi

# 4. Grant Cloud SQL service account access to the bucket
echo "🔐 Ensuring Cloud SQL has permission to read the dump..."
SQL_SA=$(gcloud sql instances describe "$DB_INSTANCE" --format='value(serviceAccountEmailAddress)')
gsutil iam ch "serviceAccount:$SQL_SA:objectViewer" "gs://$BUCKET_NAME"

# 5. Import into Cloud SQL
echo "🚀 Importing into Cloud SQL instance ($DB_INSTANCE)..."
echo "⚠️  Note: This will overwrite data in the cloud database."
gcloud sql import sql "$DB_INSTANCE" "gs://$BUCKET_NAME/$LOCAL_SQL_FILE" \
    --project="$PROJECT_ID" \
    --database="vangarments" \
    --quiet

if [ $? -ne 0 ]; then
    echo "❌ Error: Cloud SQL import failed."
else
    echo "🎉 Database successfully cloned to Cloud SQL!"
    echo "You should now be able to log in with your local credentials on the staging site."
fi

# 6. Cleanup
rm "$LOCAL_SQL_FILE"
# Optional: remove from GCS
# gsutil rm "gs://$BUCKET_NAME/$LOCAL_SQL_FILE"
