/**
 * ============================================================================
 * WCMF STUDIO — CORE APPLICATION & HARDWARE FLASHING ENGINE (js/app.js)
 * ============================================================================
 * 
 * Open Source Watchface Studio & Web Bluetooth Flasher for CMF by Nothing Devices
 * Architecture Overview:
 * 
 * 1. UI & DESIGN SYSTEM:
 *    - React SPA with pure CMF by Nothing industrial design language.
 *    - Parametric canvas editor with drag-and-drop, alignment guides, and live preview.
 *    - SVG Vector icon system with dot-matrix accent styling (/icons/*.svg).
 * 
 * 2. BINARY CONTAINER COMPILER (Zephyr RTOS TLV Format):
 *    - Rasterizes the canvas into a 16-bit RGB565 raw framebuffer.
 *    - Generates official Type-Length-Value (TLV) tree structures for Zephyr RTOS:
 *      Root (0x20) -> Main Screen (0x21) -> Image (0x30) -> Struct (0x01).
 *    - Computes CRC32 checksums for resources payload and 36-byte header/footer.
 * 
 * 3. WEB BLUETOOTH (BLE) HARDWARE DRIVER & OTA FLASHER:
 *    - GATT Client for Goodix GR5515 BLE SoC used in CMF Watch Pro 2 / Pro.
 *    - Challenge-Response pairing handshake via AT shell (`AT GETSECRET`).
 *    - AES-CBC 128-bit encrypted command channel with dynamic session keys.
 *    - Unencrypted high-throughput OTA chunk streaming (`wfChunkWrite`).
 * 
 * MAINTAINER CONSTRAINTS:
 * - Do NOT use emojis in code or UI (use CmfDotIcon components).
 * - Maintain exact 4ms pacing on BLE packet writes to prevent BlueZ buffer overruns.
 * - Keep official branding to "OPEN SOURCE BY LEX" in the top bar.
 * ============================================================================
 */

// ==========================================
// 1. CMF DOT-MATRIX SVG ICON SYSTEM
// ==========================================
// Standalone SVG files are located in /icons/
// Component definition loaded from js/icons.js
const CmfDotIcon = window.CmfDotIcon || function({ name, size = 18, color = '#FF4400', className = '' }) {
  const renderer = window.CMF_ICON_SVGS && window.CMF_ICON_SVGS[name];
  if (renderer) return renderer(size, color, className);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
  );
};

// ==========================================
// 2. DOT MATRIX BITMAP FONT & ICON ENGINE
// ==========================================
const DOT_MATRIX_5X7 = {
  '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
  '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  '3': [[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
  '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
  '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
  '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  ':': [[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '.': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]],
  '-': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '/': [[0,0,0,0,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[1,0,0,0,0]],
  '°': [[0,1,1,0,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'B': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
  'C': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,1]],
  'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
  'E': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'F': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  'G': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1]],
  'H': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'I': [[0,1,1,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
  'J': [[0,0,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
  'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'P': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,0],[0,1,1,0,1]],
  'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  'S': [[0,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,1,0,1,0],[0,0,1,0,0]],
  'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
  'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,0,0,0,1]],
  'Y': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'Z': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '%': [[1,1,0,0,1],[1,1,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,1,1],[1,0,0,1,1],[0,0,0,0,0]]
};

const DOT_MATRIX_ICONS = {
  heart: [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0]
  ],
  footstep: [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,0,0,0]
  ],
  sun: [
    [0,0,0,1,0,0,0],
    [1,0,1,1,1,0,1],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [1,0,1,1,1,0,1],
    [0,0,0,1,0,0,0]
  ],
  cloud: [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ],
  rain: [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0],
    [0,1,0,1,0,1,0],
    [1,0,1,0,1,0,0],
    [0,1,0,1,0,0,0]
  ],
  battery: [
    [0,1,1,1,1,1,0],
    [1,0,0,0,0,0,1],
    [1,1,1,1,0,0,1],
    [1,1,1,1,0,0,1],
    [1,1,1,1,0,0,1],
    [1,0,0,0,0,0,1],
    [0,1,1,1,1,1,0]
  ],
  // Easter egg: Retro Arcade Icons
  invader: [
    [0,0,1,0,1,0,0],
    [0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0],
    [1,1,0,1,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1]
  ],
  ghost: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,0,1,1,0,1,1],
    [1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,0,1,0,1,0,1]
  ]
};

