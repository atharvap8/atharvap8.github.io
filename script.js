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
            section.scrollIntoView({ behavior: 'smooth' });
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

// ==================== Intersection Observer for Section Switching ====================
const observerOptions = {
    threshold: 0.3
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Update active section
            sections.forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');

            // Update nav button highlight
            const sectionId = entry.target.id;
            navButtons.forEach(btn => {
                if (btn.getAttribute('data-section') === sectionId) {
                    btn.style.borderBottomColor = 'var(--primary-color)';
                } else {
                    btn.style.borderBottomColor = 'transparent';
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// ==================== Header Scroll Effects ====================
const header = document.querySelector('.header');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Add shadow on scroll
    if (currentScrollY > 50) {
        header.style.boxShadow = '0 4px 20px rgba(0, 217, 255, 0.1)';
    } else {
        header.style.boxShadow = 'none';
    }

    lastScrollY = currentScrollY;
});

// ==================== Scroll Animation for Elements ====================
const observerAnimOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideInLeft 0.6s ease-out forwards';
            elementObserver.unobserve(entry.target);
        }
    });
}, observerAnimOptions);

// Observe all cards and items for animation
document.querySelectorAll('.project-card, .blog-card, .skill-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    elementObserver.observe(el);
});

// ==================== Active Section on Load ====================
window.addEventListener('load', () => {
    const homeSection = document.getElementById('home');
    if (homeSection) {
        homeSection.classList.add('active');
    }
});

// ==================== Form Submission ====================
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    // Formspree handles the submission, so we don't need to prevent default
    // We can add simple client-side validation if needed, but for now let's rely on HTML5 validation
    contactForm.addEventListener('submit', (e) => {
        // Optional: Add loading state to button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
    });
}

// ==================== Cursor Follow Effect ====================
const cursorFollowElements = document.querySelectorAll('.floating-card');

if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        cursorFollowElements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const elX = rect.left + rect.width / 2;
            const elY = rect.top + rect.height / 2;

            const distance = Math.sqrt((mouseX - elX) ** 2 + (mouseY - elY) ** 2);
            const angle = Math.atan2(mouseY - elY, mouseX - elX);

            // Only apply effect when cursor is reasonably close
            if (distance < 200) {
                const moveX = Math.cos(angle) * (200 - distance) * 0.15;
                const moveY = Math.sin(angle) * (200 - distance) * 0.15;

                el.style.transform = `translate(${moveX}px, ${moveY}px)`;
            } else {
                el.style.transform = 'translate(0, 0)';
            }
        });
    });
}

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

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const counter = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = element.textContent;
            clearInterval(counter);
        } else {
            if (target > 100) {
                element.textContent = Math.floor(start) + '+';
            } else {
                element.textContent = Math.floor(start) + '%';
            }
        }
    }, 16);
}

// Trigger counter animation when in view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const text = entry.target.textContent;

            // Extract number from text
            if (text.includes('+')) {
                animateCounter(entry.target, 15);
            } else if (text.includes('%')) {
                animateCounter(entry.target, 100);
            } else if (text.includes('∞')) {
                // Keep infinity symbol
            } else if (!isNaN(text)) {
                animateCounter(entry.target, parseInt(text));
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
        // Create a simple resume document
        const resumeContent = `
ATHARVA - EMBEDDED SYSTEMS ENGINEER & IoT DEVELOPER
================================================================================

CONTACT INFORMATION
Email: atharva@example.com
GitHub: github.com/atharvap8
LinkedIn: linkedin.com/in/atharva

PROFESSIONAL SUMMARY
Passionate embedded systems engineer and IoT developer with expertise in 
microcontroller programming, hardware design, and firmware development. 
Strong background in power electronics and smart appliance systems.

CORE COMPETENCIES
- Microcontroller Programming: ESP32, Arduino, STM32
- Languages: C/C++, Python, JavaScript, HTML/CSS
- Hardware Design: PCB Design (KiCad), Power Electronics, Signal Processing
- IoT Systems: MQTT, Web Servers, Real-time Monitoring
- Tools & Technologies: VS Code, Git, KiCad, Linux, JTAG

PROFESSIONAL EXPERIENCE

Junior IoT Developer | June 2024 - November 2024
- Developed smart washing machine controller with real-time monitoring
- Implemented IoT gateway firmware with MQTT support
- Created web-based dashboards for device control and analytics
- Troubleshot and repaired appliance PCBs with TRIAC motor controllers

Hardware Design Intern | 2023 - 2024
- Designed multi-layer PCBs for power electronics projects
- Implemented SPWM-based 3-phase power inverter systems
- Conducted PCB routing and signal integrity analysis
- Contributed to production-ready hardware designs

EDUCATION

Electronics Engineering | Currently Pursuing
- Formal studies in embedded systems and electronics
- Focus on practical applications and project-based learning

Self-Taught Development | Ongoing
- Continuous learning through hands-on projects
- Active open-source contributions
- Technical documentation and blogging

FEATURED PROJECTS

Smart Washing Machine Controller (2024)
- IoT-enabled appliance with remote control capability
- Technologies: ESP32, Python, Web Dashboard
- Impact: Real-time monitoring and predictive maintenance

Power Inverter System (2023-2024)
- 3-phase SPWM-based grid-tie inverter design
- Technologies: STM32, Hardware Design, Power Electronics
- Impact: Efficient renewable energy integration

PCB Design Suite (2023)
- Hierarchical multi-layer board designs for industrial applications
- Technologies: KiCad, Signal Integrity, Layer Stack-up
- Impact: 15+ projects completed with zero manufacturing errors

TECHNICAL SKILLS

Embedded Systems: 95%
Power Electronics: 85%
PCB Design: 85%
IoT Systems: 88%
Web Development: 75%
Hardware Debugging: 90%

PUBLICATIONS & CONTRIBUTIONS
- Technical blog with 20+ articles on embedded systems
- Open-source projects on GitHub (github.com/atharvap8)
- Active contributor to IoT and embedded systems communities

CERTIFICATIONS & AWARDS
- Self-certified in advanced microcontroller programming
- Recognized for innovation in IoT applications
- Strong track record of successful project delivery

LANGUAGES
- English: Fluent
- Hindi: Native
        `;

        // Create blob and download
        const blob = new Blob([resumeContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Atharva_Resume.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

// ==================== Keyboard Navigation ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const activeIndex = Array.from(sections).findIndex(s => s.classList.contains('active'));
        if (activeIndex < sections.length - 1) {
            const nextSection = sections[activeIndex + 1];
            if (nextSection) {
                scrollToSection(nextSection.id);
            }
        }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const activeIndex = Array.from(sections).findIndex(s => s.classList.contains('active'));
        if (activeIndex > 0) {
            const prevSection = sections[activeIndex - 1];
            if (prevSection) {
                scrollToSection(prevSection.id);
            }
        }
    }
});

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
console.log('Use arrow keys to navigate between sections');
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
