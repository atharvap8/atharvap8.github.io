document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('projectHero');
    const heroTitle = hero ? hero.querySelector('.article-title') : null;
    const heroBg = hero ? hero.querySelector('.parallax-bg') : null;

    if (!hero) return;

    let ticking = false;

    function updateParallax() {
        const scrollY = Math.max(0, window.scrollY);
        const windowHeight = window.innerHeight;

        // Progress Calculation
        const progress = Math.min(scrollY / 600, 1);

        // Scale & Radius
        const scale = 1 - (progress * 0.08);
        const borderRadius = 24 + (progress * 24);

        // Apply Transform
        hero.style.transform = `scale3d(${scale}, ${scale}, 1)`;
        hero.style.borderRadius = `0 0 ${borderRadius}px ${borderRadius}px`;

        // Background Parallax
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
            heroBg.style.filter = `brightness(0.6) blur(${progress * 10}px)`;
        }

        // Title Effects
        if (heroTitle) {
            heroTitle.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 + progress * 0.1})`;
            heroTitle.style.opacity = 1 - (progress * 1.5);
            heroTitle.style.filter = `blur(${progress * 10}px)`;
        }

        // Sidebar Reveal
        const sidebarTitle = document.getElementById('sidebarTitle');
        if (sidebarTitle) {
            if (progress > 0.75) {
                sidebarTitle.style.transitionDelay = '0.5s';
                sidebarTitle.classList.add('visible');
            } else {
                sidebarTitle.classList.remove('visible');
            }
        }

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // Attach listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial call
    updateParallax();
});
