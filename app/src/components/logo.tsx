export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mfGold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F2E27A" />
            <stop offset="0.5" stopColor="#F2CB05" />
            <stop offset="1" stopColor="#D98E04" />
          </linearGradient>
        </defs>
        <path
          d="M10 85V25L30 45L50 25V85M50 85V25L70 45L90 25V85"
          stroke="url(#mfGold)"
          strokeWidth="9"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
      <span className="leading-tight">
        <span className="block font-serif text-lg tracking-wide text-brand-yellow">MASTER</span>
        <span className="block text-[9px] tracking-[0.35em] text-muted -mt-1">FINANCIAMENTOS</span>
      </span>
    </div>
  );
}
