import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Braces, Clock, Cpu, FileCode2, FilePlus2, Gauge, Hash, ImageIcon, KeyRound, Layers, Plus, Search, SearchX, ShieldCheck, Shuffle, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { AppShell } from '../../components/AppShell';
import { ProviderBadge, StatusBadge } from '../../components/Badges';
import { CopyButton } from '../../components/CopyButton';
import BlurText from '../../components/reactbits/BlurText';
import BorderGlow from '../../components/reactbits/BorderGlow';
import CountUp from '../../components/reactbits/CountUp';
import LogoLoop from '../../components/reactbits/LogoLoop';
import Magnet from '../../components/reactbits/Magnet';
import RotatingText from '../../components/reactbits/RotatingText';
import StarBorder from '../../components/reactbits/StarBorder';
import { useTheme } from '../../components/useTheme';
import { RelativeTime } from '../../components/RelativeTime';
import { RequestAnatomy } from '../../components/RequestAnatomy';
import { buildCurl } from '../../curl';
import type { Connector, ProviderStatus } from '../../types';

type Props = { connectors: Connector[] };
type Filter = 'all' | Connector['status'];

const filters: Filter[] = ['all', 'active', 'draft', 'disabled'];

export default function ConnectorIndex({ connectors }: Props) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const search = useRef<HTMLInputElement>(null);
    const theme = useTheme();
    const { providerStatus } = usePage<{ providerStatus: ProviderStatus[] }>().props;
    const showcase = connectors.find((connector) => connector.slug === 'business-card-scanner' && connector.status === 'active')
        ?? connectors.find((connector) => connector.status === 'active') ?? null;
    const quickstart = connectors.find((connector) => connector.slug === 'article-writer' && connector.status === 'active' && connector.auth_mode === 'none')
        ?? connectors.find((connector) => connector.status === 'active' && connector.auth_mode === 'none' && connector.input_schema.every((field) => field.type !== 'image' && field.type !== 'file'))
        ?? null;
    const quickstartCurl = quickstart
        ? buildCurl(quickstart, Object.fromEntries(quickstart.input_schema.filter((field) => field.example && field.required).map((field) => [field.name, field.example as string])), {})
        : null;

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
        <section className="hero" data-hero-fade>
            <span className="hero-badge"><span className="status-dot is-live" />Live on Gemini and Groq<span className="hide-sm"> · every response schema-checked</span></span>
            <h1 className="hero-title">
                <BlurText text="Turn a prompt into" delay={90} animateBy="words" direction="bottom" className="hero-title-line" />
                <RotatingText
                    texts={['a production API.', 'a card scanner.', 'an invoice parser.', 'an article writer.', 'a content rewriter.']}
                    mainClassName="hero-title-rotor"
                    splitLevelClassName="hero-rotor-word"
                    staggerFrom="first"
                    staggerDuration={0.014}
                    initial={{ y: '105%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-110%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    rotationInterval={2800}
                />
            </h1>
            <p className="hero-lede">Describe the inputs, pick a model, define the JSON you expect. The hub generates a validated endpoint, its documentation and a playground, then logs every call.</p>
            <div className="hero-actions">
                <Magnet padding={60} magnetStrength={6}>
                    <StarBorder as={Link} href="/connectors/create" className="hero-cta" color={theme === 'dark' ? '#ddd6fe' : '#8b5cf6'} speed="5s" thickness={1.5} backgroundColor="var(--accent)" textColor="var(--accent-contrast)" borderColor="transparent" innerClassName="hero-cta-inner">
                        <Plus size={17} /> New connector
                    </StarBorder>
                </Magnet>
                {showcase && <Magnet padding={60} magnetStrength={8}>
                    <Link href={`/connectors/${showcase.id}`} className="button button-outline button-lg hero-cta-secondary">Try {showcase.name} <ArrowRight size={16} /></Link>
                </Magnet>}
            </div>
        </section>

        <section className="stage" aria-label="Live example" data-reveal>
            <BorderGlow className="stage-glow" backgroundColor={theme === 'dark' ? '#0f0c17' : '#1e1a2a'} borderRadius={16} glowColor="262 83 70" colors={['#8b5cf6', '#ddd6fe', '#ede9fe']} glowIntensity={0.9} coneSpread={22} edgeSensitivity={28} animated>
                <RequestAnatomy connector={showcase} />
            </BorderGlow>
            <div className="stage-side">
                {quickstart && quickstartCurl && <div className="command-panel">
                    <div className="command-panel-head">
                        <h2>Call a live endpoint</h2>
                        <CopyButton value={quickstartCurl} label="Copy command" showLabel />
                    </div>
                    <pre>{quickstartCurl}</pre>
                    <Link href={`/connectors/${quickstart.id}/docs`} className="command-panel-link"><BookOpen size={14} /> {quickstart.name} API reference</Link>
                </div>}
                <ul className="provider-status" aria-label="Provider status">
                    {providerStatus.map((provider) => <li key={provider.id} className={provider.configured ? 'is-ready' : 'is-missing'} title={provider.configured ? 'Credentials configured on the server' : 'No API key configured on the server'}>
                        <span className="status-dot" />{provider.label}<span className="muted">{provider.configured ? 'ready' : 'not configured'}</span>
                    </li>)}
                </ul>
            </div>
        </section>

        <div className="ticker" data-reveal>
            <LogoLoop logos={ticker} speed={42} gap={44} logoHeight={22} pauseOnHover fadeOut fadeOutColor="var(--bg)" ariaLabel="Platform capabilities" />
        </div>

        <section className="feature-grid" aria-label="What every connector gets">
            <Feature icon={<Shuffle size={18} />} title="Provider adapters" body="Gemini and Groq behind one interface. Switch model or provider without touching code." />
            <Feature icon={<SlidersHorizontal size={18} />} title="Six input types" body="Text, number, boolean, image, file and JSON, each validated with size and length limits." />
            <Feature icon={<Braces size={18} />} title="Enforced output" body="Every response is checked against your JSON Schema before it reaches the caller." />
            <Feature icon={<BookOpen size={18} />} title="Generated docs" body="Endpoint reference with cURL, JavaScript and Python examples, limits and error codes." />
            <Feature icon={<KeyRound size={18} />} title="Scoped API keys" body="Per-connector keys, hashed at rest, shown once and revocable instantly." />
            <Feature icon={<ShieldCheck size={18} />} title="Logged and rate limited" body="Every call is recorded with latency and tokens. Clients are throttled with standard headers." />
        </section>

        {connectors.length === 0 ? <EmptyState /> : <>
            <div className="section-heading" data-reveal><h2><BlurText text="Your connectors" delay={70} direction="bottom" /></h2><span className="muted">Each one is a live endpoint.</span></div>
            <section className="metrics" aria-label="Workspace summary" data-reveal>
                <Metric icon={<Layers size={14} />} label="Connectors" value={connectors.length} />
                <Metric icon={<Zap size={14} />} label="Active" value={counts.active} hint={`of ${connectors.length}`} />
                <Metric icon={<Activity size={14} />} label="Total requests" value={totalRequests} />
                <Metric icon={<Cpu size={14} />} label="Providers" value={providerCount} />
            </section>

            <div className="toolbar" data-reveal>
                <label className="search">
                    <Search size={15} />
                    <span className="sr-only">Search connectors</span>
                    <input ref={search} className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, slug or model" />
                    {!query && <kbd>/</kbd>}
                </label>
                <div className="tab-strip" role="group" aria-label="Filter by status">
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

    return <Link href={`/connectors/${connector.id}`} className="card connector-card" data-reveal prefetch onPointerMove={trackPointer}>
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

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
    return <div className="feature" data-reveal onPointerMove={trackPointer}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{body}</p></div>;
}

/**
 * Spotlight tracking, after React Bits SpotlightCard: exposes the pointer position as CSS variables.
 */
function trackPointer(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

const ticker = [
    { icon: <Sparkles size={15} />, label: 'Google Gemini' },
    { icon: <Zap size={15} />, label: 'Groq' },
    { icon: <Braces size={15} />, label: 'JSON Schema validation' },
    { icon: <ImageIcon size={15} />, label: 'Image & file inputs' },
    { icon: <KeyRound size={15} />, label: 'SHA-256 hashed keys' },
    { icon: <Gauge size={15} />, label: 'Per-client rate limits' },
    { icon: <FileCode2 size={15} />, label: 'cURL · JavaScript · Python docs' },
    { icon: <Hash size={15} />, label: 'Token & latency logging' },
].map(({ icon, label }) => ({ node: <span className="ticker-item">{icon}{label}</span>, title: label }));

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint?: string }) {
    return <div className="metric">
        <div className="metric-label">{icon}{label}</div>
        <div className="metric-value"><span aria-hidden="true"><CountUp to={value} duration={1.6} separator="," /></span><span className="sr-only">{value.toLocaleString()}</span>{hint && <span className="metric-hint">{hint}</span>}</div>
    </div>;
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
