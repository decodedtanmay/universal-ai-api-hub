import { Head, Link } from '@inertiajs/react';
import { ArrowRight, FilePlus2, Plus } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import type { Connector } from '../../types';

type Props = { connectors: Connector[] };

export default function ConnectorIndex({ connectors }: Props) {
    return <AppShell>
        <Head title="Connectors" />
        <section className="page-header"><div><p className="eyebrow">Configuration workspace</p><h1>Connectors</h1><p className="page-subtitle">Create reusable AI endpoints backed by Gemini or Groq.</p></div><Link href="/connectors/create" className="primary-button"><Plus size={17} /> New connector</Link></section>
        {connectors.length === 0 ? <section className="empty-state"><FilePlus2 size={32} /><h2>Build your first connector</h2><p>Define its inputs, prompt, provider, model, and structured output in one place.</p><Link href="/connectors/create" className="primary-button"><Plus size={17} /> Create connector</Link></section> :
            <section className="data-region" aria-label="Configured connectors"><div className="table-wrap"><table><thead><tr><th>Connector</th><th>Provider</th><th>Inputs</th><th>Status</th><th>Requests</th><th>Last used</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{connectors.map((connector) => <tr key={connector.id}><td><strong>{connector.name}</strong><span className="table-detail">/{connector.slug}</span></td><td><span className="provider-name">{connector.provider}</span><span className="table-detail">{connector.model}</span></td><td>{connector.input_schema.length} field{connector.input_schema.length === 1 ? '' : 's'}</td><td><span className={`status status-${connector.status}`}>{connector.status}</span></td><td>{connector.request_count}</td><td>{connector.last_used_at ? new Date(connector.last_used_at).toLocaleString() : 'Never'}</td><td><Link href={`/connectors/${connector.id}`} className="icon-button" aria-label={`Open ${connector.name}`} title={`Open ${connector.name}`}><ArrowRight size={18} /></Link></td></tr>)}</tbody></table></div></section>}
    </AppShell>;
}
