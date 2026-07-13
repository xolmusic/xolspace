// Icones des reseaux sociaux (glyphes officiels reproduits en SVG).
// Utilisees comme liens vers les profils des artistes sur la page EPK.

type IconProps = { size?: number };

export function InstagramIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="0.3" cy="1" r="1">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.25" stopColor="#FA7E1E" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="0.75" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  );
}

export function TikTokIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
      <path
        d="M15.2 6.2c.35 1.2 1.2 2.15 2.35 2.5v1.9c-.95 0-1.85-.28-2.6-.75v3.85c0 2.2-1.78 3.85-3.9 3.85-2.05 0-3.7-1.6-3.7-3.6 0-2.1 1.75-3.75 3.95-3.5v1.95c-.2-.06-.42-.1-.65-.1-.95 0-1.65.72-1.65 1.65 0 .95.72 1.7 1.65 1.7.95 0 1.7-.72 1.7-1.7V6.2h2.85z"
        fill="#fff"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#1877F2" />
      <path
        d="M14.2 12.2h1.7l.3-2.1h-2v-1.3c0-.6.2-1 1.05-1H16.3V5.9c-.3-.04-1.05-.13-1.9-.13-1.9 0-3.15 1.15-3.15 3.25v1.18H9.4v2.1h1.85V19h2.95v-6.8z"
        fill="#fff"
      />
    </svg>
  );
}

export function SpotifyIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1DB954" />
      <path d="M7 9.6c3-0.8 6.3-0.5 8.9 1" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.6 12.4c2.5-0.65 5.2-0.4 7.3 0.9" fill="none" stroke="#fff" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M8.2 15c2-0.5 4.1-0.3 5.8 0.7" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AppleMusicIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="am-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FB5C74" />
          <stop offset="1" stopColor="#FA233B" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#am-grad)" />
      <path
        d="M15.5 7.2l-5 1.1c-.35.08-.6.4-.6.76v4.9c-.3-.16-.66-.24-1.05-.2-.9.1-1.6.78-1.55 1.56.05.72.78 1.2 1.65 1.1.86-.1 1.5-.72 1.5-1.5V10.2l4-0.9v3.28c-.3-.16-.66-.24-1.05-.2-.9.1-1.6.78-1.55 1.56.05.72.78 1.2 1.65 1.1.86-.1 1.5-.72 1.5-1.5V7.9c0-.46-.42-.8-.85-.7z"
        fill="#fff"
      />
    </svg>
  );
}
