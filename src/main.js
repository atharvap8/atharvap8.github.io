/**
 * src/main.js
 * 3D Immersive Revamp — Burnt Silicon Theme
 * Three.js circuit nodes + GSAP ScrollTrigger + Lenis smooth scroll
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ===================================================================
   LENIS — Smooth Momentum Scroll
   =================================================================== */
const lenis = new Lenis({
  duration: 1.35,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Smooth scroll anchor links
document.querySelectorAll('a[data-scroll], [data-scroll]').forEach(el => {
  el.addEventListener('click', (e) => {
    const href = el.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) lenis.scrollTo(target, { offset: -60, duration: 1.6 });
    }
  });
});

/* ===================================================================
   NAV — Hide on scroll down, show on scroll up
   =================================================================== */
const nav = document.getElementById('siteNav');
let lastScrollY = 0;
let navHidden = false;

lenis.on('scroll', ({ scroll }) => {
  const delta = scroll - lastScrollY;
  lastScrollY = scroll;

  if (scroll > 100) {
    nav.classList.add('nav-scrolled');
  } else {
    nav.classList.remove('nav-scrolled');
  }

  if (delta > 5 && !navHidden && scroll > 200) {
    nav.classList.add('nav-hidden');
    navHidden = true;
  } else if (delta < -5 && navHidden) {
    nav.classList.remove('nav-hidden');
    navHidden = false;
  }
});

// Mobile toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle?.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkEls.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.35 }
);
sections.forEach(s => sectionObserver.observe(s));

/* ===================================================================
   THREE.JS — Circuit Node Scene
   =================================================================== */
class CircuitScene {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;

    this.PARTICLE_COUNT = window.innerWidth < 768 ? 0 : 160; // disable on mobile
    if (this.PARTICLE_COUNT === 0) { this.canvas.style.display = 'none'; return; }

    this.MAX_DIST = 130;
    this.MAX_LINES = 450;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.scrollY = 0;

    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initParticles();
    this.initLines();
    this.bindEvents();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 0, 520);
    this.camTarget = new THREE.Vector3(0, 0, 520);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initParticles() {
    const n = this.PARTICLE_COUNT;
    this.posArr = new Float32Array(n * 3);
    this.velArr = new Float32Array(n * 3);
    this.originArr = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * window.innerWidth * 1.6;
      const y = (Math.random() - 0.5) * window.innerHeight * 1.4;
      const z = (Math.random() - 0.5) * 350;
      this.posArr[i * 3]     = x;
      this.posArr[i * 3 + 1] = y;
      this.posArr[i * 3 + 2] = z;
      this.originArr[i * 3]     = x;
      this.originArr[i * 3 + 1] = y;
      this.originArr[i * 3 + 2] = z;
      this.velArr[i * 3]     = (Math.random() - 0.5) * 0.4;
      this.velArr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      this.velArr[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.posArr, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xE8470A,
      size: 2.8,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  initLines() {
    const linePos = new Float32Array(this.MAX_LINES * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: 0xF7A928,
      transparent: true,
      opacity: 0.13,
    });

    this.lineSegments = new THREE.LineSegments(geo, mat);
    this.scene.add(this.lineSegments);
    this.linePos = linePos;
  }

  updateLines() {
    const n = this.PARTICLE_COUNT;
    let lc = 0;

    for (let i = 0; i < n && lc < this.MAX_LINES; i++) {
      let connections = 0;
      for (let j = i + 1; j < n && connections < 3 && lc < this.MAX_LINES; j++) {
        const dx = this.posArr[i * 3]     - this.posArr[j * 3];
        const dy = this.posArr[i * 3 + 1] - this.posArr[j * 3 + 1];
        const dz = this.posArr[i * 3 + 2] - this.posArr[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < this.MAX_DIST) {
          this.linePos[lc * 6]     = this.posArr[i * 3];
          this.linePos[lc * 6 + 1] = this.posArr[i * 3 + 1];
          this.linePos[lc * 6 + 2] = this.posArr[i * 3 + 2];
          this.linePos[lc * 6 + 3] = this.posArr[j * 3];
          this.linePos[lc * 6 + 4] = this.posArr[j * 3 + 1];
          this.linePos[lc * 6 + 5] = this.posArr[j * 3 + 2];
          lc++;
          connections++;
        }
      }
    }

    this.lineSegments.geometry.attributes.position.needsUpdate = true;
    this.lineSegments.geometry.setDrawRange(0, lc * 2);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const n = this.PARTICLE_COUNT;
    const W = window.innerWidth * 0.82;
    const H = window.innerHeight * 0.75;
    const mouseX3d = this.mouse.x * window.innerWidth * 0.5;
    const mouseY3d = this.mouse.y * window.innerHeight * 0.5;

    // Lerp mouse
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.06;

    for (let i = 0; i < n; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

      // Drift
      this.posArr[ix] += this.velArr[ix];
      this.posArr[iy] += this.velArr[iy];
      this.posArr[iz] += this.velArr[iz];

      // Boundary bounce
      if (Math.abs(this.posArr[ix]) > W) this.velArr[ix] *= -1;
      if (Math.abs(this.posArr[iy]) > H) this.velArr[iy] *= -1;
      if (Math.abs(this.posArr[iz]) > 180) this.velArr[iz] *= -1;

      // Mouse repel
      const dx = this.posArr[ix] - mouseX3d;
      const dy = this.posArr[iy] - mouseY3d;
      const d2 = dx * dx + dy * dy;
      if (d2 < 9000) { // ~95px radius
        const d = Math.sqrt(d2);
        const f = (95 - d) / 95;
        this.posArr[ix] += (dx / d) * f * 2.2;
        this.posArr[iy] += (dy / d) * f * 2.2;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.updateLines();

    // Camera float with mouse
    this.camTarget.x = this.mouse.x * 28;
    this.camTarget.y = -this.mouse.y * 18;
    this.camera.position.x += (this.camTarget.x - this.camera.position.x) * 0.04;
    this.camera.position.y += (this.camTarget.y - this.camera.position.y) * 0.04;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Fade on scroll
    const sp = Math.min(window.scrollY / window.innerHeight, 1);
    const alpha = Math.max(0, 1 - sp * 2.2);
    this.points.material.opacity = 0.85 * alpha;
    this.lineSegments.material.opacity = 0.13 * alpha;
    this.camera.position.z = 520 - sp * 180;

    this.renderer.render(this.scene, this.camera);
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}

// Boot Three.js scene
const scene3d = new CircuitScene();

/* ===================================================================
   GSAP SCROLL ANIMATIONS
   =================================================================== */

// Helper: split title into chars for stagger
function splitTitle(el) {
  const text = el.textContent;
  el.innerHTML = '';
  [...text].forEach(char => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    el.appendChild(span);
  });
  return el.querySelectorAll('.char');
}

// Animate section labels
gsap.utils.toArray('.reveal-label').forEach(el => {
  gsap.to(el, {
    opacity: 1,
    x: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});

// Animate section titles — char stagger
gsap.utils.toArray('.split-title').forEach(el => {
  const chars = splitTitle(el);
  gsap.fromTo(chars,
    { y: '110%', opacity: 0, rotateX: -50 },
    {
      y: '0%', opacity: 1, rotateX: 0,
      duration: 0.75,
      stagger: 0.025,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    }
  );
});

// Reveal blocks (paragraphs, cards, form)
gsap.utils.toArray('.reveal-block').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power3.out',
    delay: i % 3 === 0 ? 0 : (i % 3) * 0.08,
    scrollTrigger: { trigger: el, start: 'top 87%' },
  });
});

