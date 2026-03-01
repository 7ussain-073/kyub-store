# Deploying BenefitPay Checkout to Vercel

Complete step-by-step guide for deploying the Kyub Store with BenefitPay checkout to Vercel.

## Prerequisites

- [ ] Vercel account (free or paid)
- [ ] GitHub account with repository pushed
- [ ] Supabase project created
- [ ] Email service account (Resend or SendGrid)
- [ ] Domain registered (optional, Vercel provides free domain)

## Step 1: Connect Repository to Vercel

### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Find and select `digital-pass-hub` repository
5. Click "Import"

### Option B: Via Vercel CLI
```bash
npm i -g vercel
cd /workspaces/digital-pass-hub
vercel
```
Follow prompts to connect repository.

## Step 2: Configure Build Settings

Vercel should auto-detect:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` or `bun install`

If not auto-detected:
1. Click "Environment Variables" (before deploying)
2. Add build settings in project settings

## Step 3: Add Environment Variables

In Vercel Project Settings → Environment Variables:

### Required for Frontend
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Required for Email API
```
# Choose one email provider:

# Option A: Resend
RESEND_API_KEY=<your-resend-api-key>
EMAIL_PROVIDER=resend

# Option B: SendGrid
SENDGRID_API_KEY=<your-sendgrid-api-key>
EMAIL_PROVIDER=sendgrid
```

## Step 4: Deploy

Once environment variables are set:

1. **From Vercel Dashboard:**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)

2. **From CLI:**
   ```bash
   vercel --prod
   ```

Vercel will:
- [ ] Build React app with Vite
- [ ] Bundle assets
- [ ] Deploy serverless functions (`api/` folder)
- [ ] Set up SSL certificate
- [ ] Assign domain

## Step 5: Post-Deployment Setup

### Supabase Configuration

1. **Update CORS in Supabase:**
   - Go to Supabase Dashboard → Settings → API
   - Click "Edit CORS settings"
   - Add your Vercel domain: `https://your-project.vercel.app`

2. **Allow Function Calls:**
   - Storage bucket must be public for image access
   - RLS policies should allow public inserts

### Email Service Testing

```bash
# Test email API endpoint
curl -X POST https://your-project.vercel.app/api/send-order-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "orderId": "test-order-001",
    "planName": "Netflix Premium",
    "amount": 29.99
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Order confirmation email sent successfully"
}
```

### Custom Domain (Optional)

1. In Vercel Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `kyubstore.com`)
4. Update DNS records for your domain:
   ```
   CNAME: www.<yourdomain> → cname.vercel.com
   A Record: <yourdomain> → 76.76.19.48
   ```
5. Verify domain ownership

## Step 6: Security Hardening

### Update Supabase Settings

1. **Restrict API Access:**
   - Only allow requests from your Vercel domain
   - In Supabase → Settings → API

2. **Enable Row Level Security:**
   - Ensure all tables have RLS enabled
   - Orders table should restrict admin access

3. **Setup JWT Secret:**
   - Supabase handles this automatically
   - Verify in Settings → API

### Update Email Service

**For Resend:**
- Verify email domain (for custom from address)
- Set rate limits if needed
- Monitor API usage

**For SendGrid:**
- Verify sender domain
- Set up DKIM/SPF records
- Enable 2FA on SendGrid account

## Step 7: Verify Deployment

### Checkout Page
- [ ] Visit `https://your-domain.vercel.app/checkout`
- [ ] Form loads correctly
- [ ] Can select plan
- [ ] Can upload image
- [ ] Can submit form

### Admin Orders
- [ ] Visit `https://your-domain.vercel.app/admin/orders`
- [ ] Login with admin account
- [ ] Can see orders (if any exist)
- [ ] Can view payment proof
- [ ] Can approve/reject orders

### Email Functionality
- [ ] Submit test order
- [ ] Check email inbox (including spam)
- [ ] Email contains correct order details
- [ ] Email is formatted correctly

### Storage Verification
- [ ] Images upload successfully
- [ ] Images are publicly accessible
- [ ] Verify in Supabase Storage dashboard

## Step 8: Monitor & Maintain

### Vercel Analytics
- Dashboard → Analytics
- Monitor build time
- Track deployment history
- Review error logs

### Email Service Monitoring

**Resend Dashboard:**
- Dashboard → Emails
- Check delivery status
- Monitor bounce rates
- Review API usage

**SendGrid Dashboard:**
- Dashboard → Email Stats
- Check delivery rates
- Review bounces/complaints
- Monitor API usage

### Supabase Monitoring
- Dashboard → Analytics
- Monitor API calls
- Check storage usage
- Review error logs

## Troubleshooting Deployment Issues

### Build Fails
```bash
# Check local build first
npm run build

# If error, check:
# 1. TypeScript errors: npx tsc --noEmit
# 2. Missing dependencies: npm install
# 3. Environment variables are set
```

### Email Not Sending
1. Check API key in Vercel environment
2. Check email provider dashboard for errors
3. Review Vercel function logs (Deployments → View Function Logs)
4. Ensure sender email domain is verified

### Images Not Loading
1. Check Supabase Storage bucket CORS
2. Ensure bucket is public
3. Check image URLs in browser console
4. Verify Supabase permissions

### Orders Not Appearing
1. Verify Supabase is accessible
2. Check RLS policies allow public insert
3. Check browser console for errors
4. Verify orders table exists

## Environment Variables Checklist

Production (Vercel):
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY`
- [ ] `EMAIL_PROVIDER`

Development (.env.local):
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY`
- [ ] `EMAIL_PROVIDER`

## Rollback Procedure

If deployment has issues:

```bash
# View previous deployments
vercel list

# Promote previous deployment
vercel rollback

# Or redeploy specific commit
vercel --prod
```

## Performance Optimization

### Built-in Optimizations
- ✓ Automatic code splitting
- ✓ Image optimization
- ✓ Edge caching
- ✓ Zero-config HTTPS

### Additional Options
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

## Scaling Considerations

### For High Traffic
1. Use Vercel Pro for higher limits
2. Consider Supabase upgrade for database
3. Enable image optimization
4. Use CDN for static assets (automatic)

### Cost Estimation (Monthly)
| Service | Cost | Notes |
|---------|------|-------|
| Vercel | Free | Basic plan included |
| Supabase | Free-$25+ | Depends on storage/queries |
| Resend | Free up to 10k | $20+ for higher volume |
| SendGrid | Free-$20+ | Depends on email volume |
| **Total** | **$0-45+** | Scales with usage |

## Support References

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- SendGrid Docs: https://sendgrid.com/docs

## Deployment Checklist

Pre-Deployment:
- [ ] All code committed to git
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Tests pass (`npm test`)
- [ ] Environment variables noted down

Deployment:
- [ ] Repository connected to Vercel
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Deploy initiated
- [ ] Build completes successfully

Post-Deployment:
- [ ] Site accessible at custom domain
- [ ] Checkout page works
- [ ] Orders can be created
- [ ] Emails send successfully
- [ ] Admin can review orders
- [ ] Images upload/display correctly

---

**Ready to Deploy?** All systems are prepared for production deployment! 🚀

---

**Last Updated:** February 2024
**Version:** 1.0
