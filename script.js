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
    });
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
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

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        headerElement.classList.add('scrolled');
    } else {
        headerElement.classList.remove('scrolled');
    }
});

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
const downloadBtn = document.querySelector('.resume-actions .btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'assets/resume/resume1.pdf';
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
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    border: none;
    border-radius: 50%;
    color: var(--dark-bg);
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

    // ==================== Global TOC Scrollspy ====================
    const tocLinks = document.querySelectorAll('.toc-link');
    const articleSections = document.querySelectorAll('article section[id]');

    if (tocLinks.length > 0 && articleSections.length > 0) {
        const activeSections = new Set();

        const tocObserverOptions = {
            root: null,
            rootMargin: '-10% 0px -80% 0px', // Focus window near the top
            threshold: 0
        };

        const tocObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                if (entry.isIntersecting) {
                    activeSections.add(id);
                } else {
                    activeSections.delete(id);
                }
            });

            // Update TOC highlight based on the FIRST (top-most) visible section
            if (activeSections.size > 0) {
                let firstActiveId = null;
                // We iterate over articleSections to maintain DOM order
                for (const section of articleSections) {
                    const id = section.getAttribute('id');
                    if (activeSections.has(id)) {
                        firstActiveId = id;
                        break;
                    }
                }

                if (firstActiveId) {
                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${firstActiveId}`) {
                            link.classList.add('active');

                            // Auto-scroll TOC sidebar to keep active link in view
                            const sidebar = link.closest('.article-sidebar');
                            if (sidebar) {
                                link.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest'
                                });
                            }
                        }
                    });
                }
            } else if (window.scrollY < 200) {
                // At the very top, highlight the first link
                tocLinks.forEach(l => l.classList.remove('active'));
                tocLinks[0].classList.add('active');
            }
        }, tocObserverOptions);

        articleSections.forEach(section => tocObserver.observe(section));

        // Sync initial state
        if (window.scrollY < 200) {
            tocLinks[0].classList.add('active');
        }
    }


    // --- Image Lightbox / Zoom Functionality ---
    const projectThumbs = document.querySelectorAll('.project-thumb');
    projectThumbs.forEach(img => {
        img.addEventListener('error', () => {
            img.style.display = 'none';
        });
    });

    const articleImages = document.querySelectorAll('.article-content img');
    if (articleImages.length > 0) {
        // Create Lightbox Elements
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <img src="" alt="Zoomed Image" class="lightbox-img">
            <div class="lightbox-caption"></div>
        `;
        document.body.appendChild(lightbox);

        const lightboxImg = lightbox.querySelector('.lightbox-img');
        const lightboxCaption = lightbox.querySelector('.lightbox-caption');

        articleImages.forEach(img => {
            img.addEventListener('click', () => {
                const src = img.getAttribute('src');
                const figure = img.closest('figure');
                const captionElement = figure ? figure.querySelector('figcaption') : null;
                const captionText = captionElement ? captionElement.textContent : (img.getAttribute('alt') || '');

                lightboxImg.src = src;
                lightboxCaption.textContent = captionText;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            });
        });

        lightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});
