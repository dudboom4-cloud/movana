interface MovanaLogoProps {
  variant?: 'on-orange' | 'on-light';
  size?: 'sm' | 'md';
}

export function MovanaLogo({ variant = 'on-orange', size = 'md' }: MovanaLogoProps) {
  const isOrangeBg = variant === 'on-orange';
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 select-none">
      <span
        className={`inline-flex items-center justify-center rounded-lg ${
          size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'
        } ${isOrangeBg ? 'bg-white text-[#FF5200]' : 'bg-[#FF5200] text-white'} shadow-sm`}
      >
        <svg
          viewBox="0 0 24 24"
          className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span
        className={`font-display font-extrabold tracking-tight ${
          size === 'sm' ? 'text-lg' : 'text-xl'
        } ${isOrangeBg ? 'text-white' : 'text-[#FF5200]'}`}
      >
        móvana
      </span>
    </span>
  );
}
