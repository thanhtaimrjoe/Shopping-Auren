# GCP Cloud Run Deployment Guide - Shopping Memo Backend

## Overview
This guide walks through deploying the Shopping Memo FastAPI backend to GCP Cloud Run using automated Cloud Build CI/CD pipeline.

## Prerequisites

### 1. GCP Project Setup
```bash
export PROJECT_ID=shopping-497906
gcloud config set project $PROJECT_ID
```

### 2. Required APIs (enable these in GCP Console)
- Cloud Run API
- Cloud Build API
- Artifact Registry API
- Secret Manager API
- Service Usage API

Enable all at once:
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  serviceusage.googleapis.com
```

### 3. Create Artifact Registry Repository
```bash
gcloud artifacts repositories create shopping-memo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Shopping Memo application images"
```

### 4. Configure Cloud Build Service Account Permissions
```bash
# Get the Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/run.admin

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/iam.serviceAccountUser

# Grant Artifact Registry Writer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/artifactregistry.writer

# Grant Secret Accessor role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$CLOUD_BUILD_SA \
  --role=roles/secretmanager.secretAccessor
```

## Step 1: Set Up Secrets in Secret Manager

### 1.1 Create Secret for Service Role Key
```bash
echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE" | \
  gcloud secrets create supabase-service-role-key \
    --replication-policy="automatic" \
    --data-file=-
```

To retrieve your Supabase Service Role Key:
1. Go to Supabase Dashboard → Your Project
2. Settings → API → Service Role Key (copy the full key)

### 1.2 Verify Secret is Created
```bash
gcloud secrets list
gcloud secrets versions list supabase-service-role-key
```

## Step 2: Configure Environment Variables

Update `backend/cloudbuild.yaml` with your Supabase credentials:

```yaml
substitutions:
  _SUPABASE_URL: 'https://akyxznfvwogxhcwocukj.supabase.co'
  _SUPABASE_ANON_KEY: 'your-actual-anon-key'
  _SUPABASE_JWT_SECRET: 'your-actual-jwt-secret'
```

**⚠️ Security Note**: Never commit real secrets to Git. These should only be in:
- GCP Secret Manager (for production)
- Local `.env` files (in `.gitignore`)

## Step 3: Push to GitHub (if using GitHub integration)

### Option A: GitHub Integration (Recommended)
1. Connect your GitHub repo to GCP Cloud Build:
   - GCP Console → Cloud Build → Repositories → Connect Repository
   - Select your GitHub account and repo
2. Cloud Build will automatically build on push

### Option B: Manual Deployment
```bash
cd /Users/taiht/Documents/Shopping-Auren

# Deploy from current directory
gcloud builds submit \
  --config backend/cloudbuild.yaml \
  --project=$PROJECT_ID
```

## Step 4: Monitor the Deployment

### Watch Build Progress
```bash
# List recent builds
gcloud builds list --project=$PROJECT_ID

# Watch a specific build
gcloud builds log BUILD_ID --stream --project=$PROJECT_ID
```

### Check Cloud Run Service
```bash
# List deployed services
gcloud run services list --region=asia-southeast1 --project=$PROJECT_ID

# Get service details
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --project=$PROJECT_ID
```

## Step 5: Verify Deployment

### Get Service URL
```bash
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --format='value(status.url)' \
  --project=$PROJECT_ID
```

This will output something like:
```
https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app
```

### Test the API
```bash
SERVICE_URL=$(gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --format='value(status.url)' \
  --project=$PROJECT_ID)

# Health check
curl $SERVICE_URL/health

# Response should be:
# {"status":"ok","version":"0.1.0"}
```

## Step 6: Update Frontend to Use New Backend

Once your backend is deployed, update the frontend to call the GCP backend:

### Update `frontend/lib/api.ts` or equivalent
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app';
```

### Update CORS in Backend
In `backend/app/main.py`, add your frontend URL to allowed origins:
```python
allow_origins=[
    "http://localhost:3000",
    "https://shopping-auren.vercel.app",
    "https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app",  # NEW
]
```

Then redeploy the backend.

## Step 7: Configure Auto-scaling (Optional)

The `cloudbuild.yaml` already includes auto-scaling configuration:
```yaml
--max-instances 100
```

To modify scaling limits:
```bash
gcloud run services update shopping-memo-backend \
  --min-instances=1 \
  --max-instances=100 \
  --region=asia-southeast1 \
  --project=$PROJECT_ID
```

## Troubleshooting

### Build Fails
1. Check logs:
   ```bash
   gcloud builds log BUILD_ID --stream
   ```
2. Common issues:
   - Missing environment variables
   - Secret Manager access denied (check IAM roles)
   - Docker build errors (check Dockerfile syntax)

### Service Won't Start
1. Check Cloud Run logs:
   ```bash
   gcloud run services describe shopping-memo-backend --region=asia-southeast1 | grep -A 20 "status:"
   ```
2. View recent errors:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=shopping-memo-backend" \
     --limit 50 \
     --format json
   ```

### CORS Errors
- Update `allow_origins` in `backend/app/main.py`
- Redeploy the backend

### Secret Access Denied
- Verify Cloud Build service account has Secret Manager Secret Accessor role
- Ensure secret name matches in `cloudbuild.yaml`

## Monitoring & Logs

### View Cloud Run Logs
```bash
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 | head -20
```

### Stream Live Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=shopping-memo-backend" \
  --stream \
  --format "table(jsonPayload.message)"
```

## Rollback

If deployment breaks, revert to previous version:
```bash
gcloud run deploy shopping-memo-backend \
  --image=asia-southeast1-docker.pkg.dev/$PROJECT_ID/shopping-memo/backend:PREVIOUS_SHA \
  --region=asia-southeast1 \
  --project=$PROJECT_ID
```

## Environment Configuration Summary

| Variable | Source | Usage |
|----------|--------|-------|
| `SUPABASE_URL` | Cloud Run env var | Supabase database URL |
| `SUPABASE_ANON_KEY` | Cloud Run env var | Public Supabase API key |
| `SUPABASE_JWT_SECRET` | Cloud Run env var | JWT validation secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Manager | Admin access to Supabase |
| `APP_ENV` | Cloud Run env var | Set to "production" |

## Next Steps

1. ✅ Set up GCP project and enable APIs
2. ✅ Create secrets in Secret Manager
3. ✅ Configure `cloudbuild.yaml` with Supabase credentials
4. ✅ Push to GitHub (if using GitHub integration) or run `gcloud builds submit`
5. ✅ Verify deployment with health check
6. ✅ Update frontend API endpoint
7. ✅ Test end-to-end API calls
8. ✅ Set up monitoring and alerts

---

**Last Updated**: 2026-05-30
**Project ID**: shopping-497906
**Region**: asia-southeast1
**Service Name**: shopping-memo-backend
