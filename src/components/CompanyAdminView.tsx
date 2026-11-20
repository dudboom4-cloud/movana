import { useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Play, ShieldCheck, XCircle } from 'lucide-react';
import type { DeliveryPartner, Order, Stall } from '../shared/types';
import { api } from '../lib/api';

interface CompanyAdminViewProps {
  isAuthed: boolean;
  onAuthSuccess: () => void;
  stalls: Stall[];
  partners: DeliveryPartner[];
  orders: Order[];
  simulateMovement: boolean;
  onStallUpdated: (stall: Stall) => void;
  onPartnerUpdated: (partner: DeliveryPartner) => void;
  onToggleSimulation: (next: boolean) => void;
  onBackToCustomer: () => void;
}

const DEMO_PASSKEY = 'ADMIN-MOVANA-2026';

export function CompanyAdminView({
  isAuthed,
  onAuthSuccess,
  stalls,
  partners,
  orders,
  simulateMovement,
  onStallUpdated,
  onPartnerUpdated,
  onToggleSimulation,
  onBackToCustomer,
}: CompanyAdminViewProps) {
  const [passkey, setPasskey] = useState('');
  const [authError, setAuthError] = useState('');

  if (!isAuthed) {
    return (
      <div className="min-h-[80vh] bg-[#FAF6F0] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 shadow-lg space-y-4">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900">Company admin sign in</h1>
            <p className="text-xs text-stone-500 mt-1">
              Verify pending FSSAI &amp; Aadhaar registrations and oversee live Ludhiana thela operations.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passkey.trim() === DEMO_PASSKEY) {
                setAuthError('');
                onAuthSuccess();
              } else {
                setAuthError('Invalid admin passkey. Use the demo passkey shown below.');
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter company admin passkey"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono-nums focus:outline-none focus:border-[#FF5200]"
            />
            {authError && <p className="text-xs text-red-600">{authError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-sm font-bold cursor-pointer"
            >
              Sign in to Admin Console
            </button>
          </form>

          <div className="rounded-xl bg-[#FAF6F0] p-3 text-xs text-stone-600 flex items-center justify-between gap-2">
            <span>
              Demo passkey: <strong className="font-mono-nums text-stone-900">{DEMO_PASSKEY}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setPasskey(DEMO_PASSKEY);
                onAuthSuccess();
              }}
              className="text-[#FF5200] font-semibold underline cursor-pointer shrink-0"
            >
              Quick fill &amp; sign in
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToCustomer}
            className="w-full text-center text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
          >
            ← Back to customer site
          </button>
        </div>
      </div>
    );
  }

  const totalGmv = orders.reduce((sum, o) => sum + o.total, 0);
  const totalPlatformFee = orders.reduce((sum, o) => sum + o.platformFee, 0);

  async function handleVerifyStall(stallId: string, approve: boolean) {
    const updated = await api.verifyStall(stallId, approve);
    onStallUpdated(updated);
  }

  async function handleVerifyPartner(partnerId: string, approve: boolean) {
    const updated = await api.verifyDeliveryPartner(partnerId, approve);
    onPartnerUpdated(updated);
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-6 px-4 sm:px-8">
      <div className="max-w-[1160px] mx-auto space-y-6">
        <div className="rounded-2xl bg-stone-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold">Móvana Company Admin</h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
              Approve FSSAI &amp; Aadhaar verifications, control fleet movement simulation, and audit platform fees.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onToggleSimulation(!simulateMovement)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                simulateMovement ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simulateMovement ? 'Live cart motion: ON' : 'Live cart motion: OFF'}</span>
            </button>
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

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-stone-200 p-4">
            <p className="text-xs text-stone-500">Total stalls</p>
            <p className="font-display text-xl font-bold font-mono-nums text-stone-900 mt-1">{stalls.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-stone-200 p-4">
            <p className="text-xs text-stone-500">Live on map</p>
            <p className="font-display text-xl font-bold font-mono-nums text-emerald-700 mt-1">
              {stalls.filter((s) => s.isLive).length}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-stone-200 p-4">
            <p className="text-xs text-stone-500">Orders placed</p>
            <p className="font-display text-xl font-bold font-mono-nums text-stone-900 mt-1">{orders.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-stone-200 p-4">
            <p className="text-xs text-stone-500">5% platform fee ledger</p>
            <p className="font-display text-xl font-bold font-mono-nums text-[#FF5200] mt-1">
              ₹{totalPlatformFee} <span className="text-xs font-normal text-stone-400">/ ₹{totalGmv} GMV</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stalls Queue */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-stone-900">Stall verifications</h2>
            <div className="space-y-3">
              {stalls.map((stall) => (
                <div key={stall.id} className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-sm text-stone-900">
                        {stall.emoji} {stall.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        Owner: {stall.ownerName || 'Not set'} · {stall.neighborhood}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        stall.verificationStatus === 'verified'
                          ? 'text-emerald-700'
                          : stall.verificationStatus === 'pending_review'
                            ? 'text-amber-700'
                            : 'text-stone-500'
                      }`}
                    >
                      {stall.verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-mono-nums text-stone-600 flex flex-wrap gap-3">
                    <span>FSSAI: {stall.fssaiNumber || 'Missing'}</span>
                    <span>Aadhaar: {stall.aadhaarLast4 ? `•••• ${stall.aadhaarLast4}` : 'Missing'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {stall.verificationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyStall(stall.id, true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Go Live</span>
                      </button>
                    )}
                    {stall.verificationStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyStall(stall.id, false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Partners Queue */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-stone-900">Delivery partner verifications</h2>
            <div className="space-y-3">
              {partners.map((p) => (
                <div key={p.id} className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-bold text-sm text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        {p.vehicleType} · {p.phone} · Aadhaar{' '}
                        <span className="font-mono-nums">{p.aadhaarLast4 ? `•••• ${p.aadhaarLast4}` : 'Missing'}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 capitalize">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {p.verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {p.verificationStatus !== 'verified' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleVerifyPartner(p.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Approve partner
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyPartner(p.id, false)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
