/* ==========================================================
   script.js — Portfolio interactions
   - Smooth eased momentum scrolling (custom lerp engine)
   - Linear scroll: Home is start, Contact is end (no loop)
   - Fade transition between pages
   - Mobile nav, scroll reveal, active nav highlight
   ========================================================== */

// ── Page sequence (linear — Home is start, Contact is end)
const PAGES       = ['index.html', 'about.html', 'projects.html', 'skills.html', 'contact.html'];
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
const currentIdx  = PAGES.indexOf(currentFile) === -1 ? 0 : PAGES.indexOf(currentFile);
const nextPage    = currentIdx < PAGES.length - 1 ? PAGES[currentIdx + 1] : null;
const prevPage    = currentIdx > 0                ? PAGES[currentIdx - 1] : null;

// ── Dynamic year
document.getElementById('year').textContent = new Date().getFullYear();

// ── Mobile nav toggle
const menuBtn  = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ── Scroll reveal with stagger
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = Array.from(
      entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')
    );
    setTimeout(() => entry.target.classList.add('visible'), siblings.indexOf(entry.target) * 80);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Active nav highlight
const sections = document.querySelectorAll('section[id]');
const navItems  = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 100) current = sec.id; });
  navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}, { passive: true });


/* ──────────────────────────────────────────────────────────
   SMOOTH MOMENTUM SCROLL (lerp-based)
   Intercepts wheel events and applies eased inertia so the
   page drifts to a stop rather than stopping instantly.
   ────────────────────────────────────────────────────────── */
(function initMomentumScroll() {
  let targetY   = window.scrollY;
  let currentY  = window.scrollY;
  let isRunning = false;

  const LERP = 0.09;  // lower = more floaty, higher = snappier

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function tick() {
    currentY = lerp(currentY, targetY, LERP);
    if (Math.abs(targetY - currentY) < 0.4) {
      currentY  = targetY;
      isRunning = false;
      return;
    }
    window.scrollTo(0, currentY);
    requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    targetY = clamp(targetY + e.deltaY * 1.2, 0, maxScroll);
    if (!isRunning) {
      isRunning = true;
      currentY  = window.scrollY;
      requestAnimationFrame(tick);
    }
  }, { passive: false });

  // Keep targetY in sync when scrolling via keyboard / scrollbar
  window.addEventListener('scroll', () => {
    if (!isRunning) { targetY = currentY = window.scrollY; }
  }, { passive: true });
})();


/* ──────────────────────────────────────────────────────────
   PAGE TRANSITION OVERLAY
   ────────────────────────────────────────────────────────── */
const overlay = document.createElement('div');
overlay.className = 'page-transition';
document.body.appendChild(overlay);

function navigateTo(url) {
  overlay.classList.add('fade-out');
  setTimeout(() => { window.location.href = url; }, 440);
}

// Fade in from black on every page load
window.addEventListener('load', () => {
  overlay.style.cssText = 'opacity:1; transition:none;';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity    = '0';
  }));
});

// Intercept internal nav clicks for smooth transitions
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (href && !href.startsWith('#') && !href.startsWith('http')
           && !href.startsWith('mailto') && !href.startsWith('tel')) {
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(href); });
  }
});


/* ──────────────────────────────────────────────────────────
   CROSS-PAGE SCROLL (linear, no nudge pills)
   - Scroll past bottom → next page (stops at contact.html)
   - Scroll past top    → prev page  (stops at index.html)
   - Touch swipe supported on mobile
   ────────────────────────────────────────────────────────── */
(function initPageScroll() {
  let triggered   = false;
  let downBuffer  = 0;
  let upBuffer    = 0;
  const THRESHOLD = 90;

  const atBottom = () => (window.innerHeight + Math.round(window.scrollY)) >= document.body.scrollHeight - 6;
  const atTop    = () => window.scrollY <= 2;

  window.addEventListener('wheel', (e) => {
    if (triggered) return;

    if (e.deltaY > 0 && atBottom() && nextPage) {
      downBuffer += e.deltaY;
      if (downBuffer >= THRESHOLD) { triggered = true; navigateTo(nextPage); }
    } else if (e.deltaY < 0 && atTop() && prevPage) {
      upBuffer += Math.abs(e.deltaY);
      if (upBuffer >= THRESHOLD) { triggered = true; navigateTo(prevPage); }
    } else {
      downBuffer = 0;
      upBuffer   = 0;
    }
  }, { passive: true });

  // Touch swipe (mobile)
  let touchStartY = 0;
  window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', e => {
    if (triggered) return;
    const delta = touchStartY - e.changedTouches[0].clientY;
    if (delta >  55 && atBottom() && nextPage) { triggered = true; navigateTo(nextPage); }
    if (delta < -55 && atTop()    && prevPage) { triggered = true; navigateTo(prevPage); }
  }, { passive: true });
})();