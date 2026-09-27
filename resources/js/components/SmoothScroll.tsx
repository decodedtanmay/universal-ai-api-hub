import { router } from '@inertiajs/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './useTheme';

gsap.registerPlugin(ScrollTrigger);

/** Elements that rise into place on scroll: anything tagged, plus every content card on every page. */
const REVEAL = '[data-reveal], main .card, main .template-picker';

/**
 * Lenis smooth scrolling driven by GSAP's ticker, so Lenis and ScrollTrigger share one animation frame.
 * Also runs the scroll-linked motion: [data-reveal] elements rise into place as they enter the viewport,
 * and the dashboard hero ([data-hero-fade]) recedes as you scroll past it. Everything is skipped for reduced-motion visitors.
 */
export function SmoothScroll() {
    const reducedMotion = usePrefersReducedMotion();
    const [visit, setVisit] = useState(0);
    const lenisRef = useRef<Lenis | null>(null);

    // Re-run the scroll-linked motion after every Inertia page visit.
    useEffect(() => router.on('navigate', () => setVisit((count) => count + 1)), []);

    useEffect(() => {
        if (reducedMotion) return;

        const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: { offset: -96 } });
        lenisRef.current = lenis;
        lenis.on('scroll', ScrollTrigger.update);

        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        // Inertia sets window scroll itself after a visit; keep Lenis' internal position in step with it.
        const stopNavigate = router.on('navigate', () => {
            requestAnimationFrame(() => lenis.scrollTo(window.scrollY, { immediate: true, force: true }));
        });

        return () => {
            stopNavigate();
            gsap.ticker.remove(raf);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [reducedMotion]);

    useEffect(() => {
        if (reducedMotion) return;

        const context = gsap.context(() => {
            gsap.set(REVEAL, { y: 36, opacity: 0 });
            ScrollTrigger.batch(REVEAL, {
                start: 'top 92%',
                once: true,
                onEnter: (elements) => gsap.to(elements, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }),
            });

            gsap.utils.toArray<HTMLElement>('[data-hero-fade]').forEach((element) => {
                gsap.to(element, {
                    opacity: 0.15,
                    y: -60,
                    ease: 'none',
                    scrollTrigger: { trigger: element, start: 'top top+=80', end: 'bottom top', scrub: true },
                });
            });
        });

        // New page content can change the document height.
        const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);

        return () => {
            window.clearTimeout(refresh);
            context.revert();
        };
    }, [visit, reducedMotion]);

    return null;
}
