import { Heart, MapPin, Minus, Phone, Plus, ShieldCheck, Star, X } from 'lucide-react';
import type { MenuItem, Stall } from '../shared/types';
import { formatDistance } from '../lib/geo';

interface StallMenuModalProps {
  stall: Stall | null;
  distanceKmValue?: number;
  isFavorite: boolean;
  onToggleFavorite: (stallId: string) => void;
  cartItems: Record<string, number>;
  cartStallId: string | null;
  onUpdateItemQty: (stall: Stall, item: MenuItem, delta: number) => void;
  onOpenCart: () => void;
  onClose: () => void;
}

export function StallMenuModal({
  stall,
  distanceKmValue,
  isFavorite,
  onToggleFavorite,
  cartItems,
  cartStallId,
  onUpdateItemQty,
  onOpenCart,
  onClose,
}: StallMenuModalProps) {
  if (!stall) return null;

  const isSameStallInCart = !cartStallId || cartStallId === stall.id;
  const totalInCartForThisStall =
    cartStallId === stall.id ? Object.values(cartItems).reduce((a, b) => a + b, 0) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200">
        {/* Header Photo */}
        <div className="relative h-52 sm:h-60 bg-stone-200 shrink-0">
          {stall.photos[0] ? (
            <img
              src={stall.photos[0]}
              alt={stall.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-orange-100 to-amber-50">
              {stall.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(stall.id)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className="w-9 h-9 rounded-full bg-white/95 text-stone-800 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#FF5200] text-[#FF5200]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close stall menu"
              className="w-9 h-9 rounded-full bg-white/95 text-stone-800 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <span>{stall.category}</span>
              <span aria-hidden="true">·</span>
              <span>{stall.foodType}</span>
              {typeof distanceKmValue === 'number' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{formatDistance(distanceKmValue)} away</span>
                </>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight mt-0.5">
              {stall.emoji} {stall.name}
            </h2>
          </div>
        </div>

        {/* Details & Menu */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 text-xs text-stone-600">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-stone-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FF5200] shrink-0" />
                <span>{stall.address}</span>
              </p>
              <p className="flex items-center gap-3 text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <strong className="text-stone-800 font-mono-nums">{stall.rating.toFixed(1)}</strong> ({stall.ratingCount})
                </span>
                {stall.publicPhone && (
                  <span className="inline-flex items-center gap-1 font-mono-nums">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {stall.publicPhone}
                  </span>
                )}
              </p>
            </div>

            {stall.fssaiVerified && (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  FSSAI Verified
                </span>
                <p className="font-mono-nums text-[11px] text-stone-400 mt-0.5">Lic: {stall.fssaiNumber}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-stone-600 leading-relaxed">{stall.description}</p>
            {stall.allergens && stall.allergens !== 'None' && (
              <p className="text-xs text-stone-500 mt-1.5">
                <strong className="text-stone-700">Allergens:</strong> {stall.allergens}
              </p>
            )}
          </div>

          {!isSameStallInCart && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
              Your cart currently holds items from another stall. Adding an item here will replace your current cart.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-bold text-stone-900">Menu ({stall.menu.length} items)</h3>
              <span className="text-xs text-stone-500">Prep time ~{stall.prepTimeMins} mins</span>
            </div>

            {stall.menu.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center border border-dashed border-stone-200 rounded-xl">
                This stall hasn&apos;t added menu items yet.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {stall.menu.map((item) => {
                  const qty = cartStallId === stall.id ? cartItems[item.id] || 0 : 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3.5 sm:px-4 bg-white hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-stone-900 truncate">{item.name}</p>
                          {item.isPopular && (
                            <span className="text-[11px] font-semibold text-[#FF5200]">Bestseller</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5 font-mono-nums">
                          ₹{item.price}
                          {item.unit ? ` · ${item.unit}` : ''}
                        </p>
                      </div>

                      {qty > 0 ? (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-[#FF5200] bg-[#FFF5F0] px-1.5 py-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateItemQty(stall, item, -1)}
                            aria-label={`Decrease ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#FF5200] hover:bg-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold font-mono-nums text-[#FF5200]">{qty}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateItemQty(stall, item, 1)}
                            aria-label={`Increase ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#FF5200] hover:bg-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateItemQty(stall, item, 1)}
                          className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:border-[#FF5200] hover:text-[#FF5200] text-xs font-bold text-stone-800 bg-white transition-colors shrink-0 cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        {totalInCartForThisStall > 0 && (
          <div className="p-4 bg-[#FAF6F0] border-t border-stone-200 flex items-center justify-between gap-4 shrink-0">
            <span className="text-sm font-semibold text-stone-800">
              <span className="font-mono-nums">{totalInCartForThisStall}</span>{' '}
              {totalInCartForThisStall === 1 ? 'item' : 'items'} in cart
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
