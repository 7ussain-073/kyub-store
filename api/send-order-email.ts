import type { VercelRequest, VercelResponse } from "@vercel/node";

// Email service configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "resend";
const STORE_ALERT_EMAIL = process.env.STORE_ALERT_EMAIL; // ✅ NEW

// Fallback currency symbols
const SYMBOLS: Record<string, string> = {
  BHD: "د.ب",
  SAR: "ر.س",
  USD: "$",
  EUR: "€",
};

async function sendEmailViaResend(to: string | string[], subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Kyub Store <noreply@kayube.com>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Resend API error: ${error?.message || response.statusText}`);
  }
}

async function sendEmailViaSendGrid(to: string | string[], subject: string, html: string): Promise<void> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendgridApiKey) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }

  const toArr = Array.isArray(to) ? to : [to];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sendgridApiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: toArr.map((email) => ({ email })), subject }],
      from: { email: "noreply@kayube.com", name: "Kyub Store" },
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }
}

async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  if (EMAIL_PROVIDER === "sendgrid") {
    await sendEmailViaSendGrid(to, subject, html);
  } else {
    await sendEmailViaResend(to, subject, html);
  }
}

// ✅ هذا نفس قالب العميل اللي عندك (بدون تغيير التصميم)
function generateOrderConfirmationEmail(
  fullName: string,
  orderId: string,
  planName: string,
  amount: number,
  currencySymbol: string
): string {
  const safeName = String(fullName || "").trim() || "عميلنا العزيز";
  const safePlan = String(planName || "").trim() || "—";
  const safeOrder = String(orderId || "").trim() || "—";
  const safeSymbol = String(currencySymbol || "").trim() || "—";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تأكيد الطلب</title>
    <style>
      body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
      .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4af37; }
      .header h1 { color: #d4af37; margin: 0; font-size: 28px; }
      .content { background-color: white; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .order-details { background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .detail-row:last-child { border-bottom: none; }
      .label { color: #666; font-weight: 500; }
      .value { color: #333; font-weight: 600; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      .status-pending { background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 4px; margin: 15px 0; border-right: 4px solid #ffc107; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>Kyub Store</h1></div>

      <div class="content">
        <p>مرحباً ${safeName},</p>
        <p>شكراً لك على اختيار خدمات Kyub Store!</p>
        <p>لقد استقبلنا طلبك بنجاح. سيتم التحقق من إثبات الدفع الخاص بك وتأكيد اشتراكك قريباً.</p>

        <div class="status-pending">
          <strong>⏳ الحالة: قيد المراجعة</strong><br />
          سيتم معالجة طلبك خلال 24 ساعة بعد التحقق من إثبات الدفع.
        </div>

        <h3 style="color: #d4af37; margin-top: 25px;">تفاصيل الطلب</h3>
        <div class="order-details">
          <div class="detail-row">
            <span class="label">رقم الطلب:</span>
            <span class="value">${safeOrder}</span>
          </div>
          <div class="detail-row">
            <span class="label">الخطة:</span>
            <span class="value">${safePlan}</span>
          </div>
          <div class="detail-row">
            <span class="label">المبلغ:</span>
            <span class="value">${Number(amount).toFixed(2)} ${safeSymbol}</span>
          </div>
        </div>

        <h3 style="color: #d4af37; margin-top: 25px;">الخطوات التالية</h3>
        <ol style="color: #555;">
          <li>سيقوم فريقنا بالتحقق من إثبات الدفع الخاص بك</li>
          <li>عند الموافقة، ستتلقى بيانات الدخول الخاصة بك عبر البريد الإلكتروني</li>
          <li>ستتمكن من الوصول الفوري إلى الخدمة بعد تأكيد الطلب</li>
        </ol>

        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          إذا كان لديك أي أسئلة، يرجى التواصل معنا عبر صفحة الاتصال بنا.
        </p>
      </div>

      <div class="footer">
        <p>© 2024 Kyub Store. جميع الحقوق محفوظة.</p>
        <p>هذا البريد الإلكتروني تم إرساله تلقائياً. يرجى عدم الرد عليه مباشرة.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

// ✅ NEW: قالب إشعار المتجر (بسيط وعملي)
function generateStoreAlertEmail(params: {
  fullName: string;
  customerEmail: string;
  orderId: string;
  planName: string;
  amount: number;
  currencySymbol: string;
  currencyCode?: string;
}) {
  const {
    fullName,
    customerEmail,
    orderId,
    planName,
    amount,
    currencySymbol,
    currencyCode,
  } = params;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>طلب جديد</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.7; color: #222; }
      .wrap { max-width: 640px; margin: 0 auto; padding: 18px; background: #f7f7f7; }
      .card { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 16px; }
      .title { margin: 0 0 10px; }
      .row { display:flex; justify-content:space-between; padding: 8px 0; border-bottom:1px solid #f0f0f0;}
      .row:last-child{border-bottom:none;}
      .k { color:#666; }
      .v { font-weight:700; }
      .badge { display:inline-block; padding:6px 10px; border-radius:999px; background:#fff3cd; color:#856404; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h2 class="title">✅ طلب جديد في المتجر</h2>
        <div class="badge">قيد المراجعة</div>

        <div style="margin-top:12px;">
          <div class="row"><span class="k">رقم الطلب</span><span class="v">${orderId}</span></div>
          <div class="row"><span class="k">العميل</span><span class="v">${fullName}</span></div>
          <div class="row"><span class="k">بريد العميل</span><span class="v">${customerEmail}</span></div>
          <div class="row"><span class="k">الخطة/السلة</span><span class="v">${planName}</span></div>
          <div class="row"><span class="k">المبلغ</span><span class="v">${amount.toFixed(2)} ${currencySymbol} ${currencyCode ? `(${currencyCode})` : ""}</span></div>
        </div>

        <p style="margin-top:14px; color:#777; font-size:12px;">
          هذا إشعار تلقائي للمتجر.
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, fullName, orderId, planName, amount, currencyCode, currencySymbol } = req.body ?? {};

  if (!email || !fullName || !orderId || !planName || amount === undefined) {
    return res.status(400).json({
      error: "Missing required fields: email, fullName, orderId, planName, amount",
    });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // ✅ Symbol fallback logic
  const safeSymbol =
    (typeof currencySymbol === "string" && currencySymbol.trim()) ||
    (typeof currencyCode === "string" && SYMBOLS[currencyCode]) ||
    "$";

  try {
    // 1) Email to customer (DESIGN محفوظ)
    const customerHtml = generateOrderConfirmationEmail(
      String(fullName),
      String(orderId),
      String(planName),
      amountNum,
      safeSymbol
    );

    await sendEmail(String(email), `تأكيد طلب الاشتراك - ${orderId}`, customerHtml);

    // 2) Email to store/admin (NEW)
    if (STORE_ALERT_EMAIL) {
      const adminEmails = String(STORE_ALERT_EMAIL)
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (adminEmails.length > 0) {
        const adminHtml = generateStoreAlertEmail({
          fullName: String(fullName),
          customerEmail: String(email),
          orderId: String(orderId),
          planName: String(planName),
          amount: amountNum,
          currencySymbol: safeSymbol,
          currencyCode: typeof currencyCode === "string" ? currencyCode : undefined,
        });

        await sendEmail(adminEmails, `✅ طلب جديد - ${orderId}`, adminHtml);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order confirmation email sent successfully",
    });
  } catch (error: any) {
    console.error("Email sending error:", error);

    return res.status(500).json({
      error: "Failed to send email",
      details: error?.message || String(error),
    });
  }
}