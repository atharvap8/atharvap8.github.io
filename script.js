// ==================== Navigation & Smooth Scrolling ====================
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const menuToggle = document.querySelector('.menu-toggle');

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Update active section
        sections.forEach(s => s.classList.remove('active'));
        section.classList.add('active');

        // Scroll to section smoothly
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }
}

// Nav button click handlers
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const sectionId = btn.getAttribute('data-section');
        scrollToSection(sectionId);

        // Update nav button highlight
        navButtons.forEach(b => b.style.borderBottomColor = 'transparent');
        btn.style.borderBottomColor = 'var(--primary-color)';

        // Close mobile menu after clicking a nav button
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
});

// ==================== Robust Scrollspy ====================
function updateScrollspy() {
    let currentSectionId = "home";
    const scrollPosition = window.scrollY + 200; // Increased offset for better section detection

    // Special case for top of page
    if (window.scrollY < 50) {
        currentSectionId = "home";
    } else {
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });

        // Handle bottom of page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            currentSectionId = sections[sections.length - 1].id;
        }
    }

    // Update nav links with specific class
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-section') === currentSectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Initial call and event listener
window.addEventListener('scroll', updateScrollspy);
document.addEventListener('DOMContentLoaded', updateScrollspy);

// Header scroll depth tracking
let lastScrollY = 0;
window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
});

// ==================== Premium Scroll Animations ====================
const revealObserverOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

// ==================== Interactions ====================
// Performance optimization: Using CSS-driven animations for premium feel

// ==================== Ambient Background Parallax ====================
const glowElements = document.querySelectorAll('.ambient-glow');
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;

    glowElements.forEach((glow, index) => {
        const factor = (index + 1) * 0.5;
        glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
});

// ==================== Header Sophistication ====================
const headerElement = document.querySelector('.header');

// Header scroll effect logic removed to keep header constant
/* 
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        headerElement.classList.add('scrolled');
    } else {
        headerElement.classList.remove('scrolled');
    }
}); 
*/

// ==================== Natural Section Reveals ====================
const fluidObserverOptions = {
    threshold: 0.15, // Higher threshold for slower, more deliberate reveal
    rootMargin: '0px 0px -150px 0px'
};

const fluidRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, fluidObserverOptions);

document.querySelectorAll('.section, .project-card, .blog-card, .stat-item, .timeline-item, .about-text, .hero-content > *').forEach(el => {
    el.classList.add('reveal-on-scroll');
    fluidRevealObserver.observe(el);
});

// ==================== Typing Animation for Hero Text ====================
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    const originalText = heroTitle.innerHTML;

    // This animation is handled by CSS, but we can add interactivity
    heroTitle.style.cursor = 'pointer';
    heroTitle.addEventListener('click', () => {
        heroTitle.style.animation = 'none';
        setTimeout(() => {
            heroTitle.style.animation = '';
        }, 10);
    });
}

// ==================== Smooth Number Counter for Stats ====================
const statNumbers = document.querySelectorAll('.stat-number');

function animateCounter(element, target, suffix, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const counter = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + suffix;
            clearInterval(counter);
        } else {
            element.textContent = Math.floor(start) + suffix;
        }
    }, 16);
}

// Trigger counter animation when in view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const originalText = entry.target.textContent.trim();

            if (originalText === '∞') {
                // Keep infinity symbol as is
            } else {
                // Extract number and suffix (+ or %)
                const match = originalText.match(/^(\d+)(.*)$/);
                if (match) {
                    const targetValue = parseInt(match[1]);
                    const suffix = match[2] || '';
                    animateCounter(entry.target, targetValue, suffix);
                }
            }

            entry.target.dataset.animated = 'true';
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => {
    statsObserver.observe(stat);
});

// ==================== Download Resume Function ====================
const downloadBtn = document.querySelector('.resume-header .btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'assets/resume/AP_resume.pdf';
        link.download = 'AP_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// ==================== Mobile Responsiveness ====================
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.style.display = 'flex';
    }
});

// ==================== Scroll to Top Button ====================
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '↑';
scrollToTopBtn.className = 'scroll-to-top-btn';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 50px;
    height: 50px;
    background: rgba(3, 7, 18, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid var(--premium-border);
    border-radius: 50%;
    color: var(--color-primary);
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.style.opacity = '1';
        scrollToTopBtn.style.visibility = 'visible';
    } else {
        scrollToTopBtn.style.opacity = '0';
        scrollToTopBtn.style.visibility = 'hidden';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollToSection('home');
});

// ==================== Performance Optimization ====================
// Debounce function for scroll events
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ==================== Initialize ====================
console.log('Portfolio website loaded successfully! 🚀');
console.log('Scroll to explore all content');

