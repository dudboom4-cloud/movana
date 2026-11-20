import { useState } from 'react';
import { Bike, Building2, CheckCircle2, Smartphone, Store, UserCheck, X } from 'lucide-react';
import type { SupportTicket, UserRole } from '../shared/types';
import type { FooterDocKey } from './Footer';
import { api } from '../lib/api';

export type ActiveInfoModal =
  | null
  | { type: 'profile' }
  | { type: 'corporate' }
  | { type: 'partner' }
  | { type: 'get_app' }
  | { type: 'footer_doc'; doc: FooterDocKey };

interface InfoModalsProps {
  modal: ActiveInfoModal;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderAlertsEnabled: boolean;
  onSaveProfile: (profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
    orderAlerts: boolean;
  }) => void;
  onSelectRole: (role: UserRole) => void;
  onOpenPrivacyModal: () => void;
}

export function InfoModals({
  modal,
  onClose,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  orderAlertsEnabled,
  onSaveProfile,
  onSelectRole,
  onOpenPrivacyModal,
}: InfoModalsProps) {
  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [phone, setPhone] = useState(customerPhone);
  const [address, setAddress] = useState(deliveryAddress);
  const [alerts, setAlerts] = useState(orderAlertsEnabled);

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDetails, setTicketDetails] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!modal) return null;

  async function handleTicketSubmit(
    e: React.FormEvent,
    type: SupportTicket['type'],
    defaultSubject: string
  ) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.submitTicket({
        type,
        name: name || 'Customer',
        contact: phone || email || 'Not provided',
        subject: ticketSubject.trim() || defaultSubject,
        details: ticketDetails.trim() || defaultSubject,
      });
      setSubmittedTicket(created);
      setTicketSubject('');
      setTicketDetails('');
    } finally {
      setSubmitting(false);
    }
  }

  function renderContent() {
    if (!modal) return null;

    if (modal.type === 'profile') {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveProfile({
              name: name.trim() || 'Guest Customer',
              email: email.trim(),
              phone: phone.trim(),
              address: address.trim(),
              orderAlerts: alerts,
            });
            onClose();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Your Móvana Profile</h2>
              <p className="text-xs text-stone-500">Used to auto-fill checkout and verify your identity.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Gmail / Google account</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit phone number"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Default delivery address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / street / neighborhood"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alerts}
                onChange={(e) => setAlerts(e.target.checked)}
                className="rounded border-stone-300 text-[#FF5200]"
              />
              <span>Enable live order status alerts</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-sm font-bold cursor-pointer"
          >
            Save profile
          </button>
        </form>
      );
    }

    if (modal.type === 'corporate') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Móvana Corporate</h2>
              <p className="text-xs text-stone-500">Office snack carts, campus events &amp; bulk fresh produce.</p>
            </div>
          </div>

          {submittedTicket ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Request logged ({submittedTicket.id})
              </p>
              <p>Our Ludhiana corporate coordinator will contact you shortly.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleTicketSubmit(e, 'corporate', 'Corporate event inquiry')}
              className="space-y-3"
            >
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Company / campus name & headcount"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <textarea
                rows={3}
                required
                value={ticketDetails}
                onChange={(e) => setTicketDetails(e.target.value)}
                placeholder="Preferred street-food carts (Chaat, Kulcha, Momos, Chai) & date"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-sm font-bold cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Request Corporate Callback'}
              </button>
            </form>
          )}
        </div>
      );
    }

    if (modal.type === 'partner') {
      return (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-stone-900">Partner with Móvana</h2>
          <p className="text-xs text-stone-500">
            Zero listing fee to join. Grow daily orders from your neighborhood street stall or deliver on your schedule.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onSelectRole('stall_owner');
                onClose();
              }}
              className="text-left rounded-2xl border border-stone-200 hover:border-[#FF5200] p-4 space-y-2 cursor-pointer"
            >
              <Store className="w-5 h-5 text-[#FF5200]" />
              <p className="font-display font-bold text-sm text-stone-900">Register a Thela / Stall</p>
              <p className="text-xs text-stone-500">Set up your menu, FSSAI &amp; Aadhaar check, and go live.</p>
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectRole('delivery_partner');
                onClose();
              }}
              className="text-left rounded-2xl border border-stone-200 hover:border-[#FF5200] p-4 space-y-2 cursor-pointer"
            >
              <Bike className="w-5 h-5 text-[#FF5200]" />
              <p className="font-display font-bold text-sm text-stone-900">Join as Delivery Partner</p>
              <p className="text-xs text-stone-500">Earn ₹30+ per local delivery on bicycle, scooter, or EV cart.</p>
            </button>
          </div>
        </div>
      );
    }

    if (modal.type === 'get_app') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#FF5200] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Get Móvana on Mobile</h2>
              <p className="text-xs text-stone-500">Install directly from your mobile browser — no app store wait.</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#FAF6F0] p-4 text-xs text-stone-700 space-y-2">
            <p>
              <strong>Android (Chrome):</strong> Tap the browser menu (⋮) → <em>Add to Home screen</em>.
            </p>
            <p>
              <strong>iPhone (Safari):</strong> Tap the Share icon → <em>Add to Home Screen</em>.
            </p>
          </div>
        </div>
      );
    }

    if (modal.type === 'footer_doc') {
      const doc = modal.doc;
      if (doc === 'privacy' || doc === 'terms' || doc === 'privacy_choices') {
        onClose();
        onOpenPrivacyModal();
        return null;
      }

      if (doc === 'alerts') {
        return (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-stone-900">Order Alerts</h2>
            <p className="text-xs text-stone-600">
              Get real-time updates when your stall accepts your order, hands off to a rider, and arrives nearby.
            </p>
            <label className="flex items-center justify-between rounded-xl border border-stone-200 p-4 cursor-pointer">
              <span className="text-sm font-semibold text-stone-900">Live order notifications</span>
              <input
                type="checkbox"
                checked={alerts}
                onChange={(e) => {
                  const next = e.target.checked;
                  setAlerts(next);
                  onSaveProfile({
                    name: name || 'Guest Customer',
                    email,
                    phone,
                    address,
                    orderAlerts: next,
                  });
                }}
                className="w-4 h-4 accent-[#FF5200]"
              />
            </label>
          </div>
        );
      }

      if (doc === 'refunds') {
        return (
          <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
            <h2 className="font-display text-lg font-bold text-stone-900">Refunds &amp; Cancellation</h2>
            <p>
              Orders may be cancelled for a full refund (including the 5% platform fee) before the stall marks the order
              as <strong>Preparing</strong>.
            </p>
            <p>
              If a stall goes offline or an item is unavailable after payment, a full instant credit is issued to your
              original UPI, card, or netbanking method.
            </p>
          </div>
        );
      }

      const isDeletion = doc === 'data_deletion';
      const title =
        isDeletion
          ? 'Request Data Deletion'
          : doc === 'grievance'
            ? 'Grievance & Support'
            : 'Help & Report a Problem';

      return (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-stone-900">{title}</h2>
          {submittedTicket ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Ticket recorded ({submittedTicket.id})
              </p>
              <p>We have logged your request and will respond to {submittedTicket.contact}.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleTicketSubmit(e, isDeletion ? 'data_deletion' : 'grievance', title)}
              className="space-y-3"
            >
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder={isDeletion ? 'Phone number or email to erase' : 'Order ID or issue summary'}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <textarea
                rows={3}
                required
                value={ticketDetails}
                onChange={(e) => setTicketDetails(e.target.value)}
                placeholder="Describe your request or issue..."
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF5200]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white text-sm font-bold cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => {
            setSubmittedTicket(null);
            onClose();
          }}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
