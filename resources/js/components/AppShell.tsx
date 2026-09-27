import { Link, usePage } from '@inertiajs/react';
import { Blocks, CheckCircle2, Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import type { Flash, ProviderStatus } from '../types';
import GlassSurface from './reactbits/GlassSurface';
import { MotionConfig } from 'motion/react';

type Theme = 'light' | 'dark';

export function AppShell({ children }: PropsWithChildren) {
    const { props, url } = usePage<{ flash: Flash; providerStatus: ProviderStatus[] }>();
    const flash = props.flash;
    const [toast, setToast] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>(currentTheme);

    useEffect(() => {
        setToast(flash?.success ?? null);
        if (!flash?.success) return;
        const timer = window.setTimeout(() => setToast(null), 4000);
        return () => window.clearTimeout(timer);
    }, [flash]);

    const toggleTheme = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
        setTheme(next);
    };

    const onConnectors = url.startsWith('/connectors') && !url.startsWith('/connectors/create');

    return <MotionConfig reducedMotion="user"><div className="app-shell">
        <header className="topbar">
            <div className="topbar-inner">
                <GlassSurface className="topbar-glass" width="100%" height={64} borderRadius={20} blur={10} brightness={theme === 'dark' ? 35 : 70} opacity={0.9} backgroundOpacity={theme === 'dark' ? 0.32 : 0.42} distortionScale={-60} redOffset={0} greenOffset={1} blueOffset={2} saturation={1.4}>
                    <div className="topbar-row">
                        <Link href="/connectors" className="brand" aria-label="Universal AI API Hub home">
                            <span className="brand-mark"><Blocks size={17} /></span>
                            <span>Universal AI API Hub</span>
                            <span className="brand-tag">Beta</span>
                        </Link>
                        <nav aria-label="Primary navigation">
                            <Link href="/connectors" className={`nav-link ${onConnectors ? 'is-active' : ''}`} aria-current={onConnectors ? 'page' : undefined}>Connectors</Link>
                            <button type="button" className="icon-button is-bare" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
                            <span className="nav-divider" aria-hidden="true" />
                            <Link href="/connectors/create" className="button button-primary button-sm"><Plus size={15} /><span className="nav-link-label">New connector</span></Link>
                        </nav>
                    </div>
                </GlassSurface>
            </div>
        </header>
        <main className="container">{children}</main>
        <footer className="app-footer">
            <div className="container">
                <span>Universal AI API Hub · provider credentials never leave the server</span>
                <span className="footer-status">{props.providerStatus?.map((provider) => <span key={provider.id} className={provider.configured ? 'is-ready' : 'is-missing'}><span className="status-dot" />{provider.label}</span>)}</span>
            </div>
        </footer>
        {toast && <div className="toast" role="status"><span className="toast-icon"><CheckCircle2 size={18} /></span>{toast}<button type="button" className="icon-button is-bare" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div></MotionConfig>;
}

function currentTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    const explicit = document.documentElement.dataset.theme;
    if (explicit === 'light' || explicit === 'dark') return explicit;

    return 'dark';
}
