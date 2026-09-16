/**
 * WCMF Studio — Easter Egg Engine: Pac-Man Chomp & Google Gravity Chaos
 * Combines authentic 8-bit Pac-Man text-chomping with a full 2D Google Gravity physics simulation.
 * 100% non-destructive: gracefully restores all DOM elements without altering React state or project data.
 */

(function () {
  'use strict';

  let activeMode = null; // 'pacman' | 'gravity' | null
  let animFrameId = null;
  let audioCtx = null;
  let overlayCanvas = null;
  let ctx = null;
  let hudElement = null;
  let score = 0;
  let chompedElements = new Set();
  let physicsItems = [];
  let isDraggingItem = null;
  let dragOffset = { x: 0, y: 0 };
  let lastMouse = { x: 0, y: 0, vx: 0, vy: 0, time: 0 };

  // ==========================================================================
  // 1. RETRO WEB AUDIO SYNTHESIZER
  // ==========================================================================
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, type = 'triangle', duration = 0.08, volume = 0.15) {
    try {
      const ac = getAudioContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);

      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  let wakaToggle = false;
  function playWaka() {
    wakaToggle = !wakaToggle;
    playTone(wakaToggle ? 360 : 490, 'triangle', 0.09, 0.18);
  }

  function playFruitEat() {
    try {
      const ac = getAudioContext();
      if (!ac) return;
      [580, 680, 780, 920].forEach((f, idx) => {
        setTimeout(() => playTone(f, 'square', 0.08, 0.12), idx * 40);
      });
    } catch (e) {}
  }

  function playCrashSound() {
    try {
      const ac = getAudioContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.35);
    } catch (e) {}
  }

  function playRetroJingle() {
    const notes = [493.88, 987.77, 739.99, 622.25, 987.77, 739.99, 622.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'square', 0.12, 0.12), idx * 110);
    });
  }

  // ==========================================================================
  // 2. HUD & OVERLAY SETUP
  // ==========================================================================
  function createOverlay() {
    if (overlayCanvas) return;

    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'wcmf-easter-canvas';
    overlayCanvas.style.position = 'fixed';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.width = '100vw';
    overlayCanvas.style.height = '100vh';
    overlayCanvas.style.zIndex = '99998';
    overlayCanvas.style.pointerEvents = 'none';
    document.body.appendChild(overlayCanvas);

    ctx = overlayCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create interactive Retro HUD Bar
    hudElement = document.createElement('div');
    hudElement.id = 'wcmf-easter-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '12px';
    hudElement.style.left = '50%';
    hudElement.style.transform = 'translateX(-50%)';
    hudElement.style.zIndex = '99999';
    hudElement.style.background = '#09090B';
    hudElement.style.border = '2px solid #FF4400';
    hudElement.style.borderRadius = '12px';
    hudElement.style.padding = '8px 16px';
    hudElement.style.display = 'flex';
    hudElement.style.alignItems = 'center';
    hudElement.style.gap = '14px';
    hudElement.style.boxShadow = '0 0 25px rgba(255, 68, 0, 0.4)';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.color = '#FFFFFF';
    hudElement.style.fontSize = '12px';
    hudElement.style.userSelect = 'none';

    hudElement.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#FF4400; box-shadow:0 0 8px #FF4400;"></span>
        <span style="font-weight:bold; letter-spacing:1px; color:#FF4400;">CHAOS PROTOCOL</span>
      </div>
      <div id="wcmf-easter-score" style="background:#18181B; padding:3px 8px; border-radius:6px; border:1px solid #27272A; font-weight:bold; color:#FFD700;">
        SCORE: 00000
      </div>
      <div style="display:flex; gap:6px;">
        <button id="btn-easter-pacman" style="background:#27272A; color:#FFF; border:1px solid #3F3F46; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;">
          🟡 PAC-MAN
        </button>
        <button id="btn-easter-gravity" style="background:#27272A; color:#FFF; border:1px solid #3F3F46; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;">
          ⚡ GRAVITY
        </button>
        <button id="btn-easter-restore" style="background:#FF4400; color:#000; border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold; box-shadow:0 0 10px rgba(255,68,0,0.5);">
          ↺ RESTORE [ESC]
        </button>
      </div>
    `;

    document.body.appendChild(hudElement);

    document.getElementById('btn-easter-pacman').addEventListener('click', () => startPacmanMode());
    document.getElementById('btn-easter-gravity').addEventListener('click', () => startGravityMode());
    document.getElementById('btn-easter-restore').addEventListener('click', () => restoreReality());
  }

  function resizeCanvas() {
    if (!overlayCanvas) return;
    overlayCanvas.width = window.innerWidth * window.devicePixelRatio;
    overlayCanvas.height = window.innerHeight * window.devicePixelRatio;
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function updateScore(pts) {
    score += pts;
    const scoreEl = document.getElementById('wcmf-easter-score');
    if (scoreEl) {
      scoreEl.textContent = `SCORE: ${score.toString().padStart(5, '0')}`;
    }
  }

  // ==========================================================================
  // 3. MODE 1: PAC-MAN TEXT CHOMPER
  // ==========================================================================
  let pacman = {
    x: 0,
    y: 0,
    vx: 5,
    vy: 0,
    radius: 28,
    angle: 0,
    mouthAngle: 0.25,
    mouthOpening: true,
    targetNodes: [],
    particles: []
  };

  let ghosts = [
    { name: 'Blinky', color: '#FF0000', x: -100, y: 0, delay: 18 },
    { name: 'Pinky',  color: '#FFB8DE', x: -160, y: 0, delay: 36 },
    { name: 'Inky',   color: '#00FFFF', x: -220, y: 0, delay: 54 },
    { name: 'Clyde',  color: '#FFB847', x: -280, y: 0, delay: 72 }
  ];

  function collectTextTargets() {
    const targets = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      const parent = node.parentElement;
      if (!text || !parent || parent.closest('#wcmf-easter-hud')) continue;

      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight) {
        targets.push({
          node,
          parent,
          originalText: node.textContent,
          rect
        });
      }
    }
    // Shuffle targets to create a fun zigzag path
    return targets.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
  }

  function startPacmanMode() {
    if (activeMode === 'gravity') {
      cleanupGravity();
    }
    activeMode = 'pacman';
    createOverlay();
    playRetroJingle();

    pacman.targetNodes = collectTextTargets();
    pacman.x = window.innerWidth + 50;
    pacman.y = 80;
    pacman.vx = -7;
    pacman.vy = 0;
    pacman.angle = Math.PI; // Face left
    pacman.particles = [];

    ghosts.forEach((g, i) => {
      g.x = pacman.x + (i + 1) * 60;
      g.y = pacman.y;
    });

    if (animFrameId) cancelAnimationFrame(animFrameId);
    let lastWakaTime = 0;
    let targetIndex = 0;

    function pacmanLoop(time) {
      if (activeMode !== 'pacman') return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Mouth animation
      if (pacman.mouthOpening) {
        pacman.mouthAngle += 0.035;
        if (pacman.mouthAngle >= 0.35) pacman.mouthOpening = false;
      } else {
        pacman.mouthAngle -= 0.035;
        if (pacman.mouthAngle <= 0.02) pacman.mouthOpening = true;
      }

      // Audio chomp
      if (time - lastWakaTime > 140) {
        playWaka();
        lastWakaTime = time;
      }

      // Track toward targets across the screen
      if (pacman.targetNodes.length > 0 && targetIndex < pacman.targetNodes.length) {
        const target = pacman.targetNodes[targetIndex];
        const tx = target.rect.left + target.rect.width / 2;
        const ty = target.rect.top + target.rect.height / 2;

        const dx = tx - pacman.x;
        const dy = ty - pacman.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 35) {
          // CHOMP the text!
          if (!chompedElements.has(target.node)) {
            chompedElements.add(target.node);
            const words = target.node.textContent.split(' ');
            if (words.length > 1) {
              target.node.textContent = words.map(() => '•').join(' ');
            } else {
              target.node.textContent = '•••';
            }
            target.parent.style.transition = 'color 0.2s ease, opacity 0.2s ease';
            target.parent.style.color = '#FF4400';
            target.parent.style.opacity = '0.35';

            updateScore(100);
            playFruitEat();

            // Spawn floating "+100" score
            pacman.particles.push({
              x: pacman.x,
              y: pacman.y - 10,
              vy: -1.5,
              text: '+100',
              alpha: 1.0,
              color: '#FFD700'
            });
          }
          targetIndex++;
        } else {
          // Steer towards target
          pacman.vx += (dx / dist) * 0.4;
          pacman.vy += (dy / dist) * 0.4;
          const speed = Math.hypot(pacman.vx, pacman.vy);
          const maxSpeed = 8;
          if (speed > maxSpeed) {
            pacman.vx = (pacman.vx / speed) * maxSpeed;
            pacman.vy = (pacman.vy / speed) * maxSpeed;
          }
          pacman.angle = Math.atan2(pacman.vy, pacman.vx);
        }
      } else {
        // Roam across screen
        if (pacman.x < -60) pacman.x = window.innerWidth + 60;
        if (pacman.x > window.innerWidth + 60) pacman.x = -60;
        if (pacman.y < 50 || pacman.y > window.innerHeight - 50) pacman.vy = -pacman.vy;
      }

      pacman.x += pacman.vx;
      pacman.y += pacman.vy;

      // Wrap around edges
      if (pacman.x < -100) pacman.x = window.innerWidth + 80;
      if (pacman.x > window.innerWidth + 100) pacman.x = -80;
      if (pacman.y < 60) pacman.y = 60;
      if (pacman.y > window.innerHeight - 40) pacman.y = window.innerHeight - 40;

      // Update and follow ghosts
      ghosts.forEach((g, idx) => {
        const targetLeader = idx === 0 ? pacman : ghosts[idx - 1];
        const gdx = targetLeader.x - g.x;
        const gdy = targetLeader.y - g.y;
        const gdist = Math.hypot(gdx, gdy);
        if (gdist > 45) {
          g.x += (gdx / gdist) * 6;
          g.y += (gdy / gdist) * 6;
        }
        drawGhost(g.x, g.y, g.color, time);
      });

      // Draw Pac-Man
      drawPacman(pacman.x, pacman.y, pacman.radius, pacman.angle, pacman.mouthAngle);

      // Draw floating particles
      for (let i = pacman.particles.length - 1; i >= 0; i--) {
        const p = pacman.particles[i];
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          pacman.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.fillText(p.text, p.x - 15, p.y);
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(pacmanLoop);
    }

    animFrameId = requestAnimationFrame(pacmanLoop);
  }

  function drawPacman(x, y, r, angle, mouth) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.arc(0, 0, r, mouth * Math.PI, (2 - mouth) * Math.PI);
    ctx.lineTo(0, 0);
    ctx.closePath();

    // Classic arcade yellow or CMF vibrant orange
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FF4400';
    ctx.shadowBlur = 15;
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(r * 0.2, -r * 0.55, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();
  }

  function drawGhost(x, y, color, time) {
    ctx.save();
    ctx.translate(x, y);
    const r = 22;

    // Body
    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r, Math.PI, 0, false);
    ctx.lineTo(r, r * 0.8);

    // Wavy bottom skirt
    const waves = 3;
    const step = (r * 2) / waves;
    for (let i = waves; i >= 0; i--) {
      const wx = -r + i * step;
      const wy = r * 0.8 + Math.sin(time * 0.015 + i) * 4;
      ctx.lineTo(wx, wy);
    }
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();

    // Eyes
    [-8, 8].forEach(ex => {
      ctx.beginPath();
      ctx.arc(ex, -6, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Pupils looking towards Pacman
      ctx.beginPath();
      ctx.arc(ex - 2, -6, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#000088';
      ctx.fill();
    });

    ctx.restore();
  }

  // ==========================================================================
  // 4. MODE 2: GOOGLE GRAVITY (2D PHYSICS DESTRUCTION)
  // ==========================================================================
  function startGravityMode() {
    if (activeMode === 'gravity') return;
    activeMode = 'gravity';
    createOverlay();
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    playCrashSound();

    // Collect candidate UI elements
    const selector = [
      'header',
      '.cmf-card',
      'button:not(#btn-easter-restore):not(#btn-easter-pacman):not(#btn-easter-gravity)',
      '.cmf-select',
      '.watch-case-container',
      '.watch-preview-container',
      'h1', 'h2', 'h3',
      '.bg-\\[\\#141416\\]',
      '.bg-\\[\\#1A1A1E\\]'
    ].join(',');

    const rawElements = Array.from(document.querySelectorAll(selector));
    // Filter out children of other elements to avoid double physics
    const elements = rawElements.filter(el => {
      if (el.closest('#wcmf-easter-hud')) return false;
      return !rawElements.some(parent => parent !== el && parent.contains(el));
    });

    physicsItems = elements.map(el => {
      const rect = el.getBoundingClientRect();
      const item = {
        el,
        x: rect.left,
        y: rect.top,
        origX: rect.left,
        origY: rect.top,
        w: rect.width,
        h: rect.height,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -5, // slight initial pop upward
        angle: 0,
        vAngle: (Math.random() - 0.5) * 4,
        isDragging: false,
        mass: Math.max(1, (rect.width * rect.height) / 8000)
      };

      el.style.willChange = 'transform';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      return item;
    });

    setupMousePhysics();

    if (animFrameId) cancelAnimationFrame(animFrameId);

    function gravityLoop() {
      if (activeMode !== 'gravity') return;

      const floorY = window.innerHeight;
      const wallR = window.innerWidth;
      const gravity = 0.55;
      const friction = 0.985;
      const restitution = 0.45;

      physicsItems.forEach(item => {
        if (item.isDragging) {
          // Dragged by user
          item.vx = (lastMouse.vx * 0.7);
          item.vy = (lastMouse.vy * 0.7);
          item.vAngle = (lastMouse.vx * 0.1);
        } else {
          // Apply gravity
          item.vy += gravity;
          item.vx *= friction;
          item.vy *= friction;
          item.vAngle *= 0.98;

          item.x += item.vx;
          item.y += item.vy;
          item.angle += item.vAngle;

          // Floor collision
          if (item.y + item.h > floorY) {
            item.y = floorY - item.h;
            item.vy = -item.vy * restitution;
            item.vx *= 0.92;
            item.vAngle *= 0.85;

            // Small floor bounce sound occasionally on hard impacts
            if (Math.abs(item.vy) > 6) {
              playTone(180 + Math.random() * 60, 'triangle', 0.05, 0.08);
            }
          }

          // Ceiling collision
          if (item.y < 0) {
            item.y = 0;
            item.vy = -item.vy * restitution;
          }

          // Left wall collision
          if (item.x < 0) {
            item.x = 0;
            item.vx = -item.vx * restitution;
          }

          // Right wall collision
          if (item.x + item.w > wallR) {
            item.x = wallR - item.w;
            item.vx = -item.vx * restitution;
          }
        }

        // Apply 3D hardware-accelerated transform
        const dx = item.x - item.origX;
        const dy = item.y - item.origY;
        item.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0px) rotate(${item.angle.toFixed(2)}deg)`;
      });

      animFrameId = requestAnimationFrame(gravityLoop);
    }

    animFrameId = requestAnimationFrame(gravityLoop);
  }

  function setupMousePhysics() {
    function onMouseDown(e) {
      if (activeMode !== 'gravity') return;
      const mx = e.clientX;
      const my = e.clientY;

      for (let i = physicsItems.length - 1; i >= 0; i--) {
        const item = physicsItems[i];
        if (mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
          isDraggingItem = item;
          item.isDragging = true;
          dragOffset.x = mx - item.x;
          dragOffset.y = my - item.y;
          item.el.style.cursor = 'grabbing';
          item.el.style.zIndex = '9999';
          break;
        }
      }
    }

    function onMouseMove(e) {
      const now = performance.now();
      const dt = Math.max(1, now - lastMouse.time);
      lastMouse.vx = ((e.clientX - lastMouse.x) / dt) * 16;
      lastMouse.vy = ((e.clientY - lastMouse.y) / dt) * 16;
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
      lastMouse.time = now;

      if (isDraggingItem) {
        isDraggingItem.x = e.clientX - dragOffset.x;
        isDraggingItem.y = e.clientY - dragOffset.y;
      }
    }

    function onMouseUp() {
      if (isDraggingItem) {
        isDraggingItem.isDragging = false;
        isDraggingItem.el.style.cursor = 'grab';
        isDraggingItem.el.style.zIndex = '';
        isDraggingItem = null;
      }
    }

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function cleanupGravity() {
    physicsItems.forEach(item => {
      item.el.style.transition = 'transform 0.6s cubic-bezier(0.2, 1, 0.3, 1)';
      item.el.style.transform = '';
      item.el.style.cursor = '';
      item.el.style.userSelect = '';
      setTimeout(() => {
        item.el.style.transition = '';
        item.el.style.willChange = '';
      }, 700);
    });
    physicsItems = [];
    isDraggingItem = null;
  }

  // ==========================================================================
  // 5. RESTORE REALITY (GRACEFUL RESET)
  // ==========================================================================
  function restoreReality() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    cleanupGravity();

    // Restore text
    chompedElements.forEach(node => {
      if (node.parentElement) {
        node.parentElement.style.color = '';
        node.parentElement.style.opacity = '';
        node.parentElement.style.transition = '';
      }
    });
    chompedElements.clear();

    // Re-collect original text by refreshing text nodes if needed
    if (pacman.targetNodes) {
      pacman.targetNodes.forEach(t => {
        t.node.textContent = t.originalText;
      });
      pacman.targetNodes = [];
    }

    // Clean overlay and HUD
    if (overlayCanvas && overlayCanvas.parentElement) {
      overlayCanvas.parentElement.removeChild(overlayCanvas);
      overlayCanvas = null;
      ctx = null;
    }

    if (hudElement && hudElement.parentElement) {
      hudElement.parentElement.removeChild(hudElement);
      hudElement = null;
    }

    score = 0;
    activeMode = null;

    // Toast notification
    if (window.showToast) {
      window.showToast('Reality restored: matrix stabilized! 🌐');
    }
  }

  // ESC key listener to quickly restore reality
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeMode) {
      restoreReality();
    }
  });

  // ==========================================================================
  // 6. PUBLIC EXPORTS
  // ==========================================================================
  window.triggerEasterEgg = function () {
    // Default flow: Launch Pac-Man first, with immediate HUD options for Gravity!
    startPacmanMode();
  };

  window.triggerGoogleGravity = function () {
    startGravityMode();
  };

  window.restoreReality = restoreReality;
})();
