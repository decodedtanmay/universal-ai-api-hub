import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export function readTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';

    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * The active colour theme, kept in sync with the data-theme attribute on <html>.
 */
export function useTheme(): Theme {
    const [theme, setTheme] = useState<Theme>(readTheme);

    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(readTheme()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        setTheme(readTheme());

        return () => observer.disconnect();
    }, []);

    return theme;
}

/**
 * Whether the visitor has asked their system to minimise motion.
 */
export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduced(query.matches);
        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, []);

    return reduced;
}
