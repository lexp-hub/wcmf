/**
 * ============================================================================
 * WCMF STUDIO — CANVAS 2D RENDERING ENGINE (js/engine/renderer.js)
 * ============================================================================
 * 
 * DESCRIPTION:
 * High-performance 2D Canvas pipeline that renders the dynamic watchface state
 * in real-time, including:
 * - Live clock simulation (hours, minutes, seconds, milliseconds)
 * - Always-On Display (AOD) energy-saving mode (black background, dimmed strokes)
 * - Parametric CMF elements (analog hands, dot-matrix time, radial gauges,
 *   subdials, step rings, battery bars, weather widgets, and tick rings)
 * - Canvas export rasterization for Zephyr RTOS RGB565 binary compilation
 * 
 * MAINTAINER GUIDE:
 * - `renderWatchface`: Main entry point. Handles clearing, grid overlays,
 *   layer sorting, and selection bounding outlines.
 * - `renderElement`: Switch dispatcher for all element types.
 * - Each element calculation is isolated in its own scope to avoid state leakage.
 * ============================================================================
 */

import { drawDotMatrixText, drawDotMatrixIcon } from '../dotmatrix.js';

export function renderWatchface(ctx, width, height, elements, options = {}) {
  const {
    now = new Date(),
    isAOD = false,
    selectedId = null,
    hoveredId = null,
    isExport = false,
    backgroundColor = '#0A0A0C',
    showGrid = false
  } = options;

  // 1. Clear & Background
  // "I am vengeance, I am the night... I am pure #000000 OLED pitch black." - Batman (•_•)>⌐■-■
  ctx.save();
  ctx.fillStyle = isAOD ? '#000000' : backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Optional editor grid overlay
  // "Use the Force, Luke... let go of the snap grid." (ง'̀-'́)ง
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
    // Center crosshair
    ctx.strokeStyle = 'rgba(255, 68, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  // 2. Render Elements in Layer Order
  // "One does not simply render out of layer index order." - Boromir [ ಠ_ಠ ]
  elements.forEach(el => {
    if (el.visible === false) return;
    if (isAOD && el.hideInAOD) return;

    ctx.save();
    renderElement(ctx, el, now, isAOD);
    ctx.restore();
  });

  // 3. Render Selection Bounding Box (if editing)
  if (!isExport && !isAOD && selectedId) {
    const selectedEl = elements.find(el => el.id === selectedId);
    if (selectedEl) {
      renderSelectionOutline(ctx, selectedEl);
    }
  }

  ctx.restore();
}

