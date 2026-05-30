# ✅ GCP Deployment Setup Complete

## 📦 What Was Created

### Core Deployment Files
1. **backend/Dockerfile** - Container image specification for FastAPI
2. **backend/cloudbuild.yaml** - CI/CD pipeline (build, push, deploy)
3. **backend/.dockerignore** - Files excluded from Docker build
4. **backend/.gcloudignore** - Files excluded from Cloud Build upload

### Documentation
5. **QUICKSTART_GCP.md** - Quick start guide (5-minute setup)
6. **GCP_DEPLOYMENT_GUIDE.md** - Comprehensive deployment documentation
7. **DEPLOYMENT_SUMMARY.md** - This file

### Automation Scripts
8. **setup-gcp.sh** - Automated GCP infrastructure setup
9. **setup-credentials.sh** - Interactive credentials configuration

---

## 🚀 Deployment Steps

### Step 1: Run GCP Setup (5 min)
```bash
cd /Users/taiht/Documents/Shopping-Auren
./setup-gcp.sh shopping-497906
```

This will:
- ✅ Enable Cloud Run, Cloud Build, Artifact Registry, Secret Manager APIs
- ✅ Create Artifact Registry repository
- ✅ Configure Cloud Build service account permissions
- ✅ Prompt you to create Secret Manager secret

### Step 2: Create Secret Manager Secret
Get your Supabase Service Role Key from:
**https://app.supabase.com/project/akyxznfvwogxhcwocukj/settings/api**

Then run:
```bash
echo -n 'YOUR_SERVICE_ROLE_KEY' | gcloud secrets create supabase-service-role-key \
  --replication-policy=automatic \
  --data-file=-
```

### Step 3: Configure Credentials
```bash
./setup-credentials.sh
```

This will interactively:
- Prompt you for Supabase credentials
- Update `backend/cloudbuild.yaml`
- Create/update Secret Manager secret

### Step 4: Deploy to GCP
```bash
gcloud builds submit --config backend/cloudbuild.yaml --project=shopping-497906
```

### Step 5: Verify Deployment
```bash
# Get service URL
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --format='value(status.url)' \
  --project=shopping-497906

# Test health endpoint
curl <SERVICE_URL>/health
```

---

## 📊 Architecture

```
GitHub Push
    ↓
Cloud Build (triggered automatically if connected)
    ├→ Build Docker image
    ├→ Push to Artifact Registry
    └→ Deploy to Cloud Run
         ├→ Fetch env vars from Cloud Build substitutions
         ├→ Fetch SUPABASE_SERVICE_ROLE_KEY from Secret Manager
         └→ Start FastAPI service on asia-southeast1
              ↓
         ✅ Service ready for requests
         📍 https://shopping-memo-backend-xxx.a.run.app
```

---

## 🔐 Security

### Environment Variables (public)
Set in `cloudbuild.yaml` substitutions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `APP_ENV`

### Secrets (private)
Stored in GCP Secret Manager:
- `SUPABASE_SERVICE_ROLE_KEY` (admin access to Supabase)

**⚠️ Never commit secrets to Git!**

---

## 💰 Cost Estimate

**Cloud Run Pricing** (as of May 2026):
- **Free tier**: 2M invocations/month
- **Beyond free**: $0.40 per 1M invocations
- **Compute**: $0.00002400/vCPU-second + $0.0000025/GB-second

**Estimated monthly cost** (with your config: 1 vCPU, 512MB):
- Low traffic (10k requests/day): <$1/month
- Medium traffic (1M requests/month): $5-15/month
- High traffic (1B requests/month): $150-300/month

**Comparison to Render**:
- Render: $7/month (paid tier, free tier limited)
- GCP Cloud Run: <$1/month (generous free tier)

---

## 📱 Frontend Integration

After deployment, update your frontend to use the GCP backend:

### 1. Get Your Service URL
```bash
gcloud run services describe shopping-memo-backend \
  --region=asia-southeast1 \
  --format='value(status.url)'
```

### 2. Update Frontend Environment
In your frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app
```

### 3. Update CORS in Backend
Edit `backend/app/main.py` and add your frontend URL:
```python
allow_origins=[
    "http://localhost:3000",
    "https://shopping-auren.vercel.app",
    "https://shopping-memo-backend-xxxxx-asia-southeast1.a.run.app",  # ADD THIS
]
```

### 4. Redeploy Backend
```bash
gcloud builds submit --config backend/cloudbuild.yaml --project=shopping-497906
```

---

## 🔄 Continuous Deployment (Optional)

To enable automatic deployment on push to GitHub:

1. **Connect GitHub Repository**
   - GCP Console → Cloud Build → Repositories
   - Connect your GitHub account
   - Select `Shopping-Auren` repository

2. **Create Build Trigger**
   - Source: GitHub
   - Repository: Shopping-Auren
   - Branch: main
   - Build file: `backend/cloudbuild.yaml`

3. **From now on**, every push to `main` will:
   - Automatically trigger a build
   - Build Docker image
   - Push to Artifact Registry
   - Deploy to Cloud Run

---

## 📋 Checklist

- [ ] Run `./setup-gcp.sh`
- [ ] Get Supabase Service Role Key
- [ ] Create Secret Manager secret
- [ ] Run `./setup-credentials.sh`
- [ ] Deploy: `gcloud builds submit --config backend/cloudbuild.yaml --project=shopping-497906`
- [ ] Verify: `curl <SERVICE_URL>/health`
- [ ] Update frontend `NEXT_PUBLIC_API_URL`
- [ ] Update backend CORS origins
- [ ] Redeploy backend
- [ ] Test end-to-end API calls
- [ ] (Optional) Set up GitHub continuous deployment

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **QUICKSTART_GCP.md** | Quick reference (5-min setup) |
| **GCP_DEPLOYMENT_GUIDE.md** | Comprehensive guide with troubleshooting |
| **setup-gcp.sh** | Automated GCP infrastructure setup |
| **setup-credentials.sh** | Interactive credentials configuration |

---

## 🆘 Troubleshooting

### Build fails: "Secret not found"
- Check Secret Manager: `gcloud secrets list --project=shopping-497906`
- Verify Cloud Build SA has access: `gcloud projects get-iam-policy shopping-497906`

### Service won't start
- Check logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json`
- Verify env vars: `gcloud run services describe shopping-memo-backend --region=asia-southeast1`

### CORS errors from frontend
- Update `allow_origins` in `backend/app/main.py`
- Add your GCP service URL
- Redeploy backend

### Slow performance
- Increase CPU/memory in `cloudbuild.yaml`
- Increase min-instances for faster startup
- Check Cloud Run metrics in GCP Console

---

## 🎓 Resources

- **GCP Documentation**: https://cloud.google.com/run/docs
- **Cloud Build**: https://cloud.google.com/build/docs
- **Artifact Registry**: https://cloud.google.com/artifact-registry/docs
- **Secret Manager**: https://cloud.google.com/secret-manager/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Docker**: https://docs.docker.com/

---

**Created**: 2026-05-30  
**Project**: Shopping Memo  
**Region**: asia-southeast1  
**Service**: shopping-memo-backend  
**Project ID**: shopping-497906

For detailed information, see **QUICKSTART_GCP.md** or **GCP_DEPLOYMENT_GUIDE.md**
