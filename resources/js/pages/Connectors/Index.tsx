import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Clock, Cpu, FilePlus2, Layers, Plus, Search, SearchX, Terminal, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppShell } from '../../components/AppShell';
import { ProviderBadge, StatusBadge } from '../../components/Badges';
import { CopyButton } from '../../components/CopyButton';
import { RelativeTime } from '../../components/RelativeTime';
import { RequestAnatomy } from '../../components/RequestAnatomy';
import type { Connector, ProviderStatus } from '../../types';

type Props = { connectors: Connector[] };
type Filter = 'all' | Connector['status'];

const filters: Filter[] = ['all', 'active', 'draft', 'disabled'];

export default function ConnectorIndex({ connectors }: Props) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [heroView, setHeroView] = useState<'demo' | 'curl'>('demo');
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

    const quickstartCurl = `curl -X POST "${showcase?.endpoint ?? 'http://localhost:8000/api/connectors/business-card-scanner'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"image": "https://example.com/card.png"}'`;

    return <AppShell>
        <Head title="Connectors" />
        <section className="hero">
            <div className="hero-copy">
                <p className="hero-eyebrow">Universal AI API Hub</p>
                <h1 className="hero-title">Turn a prompt into a <em>production</em> API.</h1>
                <p className="hero-lede">Describe the inputs, pick a model, define the JSON you expect. The hub generates a validated endpoint, its documentation and a playground, then logs every call.</p>
                
                <div className="hero-actions">
                    <Link href="/connectors/create" className="button button-teal button-lg"><Plus size={16} /> New connector</Link>
                    {showcase && <Link href={`/connectors/${showcase.id}/docs`} className="button button-pill"><BookOpen size={15} /> Explore API Docs</Link>}
                </div>

                <div className="hero-platform-toggle" role="group" aria-label="Hero showcase toggle">
                    <button
                        type="button"
                        className={`hero-toggle-btn ${heroView === 'demo' ? 'is-active' : ''}`}
                        onClick={() => setHeroView('demo')}
                    >
                        Terminal Demo
                    </button>
                    <button
                        type="button"
                        className={`hero-toggle-btn ${heroView === 'curl' ? 'is-active' : ''}`}
                        onClick={() => setHeroView('curl')}
                    >
                        cURL Command
                    </button>
                </div>

                <ul className="provider-status" aria-label="Provider status">
                    {providerStatus?.map((provider) => <li key={provider.id} className={provider.configured ? 'is-ready' : 'is-missing'} title={provider.configured ? 'Credentials configured on the server' : 'No API key configured on the server'}>
                        <span className="status-dot" />{provider.label}<span className="muted">{provider.configured ? 'ready' : 'not configured'}</span>
                    </li>)}
                </ul>
            </div>

            <div>
                {heroView === 'demo' ? (
                    <RequestAnatomy connector={showcase} />
                ) : (
                    <div className="command-panel" aria-label="cURL Installation and Command Panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="command-panel-heading">Quickstart cURL</h3>
                            <CopyButton value={quickstartCurl} label="Copy cURL" />
                        </div>
                        <pre className="command-panel-code">
                            <span className="tok-cmd">curl</span> <span className="tok-flag">-X POST</span> <span className="tok-val">"{showcase?.endpoint ?? 'http://localhost:8000/api/connectors/business-card-scanner'}"</span> \<br />
                            &nbsp;&nbsp;<span className="tok-flag">-H</span> <span className="tok-val">"Content-Type: application/json"</span> \<br />
                            &nbsp;&nbsp;<span className="tok-flag">-d</span> <span className="tok-val">'&#123; "image": "https://example.com/card.png" &#125;'</span>
                        </pre>
                        <p style={{ margin: 0, fontSize: 13, color: '#cac6c3', fontFamily: 'var(--font-mono)' }}>
                            200 OK · Validated against JSON schema · Scoped API key
                        </p>
                    </div>
                )}
            </div>
        </section>

        {connectors.length === 0 ? <EmptyState /> : <>
            <div className="section-heading">
                <h2>Your connectors</h2>
                <span className="muted">Each one is a live, production endpoint.</span>
            </div>
            
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

                {/* Contiguous White Tab Strip with 4px Butler Teal Top Rule */}
                <div className="tab-strip" role="tablist" aria-label="Filter by status">
                    {filters.map((status) => (
                        <button
                            key={status}
                            type="button"
                            role="tab"
                            className={`tab-strip-item ${filter === status ? 'is-active' : ''}`}
                            aria-selected={filter === status}
                            onClick={() => setFilter(status)}
                        >
                            <span style={{ textTransform: 'capitalize' }}>{status}</span>
                            <span className="tab-strip-count">({counts[status]})</span>
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0
                ? <div className="card empty-inline" style={{ padding: 40, textAlign: 'center' }}>
                    <SearchX size={26} style={{ margin: '0 auto 10px', color: 'var(--color-warm-gray)' }} />
                    <strong style={{ display: 'block', fontSize: 16 }}>No connectors match</strong>
                    <span style={{ color: 'var(--color-warm-gray)', display: 'block', margin: '4px 0 16px' }}>Try a different search or status filter.</span>
                    <button type="button" className="button button-square-outline button-sm" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button>
                </div>
                : <section className="connector-grid" aria-label="Configured connectors">
                    {visible.map((connector) => <ConnectorCard key={connector.id} connector={connector} />)}
                </section>}

            {/* Architecture Guarantees (GitButler Community Quote Layout) */}
            <section className="guarantees-grid" aria-label="Architecture guarantees">
                <div className="guarantee-card">
                    <p className="guarantee-quote">"Provider credentials never touch the browser. All upstream model keys remain strictly isolated on the server, and client calls are scoped with hashed tokens."</p>
                    <div className="guarantee-author">
                        <div className="guarantee-avatar">SEC</div>
                        <div><strong>Zero-Trust Credential Isolation</strong> · Hub Architecture Standard</div>
                    </div>
                </div>
                <div className="guarantee-card">
                    <p className="guarantee-quote">"Strict output schema validation guarantees deterministic payload formatting. Non-compliant model outputs are caught and handled before breaking your frontend."</p>
                    <div className="guarantee-author">
                        <div className="guarantee-avatar">VAL</div>
                        <div><strong>Deterministic Schema Contracts</strong> · JSON Output Guarantee</div>
                    </div>
                </div>
            </section>

            {/* Large Butler Teal Conversion Card */}
            <section className="conversion-card" aria-label="Create your connector">
                <span className="conversion-badge">Open Source · REST API · Zero Leaks</span>
                <h2 className="conversion-title">Turn any AI prompt into a production endpoint.</h2>
                <p className="conversion-copy">Define inputs, write system instructions, enforce JSON Schema validation, and issue scoped API keys in seconds.</p>
                <div className="conversion-actions">
                    <Link href="/connectors/create" className="button button-white"><Plus size={16} /> Create connector</Link>
                    {showcase && <Link href={`/connectors/${showcase.id}/docs`} className="button button-outline-white">View API documentation <ArrowRight size={15} /></Link>}
                </div>
            </section>
        </>}
    </AppShell>;
}

function ConnectorCard({ connector }: { connector: Connector }) {
    const types = [...new Set(connector.input_schema.map((field) => field.type))];

    return <Link href={`/connectors/${connector.id}`} className="connector-card" prefetch>
        <div className="connector-card-top">
            <ProviderBadge provider={connector.provider} />
            <StatusBadge status={connector.status} />
        </div>
        <div>
            <h3>{connector.name}<ArrowUpRight size={15} /></h3>
            <p className="connector-card-desc">{connector.description || <span className="muted">No description</span>}</p>
        </div>
        <div className="endpoint-line">
            <span className="method">POST</span>
            <span>/api/connectors/{connector.slug}</span>
        </div>
        <div className="chip-list">
            {types.map((type) => <span key={type} className="chip">{type}</span>)}
            <span className="chip mono">{connector.model}</span>
        </div>
        <div className="connector-card-footer">
            <span><Layers size={13} />{connector.input_schema.length} input{connector.input_schema.length === 1 ? '' : 's'}</span>
            <span><Activity size={13} />{connector.request_count.toLocaleString()} req</span>
            <span><Clock size={13} /><RelativeTime value={connector.last_used_at} fallback="Never used" /></span>
        </div>
    </Link>;
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string | number; hint?: string }) {
    return <div className="metric">
        <div className="metric-label">{icon}{label}</div>
        <div className="metric-value">{value}{hint && <span className="metric-hint">{hint}</span>}</div>
    </div>;
}

