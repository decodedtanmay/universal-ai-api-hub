import { Link, usePage } from '@inertiajs/react';
import { Blocks, Plus } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type { Flash } from '../types';

export function AppShell({ children }: PropsWithChildren) {
    const { flash } = usePage<{ flash: Flash }>().props;

    return <div className="app-shell">
        <header className="topbar">
            <Link href="/connectors" className="brand" aria-label="Universal AI API Hub dashboard"><span className="brand-mark"><Blocks size={18} /></span><span>Universal AI API Hub</span></Link>
            <nav aria-label="Primary navigation"><Link href="/connectors" className="nav-link">Connectors</Link><Link href="/connectors/create" className="icon-text-button"><Plus size={16} /> Create connector</Link></nav>
        </header>
        {flash?.success && <div className="flash" role="status">{flash.success}</div>}
        <main>{children}</main>
    </div>;
}
