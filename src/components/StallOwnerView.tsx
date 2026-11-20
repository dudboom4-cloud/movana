import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ExternalLink,
  Navigation,
  PlayCircle,
  Plus,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import {
  LUDHIANA_NEIGHBORHOODS,
  type FoodType,
  type MenuItem,
  type Order,
  type OrderStatus,
  type Stall,
  type StallCategory,
} from '../shared/types';
import { api } from '../lib/api';
import { formatAadhaarInput, resizeImageFile } from '../lib/geo';

interface StallOwnerViewProps {
  stalls: Stall[];
  orders: Order[];
  onBackToCustomer: () => void;
  onStallSaved: (stall: Stall) => void;
  onOrderUpdated: (order: Order) => void;
}

const CATEGORIES: StallCategory[] = [
  'Street food',
  'Chaat & Snacks',
  'Chai & Beverages',
  'Fresh Vegetables',
  'Fruits & Juices',
  'Tiffin & Meals',
];

const FOOD_TYPES: FoodType[] = ['Veg and non-veg', 'Pure Veg', 'Jain friendly', 'Fresh Produce'];

export function StallOwnerView({
  stalls,
  orders,
  onBackToCustomer,
  onStallSaved,
  onOrderUpdated,
}: StallOwnerViewProps) {
  const [selectedStallId, setSelectedStallId] = useState<string>(stalls[0]?.id || 'new');
  const activeStall = stalls.find((s) => s.id === selectedStallId) || null;

  // FSSAI state
  const [fssaiInput, setFssaiInput] = useState('');
  const [fssaiStatus, setFssaiStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [showWalkthroughModal, setShowWalkthroughModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackRefInput, setTrackRefInput] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);

  // Stall form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StallCategory>('Street food');
  const [emoji, setEmoji] = useState('🥟');
  const [foodType, setFoodType] = useState<FoodType>('Veg and non-veg');
  const [allergens, setAllergens] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState(LUDHIANA_NEIGHBORHOODS[0].label);
  const [publicPhone, setPublicPhone] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Owner & Aadhaar verification
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState<{ valid: boolean; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeStall) {
      setFssaiInput(activeStall.fssaiNumber || '');
      setFssaiStatus(
        activeStall.fssaiVerified
          ? { valid: true, message: 'Verified 14-digit FSSAI registration saved.' }
          : null
      );
      setName(activeStall.name);
      setCategory(activeStall.category);
      setEmoji(activeStall.emoji);
      setFoodType(activeStall.foodType);
      setAllergens(activeStall.allergens);
      setDescription(activeStall.description);
      setAddress(activeStall.address);
      setNeighborhood(activeStall.neighborhood);
      setPublicPhone(activeStall.publicPhone);
      setPhotos(activeStall.photos);
      setMenu(activeStall.menu);
      setOwnerName(activeStall.ownerName);
      setOwnerPhone(activeStall.ownerPhone);
      setAadhaarInput(activeStall.aadhaarLast4 ? `•••• •••• ${activeStall.aadhaarLast4}` : '');
      setAadhaarStatus(
        activeStall.aadhaarVerified
          ? { valid: true, message: `Aadhaar ending in ${activeStall.aadhaarLast4} verified.` }
          : null
      );
    } else {
      setFssaiInput('');
      setFssaiStatus(null);
      setName('');
      setCategory('Street food');
      setEmoji('🥟');
      setFoodType('Veg and non-veg');
      setAllergens('');
      setDescription('');
      setAddress('');
      setNeighborhood(LUDHIANA_NEIGHBORHOODS[0].label);
      setPublicPhone('');
      setPhotos([]);
      setMenu([]);
      setOwnerName('');
      setOwnerPhone('');
      setAadhaarInput('');
      setAadhaarStatus(null);
    }
    setFeedback(null);
  }, [selectedStallId]);

  const stallOrders = activeStall ? orders.filter((o) => o.stallId === activeStall.id) : [];

  async function handleCheckFssai() {
    setFeedback(null);
    try {
      const res = await api.checkFssai(fssaiInput);
      setFssaiStatus({ valid: res.valid, message: res.message });
    } catch (err) {
      setFssaiStatus({ valid: false, message: err instanceof Error ? err.message : 'Check failed' });
    }
  }

  async function handleCheckAadhaar() {
    if (aadhaarInput.includes('•') && activeStall?.aadhaarVerified) {
      setAadhaarStatus({ valid: true, message: `Aadhaar ending in ${activeStall.aadhaarLast4} already verified.` });
      return;
    }
    try {
      const res = await api.checkAadhaar(aadhaarInput);
      setAadhaarStatus({ valid: res.valid, message: res.message });
    } catch (err) {
      setAadhaarStatus({ valid: false, message: err instanceof Error ? err.message : 'Check failed' });
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    if (files.length === 0) return;
    try {
      const resized = await Promise.all(files.map((f) => resizeImageFile(f, 720)));
      setPhotos((prev) => [...prev, ...resized].slice(0, 3));
    } catch {
      setFeedback({ type: 'error', text: 'Could not process one of the selected photos.' });
    }
  }

  function handleAddMenuItem() {
    const trimmed = newItemName.trim();
    const priceNum = Number(newItemPrice);
    if (!trimmed || Number.isNaN(priceNum) || priceNum <= 0) return;
    setMenu((prev) => [
      ...prev,
      {
        id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        name: trimmed,
        price: Math.round(priceNum),
        isAvailable: true,
      },
    ]);
    setNewItemName('');
    setNewItemPrice('');
  }

  async function handleSaveStall(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    const areaPreset = LUDHIANA_NEIGHBORHOODS.find((n) => n.label === neighborhood) || LUDHIANA_NEIGHBORHOODS[0];
    try {
      const saved = await api.saveStall({
        id: activeStall?.id,
        name,
        category,
        domain: category === 'Fresh Vegetables' || foodType === 'Fresh Produce' ? 'vegetables' : 'food',
        emoji,
        foodType,
        allergens,
        description,
        address,
        neighborhood,
        publicPhone,
        photos,
        menu,
        ownerName,
        ownerPhone,
        fssaiNumber: fssaiInput,
        aadhaarNumber: aadhaarInput.includes('•') ? undefined : aadhaarInput,
        lat: activeStall?.lat ?? areaPreset.lat + (Math.random() - 0.5) * 0.004,
        lng: activeStall?.lng ?? areaPreset.lng + (Math.random() - 0.5) * 0.004,
      });
      onStallSaved(saved);
      setSelectedStallId(saved.id);
      setFeedback({
        type: 'success',
        text:
          saved.verificationStatus === 'verified'
            ? 'Stall saved and updated on the live customer map.'
            : saved.verificationStatus === 'pending_review'
              ? 'Stall saved and submitted for Company Admin verification.'
              : 'Stall saved. Complete 14-digit FSSAI and 12-digit Aadhaar checks to submit for verification.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save stall.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleLive() {
    if (!activeStall) return;
    try {
      const updated = await api.toggleStallLive(activeStall.id);
      onStallSaved(updated);
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Unable to toggle live state.' });
    }
  }

  async function handleMoveStallNow() {
    if (!activeStall) return;
    try {
      const updated = await api.moveStall(activeStall.id);
      onStallSaved(updated);
      setFeedback({ type: 'success', text: 'Updated your live cart GPS coordinates on the customer map.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Move failed' });
    }
  }

  async function handleAdvanceOrder(orderId: string, status: OrderStatus) {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      onOrderUpdated(updated);
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Unable to update order.' });
    }
  }

  const verificationLabel =
    activeStall?.verificationStatus === 'verified'
      ? 'Verified'
      : activeStall?.verificationStatus === 'pending_review'
        ? 'Pending Admin Review'
        : 'Not verified';

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-6 px-4 sm:px-8">
      <div className="max-w-[1160px] mx-auto space-y-6">
        {/* Top Coral Banner matching Screenshots 3 & 4 */}
        <div className="rounded-2xl bg-[#E85D3F] text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Stall owner app</h1>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                Set up your stall, get verified, then start receiving orders.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToCustomer}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer site</span>
          </button>
        </div>

        {/* Stall Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label htmlFor="stall-select" className="text-xs font-semibold text-stone-600">
              Manage stall:
            </label>
            <select
              id="stall-select"
              value={selectedStallId}
              onChange={(e) => setSelectedStallId(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:border-[#FF5200]"
            >
              <option value="new">+ Register a new thela / stall</option>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name} ({s.verificationStatus === 'verified' ? 'Verified' : s.verificationStatus})
                </option>
              ))}
            </select>
          </div>

          {activeStall && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLive}
                disabled={activeStall.verificationStatus !== 'verified'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  activeStall.isLive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{activeStall.isLive ? 'Live on Customer Map' : 'Go Live'}</span>
              </button>
              {activeStall.isLive && (
                <button
                  type="button"
                  onClick={handleMoveStallNow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#FF5200]" />
                  <span>Move Cart GPS</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main 2-column grid matching Screenshots 3 & 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: FSSAI + Stall Form + Verification */}
          <form onSubmit={handleSaveStall} className="lg:col-span-7 space-y-5">
            {/* Warm Amber FSSAI Box matching Screenshot 3 */}
            <div className="rounded-2xl bg-[#FEF9E7] border border-[#F5E6B3] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-stone-600">Before you register</p>
                  <h2 className="font-display text-base font-bold text-stone-900">Get your food licence first</h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    A valid FSSAI food licence or registration is required before a stall can be listed on Móvana.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                    activeStall?.fssaiVerified || fssaiStatus?.valid ? 'text-emerald-700' : 'text-amber-800'
                  }`}
                >
                  {activeStall?.fssaiVerified || fssaiStatus?.valid ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>{activeStall?.fssaiVerified ? 'Verified' : fssaiStatus?.valid ? 'Code valid' : verificationLabel}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5 text-xs text-stone-700">
                  <p className="font-bold text-stone-900">Apply in 3 simple steps</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    <li>Open the official FoSCoS portal and choose New License / Registration.</li>
                    <li>Complete the form, upload documents, and pay the official fee.</li>
                    <li>Return here and enter the 14-digit FSSAI licence / registration number.</li>
                  </ol>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href="https://foscos.fssai.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E85D3F] hover:bg-[#D44E32] text-white font-semibold text-xs transition-colors"
                    >
                      <span>Open official FoSCoS portal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowTrackModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs cursor-pointer"
                    >
                      Track application
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-500 leading-snug">
                    Use only the official FSSAI portal. Móvana never asks for your Aadhaar, PAN, or portal password.
                  </p>
                </div>

                {/* Hindi walkthrough preview card */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-stone-700">Hindi walkthrough</p>
                  <button
                    type="button"
                    onClick={() => setShowWalkthroughModal(true)}
                    className="w-full text-left rounded-xl overflow-hidden border border-stone-300 bg-stone-900 text-white p-4 relative group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-xs font-bold text-amber-300">FSSAI Licence Guide</p>
                        <p className="text-xs font-semibold mt-0.5">FoSCoS 14-digit registration steps</p>
                        <p className="text-[11px] text-stone-300 mt-2">Click to view Hindi &amp; English guide</p>
                      </div>
                      <PlayCircle className="w-9 h-9 text-[#FF5200] group-hover:scale-105 transition-transform shrink-0" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0DFAA] space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  Enter your FSSAI licence / registration number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    value={fssaiInput}
                    onChange={(e) => setFssaiInput(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder="14-digit number (e.g. 22125678901234)"
                    className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-mono-nums focus:outline-none focus:border-[#FF5200]"
                  />
                  <button
                    type="button"
                    onClick={handleCheckFssai}
                    className="px-4 py-2 rounded-xl bg-[#E85D3F] hover:bg-[#D44E32] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Check licence code
                  </button>
                </div>
                {fssaiStatus && (
                  <p className={`text-xs font-medium ${fssaiStatus.valid ? 'text-emerald-700' : 'text-red-600'}`}>
                    {fssaiStatus.message}
                  </p>
                )}
              </div>
            </div>

            {/* 1 · Your stall section matching Screenshot 3 */}
            <div className="rounded-2xl bg-white border border-stone-200 p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-stone-900">1 · Your stall</h2>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your stall's name"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StallCategory)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#FF5200]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    maxLength={4}
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="Emoji for map pin (e.g. 🥟)"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Food type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as FoodType)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#FF5200]"
                  >
                    {FOOD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="Allergens present (e.g. nuts, milk, gluten, soy, egg)"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
                />

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
                />

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Restaurant / stall address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop number, street, area, city"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400">
                      This pickup address is shared with the delivery partner for every order.
                    </span>
                    <select
                      aria-label="Neighborhood area"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs bg-white text-stone-700"
                    >
                      {LUDHIANA_NEIGHBORHOODS.map((n) => (
                        <option key={n.id} value={n.label}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Public phone for customer calls
                  </label>
                  <input
                    type="tel"
                    value={publicPhone}
                    onChange={(e) => setPublicPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
                  />
                </div>

                {/* Stall photos */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-stone-800">Stall photos</label>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Show customers what your stall looks like. Add up to 3 clear photos.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="mt-2 block w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-stone-200 file:text-xs file:font-semibold file:bg-stone-50 hover:file:bg-stone-100"
                  />
                  {photos.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2.5">
                      {photos.map((src, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200">
                          <img src={src} alt={`Stall ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos((p) => p.filter((_, i) => i !== idx))}
                            aria-label="Remove photo"
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Menu builder */}
                <div className="pt-2 border-t border-stone-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">Menu / items you sell</label>
                    <span className="text-xs text-stone-500 font-mono-nums">{menu.length} items</span>
                  </div>

                  {menu.length > 0 && (
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {menu.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-2 text-xs bg-stone-50/50">
                          <span className="font-medium text-stone-900">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono-nums font-bold text-stone-800">₹{item.price}</span>
                            <button
                              type="button"
                              onClick={() => setMenu((prev) => prev.filter((m) => m.id !== item.id))}
                              aria-label={`Remove ${item.name}`}
                              className="text-stone-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item (e.g. Samosa, 2 pcs)"
                      className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-[#FF5200]"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">₹</span>
                      <input
                        type="number"
                        min={1}
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="40"
                        className="w-full rounded-xl border border-stone-200 pl-6 pr-2.5 py-2 text-xs font-mono-nums focus:outline-none focus:border-[#FF5200]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="w-full py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-800 inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add item</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2 · Verification matching Screenshot 4 */}
            <div className="rounded-2xl bg-white border border-stone-200 p-5 sm:p-6 space-y-3">
              <div>
                <h2 className="font-display text-base font-bold text-stone-900">2 · Verification</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Your stall must be verified by the company before it can go live.
                </p>
              </div>

              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner's full name"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
              />

              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Aadhaar verification</label>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {aadhaarStatus?.valid ? 'Valid' : 'Required'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(formatAadhaarInput(e.target.value))}
                    placeholder="0000 0000 0000"
                    className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
                  />
                  <button
                    type="button"
                    onClick={handleCheckAadhaar}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-800 cursor-pointer whitespace-nowrap"
                  >
                    Verify format
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  Demo valid Aadhaar for testing:{' '}
                  <button
                    type="button"
                    onClick={() => setAadhaarInput('2345 6789 0128')}
                    className="text-[#FF5200] font-mono-nums underline cursor-pointer"
                  >
                    2345 6789 0128
                  </button>
                </p>
                {aadhaarStatus && (
                  <p className={`text-xs font-medium ${aadhaarStatus.valid ? 'text-emerald-700' : 'text-red-600'}`}>
                    {aadhaarStatus.message}
                  </p>
                )}
              </div>

              {feedback && (
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#E85D3F] hover:bg-[#D44E32] disabled:opacity-60 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                {saving ? 'Saving stall...' : 'Save stall'}
              </button>
              <p className="text-[11px] text-stone-500">
                Your cover photo and menu will appear on the customer map once verified.
              </p>
            </div>
          </form>

          {/* Right Column: Live Orders Panel matching Screenshots 3 & 4 */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
            <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#E85D3F]" />
                  <h2 className="font-display text-base font-bold text-stone-900">Orders</h2>
                </div>
                <span className="text-xs font-mono-nums text-stone-500">{stallOrders.length} total</span>
              </div>

              {!activeStall || activeStall.verificationStatus !== 'verified' ? (
                <div className="rounded-xl bg-[#FAF6F0] p-4 text-xs text-stone-600 space-y-2">
                  <p>Orders open once your stall is verified and set up.</p>
                  <p className="text-stone-500">
                    After saving with valid FSSAI &amp; Aadhaar numbers, sign in to <strong>Company admin</strong> to
                    approve your stall immediately.
                  </p>
                </div>
              ) : stallOrders.length === 0 ? (
                <div className="rounded-xl bg-[#FAF6F0] p-6 text-center text-xs text-stone-500">
                  No incoming orders for <strong>{activeStall.name}</strong> yet. Orders placed by customers appear
                  here immediately.
                </div>
              ) : (
                <div className="space-y-3">
                  {stallOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-stone-200 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-nums text-xs font-bold text-stone-900">{order.id}</span>
                        <span className="text-xs font-semibold text-[#FF5200] capitalize">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-medium">
                        {order.customerName} · {order.customerPhone}
                      </p>
                      <p className="text-xs text-stone-500">{order.deliveryAddress}</p>
                      <ul className="text-xs text-stone-800 space-y-0.5 bg-stone-50 rounded-lg p-2.5">
                        {order.items.map((it) => (
                          <li key={it.menuItemId} className="flex justify-between font-mono-nums">
                            <span>
                              {it.quantity}× {it.name}
                            </span>
                            <span>₹{it.price * it.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold font-mono-nums text-stone-900">
                          Payout: ₹{order.subtotal}
                        </span>
                        <div className="flex items-center gap-2">
                          {order.status === 'placed' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceOrder(order.id, 'accepted')}
                              className="px-3 py-1.5 rounded-lg bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
                            >
                              Accept order
                            </button>
                          )}
                          {order.status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceOrder(order.id, 'preparing')}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Start preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceOrder(order.id, 'ready_for_pickup')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Ready for pickup
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hindi & English FoSCoS Walkthrough Modal */}
      {showWalkthroughModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-stone-900">FoSCoS FSSAI Registration Walkthrough</h3>
              <button
                type="button"
                onClick={() => setShowWalkthroughModal(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
              <p>
                <strong>Step 1 (पंजीकरण चुनें):</strong> Go to foscos.fssai.gov.in and select &quot;Apply for New
                License / Registration&quot; → Choose Punjab → Food Vending / Petty Retailer.
              </p>
              <p>
                <strong>Step 2 (दस्तावेज़ और शुल्क):</strong> Enter stall address, mobile OTP, upload photo &amp; ID,
                and pay the ₹100 annual petty vendor registration fee.
              </p>
              <p>
                <strong>Step 3 (14-अंक कोड):</strong> Enter your 14-digit FSSAI code (starts with 2 for basic
                registration, e.g. <span className="font-mono-nums font-semibold">22125678901234</span>) on Móvana.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href="https://foscos.fssai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#FF5200] text-white text-xs font-semibold"
              >
                <span>Open FoSCoS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowWalkthroughModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track FSSAI Application Modal */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-stone-900">Track FSSAI Application</h3>
              <button
                type="button"
                onClick={() => setShowTrackModal(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Enter your FoSCoS 17-digit reference number to check status or open the official tracker.
            </p>
            <input
              type="text"
              value={trackRefInput}
              onChange={(e) => setTrackRefInput(e.target.value)}
              placeholder="FoSCoS reference number"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
            />
            {trackResult && <p className="text-xs text-stone-700 bg-[#FAF6F0] p-3 rounded-xl">{trackResult}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setTrackResult(
                    trackRefInput.trim().length >= 8
                      ? `Reference ${trackRefInput.trim()} queued with District Food Safety Office, Ludhiana. Once issued, paste the 14-digit licence code above.`
                      : 'Please enter a valid FoSCoS application reference number.'
                  )
                }
                className="flex-1 py-2.5 rounded-xl bg-[#FF5200] text-white text-xs font-semibold cursor-pointer"
              >
                Check status
              </button>
              <a
                href="https://foscos.fssai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700"
              >
                FoSCoS Site
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
