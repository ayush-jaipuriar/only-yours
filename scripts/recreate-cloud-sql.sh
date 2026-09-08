#!/usr/bin/env bash
set -euo pipefail

# This script recreates the minimum-viable Cloud SQL PostgreSQL instance
# whenever you are ready to resume testing.
PROJECT_ID="only-yours"
INSTANCE_NAME="onlyyours-db"
REGION="asia-south1"
DB_NAME="onlyyours"
DB_PASSWORD="OnlyYoursSecure2026!"

echo "1/2 Creating Cloud SQL instance $INSTANCE_NAME ($REGION, db-f1-micro)..."
gcloud sql instances create "$INSTANCE_NAME" \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --root-password="$DB_PASSWORD" \
  --project="$PROJECT_ID"

echo "2/2 Creating database $DB_NAME..."
gcloud sql databases create "$DB_NAME" \
  --instance="$INSTANCE_NAME" \
  --project="$PROJECT_ID"

echo "Done! Cloud SQL instance is active. Cloud Run will automatically connect and Flyway will auto-migrate schemas."
