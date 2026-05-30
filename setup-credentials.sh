#!/bin/bash
# Interactive script to set up GCP Cloud Build with Supabase credentials
# This guides you through getting the credentials and updating cloudbuild.yaml

set -e

PROJECT_ID="shopping-497906"
BACKEND_DIR="./backend"
CLOUDBUILD_FILE="$BACKEND_DIR/cloudbuild.yaml"

echo "======================================"
echo "🔐 Supabase Credentials Setup"
echo "======================================"
echo ""
echo "This script will help you:"
echo "1. Get your Supabase credentials"
echo "2. Create a Secret Manager secret"
echo "3. Update cloudbuild.yaml"
echo ""

# Check if cloudbuild.yaml exists
if [ ! -f "$CLOUDBUILD_FILE" ]; then
    echo "❌ Error: $CLOUDBUILD_FILE not found"
    exit 1
fi

echo "📍 Getting Supabase credentials..."
echo ""
echo "Go to: https://app.supabase.com/project/akyxznfvwogxhcwocukj/settings/api"
echo ""
echo "You'll need these 3 values:"
echo "  1. SUPABASE_URL (under 'Project URL')"
echo "  2. SUPABASE_ANON_KEY (under 'anon public')"
echo "  3. SUPABASE_JWT_SECRET (under 'JWT secret')"
echo "  4. SUPABASE_SERVICE_ROLE_KEY (under 'service_role')"
echo ""

# Interactive input
read -p "Enter SUPABASE_URL: " SUPABASE_URL
read -p "Enter SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "Enter SUPABASE_JWT_SECRET: " SUPABASE_JWT_SECRET
read -sp "Enter SUPABASE_SERVICE_ROLE_KEY (won't be displayed): " SUPABASE_SERVICE_ROLE_KEY
echo ""

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_JWT_SECRET" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: All credentials are required"
    exit 1
fi

echo ""
echo "✅ Credentials collected"
echo ""

# Update cloudbuild.yaml
echo "📝 Updating cloudbuild.yaml..."

# Use sed to update the substitutions
sed -i.bak "s|_SUPABASE_URL: '.*'|_SUPABASE_URL: '$SUPABASE_URL'|g" "$CLOUDBUILD_FILE"
sed -i.bak "s|_SUPABASE_ANON_KEY: '.*'|_SUPABASE_ANON_KEY: '$SUPABASE_ANON_KEY'|g" "$CLOUDBUILD_FILE"
sed -i.bak "s|_SUPABASE_JWT_SECRET: '.*'|_SUPABASE_JWT_SECRET: '$SUPABASE_JWT_SECRET'|g" "$CLOUDBUILD_FILE"

rm -f "$CLOUDBUILD_FILE.bak"

echo "✅ cloudbuild.yaml updated"
echo ""

# Create or update secret in Secret Manager
echo "🔑 Creating Secret Manager secret..."

if gcloud secrets describe supabase-service-role-key --project=$PROJECT_ID &> /dev/null; then
    echo "   Secret already exists. Adding new version..."
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | \
      gcloud secrets versions add supabase-service-role-key \
        --data-file=- \
        --project=$PROJECT_ID
else
    echo "   Creating new secret..."
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | \
      gcloud secrets create supabase-service-role-key \
        --replication-policy=automatic \
        --data-file=- \
        --project=$PROJECT_ID
fi

echo "✅ Secret Manager updated"
echo ""

echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next step: Deploy to GCP Cloud Run"
echo ""
echo "Run this command:"
echo "  gcloud builds submit --config backend/cloudbuild.yaml --project=$PROJECT_ID"
echo ""
echo "Then check deployment status:"
echo "  gcloud builds list --project=$PROJECT_ID"
echo ""