// Set initial active state on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const homeBtn = document.querySelector('[data-section="home"]');
    if (homeBtn) {
        homeBtn.style.borderBottomColor = 'var(--primary-color)';
    }

    // --- Image Lightbox / Zoom Functionality ---
    window.initLightbox = function () {
        const articleImages = document.querySelectorAll('.article-content img');
        if (articleImages.length === 0) return;

        // Check if lightbox already exists
        let lightbox = document.querySelector('.image-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.className = 'image-lightbox';
            lightbox.innerHTML = `
                <img src="" alt="Zoomed Image" class="lightbox-img">
                <div class="lightbox-caption"></div>
            `;
            document.body.appendChild(lightbox);

            // Close listeners
            lightbox.addEventListener('click', () => {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                    lightbox.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        const lightboxImg = lightbox.querySelector('.lightbox-img');
        const lightboxCaption = lightbox.querySelector('.lightbox-caption');

        articleImages.forEach(img => {
            // Avoid double-binding
            if (img.dataset.lightboxBound) return;
            img.dataset.lightboxBound = 'true';

            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                const src = img.getAttribute('src');
                const figure = img.closest('figure');
                const captionElement = figure ? figure.querySelector('figcaption') : null;
                const captionText = captionElement ? captionElement.textContent : (img.getAttribute('alt') || '');

                lightboxImg.src = src;
                lightboxCaption.textContent = captionText;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    };

    // --- TOC ScrollSpy (Refactored for Sections) ---
    window.initTOCScrollSpy = function () {
        const tocLinks = document.querySelectorAll('.toc-link');
        // Target both sections (new structure) and specific headers (legacy/fallback)
        const targets = document.querySelectorAll('.article-content section[id], .article-content h2[id], .article-content h3[id]');

        if (tocLinks.length === 0 || targets.length === 0) return;

        let isClickScrolling = false;
        let clickScrollTimeout;

        // Add click listeners to handle manual clicks gracefully
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // 1. Set clicked link as active immediately
                tocLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // 2. set Lock
                isClickScrolling = true;
                if (clickScrollTimeout) clearTimeout(clickScrollTimeout);

                // 3. Release lock after animation (approx 1000ms)
                clickScrollTimeout = setTimeout(() => {
                    isClickScrolling = false;
                    // Optional: force one check to sync up
                    onScroll();
                }, 1000);
            });
        });

        const onScroll = () => {
            if (isClickScrolling) return; // Skip update if we are scrolling via click

            let currentId = '';

            // Highlight the last target that has passed the top threshold
            targets.forEach(target => {
                const rect = target.getBoundingClientRect();
                // If top of section is above 150px (header + buffer)
                if (rect.top <= 150) {
                    currentId = target.getAttribute('id');
                }
            });

            // Handle bottom of page case
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
                if (targets.length > 0) {
                    currentId = targets[targets.length - 1].getAttribute('id');
                }
            }

            // If we are at the very top, highlight the first one or logic's default
            if (window.scrollY < 100 && targets.length > 0) {
                // currentId = targets[0].getAttribute('id');
            }

            tocLinks.forEach(link => {
                link.classList.remove('active');
                // Check direct match
                if (link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active');

                    // Auto-scroll sidebar to keep active link in view
                    // IMPORTANT: The scrolling container is often .toc-list, NOT .article-sidebar (which is just the sticky wrapper)
                    // We try to find the actual scrolling element.
                    const sidebar = link.closest('.toc-list') || link.closest('.article-sidebar');

                    if (sidebar) {
                        // Don't auto-scroll the sidebar if the user is currently interacting with it (hovering)
                        if (sidebar.matches(':hover')) return;

                        const linkTop = link.offsetTop;
                        const sidebarScroll = sidebar.scrollTop;
                        const sidebarHeight = sidebar.clientHeight;
                        const linkHeight = link.clientHeight;

                        // Simple bounds check: is link out of the visible scroll area?
                        // Note: offsetTop is relative to the offsetParent (the list).

                        if (linkTop < sidebarScroll + 20 || linkTop > sidebarScroll + sidebarHeight - 40) {
                            sidebar.scrollTo({
                                top: linkTop - sidebarHeight / 2 + linkHeight / 2,
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Initial check
        onScroll();
    };

    // Initialize these if content is static (fallback)
    window.initLightbox();
    window.initTOCScrollSpy();
});

// ==================== Hero Video Lazy Play ====================
window.addEventListener('load', () => {
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
        // Play video after everything is loaded
        heroVideo.play().catch(e => {
            console.log('Autoplay prevented or video error:', e);
        });
    }
});
