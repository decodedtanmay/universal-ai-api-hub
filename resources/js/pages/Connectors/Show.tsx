import { Head, Link, router } from '@inertiajs/react';
import { Copy, FileText, Pencil, Play, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import type { Connector, ExecutionLog, InputField } from '../../types';

type Stats = { total: number; successful: number; failed: number; last_used_at: string | null; average_duration_ms: number; input_tokens: number; output_tokens: number; total_tokens: number; usage_reported_runs: number };
type Props = { connector: Connector; stats: Stats; recentLogs: ExecutionLog[] };
type TestResponse = { success: boolean; data: unknown; error: { code?: string; message?: string; fields?: Record<string, string[]> } | null; meta?: unknown };

export default function ConnectorShow({ connector, stats, recentLogs }: Props) {
    const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(connector.input_schema.map((field) => [field.name, field.type === 'boolean' ? false : ''])));
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [result, setResult] = useState<TestResponse | null>(null);
    const [testing, setTesting] = useState(false);
    const destroy = () => { if (window.confirm(`Delete ${connector.name}?`)) router.delete(`/connectors/${connector.id}`); };
    const testResult = useMemo(() => result ? JSON.stringify(result, null, 2) : '', [result]);

    const executeTest = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTesting(true);
        setResult(null);
        const body = new FormData();
        connector.input_schema.forEach((field) => {
            if (field.type === 'image' || field.type === 'file') {
                const file = files[field.name];
                if (file) body.append(field.name, file);
                return;
            }
            body.append(field.name, String(values[field.name] ?? ''));
        });
        try {
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            const response = await fetch(`/connectors/${connector.id}/test`, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body, credentials: 'same-origin' });
            setResult(await response.json() as TestResponse);
            router.reload({ only: ['stats', 'recentLogs'] });
        } catch {
            setResult({ success: false, data: null, error: { code: 'TEST_UNAVAILABLE', message: 'The test request could not be completed. Try again shortly.' } });
        } finally {
            setTesting(false);
        }
    };

    return <AppShell>
        <Head title={connector.name} />
        <section className="page-header connector-header"><div><p className="eyebrow">Connector</p><h1>{connector.name}</h1><p className="page-subtitle">{connector.description || 'No description added.'}</p></div><div className="header-actions"><Link href={`/connectors/${connector.id}/docs`} className="secondary-button"><FileText size={16} /> Docs</Link><Link href={`/connectors/${connector.id}/edit`} className="secondary-button"><Pencil size={16} /> Edit</Link><button className="icon-button danger-button" onClick={destroy} aria-label={`Delete ${connector.name}`} title="Delete connector"><Trash2 size={17} /></button></div></section>
        <section className="detail-grid"><div className="detail-main">
            <div className="detail-section"><div className="section-heading inline-heading"><div><h2>Generated endpoint</h2><p>{connector.auth_mode === 'api_key' ? 'Send a server-issued API key with external requests.' : 'This endpoint currently accepts unauthenticated requests.'}</p></div><button className="icon-button" onClick={() => navigator.clipboard.writeText(connector.endpoint)} aria-label="Copy endpoint" title="Copy endpoint"><Copy size={17} /></button></div><code className="endpoint-code">POST {connector.endpoint}</code></div>
            <div className="detail-section"><h2>Configuration</h2><dl className="details-list"><div><dt>Provider</dt><dd>{connector.provider}</dd></div><div><dt>Model</dt><dd>{connector.model}</dd></div><div><dt>Status</dt><dd><span className={`status status-${connector.status}`}>{connector.status}</span></dd></div><div><dt>Inputs</dt><dd>{connector.input_schema.length} configured</dd></div></dl></div>
            <div className="detail-section"><div className="section-heading"><h2>Test connector</h2><p>Runs the same validation and provider execution path as the public endpoint.</p></div><form className="test-form" onSubmit={executeTest}>{connector.input_schema.map((field) => <TestField key={field.name} field={field} value={values[field.name]} file={files[field.name]} onValue={(value) => setValues((current) => ({ ...current, [field.name]: value }))} onFile={(file) => setFiles((current) => ({ ...current, [field.name]: file }))} />)}<div className="form-actions"><button type="submit" className="primary-button" disabled={testing || connector.status !== 'active'}><Play size={16} /> {testing ? 'Running…' : 'Run test'}</button></div></form>{result && <div className={`test-result ${result.success ? 'test-success' : 'test-error'}`}><strong>{result.success ? 'Completed' : result.error?.code || 'Request failed'}</strong><pre>{testResult}</pre></div>}</div>
            <div className="detail-section"><h2>Output schema</h2><pre>{JSON.stringify(connector.output_schema, null, 2)}</pre></div>
            <div className="detail-section"><div className="section-heading"><h2>Recent executions</h2><p>Stored server-side and retained across restarts.</p></div>{recentLogs.length === 0 ? <p className="body-copy">No executions recorded yet.</p> : <div className="docs-table-wrap"><table><thead><tr><th>When</th><th>Source</th><th>Status</th><th>Duration</th><th>Tokens</th><th>Result</th></tr></thead><tbody>{recentLogs.map((log) => <tr key={log.id}><td>{log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown'}</td><td>{log.source}</td><td><span className={`status status-${log.status === 'succeeded' ? 'active' : log.status === 'failed' ? 'disabled' : 'draft'}`}>{log.status}</span></td><td>{log.duration_ms === null ? '—' : `${log.duration_ms} ms`}</td><td>{log.total_tokens ?? 'Not reported'}</td><td>{log.error_code || 'Completed'}</td></tr>)}</tbody></table></div>}</div>
        </div><aside className="detail-aside"><div className="stats-grid"><Stat label="Requests" value={stats.total} /><Stat label="Succeeded" value={stats.successful} /><Stat label="Failed" value={stats.failed} /><Stat label="Last used" value={stats.last_used_at ? new Date(stats.last_used_at).toLocaleDateString() : 'Never'} /><Stat label="Avg. latency" value={stats.total ? `${stats.average_duration_ms} ms` : '—'} /><Stat label="Tokens" value={stats.usage_reported_runs ? stats.total_tokens : 'Not reported'} /></div><div className="aside-actions"><Link href={`/connectors/${connector.id}/docs`} className="secondary-button"><FileText size={16} /> View API docs</Link></div></aside></section>
    </AppShell>;
}

function TestField({ field, value, file, onValue, onFile }: { field: InputField; value: string | boolean | undefined; file: File | null | undefined; onValue: (value: string | boolean) => void; onFile: (file: File | null) => void }) {
    const label = <>{field.name}{field.required ? ' *' : ''}<small>{field.description}</small></>;
    if (field.type === 'boolean') return <label className="checkbox-label test-checkbox"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onValue(event.target.checked)} /> {label}</label>;
    if (field.type === 'image' || field.type === 'file') return <label>{label}<input type="file" accept={field.type === 'image' ? 'image/jpeg,image/png,image/webp' : '.txt,.json,text/plain,application/json'} onChange={(event) => onFile(event.target.files?.[0] || null)} /><small>{file?.name || (field.type === 'image' ? 'JPEG, PNG, or WebP; 4 MB maximum.' : 'TXT or JSON; 4 MB maximum.')}</small></label>;
    if (field.type === 'json') return <label>{label}<textarea className="code-input" value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} placeholder='{"example": true}' rows={4} /></label>;
    if (field.type === 'text') return <label>{label}<textarea value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} rows={4} /></label>;
    return <label>{label}<input type="number" value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} /></label>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }
