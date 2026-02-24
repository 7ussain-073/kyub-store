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
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "A2H Store <noreply@a2h-store.store>",
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
  if (!sendgridApiKey) throw new Error("SENDGRID_API_KEY is not configured");

  const toArr = Array.isArray(to) ? to : [to];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sendgridApiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: toArr.map(email => ({ email })), subject }],
      from: { email: "noreply@a2h-store.store", name: "A2H Store" },
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

function generateOrderConfirmationEmail(
  fullName: string,
  orderId: string,
  planName: string,
  amount: number,
  currencySymbol: string
): string {
  return `
  <div style="font-family:Arial; direction:rtl;">
    <h2>A2H Store</h2>
    <p>مرحباً ${fullName}</p>
    <p>تم استلام طلبك بنجاح.</p>
    <p><b>رقم الطلب:</b> ${orderId}</p>
    <p><b>الخطة:</b> ${planName}</p>
    <p><b>المبلغ:</b> ${amount.toFixed(2)} ${currencySymbol}</p>
  </div>
  `.trim();
}

// ✅ NEW — Admin Email Template
function generateAdminNotificationEmail(
  fullName: string,
  email: string,
  orderId: string,
  planName: string,
  amount: number,
  currencySymbol: string
): string {
  return `
  <div style="font-family:Arial; direction:rtl;">
    <h2>✅ طلب جديد في المتجر</h2>
    <p><b>رقم الطلب:</b> ${orderId}</p>
    <p><b>العميل:</b> ${fullName}</p>
    <p><b>البريد:</b> ${email}</p>
    <p><b>الخطة/السلة:</b> ${planName}</p>
    <p><b>المبلغ:</b> ${amount.toFixed(2)} ${currencySymbol}</p>
    <hr/>
    <p style="color:#666;font-size:12px;">هذا إشعار تلقائي للمتجر</p>
  </div>
  `.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, fullName, orderId, planName, amount, currencyCode, currencySymbol } = req.body ?? {};

  if (!email || !fullName || !orderId || !planName || amount === undefined) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const safeSymbol =
    (typeof currencySymbol === "string" && currencySymbol.trim()) ||
    (typeof currencyCode === "string" && SYMBOLS[currencyCode]) ||
    "د.ب";

  try {
    // 1️⃣ Send to customer
    const customerHtml = generateOrderConfirmationEmail(
      String(fullName),
      String(orderId),
      String(planName),
      amountNum,
      safeSymbol
    );

    await sendEmail(String(email), `تأكيد طلب الاشتراك - ${orderId}`, customerHtml);

    // 2️⃣ Send to store/admin
    if (STORE_ALERT_EMAIL) {
      const adminEmails = STORE_ALERT_EMAIL.split(",").map(e => e.trim()).filter(Boolean);

      if (adminEmails.length > 0) {
        const adminHtml = generateAdminNotificationEmail(
          String(fullName),
          String(email),
          String(orderId),
          String(planName),
          amountNum,
          safeSymbol
        );

        await sendEmail(adminEmails, `✅ طلب جديد - ${orderId}`, adminHtml);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Emails sent successfully",
    });
  } catch (error: any) {
    console.error("Email sending error:", error);

    return res.status(500).json({
      error: "Failed to send email",
      details: error?.message || String(error),
    });
  }
}