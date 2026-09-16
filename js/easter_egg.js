/**
 * WCMF Studio — Easter Egg Engine: Rickroll & Google Gravity Chaos
 * Never gonna give you up, never gonna let you down!
 * Features full Rickroll video, 8-bit chiptune synthesizer, dancing lyrics,
 * plus 2D physics Google Gravity simulation.
 * 100% non-destructive: restores cleanly without altering React state or project data.
 */

(function () {
  'use strict';

  let activeMode = null; // 'rickroll' | 'gravity' | null
  let animFrameId = null;
  let audioCtx = null;
  let overlayCanvas = null;
  let ctx = null;
  let hudElement = null;
  let rickrollModal = null;
  let melodyTimeout = null;
  let physicsItems = [];
  let isDraggingItem = null;
  let dragOffset = { x: 0, y: 0 };
  let lastMouse = { x: 0, y: 0, vx: 0, vy: 0, time: 0 };

  // ==========================================================================
  // 1. RETRO WEB AUDIO SYNTHESIZER: NEVER GONNA GIVE YOU UP CHIPTUNE
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

  function playTone(freq, type = 'square', duration = 0.15, volume = 0.14) {
    if (freq <= 0) return;
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

  function playCrashSound() {
    try {
      const ac = getAudioContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ac.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.35);
    } catch (e) {}
  }

  // Iconic Never Gonna Give You Up notes
  const RICK_MELODY = [
    { f: 293.66, d: 0.15 }, // D4
    { f: 329.63, d: 0.15 }, // E4
    { f: 392.00, d: 0.15 }, // G4
    { f: 329.63, d: 0.15 }, // E4
    { f: 493.88, d: 0.35 }, // B4 - Ne-ver
    { f: 493.88, d: 0.35 }, // B4 - gon-na
    { f: 440.00, d: 0.50 }, // A4 - give you up
    { f: 0,      d: 0.15 },
    { f: 293.66, d: 0.15 }, // D4
    { f: 329.63, d: 0.15 }, // E4
    { f: 392.00, d: 0.15 }, // G4
    { f: 329.63, d: 0.15 }, // E4
    { f: 440.00, d: 0.35 }, // A4 - Ne-ver
    { f: 440.00, d: 0.35 }, // A4 - gon-na
    { f: 392.00, d: 0.50 }, // G4 - let you down
    { f: 0,      d: 0.15 },
    { f: 293.66, d: 0.15 }, // D4
    { f: 329.63, d: 0.15 }, // E4
    { f: 392.00, d: 0.15 }, // G4
    { f: 329.63, d: 0.15 }, // E4
    { f: 392.00, d: 0.35 }, // G4 - Ne-ver
    { f: 440.00, d: 0.35 }, // A4 - gon-na
    { f: 369.99, d: 0.35 }, // F#4 - run a-
    { f: 329.63, d: 0.30 }, // E4 - round
    { f: 293.66, d: 0.35 }, // D4 - and de-
    { f: 329.63, d: 0.30 }, // E4 - sert
    { f: 392.00, d: 0.60 }  // G4 - you!
  ];

  function playRickChiptune(index = 0) {
    if (activeMode !== 'rickroll') return;
    if (index >= RICK_MELODY.length) {
      melodyTimeout = setTimeout(() => playRickChiptune(0), 1200);
      return;
    }
    const note = RICK_MELODY[index];
    if (note.f > 0) {
      playTone(note.f, 'square', note.d, 0.12);
    }
    melodyTimeout = setTimeout(() => {
      playRickChiptune(index + 1);
    }, note.d * 1000 + 40);
  }

  function stopChiptune() {
    if (melodyTimeout) {
      clearTimeout(melodyTimeout);
      melodyTimeout = null;
    }
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
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#FF4400; box-shadow:0 0 8px #FF4400; animation:pulse 1s infinite;"></span>
        <span style="font-weight:bold; letter-spacing:1px; color:#FF4400;">RICKROLL PROTOCOL</span>
      </div>
      <div id="wcmf-easter-status" style="background:#18181B; padding:3px 8px; border-radius:6px; border:1px solid #27272A; font-weight:bold; color:#FFD700;">
        NEVER GONNA GIVE YOU UP 🎵
      </div>
      <div style="display:flex; gap:6px;">
        <button id="btn-easter-rickroll" style="background:#27272A; color:#FFF; border:1px solid #3F3F46; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;">
          🕺 RICKROLL
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

    document.getElementById('btn-easter-rickroll').addEventListener('click', () => startRickrollMode());
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

  // ==========================================================================
  // 3. MODE 1: RICKROLL STAGE & DANCING LYRICS
  // ==========================================================================
  const LYRICS = [
    "NEVER GONNA GIVE YOU UP 🕺",
    "NEVER GONNA LET YOU DOWN 🎵",
    "NEVER GONNA RUN AROUND AND DESERT YOU ✨",
    "NEVER GONNA MAKE YOU CRY 🎤",
    "NEVER GONNA SAY GOODBYE 🎶",
    "NEVER GONNA TELL A LIE AND HURT YOU ❤️"
  ];

  let lyricIndex = 0;
  let discoParticles = [];

  function spawnDiscoParticles() {
    discoParticles = [];
    for (let i = 0; i < 40; i++) {
      discoParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2 - 1,
        size: Math.random() * 4 + 2,
        color: ['#FF4400', '#FFD700', '#00FFFF', '#FFFFFF', '#FFB8DE'][Math.floor(Math.random() * 5)],
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  function createRickrollModal() {
    if (rickrollModal) return;

    rickrollModal = document.createElement('div');
    rickrollModal.id = 'wcmf-rickroll-modal';
    rickrollModal.style.position = 'fixed';
    rickrollModal.style.top = '50%';
    rickrollModal.style.left = '50%';
    rickrollModal.style.transform = 'translate(-50%, -50%)';
    rickrollModal.style.zIndex = '99999';
    rickrollModal.style.width = 'min(92vw, 640px)';
    rickrollModal.style.background = '#0E0E10';
    rickrollModal.style.border = '2px solid #FF4400';
    rickrollModal.style.borderRadius = '16px';
    rickrollModal.style.padding = '18px';
    rickrollModal.style.boxShadow = '0 0 50px rgba(255, 68, 0, 0.5), 0 20px 60px rgba(0,0,0,0.9)';
    rickrollModal.style.textAlign = 'center';
    rickrollModal.style.color = '#FFFFFF';
    rickrollModal.style.fontFamily = 'monospace';

    rickrollModal.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #222; padding-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:18px;">🕺</span>
          <span style="font-weight:bold; color:#FF4400; font-size:13px; letter-spacing:1px;">YOU JUST GOT RICKROLLED</span>
        </div>
        <button id="btn-close-rickroll" style="background:transparent; border:none; color:#8E8E93; font-size:18px; font-weight:bold; cursor:pointer; hover:color:#FFF;">✕</button>
      </div>

      <!-- Native MP4 Video Player with Autoplay & Controls -->
      <div style="position:relative; width:100%; padding-top:56.25%; border-radius:10px; overflow:hidden; border:1px solid #27272A; background:#000;">
        <video
          id="rickroll-native-video"
          autoplay
          playsinline
          controls
          loop
          style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; background:#000;"
        >
          <source src=".rickroll.mp4" type="video/mp4">
          <source src="rickroll.mp4" type="video/mp4">
          Your browser does not support HTML5 MP4 video.
        </video>
      </div>

      <!-- Live Karaoke Subtitle Banner -->
      <div id="rickroll-live-lyrics" style="margin-top:14px; font-size:14px; font-weight:bold; color:#FFD700; text-transform:uppercase; letter-spacing:1.5px; text-shadow:0 0 10px rgba(255, 215, 0, 0.6);">
        NEVER GONNA GIVE YOU UP 🕺
      </div>

      <div style="margin-top:8px; font-size:11px; color:#8E8E93;">
        Press <span style="color:#FFF; font-weight:bold; background:#242428; padding:2px 6px; border-radius:4px;">ESC</span> to return to your watchface studio
      </div>
    `;

    document.body.appendChild(rickrollModal);

    const videoEl = document.getElementById('rickroll-native-video');
    if (videoEl) {
      videoEl.volume = 0.85;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          stopChiptune();
        }).catch(err => {
          console.warn('[Rickroll] Native video autoplay blocked, starting chiptune fallback:', err);
          playRickChiptune();
        });
      }
    }

    document.getElementById('btn-close-rickroll').addEventListener('click', () => {
      restoreReality();
    });
  }

  function startRickrollMode() {
    if (activeMode === 'gravity') {
      cleanupGravity();
    }
    activeMode = 'rickroll';
    createOverlay();
    createRickrollModal();
    spawnDiscoParticles();

    if (animFrameId) cancelAnimationFrame(animFrameId);
    let lastLyricTime = 0;

    function rickrollLoop(time) {
      if (activeMode !== 'rickroll') return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Rotate lyrics every 2.4 seconds
      if (time - lastLyricTime > 2400) {
        lyricIndex = (lyricIndex + 1) % LYRICS.length;
        const lyricEl = document.getElementById('rickroll-live-lyrics');
        if (lyricEl) {
          lyricEl.textContent = LYRICS[lyricIndex];
          lyricEl.style.color = ['#FFD700', '#FF4400', '#00FFFF', '#30D158', '#FFB8DE'][lyricIndex % 5];
        }
        lastLyricTime = time;
      }

      // Draw disco particles & equalizer waves
      discoParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = window.innerHeight;
          p.x = Math.random() * window.innerWidth;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
      });

      animFrameId = requestAnimationFrame(rickrollLoop);
    }

    animFrameId = requestAnimationFrame(rickrollLoop);
  }

  // ==========================================================================
  // 4. MODE 2: GOOGLE GRAVITY (2D PHYSICS DESTRUCTION)
  // ==========================================================================
  function startGravityMode() {
    if (activeMode === 'gravity') return;
    activeMode = 'gravity';
    createOverlay();
    stopChiptune();
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    playCrashSound();

    // Target major UI blocks
    const selector = [
      '#wcmf-rickroll-modal',
      'header',
      '.cmf-card',
      'button:not(#btn-easter-restore):not(#btn-easter-rickroll):not(#btn-easter-gravity)',
      '.cmf-select',
      '.watch-case-container',
      '.watch-preview-container',
      'h1', 'h2', 'h3',
      '.bg-\\[\\#141416\\]',
      '.bg-\\[\\#1A1A1E\\]'
    ].join(',');

    const rawElements = Array.from(document.querySelectorAll(selector));
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
        vy: Math.random() * -5,
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
          item.vx = (lastMouse.vx * 0.7);
          item.vy = (lastMouse.vy * 0.7);
          item.vAngle = (lastMouse.vx * 0.1);
        } else {
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

    stopChiptune();
    cleanupGravity();

    // Remove Rickroll Modal and stop video
    if (rickrollModal) {
      const videoEl = rickrollModal.querySelector('#rickroll-native-video');
      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.src = '';
          videoEl.load();
        } catch (e) {}
      }
      if (rickrollModal.parentElement) {
        rickrollModal.parentElement.removeChild(rickrollModal);
      }
      rickrollModal = null;
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

    activeMode = null;

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
    startRickrollMode();
  };

  window.triggerRickroll = function () {
    startRickrollMode();
  };

  window.triggerGoogleGravity = function () {
    startGravityMode();
  };

  window.restoreReality = restoreReality;
})();
