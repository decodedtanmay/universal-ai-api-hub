import { useEffect, useState } from 'react';

/**
 * Track which section is currently under the sticky header, based on scroll position.
 */
export function useScrollSpy<T extends string>(ids: readonly T[], offset = 120): T {
    const [active, setActive] = useState<T>(ids[0]);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            let current = ids[0];
            for (const id of ids) {
                const element = document.getElementById(id);
                if (element && element.getBoundingClientRect().top <= offset) current = id;
            }
            setActive(atBottom ? ids[ids.length - 1] : current);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [ids, offset]);

    return active;
}
