import { Link } from "react-router-dom";
import { MessageCircle, Instagram, Youtube, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="gold-gradient flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-primary-foreground">
                A
              </div>
              <span className="text-lg font-bold">
                <span className="gold-text">Kyub</span>{" "}
                <span className="text-foreground">Store</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              متجر Kyub الرقمي - وجهتك الأولى لاشتراكات البث والخدمات الرقمية بأفضل الأسعار مع ضمان كامل المدة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  تتبع الطلب
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">روابط مهمة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  سياسة الاسترجاع
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  الشكاوى والمقترحات
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-primary">تابعنا</h3>
            <div className="flex gap-3">
              <a
                href="https://wa.me/9647728157639"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-whatsapp hover:text-primary-foreground"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>📧 support@kyubstore.com</p>
              <p className="mt-1">📱 +973 </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kyub Store. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
