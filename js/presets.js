/**
 * ============================================================================
 * WCMF STUDIO — WATCHFACE PRESET LIBRARY (js/presets.js)
 * ============================================================================
 * 
 * DESCRIPTION:
 * Curated collection of default watchfaces crafted according to CMF by Nothing
 * design guidelines (monochrome geometry, high-contrast orange accents, dot matrix).
 * 
 * PRESET SCHEMA:
 * - id: Unique kebab-case identifier (string)
 * - name: Display title in the Preset Browser (string)
 * - description: Summary of typography, widgets, and style (string)
 * - device: Target hardware canvas: 'watch-pro-2' (466x466), 'watch-pro' (410x502),
 *   'watch-3-pro' (480x480), or 'watch-band' (194x368).
 * - bezel: Default bezel aesthetic ('dark-grey', 'ash-grey', 'orange-accent', etc.)
 * - strap: Default strap color ('orange', 'dark-grey', 'ash-grey', 'blue')
 * - backgroundColor: Canvas background hex color (string)
 * - elements: Array of parametric layers (radial-gauge, digital-time-dot, etc.)
 * 
 * MAINTAINER GUIDE:
 * - Coordinates (x, y) should target the center of the watch display by default
 *   (e.g., 233, 233 for CMF Watch Pro 2).
 * - All presets must support both active and AOD (Always-On Display) rendering.
 * ============================================================================
 */

export const PRESETS = [
  {
    id: 'cmf-ndot-core',
    name: 'CMF N-Dot Core',
    description: 'Iconic Nothing dot-matrix digital time with CMF Orange activity rings and weather badge.',
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
        name: 'Steps Ring',
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
        name: 'N-Dot Time',
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
        name: 'Date & Day',
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
        name: 'CMF Logo Badge',
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
        name: '60-Sec Ticks',
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

export const SUPPORTED_DEVICES = {
  'watch-pro-2': {
    id: 'watch-pro-2',
    name: 'CMF Watch Pro 2',
    shortName: 'Watch Pro 2',
    shape: 'round',
    width: 466,
    height: 466,
    display: '1.32" AMOLED • 466×466',
    hardwareId: 0x02,
    badge: 'Round 466px'
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
    badge: 'Round 466px • 1.43"'
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
    badge: 'Squircle 410×502'
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
    badge: 'Rect 280×456'
  }
};

export const BEZELS_WATCH_PRO_2 = [
  { id: 'dark-flat', name: 'Dark Grey Flat', color: '#242426', accent: '#18181A', style: 'flat' },
  { id: 'dark-knurled', name: 'Dark Grey Knurled', color: '#1F1F22', accent: '#333338', style: 'knurled' },
  { id: 'ash-grey', name: 'Ash Grey Bezel', color: '#48484E', accent: '#62626A', style: 'raised' },
  { id: 'orange-accent', name: 'CMF Orange Bezel', color: '#FF4400', accent: '#D63700', style: 'sport' },
  { id: 'raw-silver', name: 'Brushed Silver', color: '#A2A2A8', accent: '#CCCCCC', style: 'metallic' }
];

export const STRAPS = [
  { id: 'orange', name: 'CMF Signature Orange', color: '#FF4400' },
  { id: 'dark', name: 'Dark Ash / Charcoal', color: '#1E1E22' },
  { id: 'light-grey', name: 'Light Cool Grey', color: '#5C5C64' },
  { id: 'blue-slate', name: 'Blue Slate', color: '#2B3542' }
];

export const CMF_PALETTE = [
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

