document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('projectHero');
    const heroTitle = hero ? hero.querySelector('.article-title') : null;
    const heroBg = hero ? hero.querySelector('.parallax-bg') : null;

    if (!hero) return;

    let ticking = false;

    function updateParallax() {
        const scrollY = Math.max(0, window.scrollY); // Clamp to 0 to prevent negative scroll bounce issues
        const windowHeight = window.innerHeight;

        // --- Jesko Style Scroll Effect ---

        // 1. Calculate Scroll Progress (0 to 1 over 500px)
        const progress = Math.min(scrollY / 600, 1);

        // 2. Scale Container Down (1.0 -> 0.92)
        // This gives that "card shrinking" feel
        const scale = 1 - (progress * 0.08);

        // 3. Round Corners (Start 0/[var] -> End 48px)
        // We want it to look like it's detaching
        const borderRadius = 24 + (progress * 24); // Start at radius-lg (24), go to ~48

        // Apply Transform to Hero Container
        // We use scale3d for hardware acceleration
        hero.style.transform = `scale3d(${scale}, ${scale}, 1)`;
        hero.style.borderRadius = `0 0 ${borderRadius}px ${borderRadius}px`; // Keep top flat or round all? Jesko rounds all usually.
        // Let's round all for the detached look, but since it's at top, top corners might be hidden. 
        // Actually, Jesko keeps top flat if sticky. 
        // But since we are scrolling AWAY, we can just match styles.

        // 4. Parallax Background (Move slightly slower than scroll)
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
        }

        // 5. Title Fade & Parallax
        if (heroTitle) {
            heroTitle.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 + progress * 0.1})`;
            heroTitle.style.opacity = 1 - (progress * 1.5); // Fade out faster
            heroTitle.style.filter = `blur(${progress * 10}px)`; // Add blur 
        }

        // 6. Sidebar Title Reveal
        // Show sidebar title when hero title is faded out (approx progress > 0.7)
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
