import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  Tag,
  CreditCard,
  CheckCircle,
  TrendingUp,
  X,
  Info
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
  stock: string;
}

export default function ShopSection() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [coupon, setCoupon] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>('');
  const [couponSuccess, setCouponSuccess] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  
  // Checkout Form states
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerZip, setCustomerZip] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const products: Product[] = [];

  const categories = ['ALL', 'APPAREL', 'COLLECTIBLES'];

  const filteredProducts = products.filter((p) => {
    return activeCategory === 'ALL' || p.category === activeCategory;
  });

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, action: 'add' | 'sub') => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = action === 'add' ? item.qty + 1 : item.qty - 1;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemove = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === 'BEEXCELLENT') {
      setDiscountPercent(20);
      setCouponSuccess(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
      setCouponSuccess(false);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const delivery = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discountAmount + delivery;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerAddress) return;

    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCart([]);
      setIsCheckingOut(false);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerCity('');
      setCustomerZip('');
      setDiscountPercent(0);
      setCoupon('');
    }, 5000);
  };

  return (
    <section id="shop-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute left-1/4 top-1/3 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <ShoppingBag className="h-3.5 w-3.5" />
            OFFICIAL COLLECTION SHOP
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Co-op <span className="text-gold-500">Exporium</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Purchase official products with complete trust. 100% of profit is distributed directly to supported cancer foundations and pediatric hospitals.
          </p>
        </div>

        {/* Store Grid + Cart Split layout */}
        <div className="grid gap-8 lg:grid-cols-12 items-start text-left">
          {/* Products Catalog - 8 Cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* Catalog Filters */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all ${
                      activeCategory === cat
                        ? 'bg-gold-500 border-gold-400 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                {filteredProducts.length} DESIGNS AVAILABLE
              </span>
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-neutral-900 bg-neutral-950/40 overflow-hidden flex flex-col justify-between group hover:border-neutral-800 hover:bg-neutral-950/80 transition-all h-full"
                  >
                    <div>
                      {/* Visual box */}
                      <div className="aspect-[16/10] overflow-hidden bg-neutral-900 relative">
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                        />
                        <span className="absolute left-3 top-3 bg-neutral-950/80 border border-neutral-800 text-[8px] font-mono font-bold px-2 py-0.5 rounded text-gold-500 tracking-wider">
                          {p.stock}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                          <span>{p.category}</span>
                          <span className="text-gold-500">★ {p.rating}</span>
                        </div>
                        <h4 className="font-serif text-sm font-bold text-white tracking-wide group-hover:text-gold-500 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {/* Pricing and cart trigger */}
                    <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-neutral-900/60 pt-4">
                      <span className="font-mono text-base font-bold text-white">
                        ${p.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold px-4 py-2 rounded text-[10px] tracking-widest uppercase transition-all flex items-center gap-1.5"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 fill-transparent" />
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-16 border border-neutral-900 bg-neutral-950/20 rounded-xl space-y-4">
                <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
                    Store Reset Complete
                  </h4>
                  <p className="text-xs text-neutral-500 font-sans max-w-sm leading-relaxed mx-auto">
                    All merchandise has been successfully cleared. The Co-op Exporium catalog is empty and waiting for new collections.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cart Panel & Checkout - 4 Cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-950/80 border border-neutral-900 rounded-xl p-5 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="font-serif text-sm tracking-widest text-white uppercase font-bold flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-gold-500" />
                  SHOPPING CART ({cart.reduce((acc, c) => acc + c.qty, 0)})
                </h3>
              </div>

              {/* Items List */}
              {cart.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded bg-neutral-950/30 border border-neutral-900"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-9 w-9 rounded object-cover border border-neutral-800"
                          />
                          <div className="min-w-0 text-left">
                            <h5 className="text-[11px] font-bold text-white truncate max-w-[130px]">
                              {item.product.name}
                            </h5>
                            <span className="text-[10px] font-mono text-neutral-500">
                              ${item.product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Qty adjustments */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-neutral-800 rounded bg-neutral-950">
                            <button
                              onClick={() => updateQty(item.product.id, 'sub')}
                              className="p-1 text-neutral-500 hover:text-white"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-mono text-[10px] text-white">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.product.id, 'add')}
                              className="p-1 text-neutral-500 hover:text-white"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item.product.id)}
                            className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Applied Form */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2 text-xs border-t border-neutral-900/60 pt-4">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-800 text-xs px-2.5 py-1.5 text-white rounded outline-none focus:border-gold-500/40"
                    />
                    <button
                      type="submit"
                      className="bg-neutral-900 text-[10px] text-neutral-300 border border-neutral-800 px-3 py-1.5 rounded hover:text-gold-500 transition-colors font-mono font-bold"
                    >
                      APPLY
                    </button>
                  </form>
                  {couponSuccess && (
                    <span className="text-[9px] font-mono text-emerald-500 block">20% COUPON 'BEEXCELLENT' APPLIED</span>
                  )}

                  {/* Pricing Totals */}
                  <div className="border-t border-neutral-900/60 pt-4 space-y-1.5 font-mono text-[10px] text-neutral-400">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span className="text-white">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>COOP DISCOUNT ({discountPercent}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>DELIVERY CHARGES</span>
                      <span className="text-white">
                        {delivery === 0 ? 'FREE OVER $150' : `$${delivery.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-neutral-900/50">
                      <span>CO-OP TOTAL</span>
                      <span className="text-gold-500">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Actions */}
                  {!isCheckingOut ? (
                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      <CreditCard className="h-4 w-4" />
                      PROCEED TO CHECKOUT
                    </button>
                  ) : (
                    <div className="border-t border-neutral-900 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-serif text-[11px] font-bold text-white uppercase tracking-wider">
                          SHIPPING INFORMATION
                        </h4>
                        <button
                          onClick={() => setIsCheckingOut(false)}
                          className="text-neutral-500 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {checkoutSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-lg flex items-center gap-2 text-[10px] text-emerald-400 font-serif italic"
                        >
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>"Bespoke transaction completed successfully. Be excellent!"</span>
                        </motion.div>
                      )}

                      <form onSubmit={handleCheckoutSubmit} className="space-y-2.5 text-xs">
                        <input
                          type="text"
                          required
                          placeholder="Your Name *"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/40"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Delivery Address *"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/40"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={customerCity}
                            onChange={(e) => setCustomerCity(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/40"
                          />
                          <input
                            type="text"
                            placeholder="Zip / Code"
                            value={customerZip}
                            onChange={(e) => setCustomerZip(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-gold-500/40"
                          />
                        </div>

                        <div className="p-2.5 bg-neutral-900/40 rounded border border-neutral-900/60 flex items-start gap-1.5 text-[9px] text-neutral-400 leading-relaxed font-mono">
                          <Info className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                          <span>Simulation Checkout. All shipping data resides locally.</span>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2 rounded tracking-widest uppercase transition-all text-xs"
                        >
                          CONFIRM & ORDER (${total.toFixed(2)})
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-900 rounded bg-neutral-950/25">
                  <p className="text-[11px] text-neutral-500 font-mono">YOUR SHOPPING CART IS VACANT</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
