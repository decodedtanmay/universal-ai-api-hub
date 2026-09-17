import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Copy, FileCode2 } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import type { Connector, InputField } from '../../types';

type Props = { connector: Pick<Connector, 'id' | 'name' | 'slug' | 'description' | 'provider' | 'model' | 'input_schema' | 'output_schema' | 'auth_mode' | 'endpoint'> };

export default function ConnectorDocumentation({ connector }: Props) {
    const requestExample = Object.fromEntries(connector.input_schema.map((field) => [field.name, exampleFor(field)]));
    const curl = [
        `curl -X POST '${connector.endpoint}'`,
        "  -H 'Content-Type: application/json'",
        ...(connector.auth_mode === 'api_key' ? ["  -H 'Authorization: Bearer <your-hub-api-key>'"] : []),
        `  -d '${JSON.stringify(requestExample, null, 2).replace(/\n/g, '\n  ')}'`,
    ].join(' \\\n');

    return <AppShell>
        <Head title={`${connector.name} API docs`} />
        <section className="form-header"><div><Link href={`/connectors/${connector.id}`} className="back-link"><ArrowLeft size={16} /> Back to connector</Link><p className="eyebrow">API reference</p><h1>{connector.name}</h1><p className="page-subtitle">{connector.description || 'Generated from this connector configuration.'}</p></div></section>
        <section className="docs-layout">
            <div className="detail-main">
                <div className="detail-section"><div className="section-heading inline-heading"><div><h2>Request endpoint</h2><p>POST requests invoke the active {connector.provider} model.</p></div><button className="icon-button" onClick={() => navigator.clipboard.writeText(connector.endpoint)} title="Copy endpoint" aria-label="Copy endpoint"><Copy size={17} /></button></div><code className="endpoint-code">POST {connector.endpoint}</code></div>
                <div className="detail-section"><h2>Authentication</h2><p className="body-copy">{connector.auth_mode === 'api_key' ? 'Send your hub API key as a Bearer token. Provider credentials are never sent to callers.' : 'This connector is configured for unauthenticated access. Provider credentials remain server-side.'}</p></div>
                <div className="detail-section"><h2>Request fields</h2><div className="docs-table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>{connector.input_schema.map((field) => <tr key={field.name}><td><code>{field.name}</code></td><td>{field.type}</td><td>{field.required ? 'Yes' : 'No'}</td><td>{field.description || 'No description'}</td></tr>)}</tbody></table></div></div>
                <div className="detail-section"><h2>Example request</h2><pre>{curl}</pre></div>
                <div className="detail-section"><h2>Successful response</h2><pre>{JSON.stringify({ success: true, data: exampleOutput(connector.output_schema), error: null, meta: { provider: connector.provider, model: connector.model, duration_ms: 0, usage: { input_tokens: null, output_tokens: null, total_tokens: null } } }, null, 2)}</pre></div>
                <div className="detail-section"><h2>Error response</h2><pre>{JSON.stringify({ success: false, data: null, error: { code: 'INPUT_VALIDATION_FAILED', message: 'One or more inputs are invalid.' } }, null, 2)}</pre></div>
            </div>
            <aside className="detail-aside"><div className="detail-section compact-section"><FileCode2 size={19} /><h2>Contract</h2><dl className="details-list single-column"><div><dt>Provider</dt><dd>{connector.provider}</dd></div><div><dt>Model</dt><dd>{connector.model}</dd></div><div><dt>Response type</dt><dd>JSON</dd></div></dl></div></aside>
        </section>
    </AppShell>;
}

function exampleFor(field: InputField): unknown {
    if (field.type === 'number') return 1;
    if (field.type === 'boolean') return true;
    if (field.type === 'json') return { example: true };
    if (field.type === 'image' || field.type === 'file') return 'Upload as multipart/form-data';
    return `Example ${field.name}`;
}

function exampleOutput(schema: Record<string, any>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(schema.properties || {}).map(([name, property]: [string, any]) => [name, property.type === 'number' || property.type === 'integer' ? 0 : property.type === 'boolean' ? false : `Example ${name}`]));
}
