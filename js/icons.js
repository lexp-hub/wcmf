/**
 * ============================================================================
 * WCMF STUDIO — ICON COMPONENT & SVG REGISTRY (js/icons.js)
 * ============================================================================
 * 
 * DESCRIPTION:
 * Central vector icon registry for WCMF Studio. Provides high-precision SVG
 * icons aligned with CMF by Nothing's industrial design language:
 * - 24x24 standard viewbox
 * - Distinctive dot accents (circle terminal nodes)
 * - 1.6px - 2.0px stroke weights with rounded caps
 * - Pure vector graphics (no external icon font dependencies)
 * 
 * MAINTAINER GUIDE:
 * - Individual standalone SVG files are mirrored in the `/icons/` directory.
 * - When adding a new icon, implement its JSX rendering function in `CMF_ICON_SVGS`
 *   and provide any useful aliases below.
 * - The component is mounted to `window.CmfDotIcon` for universal access across
 *   React views without bundler requirements.
 * ============================================================================
 */

const CMF_ICON_SVGS = {
  'flash': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13.5 2L5.5 13H11.5L9.5 22L18.5 10.5H12.5L14.5 2H13.5Z" fill={color} />
      <circle cx="13.5" cy="2" r="0.8" fill="#FFFFFF" />
      <circle cx="9.5" cy="22" r="0.8" fill="#FFFFFF" />
    </svg>
  ),
  'bluetooth': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6.5 6.5L17.5 17.5L12 22V2L17.5 6.5L6.5 17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="2" r="1.3" fill={color} />
      <circle cx="12" cy="22" r="1.3" fill={color} />
      <circle cx="17.5" cy="6.5" r="1.3" fill={color} />
      <circle cx="17.5" cy="17.5" r="1.3" fill={color} />
    </svg>
  ),
  'watch-prompt': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="9" y="1.5" width="6" height="4" rx="1.2" fill={color} opacity="0.4" />
      <rect x="9" y="18.5" width="6" height="4" rx="1.2" fill={color} opacity="0.4" />
      <circle cx="12" cy="12" r="7.5" stroke={color} strokeWidth="1.8" />
      <rect x="19.5" y="10" width="2" height="4" rx="0.8" fill={color} />
      <circle cx="12" cy="12" r="2.5" fill={color} />
    </svg>
  ),
  'analog-hands': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <circle cx="12" cy="4.5" r="1.2" fill={color} />
      <circle cx="19.5" cy="12" r="1.2" fill={color} />
      <circle cx="12" cy="19.5" r="1.2" fill={color} />
      <circle cx="4.5" cy="12" r="1.2" fill={color} />
      <line x1="12" y1="12" x2="12" y2="6.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="12" y1="12" x2="16.5" y2="12" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="12" x2="8" y2="16" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.2" fill="#121214" stroke={color} strokeWidth="1.6" />
    </svg>
  ),
  'radial-gauge': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
      <path d="M 12 3.5 A 8.5 8.5 0 1 1 3.5 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="3.5" cy="12" r="2.2" fill={color} />
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </svg>
  ),
  'time-bold': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.5" y="4.5" width="8.5" height="15" rx="2" stroke={color} strokeWidth="2" />
      <rect x="13" y="4.5" width="8.5" height="15" rx="2" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="12" cy="9.5" r="1.2" fill={color} />
      <circle cx="12" cy="14.5" r="1.2" fill={color} />
    </svg>
  ),
  'time-dot': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.6" opacity="0.45" />
      <circle cx="5.5" cy="8.5" r="1.1" fill={color} />
      <circle cx="5.5" cy="12" r="1.1" fill={color} />
      <circle cx="5.5" cy="15.5" r="1.1" fill={color} />
      <circle cx="8.5" cy="8.5" r="1.1" fill={color} />
      <circle cx="11" cy="8.5" r="1.1" fill={color} />
      <circle cx="8.5" cy="12" r="1.1" fill={color} />
      <circle cx="11" cy="12" r="1.1" fill={color} />
      <circle cx="8.5" cy="15.5" r="1.1" fill={color} />
      <circle cx="11" cy="15.5" r="1.1" fill={color} />
      <circle cx="13" cy="10" r="0.9" fill="#FFFFFF" />
      <circle cx="13" cy="14" r="0.9" fill="#FFFFFF" />
      <circle cx="15" cy="8.5" r="1.1" fill={color} />
      <circle cx="18" cy="8.5" r="1.1" fill={color} />
      <circle cx="15" cy="12" r="1.1" fill={color} />
      <circle cx="18" cy="12" r="1.1" fill={color} />
      <circle cx="15" cy="15.5" r="1.1" fill={color} />
      <circle cx="18" cy="15.5" r="1.1" fill={color} />
    </svg>
  ),
  'seconds-bar': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="4" cy="12" r="2" fill={color} />
      <circle cx="9.3" cy="12" r="2" fill={color} />
      <circle cx="14.6" cy="12" r="2" fill={color} />
      <circle cx="20" cy="12" r="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  ),
  'dot-grid': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="5" cy="5" r="1.8" fill={color} />
      <circle cx="12" cy="5" r="1.8" fill="rgba(255,255,255,0.4)" />
      <circle cx="19" cy="5" r="1.8" fill={color} />
      <circle cx="5" cy="12" r="1.8" fill="rgba(255,255,255,0.4)" />
      <circle cx="12" cy="12" r="2.2" fill={color} />
      <circle cx="19" cy="12" r="1.8" fill="rgba(255,255,255,0.4)" />
      <circle cx="5" cy="19" r="1.8" fill={color} />
      <circle cx="12" cy="19" r="1.8" fill="rgba(255,255,255,0.4)" />
      <circle cx="19" cy="19" r="1.8" fill={color} />
    </svg>
  ),
  'heart': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
      <circle cx="7.5" cy="8.5" r="1.2" fill="#FFFFFF" opacity="0.8" />
    </svg>
  ),
  'subdial': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" />
      <path d="M12 2.5 A 9.5 9.5 0 0 1 21.5 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="#141416" stroke={color} strokeWidth="1.8" />
      <line x1="12" y1="12" x2="17" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  'pill-stats': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="7" width="5.5" height="10" rx="2.75" fill={color} />
      <rect x="9.25" y="7" width="5.5" height="10" rx="2.75" fill="#FFFFFF" />
      <rect x="16.5" y="7" width="5.5" height="10" rx="2.75" fill={color} opacity="0.3" />
    </svg>
  ),
  'weather-sun': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill={color} />
      <circle cx="12" cy="3.5" r="1.3" fill={color} />
      <circle cx="12" cy="20.5" r="1.3" fill={color} />
      <circle cx="3.5" cy="12" r="1.3" fill={color} />
      <circle cx="20.5" cy="12" r="1.3" fill={color} />
      <circle cx="6" cy="6" r="1.3" fill={color} />
      <circle cx="18" cy="18" r="1.3" fill={color} />
      <circle cx="6" cy="18" r="1.3" fill={color} />
      <circle cx="18" cy="6" r="1.3" fill={color} />
    </svg>
  ),
  'calendar': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="13" r="1" fill={color} />
      <circle cx="12" cy="13" r="1" fill={color} />
      <circle cx="16.5" cy="13" r="1" fill={color} />
      <circle cx="7.5" cy="17" r="1" fill={color} />
      <circle cx="12" cy="17" r="1.3" fill={color} />
      <circle cx="16.5" cy="17" r="1" fill={color} />
    </svg>
  ),
  'battery': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="17" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M21.5 10v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="4.5" y="8.5" width="3.5" height="7" rx="1" fill={color} />
      <rect x="9" y="8.5" width="3.5" height="7" rx="1" fill={color} />
      <rect x="13.5" y="8.5" width="3.5" height="7" rx="1" fill={color} />
    </svg>
  ),
  'dial-ticks': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <line x1="12" y1="3" x2="12" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="12" x2="18" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="12" x2="6" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16.5" cy="7.5" r="1" fill="#888888" />
      <circle cx="16.5" cy="16.5" r="1" fill="#888888" />
      <circle cx="7.5" cy="16.5" r="1" fill="#888888" />
      <circle cx="7.5" cy="7.5" r="1" fill="#888888" />
    </svg>
  ),
  'ring': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5.5" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.8" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  ),
  'badge': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="6" stroke={color} strokeWidth="1.8" />
      <circle cx="8" cy="12" r="2.5" fill={color} />
      <line x1="13" y1="12" x2="17" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'typography': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="4" r="1.5" fill={color} />
      <circle cx="8.5" cy="9.5" r="1.5" fill={color} />
      <circle cx="15.5" cy="9.5" r="1.5" fill={color} />
      <circle cx="6" cy="15" r="1.5" fill={color} />
      <circle cx="10" cy="15" r="1.5" fill="#FFFFFF" />
      <circle cx="14" cy="15" r="1.5" fill="#FFFFFF" />
      <circle cx="18" cy="15" r="1.5" fill={color} />
      <circle cx="4" cy="20" r="1.5" fill={color} />
      <circle cx="20" cy="20" r="1.5" fill={color} />
    </svg>
  ),
  'copy': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="8" y="8" width="12" height="12" rx="2" stroke={color || 'currentColor'} strokeWidth="1.6" />
      <path d="M5 16H4C3.44772 16 3 15.5523 3 15V4C3 3.44772 3.44772 3 4 3H15C15.5523 3 16 3.44772 16 4V5" stroke={color || 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'trash': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 6H20M10 11V16M14 11V16M6 6L7 19C7 19.5523 7.44772 20 8 20H16C16.5523 20 17 19.5523 17 19L18 6M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6" stroke={color || 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'eye': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={color || 'currentColor'} strokeWidth="1.8" fill={color || 'currentColor'} />
    </svg>
  ),
  'eye-off': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  'crosshair': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color || 'currentColor'} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" fill={color || 'currentColor'} />
      <line x1="12" y1="1" x2="12" y2="5" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="23" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="1" y1="12" x2="5" y2="12" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="12" x2="23" y2="12" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  'check': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 12.5L9.5 17.5L19.5 6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="12.5" r="1.3" fill={color} />
      <circle cx="9.5" cy="17.5" r="1.3" fill={color} />
      <circle cx="19.5" cy="6.5" r="1.3" fill={color} />
    </svg>
  ),
  'cross': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="6" r="1.3" fill={color} />
      <circle cx="18" cy="18" r="1.3" fill={color} />
      <circle cx="18" cy="6" r="1.3" fill={color} />
      <circle cx="6" cy="18" r="1.3" fill={color} />
    </svg>
  ),
  'info': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="7.5" r="1.4" fill={color} />
      <line x1="12" y1="11" x2="12" y2="16.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'download': (s, color, className) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3.5V14.5M7.5 10.5L12 15L16.5 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4.5" y1="19.5" x2="19.5" y2="19.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
};

// Aliases
CMF_ICON_SVGS['spark'] = CMF_ICON_SVGS['flash'];
CMF_ICON_SVGS['bolt'] = CMF_ICON_SVGS['flash'];
CMF_ICON_SVGS['ble'] = CMF_ICON_SVGS['bluetooth'];
CMF_ICON_SVGS['watch'] = CMF_ICON_SVGS['watch-prompt'];
CMF_ICON_SVGS['check-dot'] = CMF_ICON_SVGS['check'];
CMF_ICON_SVGS['cross-dot'] = CMF_ICON_SVGS['cross'];

function CmfDotIcon({ name, size = 18, color = '#FF4400', className = '' }) {
  const renderer = CMF_ICON_SVGS[name];
  if (renderer) {
    return renderer(size, color, className);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
  );
}

// Attach to window for global access
window.CmfDotIcon = CmfDotIcon;
window.CMF_ICON_SVGS = CMF_ICON_SVGS;
