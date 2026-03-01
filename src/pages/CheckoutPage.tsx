import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Upload, Check, Copy, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  benefitpayRef: string;
  paymentProofFile: File | null;
}

// new store settings row now holds an account name, a generic payment value
// (e.g. wallet address / phone / etc) and optional QR image URL.
// we expect multiple rows so we fetch an array.

type StoreSettingsRow = {
  account_name: string | null;
  payment_method: string | null;
  qr_image_url: string | null;
};

// Note: old BenefitPay QR env var is no longer required but keep for backward compatibility
const BENEFITPAY_QR_URL = import.meta.env.VITE_BENEFITPAY_QR_URL as string | undefined;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice, convert, currency } = useCurrency();
  const { items, totalPrice, clearCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phone: "",
    email: "",
    benefitpayRef: "",
    paymentProofFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ لمنع redirect للسلة بعد نجاح الطلب
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  // payment methods fetched from store_settings
  const [paymentMethods, setPaymentMethods] = useState<StoreSettingsRow[]>([]);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(true);

  // إجمالي السلة بالـ SAR (حسب CartContext)
  const totalSar = useMemo(() => Number(totalPrice) || 0, [totalPrice]);
  const totalInSelectedCurrency = useMemo(() => convert(totalSar), [convert, totalSar]);

  // عناصر الطلب (jsonb)
  const orderItems = useMemo(() => {
    return items.map((it) => {
      const unitSar = Number(it.variant.salePrice ?? it.variant.price ?? 0);
      return {
        product_id: it.product.id,
        product_name: it.product.name,
        variant_id: it.variant.id,
        duration: it.variant.duration,
        quantity: it.quantity,
        price_sar: unitSar,
        line_total_sar: unitSar * it.quantity,
      };
    });
  }, [items]);

  // ✅ لا ترجع للسلة إذا خلصنا checkout أو أثناء الإرسال
  useEffect(() => {
    if (checkoutCompleted || isSubmitting) return;

    if (items.length === 0) {
      toast({ title: "السلة فارغة", description: "ارجع للسلة وأضف منتجات قبل الدفع", variant: "destructive" });
      navigate("/cart");
    }
  }, [items.length, checkoutCompleted, isSubmitting, navigate, toast]);

  // Fetch store settings rows - all payment options
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingPaymentInfo(true);

      const res = await supabase
        .from("store_settings" as any)
        .select("account_name, payment_method, qr_image_url");

      if (cancelled) return;

      if (!res.error && Array.isArray(res.data)) {
        const validMethods = (res.data as unknown[]).filter(
          (item): item is StoreSettingsRow =>
            typeof item === 'object' &&
            item !== null &&
            'account_name' in item &&
            'payment_method' in item &&
            'qr_image_url' in item
        );
        setPaymentMethods(validMethods);
      } else {
        setPaymentMethods([]);
      }

      setLoadingPaymentInfo(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "الاسم الكامل مطلوب";
    if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!formData.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "البريد الإلكتروني غير صالح";
    if (!formData.paymentProofFile) newErrors.paymentProofFile = "تحميل إثبات الدفع مطلوب";

    if (items.length === 0) newErrors.cart = "السلة فارغة";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, paymentProofFile: "الملف يجب أن يكون صورة" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, paymentProofFile: "حجم الملف يجب أن يكون أقل من 5MB" }));
      return;
    }

    setFormData((prev) => ({ ...prev, paymentProofFile: file }));
    setErrors((prev) => ({ ...prev, paymentProofFile: "" }));

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPaymentProof = async (orderId: string, file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(fileName, file);
    if (uploadError) throw new Error(`فشل تحميل الملف: ${uploadError.message}`);

    const { data: publicUrl } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);
    return publicUrl.publicUrl;
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "تم النسخ", description: `تم نسخ ${label}` });
    } catch {
      toast({ title: "خطأ", description: "تعذر النسخ، انسخ يدويًا", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ title: "خطأ في النموذج", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      const orderId = crypto.randomUUID();

      // Upload proof
      const paymentProofUrl = await uploadPaymentProof(orderId, formData.paymentProofFile!);

      // Amounts
      const amount_sar = totalSar;
      const amount = totalInSelectedCurrency;

      // ✅ plan_id لازم يكون NOT NULL (سريع: نخليها أول منتج بالسلة)
      const firstProductId = items[0]?.product?.id;
      if (!firstProductId) {
        throw new Error("السلة فارغة");
      }

      const planName = `سلة مشتريات (${items.length} منتجات)`;

      // Insert order
      const { error: orderError } = await supabase
        .from("benefitpay_orders" as any)
        .insert({
          id: orderId,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,

          plan_id: firstProductId, // ✅ أهم تعديل (بدون null)
          plan_name: planName,

          amount,
          amount_sar,
          currency_code: currency.code,
          currency_symbol: currency.symbol,

          items: orderItems,

          benefitpay_ref: formData.benefitpayRef || null,
          payment_proof_url: paymentProofUrl,
          status: "pending",
          notes: null,
        });

      if (orderError) throw orderError;

      // Email
      const emailResponse = await fetch("/api/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          orderId,
          planName,
          amount,
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
        }),
      });

      if (!emailResponse.ok) console.error("Email sending failed, but order was created");

      toast({ title: "تم استقبال طلبك بنجاح", description: "سيتم التحقق من الدفع وإرسال التفاصيل قريباً" });

      // ✅ امنع redirect للسلة بعد clearCart
      setCheckoutCompleted(true);
      clearCart();

      setTimeout(() => navigate("/"), 1200);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "خطأ", description: error.message || "فشل إنشاء الطلب", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-6 md:py-12">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">الدفع</h1>
          <p className="mt-2 text-muted-foreground">راجع سلتك ثم ارفع إثبات الدفع</p>

          <div className="mt-3">
            <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              رجوع للسلة
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment methods (store_settings) */}
          <Card>
            <CardHeader>
              <CardTitle>بيانات الدفع</CardTitle>
              <CardDescription>استخدم أي من الطرق التالية ثم ارفع إثبات الدفع</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {loadingPaymentInfo ? (
                <p className="text-sm text-muted-foreground">جاري تحميل بيانات طرق الدفع...</p>
              ) : paymentMethods.length === 0 ? (
                <p className="text-sm text-destructive">
                  لم يتم إعداد أي طريقة دفع بعد. أضف صفوفاً في جدول store_settings عبر Supabase.
                </p>
              ) : (
                paymentMethods.map((row, idx) => {
                  const method = row.payment_method || "";
                  const account = row.account_name || "";
                  const qr = row.qr_image_url || "";

                  return (
                    <div key={idx} className="space-y-2">
                      {account && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">{account}:</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{account || "تفاصيل الدفع"}</p>
                          <p className="font-mono text-sm text-foreground break-all">{method}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => copyText(method, "معلومات الدفع")}
                          className="shrink-0 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          نسخ
                        </Button>
                      </div>
                      {qr && (
                        <div className="space-y-2">
                          <img
                            src={qr}
                            alt="QR code"
                            className="max-w-[220px] rounded-lg border border-border bg-secondary p-2"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Cart Summary */}
          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle>ملخص السلة</CardTitle>
              <CardDescription>هذه المنتجات اللي راح تنحفظ في الطلب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it) => {
                const unit = Number(it.variant.salePrice ?? it.variant.price ?? 0);
                return (
                  <div
                    key={it.variant.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{it.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.variant.duration} • الكمية: {it.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold gold-text">{formatPrice(unit * it.quantity)}</p>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="font-medium text-foreground">الإجمالي</span>
                <span className="text-lg font-bold gold-text">{formatPrice(totalSar)}</span>
              </div>

              <p className="text-[11px] text-muted-foreground">
                سيتم حفظ الإجمالي بعملة العميل ({currency.code}) وكذلك بالريال (SAR) للإدارة.
              </p>

              {errors.cart && <p className="text-xs text-red-500">{errors.cart}</p>}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>بيانات العميل</CardTitle>
              <CardDescription>أدخل بيانات التواصل الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="إذا كانت خدمتك على بريدك الإلكتروني اكتب بريدك هنا"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BenefitPay Ref */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الدفع</CardTitle>
              <CardDescription>رقم الإحالة (اختياري)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="benefitPayRef">رقم إحالة BenefitPay (اختياري)</Label>
                <Input
                  id="benefitPayRef"
                  value={formData.benefitpayRef}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefitpayRef: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Proof */}
          <Card>
            <CardHeader>
              <CardTitle>إثبات الدفع</CardTitle>
              <CardDescription>حمّل صورة من إثبات الدفع من BenefitPay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentProof">تحميل إثبات الدفع *</Label>

                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 p-8 cursor-pointer transition-colors hover:border-primary hover:bg-secondary/75"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">انقر لتحميل الصورة أو اسحبها هنا</p>
                    <p className="text-xs text-muted-foreground">(صور فقط، بحد أقصى 5MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-border overflow-hidden bg-secondary/50">
                    <img src={previewUrl} alt="Payment proof preview" className="h-64 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      تغيير الصورة
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id="paymentProof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.paymentProofFile && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-100/20 p-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-700">{formData.paymentProofFile.name}</p>
                  </div>
                )}

                {errors.paymentProofFile && <p className="text-xs text-red-500">{errors.paymentProofFile}</p>}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>سيتم التحقق من إثبات الدفع يدويًا، وستتلقى تفاصيل الطلب عبر البريد الإلكتروني</AlertDescription>
          </Alert>

          <Button type="submit" disabled={isSubmitting} className="w-full gold-gradient h-12 text-base font-bold">
            {isSubmitting ? "جاري معالجة الطلب..." : "تم الدفع / إرسال الطلب"}
          </Button>
        </form>
      </div>
    </div>
  );
}