function EmptyState() {
    return <section className="empty-state" style={{ padding: 60, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <span className="empty-icon" style={{ margin: '0 auto 16px', display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 8, background: 'var(--color-aqua-mist)', color: 'var(--color-deep-teal)' }}>
            <FilePlus2 size={24} />
        </span>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, margin: '0 0 8px' }}>Build your first connector</h2>
        <p style={{ color: 'var(--color-warm-gray)', maxWidth: 440, margin: '0 auto 24px' }}>A connector wraps an AI model behind a stable, validated HTTP endpoint.</p>
        <div className="steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '0 auto 28px', maxWidth: 720, textAlign: 'left' }}>
            <div className="step" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--color-paper)' }}>
                <strong><span className="step-number" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--color-aqua-mist)', color: 'var(--color-deep-teal)', marginRight: 8, fontSize: 12 }}>1</span>Describe inputs</strong>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-warm-gray)' }}>Text, numbers, images, files or JSON, with validation built in.</p>
            </div>
            <div className="step" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--color-paper)' }}>
                <strong><span className="step-number" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--color-aqua-mist)', color: 'var(--color-deep-teal)', marginRight: 8, fontSize: 12 }}>2</span>Pick a model</strong>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-warm-gray)' }}>Choose Gemini or Groq and write the instructions.</p>
            </div>
            <div className="step" style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--color-paper)' }}>
                <strong><span className="step-number" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--color-aqua-mist)', color: 'var(--color-deep-teal)', marginRight: 8, fontSize: 12 }}>3</span>Call endpoint</strong>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-warm-gray)' }}>Responses are checked against your JSON Schema.</p>
            </div>
        </div>
        <Link href="/connectors/create" className="button button-teal button-lg"><Plus size={16} /> Create connector</Link>
    </section>;
}
