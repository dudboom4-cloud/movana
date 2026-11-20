import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Heart,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Store,
  Trash2,
} from 'lucide-react';
import { LUDHIANA_NEIGHBORHOODS, type MenuItem, type Order, type Stall } from '../shared/types';
import { distanceKm, formatDistance } from '../lib/geo';
import { LeafletMap } from './LeafletMap';

interface CustomerViewProps {
  stalls: Stall[];
  orders: Order[];
  favorites: string[];
  selectedNeighborhoodId: string;
  userLat: number;
  userLng: number;
  locationLabel: string;
  locationAccuracyText: string;
  onSelectNeighborhood: (id: string) => void;
  onUseBrowserLocation: () => void;
  onToggleFavorite: (stallId: string) => void;
  onOpenStall: (stall: Stall) => void;
  onQuickAddItem: (stall: Stall, item: MenuItem) => void;
  onRefresh: () => void;
  onClearOrders: () => void;
}

const ORDER_STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function getOrderStepIndex(status: Order['status']): number {
  if (status === 'rider_assigned') return 3;
  if (status === 'picked_up') return 4;
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function CustomerView({
  stalls,
  orders,
  favorites,
  selectedNeighborhoodId,
  userLat,
  userLng,
  locationLabel,
  locationAccuracyText,
  onSelectNeighborhood,
  onUseBrowserLocation,
  onToggleFavorite,
  onOpenStall,
  onQuickAddItem,
  onRefresh,
  onClearOrders,
}: CustomerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainTab, setDomainTab] = useState<'all' | 'food' | 'vegetables'>('all');
  const [rating4Plus, setRating4Plus] = useState(false);
  const [within1Km, setWithin1Km] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'top_rated'>('nearest');
  const [selectedMapStallId, setSelectedMapStallId] = useState<string | null>(null);
  const stallsSectionRef = useRef<HTMLElement | null>(null);

  const liveStallsWithDistance = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return stalls
      .filter((s) => s.isLive)
      .map((s) => ({
        stall: s,
        dist: distanceKm(userLat, userLng, s.lat, s.lng),
      }))
      .filter(({ stall, dist }) => {
        if (domainTab !== 'all' && stall.domain !== domainTab) return false;
        if (rating4Plus && stall.rating < 4.0) return false;
        if (within1Km && dist > 1.0) return false;
        if (dist > 5.5) return false;
        if (query) {
          const matchesStall =
            stall.name.toLowerCase().includes(query) ||
            stall.category.toLowerCase().includes(query) ||
            stall.neighborhood.toLowerCase().includes(query);
          const matchesMenu = stall.menu.some((m) => m.name.toLowerCase().includes(query));
          if (!matchesStall && !matchesMenu) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'top_rated') return b.stall.rating - a.stall.rating;
        return a.dist - b.dist;
      });
  }, [stalls, userLat, userLng, domainTab, rating4Plus, within1Km, searchQuery, sortBy]);

  const liveCollectionDishes = useMemo(() => {
    const items: { stall: Stall; item: MenuItem; dist: number }[] = [];
    liveStallsWithDistance.forEach(({ stall, dist }) => {
      stall.menu
        .filter((m) => m.isAvailable)
        .slice(0, 2)
        .forEach((item) => {
          items.push({ stall, item, dist });
        });
    });
    return items.slice(0, 6);
  }, [liveStallsWithDistance]);

  const favoriteStalls = useMemo(
    () =>
      stalls
        .filter((s) => favorites.includes(s.id))
        .map((s) => ({ stall: s, dist: distanceKm(userLat, userLng, s.lat, s.lng) })),
    [stalls, favorites, userLat, userLng]
  );

  const activeOrder = useMemo(
    () => orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled') || null,
    [orders]
  );

  function jumpToStalls(domain: 'all' | 'food' | 'vegetables') {
    setDomainTab(domain);
    stallsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Hero Banner matching Screenshot 2 */}
      <section className="relative overflow-hidden bg-[#FF5200] text-white py-10 sm:py-12 px-4 sm:px-8">
        {/* Subtle stylized street-food corner accents matching Screenshot 2 */}
        <div
          aria-hidden="true"
          className="hidden lg:flex absolute -left-8 top-4 w-36 h-36 rounded-full bg-white/10 items-center justify-center text-6xl rotate-[-12deg] select-none"
        >
          🥗
        </div>
        <div
          aria-hidden="true"
          className="hidden lg:flex absolute -right-6 top-6 w-40 h-40 rounded-full bg-white/10 items-center justify-center text-6xl rotate-[14deg] select-none"
        >
          🥟
        </div>

        <div className="relative max-w-[820px] mx-auto text-center">
          <h1
            className="font-display font-extrabold tracking-tight text-white text-3xl sm:text-[42px] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Good food is already on its way.
          </h1>

          {/* Unified Location + Search Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch bg-white rounded-2xl shadow-lg p-1.5 gap-1.5 text-stone-900">
            <div className="relative flex items-center sm:w-[250px] shrink-0 border-b sm:border-b-0 sm:border-r border-stone-200 px-3 py-2">
              <MapPin className="w-4 h-4 text-[#FF5200] shrink-0 mr-2" />
              <select
                aria-label="Select neighborhood"
                value={selectedNeighborhoodId}
                onChange={(e) => onSelectNeighborhood(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer truncate pr-2"
              >
                {LUDHIANA_NEIGHBORHOODS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
                {selectedNeighborhoodId === 'gps' && <option value="gps">{locationLabel}</option>}
              </select>
            </div>

            <div className="flex-1 flex items-center px-3 py-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for stall, golgappa, kulcha, vegetables..."
                className="w-full bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => stallsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Search stalls"
                className="p-2 rounded-xl text-[#FF5200] hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two White Promo Cards matching Screenshot 2 */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[680px] mx-auto text-left">
            <button
              type="button"
              onClick={() => jumpToStalls('food')}
              className="group rounded-2xl bg-white p-5 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-4 cursor-pointer"
            >
              <div>
                <p className="font-display font-extrabold text-sm sm:text-base text-stone-900 tracking-tight">
                  FOOD DELIVERY
                </p>
                <p className="text-[11px] font-semibold text-stone-500 mt-0.5">FROM STREET THELAS &amp; STALLS</p>
                <p className="text-[11px] font-bold text-[#FF5200] mt-2">UPTO 60% OFF</p>
                <span className="mt-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FF5200] text-white group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-orange-50 shrink-0 border border-stone-100">
                <img
                  src="/src/assets/images/stall_chole_kulche_1795152482660.jpg"
                  alt="Street food delivery"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => jumpToStalls('vegetables')}
              className="group rounded-2xl bg-white p-5 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-4 cursor-pointer"
            >
              <div>
                <p className="font-display font-extrabold text-sm sm:text-base text-stone-900 tracking-tight">
                  FRESH PRODUCE
                </p>
                <p className="text-[11px] font-semibold text-stone-500 mt-0.5">VEGETABLE CARTS &amp; DINEOUT</p>
                <p className="text-[11px] font-bold text-[#FF5200] mt-2">UPTO 50% OFF</p>
                <span className="mt-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FF5200] text-white group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-stone-100">
                <img
                  src="/src/assets/images/stall_vegetable_cart_1795152482561.jpg"
                  alt="Fresh vegetable carts"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-[1160px] mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Category Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-xs">
            {(
              [
                { id: 'all', label: 'All stalls', emoji: '🎪' },
                { id: 'food', label: 'Food', emoji: '🍲' },
                { id: 'vegetables', label: 'Vegetables', emoji: '🥬' },
              ] as const
            ).map((tab) => {
              const active = domainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDomainTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'bg-[#FF5200] text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collections Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">Collections</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Explore what&apos;s selling live around your location right now.
              </p>
            </div>
            <span className="text-xs text-stone-500">
              {liveCollectionDishes.length} live specials near {locationLabel.split(',')[0]}
            </span>
          </div>

          {liveCollectionDishes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-center text-xs text-stone-500">
              Dishes will show up here as soon as stalls match your current filters.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveCollectionDishes.map(({ stall, item, dist }) => (
                <div
                  key={`${stall.id}-${item.id}`}
                  className="rounded-2xl bg-white border border-stone-200/80 p-3.5 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                >
                  <button
                    type="button"
                    onClick={() => onOpenStall(stall)}
                    className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                      {stall.photos[0] ? (
                        <img
                          src={stall.photos[0]}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">{stall.emoji}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-500 truncate">
                        {stall.name} · {formatDistance(dist)}
                      </p>
                      <p className="text-xs font-bold font-mono-nums text-[#FF5200] mt-0.5">₹{item.price}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAddItem(stall, item)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:border-[#FF5200] hover:bg-[#FFF5F0] hover:text-[#FF5200] text-xs font-bold text-stone-800 shrink-0 transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Filter Bar matching Screenshot 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRating4Plus((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                rating4Plus
                  ? 'border-[#FF5200] bg-[#FFF5F0] text-[#FF5200]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Rating 4.0+</span>
            </button>

            <button
              type="button"
              onClick={() => setWithin1Km((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                within1Km
                  ? 'border-[#FF5200] bg-[#FFF5F0] text-[#FF5200]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#FF5200]" />
              <span>Within 1 km</span>
            </button>

            <div className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 text-xs">
              <span className="px-2 text-stone-500 font-medium">Sort:</span>
              <button
                type="button"
                onClick={() => setSortBy('nearest')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  sortBy === 'nearest' ? 'bg-[#FF5200] text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                Nearest
              </button>
              <button
                type="button"
                onClick={() => setSortBy('top_rated')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  sortBy === 'top_rated' ? 'bg-[#FF5200] text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                Top rated
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onUseBrowserLocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#FF5200]" />
            <span>Use my location</span>
          </button>
        </div>

        {/* Stalls near you + Live Map 2-column split */}
        <section ref={stallsSectionRef}>
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-stone-900">Stalls near you</h2>
            <p className="text-xs text-stone-500 mt-1">
              {liveStallsWithDistance.length}{' '}
              {liveStallsWithDistance.length === 1 ? 'stall' : 'stalls'} live near you · Live location:{' '}
              {locationLabel} ({locationAccuracyText}) · showing stalls within {within1Km ? '1 km' : '5 km'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Stall List */}
            <div className="lg:col-span-6 space-y-4">
              {liveStallsWithDistance.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center space-y-2">
                  <MapPin className="w-7 h-7 text-[#FF5200] mx-auto" />
                  <p className="font-display font-bold text-stone-900">No stalls match these filters</p>
                  <p className="text-xs text-stone-500">
                    Try clearing the 1 km limit, switching neighborhood, or opening the Stall owner app to go live.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDomainTab('all');
                      setRating4Plus(false);
                      setWithin1Km(false);
                    }}
                    className="mt-2 px-4 py-2 rounded-lg bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                liveStallsWithDistance.map(({ stall, dist }) => {
                  const isFav = favorites.includes(stall.id);
                  const minPrice = stall.menu.length ? Math.min(...stall.menu.map((m) => m.price)) : 0;
                  return (
                    <article
                      key={stall.id}
                      onMouseEnter={() => setSelectedMapStallId(stall.id)}
                      onMouseLeave={() => setSelectedMapStallId(null)}
                      className="rounded-2xl bg-white border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12">
                        <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto sm:h-full bg-stone-100">
                          {stall.photos[0] ? (
                            <img
                              src={stall.photos[0]}
                              alt={stall.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {stall.emoji}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(stall.id)}
                            aria-label={isFav ? `Remove ${stall.name} from favorites` : `Save ${stall.name}`}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-[#FF5200] text-[#FF5200]' : 'text-stone-600'}`} />
                          </button>
                        </div>

                        <div className="sm:col-span-7 p-4 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                              <span className="truncate">
                                {stall.category} · {stall.foodType}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-stone-800 shrink-0 font-mono-nums">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {stall.rating.toFixed(1)}
                              </span>
                            </div>

                            <h3 className="font-display text-base font-bold text-stone-900 mt-1">
                              {stall.emoji} {stall.name}
                            </h3>
                            <p className="text-xs text-stone-500 mt-1 line-clamp-2">{stall.description}</p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                              <span className="font-mono-nums font-medium text-stone-700">{formatDistance(dist)}</span>
                              <span aria-hidden="true">·</span>
                              <span>~{stall.prepTimeMins} mins</span>
                              {stall.isMoving && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 font-medium">Moving cart</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-3">
                            <span className="text-xs text-stone-600 font-mono-nums">
                              {minPrice > 0 ? `From ₹${minPrice}` : 'Menu open'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenStall(stall)}
                              className="px-4 py-2 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              View menu &amp; order
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Right: Live Leaflet Map */}
            <div className="lg:col-span-6 lg:sticky lg:top-28">
              <LeafletMap
                centerLat={userLat}
                centerLng={userLng}
                stalls={liveStallsWithDistance.map((x) => x.stall)}
                activeOrder={activeOrder}
                radiusKm={within1Km ? 1 : 5}
                selectedStallId={selectedMapStallId}
                onSelectStall={onOpenStall}
                heightClass="h-[460px] lg:h-[540px]"
              />
            </div>
          </div>
        </section>

        {/* Saved for later / Favorites matching Screenshot 5 */}
        <section className="pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Saved for later</p>
              <h2 className="font-display text-xl font-bold text-stone-900">Favorites</h2>
              <p className="text-xs text-stone-500">Keep your favourite live stalls one tap away.</p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {favoriteStalls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center space-y-2.5">
              <Heart className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="font-display font-bold text-sm text-stone-900">No favorites yet</p>
              <p className="text-xs text-stone-500">Tap the heart on any stall card to save it here.</p>
              <button
                type="button"
                onClick={() => stallsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-1 px-4 py-2 rounded-lg bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
              >
                Explore live stalls
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteStalls.map(({ stall, dist }) => (
                <div
                  key={stall.id}
                  className="rounded-2xl bg-white border border-stone-200 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-stone-900 truncate">
                      {stall.emoji} {stall.name}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {stall.category} · {formatDistance(dist)} · {stall.isLive ? 'Live now' : 'Offline'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(stall.id)}
                      aria-label="Remove favorite"
                      className="p-2 rounded-lg text-[#FF5200] hover:bg-orange-50 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-[#FF5200]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStall(stall)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
                    >
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Your activity / My orders matching Screenshot 5 */}
        <section className="pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Your activity</p>
              <h2 className="font-display text-xl font-bold text-stone-900">My orders</h2>
              <p className="text-xs text-stone-500">
                Everything you&apos;ve ordered, with delivery details and live status in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={onClearOrders}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-red-50 hover:text-red-600 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center space-y-2.5">
              <Store className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="font-display font-bold text-sm text-stone-900">No visible orders</p>
              <p className="text-xs text-stone-500">Orders you place will show live progress from stall to doorstep.</p>
              <button
                type="button"
                onClick={() => stallsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-1 px-4 py-2 rounded-lg bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
              >
                Explore live stalls →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const stepIdx = getOrderStepIndex(order.status);
                return (
                  <div key={order.id} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span className="font-mono-nums font-semibold text-stone-800">{order.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{order.paymentMethod}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-nums">{order.paymentRef}</span>
                        </div>
                        <h3 className="font-display text-base font-bold text-stone-900 mt-1">
                          {order.stallEmoji} {order.stallName}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">Deliver to: {order.deliveryAddress}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-display text-base font-bold font-mono-nums text-stone-900">
                          ₹{order.total}
                        </span>
                        <p className="text-xs font-semibold text-[#FF5200] capitalize mt-0.5">
                          {order.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Step Progress */}
                    {order.status !== 'cancelled' && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                        {ORDER_STEPS.map((step, idx) => {
                          const done = idx <= stepIdx;
                          return (
                            <div key={step.key} className="space-y-1.5">
                              <div className={`h-1.5 rounded-full ${done ? 'bg-[#FF5200]' : 'bg-stone-200'}`} />
                              <p
                                className={`text-[11px] font-medium flex items-center gap-1 ${
                                  done ? 'text-stone-900' : 'text-stone-400'
                                }`}
                              >
                                {done && <CheckCircle2 className="w-3 h-3 text-[#FF5200] shrink-0" />}
                                <span className="truncate">{step.label}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
                      <span>
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')} (Subtotal ₹{order.subtotal} +
                        5% fee ₹{order.platformFee} + delivery ₹{order.deliveryFee})
                      </span>
                      {order.deliveryPartnerName && (
                        <span className="font-medium text-emerald-700">
                          Rider: {order.deliveryPartnerName} ({order.deliveryPartnerPhone})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works matching Screenshot 5 */}
        <section className="pt-4 border-t border-stone-200/80 pb-4">
          <h2 className="font-display text-xl font-bold text-stone-900 mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200/80 p-5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center mb-3">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-stone-900">1 · Spot</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                See every thela and vegetable cart move live on the map, updated every few seconds.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200/80 p-5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-stone-900">2 · Pre-order &amp; prepay</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Pick your items and pay upfront: item cost plus a flat 5% platform fee, via UPI, card or netbanking.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200/80 p-5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center mb-3">
                <Navigation className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-stone-900">3 · Get delivered</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Follow your rider from stall acceptance to doorstep delivery.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
