#!/bin/bash
# GCP Cloud Run Deployment Setup Script
# This script automates the initial GCP setup for Shopping Memo backend

set -e

PROJECT_ID="${1:-shopping-497906}"
REGION="asia-southeast1"
SERVICE_NAME="shopping-memo-backend"
REPO_NAME="shopping-memo"

echo "======================================"
echo "Shopping Memo - GCP Setup Script"
echo "======================================"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Step 1: Set project
echo "📍 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  serviceusage.googleapis.com

echo "✅ APIs enabled"

# Step 3: Create Artifact Registry repository
echo "📦 Creating Artifact Registry repository..."
if gcloud artifacts repositories describe $REPO_NAME --location=$REGION &> /dev/null; then
    echo "ℹ️  Repository already exists"
else
    gcloud artifacts repositories create $REPO_NAME \
      --repository-format=docker \
      --location=$REGION \
      --description="Shopping Memo application images"
    echo "✅ Repository created"
fi

# Step 4: Configure Cloud Build service account
echo "🔐 Configuring Cloud Build service account..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "   Service Account: $CLOUD_BUILD_SA"

# Grant roles
echo "   Granting IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/run.admin \
  --condition=None \
  --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/iam.serviceAccountUser \
  --condition=None \
  --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/artifactregistry.writer \
  --condition=None \
  --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/secretmanager.secretAccessor \
  --condition=None \
  --quiet 2>/dev/null || true

echo "✅ IAM roles configured"

# Step 5: Create Secret Manager secret
echo "🔑 Setting up Secret Manager..."
echo ""
echo "⚠️  You need to create a secret for SUPABASE_SERVICE_ROLE_KEY manually:"
echo ""
echo "1. Get your Supabase Service Role Key:"
echo "   - Go to: https://app.supabase.com/project/akyxznfvwogxhcwocukj/settings/api"
echo "   - Copy the 'service_role' key"
echo ""
echo "2. Create the secret:"
echo "   echo -n 'YOUR_KEY_HERE' | gcloud secrets create supabase-service-role-key --replication-policy=automatic --data-file=-"
echo ""

# Check if secret already exists
if gcloud secrets describe supabase-service-role-key &> /dev/null; then
    echo "✅ Secret 'supabase-service-role-key' already exists"
else
    echo "⏳ Waiting for you to create the secret..."
    echo "   Once created, you can continue with deployment."
fi

echo ""
echo "======================================"
echo "✅ GCP Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update backend/cloudbuild.yaml with your Supabase credentials:"
echo "   - _SUPABASE_URL"
echo "   - _SUPABASE_ANON_KEY"
echo "   - _SUPABASE_JWT_SECRET"
echo ""
echo "2. Deploy the backend:"
echo "   gcloud builds submit --config backend/cloudbuild.yaml --project=$PROJECT_ID"
echo ""
echo "3. Get your service URL:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'"
echo ""
echo "For more details, see: GCP_DEPLOYMENT_GUIDE.md"