// Stats — staggered count-up
gsap.utils.toArray('.reveal-stat').forEach((el, i) => {
  const numEl = el.querySelector('.stat-num');
  const target = parseInt(numEl.dataset.target, 10);
  const suffix = numEl.dataset.suffix || '';

  const obj = { val: 0 };
  gsap.to(el, { opacity: 1, y: 0, duration: 0.7, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  gsap.to(obj, {
    val: target,
    duration: 2,
    ease: 'power2.out',
    onUpdate() { numEl.textContent = Math.round(obj.val) + suffix; },
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

// Project cards — stagger from below
ScrollTrigger.batch('.project-card', {
  start: 'top 88%',
  onEnter: (els) => gsap.fromTo(els,
    { y: 60, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
  ),
  once: true,
});

// Blog cards
ScrollTrigger.batch('.blog-card', {
  start: 'top 88%',
  onEnter: (els) => gsap.fromTo(els,
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' }
  ),
  once: true,
});

// Resume cards
ScrollTrigger.batch('.resume-card', {
  start: 'top 88%',
  onEnter: (els) => gsap.fromTo(els,
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' }
  ),
  once: true,
});

/* ===================================================================
   VANILLA TILT — 3D Card Hover
   =================================================================== */
async function initTilt() {
  // Load VanillaTilt dynamically
  const { default: VanillaTilt } = await import('https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.esm.js');
  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max: 8,
    speed: 600,
    glare: true,
    'max-glare': 0.08,
    scale: 1.02,
    gyroscope: false,
  });
}
initTilt();

/* ===================================================================
   DATA INJECTION — Projects + Blog
   =================================================================== */
function waitForData(name, cb, retries = 20) {
  if (typeof window[name] !== 'undefined') return cb(window[name]);
  if (retries <= 0) return;
  setTimeout(() => waitForData(name, cb, retries - 1), 100);
}

// Featured Projects (top 3)
waitForData('projectsData', (data) => {
  const grid = document.getElementById('featuredProjectsGrid');
  if (!grid) return;

  const ids = Object.keys(data).slice(0, 3);
  ids.forEach(id => {
    const p = data[id];
    let src = (p.banner || '').replace('../../', '') || 'assets/main/logo.png';

    const card = document.createElement('div');
    card.className = 'project-card';
    card.onclick = () => location.href = `pages/projects/view.html?id=${id}`;
    card.innerHTML = `
      <div class="project-thumb-wrap">
        <img src="${src}" alt="${p.title}" class="project-thumb" loading="lazy">
        <div class="project-thumb-overlay"></div>
      </div>
      <div class="project-body">
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
        <a href="pages/projects/view.html?id=${id}" class="project-link" onclick="event.stopPropagation()">
          View Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    `;
    grid.appendChild(card);
  });

  // Re-trigger tilt on newly created cards
  ScrollTrigger.refresh();
  initTilt();
});

// Featured Blog (latest 6)
waitForData('blogsData', (data) => {
  const grid = document.getElementById('featuredBlogGrid');
  if (!grid) return;

  const ids = Object.keys(data)
    .sort((a, b) => new Date(data[b].date) - new Date(data[a].date))
    .slice(0, 6);

  ids.forEach(id => {
    const b = data[id];
    const dateStr = new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const card = document.createElement('article');
    card.className = 'blog-card';
    card.onclick = () => location.href = `pages/blog/view.html?id=${id}`;
    card.innerHTML = `
      <div class="blog-date">${dateStr}</div>
      <h3>${b.title}</h3>
      <p>${b.summary}</p>
      <span class="blog-read">
        Read More
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
    `;
    grid.appendChild(card);
  });

  ScrollTrigger.refresh();
});
