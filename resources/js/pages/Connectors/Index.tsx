import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, ArrowRight, ArrowUpRight, Clock, Cpu, FilePlus2, Layers, Plus, Search, SearchX, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppShell } from '../../components/AppShell';
import { ProviderBadge, StatusBadge } from '../../components/Badges';
import { RelativeTime } from '../../components/RelativeTime';
import { RequestAnatomy } from '../../components/RequestAnatomy';
import type { Connector, ProviderStatus } from '../../types';

type Props = { connectors: Connector[] };
type Filter = 'all' | Connector['status'];

const filters: Filter[] = ['all', 'active', 'draft', 'disabled'];

export default function ConnectorIndex({ connectors }: Props) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const search = useRef<HTMLInputElement>(null);
    const { providerStatus } = usePage<{ providerStatus: ProviderStatus[] }>().props;
    const showcase = connectors.find((connector) => connector.slug === 'business-card-scanner' && connector.status === 'active')
        ?? connectors.find((connector) => connector.status === 'active') ?? null;

    useEffect(() => {
        const focusSearch = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (event.key !== '/' || target.closest('input, textarea, select, [contenteditable]')) return;
            event.preventDefault();
            search.current?.focus();
        };
        window.addEventListener('keydown', focusSearch);
        return () => window.removeEventListener('keydown', focusSearch);
    }, []);

    const counts = useMemo(() => Object.fromEntries(filters.map((status) => [status, status === 'all' ? connectors.length : connectors.filter((connector) => connector.status === status).length])) as Record<Filter, number>, [connectors]);
    const totalRequests = connectors.reduce((sum, connector) => sum + connector.request_count, 0);
    const providerCount = new Set(connectors.map((connector) => connector.provider)).size;

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase();
        return connectors.filter((connector) => (filter === 'all' || connector.status === filter)
            && (!term || [connector.name, connector.slug, connector.description ?? '', connector.provider, connector.model].some((value) => value.toLowerCase().includes(term))));
    }, [connectors, filter, query]);

    return <AppShell>
        <Head title="Connectors" />
        <section className="hero">
            <div className="hero-copy">
                <p className="eyebrow">Universal AI API Hub</p>
                <h1 className="hero-title">Turn a prompt into a <em>production</em> API.</h1>
                <p className="hero-lede">Describe the inputs, pick a model, define the JSON you expect. The hub generates a validated endpoint, its documentation and a playground, then logs every call.</p>
                <div className="hero-actions">
                    <Link href="/connectors/create" className="button button-primary button-lg"><Plus size={17} /> New connector</Link>
                    {showcase && <Link href={`/connectors/${showcase.id}`} className="button button-secondary button-lg">Try {showcase.name} <ArrowRight size={16} /></Link>}
                </div>
                <ul className="provider-status" aria-label="Provider status">
                    {providerStatus.map((provider) => <li key={provider.id} className={provider.configured ? 'is-ready' : 'is-missing'} title={provider.configured ? 'Credentials configured on the server' : 'No API key configured on the server'}>
                        <span className="status-dot" />{provider.label}<span className="muted">{provider.configured ? 'ready' : 'not configured'}</span>
                    </li>)}
                </ul>
            </div>
            <RequestAnatomy connector={showcase} />
        </section>

        {connectors.length === 0 ? <EmptyState /> : <>
            <div className="section-heading"><h2>Your connectors</h2><span className="muted">Each one is a live endpoint.</span></div>
            <section className="metrics" aria-label="Workspace summary">
                <Metric icon={<Layers size={14} />} label="Connectors" value={connectors.length} />
                <Metric icon={<Zap size={14} />} label="Active" value={counts.active} hint={`of ${connectors.length}`} />
                <Metric icon={<Activity size={14} />} label="Total requests" value={totalRequests.toLocaleString()} />
                <Metric icon={<Cpu size={14} />} label="Providers" value={providerCount} />
            </section>

            <div className="toolbar">
                <label className="search">
                    <Search size={15} />
                    <span className="sr-only">Search connectors</span>
                    <input ref={search} className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, slug or model" />
                    {!query && <kbd>/</kbd>}
                </label>
                <div className="segmented" role="group" aria-label="Filter by status">
                    {filters.map((status) => <button key={status} type="button" className={filter === status ? 'is-active' : ''} aria-pressed={filter === status} onClick={() => setFilter(status)}>
                        <span style={{ textTransform: 'capitalize' }}>{status}</span><span className="segmented-count">{counts[status]}</span>
                    </button>)}
                </div>
            </div>

            {visible.length === 0
                ? <div className="card empty-inline"><SearchX size={26} /><strong>No connectors match</strong><span>Try a different search or status filter.</span><button type="button" className="button button-secondary button-sm" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button></div>
                : <section className="connector-grid" aria-label="Configured connectors">{visible.map((connector) => <ConnectorCard key={connector.id} connector={connector} />)}</section>}
        </>}
    </AppShell>;
}

function ConnectorCard({ connector }: { connector: Connector }) {
    const types = [...new Set(connector.input_schema.map((field) => field.type))];

    return <Link href={`/connectors/${connector.id}`} className="card connector-card" prefetch>
        <div className="connector-card-top"><ProviderBadge provider={connector.provider} /><StatusBadge status={connector.status} /></div>
        <div>
            <h3>{connector.name}<ArrowUpRight size={15} /></h3>
            <p className="connector-card-desc">{connector.description || <span className="muted">No description</span>}</p>
        </div>
        <div className="endpoint-line"><span className="method">POST</span><span>/api/connectors/{connector.slug}</span></div>
        <div className="chip-list">{types.map((type) => <span key={type} className="chip">{type}</span>)}<span className="chip mono">{connector.model}</span></div>
        <div className="connector-card-footer">
            <span><Layers size={13} />{connector.input_schema.length} input{connector.input_schema.length === 1 ? '' : 's'}</span>
            <span><Activity size={13} />{connector.request_count.toLocaleString()} req</span>
            <span><Clock size={13} /><RelativeTime value={connector.last_used_at} fallback="Never used" /></span>
        </div>
    </Link>;
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string | number; hint?: string }) {
    return <div className="card metric"><div className="metric-label">{icon}{label}</div><div className="metric-value">{value}{hint && <span className="metric-hint">{hint}</span>}</div></div>;
}

function EmptyState() {
    return <section className="empty-state">
        <span className="empty-icon"><FilePlus2 size={24} /></span>
        <h2>Build your first connector</h2>
        <p>A connector wraps an AI model behind a stable, validated HTTP endpoint.</p>
        <div className="steps">
            <div className="step"><strong><span className="step-number">1</span>Describe inputs</strong><p>Text, numbers, images, files or JSON, with validation built in.</p></div>
            <div className="step"><strong><span className="step-number">2</span>Pick a model</strong><p>Choose Gemini or Groq and write the instructions.</p></div>
            <div className="step"><strong><span className="step-number">3</span>Call the endpoint</strong><p>Responses are checked against your JSON Schema.</p></div>
        </div>
        <Link href="/connectors/create" className="button button-primary button-lg"><Plus size={17} /> Create connector</Link>
    </section>;
}
