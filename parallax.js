document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('projectHero');
    const heroTitle = hero ? hero.querySelector('.article-title') : null;

    if (!hero) return;

    // State
    let ticking = false;

    // Config
    const SCROLL_FACTOR = 0.8; // Expansion rate
    const DISAPPEAR_THRESHOLD = 600; // Pixel scroll at which title vanishes
    const MAX_FONT_SIZE = 5.0;
    const MIN_FONT_SIZE = 2.5;

    function updateParallax() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const initialHeight = windowHeight * 0.4; // 40vh default

        // 1. Direct Height Expansion (No Smoothing Lag)
        // Logic: Height = Initial + (Scroll * Factor)
        let newHeight = initialHeight + (scrollY * SCROLL_FACTOR);

        // Clamp height limits
        if (newHeight > windowHeight) newHeight = windowHeight;
        if (newHeight < initialHeight) newHeight = initialHeight;

        // Apply directly
        hero.style.height = `${newHeight}px`;

        // 2. Title Scaling & Fading
        if (heroTitle) {
            // Calculate progress (0 to 1) based on scroll threshold
            let progress = Math.min(scrollY / DISAPPEAR_THRESHOLD, 1);

            // Font Size Logic: Lerp between Max and Min based on progress
            // Current = Max - (Progress * Range)
            const currentSize = MAX_FONT_SIZE - (progress * (MAX_FONT_SIZE - MIN_FONT_SIZE));

            // Opacity Logic: 1 -> 0
            const currentOpacity = 1 - progress;

            // Apply styles
            heroTitle.style.fontSize = `${currentSize}rem`;
            heroTitle.style.opacity = Math.max(0, currentOpacity);
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

    // Initial call to set state
    updateParallax();
});
