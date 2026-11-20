import { ArrowUpRight, ShoppingBag, User } from 'lucide-react';
import type { UserRole } from '../shared/types';
import { MovanaLogo } from './MovanaLogo';

interface TopNavBarProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenRoleModal: () => void;
  onOpenCorporate: () => void;
  onOpenPartnerModal: () => void;
  onOpenGetApp: () => void;
  onOpenProfile: () => void;
  onOpenCart: () => void;
  cartCount: number;
  isAdminAuthed: boolean;
  customerName: string;
}

export function TopNavBar({
  activeRole,
  onSelectRole,
  onOpenRoleModal,
  onOpenCorporate,
  onOpenPartnerModal,
  onOpenGetApp,
  onOpenProfile,
  onOpenCart,
  cartCount,
  isAdminAuthed,
  customerName,
}: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-30">
      {/* Main Orange Bar matching Screenshots 2-5 */}
      <div className="bg-[#FF5200] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg"
            title="Switch Móvana role"
          >
            <MovanaLogo variant="on-orange" size="md" />
          </button>

          <nav className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={onOpenCorporate}
              className="hidden md:inline-block text-xs font-semibold text-white/95 hover:text-white hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Móvana Corporate
            </button>
            <button
              type="button"
              onClick={onOpenPartnerModal}
              className="hidden sm:inline-block text-xs font-semibold text-white/95 hover:text-white hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Partner with us
            </button>
            <button
              type="button"
              onClick={onOpenGetApp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <span>Get the App</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Account profile"
              title={customerName ? `Signed in as ${customerName}` : 'Sign in / Profile'}
              className="w-8 h-8 rounded-full bg-[#111827] hover:bg-black text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open cart"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#FF5200]" />
              <span className="font-mono-nums">{cartCount}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Role Switcher Sub-bar matching Screenshots 2-4 */}
      <div className="bg-[#FAF6F0] border-b border-stone-200/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-10 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'customer', label: 'Customer' },
                { id: 'stall_owner', label: 'Stall owner' },
                { id: 'delivery_partner', label: 'Delivery partner' },
              ] as const
            ).map((tab) => {
              const active = activeRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectRole(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#FF5200] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            {isAdminAuthed && (
              <button
                type="button"
                onClick={() => onSelectRole('admin')}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                Company admin
              </button>
            )}
          </div>

          {!isAdminAuthed && (
            <button
              type="button"
              onClick={() => onSelectRole('admin')}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Company admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
