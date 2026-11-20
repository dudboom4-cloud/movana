import { useState } from 'react';
import { ArrowLeft, Bike, CheckCircle2, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import type { DeliveryPartner, Order, OrderStatus, Stall } from '../shared/types';
import { api } from '../lib/api';
import { formatAadhaarInput } from '../lib/geo';
import { LeafletMap } from './LeafletMap';

interface DeliveryPartnerViewProps {
  partners: DeliveryPartner[];
  orders: Order[];
  stalls: Stall[];
  onBackToCustomer: () => void;
  onPartnerSaved: (partner: DeliveryPartner) => void;
  onOrderUpdated: (order: Order) => void;
}

export function DeliveryPartnerView({
  partners,
  orders,
  stalls,
  onBackToCustomer,
  onPartnerSaved,
  onOrderUpdated,
}: DeliveryPartnerViewProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || 'new');
  const activePartner = partners.find((p) => p.id === selectedPartnerId) || partners[0] || null;

  const [name, setName] = useState(activePartner?.name || '');
  const [phone, setPhone] = useState(activePartner?.phone || '');
  const [vehicleType, setVehicleType] = useState<DeliveryPartner['vehicleType']>(
    activePartner?.vehicleType || 'Scooter / Bike'
  );
  const [aadhaarInput, setAadhaarInput] = useState(
    activePartner?.aadhaarLast4 ? `•••• •••• ${activePartner.aadhaarLast4}` : ''
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openRequests = orders.filter(
    (o) =>
      !o.deliveryPartnerId &&
      (o.status === 'placed' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready_for_pickup')
  );

  const myActiveDeliveries = orders.filter(
    (o) =>
      o.deliveryPartnerId === activePartner?.id && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const myCompletedDeliveries = orders.filter(
    (o) => o.deliveryPartnerId === activePartner?.id && o.status === 'delivered'
  );

  async function handleSavePartner(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.saveDeliveryPartner({
        id: selectedPartnerId === 'new' ? undefined : activePartner?.id,
        name,
        phone,
        vehicleType,
        aadhaarNumber: aadhaarInput.includes('•') ? undefined : aadhaarInput,
        isOnline: activePartner?.isOnline ?? true,
      });
      onPartnerSaved(saved);
      setSelectedPartnerId(saved.id);
      setFeedback(
        saved.verificationStatus === 'verified'
          ? 'Partner profile updated and verified.'
          : 'Partner profile saved. Verify via Company Admin to go online.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to save partner');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOnline() {
    if (!activePartner) return;
    const saved = await api.saveDeliveryPartner({
      id: activePartner.id,
      isOnline: !activePartner.isOnline,
    });
    onPartnerSaved(saved);
  }

  async function handleAcceptOrder(order: Order) {
    if (!activePartner) return;
    if (activePartner.verificationStatus !== 'verified') {
      setFeedback('Complete Aadhaar verification and Company Admin approval before accepting deliveries.');
      return;
    }
    const updated = await api.updateOrderStatus(order.id, 'rider_assigned', {
      deliveryPartnerId: activePartner.id,
      riderLat: activePartner.lat,
      riderLng: activePartner.lng,
    });
    onOrderUpdated(updated);
  }

  async function handleAdvanceDelivery(order: Order, nextStatus: OrderStatus) {
    const updated = await api.updateOrderStatus(order.id, nextStatus);
    onOrderUpdated(updated);
  }

  const featuredActiveOrder = myActiveDeliveries[0] || null;

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-6 px-4 sm:px-8">
      <div className="max-w-[1160px] mx-auto space-y-6">
        {/* Header Banner */}
        <div className="rounded-2xl bg-[#111827] text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5200] flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                Delivery partner workspace
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
                Accept pickup requests from neighborhood thelas and track doorstep deliveries live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {activePartner && (
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activePartner.isOnline
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                }`}
              >
                {activePartner.isOnline ? 'Online · Taking requests' : 'Offline'}
              </button>
            )}
            <button
              type="button"
              onClick={onBackToCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer site</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        {activePartner && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Verification status</p>
              <p className="font-display text-lg font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    activePartner.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                <span className="capitalize">{activePartner.verificationStatus.replace(/_/g, ' ')}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Completed deliveries</p>
              <p className="font-display text-lg font-bold font-mono-nums text-stone-900 mt-1">
                {activePartner.completedDeliveries}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Earnings today</p>
              <p className="font-display text-lg font-bold font-mono-nums text-[#FF5200] mt-1">
                ₹{activePartner.earningsToday}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Requests + Active Delivery */}
          <div className="lg:col-span-7 space-y-5">
            {featuredActiveOrder && (
              <div className="rounded-2xl bg-white border border-emerald-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700">Active delivery</span>
                    <h2 className="font-display text-lg font-bold text-stone-900">
                      {featuredActiveOrder.id} · {featuredActiveOrder.stallEmoji} {featuredActiveOrder.stallName}
                    </h2>
                  </div>
                  <span className="font-mono-nums text-xs font-bold text-stone-900">Payout ₹30</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF6F0] p-3.5 rounded-xl">
                  <div>
                    <p className="text-stone-500">Pickup from stall</p>
                    <p className="font-semibold text-stone-900 mt-0.5">{featuredActiveOrder.stallAddress}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Drop to {featuredActiveOrder.customerName}</p>
                    <p className="font-semibold text-stone-900 mt-0.5">{featuredActiveOrder.deliveryAddress}</p>
                    <p className="font-mono-nums text-stone-600 mt-0.5">{featuredActiveOrder.customerPhone}</p>
                  </div>
                </div>

                <LeafletMap
                  centerLat={featuredActiveOrder.stallLat}
                  centerLng={featuredActiveOrder.stallLng}
                  stalls={stalls.filter((s) => s.id === featuredActiveOrder.stallId)}
                  activeOrder={featuredActiveOrder}
                  heightClass="h-[260px]"
                />

                <div className="flex flex-wrap items-center gap-2">
                  {(featuredActiveOrder.status === 'rider_assigned' ||
                    featuredActiveOrder.status === 'ready_for_pickup') && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceDelivery(featuredActiveOrder, 'picked_up')}
                      className="px-4 py-2 rounded-xl bg-[#FF5200] text-white text-xs font-bold cursor-pointer"
                    >
                      Mark Picked Up
                    </button>
                  )}
                  {featuredActiveOrder.status === 'picked_up' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceDelivery(featuredActiveOrder, 'out_for_delivery')}
                      className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {(featuredActiveOrder.status === 'out_for_delivery' ||
                    featuredActiveOrder.status === 'picked_up') && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceDelivery(featuredActiveOrder, 'delivered')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Delivery</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Open Delivery Requests */}
            <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-stone-900">Available pickup requests</h2>
                <span className="text-xs font-mono-nums text-stone-500">{openRequests.length} open</span>
              </div>

              {openRequests.length === 0 ? (
                <div className="rounded-xl bg-[#FAF6F0] p-6 text-center text-xs text-stone-500">
                  No open pickup requests right now. Place an order on the Customer site to see live dispatch here.
                </div>
              ) : (
                <div className="space-y-3">
                  {openRequests.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span className="font-mono-nums font-bold text-stone-900">{order.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="font-display font-bold text-sm text-stone-900">
                          {order.stallEmoji} {order.stallName}
                        </p>
                        <p className="text-xs text-stone-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#FF5200]" />
                          <span>
                            {order.stallAddress} → {order.deliveryAddress}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order)}
                        className="px-4 py-2 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Accept Delivery (₹30)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {myCompletedDeliveries.length > 0 && (
                <div className="pt-4 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-600 mb-2">Recent completed trips</h3>
                  <div className="space-y-2">
                    {myCompletedDeliveries.slice(0, 4).map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs text-stone-600">
                        <span>
                          {o.id} · {o.stallName}
                        </span>
                        <span className="font-mono-nums font-semibold text-emerald-700">+₹30</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Partner Profile & Aadhaar Verification */}
          <form onSubmit={handleSavePartner} className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-stone-900">Partner profile &amp; Aadhaar</h2>
              <select
                aria-label="Select partner profile"
                value={selectedPartnerId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPartnerId(val);
                  const found = partners.find((p) => p.id === val);
                  if (found) {
                    setName(found.name);
                    setPhone(found.phone);
                    setVehicleType(found.vehicleType);
                    setAadhaarInput(found.aadhaarLast4 ? `•••• •••• ${found.aadhaarLast4}` : '');
                  } else {
                    setName('');
                    setPhone('');
                    setVehicleType('Scooter / Bike');
                    setAadhaarInput('');
                  }
                }}
                className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-800"
              >
                <option value="new">+ New partner</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
              />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as DeliveryPartner['vehicleType'])}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#FF5200]"
              >
                <option value="Scooter / Bike">Scooter / Bike</option>
                <option value="Bicycle">Bicycle</option>
                <option value="EV Cart">EV Cart</option>
              </select>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Aadhaar number (Required)</label>
                <input
                  type="text"
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(formatAadhaarInput(e.target.value))}
                  placeholder="0000 0000 0000"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Demo valid Aadhaar:{' '}
                  <button
                    type="button"
                    onClick={() => setAadhaarInput('2345 6789 0128')}
                    className="text-[#FF5200] font-mono-nums underline cursor-pointer"
                  >
                    2345 6789 0128
                  </button>
                </p>
              </div>
            </div>

            {feedback && <p className="text-xs font-medium text-stone-700 bg-[#FAF6F0] p-3 rounded-xl">{feedback}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white font-bold text-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save partner details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
