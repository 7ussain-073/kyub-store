import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DBVariant {
  id: string;
  product_id: string;
  duration: string;
  price: number;
  sale_price: number | null;
  stock_status: string;
}

interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: string;
  category_id: string | null;
  created_at: string;
  product_variants: DBVariant[];
}

const emptyVariant = { duration: "", price: "", sale_price: "", stock_status: "in_stock" };

export default function AdminProducts() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    status: "published",
    category_id: "",
  });
  const [variantForms, setVariantForms] = useState<
    { id?: string; duration: string; price: string; sale_price: string; stock_status: string }[]
  >([{ ...emptyVariant }]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();
  const { currency, convert } = useCurrency();

  function showSbError(toastFn: any, title: string, error: any) {
    console.error(title, error);
    toastFn({
      title,
      description: error?.message || String(error),
      variant: "destructive",
    });
  }

  const fetchData = async () => {
    setLoading(true);

    const productsQuery = selectedCategory
      ? supabase
          .from("products")
          .select("*, product_variants(*)")
          .eq("category_id", selectedCategory)
          .order("created_at", { ascending: false })
      : supabase
          .from("products")
          .select("*, product_variants(*)")
          .order("created_at", { ascending: false });

    const [prodsRes, catsRes] = await Promise.all([
      productsQuery,
      supabase.from("categories").select("id, name"),
    ]);

    if (catsRes.error) {
      showSbError(toast, "فشل تحميل الأقسام", catsRes.error);
      setLoading(false);
      return;
    }

    if (prodsRes.error) {
      showSbError(toast, "فشل تحميل المنتجات", prodsRes.error);
      setLoading(false);
      return;
    }

    const catsArr = (catsRes.data || []) as { id: string; name: string }[];
    setCategories(catsArr);

    const prodsArr = (prodsRes.data || []) as DBProduct[];

    // when showing all, sort by category name then date to make review easier
    if (!selectedCategory) {
      const nameMap = new Map(catsArr.map((c) => [c.id, c.name]));
      prodsArr.sort((a, b) => {
        const an = nameMap.get(a.category_id || "") || "";
        const bn = nameMap.get(b.category_id || "") || "";
        const cmp = an.localeCompare(bn, "ar", { sensitivity: "base" });
        if (cmp !== 0) return cmp;
        return b.created_at.localeCompare(a.created_at);
      });
    }

    setProducts(prodsArr);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        image_url: form.image_url || null,
        status: form.status,
        category_id: form.category_id || null,
      };

      let productId = editingId;

      // 1) save product
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) return showSbError(toast, "فشل تحديث المنتج", error);
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) return showSbError(toast, "فشل إضافة المنتج", error);
        productId = data.id;
      }

      // 2) save variants (✅ الشرط الصحيح)
      if (productId) {
        // Delete removed variants (only when editing)
        if (editingId) {
          const existingProduct = products.find((p) => p.id === editingId);
          const keepIds = variantForms.filter((v) => v.id).map((v) => v.id!);
          const toDelete = (existingProduct?.product_variants || []).filter((v) => !keepIds.includes(v.id));

          for (const v of toDelete) {
            const { error } = await supabase.from("product_variants").delete().eq("id", v.id);
            if (error) return showSbError(toast, "فشل حذف سعر/مدة قديم", error);
          }
        }

        for (const vf of variantForms) {
          if (!vf.duration || !vf.price) continue;

            // prices entered in the admin UI are in the currently selected currency
            // convert them back to SAR for storage (system expects SAR)
            const enteredPrice = Number(vf.price);
            const enteredSale = vf.sale_price ? Number(vf.sale_price) : null;
            const priceInSar = Math.round(((enteredPrice / (currency.rate || 1)) + Number.EPSILON) * 100) / 100;
            const saleInSar = enteredSale != null ? Math.round(((enteredSale / (currency.rate || 1)) + Number.EPSILON) * 100) / 100 : null;

            const variantPayload = {
              product_id: productId,
              duration: vf.duration,
              price: priceInSar,
              sale_price: saleInSar,
              stock_status: vf.stock_status,
            };

          if (vf.id) {
            const { error: upErr } = await supabase.from("product_variants").update(variantPayload).eq("id", vf.id);
            if (upErr) return showSbError(toast, "فشل تحديث سعر/مدة", upErr);
          } else {
            const { error: insErr } = await supabase.from("product_variants").insert(variantPayload);
            if (insErr) return showSbError(toast, "فشل إضافة سعر/مدة", insErr);
          }
        }
      }

      toast({ title: editingId ? "تم تحديث المنتج" : "تم إضافة المنتج" });
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", description: "", image_url: "", status: "published", category_id: "" });
      setVariantForms([{ ...emptyVariant }]);
      fetchData();
    } catch (err: any) {
      showSbError(toast, "حدث خطأ غير متوقع", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    const { error: vErr } = await supabase.from("product_variants").delete().eq("product_id", id);
    if (vErr) return showSbError(toast, "فشل حذف الأسعار/المدد", vErr);

    const { error: pErr } = await supabase.from("products").delete().eq("id", id);
    if (pErr) return showSbError(toast, "فشل حذف المنتج", pErr);

    toast({ title: "تم حذف المنتج" });
    fetchData();
  };

  const startEdit = (p: DBProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      image_url: p.image_url || "",
      status: p.status,
      category_id: p.category_id || "",
    });

    // convert stored SAR prices to current selected currency for editing
    setVariantForms(
      p.product_variants.length > 0
        ? p.product_variants.map((v) => ({
            id: v.id,
            duration: v.duration,
            price: String(convert(Number(v.price || 0))),
            sale_price: v.sale_price ? String(convert(Number(v.sale_price))) : "",
            stock_status: v.stock_status,
          }))
        : [{ ...emptyVariant }]
    );

    setShowForm(true);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariantForms((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => setVariantForms((prev) => [...prev, { ...emptyVariant }]);
  const removeVariant = (index: number) => setVariantForms((prev) => prev.filter((_, i) => i !== index));

  if (loading) return <div className="text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">إدارة المنتجات</h1>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">عرض جميع المنتجات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({ name: "", description: "", image_url: "", status: "published", category_id: "" });
              setVariantForms([{ ...emptyVariant }]);
            }}
            className="gold-gradient flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> إضافة منتج
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">اسم المنتج</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">القسم</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">رابط الصورة</label>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Variants / Pricing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">الأسعار والمدد</label>
              <button type="button" onClick={addVariant} className="text-xs text-primary hover:underline">
                + إضافة سعر
              </button>
            </div>

            {variantForms.map((vf, i) => (
              <div
                key={i}
                className="grid gap-3 sm:grid-cols-5 items-end rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">المدة</label>
                  <input
                    value={vf.duration}
                    onChange={(e) => updateVariant(i, "duration", e.target.value)}
                    placeholder="شهر واحد"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">السعر ({currency.code})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vf.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">سعر العرض</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vf.sale_price}
                    onChange={(e) => updateVariant(i, "sale_price", e.target.value)}
                    placeholder="اختياري"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">المخزون</label>
                  <select
                    value={vf.stock_status}
                    onChange={(e) => updateVariant(i, "stock_status", e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="in_stock">متوفر</option>
                    <option value="out_of_stock">نفذ</option>
                  </select>
                </div>

                <div>
                  {variantForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="gold-gradient rounded-lg px-6 py-2 text-sm font-bold text-primary-foreground">
              {editingId ? "تحديث" : "إضافة"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg border border-border px-6 py-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">المنتج</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">القسم</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الأسعار</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {categories.find((c) => c.id === p.category_id)?.name || "بدون قسم"}
                </td>

                <td className="px-4 py-3">
                  {p.product_variants.length > 0 ? (
                    <div className="space-y-1">
                      {p.product_variants
                        .slice(0, expandedProduct === p.id ? undefined : 2)
                        .map((v) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{v.duration}:</span>

                            {v.sale_price ? (
                              <>
                                <span className="font-semibold text-primary">{v.sale_price} ر.س</span>
                                <span className="text-muted-foreground line-through">{v.price}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-foreground">{v.price} ر.س</span>
                            )}

                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                v.stock_status === "in_stock"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {v.stock_status === "in_stock" ? "متوفر" : "نفذ"}
                            </span>
                          </div>
                        ))}

                      {p.product_variants.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setExpandedProduct(expandedProduct === p.id ? null : p.id)}
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          {expandedProduct === p.id ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> أقل
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" /> +{p.product_variants.length - 2} أخرى
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">بدون أسعار</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "published"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {p.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد منتجات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
