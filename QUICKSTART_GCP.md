# GCP Deployment - Quick Start

## Files Created

1. **Dockerfile** - Container image definition
2. **cloudbuild.yaml** - CI/CD pipeline configuration
3. **.dockerignore** - Files to exclude from Docker build
4. **.gcloudignore** - Files to exclude from Cloud Build upload
5. **setup-gcp.sh** - Automated setup script
6. **GCP_DEPLOYMENT_GUIDE.md** - Detailed documentation

## Quick Setup (5 minutes)

### 1. Prepare Supabase Credentials
Get these from https://app.supabase.com/project/akyxznfvwogxhcwocukj/settings/api:
- Service Role Key (for Secret Manager)
- Anon Key
- JWT Secret

### 2. Run Setup Script
```bash
cd /Users/taiht/Documents/Shopping-Auren
chmod +x setup-gcp.sh
./setup-gcp.sh shopping-497906
```

This will:
- ✅ Enable required GCP APIs
- ✅ Create Artifact Registry repository
- ✅ Configure Cloud Build service account permissions
- ✅ Guide you to create Secret Manager secret

### 3. Create Secret in Secret Manager
```bash
# Replace YOUR_KEY_HERE with your actual Supabase Service Role Key
echo -n 'YOUR_KEY_HERE' | gcloud secrets create supabase-service-role-key \
  --replication-policy=automatic \
  --data-file=-
```

### 4. Update cloudbuild.yaml
Edit `backend/cloudbuild.yaml` and update these substitutions:
```yaml
substitutions:
  _SUPABASE_URL: 'https://akyxznfvwogxhcwocukj.supabase.co'
  _SUPABASE_ANON_KEY: 'your-actual-anon-key-from-supabase'
  _SUPABASE_JWT_SECRET: 'your-actual-jwt-secret-from-supabase'
```

### 5. Deploy
```bash
gcloud builds submit --config backend/cloudbuild.yaml --project=shopping-497906
```

### 6. Get Service URL
```bash
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --format='value(status.url)' \
  --project=shopping-497906
```

### 7. Test
```bash
# Replace with your actual service URL
curl https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app/health
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     Your Git Repository                 │
│  (Shopping-Auren on GitHub)             │
└──────────────────┬──────────────────────┘
                   │ (push)
                   ▼
┌─────────────────────────────────────────┐
│     Cloud Build                         │
│  (reads cloudbuild.yaml)                │
│  1. Build Docker image                  │
│  2. Push to Artifact Registry           │
│  3. Deploy to Cloud Run                 │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    ┌────────────┐    ┌──────────────────┐
    │ Artifact   │    │ Secret Manager   │
    │ Registry   │    │ (API keys)       │
    │ (images)   │    │                  │
    └────────────┘    └──────────────────┘
         ▲
         │
    ┌────┴──────────────────────────────┐
    │      Cloud Run Service            │
    │  shopping-memo-backend            │
    │  (auto-scaling, serverless)       │
    └─────────────────────────────────┬─┘
                                      │
    ┌─────────────────────────────────┴─┐
    │   External Services               │
    │   - Supabase (PostgreSQL)         │
    │   - Vercel (Frontend)             │
    └───────────────────────────────────┘
```

## Monitoring & Debugging

### Check deployment status
```bash
gcloud run services describe shopping-memo-backend --region=asia-southeast1
```

### View logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=shopping-memo-backend" \
  --limit 50 \
  --format json
```

### Rebuild and deploy
```bash
gcloud builds submit --config backend/cloudbuild.yaml --project=shopping-497906
```

## Cost Estimate

Cloud Run pricing (as of May 2026):
- **Compute**: $0.00002400/vCPU-second + $0.0000025/GB-second
- **Invocation**: $0.40 per 1M invocations

With the configured setup (1 vCPU, 512MB, max 100 instances):
- 1M requests/month: ~$5-15/month (depending on traffic)
- Low traffic: <$1/month
- High traffic (1B requests/month): ~$150-300/month

## Comparison: Render vs GCP Cloud Run

| Feature | Render | GCP Cloud Run |
|---------|--------|---------------|
| Startup time | ~5s (cold start) | ~1s (cold start) |
| Scaling | Manual/Auto | Auto (better) |
| Cost (low traffic) | $7/month (free tier: $7) | <$1/month |
| Cost (high traffic) | $29+/month | More granular |
| Simplicity | Very simple | Slightly complex |
| Integration | Good | Excellent (with GCP) |

## Troubleshooting

### Deployment fails
1. Check build logs: `gcloud builds log BUILD_ID --stream`
2. Verify all env vars are set in `cloudbuild.yaml`
3. Ensure secret `supabase-service-role-key` exists

### Service won't start
1. Check service logs in Cloud Run console
2. Verify environment variables are correct
3. Test Dockerfile locally: `docker build backend -t test && docker run -p 8000:8000 test`

### CORS errors
1. Update `allow_origins` in `backend/app/main.py`
2. Redeploy the backend

### Slow performance
1. Increase CPU/Memory: `--cpu 2 --memory 1Gi` in `cloudbuild.yaml`
2. Increase min instances: `--min-instances 1`

---

For detailed information, see **GCP_DEPLOYMENT_GUIDE.md**
