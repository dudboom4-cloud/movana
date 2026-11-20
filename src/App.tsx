import { useCallback, useEffect, useState } from 'react';
import {
  LUDHIANA_NEIGHBORHOODS,
  type DeliveryPartner,
  type MenuItem,
  type Order,
  type OrderItem,
  type PaymentMethod,
  type Stall,
  type UserRole,
} from './shared/types';
import { api } from './lib/api';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { WelcomeRoleModal } from './components/WelcomeRoleModal';
import { TopNavBar } from './components/TopNavBar';
import { CustomerView } from './components/CustomerView';
import { StallOwnerView } from './components/StallOwnerView';
import { DeliveryPartnerView } from './components/DeliveryPartnerView';
import { CompanyAdminView } from './components/CompanyAdminView';
import { StallMenuModal } from './components/StallMenuModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { InfoModals, type ActiveInfoModal } from './components/InfoModals';
import { distanceKm } from './lib/geo';

const STORAGE_PRIVACY_KEY = 'movana_privacy_accepted_v1';
const STORAGE_ROLE_CHOSEN_KEY = 'movana_role_chosen_v1';

export default function App() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [simulateMovement, setSimulateMovement] = useState(true);
  const [loading, setLoading] = useState(true);

  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_PRIVACY_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_PRIVACY_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      return (
        localStorage.getItem(STORAGE_PRIVACY_KEY) === 'true' &&
        localStorage.getItem(STORAGE_ROLE_CHOSEN_KEY) !== 'true'
      );
    } catch {
      return false;
    }
  });

  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);

  // Customer location state (defaults to Rajguru Nagar, Ludhiana as shown in Screenshot 2)
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('rajguru');
  const [userLat, setUserLat] = useState(LUDHIANA_NEIGHBORHOODS[0].lat);
  const [userLng, setUserLng] = useState(LUDHIANA_NEIGHBORHOODS[0].lng);
  const [locationLabel, setLocationLabel] = useState(LUDHIANA_NEIGHBORHOODS[0].label);
  const [locationAccuracyText, setLocationAccuracyText] = useState('±107 m');

  // Customer profile state
  const [customerName, setCustomerName] = useState('Aarav Sharma');
  const [customerEmail, setCustomerEmail] = useState('aarav.sharma@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('9876501234');
  const [deliveryAddress, setDeliveryAddress] = useState('House 42, Block B, Rajguru Nagar, Ludhiana');
  const [orderAlerts, setOrderAlerts] = useState(true);

  // Cart & Modals
  const [cartStallId, setCartStallId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [selectedStallForMenu, setSelectedStallForMenu] = useState<Stall | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<ActiveInfoModal>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      const data = await api.bootstrap();
      setStalls(data.stalls);
      setOrders(data.orders);
      setPartners(data.deliveryPartners);
      setFavorites(data.favorites);
      setSimulateMovement(data.simulateMovement);
    } catch (err) {
      console.error('Bootstrap failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  // Live movement & state sync tick every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (simulateMovement) {
          const moved = await api.tickMovement();
          setStalls(moved.stalls);
        } else {
          const data = await api.bootstrap();
          setStalls(data.stalls);
          setOrders(data.orders);
        }
      } catch {
        // silent background poll
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [simulateMovement]);

  function handleAcceptPrivacy() {
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
    try {
      localStorage.setItem(STORAGE_PRIVACY_KEY, 'true');
      if (localStorage.getItem(STORAGE_ROLE_CHOSEN_KEY) !== 'true') {
        setShowWelcomeModal(true);
      }
    } catch {
      setShowWelcomeModal(true);
    }
  }

  function handleSelectRoleFromWelcome(role: UserRole) {
    setActiveRole(role);
    setShowWelcomeModal(false);
    try {
      localStorage.setItem(STORAGE_ROLE_CHOSEN_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function handleSelectNeighborhood(id: string) {
    const found = LUDHIANA_NEIGHBORHOODS.find((n) => n.id === id);
    if (!found) return;
    setSelectedNeighborhoodId(found.id);
    setUserLat(found.lat);
    setUserLng(found.lng);
    setLocationLabel(found.label);
    setLocationAccuracyText('±107 m');
  }

  function handleUseBrowserLocation() {
    if (!navigator.geolocation) {
      showToast('Browser geolocation unavailable; using Rajguru Nagar, Ludhiana.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // If user's real browser location is far outside Ludhiana (> 25 km), snap smoothly or notify
        const distFromLudhiana = distanceKm(lat, lng, 30.8924, 75.7928);
        if (distFromLudhiana > 25) {
          setSelectedNeighborhoodId('rajguru');
          setUserLat(LUDHIANA_NEIGHBORHOODS[0].lat);
          setUserLng(LUDHIANA_NEIGHBORHOODS[0].lng);
          setLocationLabel('Rajguru Nagar, Ludhiana');
          setLocationAccuracyText(`±${Math.round(pos.coords.accuracy)} m · Demo area`);
          showToast('GPS locked! Showing active Ludhiana demo stalls nearby.');
        } else {
          setSelectedNeighborhoodId('gps');
          setUserLat(lat);
          setUserLng(lng);
          setLocationLabel('Current GPS Location');
          setLocationAccuracyText(`±${Math.round(pos.coords.accuracy)} m`);
          showToast('Updated to your live GPS location.');
        }
      },
      () => {
        showToast('Location permission denied — keeping Rajguru Nagar, Ludhiana.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  function handleUpdateCartItem(stall: Stall, item: MenuItem, delta: number) {
    setCartItems((prev) => {
      const base = cartStallId && cartStallId !== stall.id ? {} : { ...prev };
      const current = base[item.id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        delete base[item.id];
      } else {
        base[item.id] = next;
      }
      const remainingKeys = Object.keys(base);
      setCartStallId(remainingKeys.length > 0 ? stall.id : null);
      return base;
    });
    if (delta > 0) {
      showToast(`Added ${item.name} from ${stall.name}`);
    }
  }

  async function handleToggleFavorite(stallId: string) {
    try {
      const res = await api.toggleFavorite(stallId);
      setFavorites(res.favorites);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update favorites');
    }
  }

  async function handlePlaceOrder(payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    items: OrderItem[];
  }) {
    if (!cartStallId) return;
    const order = await api.placeOrder({
      stallId: cartStallId,
      customerLat: userLat,
      customerLng: userLng,
      ...payload,
    });
    setOrders((prev) => [order, ...prev]);
    setCartItems({});
    setCartStallId(null);
    setCustomerName(payload.customerName);
    setCustomerPhone(payload.customerPhone);
    setDeliveryAddress(payload.deliveryAddress);
    showToast(`Order ${order.id} placed! Track it live in My orders.`);
  }

  async function handleClearOrders() {
    await api.clearOrders();
    setOrders([]);
    showToast('Order history cleared.');
  }

  const cartStall = stalls.find((s) => s.id === cartStallId) || null;
  const cartCount = Object.values(cartItems).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <TopNavBar
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        onOpenRoleModal={() => setShowWelcomeModal(true)}
        onOpenCorporate={() => setInfoModal({ type: 'corporate' })}
        onOpenPartnerModal={() => setInfoModal({ type: 'partner' })}
        onOpenGetApp={() => setInfoModal({ type: 'get_app' })}
        onOpenProfile={() => setInfoModal({ type: 'profile' })}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        isAdminAuthed={isAdminAuthed}
        customerName={customerName}
      />

      <div className="flex-1">
        {loading ? (
          <div className="max-w-[1160px] mx-auto px-6 py-20 text-center text-sm text-stone-500">
            Loading live stalls in Ludhiana...
          </div>
        ) : activeRole === 'customer' ? (
          <CustomerView
            stalls={stalls}
            orders={orders}
            favorites={favorites}
            selectedNeighborhoodId={selectedNeighborhoodId}
            userLat={userLat}
            userLng={userLng}
            locationLabel={locationLabel}
            locationAccuracyText={locationAccuracyText}
            onSelectNeighborhood={handleSelectNeighborhood}
            onUseBrowserLocation={handleUseBrowserLocation}
            onToggleFavorite={handleToggleFavorite}
            onOpenStall={(s) => setSelectedStallForMenu(s)}
            onQuickAddItem={(s, item) => handleUpdateCartItem(s, item, 1)}
            onRefresh={loadBootstrap}
            onClearOrders={handleClearOrders}
          />
        ) : activeRole === 'stall_owner' ? (
          <StallOwnerView
            stalls={stalls}
            orders={orders}
            onBackToCustomer={() => setActiveRole('customer')}
            onStallSaved={(saved) => {
              setStalls((prev) => {
                const exists = prev.some((s) => s.id === saved.id);
                return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev];
              });
            }}
            onOrderUpdated={(updated) => {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              showToast(`Order ${updated.id} updated to ${updated.status.replace(/_/g, ' ')}.`);
            }}
          />
        ) : activeRole === 'delivery_partner' ? (
          <DeliveryPartnerView
            partners={partners}
            orders={orders}
            stalls={stalls}
            onBackToCustomer={() => setActiveRole('customer')}
            onPartnerSaved={(saved) => {
              setPartners((prev) => {
                const exists = prev.some((p) => p.id === saved.id);
                return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
              });
            }}
            onOrderUpdated={(updated) => {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              loadBootstrap();
              showToast(`Delivery ${updated.id} marked ${updated.status.replace(/_/g, ' ')}.`);
            }}
          />
        ) : (
          <CompanyAdminView
            isAuthed={isAdminAuthed}
            onAuthSuccess={() => setIsAdminAuthed(true)}
            stalls={stalls}
            partners={partners}
            orders={orders}
            simulateMovement={simulateMovement}
            onStallUpdated={(updated) => {
              setStalls((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              showToast(`Stall "${updated.name}" is now ${updated.verificationStatus}.`);
            }}
            onPartnerUpdated={(updated) => {
              setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              showToast(`Partner "${updated.name}" is now ${updated.verificationStatus}.`);
            }}
            onToggleSimulation={async (next) => {
              const res = await api.tickMovement(next);
              setStalls(res.stalls);
              setSimulateMovement(res.simulateMovement);
            }}
            onBackToCustomer={() => setActiveRole('customer')}
          />
        )}
      </div>

      <Footer
        onSelectRole={(r) => setActiveRole(r)}
        onOpenDoc={(doc) => setInfoModal({ type: 'footer_doc', doc })}
      />

      {/* Modals & Drawers */}
      <PrivacyTermsModal
        isOpen={showPrivacyModal}
        onAccept={handleAcceptPrivacy}
        canDismiss={privacyAccepted}
        onClose={() => setShowPrivacyModal(false)}
      />

      <WelcomeRoleModal
        isOpen={!showPrivacyModal && showWelcomeModal}
        onSelectRole={handleSelectRoleFromWelcome}
        onOpenAdminSignIn={() => {
          handleSelectRoleFromWelcome('admin');
        }}
      />

      <StallMenuModal
        stall={selectedStallForMenu}
        distanceKmValue={
          selectedStallForMenu
            ? distanceKm(userLat, userLng, selectedStallForMenu.lat, selectedStallForMenu.lng)
            : undefined
        }
        isFavorite={selectedStallForMenu ? favorites.includes(selectedStallForMenu.id) : false}
        onToggleFavorite={handleToggleFavorite}
        cartItems={cartItems}
        cartStallId={cartStallId}
        onUpdateItemQty={handleUpdateCartItem}
        onOpenCart={() => setIsCartOpen(true)}
        onClose={() => setSelectedStallForMenu(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        stall={cartStall}
        cartItems={cartItems}
        onUpdateItemQty={handleUpdateCartItem}
        onClearCart={() => {
          setCartItems({});
          setCartStallId(null);
        }}
        customerName={customerName}
        customerPhone={customerPhone}
        deliveryAddress={deliveryAddress}
        onPlaceOrder={handlePlaceOrder}
      />

      <InfoModals
        modal={infoModal}
        onClose={() => setInfoModal(null)}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        deliveryAddress={deliveryAddress}
        orderAlertsEnabled={orderAlerts}
        onSaveProfile={(p) => {
          setCustomerName(p.name);
          setCustomerEmail(p.email);
          setCustomerPhone(p.phone);
          setDeliveryAddress(p.address);
          setOrderAlerts(p.orderAlerts);
          showToast('Profile saved.');
        }}
        onSelectRole={setActiveRole}
        onOpenPrivacyModal={() => setShowPrivacyModal(true)}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-stone-900 text-white px-4 py-3 text-xs font-semibold shadow-xl border border-white/10"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
