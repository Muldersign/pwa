/** Jessmile mark: a smile-shaped aligner arch inside a rounded square. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lg-bg)" />
      <path d="M16 26c0 13 7 22 16 22s16-9 16-22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M22 27c0 8 4.5 13.5 10 13.5S42 35 42 27" fill="none" stroke="#FBCFE8" strokeWidth="3.4" strokeLinecap="round" opacity=".95" />
      <circle cx="32" cy="17" r="3.2" fill="#FBCFE8" />
    </svg>
  );
}
