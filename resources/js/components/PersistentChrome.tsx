import { PageBackdrop } from './PageBackdrop';
import ClickSpark from './reactbits/ClickSpark';
import { SmoothScroll } from './SmoothScroll';
import { useTheme } from './useTheme';

/**
 * Site-wide layers that must survive Inertia page visits: the WebGL background, click sparks and the smooth-scroll
 * engine. Mounted once in its own React root, so navigating never tears down and rebuilds the WebGL scene.
 */
export function PersistentChrome() {
    const theme = useTheme();

    return <>
        <PageBackdrop />
        <ClickSpark sparkColor={theme === 'dark' ? '#c4b5fd' : '#6d28d9'} sparkSize={9} sparkRadius={22} sparkCount={9} duration={450} />
        <SmoothScroll />
    </>;
}
