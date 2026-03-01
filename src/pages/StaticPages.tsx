import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-3xl">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <span>/</span>
          <span className="text-foreground">{title}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <h1 className="mb-6 text-2xl font-bold text-foreground">{title}</h1>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <StaticPage title="سياسة الخصوصية">
      <p>نحن في متجر Kyub نولي أهمية كبيرة لخصوصية عملائنا. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.</p>
      <h2 className="text-lg font-semibold text-foreground">المعلومات التي نجمعها</h2>
      <p>نجمع المعلومات التالية عند استخدامك لمتجرنا:</p>
      <ul className="list-disc list-inside space-y-1 pr-4">
        <li>الاسم الكامل</li>
        <li>رقم الجوال والبريد الإلكتروني</li>
        <li>معلومات الدفع (لا يتم تخزينها لدينا)</li>
        <li>سجل المشتريات</li>
      </ul>
      <h2 className="text-lg font-semibold text-foreground">كيف نستخدم المعلومات</h2>
      <p>نستخدم معلوماتك لتقديم الخدمات المطلوبة، معالجة الطلبات، التواصل معك بشأن طلباتك، وتحسين تجربتك في المتجر.</p>
      <h2 className="text-lg font-semibold text-foreground">حماية المعلومات</h2>
      <p>نستخدم أحدث تقنيات الحماية والتشفير لضمان أمان معلوماتك الشخصية.</p>
    </StaticPage>
  );
}

export function TermsPage() {
  return (
    <StaticPage title="الشروط والأحكام">
      <p>مرحباً بك في متجر Kyub. باستخدامك لهذا الموقع فإنك توافق على الشروط والأحكام التالية:</p>
      <h2 className="text-lg font-semibold text-foreground">طبيعة المنتجات</h2>
      <p>جميع المنتجات المعروضة هي اشتراكات رقمية. لا يتم شحن أي منتجات مادية. يتم التسليم عبر إرسال بيانات التفعيل بعد إتمام عملية الدفع.</p>
      <h2 className="text-lg font-semibold text-foreground">الدفع</h2>
      <p>يجب إتمام الدفع قبل تفعيل الاشتراك. نقبل عدة وسائل دفع إلكترونية.</p>
      <h2 className="text-lg font-semibold text-foreground">الضمان</h2>
      <p>نوفر ضمان كامل طوال مدة الاشتراك. في حال وجود أي مشكلة لم يتم حلها، يتم استرداد المبلغ كاملاً.</p>
    </StaticPage>
  );
}

export function ReturnsPage() {
  return (
    <StaticPage title="سياسة الاسترجاع">
      <p>نلتزم بتقديم أفضل خدمة لعملائنا. في حال عدم رضاك عن الخدمة، يمكنك طلب استرداد المبلغ وفقاً للشروط التالية:</p>
      <h2 className="text-lg font-semibold text-foreground">شروط الاسترداد</h2>
      <ul className="list-disc list-inside space-y-1 pr-4">
        <li>يجب تقديم طلب الاسترداد خلال 24 ساعة من الشراء</li>
        <li>يجب ألا يكون قد تم استخدام الاشتراك</li>
        <li>يتم الاسترداد عبر نفس طريقة الدفع المستخدمة</li>
        <li>في حال وجود مشكلة تقنية لم يتم حلها، يتم الاسترداد كاملاً</li>
      </ul>
      <h2 className="text-lg font-semibold text-foreground">مدة الاسترداد</h2>
      <p>يتم معالجة طلبات الاسترداد خلال 3-5 أيام عمل.</p>
    </StaticPage>
  );
}

export function ComplaintsPage() {
  return (
    <StaticPage title="الشكاوى والمقترحات">
      <p>نحرص دائماً على تحسين خدماتنا ونرحب بجميع الشكاوى والمقترحات.</p>
      <h2 className="text-lg font-semibold text-foreground">كيفية تقديم شكوى</h2>
      <ul className="list-disc list-inside space-y-1 pr-4">
        <li>تواصل معنا عبر واتساب على الرقم: +964772 8157639</li>
        <li>أرسل بريد إلكتروني إلى: support@kyubstore.com</li>
        <li>قم بذكر رقم الطلب وتفاصيل المشكلة</li>
      </ul>
      <h2 className="text-lg font-semibold text-foreground">مدة الرد</h2>
      <p>نلتزم بالرد على جميع الشكاوى خلال 24 ساعة كحد أقصى.</p>
    </StaticPage>
  );
}