/**
 * Render an individual element based on its type.
 */
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

      // Background Track
      if (el.trackColor && el.trackColor !== 'transparent') {
        ctx.beginPath();
        ctx.arc(el.x, el.y, radius, startRad, startRad + totalSpanRad);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = isAOD ? 'rgba(255,255,255,0.05)' : el.trackColor;
        ctx.lineCap = el.cap || 'round';
        ctx.stroke();
      }

      // Progress Arc
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

      ctx.font = `700 ${el.fontSize || 48}px var(--font-sans)`;
      ctx.fillStyle = isAOD ? '#CCCCCC' : (el.color || '#FFFFFF');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, el.x, el.y);
      break;
    }

    case 'custom-text': {
      ctx.font = `${el.fontWeight || '600'} ${el.fontSize || 24}px var(--font-${el.fontFamily || 'sans'})`;
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
        ctx.font = `600 ${el.fontSize || 12}px var(--font-sans)`;
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

        ctx.font = `700 ${el.fontSize || 14}px var(--font-mono)`;
        ctx.fillStyle = isAOD ? '#FFFFFF' : (el.color || '#FFFFFF');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateText, el.x, el.y);
      } else {
        ctx.font = `600 ${el.fontSize || 13}px var(--font-sans)`;
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

      // Draw Icon
      drawDotMatrixIcon(ctx, cond, startX + iconW / 2, el.y, {
        dotSize: iconDotSize,
        dotGap: dotGap,
        color: iconColor,
        align: 'center'
      });

      // Draw Temp
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

      // Battery Outline
      ctx.strokeStyle = isAOD ? '#444444' : (el.color || '#8E8E93');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barWidth - 4, barHeight);

      // Battery Tip
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(x + barWidth - 4, y + 2, 2.5, barHeight - 4);

      // Fill Level
      const fillW = Math.max(0, ((barWidth - 6) * level) / 100);
      ctx.fillStyle = isAOD ? '#888888' : (el.fillColor || '#FF4400');
      ctx.fillRect(x + 2, y + 2, fillW, barHeight - 4);

      // Text %
      ctx.font = '600 10px var(--font-mono)';
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

      // Subdial Background Circle
      ctx.beginPath();
      ctx.arc(el.x, el.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isAOD ? '#111111' : 'rgba(255, 255, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Progress Arc
      ctx.beginPath();
      ctx.arc(el.x, el.y, radius - 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label & Sublabel
      if (el.label) {
        ctx.font = '700 12px var(--font-mono)';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label, el.x, el.y - 4);
      }
      if (el.sublabel) {
        ctx.font = '600 8px var(--font-sans)';
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

        ctx.font = '600 11px var(--font-mono)';
        ctx.fillStyle = isAOD ? '#888888' : (el.color || '#FFFFFF');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, cx - 10, el.y);
      });
      break;
    }

    case 'text-badge': {
      ctx.font = `700 ${el.fontSize || 10}px var(--font-sans)`;
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

      // 1. Hour Hand
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

      // 2. Minute Hand
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

      // 3. Second Hand (hidden in AOD for power saving)
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

        // Second Hand Dot
        if (el.secDotRadius) {
          ctx.fillStyle = secColor;
          ctx.beginPath();
          ctx.arc(0, -sl * 0.75, el.secDotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Center Cap / Hub
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

/**
 * Renders an active selection bounding box & drag handle.
 */
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

  // Corner Handles
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

  // Name pill label above selection
  ctx.font = '700 10px var(--font-sans)';
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

/**
 * Calculates approximate bounding box for an element for hit testing and selection.
 */
export function getElementBounds(el) {
  const defaultW = 100;
  const defaultH = 40;

  switch (el.type) {
    case 'ring':
    case 'radial-gauge':
    case 'dial-ticks':
    case 'dot-grid':
    case 'analog-hands': {
      const r = el.radius || (el.type === 'analog-hands' ? el.secHandLength || 150 : 100);
      return {
        x: el.x - r,
        y: el.y - r,
        width: r * 2,
        height: r * 2
      };
    }
    case 'digital-time-dot': {
      const dotSize = el.dotSize || 5;
      const dotGap = el.dotGap || 2;
      const charGap = el.charGap || 6;
      const charCount = el.showSeconds ? 8 : 5;
      const charW = 5 * dotSize + 4 * dotGap;
      const totalW = charCount * charW + (charCount - 1) * charGap;
      const totalH = 7 * dotSize + 6 * dotGap;
      return {
        x: el.x - totalW / 2,
        y: el.y - totalH / 2,
        width: totalW,
        height: totalH
      };
    }
    case 'digital-time-bold': {
      const fs = el.fontSize || 48;
      const w = fs * 2.8;
      const h = fs;
      return {
        x: el.x - w / 2,
        y: el.y - h / 2,
        width: w,
        height: h
      };
    }
    case 'custom-text':
    case 'text-badge':
    case 'date-badge': {
      const fs = el.fontSize || 14;
      const len = (el.text || 'WEDNESDAY 15 SEP').length;
      const w = len * fs * 0.65 + 20;
      const h = fs + 16;
      return {
        x: el.x - w / 2,
        y: el.y - h / 2,
        width: w,
        height: h
      };
    }
    case 'custom-text-dot': {
      const dotSize = el.dotSize || 3;
      const len = (el.text || 'TEXT').length;
      const w = len * (5 * dotSize + 4 * (el.dotGap || 2) + (el.charGap || 4));
      const h = 7 * dotSize + 6 * (el.dotGap || 2);
      return {
        x: el.x - w / 2,
        y: el.y - h / 2,
        width: w,
        height: h
      };
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
      return {
        x: el.x - r,
        y: el.y - (el.radius ? r : 18),
        width: r * 2,
        height: el.radius ? r * 2 : 36
      };
    }
    case 'pill-stats-row': {
      const w = 270;
      const h = 30;
      return {
        x: el.x - w / 2,
        y: el.y - h / 2,
        width: w,
        height: h
      };
    }
    default:
      return {
        x: el.x - defaultW / 2,
        y: el.y - defaultH / 2,
        width: defaultW,
        height: defaultH
      };
  }
}

/**
 * Hit test helper to check if a point (px, py) is inside an element.
 */
export function hitTestElement(el, px, py) {
  const bounds = getElementBounds(el);
  return (
    px >= bounds.x &&
    px <= bounds.x + bounds.width &&
    py >= bounds.y &&
    py <= bounds.y + bounds.height
  );
}

