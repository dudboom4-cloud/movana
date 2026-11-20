import { useState } from 'react';
import { MapPin, Smartphone, Mail, X } from 'lucide-react';
import { MovanaLogo } from './MovanaLogo';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export function PrivacyTermsModal({ isOpen, onAccept, onClose, canDismiss = false }: PrivacyTermsModalProps) {
  const [activeDoc, setActiveDoc] = useState<'none' | 'privacy' | 'terms'>('none');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B111E]/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="relative w-full max-w-[460px] rounded-2xl bg-white text-[#1C1917] shadow-2xl border border-black/5 p-6 sm:p-7">
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy dialog"
            className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-3 mb-5">
          <MovanaLogo variant="on-light" size="md" />
          <span className="text-xs text-stone-500 mt-1.5">Privacy &amp; Terms</span>
        </div>

        {activeDoc === 'none' ? (
          <>
            <h2 id="privacy-modal-title" className="font-display text-xl font-bold tracking-tight text-stone-900">
              Before you continue
            </h2>
            <p className="text-sm text-stone-600 mt-1.5">Movana collects the following to run your orders:</p>

            <ul className="mt-4 space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF5200] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-stone-900">Location</strong> — to show stalls near you
                  (optional; you can set it manually)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-[#FF5200] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-stone-900">Phone number &amp; delivery address</strong> —
                  required to complete orders
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#FF5200] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-stone-900">Gmail / Google account</strong> — used only to
                  verify your identity; we do not share or sell your data
                </span>
              </li>
            </ul>

            <div className="mt-5 rounded-xl bg-[#FFF6EE] border border-[#FFE3CC] p-3.5 text-xs leading-relaxed text-stone-700">
              By continuing you agree to Movana&apos;s{' '}
              <button
                type="button"
                onClick={() => setActiveDoc('terms')}
                className="text-[#FF5200] font-semibold underline underline-offset-2 hover:text-[#E04800]"
              >
                Terms of Service
              </button>{' '}
              and confirm you have read our{' '}
              <button
                type="button"
                onClick={() => setActiveDoc('privacy')}
                className="text-[#FF5200] font-semibold underline underline-offset-2 hover:text-[#E04800]"
              >
                Privacy Notice
              </button>
              . You can change your data choices anytime from the footer.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 py-2.5 px-5 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Accept &amp; Continue
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc('privacy')}
                className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Read Privacy Notice
              </button>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900">
              {activeDoc === 'privacy' ? 'Movana Privacy Notice' : 'Movana Terms of Service'}
            </h2>
            <div className="mt-3 max-h-60 overflow-y-auto pr-1 space-y-2.5 text-xs leading-relaxed text-stone-600">
              {activeDoc === 'privacy' ? (
                <>
                  <p>
                    <strong className="text-stone-900">1. Purpose-limited collection:</strong> Location coordinates are
                    used only to discover active street-food stalls and vegetable carts within 5 km and coordinate
                    rider handoff.
                  </p>
                  <p>
                    <strong className="text-stone-900">2. Verification &amp; compliance:</strong> Stall owners and
                    delivery partners undergo FSSAI and Aadhaar verification. Only the last 4 digits of Aadhaar are
                    retained in operational records.
                  </p>
                  <p>
                    <strong className="text-stone-900">3. Zero data resale:</strong> Móvana never sells customer phone
                    numbers, addresses, or order history to third-party brokers. You may request deletion anytime via
                    the footer.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-stone-900">1. Marketplace role:</strong> Móvana connects neighborhood thela
                    vendors, customers, and independent delivery partners across Ludhiana.
                  </p>
                  <p>
                    <strong className="text-stone-900">2. Transparent pricing:</strong> Customer checkout collects item
                    subtotal, a flat 5% platform service fee, and local delivery fee upfront. Payments in this build are
                    simulated for demonstration.
                  </p>
                  <p>
                    <strong className="text-stone-900">3. Food safety:</strong> Every stall must maintain an active
                    14-digit FSSAI registration or licence before accepting live customer orders.
                  </p>
                </>
              )}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF5200] hover:bg-[#E04800] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Accept &amp; Continue
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc('none')}
                className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
