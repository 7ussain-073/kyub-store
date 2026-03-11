# Admin Quick Reference - BenefitPay Order Management

## Accessing the Orders Dashboard

1. **Login to Admin:**
   - Go to `/login`
   - Use your admin account credentials
   - Navigate to `/admin/orders` or click "إدارة الطلبات" in sidebar

2. **View All Orders:**
   - Orders are sorted by pending first, then by newest
   - Shows count of pending orders at the top
   - **Pending** (قيد المراجعة): Waiting for admin review
   - **Approved** (موافق عليه): Payment verified, pending delivery
   - **Rejected** (مرفوض): Payment rejected

## Processing a Pending Order

### Step 1: Review Payment Proof
1. Find the order in the list
2. Click **عرض الإثبات** (View Proof) button
3. A modal opens showing:
   - Payment proof image (customer uploaded)
   - Order details (customer name, email, phone)
   - Plan name and amount (in selected currency)
   - BenefitPay reference (if provided)

### Step 2: Verify Payment
Verify the payment proof shows:
- ✓ BenefitPay confirmation
- ✓ Correct amount
- ✓ Matches order details

### Step 3: Approve or Reject

**If Payment is Valid:**
1. Click **موافقة على الطلب** (Approve Order) button
2. Order status changes to "Approved"
3. Move to Step 4

**If Payment is Invalid:**
1. Click **رفض الطلب** (Reject Order) button
2. Order status changes to "Rejected"
3. (Optional) Add rejection reason to notes
4. No further action needed

## Completing an Approved Order

After approval, you must manually deliver the subscription:

### Delivery Steps
1. Get the customer's:
   - Username for the service
   - Password or access link
   - Any additional instructions

2. Send delivery email with:
   - Subject: "تم تفعيل اشتراكك - Collier"
   - Include: username, password/link, login URL
   - Include: Subscription end date

3. (Optional) Add delivery notes:
   - Click order → Edit
   - Add notes like "Delivered on 2024-02-15 via email"

## Order Details Reference

| Field | Example | Notes |
|-------|---------|-------|
| رقم الطلب (Order ID) | order-1707xxx | Unique identifier |
| اسم العميل (Customer Name) | أحمد محمد | Full name entered |
| الهاتف (Phone) | +973 501234567 | Customer contact |
| البريد (Email) | ahmed@example.com | Confirmation sent here |
| الخطة (Plan) | Netflix Premium | Product name |
| المبلغ (Amount) | 29.99 BHD | In selected currency |
| البنفت باي (BenefitPay Ref) | BP123456789 | Optional, if provided |
| التاريخ (Date) | 15 فبراير 2024 | When order submitted |
| الحالة (Status) | قيد المراجعة | pending/approved/rejected |

## Quick Actions

### View Customer Contact
- Click on order to expand
- Phone number readily visible
- Email readily visible
- Can contact before delivery if needed

### Image Preview
- Press **عرض الإثبات** button
- Image opens in modal
- Download if needed for records
- Full payment proof visible

### Change Currency View
- Admin currency selector in sidebar
- Changes how amounts display
- Only affects display, not stored amount
- Useful for different customer currencies

## Status Transitions

```
pending (قيد المراجعة)
   ├─→ approved (موافق عليه) [After admin review]
   └─→ rejected (مرفوض) [If payment invalid]

approved (موافق عليه)
   └─→ [Manual delivery needed]

rejected (مرفوض)
   └─→ [No further action needed]
```

## Bulk Operations

### Mass Reject
If you need to reject multiple orders:
1. Each order has individual reject button
2. No batch reject feature yet
3. Consider adding notes why rejected

### Batch Approve
If verifying multiple orders:
1. Open each in list
2. Click approve button for each
3. Track which ones you've done

## Common Issues

### Customer Email Wrong
- Contact customer via phone
- Don't send to wrong email
- Verify email address before sending

### Image Not Clear
- Contact customer to resubmit
- Ask for higher quality image
- Use customer phone number to contact

### Amount Mismatch
- Verify plan price matches order
- Check currency conversion if needed
- Contact customer if discrepancy

## Tips for Efficiency

1. **Batch Review:** Review 5-10 pending orders first
2. **Approve Decisions:** Make decisions quickly
3. **Track Deliveries:** Keep external log of what sent
4. **Check Orders Daily:** Set reminder to check pending orders
5. **Collect Feedback:** Ask customers when delivering

## Performance Tips

- Orders page loads pending first (fastest)
- Sort arrows sort the list
- Image preview is modal (doesn't load all at once)
- Use browser search (Ctrl+F) to find specific order

## Troubleshooting

### Can't Access Orders Page
- Check admin role: must have "admin" role in database
- Check login: may need to refresh
- Check permissions: RLS may need reconfiguration

### Image Won't Load
- Check Supabase storage bucket exists
- Check bucket is public
- Check internet connection

### Can't Update Status
- May not have admin role
- May be network error
- Try refreshing page

## Future Workflow

Once more features are added:
1. Order notes field (add custom notes)
2. Bulk approve function
3. Email templates (customize delivery email)
4. Automatic reminders (not sent yet)
5. Subscription tracking (what was delivered)

---

**Last Updated:** February 2024
**Version:** 1.0