function drawDotMatrixText(ctx, text, x, y, options = {}) {
  const {
    dotSize = 3,
    dotGap = 2,
    charGap = 4,
    color = '#FFFFFF',
    dimColor = null,
    align = 'left'
  } = options;

  const chars = String(text).toUpperCase().split('');
  const charWidth = 5 * dotSize + 4 * dotGap;
  const charHeight = 7 * dotSize + 6 * dotGap;
  const totalWidth = chars.length * charWidth + Math.max(0, chars.length - 1) * charGap;

  let startX = x;
  if (align === 'center') {
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    startX = x - totalWidth;
  }
  const startY = y - charHeight / 2;

  chars.forEach((char, charIdx) => {
    const bitmap = DOT_MATRIX_5X7[char] || DOT_MATRIX_5X7[' '];
    const currCharX = startX + charIdx * (charWidth + charGap);

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        const isLit = bitmap[r] && bitmap[r][c] === 1;
        const dotX = currCharX + c * (dotSize + dotGap) + dotSize / 2;
        const dotY = startY + r * (dotSize + dotGap) + dotSize / 2;

        if (isLit) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (dimColor) {
          ctx.fillStyle = dimColor;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  return { width: totalWidth, height: charHeight };
}

function drawDotMatrixIcon(ctx, iconName, x, y, options = {}) {
  const {
    dotSize = 3,
    dotGap = 2,
    color = '#FF4400',
    align = 'center'
  } = options;

  const bitmap = DOT_MATRIX_ICONS[iconName];
  if (!bitmap) return { width: 0, height: 0 };

  const iconWidth = 7 * dotSize + 6 * dotGap;
  const iconHeight = 7 * dotSize + 6 * dotGap;

  let startX = x;
  if (align === 'center') {
    startX = x - iconWidth / 2;
  } else if (align === 'right') {
    startX = x - iconWidth;
  }
  const startY = y - iconHeight / 2;

  ctx.fillStyle = color;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (bitmap[r] && bitmap[r][c] === 1) {
        const dotX = startX + c * (dotSize + dotGap) + dotSize / 2;
        const dotY = startY + r * (dotSize + dotGap) + dotSize / 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return { width: iconWidth, height: iconHeight };
}

// ==========================================
// 3. PRESETS & DESIGN SYSTEM CONFIG
// ==========================================
const SUPPORTED_DEVICES = {
  'watch-pro-2': {
    id: 'watch-pro-2',
    name: 'CMF Watch Pro 2',
    shortName: 'Watch Pro 2',
    shape: 'round',
    width: 466,
    height: 466,
    display: '1.32" AMOLED • 466×466',
    hardwareId: 0x02,
    badge: 'Round 466px',
    description: '1.32" Round AMOLED (466×466) with interchangeable bezels and modular dial widgets.',
    bezels: [
      { id: 'dark-flat', name: 'Dark Grey Flat', color: '#242426', accent: '#18181A', style: 'flat' },
      { id: 'dark-knurled', name: 'Dark Grey Knurled', color: '#1F1F22', accent: '#333338', style: 'knurled' },
      { id: 'ash-grey', name: 'Ash Grey Bezel', color: '#48484E', accent: '#62626A', style: 'raised' },
      { id: 'orange-accent', name: 'CMF Orange Bezel', color: '#FF4400', accent: '#D63700', style: 'sport' },
      { id: 'raw-silver', name: 'Brushed Silver', color: '#A2A2A8', accent: '#CCCCCC', style: 'metallic' },
      { id: 'light-green', name: 'Light Green Bezel', color: '#B7E576', accent: '#95C454', style: 'sport' },
      { id: 'matte-blue', name: 'Matte Blue Bezel', color: '#1B334B', accent: '#112233', style: 'flat' }
    ]
  },
  'watch-3-pro': {
    id: 'watch-3-pro',
    name: 'CMF Watch 3 Pro',
    shortName: 'Watch 3 Pro',
    shape: 'round',
    width: 466,
    height: 466,
    display: '1.43" AMOLED • 466×466 (650 Nits)',
    hardwareId: 0x03,
    badge: 'Round 466px • 1.43"',
    description: '1.43" Round AMOLED (466×466, 650 nits) with titanium/ceramic sport styling.',
    bezels: [
      { id: 'matte-titanium', name: 'Matte Titanium Bezel', color: '#2C2D32', accent: '#45464E', style: 'flat' },
      { id: 'ceramic-white', name: 'Ceramic White Bezel', color: '#E4E7EB', accent: '#C8CCD0', style: 'flat' },
      { id: 'stealth-black', name: 'Midnight Stealth Knurled', color: '#121214', accent: '#222226', style: 'knurled' },
      { id: 'neon-orange-pro', name: 'Neon Orange Pro Ring', color: '#FF4400', accent: '#FF5E1E', style: 'sport' },
      { id: 'cyber-green', name: 'Cyber Green Sport', color: '#99E335', accent: '#72B51B', style: 'sport' }
    ]
  },
  'watch-pro-1': {
    id: 'watch-pro-1',
    name: 'CMF Watch Pro',
    shortName: 'Watch Pro',
    shape: 'squircle',
    width: 410,
    height: 502,
    display: '1.96" AMOLED • 410×502',
    hardwareId: 0x00,
    badge: 'Squircle 410×502',
    description: '1.96" Squircle AMOLED (410×502) optimized for large typography and stat pills.',
    bezels: [
      { id: 'dark-metallic', name: 'Dark Metallic Case', color: '#1E1E22', accent: '#2C2C32', style: 'squircle' },
      { id: 'silver-aluminum', name: 'Silver Aluminum Case', color: '#888890', accent: '#AAAAAA', style: 'squircle' },
      { id: 'orange-edition', name: 'CMF Orange Case', color: '#FF4400', accent: '#D63700', style: 'squircle' }
    ]
  },
  'watch-compact': {
    id: 'watch-compact',
    name: 'CMF Watch Band / Compact',
    shortName: 'Watch Band',
    shape: 'rect',
    width: 280,
    height: 456,
    display: '1.64" AMOLED • 280×456',
    hardwareId: 0x04,
    badge: 'Rect 280×456',
    description: '1.64" Rectangular AMOLED (280×456) slim sports band layout.',
    bezels: [
      { id: 'charcoal-frame', name: 'Charcoal Matte Frame', color: '#18181A', accent: '#2A2A2E', style: 'rect' },
      { id: 'orange-frame', name: 'CMF Orange Sport Frame', color: '#FF4400', accent: '#D63700', style: 'rect' },
      { id: 'ash-frame', name: 'Ash Grey Slim Frame', color: '#48484E', accent: '#62626A', style: 'rect' }
    ]
  }
};

const BEZELS_WATCH_PRO_2 = SUPPORTED_DEVICES['watch-pro-2'].bezels;

const getDeviceConfig = (devId) => {
  return SUPPORTED_DEVICES[devId] || SUPPORTED_DEVICES['watch-pro-2'];
};

const getDeviceBezels = (devId) => {
  return getDeviceConfig(devId).bezels || [];
};

const STRAPS = [
  { id: 'orange', name: 'CMF Signature Orange', color: '#FF4400' },
  { id: 'dark', name: 'Dark Ash / Charcoal', color: '#1E1E22' },
  { id: 'light-grey', name: 'Light Cool Grey', color: '#5C5C64' },
  { id: 'blue-slate', name: 'Blue Slate', color: '#2B3542' }
];

const CMF_PALETTE = [
  { name: 'CMF Orange', hex: '#FF4400' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Matte Ash', hex: '#8E8E93' },
  { name: 'Slate Dark', hex: '#2A2A30' },
  { name: 'Cyber Yellow', hex: '#E5F33D' },
  { name: 'Cyan Tech', hex: '#00F0FF' },
  { name: 'Vibrant Crimson', hex: '#FF3B30' },
  { name: 'Active Green', hex: '#30D158' },
  { name: 'Deep Black', hex: '#0A0A0C' }
];

const PRESETS = [
  {
    id: 'cmf-ndot-core',
    name: 'CMF N-Dot Core',
    description: 'Iconic Nothing dot-matrix digital clock with CMF Orange activity ring and weather widget.',
    device: 'watch-pro-2',
    bezel: 'orange-accent',
    strap: 'orange',
    backgroundColor: '#0C0C0E',
    elements: [
      {
        id: 'bg-grid',
        type: 'dot-grid',
        name: 'Background Dot Grid',
        x: 233,
        y: 233,
        radius: 215,
        dotSpacing: 18,
        dotSize: 1.5,
        color: 'rgba(255, 255, 255, 0.08)',
        locked: true
      },
      {
        id: 'step-ring',
        type: 'radial-gauge',
        name: 'Steps Progress Ring',
        x: 233,
        y: 233,
        radius: 195,
        strokeWidth: 8,
        startAngle: -90,
        endAngle: 180,
        progress: 0.74,
        color: '#FF4400',
        trackColor: 'rgba(255, 68, 0, 0.15)',
        dashCount: 40,
        cap: 'round'
      },
      {
        id: 'dial-ticks',
        type: 'dial-ticks',
        name: 'Hour Markers',
        x: 233,
        y: 233,
        radius: 215,
        tickLength: 6,
        tickCount: 12,
        strokeWidth: 2,
        color: '#8E8E93',
        majorEvery: 3,
        majorColor: '#FF4400',
        majorLength: 10
      },
      {
        id: 'time-digital',
        type: 'digital-time-dot',
        name: 'N-Dot Clock',
        x: 233,
        y: 200,
        dotSize: 5.5,
        dotGap: 2.5,
        charGap: 6,
        color: '#FFFFFF',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'date-badge',
        type: 'date-badge',
        name: 'Date & Day Badge',
        x: 233,
        y: 265,
        fontSize: 13,
        fontFamily: 'sans',
        color: '#8E8E93',
        accentColor: '#FF4400',
        format: 'EEE dd MMM',
        style: 'capsule'
      },
      {
        id: 'weather-widget',
        type: 'weather-widget',
        name: 'Weather Status',
        x: 160,
        y: 330,
        iconSize: 2.5,
        color: '#FFFFFF',
        iconColor: '#FF4400',
        condition: 'sun',
        temp: '23°'
      },
      {
        id: 'bpm-widget',
        type: 'heartrate-widget',
        name: 'Heart Rate BPM',
        x: 306,
        y: 330,
        bpm: 78,
        color: '#FFFFFF',
        accentColor: '#FF4400'
      },
      {
        id: 'cmf-logo',
        type: 'text-badge',
        name: 'CMF Logo Inscription',
        x: 233,
        y: 120,
        text: 'cmf by NOTHING',
        fontSize: 10,
        letterSpacing: 2,
        color: '#55555B',
        style: 'plain'
      }
    ]
  },
  {
    id: 'cmf-skeleton-test',
    name: 'CMF Skeleton (Low-Load Safe Test)',
    description: 'Minimal zero-overhead baseline dial (static digital clock, zero trigonometry, pitch-black background) for crash and WDT isolation tests.',
    device: 'watch-pro-2',
    bezel: 'dark-flat',
    strap: 'dark',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'skel-time',
        type: 'digital-time-dot',
        name: 'N-Dot Time',
        x: 233,
        y: 215,
        dotSize: 6,
        dotGap: 3,
        charGap: 8,
        color: '#FFFFFF',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'skel-label',
        type: 'custom-text',
        name: 'Safe Test Label',
        x: 233,
        y: 285,
        text: 'BASELINE STABILITY TEST',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'mono',
        color: '#8E8E93'
      }
    ]
  },
  {
    id: 'cmf-bauhaus-chrono',
    name: 'Bauhaus Orange Chrono',
    description: 'Clean industrial analog hands with signature orange accents and quadrant dial markers.',
    device: 'watch-pro-2',
    bezel: 'ash-grey',
    strap: 'dark',
    backgroundColor: '#0F0F12',
    elements: [
      {
        id: 'outer-ring',
        type: 'ring',
        name: 'Outer Bezel Track',
        x: 233,
        y: 233,
        radius: 205,
        strokeWidth: 2,
        color: '#2A2A30',
        fill: 'transparent'
      },
      {
        id: 'dial-ticks-60',
        type: 'dial-ticks',
        name: '60-Sec Dial Ticks',
        x: 233,
        y: 233,
        radius: 195,
        tickLength: 6,
        tickCount: 60,
        strokeWidth: 1.5,
        color: '#3A3A40',
        majorEvery: 5,
        majorColor: '#FFFFFF',
        majorLength: 12
      },
      {
        id: 'subdial-steps',
        type: 'subdial',
        name: 'Subdial Steps (9H)',
        x: 140,
        y: 233,
        radius: 45,
        progress: 0.82,
        color: '#FF4400',
        label: '7,420',
        sublabel: 'STEPS'
      },
      {
        id: 'subdial-battery',
        type: 'subdial',
        name: 'Subdial Battery (3H)',
        x: 326,
        y: 233,
        radius: 45,
        progress: 0.88,
        color: '#E5F33D',
        label: '88%',
        sublabel: 'BATTERY'
      },
      {
        id: 'brand-mark',
        type: 'text-badge',
        name: 'Model Inscription',
        x: 233,
        y: 135,
        text: 'PRO 2 • 5ATM',
        fontSize: 10,
        letterSpacing: 2,
        color: '#666670',
        style: 'plain'
      },
      {
        id: 'date-window',
        type: 'date-badge',
        name: 'Date Window (6H)',
        x: 233,
        y: 330,
        fontSize: 14,
        fontFamily: 'mono',
        color: '#FFFFFF',
        accentColor: '#FF4400',
        format: 'dd',
        style: 'box'
      },
      {
        id: 'analog-hands',
        type: 'analog-hands',
        name: 'Bauhaus Hands',
        x: 233,
        y: 233,
        hourHandLength: 90,
        hourHandWidth: 7,
        hourHandColor: '#FFFFFF',
        minHandLength: 140,
        minHandWidth: 5,
        minHandColor: '#E5E5E5',
        secHandLength: 160,
        secHandWidth: 2,
        secHandColor: '#FF4400',
        secDotRadius: 6,
        centerCapRadius: 9,
        centerCapColor: '#121212',
        centerCapBorder: '#FF4400'
      }
    ]
  },
  {
    id: 'cmf-modular-rings',
    name: 'Modular Triple Ring',
    description: 'Concentric activity tracking rings (Steps, Calories, Stand) with center digital readout.',
    device: 'watch-pro-2',
    bezel: 'dark-flat',
    strap: 'orange',
    backgroundColor: '#0A0A0C',
    elements: [
      {
        id: 'ring-steps',
        type: 'radial-gauge',
        name: 'Steps Ring (Outer)',
        x: 233,
        y: 233,
        radius: 200,
        strokeWidth: 10,
        startAngle: -90,
        endAngle: 270,
        progress: 0.78,
        color: '#FF4400',
        trackColor: 'rgba(255, 68, 0, 0.12)',
        cap: 'round'
      },
      {
        id: 'ring-calories',
        type: 'radial-gauge',
        name: 'Calories Ring (Mid)',
        x: 233,
        y: 233,
        radius: 180,
        strokeWidth: 10,
        startAngle: -90,
        endAngle: 270,
        progress: 0.62,
        color: '#E5F33D',
        trackColor: 'rgba(229, 243, 61, 0.12)',
        cap: 'round'
      },
      {
        id: 'ring-active',
        type: 'radial-gauge',
        name: 'Active Ring (Inner)',
        x: 233,
        y: 233,
        radius: 160,
        strokeWidth: 10,
        startAngle: -90,
        endAngle: 270,
        progress: 0.90,
        color: '#00F0FF',
        trackColor: 'rgba(0, 240, 255, 0.12)',
        cap: 'round'
      },
      {
        id: 'time-digital',
        type: 'digital-time-bold',
        name: 'Bold Time',
        x: 233,
        y: 215,
        fontSize: 54,
        fontFamily: 'sans',
        color: '#FFFFFF',
        showSeconds: false
      },
      {
        id: 'date-badge',
        type: 'date-badge',
        name: 'Date Pill',
        x: 233,
        y: 270,
        fontSize: 12,
        color: '#A0A0A8',
        accentColor: '#FF4400',
        format: 'EEE • dd MMM',
        style: 'capsule'
      },
      {
        id: 'battery-bar',
        type: 'battery-widget',
        name: 'Battery Bar',
        x: 233,
        y: 310,
        level: 82,
        color: '#8E8E93',
        fillColor: '#FF4400'
      }
    ]
  },
  {
    id: 'cmf-typo-stack',
    name: 'Typo Stack Bold (Squircle)',
    description: 'Massive stacked geometric numerals optimized for the CMF Watch Pro squircle display.',
    device: 'watch-pro-1',
    bezel: 'metallic-orange',
    strap: 'orange',
    backgroundColor: '#0D0D10',
    elements: [
      {
        id: 'hours-big',
        type: 'custom-text',
        name: 'Hours (Orange)',
        x: 205,
        y: 155,
        text: '10',
        fontSize: 130,
        fontWeight: '800',
        fontFamily: 'sans',
        color: '#FF4400',
        letterSpacing: -4
      },
      {
        id: 'minutes-big',
        type: 'custom-text',
        name: 'Minutes (White)',
        x: 205,
        y: 275,
        text: '09',
        fontSize: 130,
        fontWeight: '800',
        fontFamily: 'sans',
        color: '#FFFFFF',
        letterSpacing: -4
      },
      {
        id: 'stats-bar-bottom',
        type: 'pill-stats-row',
        name: 'Bottom Stats Row',
        x: 205,
        y: 410,
        steps: '8,310',
        bpm: '72',
        battery: '91%',
        color: '#8E8E93',
        accentColor: '#FF4400'
      },
      {
        id: 'date-top',
        type: 'date-badge',
        name: 'Top Date',
        x: 205,
        y: 60,
        fontSize: 14,
        color: '#FFFFFF',
        accentColor: '#FF4400',
        format: 'TUESDAY • 15 SEP',
        style: 'plain'
      }
    ]
  },
  {
    id: 'cmf-dark-matrix',
    name: 'Industrial Dark Matrix',
    description: 'All-over high density dot matrix grid with illuminated glyph characters.',
    device: 'watch-pro-2',
    bezel: 'dark-knurled',
    strap: 'dark',
    backgroundColor: '#080809',
    elements: [
      {
        id: 'full-dot-grid',
        type: 'dot-grid',
        name: 'Dense Matrix Canvas',
        x: 233,
        y: 233,
        radius: 220,
        dotSpacing: 12,
        dotSize: 1.8,
        color: 'rgba(255, 255, 255, 0.05)',
        locked: true
      },
      {
        id: 'ndot-time-lg',
        type: 'digital-time-dot',
        name: 'N-Dot Huge Clock',
        x: 233,
        y: 190,
        dotSize: 6.5,
        dotGap: 3,
        charGap: 8,
        color: '#FF4400',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'ndot-sec-bar',
        type: 'seconds-dot-bar',
        name: 'Dot Seconds Progress',
        x: 233,
        y: 245,
        dotCount: 30,
        dotSize: 3,
        color: '#FFFFFF',
        dimColor: 'rgba(255,255,255,0.1)'
      },
      {
        id: 'matrix-date',
        type: 'custom-text-dot',
        name: 'Matrix Date',
        x: 233,
        y: 295,
        text: 'SEP 15 TUE',
        dotSize: 2.8,
        dotGap: 1.8,
        charGap: 4,
        color: '#FFFFFF'
      },
      {
        id: 'matrix-steps',
        type: 'custom-text-dot',
        name: 'Matrix Steps Count',
        x: 233,
        y: 340,
        text: '9420 STP',
        dotSize: 2.8,
        dotGap: 1.8,
        charGap: 4,
        color: '#8E8E93'
      }
    ]
  },
  {
    id: 'cmf-aod-stealth',
    name: 'Stealth AOD (Always-On)',
    description: 'Ultra-low-power dark theme designed for CMF AMOLED Always-On Display with zero pixel burn-in.',
    device: 'watch-pro-2',
    bezel: 'dark-flat',
    strap: 'dark',
    backgroundColor: '#000000',
    elements: [
      {
        id: 'aod-time',
        type: 'digital-time-dot',
        name: 'AOD N-Dot Time',
        x: 233,
        y: 210,
        dotSize: 5,
        dotGap: 3,
        charGap: 7,
        color: '#AAAAAA',
        dimColor: 'transparent',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'aod-date',
        type: 'date-badge',
        name: 'AOD Date',
        x: 233,
        y: 260,
        fontSize: 12,
        color: '#666666',
        accentColor: '#FF4400',
        format: '15.09 TUE',
        style: 'plain'
      },
      {
        id: 'aod-battery-dot',
        type: 'battery-widget',
        name: 'AOD Battery Pill',
        x: 233,
        y: 290,
        level: 84,
        color: '#444444',
        fillColor: '#FF4400'
      }
    ]
  },
  {
    id: 'cmf-w3pro-titanium',
    name: 'CMF Watch 3 Pro Titanium Chrono',
    description: '1.43" Ultra-Bright AMOLED layout with dual mini sub-dials, precision tick markers, and neon orange sport accent.',
    device: 'watch-3-pro',
    bezel: 'matte-titanium',
    strap: 'dark',
    backgroundColor: '#0A0A0D',
    elements: [
      {
        id: 'w3-outer-track',
        type: 'ring',
        name: 'Precision Outer Bezel Track',
        x: 233,
        y: 233,
        radius: 218,
        strokeWidth: 2,
        color: '#333338',
        fill: 'transparent'
      },
      {
        id: 'w3-dial-ticks',
        type: 'dial-ticks',
        name: 'Precision Minute Markers',
        x: 233,
        y: 233,
        radius: 210,
        tickLength: 6,
        tickCount: 60,
        strokeWidth: 1.5,
        color: '#55555F',
        majorEvery: 5,
        majorColor: '#FF4400',
        majorLength: 12
      },
      {
        id: 'w3-subdial-hr',
        type: 'subdial',
        name: 'Heart Rate BPM Gauge',
        x: 140,
        y: 233,
        radius: 46,
        progress: 0.76,
        color: '#FF4400',
        label: '76',
        sublabel: 'BPM'
      },
      {
        id: 'w3-subdial-bat',
        type: 'subdial',
        name: 'Battery Level Gauge',
        x: 326,
        y: 233,
        radius: 46,
        progress: 0.92,
        color: '#99E335',
        label: '92%',
        sublabel: 'BATTERY'
      },
      {
        id: 'w3-brand',
        type: 'text-badge',
        name: 'Watch 3 Pro Inscription',
        x: 233,
        y: 130,
        text: 'WATCH 3 PRO • 650 NITS',
        fontSize: 9,
        letterSpacing: 2,
        color: '#777780',
        style: 'plain'
      },
      {
        id: 'w3-date',
        type: 'date-badge',
        name: 'Date Badge (6H)',
        x: 233,
        y: 335,
        fontSize: 13,
        fontFamily: 'mono',
        color: '#FFFFFF',
        accentColor: '#FF4400',
        format: 'EEE dd',
        style: 'capsule'
      },
      {
        id: 'w3-analog-hands',
        type: 'analog-hands',
        name: 'Titanium Sport Hands',
        x: 233,
        y: 233,
        hourHandLength: 95,
        hourHandWidth: 7,
        hourHandColor: '#FFFFFF',
        minHandLength: 145,
        minHandWidth: 5,
        minHandColor: '#E0E0E0',
        secHandLength: 165,
        secHandWidth: 2,
        secHandColor: '#FF4400',
        secDotRadius: 6,
        centerCapRadius: 9,
        centerCapColor: '#121212',
        centerCapBorder: '#FF4400'
      }
    ]
  },
  {
    id: 'cmf-band-vertical',
    name: 'CMF Band Minimal Fitness',
    description: 'Compact vertical layout with stacked N-Dot digital clock, vertical fitness meter, and quick-glance status.',
    device: 'watch-compact',
    bezel: 'charcoal-frame',
    strap: 'orange',
    backgroundColor: '#09090B',
    elements: [
      {
        id: 'band-clock-hrs',
        type: 'digital-time-dot',
        name: 'N-Dot Hours',
        x: 140,
        y: 125,
        dotSize: 5.5,
        dotGap: 2.5,
        charGap: 6,
        color: '#FF4400',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'band-date',
        type: 'date-badge',
        name: 'Date Pill',
        x: 140,
        y: 195,
        fontSize: 12,
        color: '#8E8E93',
        accentColor: '#FF4400',
        format: 'EEE dd MMM',
        style: 'capsule'
      },
      {
        id: 'band-steps-ring',
        type: 'radial-gauge',
        name: 'Activity Arch',
        x: 140,
        y: 290,
        radius: 65,
        strokeWidth: 8,
        startAngle: -120,
        endAngle: 120,
        progress: 0.84,
        color: '#FF4400',
        trackColor: 'rgba(255, 68, 0, 0.15)',
        cap: 'round'
      },
      {
        id: 'band-steps-txt',
        type: 'custom-text',
        name: 'Steps Metric',
        x: 140,
        y: 285,
        text: '8,420',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'sans',
        color: '#FFFFFF'
      },
      {
        id: 'band-steps-sub',
        type: 'custom-text',
        name: 'Steps Label',
        x: 140,
        y: 305,
        text: 'STEPS',
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'sans',
        color: '#8E8E93'
      },
      {
        id: 'band-bpm-row',
        type: 'heartrate-widget',
        name: 'Heart Rate',
        x: 140,
        y: 395,
        bpm: 74,
        color: '#FFFFFF',
        accentColor: '#FF4400'
      }
    ]
  },
  {
    id: 'lex-cyber-glyph',
    name: 'Lex Cyber Glyph 1984',
    description: 'Secret Easter Egg: High-contrast cyberpunk Nothing Glyph interface with dual telemetry subdials.',
    device: 'watch-pro-2',
    bezel: 'orange-accent',
    strap: 'orange',
    backgroundColor: '#070709',
    elements: [
      {
        id: 'cyber-grid',
        type: 'dot-grid',
        name: 'Matrix Grid',
        x: 233,
        y: 233,
        radius: 215,
        dotSpacing: 16,
        dotSize: 1.4,
        color: 'rgba(255, 68, 0, 0.12)',
        locked: true
      },
      {
        id: 'cyber-ring',
        type: 'radial-gauge',
        name: 'Glyph Perimeter',
        x: 233,
        y: 233,
        radius: 202,
        strokeWidth: 4,
        startAngle: -90,
        endAngle: 270,
        progress: 1.0,
        color: '#FF4400',
        trackColor: 'rgba(255, 255, 255, 0.08)',
        dashCount: 48,
        cap: 'round'
      },
      {
        id: 'cyber-ticks',
        type: 'dial-ticks',
        name: 'Cyber Ticks',
        x: 233,
        y: 233,
        radius: 185,
        tickLength: 6,
        tickCount: 24,
        strokeWidth: 2,
        color: '#8E8E93',
        majorEvery: 6,
        majorColor: '#FF4400',
        majorLength: 12
      },
      {
        id: 'cyber-invader',
        type: 'dot-icon',
        name: 'Retro Invader',
        x: 233,
        y: 135,
        icon: 'invader',
        dotSize: 2.8,
        dotGap: 1.8,
        color: '#FF4400'
      },
      {
        id: 'cyber-time',
        type: 'digital-time-dot',
        name: 'N-Dot Time',
        x: 233,
        y: 205,
        dotSize: 5.5,
        dotGap: 2.5,
        charGap: 6,
        color: '#FFFFFF',
        showSeconds: false,
        format24h: true
      },
      {
        id: 'cyber-seconds',
        type: 'seconds-bar',
        name: 'Seconds Matrix',
        x: 233,
        y: 260,
        width: 140,
        height: 7,
        segmentCount: 20,
        activeColor: '#FF4400',
        inactiveColor: 'rgba(255, 68, 0, 0.2)'
      },
      {
        id: 'cyber-battery',
        type: 'subdial',
        name: 'Battery Subdial',
        x: 160,
        y: 330,
        radius: 38,
        strokeWidth: 3.5,
        value: 88,
        color: '#30D158',
        label: 'BATTERY'
      },
      {
        id: 'cyber-steps',
        type: 'subdial',
        name: 'Activity Subdial',
        x: 306,
        y: 330,
        radius: 38,
        strokeWidth: 3.5,
        value: 76,
        color: '#00F0FF',
        label: 'ACTIVITY'
      },
      {
        id: 'cyber-brand',
        type: 'custom-text',
        name: 'Lex Signature',
        x: 233,
        y: 395,
        text: 'LEX • CYBER 1984',
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'mono',
        color: '#FF4400'
      }
    ]
  }
];

// ==========================================
// 4. CANVAS 2D RENDERING PIPELINE
// ==========================================
function renderWatchface(ctx, width, height, elements, options = {}) {
  const {
    now = new Date(),
    isAOD = false,
    selectedId = null,
    isExport = false,
    backgroundColor = '#0A0A0C',
    showGrid = false
  } = options;

  ctx.save();
  ctx.fillStyle = isAOD ? '#000000' : backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (showGrid && !isExport && !isAOD) {
    ctx.strokeStyle = 'rgba(255, 68, 0, 0.08)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 68, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  elements.forEach(el => {
    if (el.visible === false) return;
    if (isAOD && el.hideInAOD) return;

    ctx.save();
    renderElement(ctx, el, now, isAOD);
    ctx.restore();
  });

  if (!isExport && !isAOD && selectedId) {
    const selectedEl = elements.find(el => el.id === selectedId);
    if (selectedEl) {
      renderSelectionOutline(ctx, selectedEl);
    }
  }

  ctx.restore();
}

function renderElement(ctx, el, now, isAOD) {
  const hours24 = now.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();
  const pad = (n) => String(n).padStart(2, '0');

  switch (el.type) {
    case 'dot-grid': {
      const radius = el.radius || 215;
      const spacing = el.dotSpacing || 16;
      const dotSize = el.dotSize || 1.5;
      const color = isAOD ? 'rgba(255, 255, 255, 0.03)' : (el.color || 'rgba(255, 255, 255, 0.08)');

      ctx.fillStyle = color;
      for (let x = el.x - radius; x <= el.x + radius; x += spacing) {
        for (let y = el.y - radius; y <= el.y + radius; y += spacing) {
          const dist = Math.hypot(x - el.x, y - el.y);
          if (dist <= radius) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    }

    case 'ring': {
      ctx.beginPath();
      ctx.arc(el.x, el.y, el.radius || 100, 0, Math.PI * 2);
      if (el.fill && el.fill !== 'transparent') {
        ctx.fillStyle = isAOD ? '#111111' : el.fill;
        ctx.fill();
      }
      if (el.strokeWidth > 0) {
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.strokeStyle = isAOD ? '#333333' : (el.color || '#FF4400');
        ctx.stroke();
      }
      break;
    }

    case 'radial-gauge': {
      const radius = el.radius || 180;
      const strokeWidth = el.strokeWidth || 8;
      const startDeg = el.startAngle !== undefined ? el.startAngle : -90;
      const endDeg = el.endAngle !== undefined ? el.endAngle : 270;
      const startRad = (startDeg * Math.PI) / 180;
      const totalSpanRad = ((endDeg - startDeg) * Math.PI) / 180;
      const progress = Math.min(1, Math.max(0, el.progress !== undefined ? el.progress : 0.75));

      if (el.trackColor && el.trackColor !== 'transparent') {
        ctx.beginPath();
        ctx.arc(el.x, el.y, radius, startRad, startRad + totalSpanRad);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = isAOD ? 'rgba(255,255,255,0.05)' : el.trackColor;
        ctx.lineCap = el.cap || 'round';
        ctx.stroke();
      }

      if (progress > 0) {
        ctx.beginPath();
        ctx.arc(el.x, el.y, radius, startRad, startRad + totalSpanRad * progress);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = isAOD ? '#666666' : (el.color || '#FF4400');
        ctx.lineCap = el.cap || 'round';
        ctx.stroke();
      }
      break;
    }

    case 'dial-ticks': {
      const radius = el.radius || 200;
      const count = el.tickCount || 12;
      const tickLen = el.tickLength || 6;
      const majorLen = el.majorLength || 10;
      const majorEvery = el.majorEvery || 3;
      const color = isAOD ? '#444444' : (el.color || '#8E8E93');
      const majorColor = isAOD ? '#888888' : (el.majorColor || '#FF4400');
      const width = el.strokeWidth || 2;

      ctx.save();
      ctx.translate(el.x, el.y);
      for (let i = 0; i < count; i++) {
        const isMajor = majorEvery > 0 && i % majorEvery === 0;
        const currentLen = isMajor ? majorLen : tickLen;
        const currentColor = isMajor ? majorColor : color;

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = isMajor ? width * 1.5 : width;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, -radius + currentLen);
        ctx.stroke();

        ctx.rotate((2 * Math.PI) / count);
      }
      ctx.restore();
      break;
    }

    case 'digital-time-dot': {
      const is24h = el.format24h !== false;
      const h = is24h ? pad(hours24) : pad(hours12);
      const m = pad(minutes);
      const s = pad(seconds);
      const timeStr = el.showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;

      drawDotMatrixText(ctx, timeStr, el.x, el.y, {
        dotSize: el.dotSize || 5,
        dotGap: el.dotGap || 2,
        charGap: el.charGap || 6,
        color: isAOD ? '#CCCCCC' : (el.color || '#FFFFFF'),
        dimColor: isAOD ? null : el.dimColor,
        align: 'center'
      });
      break;
    }

    case 'digital-time-bold': {
      const is24h = el.format24h !== false;
      const h = is24h ? pad(hours24) : pad(hours12);
      const m = pad(minutes);
      const timeStr = `${h}:${m}`;

      ctx.font = `700 ${el.fontSize || 48}px 'Space Grotesk', -apple-system, sans-serif`;
      ctx.fillStyle = isAOD ? '#CCCCCC' : (el.color || '#FFFFFF');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, el.x, el.y);
      break;
    }

    case 'custom-text': {
      ctx.font = `${el.fontWeight || '700'} ${el.fontSize || 24}px 'Space Grotesk', -apple-system, sans-serif`;
      ctx.fillStyle = isAOD ? '#AAAAAA' : (el.color || '#FFFFFF');
      ctx.textAlign = el.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.text || '', el.x, el.y);
      break;
    }

    case 'custom-text-dot': {
      drawDotMatrixText(ctx, el.text || '', el.x, el.y, {
        dotSize: el.dotSize || 3,
        dotGap: el.dotGap || 2,
        charGap: el.charGap || 4,
        color: isAOD ? '#888888' : (el.color || '#FFFFFF'),
        align: el.align || 'center'
      });
      break;
    }

    case 'date-badge': {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dayNum = pad(now.getDate());

      let dateText = `${dayName} ${dayNum} ${monthName}`;
      if (el.format === 'dd') dateText = `${dayNum}`;
      else if (el.format === 'EEE dd MMM') dateText = `${dayName} ${dayNum} ${monthName}`;
      else if (el.format === 'EEE • dd MMM') dateText = `${dayName} • ${dayNum} ${monthName}`;
      else if (el.format === '15.09 TUE') dateText = `${dayNum}.${pad(now.getMonth()+1)} ${dayName}`;

      if (el.style === 'capsule') {
        ctx.font = `700 ${el.fontSize || 12}px 'Space Grotesk', -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(dateText).width;
        const padX = 14;
        const padY = 6;
        const h = (el.fontSize || 12) + padY * 2;
        const w = textWidth + padX * 2;

        ctx.fillStyle = isAOD ? 'transparent' : 'rgba(255, 255, 255, 0.07)';
        ctx.strokeStyle = isAOD ? '#333333' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(el.x - w / 2, el.y - h / 2, w, h, h / 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAOD ? '#888888' : (el.color || '#FFFFFF');
        ctx.fillText(dateText, el.x, el.y);
      } else if (el.style === 'box') {
        const boxSize = (el.fontSize || 14) + 12;
        ctx.fillStyle = isAOD ? '#111111' : 'rgba(255, 68, 0, 0.15)';
        ctx.strokeStyle = isAOD ? '#444444' : (el.accentColor || '#FF4400');
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(el.x - boxSize / 2, el.y - boxSize / 2, boxSize, boxSize, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = `700 ${el.fontSize || 14}px 'Space Grotesk', -apple-system, sans-serif`;
        ctx.fillStyle = isAOD ? '#FFFFFF' : (el.color || '#FFFFFF');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateText, el.x, el.y);
      } else {
        ctx.font = `700 ${el.fontSize || 13}px 'Space Grotesk', -apple-system, sans-serif`;
        ctx.fillStyle = isAOD ? '#888888' : (el.color || '#FFFFFF');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateText, el.x, el.y);
      }
      break;
    }

    case 'weather-widget': {
      const cond = el.condition || 'sun';
      const temp = String(el.temp || '23°');
      const iconColor = isAOD ? '#888888' : (el.iconColor || '#FF4400');
      const textColor = isAOD ? '#666666' : (el.color || '#FFFFFF');
      const iconDotSize = el.iconSize || 2.2;
      const dotGap = 1.5;
      const textDotSize = 2.2;
      const charGap = 3;
      const spacing = 6;

      const iconW = 7 * iconDotSize + 6 * dotGap;
      const textW = temp.length * (5 * textDotSize + 4 * dotGap) + Math.max(0, temp.length - 1) * charGap;
      const totalW = iconW + spacing + textW;
      const startX = el.x - totalW / 2;

      drawDotMatrixIcon(ctx, cond, startX + iconW / 2, el.y, {
        dotSize: iconDotSize,
        dotGap: dotGap,
        color: iconColor,
        align: 'center'
      });

      drawDotMatrixText(ctx, temp, startX + iconW + spacing, el.y, {
        dotSize: textDotSize,
        dotGap: dotGap,
        charGap: charGap,
        color: textColor,
        align: 'left'
      });
      break;
    }

    case 'heartrate-widget': {
      const bpm = String(el.bpm || 78);
      const heartColor = isAOD ? '#888888' : (el.accentColor || '#FF4400');
      const textColor = isAOD ? '#666666' : (el.color || '#FFFFFF');
      const iconDotSize = 2.2;
      const dotGap = 1.5;
      const textDotSize = 2.2;
      const charGap = 3;
      const spacing = 6;

      const iconW = 7 * iconDotSize + 6 * dotGap;
      const textW = bpm.length * (5 * textDotSize + 4 * dotGap) + Math.max(0, bpm.length - 1) * charGap;
      const totalW = iconW + spacing + textW;
      const startX = el.x - totalW / 2;

      drawDotMatrixIcon(ctx, 'heart', startX + iconW / 2, el.y, {
        dotSize: iconDotSize,
        dotGap: dotGap,
        color: heartColor,
        align: 'center'
      });

      drawDotMatrixText(ctx, bpm, startX + iconW + spacing, el.y, {
        dotSize: textDotSize,
        dotGap: dotGap,
        charGap: charGap,
        color: textColor,
        align: 'left'
      });
      break;
    }

    case 'battery-widget': {
      const level = el.level || 84;
      const barWidth = 36;
      const barHeight = 8;
      const x = el.x - barWidth / 2;
      const y = el.y - barHeight / 2;

      ctx.strokeStyle = isAOD ? '#444444' : (el.color || '#8E8E93');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barWidth - 4, barHeight);

      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(x + barWidth - 4, y + 2, 2.5, barHeight - 4);

      const fillW = Math.max(0, ((barWidth - 6) * level) / 100);
      ctx.fillStyle = isAOD ? '#888888' : (el.fillColor || '#FF4400');
      ctx.fillRect(x + 2, y + 2, fillW, barHeight - 4);

      ctx.font = '700 10px \'Space Grotesk\', -apple-system, sans-serif';
      ctx.fillStyle = isAOD ? '#666666' : (el.color || '#8E8E93');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${level}%`, x + barWidth + 4, el.y);
      break;
    }

    case 'subdial': {
      const radius = el.radius || 45;
      const progress = el.progress || 0.75;
      const color = isAOD ? '#666666' : (el.color || '#FF4400');

      ctx.beginPath();
      ctx.arc(el.x, el.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isAOD ? '#111111' : 'rgba(255, 255, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(el.x, el.y, radius - 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      if (el.label) {
        ctx.font = '700 12px \'Space Grotesk\', -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label, el.x, el.y - 4);
      }
      if (el.sublabel) {
        ctx.font = '700 8px \'Space Grotesk\', -apple-system, sans-serif';
        ctx.fillStyle = '#8E8E93';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.sublabel, el.x, el.y + 10);
      }
      break;
    }

    case 'seconds-dot-bar': {
      const count = el.dotCount || 30;
      const dotSize = el.dotSize || 3;
      const spacing = dotSize * 2.5;
      const totalW = count * spacing;
      const startX = el.x - totalW / 2;
      const activeCount = Math.floor((seconds / 60) * count);

      for (let i = 0; i < count; i++) {
        const dotX = startX + i * spacing;
        const isActive = i <= activeCount;
        ctx.fillStyle = isActive ? (el.color || '#FF4400') : (el.dimColor || 'rgba(255,255,255,0.1)');
        ctx.beginPath();
        ctx.arc(dotX, el.y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'pill-stats-row': {
      const stats = [
        { label: el.steps || '8,310', icon: 'footstep' },
        { label: `${el.bpm || '72'}`, icon: 'heart' },
        { label: el.battery || '91%', icon: 'battery' }
      ];

      const itemW = 90;
      const totalW = stats.length * itemW;
      const startX = el.x - totalW / 2 + itemW / 2;

      stats.forEach((st, idx) => {
        const cx = startX + idx * itemW;
        drawDotMatrixIcon(ctx, st.icon, cx - 22, el.y, {
          dotSize: 1.8,
          dotGap: 1.2,
          color: el.accentColor || '#FF4400',
          align: 'center'
        });

        ctx.font = '700 11px \'Space Grotesk\', -apple-system, sans-serif';
        ctx.fillStyle = isAOD ? '#888888' : (el.color || '#FFFFFF');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, cx - 10, el.y);
      });
      break;
    }

    case 'text-badge': {
      ctx.font = `700 ${el.fontSize || 10}px 'Space Grotesk', -apple-system, sans-serif`;
      ctx.fillStyle = isAOD ? '#444444' : (el.color || '#666670');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = `${el.letterSpacing || 1}px`;
      ctx.fillText(el.text || '', el.x, el.y);
      break;
    }

    case 'analog-hands': {
      const hourAngle = ((hours12 + minutes / 60 + seconds / 3600) * 30 * Math.PI) / 180;
      const minAngle = ((minutes + seconds / 60 + milliseconds / 60000) * 6 * Math.PI) / 180;
      const secAngle = ((seconds + milliseconds / 1000) * 6 * Math.PI) / 180;

      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.rotate(hourAngle);
      ctx.fillStyle = isAOD ? '#888888' : (el.hourHandColor || '#FFFFFF');
      ctx.beginPath();
      const hw = el.hourHandWidth || 7;
      const hl = el.hourHandLength || 90;
      ctx.roundRect(-hw / 2, -hl, hw, hl + 18, hw / 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.rotate(minAngle);
      ctx.fillStyle = isAOD ? '#CCCCCC' : (el.minHandColor || '#E5E5E5');
      ctx.beginPath();
      const mw = el.minHandWidth || 5;
      const ml = el.minHandLength || 140;
      ctx.roundRect(-mw / 2, -ml, mw, ml + 24, mw / 2);
      ctx.fill();
      ctx.restore();

      if (!isAOD) {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(secAngle);

        const sw = el.secHandWidth || 2;
        const sl = el.secHandLength || 160;
        const secColor = el.secHandColor || '#FF4400';

        ctx.strokeStyle = secColor;
        ctx.lineWidth = sw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(0, -sl);
        ctx.stroke();

        if (el.secDotRadius) {
          ctx.fillStyle = secColor;
          ctx.beginPath();
          ctx.arc(0, -sl * 0.75, el.secDotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(el.x, el.y, el.centerCapRadius || 8, 0, Math.PI * 2);
      ctx.fillStyle = el.centerCapColor || '#121212';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isAOD ? '#444444' : (el.centerCapBorder || '#FF4400');
      ctx.stroke();
      break;
    }
  }
}

function renderSelectionOutline(ctx, el) {
  const box = getElementBounds(el);
  const pad = 6;

  ctx.save();
  ctx.strokeStyle = '#FF4400';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  ctx.strokeRect(
    box.x - pad,
    box.y - pad,
    box.width + pad * 2,
    box.height + pad * 2
  );

  ctx.setLineDash([]);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF4400';
  ctx.lineWidth = 2;

  const corners = [
    { x: box.x - pad, y: box.y - pad },
    { x: box.x + box.width + pad, y: box.y - pad },
    { x: box.x - pad, y: box.y + box.height + pad },
    { x: box.x + box.width + pad, y: box.y + box.height + pad }
  ];

  corners.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.font = '700 10px \'Space Grotesk\', -apple-system, sans-serif';
  const labelText = el.name || el.type;
  const labelWidth = ctx.measureText(labelText).width + 12;
  const labelH = 16;
  const lx = box.x - pad;
  const ly = box.y - pad - labelH - 4;

  ctx.fillStyle = '#FF4400';
  ctx.beginPath();
  ctx.roundRect(lx, ly, labelWidth, labelH, 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, lx + 6, ly + labelH / 2);

  ctx.restore();
}

function getElementBounds(el) {
  const defaultW = 100;
  const defaultH = 40;

  switch (el.type) {
    case 'ring':
    case 'radial-gauge':
    case 'dial-ticks':
    case 'dot-grid':
    case 'analog-hands': {
      const r = el.radius || (el.type === 'analog-hands' ? el.secHandLength || 150 : 100);
      return { x: el.x - r, y: el.y - r, width: r * 2, height: r * 2 };
    }
    case 'digital-time-dot': {
      const dotSize = el.dotSize || 5;
      const dotGap = el.dotGap || 2;
      const charGap = el.charGap || 6;
      const charCount = el.showSeconds ? 8 : 5;
      const charW = 5 * dotSize + 4 * dotGap;
      const totalW = charCount * charW + (charCount - 1) * charGap;
      const totalH = 7 * dotSize + 6 * dotGap;
      return { x: el.x - totalW / 2, y: el.y - totalH / 2, width: totalW, height: totalH };
    }
    case 'digital-time-bold': {
      const fs = el.fontSize || 48;
      const w = fs * 2.8;
      const h = fs;
      return { x: el.x - w / 2, y: el.y - h / 2, width: w, height: h };
    }
    case 'custom-text':
    case 'text-badge':
    case 'date-badge': {
      const fs = el.fontSize || 14;
      const len = (el.text || 'WEDNESDAY 15 SEP').length;
      const w = len * fs * 0.65 + 20;
      const h = fs + 16;
      return { x: el.x - w / 2, y: el.y - h / 2, width: w, height: h };
    }
    case 'custom-text-dot': {
      const dotSize = el.dotSize || 3;
      const len = (el.text || 'TEXT').length;
      const w = len * (5 * dotSize + 4 * (el.dotGap || 2) + (el.charGap || 4));
      const h = 7 * dotSize + 6 * (el.dotGap || 2);
      return { x: el.x - w / 2, y: el.y - h / 2, width: w, height: h };
    }
    case 'weather-widget': {
      const iconDotSize = el.iconSize || 2.2;
      const dotGap = 1.5;
      const textDotSize = 2.2;
      const charGap = 3;
      const spacing = 6;
      const temp = String(el.temp || '23°');
      const iconW = 7 * iconDotSize + 6 * dotGap;
      const textW = temp.length * (5 * textDotSize + 4 * dotGap) + Math.max(0, temp.length - 1) * charGap;
      const totalW = iconW + spacing + textW;
      const totalH = Math.max(7 * iconDotSize + 6 * dotGap, 7 * textDotSize + 6 * dotGap);
      const pad = 6;
      return {
        x: el.x - totalW / 2 - pad,
        y: el.y - totalH / 2 - pad,
        width: totalW + pad * 2,
        height: totalH + pad * 2
      };
    }
    case 'heartrate-widget': {
      const iconDotSize = 2.2;
      const dotGap = 1.5;
      const textDotSize = 2.2;
      const charGap = 3;
      const spacing = 6;
      const bpm = String(el.bpm || 78);
      const iconW = 7 * iconDotSize + 6 * dotGap;
      const textW = bpm.length * (5 * textDotSize + 4 * dotGap) + Math.max(0, bpm.length - 1) * charGap;
      const totalW = iconW + spacing + textW;
      const totalH = Math.max(7 * iconDotSize + 6 * dotGap, 7 * textDotSize + 6 * dotGap);
      const pad = 6;
      return {
        x: el.x - totalW / 2 - pad,
        y: el.y - totalH / 2 - pad,
        width: totalW + pad * 2,
        height: totalH + pad * 2
      };
    }
    case 'battery-widget':
    case 'subdial': {
      const r = el.radius || 45;
      return { x: el.x - r, y: el.y - (el.radius ? r : 18), width: r * 2, height: el.radius ? r * 2 : 36 };
    }
    case 'pill-stats-row': {
      const w = 270;
      const h = 30;
      return { x: el.x - w / 2, y: el.y - h / 2, width: w, height: h };
    }
    default:
      return { x: el.x - defaultW / 2, y: el.y - defaultH / 2, width: defaultW, height: defaultH };
  }
}

function hitTestElement(el, px, py) {
  const bounds = getElementBounds(el);
  return (
    px >= bounds.x &&
    px <= bounds.x + bounds.width &&
    py >= bounds.y &&
    py <= bounds.y + bounds.height
  );
}

// ==========================================
// 5. REACT APPLICATION UI & MAIN MENU
// ==========================================
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const COMPONENT_LIBRARY = [
  {
    category: 'Time & Clocks',
    items: [
      {
        type: 'digital-time-dot',
        name: 'N-Dot Digital Clock',
        iconName: 'time-dot',
        desc: 'Authentic 5x7 dot-matrix clock',
        defaultProps: {
          x: 233,
          y: 200,
          dotSize: 5.5,
          dotGap: 2.5,
          charGap: 6,
          color: '#FFFFFF',
          showSeconds: false,
          format24h: true
        }
      },
      {
        type: 'digital-time-bold',
        name: 'Bold Modular Clock',
        iconName: 'time-bold',
        desc: 'High-contrast stark typography',
        defaultProps: {
          x: 233,
          y: 215,
          fontSize: 54,
          fontFamily: 'sans',
          color: '#FFFFFF',
          format24h: true
        }
      },
      {
        type: 'analog-hands',
        name: 'Bauhaus Analog Hands',
        iconName: 'analog-hands',
        desc: 'Geometric hands with orange second tip',
        defaultProps: {
          x: 233,
          y: 233,
          hourHandLength: 90,
          hourHandWidth: 7,
          hourHandColor: '#FFFFFF',
          minHandLength: 140,
          minHandWidth: 5,
          minHandColor: '#E5E5E5',
          secHandLength: 160,
          secHandWidth: 2,
          secHandColor: '#FF4400',
          secDotRadius: 6,
          centerCapRadius: 9,
          centerCapColor: '#121212',
          centerCapBorder: '#FF4400'
        }
      },
      {
        type: 'seconds-dot-bar',
        name: 'Seconds Dot Bar',
        iconName: 'seconds-bar',
        desc: 'Horizontal dot progress of seconds',
        defaultProps: {
          x: 233,
          y: 260,
          dotCount: 30,
          dotSize: 3,
          color: '#FF4400',
          dimColor: 'rgba(255,255,255,0.1)'
        }
      }
    ]
  },
  {
    category: 'Activity & Health',
    items: [
      {
        type: 'radial-gauge',
        name: 'Activity Ring Gauge',
        iconName: 'radial-gauge',
        desc: 'Circular arc progress indicator',
        defaultProps: {
          x: 233,
          y: 233,
          radius: 190,
          strokeWidth: 8,
          startAngle: -90,
          endAngle: 270,
          progress: 0.75,
          color: '#FF4400',
          trackColor: 'rgba(255, 68, 0, 0.15)',
          cap: 'round'
        }
      },
      {
        type: 'heartrate-widget',
        name: 'Heart Rate BPM',
        iconName: 'heart',
        desc: 'Dot-matrix pulse and live BPM',
        defaultProps: {
          x: 233,
          y: 330,
          bpm: 78,
          color: '#FFFFFF',
          accentColor: '#FF4400'
        }
      },
      {
        type: 'subdial',
        name: 'Subdial Gauge',
        iconName: 'subdial',
        desc: 'Secondary circular complication dial',
        defaultProps: {
          x: 140,
          y: 233,
          radius: 45,
          progress: 0.82,
          color: '#FF4400',
          label: '7,420',
          sublabel: 'STEPS'
        }
      },
      {
        type: 'pill-stats-row',
        name: 'Pill Stats Row',
        iconName: 'pill-stats',
        desc: 'Triple metric row: Steps, BPM, Battery',
        defaultProps: {
          x: 233,
          y: 380,
          steps: '8,310',
          bpm: '72',
          battery: '91%',
          color: '#8E8E93',
          accentColor: '#FF4400'
        }
      }
    ]
  },
  {
    category: 'Info & Weather',
    items: [
      {
        type: 'weather-widget',
        name: 'Weather Status',
        iconName: 'weather-sun',
        desc: 'Dot-matrix icon and temperature',
        defaultProps: {
          x: 233,
          y: 320,
          iconSize: 2.5,
          color: '#FFFFFF',
          iconColor: '#FF4400',
          condition: 'sun',
          temp: '23°'
        }
      },
      {
        type: 'date-badge',
        name: 'Date & Day Badge',
        iconName: 'calendar',
        desc: 'Capsule or box date calendar',
        defaultProps: {
          x: 233,
          y: 265,
          fontSize: 13,
          fontFamily: 'sans',
          color: '#FFFFFF',
          accentColor: '#FF4400',
          format: 'EEE dd MMM',
          style: 'capsule'
        }
      },
      {
        type: 'battery-widget',
        name: 'Battery Pill',
        iconName: 'battery',
        desc: 'Segmented battery level meter',
        defaultProps: {
          x: 233,
          y: 340,
          level: 84,
          color: '#8E8E93',
          fillColor: '#FF4400'
        }
      }
    ]
  },
  {
    category: 'Dial & Accents',
    items: [
      {
        type: 'dial-ticks',
        name: 'Dial Ticks Markers',
        iconName: 'dial-ticks',
        desc: 'Radial tick markers (12 / 60 count)',
        defaultProps: {
          x: 233,
          y: 233,
          radius: 215,
          tickLength: 6,
          tickCount: 12,
          strokeWidth: 2,
          color: '#8E8E93',
          majorEvery: 3,
          majorColor: '#FF4400',
          majorLength: 10
        }
      },
      {
        type: 'dot-grid',
        name: 'Dot Matrix Grid',
        iconName: 'dot-grid',
        desc: 'Geometric background matrix array',
        defaultProps: {
          x: 233,
          y: 233,
          radius: 215,
          dotSpacing: 18,
          dotSize: 1.5,
          color: 'rgba(255, 255, 255, 0.08)'
        }
      },
      {
        type: 'ring',
        name: 'Concentric Ring',
        iconName: 'ring',
        desc: 'Stark geometric outline ring',
        defaultProps: {
          x: 233,
          y: 233,
          radius: 120,
          strokeWidth: 2,
          color: '#FF4400',
          fill: 'transparent'
        }
      },
      {
        type: 'text-badge',
        name: 'CMF Brand Inscription',
        iconName: 'badge',
        desc: 'Minimalist brand logo badge',
        defaultProps: {
          x: 233,
          y: 120,
          text: 'cmf by NOTHING',
          fontSize: 10,
          letterSpacing: 2,
          color: '#666670',
          style: 'plain'
        }
      },
      {
        type: 'custom-text-dot',
        name: 'Custom N-Dot Text',
        iconName: 'typography',
        desc: 'Custom dot-matrix text label',
        defaultProps: {
          x: 233,
          y: 300,
          text: 'CMF WATCH',
          dotSize: 3,
          dotGap: 2,
          charGap: 4,
          color: '#FFFFFF'
        }
      }
    ]
  }
];

function App() {
  const [viewMode, setViewMode] = useState('menu');
  const [device, setDevice] = useState('watch-pro-2');
  const [bezel, setBezel] = useState('orange-accent');
  const [strap, setStrap] = useState('orange');
  const [backgroundColor, setBackgroundColor] = useState('#0C0C0E');
  const [elements, setElements] = useState(() => PRESETS[0].elements);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('inspector');
  const [isAOD, setIsAOD] = useState(false);
  const [isLiveClock, setIsLiveClock] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBleModal, setShowBleModal] = useState(false);
  const [bleStatus, setBleStatus] = useState('idle');
  const [bleProgress, setBleProgress] = useState(0);
  const [bleLogs, setBleLogs] = useState([]);
  const [bleDeviceName, setBleDeviceName] = useState(null);
  const [bleBattery, setBleBattery] = useState(null);
  const [bleFirmware, setBleFirmware] = useState(null);
  const bleSessionRef = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [history, setHistory] = useState([PRESETS[0].elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lexClickCount, setLexClickCount] = useState(0);

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const konamiBufferRef = useRef([]);

  const currentDeviceConfig = getDeviceConfig(device);
  const canvasWidth = currentDeviceConfig.width;
  const canvasHeight = currentDeviceConfig.height;

  const selectedElement = useMemo(() => {
    return elements.find(el => el.id === selectedId) || null;
  }, [elements, selectedId]);

  const updateElementsWithHistory = useCallback((newElements) => {
    setElements(newElements);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newElements);
    if (newHist.length > 30) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  }, [history, historyIndex]);

  // "Marty, we have to go BACK!" - Back to the Future (1985) ( •_•)>⌐■-■ (⌐■_■)
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  // "Roads? Where we're going, we don't need roads." ᕦ(ò_óˇ)ᕤ
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  window.showToast = showToast;

  // Easter egg: DevTools console toolkit
  useEffect(() => {
    window.wcmf = {
      rickroll: () => window.triggerRickroll && window.triggerRickroll(),
      pacman: () => window.triggerRickroll && window.triggerRickroll(),
      gravity: () => window.triggerGoogleGravity && window.triggerGoogleGravity(),
      restore: () => window.restoreReality && window.restoreReality(),
      secret: () => {
        console.log(`%c
   ██╗    ██╗ ██████╗███╗   ███╗███████╗
   ██║    ██║██╔════╝████╗ ████║██╔════╝
   ██║ █╗ ██║██║     ██╔████╔██║█████╗  
   ██║███╗██║██║     ██║╚██╔╝██║██╔══╝  
   ╚███╔███╔╝╚██████╗██║ ╚═╝ ██║██║     
    ╚══╝╚══╝  ╚═════╝╚═╝     ╚═╝╚═╝ STUDIO
-------------------------------------------------
OPEN SOURCE BY LEX • CMF BY NOTHING WATCH STUDIO
"Built with pure dot-matrix energy."
-------------------------------------------------
Available developer commands:
  wcmf.secretDial()   -> Instantly load the secret Cyber Glyph 1984 dial
  wcmf.overclock()    -> Switch to 120 FPS high-refresh render loop
  wcmf.stats()        -> Display active canvas metrics & estimated BIN size
        `, 'color: #FF4400; font-weight: bold; font-family: monospace;');
      },
      secretDial: () => {
        const cyber = PRESETS.find(p => p.id === 'lex-cyber-glyph');
        if (cyber) {
          loadPreset(cyber);
          showToast('Loaded Secret Dial: Lex Cyber Glyph 1984');
        }
      },
      overclock: () => {
        setIsLiveClock(true);
        showToast('Engine Overclock: Ultra-smooth render enabled');
      },
      stats: () => {
        console.table({
          Device: currentDeviceConfig.name,
          Resolution: `${canvasWidth}x${canvasHeight}`,
          Elements: elements.length,
          EstimatedBinSize: `${((canvasWidth * canvasHeight * 2 + 109) / 1024).toFixed(1)} KB`
        });
      }
    };
  }, [elements, canvasWidth, canvasHeight, currentDeviceConfig]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (viewMode !== 'studio') return;
    let animId;
    const render = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        renderWatchface(ctx, canvasWidth, canvasHeight, elements, {
          now: new Date(),
          isAOD,
          selectedId,
          backgroundColor,
          showGrid
        });
      }
      if (isLiveClock) {
        animId = requestAnimationFrame(render);
      }
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [viewMode, elements, selectedId, isAOD, isLiveClock, backgroundColor, showGrid, canvasWidth, canvasHeight]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      // Easter egg: Konami Code sequence tracker
      konamiBufferRef.current.push(e.key);
      if (konamiBufferRef.current.length > 10) {
        konamiBufferRef.current.shift();
      }
      const konamiTarget = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
      const currentBuf = konamiBufferRef.current.map(k => k.toLowerCase());
      if (currentBuf.length === 10 && konamiTarget.every((k, i) => currentBuf[i] === k)) {
        konamiBufferRef.current = [];
        if (window.triggerRickroll) {
          window.triggerRickroll();
        }
        showToast('🕺 RICKROLL ACTIVATED: Never Gonna Give You Up!');
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || ((e.key === 'x' || e.key === 'd') && !e.ctrlKey && !e.metaKey)) {
        if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setContextMenu(null);
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) redo();
        else undo();
      } else if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
        const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
        updateSelectedElement({
          x: selectedElement.x + dx,
          y: selectedElement.y + dy
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedElement, elements]);

  const addElement = (template) => {
    const newId = `${template.type}-${Date.now().toString().slice(-4)}`;
    const newEl = {
      id: newId,
      type: template.type,
      name: template.name,
      ...template.defaultProps,
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
    const next = [...elements, newEl];
    updateElementsWithHistory(next);
    setSelectedId(newId);
    setActiveTab('inspector');
    showToast(`Added ${template.name}`);
  };

  const updateSelectedElement = (updates) => {
    if (!selectedId) return;
    const next = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, ...updates };
      }
      return el;
    });
    updateElementsWithHistory(next);
  };

  const deleteElement = (id) => {
    const target = elements.find(el => el.id === id);
    const name = target ? target.name : 'Element';
    const next = elements.filter(el => el.id !== id);
    updateElementsWithHistory(next);
    if (selectedId === id) setSelectedId(null);
    setContextMenu(null);
    showToast(`Deleted ${name}`);
  };

  const duplicateElement = (id) => {
    const target = elements.find(el => el.id === id);
    if (!target) return;
    const newId = `${target.type}-${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      x: target.x + 15,
      y: target.y + 15
    };
    const next = [...elements, cloned];
    updateElementsWithHistory(next);
    setSelectedId(newId);
    setContextMenu(null);
    showToast('Element duplicated');
  };

  const moveLayer = (id, direction) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= elements.length) return;

    const next = [...elements];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    updateElementsWithHistory(next);
  };

  const bringToFront = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx < 0 || idx === elements.length - 1) return;
    const next = [...elements];
    const [moved] = next.splice(idx, 1);
    next.push(moved);
    updateElementsWithHistory(next);
    showToast('Brought to front');
  };

  const sendToBack = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx <= 0) return;
    const next = [...elements];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    updateElementsWithHistory(next);
    showToast('Sent to back');
  };

  const toggleVisibility = (id) => {
    const next = elements.map(el => {
      if (el.id === id) {
        return { ...el, visible: el.visible === false ? true : false };
      }
      return el;
    });
    updateElementsWithHistory(next);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 2) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const reversed = [...elements].reverse();
    const hit = reversed.find(el => el.visible !== false && !el.locked && hitTestElement(el, mouseX, mouseY));

    if (hit) {
      setSelectedId(hit.id);
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: mouseX,
        y: mouseY,
        elX: hit.x,
        elY: hit.y
      };
    } else {
      setSelectedId(null);
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const reversed = [...elements].reverse();
    const hit = reversed.find(el => el.visible !== false && !el.locked && hitTestElement(el, mouseX, mouseY));

    if (hit) {
      setSelectedId(hit.id);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        element: hit
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingRef.current || !selectedId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const dx = mouseX - dragStartRef.current.x;
    const dy = mouseY - dragStartRef.current.y;

    let targetX = Math.round(dragStartRef.current.elX + dx);
    let targetY = Math.round(dragStartRef.current.elY + dy);

    if (showGrid) {
      targetX = Math.round(targetX / 10) * 10;
      targetY = Math.round(targetY / 10) * 10;
    }

    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, x: targetX, y: targetY };
      }
      return el;
    }));
  };

  const handleCanvasMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      updateElementsWithHistory(elements);
    }
  };

  const loadPreset = (preset) => {
    const targetDev = preset.device || 'watch-pro-2';
    setDevice(targetDev);
    const bezels = getDeviceBezels(targetDev);
    if (preset.bezel) {
      setBezel(preset.bezel);
    } else if (bezels.length > 0) {
      setBezel(bezels[0].id);
    }
    if (preset.strap) setStrap(preset.strap);
    if (preset.backgroundColor) setBackgroundColor(preset.backgroundColor);
    setElements(JSON.parse(JSON.stringify(preset.elements)));
    setSelectedId(null);
    setShowPresetsModal(false);
    setViewMode('studio');
    showToast(`Loaded preset "${preset.name}"`);
  };

  const startNewProject = (targetDevice) => {
    setDevice(targetDevice);
    const bezels = getDeviceBezels(targetDevice);
    if (bezels.length > 0) {
      setBezel(bezels[0].id);
    }
    setElements([]);
    setSelectedId(null);
    setViewMode('studio');
    const devCfg = getDeviceConfig(targetDevice);
    showToast(`Started new ${devCfg.name} watchface`);
  };

  const exportPNG = (scale = 1) => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasWidth * scale;
    exportCanvas.height = canvasHeight * scale;
    const expCtx = exportCanvas.getContext('2d');
    expCtx.scale(scale, scale);

    renderWatchface(expCtx, canvasWidth, canvasHeight, elements, {
      now: new Date(),
      isAOD,
      isExport: true,
      backgroundColor
    });

    const link = document.createElement('a');
    link.download = `cmf-watchface-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    showToast('Exported watchface PNG');
  };

  // ==========================================================================
  // SECTION 3: CMF BLE PROTOCOL STACK & REVERSE-ENGINEERED DRIVER
  // ==========================================================================
  // GATT Primary Services advertised by CMF Watch Pro (Goodix BLE SoC).
  // Includes vendor data tunnels, shell AT console, and standard battery service.
  const CMF_BLE_SERVICES = [
    61415,
    65520,
    6159,
    6154,
    65488,
    '02f00000-0000-0000-0000-00000000ffe0',
    '02f00000-0000-0000-0000-00000000fe00',
    '77d4ff00-2fe2-2334-0d35-9ccd078f529c',
    '77d4e67c-2fe2-2334-0d35-9ccd078f529c',
    'e49a3001-f69a-11e8-8eb2-f2801f1b9fd1',
    'f48a23c0-f69a-11e8-8eb2-f2801f1b9fd1'
  ];

  // GATT Characteristics mapping:
  // - cmdRead / cmdWrite: Encrypted bi-directional command channel
  // - dataRead / dataWrite: High-speed OTA chunk transfer channel
  // - shellRead / shellWrite: ASCII AT command console (AT GETSECRET handshake)
  // - battery: Standard Bluetooth SIG battery level characteristic
  const CMF_BLE_CHARS = {
    cmdRead: '0000fff1-0000-1000-8000-00805f9b34fb',
    cmdWrite: '0000fff2-0000-1000-8000-00805f9b34fb',
    dataRead: '02f00000-0000-0000-0000-00000000ffe2',
    dataWrite: '02f00000-0000-0000-0000-00000000ffe1',
    shellRead: '77d4ff02-2fe2-2334-0d35-9ccd078f529c',
    shellWrite: '77d4ff01-2fe2-2334-0d35-9ccd078f529c',
    battery: '00002a19-0000-1000-8000-00805f9b34fb'
  };

  // Packs 16-bit high word and 16-bit low word into a 32-bit unsigned command key
  const makeCmdKey = (e, t) => ((e << 16) | t) >>> 0;

  // Goodix / CMF BLE Command Registry
  const CMF_CMD = {
    authPairReq: makeCmdKey(65535, 32839),    // Initial pairing challenge request
    authPairRep: makeCmdKey(65535, 72),       // Pairing challenge response
    authName: makeCmdKey(65535, 32841),       // Client name identification ('wcmf')
    authMac: makeCmdKey(65535, 73),           // MAC verification response
    authNonceReq: makeCmdKey(65535, 32843),   // Session nonce exchange request
    authNonceRep: makeCmdKey(65535, 76),       // Session nonce reply from watch
    authConfirmReq: makeCmdKey(65535, 32845), // Session key confirmation request
    authConfirmRep: makeCmdKey(65535, 4),     // Session key confirmation ACK
    authFailed: makeCmdKey(65535, 41057),     // Authentication failure notification
    time: makeCmdKey(65535, 32772),           // RTC clock synchronization
    fwGet: makeCmdKey(65535, 32774),          // Firmware query request
    fwRet: makeCmdKey(65535, 6),              // Firmware query response
    serialGet: makeCmdKey(222, 2),            // Serial number query
    serialRet: makeCmdKey(222, 1),            // Serial number response
    battery: makeCmdKey(92, 1),               // Battery telemetry
    wfInit1Req: makeCmdKey(65535, 32850),     // Watchface upload handshake 1 [0xA5]
    wfInit1Rep: makeCmdKey(65535, 82),        // Watchface upload ACK 1 [0x01]
    wfInit2Req: makeCmdKey(65535, 36981),     // Flash memory slot allocation request
    wfInit2Rep: makeCmdKey(65535, 41077),     // Flash memory allocation ACK [0x01]
    wfChunkReq: makeCmdKey(65535, 41060),     // Watch requests binary chunk at offset
    wfChunkWrite: makeCmdKey(65535, 36964),   // Host sends raw binary chunk slice
    wfFinishAck1: makeCmdKey(65535, 41061),   // Watch notifies upload complete & verified
    wfFinishAck2: makeCmdKey(65535, 36965),   // Host confirms watchface activation [0xA5]
    wfInstalled: makeCmdKey(65535, 41045)     // Watchface activation event
  };

  // Commands transmitted in plaintext (no AES encryption or CRC wrapper)
  const UNENCRYPTED_CMDS = new Set([
    CMF_CMD.authPairReq,
    CMF_CMD.authPairRep,
    CMF_CMD.wfChunkWrite,
    CMF_CMD.authFailed
  ]);

  const CMF_IV = new Uint8Array([80, 81, 82, 83, 84, 85, 86, 87, 96, 97, 98, 99, 100, 101, 102, 90]);

  const CRC32_TABLE = new Uint32Array(256);
  for (let e = 0; e < 256; e++) {
    let t = e;
    for (let k = 0; k < 8; k++) {
      t = t & 1 ? 3988292384 ^ (t >>> 1) : t >>> 1;
    }
    CRC32_TABLE[e] = t >>> 0;
  }

  function computeCrc32(bytes) {
    let t = 4294967295;
    for (let n = 0; n < bytes.length; n++) {
      t = CRC32_TABLE[(t ^ bytes[n]) & 255] ^ (t >>> 8);
    }
    return (t ^ 4294967295) >>> 0;
  }

  // rawCrc32: IEEE 0xEDB88320 reflected, init=0, NO final inversion (CMF / Goodix bootloader & FMC standard)
  function rawCrc32(bytes) {
    let c = 0;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    }
    return c >>> 0;
  }

  // lz4Compress: Standard LZ4 block compression for CMF Watch Pro 2 GDI / LVGL resource payloads
  function lz4Compress(src) {
    const dst = [];

    function writeSeq(litStart, litEnd, off, mLen) {
      const litLen = litEnd - litStart;
      const ml = off > 0 ? mLen - 4 : 0;
      let tok = litLen >= 15 ? 0xf0 : litLen << 4;

      if (off > 0) tok |= ml >= 15 ? 15 : ml;
      dst.push(tok);
      for (let l = litLen - 15; litLen >= 15 && l >= 0; l -= 255) {
        if (l >= 255) dst.push(255);
        else {
          dst.push(l);
          break;
        }
      }
      for (let i = litStart; i < litEnd; i++) dst.push(src[i]);
      if (off > 0) {
        dst.push(off & 0xff, off >> 8);
        for (let l = ml - 15; ml >= 15 && l >= 0; l -= 255) {
          if (l >= 255) dst.push(255);
          else {
            dst.push(l);
            break;
          }
        }
      }
    }
    const n = src.length;

    if (n < 13) {
      writeSeq(0, n, 0, 0);
      return new Uint8Array(dst);
    }
    const rd = (p) => src[p] | (src[p + 1] << 8) | (src[p + 2] << 16) | (src[p + 3] << 24);
    const table = new Int32Array(1 << 14).fill(-1);
    let litStart = 0;
    let i = 0;
    const limit = n - 5;

    while (i < n - 12) {
      const h = (Math.imul(rd(i), 2654435761) >>> 18) & 0x3fff;
      const cand = table[h];

      table[h] = i;
      if (cand >= 0 && i - cand <= 65535 && rd(cand) === rd(i)) {
        let mLen = 4;

        while (i + mLen < limit && src[cand + mLen] === src[i + mLen]) mLen++;
        writeSeq(litStart, i, i - cand, mLen);
        i += mLen;
        litStart = i;
        continue;
      }
      i++;
    }
    writeSeq(litStart, n, 0, 0);
    return new Uint8Array(dst);
  }

  function uint32ToLeBytes(val) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, val, true);
    return b;
  }

  function concatArrays(...arrays) {
    const total = arrays.reduce((acc, a) => acc + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const arr of arrays) {
      out.set(arr, offset);
      offset += arr.length;
    }
    return out;
  }

  function hexToBytes(hexStr) {
    return new Uint8Array((hexStr.match(/../g) || []).map(h => parseInt(h, 16)));
  }

  function bytesToHex(bytes) {
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256Digest(bytes) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  }

  function arraysEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  function fnv1aHash(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function getWatchfaceId(name) {
    return 10000 + (fnv1aHash(name) % 2147473647);
  }

  // ==========================================================================
  // SECTION 4: CRYPTOGRAPHY & GOODIX/ZEPHYR BLE PACKET CODEC
  // ==========================================================================
  /**
   * CmfBleCodec
   * Implements the low-level transport framing, multi-packet fragmentation,
   * AES-128-CBC encryption, and message reassembly for CMF by Nothing smartwatches.
   * 
   * 11-Byte Frame Header Format (Big-Endian):
   * [0]   0xF5             : Magic Start-of-Frame sync byte
   * [1..2] payloadLen (2B) : Length of the chunk payload following this 11B header
   * [3..4] highWord (2B)   : Command high word (e.g. 0xFFFF)
   * [5..6] totalPackets(2B): Total number of frames in this multi-packet sequence
   * [7..8] currentPacket(2B): 1-indexed sequence number of current frame
   * [9..10] lowWord (2B)   : Command low word (e.g. 0x9064 for wfChunkWrite)
   * [11..] chunk payload   : Encrypted payload or raw binary streaming data
   */
  class CmfBleCodec {
    constructor() {
      this.mtu = 180; // Safe BLE MTU negotiation target
      this.rawKey = null;
      this.cryptoKey = null;
      this.bufs = new Map(); // Reassembly buffers keyed by 32-bit command key
    }

    /**
     * Imports or clears the 128-bit AES session key derived during pairing.
     */
    async setKey(key) {
      this.rawKey = key;
      this.cryptoKey = key
        ? await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt'])
        : null;
      this.bufs = new Map();
    }

    /**
     * Encrypts plaintext buffer using AES-CBC with static IV (CMF_IV).
     */
    async encrypt(data) {
      return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: CMF_IV }, this.cryptoKey, data));
    }

    /**
     * Decrypts ciphertext buffer using AES-CBC with static IV (CMF_IV).
     * "I'm sorry Dave, I'm afraid I can't decrypt that." - 2001: A Space Odyssey ( ಠ_ಠ )
     */
    async decrypt(data) {
      try {
        return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv: CMF_IV }, this.cryptoKey, data));
      } catch {
        // "Houston, we have a problem." (⊙_◎)
        throw new Error('decrypt failed — wrong session key');
      }
    }

    /**
     * Encodes a command payload into 1 or more 11-byte framed BLE packets.
     * - Unencrypted commands (e.g. OTA chunks) are sliced cleanly without CRC injection.
     * - Encrypted commands append a 4-byte CRC32 trailer before AES-CBC encryption.
     * "There is no spoon..." [ ▀ ͜͞ʖ▀ ]
     */
    async encode(cmdKey, payload = new Uint8Array(0)) {
      const chunks = [];
      if (UNENCRYPTED_CMDS.has(cmdKey)) {
        // High-speed raw streaming without CRC wrapper or encryption
        const maxPayload = this.mtu - 11;
        for (let r = 0; r < payload.length; r += maxPayload) {
          const slice = payload.slice(r, r + maxPayload);
          chunks.push(slice);
        }
        if (chunks.length === 0) {
          chunks.push(new Uint8Array(0));
        }
      } else if (payload.length === 0) {
        chunks.push(new Uint8Array(0));
      } else {
        // Encrypted commands: chunk size is aligned to 16-byte AES block boundaries
        const maxPayload = Math.floor((this.mtu - 11) / 16) * 16 - 5;
        for (let r = 0; r < payload.length; r += maxPayload) {
          const slice = payload.slice(r, r + maxPayload);
          const crcBytes = uint32ToLeBytes(computeCrc32(slice));
          const encrypted = await this.encrypt(concatArrays(slice, crcBytes));
          chunks.push(encrypted);
        }
      }

      const highWord = (cmdKey >>> 16) & 65535;
      const lowWord = cmdKey & 65535;

      return chunks.map((chunk, idx) => {
        const frame = new Uint8Array(11 + chunk.length);
        const view = new DataView(frame.buffer);
        frame[0] = 0xF5;
        view.setUint16(1, chunk.length);
        view.setUint16(3, highWord);
        view.setUint16(5, chunks.length);
        view.setUint16(7, idx + 1);
        view.setUint16(9, lowWord);
        frame.set(chunk, 11);
        return frame;
      });
    }

    /**
     * Decodes an incoming BLE frame from notifications, performing header validation,
     * AES decryption, CRC32 verification, and multi-packet reassembly.
     */
    async decode(frame) {
      if (frame.length < 11 || frame[0] !== 0xF5) {
        throw new Error('Bad frame header');
      }
      const view = new DataView(frame.buffer, frame.byteOffset);
      const payloadLen = view.getUint16(1);
      const cmdKey = ((view.getUint16(3) << 16) | view.getUint16(9)) >>> 0;
      const totalPackets = view.getUint16(5);
      const currentPacket = view.getUint16(7);

      let decrypted = new Uint8Array(0);
      if (payloadLen > 0) {
        if (UNENCRYPTED_CMDS.has(cmdKey)) {
          decrypted = frame.slice(11);
        } else {
          const rawDec = await this.decrypt(frame.slice(11, 11 + payloadLen));
          if (rawDec.length < 4) throw new Error('Payload too short for CRC');
          decrypted = rawDec.slice(0, -4);
          const expectedCrc = new DataView(rawDec.buffer, rawDec.byteOffset + rawDec.length - 4).getUint32(0, true);
          if (computeCrc32(decrypted) !== expectedCrc) {
            throw new Error('CRC mismatch in decrypted frame');
          }
        }
      }

      // Single-packet commands resolve immediately
      if (totalPackets <= 1) {
        return { key: cmdKey, payload: decrypted };
      }

      // Multi-packet assembly
      let bufEntry = this.bufs.get(cmdKey);
      if (!bufEntry) {
        bufEntry = { expected: 1, data: new Uint8Array(0) };
        this.bufs.set(cmdKey, bufEntry);
      }
      if (currentPacket !== bufEntry.expected) {
        if (currentPacket !== 1) return null;
        bufEntry.data = new Uint8Array(0);
      }
      bufEntry.data = concatArrays(bufEntry.data, decrypted);
      bufEntry.expected = currentPacket + 1;
      if (currentPacket === totalPackets) {
        this.bufs.delete(cmdKey);
        return { key: cmdKey, payload: bufEntry.data };
      }
      return null;
    }
  }

  // ==========================================================================
  // SECTION 5: BINARY CONTAINER COMPILER (.BIN) - GOODIX GR5526 / ZEPHYR TLV
  // ==========================================================================
  /**
   * buildCmfBinBuffer
   * Compiles the current watchface vector state into a firmware binary package (.bin).
   * 
   * HARDWARE ARCHITECTURE & GOODIX GR5526 RTOS NOTES:
   * - SoC Hardware: Goodix GR5525/GR5526 with proprietary Linwear / Goodix RTOS.
   * - Graphics Engine: Goodix GDI / FastLZ compressed tile pipeline (466x466 px).
   *   Uncompressed full RGB565 raw framebuffers (>424 KB) bypass GDI tile descriptors,
   *   triggering Watchdog Timer (WDT) hardware reboots & auto-formatting safety fallbacks.
   * - Memory Mapping: Resource pointers are relative to resource block start or SPI Flash
   *   mapped memory addresses (0x08xxxxxx / 0x60xxxxxx), rather than file-absolute byte offsets.
   * - Integrity Checksums: Goodix OTA protocol mandates CRC16-CCITT / additive block digests.
   * - TLV Specification: Embedded 32-bit (4-byte) aligned TLV tree structure (resOffset = 76B).
   * 
   * BINARY SPECIFICATION & MEMORY LAYOUT:
   * 1. 36-Byte Header:
   *    - [0..3]   : CRC32 of header[4..36] + Root TLV metadata tree (Little-Endian)
   *    - [4]      : Format Version (0x01)
   *    - [5..6]   : Reserved (0x00, 0x00)
   *    - [7]      : Hardware Platform ID (0x02 = Watch Pro 2, 0x01 = Watch Pro 1)
   *    - [8..23]  : Watchface Name (ASCII string, null-padded, max 16 chars)
   *    - [24..27] : Total file size minus 36-byte footer (uint32 LE)
   *    - [28..31] : Total resources payload length in bytes (uint32 LE)
   *    - [32..35] : CRC32 checksum of resources payload (uint32 LE)
   * 2. Root TLV Metadata Tree:
   *    - Tag 0x20 (Root) -> Tag 0x21 (Main Screen) -> Tag 0x30 (Image) -> Tag 0x01 (Struct)
   *    - Struct contains coordinate offsets, screen dimensions, and resource pointers.
   * 3. Resource Payload:
   *    - 8-Byte Resource Descriptor: Format (RGB565=4), Width, Height, and Byte Length.
   *    - 16-bit RGB565 Framebuffer (2 bytes per pixel, Little-Endian).
   * 4. 36-Byte Footer:
   *    - Identical mirror of the 36-byte header for hardware integrity verification.
   */
  const buildCmfBinBuffer = (faceName = 'wcmf_dial') => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    const expCtx = exportCanvas.getContext('2d');

    renderWatchface(expCtx, canvasWidth, canvasHeight, elements, {
      now: new Date(),
      isAOD: false,
      isExport: true,
      backgroundColor
    });

    // 1. Convert RGBA to 16-bit RGB565 Framebuffer (Little-Endian)
    // "I've seen things you people wouldn't believe... Watchfaces flashing in the dark near Tannhäuser Gate." (•_•)
    const imgData = expCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const rgba = imgData.data;
    const pixelCount = canvasWidth * canvasHeight;
    const rgb565 = new Uint8Array(pixelCount * 2);

    for (let i = 0; i < pixelCount; i++) {
      const r = rgba[i * 4] >> 3;       // 5 bits red (Royale with cheese)
      const g = rgba[i * 4 + 1] >> 2;   // 6 bits green
      const b = rgba[i * 4 + 2] >> 3;   // 5 bits blue
      const val = ((r & 0x1F) << 11) | ((g & 0x3F) << 5) | (b & 0x1F);
      rgb565[i * 2] = val & 0xFF;        // Little-Endian low byte
      rgb565[i * 2 + 1] = (val >> 8) & 0xFF; // Little-Endian high byte
    }

    // 2. Compress RGB565 using standard LZ4 block compression (mandatory for CMF Watch Pro 2 / Goodix GDI)
    const compressedRgb565 = lz4Compress(rgb565);

    // 3. Resource descriptor (8 bytes): Format (cf=4 for RGB565), Width, Height, and Compressed Size
    // "Hold onto your butts..." - Jurassic Park (1993) (╯°□°)╯︵ ┻━┻
    const cf = 4; // Format code: 4 = RGB565
    const resHdrVal = (cf & 31) | ((canvasWidth & 2047) << 10) | ((canvasHeight & 2047) << 21);
    const resHdr = new Uint8Array(8);
    const resHdrView = new DataView(resHdr.buffer);
    resHdrView.setUint32(0, resHdrVal >>> 0, true);
    resHdrView.setUint32(4, compressedRgb565.length, true);

    const resourcePayload = concatArrays(resHdr, compressedRgb565);

    // 4. Build TLV Tree structure (CMF Watch Pro 2 / Goodix 32-bit aligned specification)
    const TAG_ROOT = 0x20;
    const TAG_MAIN = 0x21;
    const TAG_IMAGE = 0x30;
    const TAG_STRUCT = 0x01;

    // Struct payload (28 bytes: 25B metadata + 3B padding for strict 4-byte / 32-bit word alignment):
    // - [0..3]   : Coordinates x (int16 LE = 0), y (int16 LE = 0)
    // - [4..17]  : Metadata (14B): w(2B), h(2B), rgb tint(3B), flags(7B)
    // - [18..24] : RefTail (7B): refType(0x01), count(uint16 LE = 1), resOffset(uint32 LE = 76)
    // - [25..27] : Zero padding (3B) -> structPayload 28B -> structTlv 31B -> imgTlv 34B -> mainTlv 37B -> rootTlv 40B
    const HEADER_SIZE = 36;
    const resOffset = 76; // Strictly 4-byte (32-bit) aligned resource offset: 36 (header) + 40 (root TLV) = 76

    const structPayload = new Uint8Array(28); // 25 bytes data + 3 bytes zero padding
    const structView = new DataView(structPayload.buffer);
    structView.setInt16(0, 0, true); // x = 0
    structView.setInt16(2, 0, true); // y = 0
    structView.setUint16(4, canvasWidth, true);
    structView.setUint16(6, canvasHeight, true);
    structPayload[8] = 255; structPayload[9] = 255; structPayload[10] = 255; // RGB tint
    // [11..17] = 0 (flags, res, source, sub, max)
    structPayload[18] = 0x01; // refType = 0x01 (single image reference)
    structView.setUint16(19, 1, true); // count = 1
    structView.setUint32(21, resOffset, true); // byte offset of resource in file (76)
    // [25..27] remain 0 (padding)

    // Pack Struct TLV: [TAG(1B), LEN_L(1B), LEN_H(1B), PAYLOAD(28B)] -> 31 bytes
    const structTlv = new Uint8Array(3 + structPayload.length);
    structTlv[0] = TAG_STRUCT;
    structTlv[1] = structPayload.length & 0xFF;
    structTlv[2] = (structPayload.length >> 8) & 0xFF;
    structTlv.set(structPayload, 3);

    // Pack Image TLV: [TAG(1B), LEN_L(1B), LEN_H(1B), PAYLOAD(31B)] -> 34 bytes
    const imgTlv = new Uint8Array(3 + structTlv.length);
    imgTlv[0] = TAG_IMAGE;
    imgTlv[1] = structTlv.length & 0xFF;
    imgTlv[2] = (structTlv.length >> 8) & 0xFF;
    imgTlv.set(structTlv, 3);

    // Pack Main Screen TLV: [TAG(1B), LEN_L(1B), LEN_H(1B), PAYLOAD(34B)] -> 37 bytes
    const mainScreenTlv = new Uint8Array(3 + imgTlv.length);
    mainScreenTlv[0] = TAG_MAIN;
    mainScreenTlv[1] = imgTlv.length & 0xFF;
    mainScreenTlv[2] = (imgTlv.length >> 8) & 0xFF;
    mainScreenTlv.set(imgTlv, 3);

    // Pack Root TLV: [TAG(1B), LEN_L(1B), LEN_H(1B), PAYLOAD(37B)] -> 40 bytes total (divisible by 4)
    const rootTlv = new Uint8Array(3 + mainScreenTlv.length);
    rootTlv[0] = TAG_ROOT;
    rootTlv[1] = mainScreenTlv.length & 0xFF;
    rootTlv[2] = (mainScreenTlv.length >> 8) & 0xFF;
    rootTlv.set(mainScreenTlv, 3);

    // 5. Build 36-Byte Header
    const totalFileSize = HEADER_SIZE + rootTlv.length + resourcePayload.length + HEADER_SIZE;
    const header = new Uint8Array(HEADER_SIZE);
    const headerView = new DataView(header.buffer);

    header[4] = 0x01; // Format version 1
    header[5] = 0x00;
    header[6] = 0x00;
    header[7] = currentDeviceConfig.hardwareId !== undefined ? currentDeviceConfig.hardwareId : 0x02;

    // ASCII null-padded name (16 bytes max)
    const nameBytes = new TextEncoder().encode(faceName).slice(0, 15);
    header.set(nameBytes, 8);

    // Offset 24 (0x18): Total file size minus 36 bytes footer
    headerView.setUint32(24, totalFileSize - HEADER_SIZE, true);
    // Offset 28 (0x1C): Total resources payload length
    headerView.setUint32(28, resourcePayload.length, true);
    // Offset 32 (0x20): rawCrc32 of resources payload (Goodix / FMC standard)
    headerView.setUint32(32, rawCrc32(resourcePayload), true);
    // Offset 0 (0x00): rawCrc32 of header[4..36] + rootTlv
    headerView.setUint32(0, rawCrc32(concatArrays(header.slice(4, 36), rootTlv)), true);

    // 6. Build Complete Binary: Header + Root TLV + Resource Data + Footer (identical to header)
    const footer = new Uint8Array(header);
    const finalBinBuffer = concatArrays(header, rootTlv, resourcePayload, footer);

    return finalBinBuffer.buffer;
  };

  const exportBIN = () => {
    try {
      const binBuffer = buildCmfBinBuffer('wcmf_dial');
      const blob = new Blob([binBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const devName = currentDeviceConfig.id.replace(/-/g, '_');
      link.download = `wcmf_${devName}_dial_${Date.now()}.bin`;
      link.href = url;
      link.click();
      showToast(`Official .BIN package exported for ${currentDeviceConfig.name}`);
    } catch (err) {
      console.error('BIN export error:', err);
      alert('Error exporting .BIN file: ' + err.message);
    }
  };

  const runSimulatedBleFlash = async () => {
    setShowBleModal(true);
    setBleStatus('scanning');
    setBleProgress(0);
    setBleDeviceName('CMF Watch Pro 2 (Demo BLE)');
    setBleLogs([
      '[SIM] Initializing Simulated Web Bluetooth Stack...',
      '[SIM] Scanning for nearby CMF Watch BLE beacons...',
      '[SIM] Found: CMF Watch Pro 2 (ID: 0x4D6F6473)',
      '[SIM] Connected to GATT Server.'
    ]);

    await new Promise(r => setTimeout(r, 700));
    setBleStatus('pairing');
    setBleLogs(prev => [
      ...prev,
      '[PAIR] Sent "AT GETSECRET" request to watch shell...',
      '[PAIR] WAITING FOR USER CONFIRMATION ON WATCH SCREEN...'
    ]);

    await new Promise(r => setTimeout(r, 1400));
    setBleStatus('authenticating');
    setBleLogs(prev => [
      ...prev,
      '[PAIR] User confirmed ACCEPT on CMF Watch screen.',
      '[AUTH] SHA-256 challenge verified. Session AES-CBC key established.',
      '[INFO] Syncing time, firmware, battery, and dial slots...'
    ]);

    await new Promise(r => setTimeout(r, 600));
    setBleStatus('flashing');
    setBleLogs(prev => [
      ...prev,
      '[BIN] Compiling watchface into 16-bit RGB565 binary container...',
      '[OTA] Watch requested dial upload initialization (wfInit1/2 OK)...',
      '[OTA] Watch driving packet stream via wfChunkReq notifications...'
    ]);

    const totalPackets = 40;
    for (let p = 0; p <= totalPackets; p++) {
      await new Promise(r => setTimeout(r, 45));
      const pct = Math.round((p / totalPackets) * 100);
      setBleProgress(pct);
      if (p % 8 === 0 || p === totalPackets) {
        setBleLogs(prev => [
          ...prev.slice(-6),
          `[OTA] wfChunkReq @ packet ${p}/${totalPackets} (${pct}%) — stream verified`
        ]);
      }
    }

    setBleLogs(prev => [
      ...prev,
      '[OTA] Received wfFinishAck1 from watch. Sent wfFinishAck2 confirmation [0xA5].',
      '[OK] Checksum verified! Watchface flashed and activated on CMF Watch!'
    ]);
    setBleStatus('success');
    showToast('Simulated watchface flash completed successfully!');
  };

  // "Neuralyzer flash engaged... you never saw this device." - Men in Black (⌐■_■)ノ*
  const forgetBleDevice = async () => {
    localStorage.removeItem('wcmf_authkey');
    localStorage.removeItem('fmc_authkey');
    if (bleSessionRef.current && bleSessionRef.current.gattServer) {
      try {
        bleSessionRef.current.gattServer.disconnect();
      } catch (e) {}
    }
    bleSessionRef.current = null;
    setBleBattery(null);
    setBleFirmware(null);
    if (navigator.bluetooth && navigator.bluetooth.getDevices) {
      try {
        const devices = await navigator.bluetooth.getDevices();
        await Promise.all(devices.map(d => d.forget && d.forget()));
      } catch (e) {}
    }
    setBleStatus('idle');
    setBleDeviceName(null);
    setBleProgress(0);
    setBleLogs(['[BLE] Stored pairing keys, cached device associations, and active session cleared.']);
    showToast('Bluetooth pairing cache cleared');
  };

  // ==========================================================================
  // SECTION 6: WEB BLUETOOTH FLASHING ENGINE & HARDWARE DRIVER
  // ==========================================================================
  /**
   * startBleFlash
   * Main Web Bluetooth execution pipeline. Coordinates scanning, GATT connection,
  // SECTION 6: AUTHENTIC CMF BLE OTA DRIVER & PROTOCOL ENGINE
  // ==========================================================================
  /**
   * connectBle
   * Initiates device discovery, GATT connection, AES authentication and handshake,
   * and stores the active session in bleSessionRef.
   */
  const connectBle = async () => {
    setShowBleModal(true);
    setBleStatus('scanning');
    setBleProgress(0);
    setBleLogs([
      '[WCMF BLE] Initializing authentic CMF BLE driver...',
      '[WCMF BLE] Scanning for CMF Watch Pro / Pro 2...'
    ]);

    if (!navigator.bluetooth) {
      setBleStatus('error');
      setBleLogs(prev => [
        ...prev,
        '[ERR] Web Bluetooth is disabled or unsupported in this browser.',
        '[FEDORA/LINUX FIX] To enable in Brave or Chrome on Linux:',
        '  1. Open brave://flags or chrome://flags in a new tab',
        '  2. Search for "enable-web-bluetooth" and set to "Enabled"',
        '  3. Relaunch the browser and try again.'
      ]);
      return null;
    }

    try {
      setBleLogs(prev => [
        ...prev,
        '[SCAN] Please select your CMF Watch from the browser popup dialog...'
      ]);

      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [61415] },
          { namePrefix: 'CMF Watch' },
          { manufacturerData: [{ companyIdentifier: 3275 }] }
        ],
        optionalServices: CMF_BLE_SERVICES
      });

      const name = bleDevice.name || 'CMF Watch Device';
      setBleDeviceName(name);
      setBleLogs(prev => [
        ...prev,
        `[BLE] Device selected: ${name}`
      ]);

      let gattServer = null;
      let chars = {};
      let codec = new CmfBleCodec();
      let waiters = new Map();
      let handlers = new Map();
      let shellWaiter = null;
      let rxChain = Promise.resolve();
      let isExplicitDisconnect = false;

      bleDevice.addEventListener('gattserverdisconnected', () => {
        if (!isExplicitDisconnect) {
          console.warn('[BLE] GATT server disconnected unexpectedly');
          setBleLogs(prev => [...prev, '[WARN] GATT server disconnected.']);
          bleSessionRef.current = null;
          setBleStatus('idle');
          setBleBattery(null);
        }
      });

      const waitFor = (cmdKey, timeoutMs = 12000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            waiters.delete(cmdKey);
            reject(new Error(`Timeout waiting for watch command 0x${(cmdKey & 0xFFFF).toString(16)}`));
          }, timeoutMs);
          waiters.set(cmdKey, payload => {
            clearTimeout(timer);
            resolve(payload);
          });
        });
      };

      const onNotify = async (uuid, valueBytes) => {
        if (chars.shellRead && uuid === chars.shellRead.uuid.toLowerCase()) {
          const text = new TextDecoder().decode(valueBytes);
          if (shellWaiter && text.includes('GETSECRET:')) {
            shellWaiter(text);
            shellWaiter = null;
          }
          return;
        }

        let decoded;
        try {
          decoded = await codec.decode(valueBytes);
        } catch (err) {
          return;
        }
        if (!decoded) return;

        const wFn = waiters.get(decoded.key);
        if (wFn) {
          waiters.delete(decoded.key);
          wFn(decoded.payload);
        }

        const hFn = handlers.get(decoded.key);
        if (hFn) {
          await hFn(decoded.payload);
        }
      };

      const connectAndDiscover = async () => {
        setBleStatus('connected');
        setBleLogs(prev => [...prev, '[BLE] Connecting to GATT server...']);
        chars = {};
        gattServer = await bleDevice.gatt.connect();
        setBleLogs(prev => [...prev, '[GATT] Connected! Discovering services & characteristics...']);

        const primaryServices = await gattServer.getPrimaryServices();
        for (const s of primaryServices) {
          try {
            const sChars = await s.getCharacteristics();
            for (const ch of sChars) {
              chars[ch.uuid.toLowerCase()] = ch;
            }
          } catch (e) {}
        }

        chars.cmdRead = chars[CMF_BLE_CHARS.cmdRead.toLowerCase()];
        chars.cmdWrite = chars[CMF_BLE_CHARS.cmdWrite.toLowerCase()];
        chars.dataRead = chars[CMF_BLE_CHARS.dataRead.toLowerCase()];
        chars.dataWrite = chars[CMF_BLE_CHARS.dataWrite.toLowerCase()];
        chars.shellRead = chars[CMF_BLE_CHARS.shellRead.toLowerCase()];
        chars.shellWrite = chars[CMF_BLE_CHARS.shellWrite.toLowerCase()];
        chars.battery = chars[CMF_BLE_CHARS.battery.toLowerCase()];

        // Start Notifications
        for (const ch of [chars.cmdRead, chars.dataRead, chars.shellRead].filter(Boolean)) {
          try {
            await ch.startNotifications();
            ch.addEventListener('characteristicvaluechanged', e => {
              const val = e.target.value;
              const bytes = new Uint8Array(val.buffer, val.byteOffset, val.byteLength);
              rxChain = rxChain.then(() => onNotify(ch.uuid.toLowerCase(), bytes)).catch(() => {});
            });
          } catch (subErr) {
            console.warn('Subscription error:', ch.uuid, subErr);
          }
        }
      };

      const sendCmd = async (cmdKey, payload) => {
        if (!gattServer || !gattServer.connected) {
          throw new Error('GATT Server is disconnected. Cannot send command.');
        }
        const frames = await codec.encode(cmdKey, payload || new Uint8Array(0));
        for (const frame of frames) {
          if (chars.cmdWrite.properties.writeWithoutResponse) {
            await chars.cmdWrite.writeValueWithoutResponse(frame);
          } else {
            await chars.cmdWrite.writeValueWithResponse(frame);
          }
        }
      };

      const sendData = async (cmdKey, payload, onProgress) => {
        if (!gattServer || !gattServer.connected) {
          throw new Error('GATT Server is disconnected. Cannot send data.');
        }
        const targetChar = chars.dataWrite || chars.cmdWrite;
        if (!targetChar) {
          throw new Error('Data characteristic not found on CMF Watch.');
        }
        const frames = await codec.encode(cmdKey, payload || new Uint8Array(0));
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const hasWithout = targetChar.properties.writeWithoutResponse || targetChar.properties.writeValueWithoutResponse;
          if (hasWithout) {
            await targetChar.writeValueWithoutResponse(frame);
            await new Promise(r => setTimeout(r, 4));
          } else {
            await targetChar.writeValueWithResponse(frame);
          }
          if (onProgress) onProgress((i + 1) / frames.length);
        }
      };

      // 1. First connection
      await connectAndDiscover();

      const getSavedKey = () => {
        const k = localStorage.getItem('wcmf_authkey') || localStorage.getItem('fmc_authkey');
        return k && k.length === 32 ? hexToBytes(k) : null;
      };

      if (!chars.shellWrite && !getSavedKey()) {
        setBleLogs(prev => [...prev, '[PAIR] Pairing service hidden by watch — cycling GATT connection...']);
        isExplicitDisconnect = true;
        try { gattServer.disconnect(); } catch(e) {}
        await new Promise(r => setTimeout(r, 2500));
        isExplicitDisconnect = false;
        await connectAndDiscover();
      }

      // 2. Authentication & Pairing
      const authenticateSession = async (keyBytes) => {
        setBleStatus('authenticating');
        setBleLogs(prev => [...prev, '[AUTH] Authenticating session with saved key...']);
        await codec.setKey(keyBytes);

        let rejectAuth;
        const failPromise = new Promise((_, reject) => {
          rejectAuth = () => reject(new Error('Watch rejected auth key'));
          waiters.set(CMF_CMD.authFailed, rejectAuth);
        });
        failPromise.catch(() => {});

        const raceWait = cmdKey => Promise.race([waitFor(cmdKey, 6000), failPromise]);

        try {
          await sendCmd(CMF_CMD.authName, concatArrays(new Uint8Array([0xA5]), new TextEncoder().encode('wcmf')));
          await raceWait(CMF_CMD.authMac);
          await sendCmd(CMF_CMD.authNonceReq, new Uint8Array([0xA5]));
          const nonceRep = await raceWait(CMF_CMD.authNonceRep);
          const sessionKey = (await sha256Digest(concatArrays(nonceRep, keyBytes))).slice(0, 16);
          await codec.setKey(sessionKey);
          await sendCmd(CMF_CMD.authConfirmReq, new Uint8Array([0xA5]));
          await raceWait(CMF_CMD.authConfirmRep);
          setBleLogs(prev => [...prev, '[OK] Session authenticated successfully.']);
        } finally {
          waiters.delete(CMF_CMD.authFailed);
        }
      };

      const performPairing = async () => {
        if (!chars.shellWrite) {
          setBleLogs(prev => [...prev, '[PAIR] Discovering pairing service (re-connect)...']);
          isExplicitDisconnect = true;
          try { gattServer.disconnect(); } catch(e) {}
          await new Promise(r => setTimeout(r, 2500));
          isExplicitDisconnect = false;
          await connectAndDiscover();
        }

        if (!chars.shellWrite) {
          throw new Error('Pairing service not exposed by watch. Please ensure phone app is closed and retry.');
        }

        setBleStatus('pairing');
        setBleLogs(prev => [
          ...prev,
          '[PAIR] Requesting secret handshake from watch (AT GETSECRET)...',
          '------------------------------------------------------------',
          '[PROMPT] PLEASE LOOK AT YOUR CMF WATCH SCREEN AND TAP ACCEPT NOW',
          '------------------------------------------------------------'
        ]);

        await codec.setKey(null);
        const secretPromise = new Promise((resolve, reject) => {
          shellWaiter = resolve;
          setTimeout(() => reject(new Error('Timeout waiting for user confirmation on watch screen')), 30000);
        });
        await chars.shellWrite.writeValue(new TextEncoder().encode('AT GETSECRET'));

        const secretText = (await secretPromise).trim();
        if (!secretText.endsWith(',OK') || secretText.length < 42) {
          throw new Error(`Pairing rejected on watch screen: ${secretText}`);
        }

        const secretHex = secretText.slice(10, 42);
        const secretBytes = hexToBytes(secretHex);
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        const challengeSig = await sha256Digest(concatArrays(randomBytes, secretBytes));

        setBleLogs(prev => [...prev, '[PAIR] Watch screen prompt accepted. Verifying cryptographic signature...']);
        await sendCmd(CMF_CMD.authPairReq, concatArrays(randomBytes, challengeSig));

        const pairRep = await waitFor(CMF_CMD.authPairRep);
        const watchRand = pairRep.slice(0, 16);
        const expectedWatchSig = await sha256Digest(concatArrays(watchRand, secretBytes));

        if (!arraysEqual(pairRep.slice(16, 48), expectedWatchSig)) {
          throw new Error('Watch signature verification mismatch during pairing.');
        }

        const masterAuthKey = (await sha256Digest(concatArrays(randomBytes, watchRand, secretBytes))).slice(0, 16);
        localStorage.setItem('wcmf_authkey', bytesToHex(masterAuthKey));
        localStorage.setItem('fmc_authkey', bytesToHex(masterAuthKey));
        setBleLogs(prev => [...prev, '[OK] Paired! Secure session key generated & saved.']);

        await authenticateSession(masterAuthKey);
      };

      const savedKey = getSavedKey();
      if (savedKey) {
        try {
          await authenticateSession(savedKey);
        } catch (authErr) {
          setBleLogs(prev => [...prev, `[WARN] Stored auth key expired (${authErr.message}). Reconnecting for fresh pairing...`]);
          localStorage.removeItem('wcmf_authkey');
          localStorage.removeItem('fmc_authkey');
          isExplicitDisconnect = true;
          try { gattServer.disconnect(); } catch(e) {}
          await new Promise(r => setTimeout(r, 2500));
          isExplicitDisconnect = false;
          await connectAndDiscover();
          await performPairing();
        }
      } else {
        await performPairing();
      }

      // 3. Fetch Device Info (Time Sync, Firmware, Battery)
      const nowSec = Math.floor(Date.now() / 1000);
      const tzOffsetSec = -new Date().getTimezoneOffset() * 60;
      const timePayload = new Uint8Array(8);
      const timeView = new DataView(timePayload.buffer);
      timeView.setUint32(0, nowSec, true);
      timeView.setUint32(4, (tzOffsetSec * 1000) >>> 0, true);
      await sendCmd(CMF_CMD.time, timePayload);

      try {
        await sendCmd(CMF_CMD.fwGet, new Uint8Array(0));
        const fwBytes = await waitFor(CMF_CMD.fwRet, 3000);
        const fwVersion = [...fwBytes].join('.');
        setBleFirmware(fwVersion);
        setBleLogs(prev => [...prev, `[INFO] CMF Watch Firmware: v${fwVersion}`]);
      } catch (e) {}

      if (chars.battery) {
        try {
          const batVal = await chars.battery.readValue();
          const batLevel = batVal.getUint8(0);
          setBleBattery(batLevel);
          setBleLogs(prev => [...prev, `[INFO] Watch Battery Level: ${batLevel}%`]);
        } catch (e) {}
      }

      const session = {
        bleDevice,
        gattServer,
        chars,
        codec,
        waiters,
        handlers,
        sendCmd,
        sendData,
        waitFor,
        name
      };
      bleSessionRef.current = session;
      setBleStatus('connected');
      setBleLogs(prev => [
        ...prev,
        '[OK] Watch connected & authenticated!',
        '[READY] Tap "Send .BIN to Watch" whenever you are ready to flash.'
      ]);
      showToast(`Connected to ${name}! Ready to send .BIN.`);
      return session;
    } catch (err) {
      if (err.name === 'NotFoundError' || (err.message && err.message.includes('User cancelled'))) {
        setBleLogs(prev => [...prev, '[BLE] Device pairing cancelled by user.']);
        setBleStatus('idle');
      } else {
        setBleStatus('error');
        setBleLogs(prev => [
          ...prev,
          `[ERR] Bluetooth error: ${err.message}`,
          '[TIP] Ensure your phone (Nothing X / CMF Watch app) has Bluetooth temporarily OFF so the watch is not locked by the phone.'
        ]);
      }
      return null;
    }
  };

  /**
   * sendWatchfaceBin
   * Compiles the watchface binary using Zephyr/LVGL format and streams it to the watch.
   * Uses existing active BLE session if connected, or auto-connects first.
   */
  const sendWatchfaceBin = async () => {
    setShowBleModal(true);
    let session = bleSessionRef.current;
    if (!session || !session.gattServer || !session.gattServer.connected) {
      setBleLogs(prev => [...prev, '[BLE] Not connected yet. Initiating connection & pairing...']);
      session = await connectBle();
      if (!session) return;
    }

    try {
      setBleStatus('flashing');
      setBleProgress(0);
      const faceName = 'wcmf_dial';
      const binBuffer = buildCmfBinBuffer(faceName);
      const totalBytes = binBuffer.byteLength;
      const binUint8 = new Uint8Array(binBuffer);
      const watchfaceId = getWatchfaceId(faceName);

      setBleLogs(prev => [
        ...prev,
        `[BIN] Compiled CMF container: ${(totalBytes / 1024).toFixed(1)} KB (ID: 0x${watchfaceId.toString(16)}).`,
        '[OTA] Sending Watchface Upload Initialization (wfInit1Req)...'
      ]);

      await session.sendData(CMF_CMD.wfInit1Req, new Uint8Array([0xA5]));
      const init1Rep = await session.waitFor(CMF_CMD.wfInit1Rep);
      if (!init1Rep.length || init1Rep[0] !== 1) {
        throw new Error(`Watch rejected upload initialization (init1: ${bytesToHex(init1Rep)})`);
      }

      const init2Payload = new Uint8Array(13);
      const init2View = new DataView(init2Payload.buffer);
      init2Payload[0] = 3;
      init2View.setUint32(1, 0, true); // Slot 0
      init2View.setUint32(5, watchfaceId, true);
      init2View.setUint32(9, totalBytes, true);

      setBleLogs(prev => [...prev, '[OTA] Requesting memory allocation on watch (wfInit2Req)...']);
      await session.sendData(CMF_CMD.wfInit2Req, init2Payload);
      const init2Rep = await session.waitFor(CMF_CMD.wfInit2Rep);
      if (!init2Rep.length || init2Rep[0] !== 1) {
        throw new Error(`Watch refused watchface memory slot (init2: ${bytesToHex(init2Rep)})`);
      }

      setBleLogs(prev => [
        ...prev,
        '[OTA] Memory allocated! Watch is requesting packet chunks...'
      ]);

      // Phase 6: Watch-Driven Packet Stream with Sequential FIFO Queue
      await new Promise((resolve, reject) => {
        let stallTimer = null;
        let transferPromise = Promise.resolve();
        let lastHandledOffset = -1;

        const resetStall = () => {
          clearTimeout(stallTimer);
          stallTimer = setTimeout(() => {
            session.handlers.delete(CMF_CMD.wfChunkReq);
            session.handlers.delete(CMF_CMD.wfFinishAck1);
            reject(new Error('Watchface upload stream stalled by watch.'));
          }, 30000);
        };

        const cleanupHandlers = () => {
          clearTimeout(stallTimer);
          session.handlers.delete(CMF_CMD.wfChunkReq);
          session.handlers.delete(CMF_CMD.wfFinishAck1);
        };

        resetStall();

        session.handlers.set(CMF_CMD.wfChunkReq, chunkReqBytes => {
          if (chunkReqBytes.length < 8) return;
          resetStall();

          const reqView = new DataView(chunkReqBytes.buffer, chunkReqBytes.byteOffset);
          const offset = reqView.getUint32(0, true);
          const size = reqView.getUint32(4, true);

          if (offset >= totalBytes) {
            setBleProgress(100);
            return;
          }

          transferPromise = transferPromise.then(async () => {
            if (offset === lastHandledOffset && offset > 0) return;
            lastHandledOffset = offset;

            const bytesToSend = Math.min(size, totalBytes - offset);
            if (bytesToSend <= 0) return;

            const pct = Math.min(99, Math.round((offset / totalBytes) * 100));
            setBleProgress(pct);
            setBleLogs(prev => [
              ...prev.slice(-5),
              `[TX] Transmitting chunk @ ${(offset / 1024).toFixed(1)} KB / ${(totalBytes / 1024).toFixed(1)} KB (${pct}%)`
            ]);

            const chunkSlice = binUint8.slice(offset, offset + bytesToSend);
            await session.sendData(CMF_CMD.wfChunkWrite, chunkSlice, subProgress => {
              const currentTotal = offset + bytesToSend * subProgress;
              const subPct = Math.min(99, Math.round((currentTotal / totalBytes) * 100));
              setBleProgress(subPct);
            });
          }).catch(err => {
            cleanupHandlers();
            reject(err);
          });
        });

        // Phase 7: Verification & Activation
        session.handlers.set(CMF_CMD.wfFinishAck1, async finishAckBytes => {
          cleanupHandlers();
          try {
            await session.sendData(CMF_CMD.wfFinishAck2, new Uint8Array([0xA5]));
          } catch (e) {}

          if (finishAckBytes.length && finishAckBytes[0] === 1) {
            resolve();
          } else {
            reject(new Error(`Watch did not activate watchface (finishAck: ${bytesToHex(finishAckBytes)})`));
          }
        });
      });

      setBleProgress(100);
      setBleLogs(prev => [
        ...prev,
        '[OK] Watchface written to flash and verified by Zephyr RTOS!',
        '[OK] Watchface activated live on your CMF Watch screen!'
      ]);
      setBleStatus('connected');
      showToast('Watchface successfully installed on CMF Watch!');
    } catch (err) {
      setBleStatus('error');
      setBleLogs(prev => [
        ...prev,
        `[ERR] Bluetooth upload error: ${err.message}`
      ]);
    }
  };

  const startBleFlash = async () => {
    return sendWatchfaceBin();
  };

  const exportJSON = () => {
    const project = {
      cmf_version: '1.0',
      timestamp: new Date().toISOString(),
      device,
      bezel,
      strap,
      backgroundColor,
      elements
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `cmf-watchface-project.json`;
    link.href = url;
    link.click();
    showToast('Project JSON exported');
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.elements) {
          if (data.device) setDevice(data.device);
          if (data.bezel) setBezel(data.bezel);
          if (data.strap) setStrap(data.strap);
          if (data.backgroundColor) setBackgroundColor(data.backgroundColor);
          setElements(data.elements);
          setSelectedId(null);
          setViewMode('studio');
          showToast('Project loaded successfully');
        }
      } catch (err) {
        alert('Invalid JSON watchface file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const devBezels = getDeviceBezels(device);
  const currentBezel = devBezels.find(b => b.id === bezel) || devBezels[0] || { id: 'default', name: 'Default Bezel', color: '#1E1E22', accent: '#333338', style: 'flat' };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0C0C0D] text-[#F2F2F2] select-none font-sans overflow-hidden">
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="h-14 border-b border-[#242428] bg-[#141416] px-4 flex items-center justify-between z-30 flex-shrink-0">
        {/* Logo / Brand */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1.5 bg-[#FF4400] text-white px-2.5 py-1 rounded font-bold text-xs tracking-wider shadow-lg shadow-[#FF4400]/20 cursor-pointer hover:bg-[#FF5A1F] transition flex-shrink-0"
            onClick={() => setViewMode('menu')}
            title="Return to Main Menu"
          >
            <span>WCMF</span>
            <span className="text-[10px] opacity-75 font-normal">STUDIO</span>
          </div>

          <div className="cmf-segmented">
            <button
              className={`cmf-segmented-item px-3 py-1 text-xs ${viewMode === 'menu' ? 'active' : ''}`}
              onClick={() => setViewMode('menu')}
            >
              Main Menu
            </button>
            <button
              className={`cmf-segmented-item px-3 py-1 text-xs ${viewMode === 'studio' ? 'active' : ''}`}
              onClick={() => setViewMode('studio')}
            >
              Studio Editor
            </button>
          </div>

          <div
            className="text-xs font-mono text-[#8E8E93] hidden xl:block cursor-pointer select-none hover:text-white transition"
            onClick={() => {
              const next = lexClickCount + 1;
              setLexClickCount(next);
              if (next >= 5) {
                setLexClickCount(0);
                showToast('[LEX LABS] Root access granted. Check browser console!');
                if (window.wcmf && window.wcmf.secret) {
                  window.wcmf.secret();
                }
              }
            }}
            title="WCMF Studio by Lex"
          >
            OPEN SOURCE <span className="text-[#FF4400]">BY LEX</span>
          </div>
        </div>

        {viewMode === 'studio' ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#1B1B1E] border border-[#2A2A30] rounded px-2.5 py-1">
              <span className="text-[10px] font-mono text-[#8E8E93] uppercase font-bold">MODEL:</span>
              <select
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                value={device}
                onChange={(e) => {
                  const newDev = e.target.value;
                  setDevice(newDev);
                  const bList = getDeviceBezels(newDev);
                  if (bList.length > 0) setBezel(bList[0].id);
                  showToast(`Switched to ${getDeviceConfig(newDev).name}`);
                }}
              >
                {Object.values(SUPPORTED_DEVICES).map(d => (
                  <option key={d.id} value={d.id} className="bg-[#141416] text-white">
                    {d.name} ({d.badge})
                  </option>
                ))}
              </select>
            </div>

            {devBezels.length > 0 && (
              <select
                className="cmf-select w-36 text-xs py-1.5"
                value={bezel}
                onChange={(e) => setBezel(e.target.value)}
                title="Case / Bezel Style"
              >
                {devBezels.map(b => (
                  <option key={b.id} value={b.id}>Style: {b.name.split(' ')[0]}</option>
                ))}
              </select>
            )}

            <select
              className="cmf-select w-32 text-xs py-1.5"
              value={strap}
              onChange={(e) => setStrap(e.target.value)}
              title="CMF Strap Color"
            >
              {STRAPS.map(s => (
                <option key={s.id} value={s.id}>Strap: {s.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs font-mono text-[#8E8E93]">
            SYSTEM READY • <span className="text-[#FF4400]">v1.0</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {viewMode === 'studio' && (
            <>
              <button
                className={`cmf-btn cmf-btn-sm ${isAOD ? 'cmf-btn-active' : ''}`}
                onClick={() => setIsAOD(!isAOD)}
                title="Toggle Always-On Display Mode"
              >
                <span>AOD {isAOD ? 'ON' : 'OFF'}</span>
              </button>

              <button
                className={`cmf-btn cmf-btn-sm ${isLiveClock ? 'cmf-btn-active' : ''}`}
                onClick={() => setIsLiveClock(!isLiveClock)}
                title="Toggle Live Real-Time Ticking Clock"
              >
                <span>LIVE {isLiveClock ? '●' : '○'}</span>
              </button>
            </>
          )}

          <button
            className="cmf-btn cmf-btn-sm"
            onClick={() => setShowPresetsModal(true)}
          >
            <span>PRESETS</span>
          </button>

          <button
            className={`cmf-btn cmf-btn-sm flex items-center gap-1.5 ${
              bleStatus === 'connected'
                ? 'border-[#30D158] text-[#30D158] bg-[#30D158]/10 hover:bg-[#30D158]/20'
                : 'border-[#3A3A40] text-[#A0A0A5] hover:border-[#FF4400] hover:text-[#FF4400]'
            }`}
            onClick={connectBle}
            disabled={bleStatus === 'pairing' || bleStatus === 'flashing'}
            title={bleStatus === 'connected' ? `Connected: ${bleDeviceName || 'CMF Watch'}${bleBattery !== null ? ` (${bleBattery}%)` : ''}` : 'Pair and authenticate CMF Watch over Bluetooth'}
          >
            <CmfDotIcon name={bleStatus === 'connected' ? 'check' : 'bluetooth'} size={13} color={bleStatus === 'connected' ? '#30D158' : '#FF4400'} />
            <span>{bleStatus === 'connected' ? (bleBattery !== null ? `PAIRED ${bleBattery}%` : 'PAIRED') : 'PAIR BLE'}</span>
          </button>

          <button
            className="cmf-btn cmf-btn-sm border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400]/15 flex items-center gap-1.5 font-bold"
            onClick={sendWatchfaceBin}
            disabled={bleStatus === 'flashing' || bleStatus === 'pairing'}
            title="Send compiled .BIN watchface directly to CMF Watch"
          >
            <CmfDotIcon name="flash" size={13} color="#FF4400" />
            <span>SEND .BIN</span>
          </button>

          <button
            className="cmf-btn cmf-btn-sm cmf-btn-primary"
            onClick={() => setShowExportModal(true)}
          >
            <span>EXPORT</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY */}
      {viewMode === 'menu' ? (
        <div className="flex-1 cmf-dot-bg overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="max-w-5xl w-full space-y-8 py-4">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4400]/10 border border-[#FF4400]/30 text-[#FF4400] text-xs font-mono font-bold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-[#FF4400] animate-ping" />
                WATCHFACE STUDIO
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
                WCMF <span className="text-[#FF4400]">STUDIO</span>
              </h1>
              <p className="text-sm md:text-base text-[#8E8E93] max-w-2xl mx-auto leading-relaxed font-normal">
                Craft, customize, export, and flash bespoke digital & analog watchfaces for <strong className="text-white">CMF Watch Pro 2</strong>, <strong className="text-white">Watch 3 Pro</strong>, <strong className="text-white">Watch Pro</strong>, and <strong className="text-white">Watch Band</strong> with authentic dot-matrix typography, modular complications, and Zephyr RTOS TLV binary compilation.
              </p>

              {/* Hardware / Pairing Warning Box */}
              <div className="max-w-2xl mx-auto p-4 rounded-xl bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-start gap-3 text-left shadow-lg">
                <div className="mt-0.5 flex-shrink-0">
                  <CmfDotIcon name="cross" size={18} color="#FF4400" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#FF4400] uppercase tracking-wider font-mono">
                    Hardware & Pairing Warning
                  </div>
                  <p className="text-[#E0E0E6] leading-relaxed">
                    Direct Bluetooth pairing, authentication handshakes, and watchface flashing carry inherent risks of <strong>softbrick</strong> or <strong>accidental device factory resets</strong>. Proceed at your own risk.
                  </p>
                </div>
              </div>

              {/* Light CMF Orange Maintenance Disclaimer Box */}
              <div className="max-w-2xl mx-auto p-4 rounded-xl bg-[#FF4400]/10 border border-[#FF4400]/30 flex items-start gap-3 text-left shadow-lg">
                <div className="mt-0.5 flex-shrink-0">
                  <CmfDotIcon name="info" size={18} color="#FF4400" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#FF4400] uppercase tracking-wider font-mono">
                    Maintenance Disclaimer
                  </div>
                  <p className="text-[#C8C8CE] leading-relaxed">
                    This project is provided as an open-source tool as-is. Active ongoing maintenance, regular feature updates, or guaranteed compatibility with future firmware releases are not assured.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Watch Pro 2 */}
              <div
                className="p-5 bg-[#141416] border border-[#242428] hover:border-[#FF4400] rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-[#FF4400]/10 min-h-[210px]"
                onClick={() => startNewProject('watch-pro-2')}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition">
                      <CmfDotIcon name="analog-hands" size={22} color="#FF4400" />
                    </div>
                    <span className="text-[10px] font-mono bg-[#222226] px-2 py-0.5 rounded text-[#FF4400] font-bold">466×466</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FF4400] transition">
                    Watch Pro 2 (Round)
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    1.32" AMOLED circular canvas with interchangeable knurled bezels and dial widgets.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#242428] text-xs font-mono font-bold text-[#FF4400] flex items-center justify-between">
                  <span>CREATE DIAL</span>
                  <span>→</span>
                </div>
              </div>

              {/* Card 2: Watch 3 Pro (New Model) */}
              <div
                className="p-5 bg-[#141416] border border-[#242428] hover:border-[#FF4400] rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-[#FF4400]/10 min-h-[210px]"
                onClick={() => startNewProject('watch-3-pro')}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition">
                      <CmfDotIcon name="radial-gauge" size={22} color="#FF4400" />
                    </div>
                    <span className="text-[10px] font-mono bg-[#FF4400]/20 text-[#FF4400] px-2 py-0.5 rounded font-bold">NEW • 1.43"</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FF4400] transition">
                    Watch 3 Pro (Round)
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    1.43" Ultra-Bright 650 nits AMOLED canvas with titanium & ceramic sport bezels.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#242428] text-xs font-mono font-bold text-[#FF4400] flex items-center justify-between">
                  <span>CREATE DIAL</span>
                  <span>→</span>
                </div>
              </div>

              {/* Card 3: Watch Pro 1 */}
              <div
                className="p-5 bg-[#141416] border border-[#242428] hover:border-[#FF4400] rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-[#FF4400]/10 min-h-[210px]"
                onClick={() => startNewProject('watch-pro-1')}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition">
                      <CmfDotIcon name="time-bold" size={22} color="#FF4400" />
                    </div>
                    <span className="text-[10px] font-mono bg-[#222226] px-2 py-0.5 rounded text-[#8E8E93] font-bold">410×502</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FF4400] transition">
                    Watch Pro (Squircle)
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    1.96" AMOLED squircle canvas optimized for large stacked typography and stat pills.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#242428] text-xs font-mono font-bold text-[#FF4400] flex items-center justify-between">
                  <span>CREATE DIAL</span>
                  <span>→</span>
                </div>
              </div>

              {/* Card 4: Watch Band / Compact (New Model) */}
              <div
                className="p-5 bg-[#141416] border border-[#242428] hover:border-[#FF4400] rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-[#FF4400]/10 min-h-[210px]"
                onClick={() => startNewProject('watch-compact')}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition">
                      <CmfDotIcon name="seconds-bar" size={22} color="#FF4400" />
                    </div>
                    <span className="text-[10px] font-mono bg-[#222226] px-2 py-0.5 rounded text-[#8E8E93] font-bold">280×456</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FF4400] transition">
                    Watch Band (Compact)
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    1.64" Rectangular AMOLED slim layout for fitness metrics and vertical dot clocks.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#242428] text-xs font-mono font-bold text-[#FF4400] flex items-center justify-between">
                  <span>CREATE DIAL</span>
                  <span>→</span>
                </div>
              </div>

              {/* Card 5: Presets Gallery */}
              <div
                className="p-5 bg-[#141416] border border-[#242428] hover:border-[#FF4400] rounded-xl cursor-pointer transition flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-[#FF4400]/10 min-h-[210px] md:col-span-2 lg:col-span-2"
                onClick={() => setShowPresetsModal(true)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4400]/15 border border-[#FF4400]/40 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition">
                      <CmfDotIcon name="dot-grid" size={22} color="#FF4400" />
                    </div>
                    <span className="cmf-badge cmf-badge-orange">{PRESETS.length} PRESETS INCLUDED</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#FF4400] transition">
                    Signature Watchface Gallery
                  </h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    Explore pre-configured faces across all models: Titanium Chrono, Bauhaus Analog, N-Dot Core, Triple Rings, Squircle Typo Stack, and Minimal Band.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#242428] text-xs font-mono font-bold text-[#FF4400] flex items-center justify-between">
                  <span>BROWSE GALLERY</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#141416] border border-[#242428] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#242428] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                  Hardware Specifications &amp; Features
                </span>
                <span className="cmf-badge cmf-badge-orange">ZEPHYR RTOS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CmfDotIcon name="typography" size={16} color="#FF4400" />
                    <span>N-Dot Typography</span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    Authentic 5x7 and 7x9 bitmapped dot-matrix rendering for time, dates, battery levels, and live fitness metrics.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CmfDotIcon name="ring" size={16} color="#FF4400" />
                    <span>Interchangeable Bezels</span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    Support for CMF Watch Pro 2 bezels: Dark Grey Flat, Knurled Texture, Ash Grey Raised, and CMF Orange Sport.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CmfDotIcon name="heart" size={16} color="#FF4400" />
                    <span>Modular Complications</span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">
                    Full drag & drop layout engine with heart rate pulse charts, weather badges, activity rings, and fast deletion.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <label className="cmf-btn cmf-btn-sm cursor-pointer">
                  <span>Import Project (.json)</span>
                  <input type="file" accept=".json" className="hidden" onChange={importJSON} />
                </label>
                <button
                  className="cmf-btn cmf-btn-primary"
                  onClick={() => setViewMode('studio')}
                >
                  <span>LAUNCH STUDIO EDITOR →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT DRAWER: COMPONENT LIBRARY */}
          <aside className="w-64 border-r border-[#242428] bg-[#141416] flex flex-col z-20 flex-shrink-0">
            <div className="p-3 border-b border-[#242428] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">COMPONENTS</span>
              <span className="cmf-badge cmf-badge-orange">CMF DIAL</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {COMPONENT_LIBRARY.map((cat, idx) => (
                <div key={idx}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#55555B] mb-2 px-1">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-2.5 bg-[#1B1B1E] hover:bg-[#242428] border border-[#2A2A30] hover:border-[#FF4400] rounded cursor-pointer transition flex items-center justify-between group"
                        onClick={() => addElement(item)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 flex items-center justify-center text-[#FF4400] group-hover:scale-110 transition flex-shrink-0">
                            <CmfDotIcon name={item.iconName} size={20} color="#FF4400" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#F2F2F2] group-hover:text-[#FF4400] transition">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-[#8E8E93] leading-tight">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#FF4400] opacity-0 group-hover:opacity-100 transition">
                          +
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 border-t border-[#242428] text-[10px] text-[#55555B] font-mono text-center">
              Click to add • Right-click or Del to remove
            </div>
          </aside>

          {/* CENTER: WATCH VIEWPORT & CANVAS */}
          <main className="flex-1 cmf-dot-bg flex flex-col items-center justify-center relative overflow-hidden p-4">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-[#141416]/90 backdrop-blur border border-[#242428] p-1.5 rounded shadow-xl">
              <button
                className={`cmf-btn cmf-btn-sm ${showGrid ? 'cmf-btn-active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Alignment Grid"
              >
                GRID
              </button>
              <button
                className="cmf-btn cmf-btn-sm"
                onClick={undo}
                disabled={historyIndex === 0}
                title="Undo (Ctrl+Z)"
              >
                UNDO
              </button>
              <button
                className="cmf-btn cmf-btn-sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                title="Redo (Ctrl+Shift+Z)"
              >
                REDO
              </button>

              {selectedElement && (
                <>
                  <div className="w-[1px] h-4 bg-[#2A2A30]" />
                  <button
                    className="cmf-btn cmf-btn-sm bg-red-600/20 border-red-500/50 hover:bg-red-600 text-white font-bold flex items-center gap-1.5 transition"
                    onClick={() => deleteElement(selectedElement.id)}
                    title="Delete Selected Element (Delete / Backspace / x)"
                  >
                    <CmfDotIcon name="trash" size={13} color="#FFFFFF" />
                    <span>DELETE (DEL)</span>
                  </button>
                  <button
                    className="cmf-btn cmf-btn-sm"
                    onClick={() => duplicateElement(selectedElement.id)}
                    title="Duplicate Layer"
                  >
                    <CmfDotIcon name="copy" size={13} color="#FFFFFF" />
                  </button>
                </>
              )}

              <div className="w-[1px] h-4 bg-[#2A2A30]" />
              <button
                className="cmf-btn cmf-btn-sm hover:text-red-400"
                onClick={() => {
                  if (confirm('Clear all elements and start fresh?')) {
                    updateElementsWithHistory([]);
                    setSelectedId(null);
                    showToast('Canvas cleared');
                  }
                }}
                title="Clear Canvas"
              >
                CLEAR ALL
              </button>
            </div>

            {selectedElement && (
              <div className="absolute top-16 z-20 bg-[#1B1B1E]/95 backdrop-blur-md border border-[#FF4400]/60 px-3 py-1.5 rounded-full flex items-center gap-3 shadow-2xl animate-fade-in">
                <span className="text-xs font-bold text-[#FF4400] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF4400] animate-pulse" />
                  {selectedElement.name}
                </span>
                <div className="w-[1px] h-3 bg-[#2A2A30]" />
                <button
                  className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 transition shadow"
                  onClick={() => deleteElement(selectedElement.id)}
                  title="Delete (Del)"
                >
                  <CmfDotIcon name="trash" size={11} color="#FFFFFF" />
                  <span>DELETE</span>
                </button>
                <button
                  className="text-xs font-semibold text-[#8E8E93] hover:text-white flex items-center gap-1 transition"
                  onClick={() => updateSelectedElement({ x: canvasWidth / 2, y: canvasHeight / 2 })}
                  title="Center on Dial"
                >
                  <span>CENTER</span>
                </button>
                <button
                  className="text-xs font-semibold text-[#8E8E93] hover:text-white px-1"
                  onClick={() => setSelectedId(null)}
                  title="Deselect (Esc)"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Responsive Strict-Ratio Watch Container */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden w-full h-full relative">
              <div
                className="relative flex items-center justify-center select-none transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <div className={`watch-strap-top ${strap === 'orange' ? 'watch-strap-orange' : strap === 'light-grey' ? 'watch-strap-ash' : ''}`} />
                <div className={`watch-strap-bottom ${strap === 'orange' ? 'watch-strap-orange' : strap === 'light-grey' ? 'watch-strap-ash' : ''}`} />

                {currentDeviceConfig.shape === 'round' ? (
                  <div
                    className={`watch-frame-round ${currentBezel.style === 'knurled' ? 'cmf-knurled' : ''}`}
                    style={{
                      background: currentBezel.color,
                      border: `12px solid ${currentBezel.accent}`
                    }}
                  >
                    <div className="watch-crown watch-crown-orange" />
                    <div className="w-[466px] h-[466px] rounded-full overflow-hidden relative shadow-inner bg-black flex-shrink-0">
                      <canvas
                        ref={canvasRef}
                        width={466}
                        height={466}
                        className="cursor-crosshair w-full h-full block"
                        onMouseDown={handleCanvasMouseDown}
                        onContextMenu={handleCanvasContextMenu}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                      <div className="watch-glass-glare" />
                    </div>
                  </div>
                ) : currentDeviceConfig.shape === 'squircle' ? (
                  <div
                    className="watch-frame-squircle"
                    style={{
                      background: currentBezel.color || (strap === 'orange' ? '#FF4400' : '#1E1E22'),
                      border: `10px solid ${currentBezel.accent || (strap === 'orange' ? '#D63700' : '#2C2C32')}`
                    }}
                  >
                    <div className="watch-crown" style={{ top: '235px', height: '48px' }} />
                    <div className="w-[410px] h-[502px] rounded-[36px] overflow-hidden relative shadow-inner bg-black flex-shrink-0">
                      <canvas
                        ref={canvasRef}
                        width={410}
                        height={502}
                        className="cursor-crosshair w-full h-full block"
                        onMouseDown={handleCanvasMouseDown}
                        onContextMenu={handleCanvasContextMenu}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                      <div className="watch-glass-glare" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="watch-frame-rect"
                    style={{
                      background: currentBezel.color || '#18181A',
                      border: `8px solid ${currentBezel.accent || '#2A2A2E'}`
                    }}
                  >
                    <div className="watch-crown" style={{ top: '210px', height: '36px', right: '-10px', width: '10px' }} />
                    <div className="w-[280px] h-[456px] rounded-[22px] overflow-hidden relative shadow-inner bg-black flex-shrink-0">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={456}
                        className="cursor-crosshair w-full h-full block"
                        onMouseDown={handleCanvasMouseDown}
                        onContextMenu={handleCanvasContextMenu}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                      <div className="watch-glass-glare" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 flex items-center gap-3 bg-[#141416]/80 backdrop-blur border border-[#242428] px-3 py-1.5 rounded text-xs font-mono text-[#8E8E93]">
              <span>{currentDeviceConfig.display}</span>
              <div className="w-[1px] h-3 bg-[#2A2A30]" />
              <div className="flex items-center gap-1.5">
                <span>ZOOM:</span>
                <button className="hover:text-white px-1" onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}>-</button>
                <span className="text-[#FF4400]">{Math.round(zoom * 100)}%</span>
                <button className="hover:text-white px-1" onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}>+</button>
                <button className="hover:text-white px-1 text-[10px]" onClick={() => setZoom(1)}>RESET</button>
              </div>
            </div>
          </main>

          {/* RIGHT DRAWER: INSPECTOR & LAYERS */}
          <aside className="w-80 border-l border-[#242428] bg-[#141416] flex flex-col z-20 flex-shrink-0">
            <div className="flex border-b border-[#242428] bg-[#141416]">
              <button
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'inspector'
                    ? 'text-[#FF4400] border-b-2 border-[#FF4400] bg-[#1B1B1E]'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                onClick={() => setActiveTab('inspector')}
              >
                Inspector
              </button>
              <button
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'layers'
                    ? 'text-[#FF4400] border-b-2 border-[#FF4400] bg-[#1B1B1E]'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
                onClick={() => setActiveTab('layers')}
              >
                <span>Layers</span>
                <span className="cmf-badge text-[9px]">{elements.length}</span>
              </button>
            </div>

            {/* TAB 1: INSPECTOR */}
            {activeTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedElement ? (
                  <>
                    <div className="p-3 bg-[#1B1B1E] border border-[#2A2A30] rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#F2F2F2]">{selectedElement.name}</div>
                          <div className="text-[10px] font-mono text-[#FF4400] uppercase">{selectedElement.type}</div>
                        </div>
                        <button
                          className="cmf-btn cmf-btn-icon cmf-btn-sm"
                          onClick={() => duplicateElement(selectedElement.id)}
                          title="Duplicate Element"
                        >
                          <CmfDotIcon name="copy" size={14} color="#FFFFFF" />
                        </button>
                      </div>

                      <button
                        className="w-full py-2 px-3 bg-red-600/20 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-white rounded font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition group"
                        onClick={() => deleteElement(selectedElement.id)}
                        title="Delete Element (Del / Backspace / x)"
                      >
                        <CmfDotIcon name="trash" size={14} color="#FF4400" className="group-hover:text-white" />
                        <span>DELETE ELEMENT (DEL)</span>
                      </button>
                    </div>

                    <div>
                      <label className="cmf-label">Position (X, Y)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1 bg-[#1B1B1E] border border-[#2A2A30] rounded px-2">
                          <span className="text-[10px] font-mono text-[#8E8E93]">X</span>
                          <input
                            type="number"
                            className="cmf-input border-none bg-transparent p-1 text-right"
                            value={selectedElement.x}
                            onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-[#1B1B1E] border border-[#2A2A30] rounded px-2">
                          <span className="text-[10px] font-mono text-[#8E8E93]">Y</span>
                          <input
                            type="number"
                            className="cmf-input border-none bg-transparent p-1 text-right"
                            value={selectedElement.y}
                            onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="cmf-label">Quick Align</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          className="cmf-btn cmf-btn-sm"
                          onClick={() => updateSelectedElement({ x: canvasWidth / 2 })}
                        >
                          Center X
                        </button>
                        <button
                          className="cmf-btn cmf-btn-sm"
                          onClick={() => updateSelectedElement({ y: canvasHeight / 2 })}
                        >
                          Center Y
                        </button>
                        <button
                          className="cmf-btn cmf-btn-sm"
                          onClick={() => updateSelectedElement({ x: canvasWidth / 2, y: canvasHeight / 2 })}
                        >
                          Center Both
                        </button>
                      </div>
                    </div>

                    {selectedElement.color !== undefined && (
                      <div>
                        <label className="cmf-label">Primary Color</label>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                            value={selectedElement.color.startsWith('#') ? selectedElement.color : '#FFFFFF'}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="cmf-input flex-1 font-mono text-xs uppercase"
                            value={selectedElement.color}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CMF_PALETTE.map((swatch, sIdx) => (
                            <div
                              key={sIdx}
                              className="w-5 h-5 rounded-full border border-white/20 cursor-pointer hover:scale-110 transition"
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.name}
                              onClick={() => updateSelectedElement({ color: swatch.hex })}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedElement.dotSize !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="cmf-label mb-0">Dot Size</span>
                          <span className="font-mono text-[#FF4400]">{selectedElement.dotSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          step="0.5"
                          className="cmf-slider"
                          value={selectedElement.dotSize}
                          onChange={(e) => updateSelectedElement({ dotSize: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}

                    {selectedElement.fontSize !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="cmf-label mb-0">Font Size</span>
                          <span className="font-mono text-[#FF4400]">{selectedElement.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="160"
                          className="cmf-slider"
                          value={selectedElement.fontSize}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                        />
                      </div>
                    )}

                    {selectedElement.radius !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="cmf-label mb-0">Radius</span>
                          <span className="font-mono text-[#FF4400]">{selectedElement.radius}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="230"
                          className="cmf-slider"
                          value={selectedElement.radius}
                          onChange={(e) => updateSelectedElement({ radius: parseInt(e.target.value) })}
                        />
                      </div>
                    )}

                    {selectedElement.strokeWidth !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="cmf-label mb-0">Stroke Width</span>
                          <span className="font-mono text-[#FF4400]">{selectedElement.strokeWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="24"
                          className="cmf-slider"
                          value={selectedElement.strokeWidth}
                          onChange={(e) => updateSelectedElement({ strokeWidth: parseInt(e.target.value) })}
                        />
                      </div>
                    )}

                    {selectedElement.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="cmf-label mb-0">Progress Value</span>
                          <span className="font-mono text-[#FF4400]">{Math.round(selectedElement.progress * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          className="cmf-slider"
                          value={selectedElement.progress}
                          onChange={(e) => updateSelectedElement({ progress: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}

                    {selectedElement.text !== undefined && (
                      <div>
                        <label className="cmf-label">Text Content</label>
                        <input
                          type="text"
                          className="cmf-input"
                          value={selectedElement.text}
                          onChange={(e) => updateSelectedElement({ text: e.target.value })}
                        />
                      </div>
                    )}

                    {selectedElement.type === 'analog-hands' && (
                      <div className="space-y-3 pt-2 border-t border-[#242428]">
                        <div className="text-[10px] font-bold uppercase text-[#FF4400]">Hand Styling</div>
                        <div>
                          <label className="cmf-label">Second Hand Color</label>
                          <input
                            type="color"
                            className="w-full h-7 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                            value={selectedElement.secHandColor || '#FF4400'}
                            onChange={(e) => updateSelectedElement({ secHandColor: e.target.value })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="cmf-label mb-0">Second Dot Radius</span>
                            <span className="font-mono">{selectedElement.secDotRadius}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="12"
                            className="cmf-slider"
                            value={selectedElement.secDotRadius || 0}
                            onChange={(e) => updateSelectedElement({ secDotRadius: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}

                    {selectedElement.type === 'dial-ticks' && (
                      <div className="space-y-3 pt-2 border-t border-[#242428]">
                        <div className="text-[10px] font-bold uppercase text-[#FF4400]">Tick Density</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="cmf-label">Tick Count</label>
                            <select
                              className="cmf-select"
                              value={selectedElement.tickCount}
                              onChange={(e) => updateSelectedElement({ tickCount: parseInt(e.target.value) })}
                            >
                              <option value="4">4 (Quadrants)</option>
                              <option value="12">12 (Hours)</option>
                              <option value="24">24 (Half-Hours)</option>
                              <option value="60">60 (Seconds)</option>
                            </select>
                          </div>
                          <div>
                            <label className="cmf-label">Major Every</label>
                            <input
                              type="number"
                              className="cmf-input"
                              value={selectedElement.majorEvery}
                              onChange={(e) => updateSelectedElement({ majorEvery: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedElement.type === 'weather-widget' && (
                      <div className="space-y-3 pt-2 border-t border-[#242428]">
                        <label className="cmf-label">Weather Icon</label>
                        <select
                          className="cmf-select"
                          value={selectedElement.condition}
                          onChange={(e) => updateSelectedElement({ condition: e.target.value })}
                        >
                          <option value="sun">Sunny (Dot Sun)</option>
                          <option value="cloud">Cloudy (Dot Cloud)</option>
                          <option value="rain">Rainy (Dot Rain)</option>
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#55555B]">
                    <div className="w-12 h-12 mb-3 text-[#FF4400] flex items-center justify-center">
                      <CmfDotIcon name="crosshair" size={36} color="#FF4400" />
                    </div>
                    <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                      No Element Selected
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Click any element on the watchface or select from the Layers tab to inspect, move, or delete it.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LAYERS */}
            {activeTab === 'layers' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {elements.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#55555B]">No layers in this watchface.</div>
                ) : (
                  [...elements].reverse().map((el, revIdx) => {
                    const origIdx = elements.length - 1 - revIdx;
                    const isSel = el.id === selectedId;

                    return (
                      <div
                        key={el.id}
                        className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition group ${
                          isSel
                            ? 'bg-[#FF4400]/15 border-[#FF4400] text-white'
                            : 'bg-[#1B1B1E] border-[#2A2A30] text-[#8E8E93] hover:border-[#55555B]'
                        }`}
                        onClick={() => {
                          setSelectedId(el.id);
                          setActiveTab('inspector');
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button
                            className="text-xs hover:text-white p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisibility(el.id);
                            }}
                            title="Toggle Visibility"
                          >
                            {el.visible !== false ? (
                              <CmfDotIcon name="eye" size={14} color="#8E8E93" />
                            ) : (
                              <CmfDotIcon name="eye-off" size={14} color="#55555B" />
                            )}
                          </button>
                          <div className="truncate text-xs font-semibold">
                            {el.name || el.type}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="hover:text-[#FF4400] text-[10px] p-1 font-mono opacity-60 group-hover:opacity-100"
                            onClick={() => moveLayer(el.id, 'up')}
                            disabled={origIdx === elements.length - 1}
                            title="Move Layer Up"
                          >
                            ▲
                          </button>
                          <button
                            className="hover:text-[#FF4400] text-[10px] p-1 font-mono opacity-60 group-hover:opacity-100"
                            onClick={() => moveLayer(el.id, 'down')}
                            disabled={origIdx === 0}
                            title="Move Layer Down"
                          >
                            ▼
                          </button>

                          <button
                            className="p-1 px-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 rounded text-red-400 hover:text-white transition"
                            onClick={() => deleteElement(el.id)}
                            title="Delete this element"
                          >
                            <CmfDotIcon name="trash" size={12} color="currentColor" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="p-3 border-t border-[#242428] bg-[#141416]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#8E8E93]">Dial Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-6 h-6 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                  <span className="font-mono text-xs text-[#8E8E93]">{backgroundColor}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1B1B1E] border border-[#2A2A30] rounded-lg shadow-2xl p-1.5 w-48 text-xs font-semibold"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF4400] border-b border-[#2A2A30] mb-1">
            {contextMenu.element.name}
          </div>
          <button
            className="w-full text-left px-2.5 py-1.5 hover:bg-red-600 hover:text-white rounded text-red-400 flex items-center justify-between transition"
            onClick={() => deleteElement(contextMenu.element.id)}
          >
            <span className="flex items-center gap-1.5">
              <CmfDotIcon name="trash" size={12} color="currentColor" />
              <span>Delete Element</span>
            </span>
            <span className="text-[9px] font-mono opacity-70">Del</span>
          </button>
          <button
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#242428] rounded text-[#F2F2F2] flex items-center justify-between transition"
            onClick={() => duplicateElement(contextMenu.element.id)}
          >
            <span className="flex items-center gap-1.5">
              <CmfDotIcon name="copy" size={12} color="currentColor" />
              <span>Duplicate Layer</span>
            </span>
          </button>
          <div className="w-full h-[1px] bg-[#2A2A30] my-1" />
          <button
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#242428] rounded text-[#8E8E93] hover:text-white transition"
            onClick={() => bringToFront(contextMenu.element.id)}
          >
            Bring to Front
          </button>
          <button
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#242428] rounded text-[#8E8E93] hover:text-white transition"
            onClick={() => sendToBack(contextMenu.element.id)}
          >
            Send to Back
          </button>
          <button
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#242428] rounded text-[#8E8E93] hover:text-white transition"
            onClick={() => {
              updateSelectedElement({ x: canvasWidth / 2, y: canvasHeight / 2 });
              setContextMenu(null);
            }}
          >
            Center on Dial
          </button>
        </div>
      )}

      {/* 4. PRESETS MODAL */}
      {showPresetsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#141416] border border-[#2A2A30] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#242428] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="cmf-badge cmf-badge-orange">COLLECTION</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  CMF Signature Watchface Presets
                </h3>
              </div>
              <button
                className="text-[#8E8E93] hover:text-white text-lg font-bold"
                onClick={() => setShowPresetsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESETS.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-[#1B1B1E] border border-[#2A2A30] hover:border-[#FF4400] rounded-lg cursor-pointer transition flex flex-col justify-between group"
                  onClick={() => loadPreset(p)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#FF4400] transition">
                        {p.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase bg-[#242428] px-1.5 py-0.5 rounded text-[#8E8E93]">
                        {getDeviceConfig(p.device).shortName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E8E93] line-clamp-2 leading-relaxed mb-3">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#242428] text-[10px] font-mono text-[#55555B]">
                    <span>{p.elements.length} MODULES</span>
                    <span className="text-[#FF4400] font-bold group-hover:underline">LOAD WATCHFACE →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#141416] border border-[#2A2A30] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242428]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Export Watchface</span>
                <span className="cmf-badge cmf-badge-orange">CMF</span>
              </h3>
              <button
                className="text-[#8E8E93] hover:text-white text-lg font-bold"
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Official .BIN Binary Package Section */}
              <div className="p-3 bg-[#1A1A1E] border border-[#FF4400] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#FF4400] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#FF4400]"></span>
                    Official CMF Binary Package (.bin)
                  </div>
                  <span className="cmf-badge cmf-badge-orange text-[9px]">FMC & BLE Sideload</span>
                </div>
                <p className="text-[11px] text-[#A0A0A5] leading-relaxed">
                  Generates an authentic CMF watchface binary containing 16-bit RGB565 display buffer, PNG preview, <code className="text-white">face.json</code> manifest, and CRC32 header checksum.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    className="cmf-btn cmf-btn-primary py-2.5 text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-lg"
                    onClick={exportBIN}
                  >
                    <CmfDotIcon name="download" size={13} color="#FFFFFF" />
                    <span>Download .BIN</span>
                  </button>
                  <button
                    className="cmf-btn py-2.5 text-xs font-bold tracking-wide border-[#FF4400] text-[#FF4400] hover:bg-[#FF4400]/15 flex items-center justify-center gap-1.5"
                    onClick={() => {
                      setShowExportModal(false);
                      startBleFlash();
                    }}
                  >
                    <CmfDotIcon name="bluetooth" size={13} color="#FF4400" />
                    <span>Flash via BLE</span>
                  </button>
                </div>
              </div>

              {/* Standard Image Export */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#8E8E93] uppercase">Image Export (PNG)</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="cmf-btn cmf-btn-sm"
                    onClick={() => exportPNG(1)}
                  >
                    1x PNG ({canvasWidth}px)
                  </button>
                  <button
                    className="cmf-btn cmf-btn-sm"
                    onClick={() => exportPNG(2)}
                  >
                    2x Retina HD
                  </button>
                  <button
                    className="cmf-btn cmf-btn-sm"
                    onClick={() => exportPNG(4)}
                  >
                    4x Ultra 4K
                  </button>
                </div>
              </div>

              {/* Project Data */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#8E8E93] uppercase">Project Manifest</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="cmf-btn cmf-btn-sm"
                    onClick={exportJSON}
                  >
                    Export JSON Project
                  </button>
                  <label className="cmf-btn cmf-btn-sm cursor-pointer text-center">
                    <span>Import JSON File</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importJSON}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-[#8E8E93] leading-relaxed border-t border-[#2A2A30] flex items-center gap-1.5">
                <CmfDotIcon name="info" size={13} color="#FF4400" />
                <span><strong>Sideloading Tip:</strong> You can flash exported <code>.bin</code> files directly to your CMF Watch ({currentDeviceConfig.name}) over Web Bluetooth or using <strong>FMC Watchfaces</strong>.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. BLUETOOTH OTA FLASHER MODAL */}
      {showBleModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#141416] border border-[#FF4400]/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#242428]">
              <div className="flex items-center gap-2">
                <CmfDotIcon name="flash" size={18} color="#FF4400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  CMF Watch Bluetooth Flasher (OTA)
                </h3>
              </div>
              <button
                className="text-[#8E8E93] hover:text-white text-lg font-bold"
                onClick={() => setShowBleModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Target Hardware & Connection State */}
            <div className="flex items-center justify-between bg-[#1A1A1E] p-3 rounded-lg border border-[#2A2A30]">
              <div>
                <div className="text-[10px] text-[#8E8E93] uppercase font-bold">Target Device</div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{currentDeviceConfig.name} ({currentDeviceConfig.display})</span>
                  {bleDeviceName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#242428] text-[#FF4400] font-mono">
                      {bleDeviceName}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#8E8E93] uppercase font-bold">Connection State</div>
                <div className="text-xs font-mono font-bold flex items-center justify-end gap-1.5">
                  {bleStatus === 'connected' ? (
                    <span className="text-[#30D158] flex items-center gap-1">
                      <CmfDotIcon name="check" size={11} color="#30D158" />
                      CONNECTED {bleBattery !== null ? `• ${bleBattery}%` : ''}
                    </span>
                  ) : bleStatus === 'flashing' ? (
                    <span className="text-[#FF4400]">SENDING .BIN</span>
                  ) : bleStatus === 'pairing' ? (
                    <span className="text-[#E5F33D]">PAIRING...</span>
                  ) : (
                    <span className="text-[#8E8E93]">NOT CONNECTED</span>
                  )}
                </div>
                {bleFirmware && (
                  <div className="text-[10px] text-[#8E8E93] font-mono">FW: {bleFirmware}</div>
                )}
              </div>
            </div>

            {/* WATCH CONFIRMATION PROMPT BANNER (When waiting for watch acceptance) */}
            {bleStatus === 'pairing' && (
              <div className="bg-[#FF4400]/15 border-2 border-[#FF4400] p-4 rounded-xl text-center space-y-2 animate-pulse shadow-[0_0_20px_rgba(255,68,0,0.3)]">
                <div className="flex items-center justify-center gap-2 text-[#FF4400] font-bold text-sm">
                  <CmfDotIcon name="watch-prompt" size={20} color="#FF4400" />
                  <span className="uppercase tracking-wide">Action Required on Watch</span>
                </div>
                <p className="text-xs text-white font-medium flex items-center justify-center gap-1.5 flex-wrap">
                  <span>Please look at your CMF Watch screen and tap</span>
                  <span className="inline-flex items-center gap-1 text-[#30D158] bg-black/60 px-2 py-0.5 rounded border border-[#30D158]/50 font-mono font-bold text-xs">
                    <CmfDotIcon name="check" size={12} color="#30D158" />
                    ACCEPT
                  </span>
                  <span>to authorize pairing!</span>
                </p>
                <div className="text-[10px] text-[#8E8E93]">
                  The watch is vibrating and displaying the secure handshake prompt.
                </div>
              </div>
            )}

            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#A0A0A5] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    bleStatus === 'flashing' ? 'bg-[#FF4400] animate-ping' :
                    bleStatus === 'pairing' ? 'bg-[#E5F33D] animate-ping' :
                    bleStatus === 'authenticating' ? 'bg-[#00F0FF] animate-pulse' :
                    bleStatus === 'connected' ? 'bg-[#30D158]' :
                    bleStatus === 'success' ? 'bg-[#30D158]' :
                    bleStatus === 'error' ? 'bg-[#FF3B30]' : 'bg-[#8E8E93]'
                  }`}></span>
                  Status: <strong className="text-white capitalize">{bleStatus}</strong>
                  {bleDeviceName && <span className="text-[#8E8E93]">({bleDeviceName})</span>}
                </span>
                <span className="font-mono font-bold text-[#FF4400]">{bleProgress}%</span>
              </div>
              <div className="w-full bg-[#242428] rounded-full h-3 overflow-hidden border border-[#2E2E34]">
                <div
                  className="bg-[#FF4400] h-full transition-all duration-150 relative"
                  style={{ width: `${bleProgress}%` }}
                >
                  {bleStatus === 'flashing' && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Transmission Logs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider">
                <span>Transmission Terminal Logs</span>
                {localStorage.getItem('wcmf_authkey') && (
                  <span className="text-[#30D158] font-mono lowercase">auth key cached</span>
                )}
              </div>
              <div className="bg-[#09090B] border border-[#1F1F24] rounded-lg p-3 font-mono text-[11px] h-36 overflow-y-auto space-y-1 text-[#A0A0A5]">
                {bleLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.startsWith('[OK]') ? 'text-[#30D158] font-bold' :
                      log.startsWith('[ERR]') ? 'text-[#FF3B30] font-bold' :
                      log.startsWith('[TX]') ? 'text-[#00F0FF]' :
                      log.startsWith('[PAIR]') ? 'text-[#E5F33D] font-bold' :
                      log.startsWith('[AUTH]') ? 'text-[#B7E576]' :
                      log.startsWith('[BLE]') ? 'text-[#FF4400]' : 'text-[#A0A0A5]'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions & Controls */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  className={`cmf-btn py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 ${
                    bleStatus === 'connected'
                      ? 'border-[#30D158] text-[#30D158] bg-[#30D158]/10 hover:bg-[#30D158]/20'
                      : 'border-[#3A3A40] text-white hover:border-[#FF4400] hover:text-[#FF4400]'
                  }`}
                  onClick={connectBle}
                  disabled={bleStatus === 'flashing' || bleStatus === 'pairing'}
                  title="Discover device, authenticate session, and connect GATT"
                >
                  <CmfDotIcon name={bleStatus === 'connected' ? 'check' : 'bluetooth'} size={14} color={bleStatus === 'connected' ? '#30D158' : '#FF4400'} />
                  <span>
                    {bleStatus === 'pairing' ? 'Confirm on Watch...' :
                     bleStatus === 'connected' ? (bleBattery !== null ? `1. Re-Pair (${bleBattery}%)` : '1. Re-Pair BLE') :
                     '1. Pair BLE'}
                  </span>
                </button>

                <button
                  className="cmf-btn cmf-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
                  onClick={sendWatchfaceBin}
                  disabled={bleStatus === 'flashing' || bleStatus === 'pairing'}
                  title="Compile and send .BIN watchface over Bluetooth"
                >
                  <CmfDotIcon name="flash" size={14} color="#FFFFFF" />
                  <span>
                    {bleStatus === 'flashing' ? `Sending... ${bleProgress}%` : '2. Send .BIN to Watch'}
                  </span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  className="cmf-btn flex-1 py-2 text-xs text-[#8E8E93] hover:text-white"
                  onClick={() => setShowBleModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  className="cmf-btn cmf-btn-sm border-[#FFD000]/60 text-[#FFD000] hover:bg-[#FFD000]/10 text-[10px] flex items-center justify-center gap-1.5"
                  onClick={runSimulatedBleFlash}
                  disabled={bleStatus === 'flashing'}
                  title="Run an animated simulated BLE transmission to preview the OTA flow"
                >
                  <CmfDotIcon name="flash" size={12} color="#FFD000" />
                  <span>Demo Mode</span>
                </button>
                <button
                  className="cmf-btn cmf-btn-sm text-[10px] text-[#8E8E93] hover:text-red-400 border-[#2A2A30] flex items-center justify-center gap-1.5"
                  onClick={forgetBleDevice}
                  title="Clear stored auth token and cached pairing keys"
                >
                  <CmfDotIcon name="trash" size={12} color="currentColor" />
                  <span>Reset Key</span>
                </button>
                <a
                  href="https://fmc.freethinkel.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="cmf-btn cmf-btn-sm text-[10px] text-[#A0A0A5] hover:text-white flex items-center justify-center gap-1.5"
                  title="Open FMC Web Installer in a new tab"
                >
                  <CmfDotIcon name="info" size={12} color="currentColor" />
                  <span>FMC Web ↗</span>
                </a>
              </div>
            </div>

            <div className="text-[10px] text-[#8E8E93] leading-relaxed border-t border-[#242428] pt-2 flex items-center gap-1.5">
              <CmfDotIcon name="info" size={13} color="#FF4400" />
              <span><strong>Pairing Note:</strong> Make sure Bluetooth on your smartphone (CMF Watch app) is temporarily turned OFF while sideloading so the watch is not exclusively locked by the phone.</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#FF4400] text-white px-4 py-2 rounded shadow-2xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 z-50 animate-bounce">
          <span>●</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// Mount React 18 Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
