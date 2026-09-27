import { lazy, Suspense, useEffect, useState } from 'react';
import Grainient from './reactbits/Grainient';
import { usePrefersReducedMotion, useTheme } from './useTheme';

const HyperspeedBackdrop = lazy(() => import('./HyperspeedBackdrop'));

/**
 * Animated background fixed behind every page.
 * Dark theme: the React Bits Hyperspeed light-trail road in violet (three.js, loaded lazily).
 * Light theme, reduced motion, or `?bg=grainient`: a slow, grainy violet gradient (React Bits Grainient).
 */
export function PageBackdrop() {
    const theme = useTheme();
    const reducedMotion = usePrefersReducedMotion();
    const dark = theme === 'dark';
    const preferGradient = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('bg') === 'grainient';
    const [idle, setIdle] = useState(false);

    // Start the WebGL road only after the page has painted, so it never competes with first render (LCP).
    useEffect(() => {
        const start = () => setIdle(true);
        if (typeof window.requestIdleCallback === 'function') {
            const handle = window.requestIdleCallback(start, { timeout: 1500 });
            return () => window.cancelIdleCallback(handle);
        }
        const timer = setTimeout(start, 600);
        return () => clearTimeout(timer);
    }, []);

    if (dark && !reducedMotion && !preferGradient) {
        return <div className="page-backdrop is-dark is-hyperspeed" aria-hidden="true">
            {idle && <Suspense fallback={null}><HyperspeedBackdrop /></Suspense>}
        </div>;
    }

    return <div className={`page-backdrop is-${theme}`} aria-hidden="true">
        <Grainient
            key={theme}
            color1={dark ? '#150d2a' : '#ede9fe'}
            color2={dark ? '#6d28d9' : '#8b5cf6'}
            color3={dark ? '#16131f' : '#f4f3f8'}
            timeSpeed={reducedMotion ? 0 : 0.2}
            warpStrength={1}
            grainAmount={dark ? 0.06 : 0.04}
            grainAnimated={!reducedMotion}
            contrast={1.1}
            saturation={dark ? 1 : 0.8}
            lightMode={!dark}
        />
    </div>;
}
