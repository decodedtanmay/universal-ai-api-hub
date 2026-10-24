import { PageBackdrop } from './PageBackdrop';
import ClickSpark from './reactbits/ClickSpark';
import { useTheme } from './useTheme';

/**
 * Keep decorative layers mounted across page visits without intercepting native scrolling.
 */
export function PersistentChrome() {
    const theme = useTheme();

    return <>
        <PageBackdrop />
        <ClickSpark sparkColor={theme === 'dark' ? '#c4b5fd' : '#6d28d9'} sparkSize={9} sparkRadius={22} sparkCount={9} duration={450} />
    </>;
}
