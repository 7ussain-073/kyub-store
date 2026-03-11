import { MessageCircle, Send, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">تواصل معنا</h1>
          <p className="mt-2 text-muted-foreground">
            نسعد بتواصلك معنا عبر أي من القنوات التالية
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: MessageCircle,
              label: "واتساب",
              value: "+964772 8157639",
              href: "https://wa.me/9647728157639",
              colorClass: "hover:border-primary hover:bg-primary/10",
            },
            {
              icon: Mail,
              label: "البريد الإلكتروني",
              value: "support@collierstore.com",
              href: "mailto:support@collierstore.com",
              colorClass: "hover:border-primary hover:bg-primary/10",
            },
            {
              icon: Send,
              label: "تيليجرام",
              value: "@kyub5",
              href: "https://t.me/kyub5",
              colorClass: "hover:border-primary hover:bg-primary/10",
            },
          ].map(({ icon: Icon, label, value, href, colorClass }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all ${colorClass}`}
            >
              <Icon className="h-8 w-8 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{value}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
