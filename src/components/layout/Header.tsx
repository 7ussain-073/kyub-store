import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Search, Menu, X, User, Package, LogOut } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategories } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { user, signOut } = useAuth();
  const { currency, setCurrencyCode, currencies } = useCurrency();
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="border-b border-border bg-secondary/50">
        <div className="container flex items-center justify-between py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link to="/order-tracking" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Package className="h-3 w-3" />
              تتبع الطلب
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span>تفعيل فوري • ضمان كامل المدة • دعم على مدار الساعة</span>
            <select
              value={currency.code}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="gold-gradient flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-primary-foreground">
            k
          </div>
          <span className="hidden text-xl font-bold sm:block">
            <span className="gold-text">Kyub</span>{" "}
            <span className="text-foreground">Store</span>
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 items-center mx-8 lg:flex"
        >
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اشتراك..."
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-primary lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            to="/wishlist"
            className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <button
              onClick={() => signOut()}
              className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-destructive"
              title="تسجيل الخروج"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary hover:text-primary lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation (desktop) */}
      <nav className="hidden border-t border-border lg:block">
        <div className="container flex items-center gap-1 py-2">
          <Link to="/" className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary">
            الرئيسية
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile search */}
      {searchOpen && (
        <div className="border-t border-border p-3 lg:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اشتراك..."
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                autoFocus
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-border bg-background p-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary"
            >
              الرئيسية
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <Link
              to="/order-tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              📦 تتبع الطلب
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              📞 تواصل معنا
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
