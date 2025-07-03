# Deployment Guide for Market Mover with BigQuery

## Overview
This guide covers deploying your Market Mover application with BigQuery backend. You have two main options:

## Option 1: Deploy to Vercel (Simplest)

### Prerequisites
- Vercel account
- Google Cloud Project with BigQuery enabled
- Service account credentials

### Steps

#### 1. Prepare Google Cloud Credentials

1. **Create a service account** (if you haven't already):
   ```bash
   gcloud iam service-accounts create market-mover-api \
     --display-name="Market Mover API"
   ```

2. **Grant BigQuery permissions**:
   ```bash
   gcloud projects add-iam-policy-binding market-mover-464517 \
     --member="serviceAccount:market-mover-api@market-mover-464517.iam.gserviceaccount.com" \
     --role="roles/bigquery.dataViewer"
   ```

3. **Create and download credentials**:
   ```bash
   gcloud iam service-accounts keys create my-service-account.json \
     --iam-account=market-mover-api@market-mover-464517.iam.gserviceaccount.com
   ```

#### 2. Set Up Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

```
GOOGLE_CLOUD_PROJECT_ID=market-mover-464517
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"market-mover-464517",...}
VENDOR_GOOGLE_CLOUD_PROJECT_ID=populi-clients
VENDOR_GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"populi-clients",...}
SUPABASE_URL=your_supabase_url
SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important**: Copy the entire contents of your service account JSON files into the `GOOGLE_CLOUD_CREDENTIALS` and `VENDOR_GOOGLE_CLOUD_CREDENTIALS` variables.

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

### Limitations of Vercel
- **Function timeout**: 60 seconds max (already configured)
- **Memory limits**: 1024MB per function
- **Cold starts**: May experience delays on first request
- **File system**: Read-only, so no file-based credentials

## Option 2: Deploy to Railway (Recommended for BigQuery)

Railway is better suited for BigQuery workloads because it supports:
- Longer execution times
- More memory
- Persistent file system
- Better for heavy database operations

### Steps

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize
```bash
railway login
railway init
```

#### 3. Add Environment Variables
```bash
railway variables set GOOGLE_CLOUD_PROJECT_ID=market-mover-464517
railway variables set GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
railway variables set VENDOR_GOOGLE_CLOUD_PROJECT_ID=populi-clients
railway variables set VENDOR_GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
railway variables set SUPABASE_URL=your_supabase_url
railway variables set SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### 4. Deploy
```bash
railway up
```

#### 5. Get Your Backend URL
```bash
railway domain
```

#### 6. Update Frontend API Calls
Update your frontend to use the Railway backend URL instead of relative paths.

## Option 3: Split Architecture (Most Scalable)

### Backend Deployment (Railway/Render/Heroku)
Deploy only the `server.js` and `server/` directory to a Node.js platform.

### Frontend Deployment (Vercel)
Deploy the React frontend separately to Vercel.

### Steps

#### 1. Create Backend Repository
```bash
mkdir market-mover-backend
cd market-mover-backend
# Copy server.js and server/ directory
```

#### 2. Deploy Backend
Follow Option 2 steps for the backend.

#### 3. Update Frontend API Configuration
Create a configuration file to point to your backend:

```javascript
// src/config/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app'
  : 'http://localhost:5000';

export default API_BASE_URL;
```

#### 4. Update API Calls
Replace all relative API calls (`/api/...`) with absolute URLs using your config.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLOUD_PROJECT_ID` | Your Google Cloud project ID | Yes |
| `GOOGLE_CLOUD_CREDENTIALS` | Service account JSON (stringified) | Yes |
| `VENDOR_GOOGLE_CLOUD_PROJECT_ID` | Vendor's Google Cloud project ID | Yes |
| `VENDOR_GOOGLE_CLOUD_CREDENTIALS` | Vendor service account JSON (stringified) | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Ensure service account JSON is properly stringified
   - Check that the service account has BigQuery permissions

2. **"Project not found" error**
   - Verify `GOOGLE_CLOUD_PROJECT_ID` is correct
   - Ensure the service account belongs to the correct project

3. **Timeout errors on Vercel**
   - Consider switching to Railway for heavy BigQuery operations
   - Implement caching for frequently accessed data

4. **CORS errors**
   - Add CORS middleware to your Express server
   - Configure allowed origins in your deployment platform

### Performance Optimization

1. **Implement caching** for BigQuery results
2. **Use connection pooling** for database connections
3. **Optimize queries** to reduce execution time
4. **Consider using BigQuery's streaming API** for real-time data

## Security Considerations

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate service account keys** regularly
4. **Implement proper authentication** for your API endpoints
5. **Use HTTPS** in production

## Monitoring

1. **Set up logging** for BigQuery operations
2. **Monitor API response times**
3. **Track BigQuery usage and costs**
4. **Set up alerts** for errors and timeouts 