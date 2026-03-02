import { useState } from "react";
import { Search, Package, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim() && contact.trim()) {
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <div className="mb-6 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">تتبع طلبك</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              أدخل رقم الطلب ورقم الجوال أو البريد الإلكتروني
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                رقم الطلب
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="مثال: ORD-12345"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                رقم الجوال أو البريد الإلكتروني
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+964772 8157639 أو kyub.comnpany.0@gmail.com"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              className="gold-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Search className="h-4 w-4" />
              تتبع الطلب
            </button>
          </form>

          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-border bg-secondary p-4 text-center"
            >
              <p className="text-sm text-muted-foreground">
                لم يتم العثور على طلب بهذه البيانات. يرجى التأكد من رقم الطلب وبيانات الاتصال.
              </p>
              <Link
                to="/contact"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                تواصل مع الدعم
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
