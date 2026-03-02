import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // need auth state for permission checks
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Check, X } from "lucide-react";

type OrderStatus = "pending" | "approved" | "rejected";

interface OrderItemRow {
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  duration?: string;
  quantity?: number;
  price_sar?: number;
  line_total_sar?: number;

  // لو حبيت لاحقاً تخزن بالعملة المختارة
  price?: number;
  line_total?: number;
  currency_symbol?: string;
  currency_code?: string;
}

interface BenefitPayOrder {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  plan_id: string | null;
  plan_name: string;
  amount: number;

  // ✅ موجودين عندك
  amount_sar?: number | null;
  currency_code?: string | null;
  currency_symbol?: string | null;

  // ✅ الجديد: تفاصيل السلة (jsonb)
  items?: OrderItemRow[] | any | null;

  payment_ref: string | null;
  payment_proof_url: string;
  status: OrderStatus;
  notes: string | null;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<BenefitPayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<BenefitPayOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // authentication context (used to know when we can query orders)
  const { user, isAdmin, loading: authLoading } = useAuth();

  // ✅ helper: items ممكن تجي array أو string أو null حسب DB/SDK
  const safeItems = (order?: BenefitPayOrder | null): OrderItemRow[] => {
    if (!order) return [];
    const raw = order.items as any;

    if (Array.isArray(raw)) return raw;

    // بعض الأحيان jsonb يطلع كـ string
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const hasItems = (order: BenefitPayOrder) => safeItems(order).length > 0;

  const formatMoney = (amount: number, symbol?: string | null) => {
    const val = Number(amount || 0).toFixed(2);
    return `${val} ${symbol || ""}`.trim();
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "خطأ",
        description: error.message || error.details || "فشل تحميل الطلبات",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Sort by pending first, then by date
    const sorted = ((data ?? []) as any[]).sort((a: BenefitPayOrder, b: BenefitPayOrder) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setOrders(sorted);
    setLoading(false);
  };

  useEffect(() => {
    // avoid running before auth finishes; RLS may block if user not known
    if (authLoading) return;
    if (!isAdmin) return; // should already be gated by layout, but guard anyway

    fetchOrders();
  }, [authLoading, isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase
      .from("orders" as any)
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة الطلب",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم التحديث",
      description: `تم تحديث حالة الطلب إلى ${statusLabels[newStatus]}`,
    });

    setIsDialogOpen(false);
    setSelectedOrder(null);
    fetchOrders();
  };

  if (loading) return <div className="text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عدد الطلبات: {orders.length} ({orders.filter((o) => o.status === "pending").length} قيد الانتظار)
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">لا توجد طلبات بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const itemsArr = safeItems(order);

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Order Details */}
                    <div>
                      <div className="grid gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">رقم الطلب</p>
                          <p className="font-mono text-sm text-foreground">{order.id}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">اسم العميل</p>
                          <p className="text-sm text-foreground">{order.full_name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">الهاتف</p>
                            <p className="text-sm text-foreground">{order.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">البريد</p>
                            <p className="truncate text-sm text-foreground">{order.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">الخطة</p>
                            <p className="text-sm text-foreground">{order.plan_name}</p>

                            {/* ✅ عرض المنتجات لو الطلب سلة */}
                            {itemsArr.length > 0 && (
                              <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3">
                                <p className="text-xs text-muted-foreground mb-1">المنتجات:</p>
                                <ul className="list-disc pr-5 text-sm text-foreground space-y-1">
                                  {itemsArr.slice(0, 3).map((it, idx) => (
                                    <li key={`${it.variant_id || idx}-${idx}`}>
                                      {it.product_name || "منتج"} — {it.duration || "-"} — x{it.quantity || 1}
                                    </li>
                                  ))}
                                </ul>
                                {itemsArr.length > 3 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    + {itemsArr.length - 3} منتجات أخرى
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-muted-foreground">المبلغ</p>
                            <p className="text-sm font-bold gold-text">
                              {formatMoney(order.amount, order.currency_symbol)}
                            </p>

                            {/* ✅ اختياري: عرض SAR للإدارة لو موجود */}
                            {order.amount_sar != null && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                SAR: {Number(order.amount_sar).toFixed(2)} ر.س
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">تاريخ الطلب</p>
                          <p className="text-sm text-foreground">
                            {new Date(order.created_at).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {order.payment_ref && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">رقم BenefitPay</p>
                            <p className="text-sm text-foreground">{order.payment_ref}</p>
                          </div>
                        )}

                        {order.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">ملاحظات</p>
                            <p className="text-sm text-foreground">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">الحالة</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              statusColors[order.status] || ""
                            }`}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          عرض التفاصيل
                        </Button>

                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => updateOrderStatus(order.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-2"
                              onClick={() => updateOrderStatus(order.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>الطلب: {selectedOrder?.id.slice(0, 20)}...</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Proof */}
              <div className="rounded-lg border border-border overflow-hidden bg-secondary/50">
                <img
                  src={selectedOrder.payment_proof_url}
                  alt="Payment proof"
                  className="w-full object-contain max-h-96"
                />
              </div>

              {/* Items */}
              {safeItems(selectedOrder).length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">المنتجات</p>

                  <div className="space-y-2">
                    {safeItems(selectedOrder).map((it, idx) => (
                      <div
                        key={`${it.variant_id || idx}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {it.product_name || "منتج"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {it.duration || "-"} • الكمية: {it.quantity || 1}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold gold-text">
                            {Number(it.line_total_sar || 0).toFixed(2)} ر.س
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid gap-3 rounded-lg bg-secondary/30 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">العميل:</span>
                  <span className="text-sm font-medium text-foreground">{selectedOrder.full_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الخطة:</span>
                  <span className="text-sm font-medium text-foreground">{selectedOrder.plan_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المبلغ:</span>
                  <span className="text-sm font-bold gold-text">
                    {formatMoney(selectedOrder.amount, selectedOrder.currency_symbol)}
                  </span>
                </div>

                {selectedOrder.amount_sar != null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المبلغ (SAR):</span>
                    <span className="text-sm font-bold gold-text">
                      {Number(selectedOrder.amount_sar).toFixed(2)} ر.س
                    </span>
                  </div>
                )}

                {selectedOrder.payment_ref && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">رقم BenefitPay:</span>
                    <span className="text-sm font-medium text-foreground">{selectedOrder.payment_ref}</span>
                  </div>
                )}
              </div>

              {selectedOrder.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => updateOrderStatus(selectedOrder.id, "approved")}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    موافقة على الطلب
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => updateOrderStatus(selectedOrder.id, "rejected")}
                  >
                    <X className="h-4 w-4 mr-2" />
                    رفض الطلب
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}