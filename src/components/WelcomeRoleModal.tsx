import { Store, Bike, ArrowRight } from 'lucide-react';
import type { UserRole } from '../shared/types';

interface WelcomeRoleModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserRole) => void;
  onOpenAdminSignIn: () => void;
}

export function WelcomeRoleModal({ isOpen, onSelectRole, onOpenAdminSignIn }: WelcomeRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background:
          'radial-gradient(circle at 92% 90%, rgba(255, 82, 0, 0.45) 0%, rgba(160, 62, 34, 0.45) 22%, rgba(24, 34, 54, 0.96) 58%, #0E1729 100%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-role-title"
    >
      <div className="w-full max-w-[440px] rounded-3xl bg-[#FFFDF9] text-stone-900 shadow-2xl border border-white/20 p-6 sm:p-7">
        <h1 id="welcome-role-title" className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
          Welcome to Móvana
        </h1>
        <p className="text-sm text-stone-500 mt-1">Choose how you&apos;ll use it. You can switch roles anytime.</p>

        <button
          type="button"
          onClick={() => onSelectRole('customer')}
          className="mt-5 w-full text-left rounded-2xl bg-[#E84D24] hover:bg-[#D9431B] text-white p-5 transition-transform active:scale-[0.99] shadow-md cursor-pointer flex items-center justify-between gap-4"
        >
          <div>
            <span className="font-display text-lg font-bold block">Customer</span>
            <span className="text-xs text-white/90 mt-1 block leading-relaxed">
              Find stalls near you, order, and track delivery live.
            </span>
          </div>
          <div className="shrink-0 w-16 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl">
            🍲
          </div>
        </button>

        <div className="mt-5">
          <p className="text-xs font-medium text-stone-500 mb-2.5">Work with Móvana</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSelectRole('stall_owner')}
              className="text-left rounded-2xl border border-stone-200 hover:border-[#FF5200]/50 hover:bg-[#FFF9F4] bg-white p-4 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#FFF3E6] text-[#D97706] flex items-center justify-center mb-2.5">
                  <Store className="w-4 h-4" />
                </div>
                <span className="font-display text-sm font-bold text-stone-900 block">Stall owner</span>
                <span className="text-xs text-stone-500 mt-1 block leading-snug">
                  Build your menu, go live, manage orders. Aadhaar check required.
                </span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF5200]">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole('delivery_partner')}
              className="text-left rounded-2xl border border-stone-200 hover:border-[#FF5200]/50 hover:bg-[#FFF9F4] bg-white p-4 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#FFF0EA] text-[#FF5200] flex items-center justify-center mb-2.5">
                  <Bike className="w-4 h-4" />
                </div>
                <span className="font-display text-sm font-bold text-stone-900 block">Delivery partner</span>
                <span className="text-xs text-stone-500 mt-1 block leading-snug">
                  Accept requests and complete deliveries. Aadhaar check required.
                </span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF5200]">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 text-center">
          <button
            type="button"
            onClick={onOpenAdminSignIn}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 underline underline-offset-4 cursor-pointer"
          >
            Company admin sign in
          </button>
        </div>
      </div>
    </div>
  );
}
