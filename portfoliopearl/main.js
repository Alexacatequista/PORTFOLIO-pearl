(function () {
  'use strict';

  const TOTAL_FRAMES = 80;
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });

  const images = new Array(TOTAL_FRAMES);
  const loaded = new Array(TOTAL_FRAMES).fill(false);

  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnFrame = -1;
  let needsRedraw = false;
  const LERP_FACTOR = 0.1;

  function getFrameUrl(index) {
    const frameNumber = String(index + 1).padStart(3, '0');
    return `frames/ezgif-frame-${frameNumber}.jpg`;
  }

  function resizeCanvas() {
    const container = canvas.parentElement || canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(container.clientWidth * dpr);
    const height = Math.round(container.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      needsRedraw = true;
    }
  }

  function getNearestLoadedImage(index) {
    if (images[index] && loaded[index]) return images[index];

    // Search backwards
    for (let i = index - 1; i >= 0; i--) {
      if (images[i] && loaded[i]) return images[i];
    }
    // Search forwards
    for (let i = index + 1; i < TOTAL_FRAMES; i++) {
      if (images[i] && loaded[i]) return images[i];
    }
    return null;
  }

  function renderFrame(index) {
    const img = getNearestLoadedImage(index);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let dw, dh, dx, dy;
    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function updateScrollProgress() {
    const heroWrapper = document.getElementById('home');
    if (!heroWrapper) return;

    const rect = heroWrapper.getBoundingClientRect();
    const wrapperTop = window.pageYOffset + rect.top;
    const scrollableDistance = heroWrapper.offsetHeight - window.innerHeight;

    if (scrollableDistance <= 0) return;

    const currentScroll = window.pageYOffset - wrapperTop;
    const progress = Math.min(Math.max(currentScroll / scrollableDistance, 0), 1);
    targetFrame = progress * (TOTAL_FRAMES - 1);
  }

  function animationLoop() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) < 0.001) {
      currentFrame = targetFrame;
    } else {
      currentFrame += diff * LERP_FACTOR;
    }

    const frameIndex = Math.round(currentFrame);
    if (frameIndex !== lastDrawnFrame || needsRedraw) {
      renderFrame(frameIndex);
      lastDrawnFrame = frameIndex;
      needsRedraw = false;
    }

    requestAnimationFrame(animationLoop);
  }

  function preloadImages() {
    // 1. Immediately load frame 0
    const firstImg = new Image();
    images[0] = firstImg;
    firstImg.onload = () => {
      loaded[0] = true;
      needsRedraw = true;
    };
    firstImg.src = getFrameUrl(0);

    // 2. Load remaining frames asynchronously
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      images[i] = img;
      img.onload = () => {
        loaded[i] = true;
        if (Math.round(currentFrame) === i) {
          needsRedraw = true;
        }
      };
      img.src = getFrameUrl(i);
    }
  }

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileDrawer.classList.toggle('open');
    });

    const mobileLinks = mobileDrawer.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // Active Nav Link Spy on Scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  function updateActiveNav() {
    const scrollY = window.pageYOffset;
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateActiveNav();
  }, { passive: true });

  resizeCanvas();
  updateScrollProgress();
  preloadImages();
  requestAnimationFrame(animationLoop);
})();
