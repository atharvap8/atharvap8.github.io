// Hero 3D PCB Model Viewer
// Displays a 3D model of the flagship project with mouse-tracking rotation
// Uses Three.js with ES module imports via importmap

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

(function () {
    // --- Configuration ---
    const MODEL_PATH = 'assets/models/obhai-bldc.glb';
    const CONTAINER_ID = 'hero-canvas';

    const canvas = document.getElementById(CONTAINER_ID);
    if (!canvas) return;

    // --- State ---
    let scene, camera, renderer, model, pivot;
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0.4, currentRotY = -0.3;
    let isHovering = false;
    let autoRotAngle = 0;
    let animFrame;
    let W, H;
    let modelLoaded = false;

    // --- Mouse tracking ---
    const mouse = { x: 0, y: 0 };
    const MAX_TILT = 0.2; // radians (~11°) — subtle, won't fly out of frame

    // --- Init Three.js ---
    function init() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        W = rect.width;
        H = rect.height;

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0f1a);

        // Camera
        camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
        camera.position.set(0, 0, 5);

        // Renderer — optimized for performance with large models
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false, // disable AA for performance
            alpha: false,
            powerPreference: 'high-performance',
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5x
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // --- Lighting ---
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404060, 0.8);
        scene.add(ambientLight);

        // Main key light (top-right, slightly warm)
        const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);

        // Fill light (left, cool blue tint)
        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
        fillLight.position.set(-3, 2, 3);
        scene.add(fillLight);

        // Rim light (behind, accent)
        const rimLight = new THREE.DirectionalLight(0x818cf8, 0.5);
        rimLight.position.set(0, -2, -4);
        scene.add(rimLight);

        // Bottom fill (subtle, to show underside detail)
        const bottomLight = new THREE.DirectionalLight(0x334455, 0.3);
        bottomLight.position.set(0, -4, 2);
        scene.add(bottomLight);

        // --- Load Model ---
        // Show loading state immediately
        drawLoadingBar(0);

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        loader.load(
            MODEL_PATH,
            (gltf) => {
                model = gltf.scene;

                // Optimize materials — KiCad exports heavy textures/maps we don't need
                model.traverse((child) => {
                    if (child.isMesh) {
                        const mat = child.material;
                        if (mat) {
                            // Strip unnecessary maps that kill GPU on KiCad exports
                            mat.normalMap = null;
                            mat.bumpMap = null;
                            mat.displacementMap = null;
                            mat.aoMap = null;
                            mat.envMap = null;
                            mat.needsUpdate = true;
                        }
                        // Disable frustum culling for small parts
                        child.frustumCulled = true;
                    }
                });

                // Center the model using bounding box
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Offset model so its center is at origin
                model.position.set(-center.x, -center.y, -center.z);

                // Scale to fill viewport
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.5 / maxDim;
                model.scale.setScalar(scale);

                // Wrap in a pivot group
                pivot = new THREE.Group();
                pivot.add(model);
                scene.add(pivot);

                // Initial tilt
                pivot.rotation.x = 0.4;
                pivot.rotation.y = -0.3;

                modelLoaded = true;

                // Camera
                camera.position.set(0, 0, 3.8);
                camera.lookAt(0, 0, 0);

                // Clear loading overlay & start
                clearLoadingOverlay();

                // Entrance animation
                const origScale = model.scale.x;
                model.scale.setScalar(0);
                animateEntrance(origScale);
            },
            (progress) => {
                if (progress.total > 0) {
                    drawLoadingBar(progress.loaded / progress.total);
                }
            },
            (error) => {
                console.warn('3D model not found at:', MODEL_PATH);
                drawFallbackState();
            }
        );

        // --- Event Listeners ---
        const heroVisual = container;

        heroVisual.addEventListener('mousemove', (e) => {
            const rect = heroVisual.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            isHovering = true;
        });

        heroVisual.addEventListener('mouseleave', () => {
            isHovering = false;
        });

        // Touch support
        heroVisual.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = heroVisual.getBoundingClientRect();
                mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = ((touch.clientY - rect.top) / rect.height) * 2 - 1;
                isHovering = true;
            }
        }, { passive: true });

        heroVisual.addEventListener('touchend', () => {
            isHovering = false;
        });

        window.addEventListener('resize', onResize);

        // Start render loop
        animate();
    }

    // --- Entrance animation ---
    function animateEntrance(targetScale) {
        if (!model) return;
        const duration = 800;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            model.scale.setScalar(targetScale * ease);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // --- Loading bar (DOM overlay, avoids canvas context conflict) ---
    let loadingOverlay = null;

    function drawLoadingBar(progress) {
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.style.cssText = `
                position: absolute; inset: 0; display: flex; flex-direction: column;
                align-items: center; justify-content: center; z-index: 10;
                background: #0a0f1a; pointer-events: none;
            `;
            loadingOverlay.innerHTML = `
                <div style="color: rgba(56,189,248,0.5); font: 12px 'Space Mono', monospace; margin-bottom: 12px;">
                    Loading 3D Model...
                </div>
                <div style="width: 140px; height: 3px; background: rgba(56,189,248,0.12); border-radius: 2px; overflow: hidden;">
                    <div id="hero-load-fill" style="height: 100%; width: 0%; background: rgba(56,189,248,0.6); transition: width 0.2s;"></div>
                </div>
                <div id="hero-load-pct" style="color: rgba(56,189,248,0.35); font: 10px 'Space Mono', monospace; margin-top: 6px;">
                    0%
                </div>
            `;
            canvas.parentElement.style.position = 'relative';
            canvas.parentElement.appendChild(loadingOverlay);
        }

        const pct = Math.round(progress * 100);
        const fill = loadingOverlay.querySelector('#hero-load-fill');
        const label = loadingOverlay.querySelector('#hero-load-pct');
        if (fill) fill.style.width = pct + '%';
        if (label) label.textContent = pct + '%';
    }

    function clearLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.style.transition = 'opacity 0.5s';
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay && loadingOverlay.parentElement) {
                    loadingOverlay.parentElement.removeChild(loadingOverlay);
                }
                loadingOverlay = null;
            }, 500);
        }
    }

    // --- Fallback if model doesn't load ---
    function drawFallbackState() {
        clearLoadingOverlay();

        // Create fallback message overlay
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            position: absolute; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10;
            background: #0a0f1a; pointer-events: none;
        `;
        fallback.innerHTML = `
            <div style="color: rgba(56,189,248,0.3); font: 12px 'Space Mono', monospace;">Place your .glb model at:</div>
            <div style="color: rgba(56,189,248,0.6); font: 12px 'Space Mono', monospace; margin-top: 6px;">${MODEL_PATH}</div>
        `;
        canvas.parentElement.style.position = 'relative';
        canvas.parentElement.appendChild(fallback);

        // Dispose renderer to free GPU
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
    }

    // --- Resize ---
    function onResize() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        W = rect.width;
        H = rect.height;

        if (camera && renderer) {
            camera.aspect = W / H;
            camera.updateProjectionMatrix();
            renderer.setSize(W, H);
        }
    }

    // --- Animation loop (throttled to 30fps) ---
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 30; // 30fps cap

    function animate(now) {
        animFrame = requestAnimationFrame(animate);

        if (!pivot || !renderer) return;

        // Throttle: skip frame if too soon
        if (now - lastFrameTime < FRAME_INTERVAL) return;
        lastFrameTime = now;

        if (isHovering) {
            targetRotX = 0.4 + (-mouse.y * MAX_TILT);
            targetRotY = -0.3 + (mouse.x * MAX_TILT);
        } else {
            autoRotAngle += 0.005;
            targetRotX = 0.4 + Math.sin(autoRotAngle * 0.4) * 0.06;
            targetRotY = -0.3 + Math.sin(autoRotAngle * 0.3) * 0.1;
        }

        const lerpFactor = isHovering ? 0.06 : 0.025;
        currentRotX += (targetRotX - currentRotX) * lerpFactor;
        currentRotY += (targetRotY - currentRotY) * lerpFactor;

        pivot.rotation.x = currentRotX;
        pivot.rotation.y = currentRotY;

        renderer.render(scene, camera);
    }

    // --- Start ---
    init();

    // Pause when hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrame);
        } else {
            animate(performance.now());
        }
    });
})();
