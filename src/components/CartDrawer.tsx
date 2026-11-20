import { useState } from 'react';
import { CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import type { MenuItem, OrderItem, PaymentMethod, Stall } from '../shared/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stall: Stall | null;
  cartItems: Record<string, number>;
  onUpdateItemQty: (stall: Stall, item: MenuItem, delta: number) => void;
  onClearCart: () => void;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  onPlaceOrder: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    items: OrderItem[];
  }) => Promise<void>;
}

export function CartDrawer({
  isOpen,
  onClose,
  stall,
  cartItems,
  onUpdateItemQty,
  onClearCart,
  customerName,
  customerPhone,
  deliveryAddress,
  onPlaceOrder,
}: CartDrawerProps) {
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [address, setAddress] = useState(deliveryAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const lineItems: { menuItem: MenuItem; quantity: number }[] = stall
    ? stall.menu
        .filter((m) => (cartItems[m.id] || 0) > 0)
        .map((m) => ({ menuItem: m, quantity: cartItems[m.id] }))
    : [];

  const subtotal = lineItems.reduce((sum, li) => sum + li.menuItem.price * li.quantity, 0);
  const platformFee = Math.round(subtotal * 0.05);
  const deliveryFee = lineItems.length > 0 ? 15 : 0;
  const total = subtotal + platformFee + deliveryFee;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!stall || lineItems.length === 0) return;
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onPlaceOrder({
        customerName: name.trim() || 'Customer',
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        paymentMethod,
        items: lineItems.map((li) => ({
          menuItemId: li.menuItem.id,
          name: li.menuItem.name,
          price: li.menuItem.price,
          quantity: li.quantity,
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF5200]" />
            <h2 className="font-display text-lg font-bold text-stone-900">Your Cart</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!stall || lineItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-stone-900">Your cart is empty</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Tap any live street-food thela or fresh vegetable cart to add items.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <p className="text-xs text-stone-500">Ordering from</p>
                  <p className="font-display font-bold text-stone-900">
                    {stall.emoji} {stall.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map(({ menuItem, quantity }) => (
                  <div key={menuItem.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{menuItem.name}</p>
                      <p className="text-xs text-stone-500 font-mono-nums">₹{menuItem.price} each</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => onUpdateItemQty(stall, menuItem, -1)}
                          aria-label={`Remove one ${menuItem.name}`}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-[#FF5200] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-mono-nums">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateItemQty(stall, menuItem, 1)}
                          aria-label={`Add one ${menuItem.name}`}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-[#FF5200] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="w-14 text-right text-sm font-semibold font-mono-nums text-stone-900">
                        ₹{menuItem.price * quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details & Payment */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="font-display text-sm font-bold text-stone-900">Delivery &amp; Prepay Details</h3>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
                  />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="House / flat no., street, landmark"
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-2">
                    Payment method (Demo simulated)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'Card', 'Netbanking'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          paymentMethod === method
                            ? 'border-[#FF5200] bg-[#FFF5F0] text-[#FF5200]'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAF6F0] p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Item subtotal</span>
                    <span className="font-mono-nums font-medium text-stone-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Flat 5% platform fee</span>
                    <span className="font-mono-nums font-medium text-stone-900">₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Local thela delivery</span>
                    <span className="font-mono-nums font-medium text-stone-900">₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                    <span>Total to pay</span>
                    <span className="font-mono-nums">₹{total}</span>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              </form>
            </>
          )}
        </div>

        {stall && lineItems.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-white">
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full py-3 px-5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{submitting ? 'Confirming order...' : `Prepay ₹${total} via ${paymentMethod}`}</span>
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Simulated upfront payment · Real-time order dispatch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
