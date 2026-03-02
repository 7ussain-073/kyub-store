import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, pending, products] = await Promise.all([
        supabase.from("orders").select("id, amount", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact" }),
      ]);

      const revenue = (orders.data || []).reduce((sum, o) => sum + Number(o.amount || 0), 0);

      setStats({
        totalOrders: orders.count || 0,
        pendingOrders: pending.count || 0,
        totalProducts: products.count || 0,
        totalRevenue: revenue,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: ShoppingCart, label: "إجمالي الطلبات", value: stats.totalOrders, color: "text-primary" },
    { icon: Package, label: "طلبات معلقة", value: stats.pendingOrders, color: "text-yellow-500" },
    { icon: BarChart3, label: "المنتجات", value: stats.totalProducts, color: "text-green-500" },
    { icon: TrendingUp, label: "الإيرادات", value: formatPrice(stats.totalRevenue), color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">لوحة التحكم</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-secondary p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
