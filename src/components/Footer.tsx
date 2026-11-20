import type { UserRole } from '../shared/types';

export type FooterDocKey =
  | 'privacy'
  | 'terms'
  | 'refunds'
  | 'grievance'
  | 'help'
  | 'alerts'
  | 'privacy_choices'
  | 'data_deletion';

interface FooterProps {
  onSelectRole: (role: UserRole) => void;
  onOpenDoc: (doc: FooterDocKey) => void;
}

export function Footer({ onSelectRole, onOpenDoc }: FooterProps) {
  return (
    <footer className="bg-[#0B1220] text-stone-300 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 text-center space-y-2.5">
        <p className="text-xs text-stone-400">
          © 2026 Móvana · Connecting Thelas · Demo build: payments are simulated
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-stone-400">
          <button
            type="button"
            onClick={() => onSelectRole('stall_owner')}
            className="hover:text-white underline underline-offset-2 cursor-pointer"
          >
            Run a stall? Open the stall owner app
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => onSelectRole('delivery_partner')}
            className="hover:text-white underline underline-offset-2 cursor-pointer"
          >
            Delivery partner workspace
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('privacy')} className="hover:text-white cursor-pointer">
            Privacy
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('terms')} className="hover:text-white cursor-pointer">
            Terms
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('refunds')} className="hover:text-white cursor-pointer">
            Refunds &amp; cancellation
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('grievance')} className="hover:text-white cursor-pointer">
            Grievance &amp; support
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('help')} className="hover:text-white cursor-pointer">
            Help &amp; report a problem
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenDoc('alerts')} className="hover:text-white cursor-pointer">
            Order alerts
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => onOpenDoc('privacy_choices')}
            className="hover:text-white cursor-pointer"
          >
            Privacy choices
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => onOpenDoc('data_deletion')}
            className="hover:text-white cursor-pointer"
          >
            Request data deletion
          </button>
        </div>
      </div>
    </footer>
  );
}
