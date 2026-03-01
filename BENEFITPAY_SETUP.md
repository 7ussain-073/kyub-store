# BenefitPay Checkout System Setup Guide

This guide covers the setup of the manual BenefitPay checkout system for the Kyub Store.

## Database Setup

### 1. Create the Orders Table

Run the migration in `supabase/migrations/20260210_create_orders_table.sql` in your Supabase dashboard:

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy and paste the contents of `supabase/migrations/20260210_create_orders_table.sql`
6. Click "Run"

This creates:
- `orders` table with fields for customer info, plan details, payment proof, and status
- RLS policies for admin access
- Indexes for performance

### 2. Create Storage Bucket

Create a public storage bucket for payment proofs:

**Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `payment-proofs`
4. Check "Public bucket"
5. Click "Create"

**Set Bucket Policy:**
1. Go to Storage → payment-proofs
2. Click "Policies" tab
3. Add a SELECT policy:
   - Authenticated users can view all payment proofs (read access)
4. Add an INSERT policy:
   - Anyone can insert/upload payment proofs (upload on checkout)
5. Add an UPDATE policy:
   - Only admins can update order status

## Email Service Setup

### Option 1: Using Resend

1. **Get API Key:**
   - Sign up at https://resend.com
   - Go to API Keys in settings
   - Create a new API key

2. **Configure Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `RESEND_API_KEY=<your-key>`

3. **Set Email Provider:**
   - Add: `EMAIL_PROVIDER=resend`

### Option 2: Using SendGrid

1. **Get API Key:**
   - Sign up at https://sendgrid.com
   - Go to Settings → API Keys
   - Create a new API key

2. **Configure Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `SENDGRID_API_KEY=<your-key>`

3. **Set Email Provider:**
   - Add: `EMAIL_PROVIDER=sendgrid`

4. **Verify Domain (SendGrid):**
   - Go to Settings → Sender Authentication
   - Verify your domain to send emails

## Local Development

### Set Up Email Variables Locally

Create `.env.local`:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# For local testing with email API
RESEND_API_KEY=<your-key>
# OR
SENDGRID_API_KEY=<your-key>
EMAIL_PROVIDER=resend
```

### Test Email Endpoint Locally

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3001/api/send-order-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Ahmed Test",
    "orderId": "test-order-123",
    "planName": "Netflix Premium",
    "amount": 29.99
  }'
```

## Checkout Flow

### Customer Perspective

1. Customer visits `/checkout`
2. Fills in personal details (name, phone, email)
3. Selects a subscription plan
4. Uploads payment proof image (5MB max, image only)
5. Optionally enters BenefitPay reference number
6. Submits form
7. Order created in database
8. Confirmation email sent to customer
9. Redirects to home page

### Order Status Flow

- **Pending**: Initial state after customer submits
- **Approved**: Admin reviewed and verified payment
- **Rejected**: Admin rejected the payment proof

## Admin Order Management

### View Orders

1. Go to Admin Dashboard (`/admin/orders`)
2. Orders sorted by pending first
3. Shows customer info, plan, amount, status

### Verify Payment

1. Click "عرض الإثبات" (View Proof) on an order
2. View payment proof image
3. Review order details
4. Click "موافقة" (Approve) or "رفض" (Reject)

### After Approval

Once approved, the admin must:
1. Manually deliver subscription credentials
2. Send access details via email or phone
3. Update order notes if needed (optional)

## Schema Reference

### Orders Table

```sql
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  benefitpay_ref TEXT,
  payment_proof_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT
);
```

### Storage Bucket

- **Name**: `payment-proofs`
- **Type**: Public
- **Naming**: `{orderId}-{timestamp}.{ext}`
- **Max Size**: 5MB per image

## API Endpoint

### POST /api/send-order-email

Sends order confirmation email to customer.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "fullName": "Ahmed Mohammed",
  "orderId": "order-123456789",
  "planName": "Netflix Premium",
  "amount": 29.99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order confirmation email sent successfully"
}
```

**Error Response:**
```json
{
  "error": "Failed to send email",
  "details": "RESEND_API_KEY is not configured"
}
```

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify in Vercel environment variables
2. **Check Provider**: Ensure `EMAIL_PROVIDER` is set correctly
3. **Check Logs**: View Vercel function logs
4. **Test Locally**: Try the curl command above

### Image Upload Failing

1. **Check Bucket**: Ensure `payment-proofs` bucket exists
2. **Check Permissions**: Bucket should be public
3. **Check Size**: Image must be < 5MB
4. **Check Type**: Must be valid image format

### Admin Can't See Orders

1. **Check Permissions**: User must have `admin` role in `user_roles` table
2. **Check RLS**: Ensure RLS policies are set up correctly
3. **Debug**: Check browser console for error details

## Security Considerations

1. **RLS Policies**: Only admins can view/update orders
2. **Public Upload**: Anyone can submit an order (no auth required for checkout)
3. **Email Validation**: Form validates email format
4. **File Validation**: Only images allowed, max 5MB
5. **Image URL**: Stored as public URL for admin preview only

## Future Enhancements

- [ ] Automatic email reminders for pending orders
- [ ] Admin bulk approval
- [ ] Customer order status tracking page
- [ ] Automatic subscription delivery after approval
- [ ] Payment verification automation
- [ ] Order cancellation workflow
- [ ] Refund processing system
