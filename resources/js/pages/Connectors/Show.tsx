import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, BarChart3, CheckCircle2, ChevronDown, ChevronLeft, Clock, Coins, FileText, FileUp, History, ImageIcon, KeyRound, Pencil, Play, Settings2, Sparkles, Terminal, Trash2, Unlock, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ApiKeysCard } from '../../components/ApiKeysCard';
import { AppShell } from '../../components/AppShell';
import { ProviderBadge, StatusBadge } from '../../components/Badges';
import { CodeBlock, highlightJson } from '../../components/CodeBlock';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CopyButton } from '../../components/CopyButton';
import { RelativeTime } from '../../components/RelativeTime';
import { buildCurl } from '../../curl';
import type { ApiKey, Connector, ExecutionLog, InputField } from '../../types';

type Stats = { total: number; successful: number; failed: number; last_used_at: string | null; average_duration_ms: number; input_tokens: number; output_tokens: number; total_tokens: number; usage_reported_runs: number };
type Props = { connector: Connector; stats: Stats; recentLogs: ExecutionLog[]; apiKeys: ApiKey[] };
type TestMeta = { duration_ms?: number; usage?: { total_tokens?: number | null } };
type TestResponse = { success: boolean; data: unknown; error: { code?: string; message?: string; fields?: Record<string, string[]> } | null; meta?: TestMeta };

export default function ConnectorShow({ connector, stats, recentLogs, apiKeys }: Props) {
    const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(connector.input_schema.map((field) => [field.name, field.type === 'boolean' ? false : ''])));
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [result, setResult] = useState<TestResponse | null>(null);
    const [elapsed, setElapsed] = useState<number | null>(null);
    const [testing, setTesting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loadingSample, setLoadingSample] = useState(false);
    const [sessionKey, setSessionKey] = useState<string | null>(null);
    const requiresKey = connector.auth_mode === 'api_key';
    const isActive = connector.status === 'active';
    const hasSamples = connector.input_schema.some((field) => Boolean(field.example));
    const curl = useMemo(() => buildCurl(connector, values, files, sessionKey), [connector, values, files, sessionKey]);

    const fillSample = async () => {
        setLoadingSample(true);
        try {
            const nextValues: Record<string, string | boolean> = {};
            const nextFiles: Record<string, File | null> = {};
            for (const field of connector.input_schema) {
                if (!field.example) continue;
                if (field.type === 'image' || field.type === 'file') {
                    const response = await fetch(field.example);
                    if (!response.ok) continue;
                    const blob = await response.blob();
                    nextFiles[field.name] = new File([blob], field.example.split('/').pop() || 'sample', { type: blob.type });
                } else if (field.type === 'boolean') {
                    nextValues[field.name] = field.example === 'true';
                } else {
                    nextValues[field.name] = field.example;
                }
            }
            setValues((current) => ({ ...current, ...nextValues }));
            setFiles((current) => ({ ...current, ...nextFiles }));
            setResult(null);
        } finally {
            setLoadingSample(false);
        }
    };

    const destroy = () => router.delete(`/connectors/${connector.id}`, { onStart: () => setDeleting(true), onFinish: () => setDeleting(false) });

    const executeTest = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isActive || testing) return;
        setTesting(true);
        setResult(null);
        const startedAt = performance.now();
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
            setElapsed(Math.round(performance.now() - startedAt));
            setTesting(false);
        }
    };

    const submitOnShortcut = (event: KeyboardEvent<HTMLFormElement>) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.requestSubmit();
        }
    };

    return <AppShell>
        <Head title={connector.name} />
        <section className="page-header">
            <div>
                <Link href="/connectors" className="back-link"><ChevronLeft size={15} /> Connectors</Link>
                <div className="title-row"><h1>{connector.name}</h1><StatusBadge status={connector.status} /></div>
                <p className="page-subtitle">{connector.description || 'No description added.'}</p>
            </div>
            <div className="header-actions">
                <Link href={`/connectors/${connector.id}/docs`} className="button button-secondary"><FileText size={15} /> API docs</Link>
                <Link href={`/connectors/${connector.id}/edit`} className="button button-secondary"><Pencil size={15} /> Edit</Link>
                <button type="button" className="icon-button is-danger" onClick={() => setConfirming(true)} aria-label={`Delete ${connector.name}`} title="Delete connector"><Trash2 size={16} /></button>
            </div>
        </section>

        {!isActive && <div className="callout" role="note">
            <AlertTriangle size={18} />
            <div><strong>This connector is {connector.status}.</strong><p>The playground and the public endpoint reject requests until the status is set to active.</p></div>
            <Link href={`/connectors/${connector.id}/edit`} className="button button-secondary button-sm">Change status</Link>
        </div>}

        <section className="two-pane">
            <div className="stack">
                <div className="card card-body">
                    <div className="endpoint-box"><span className="method">POST</span><code>{connector.endpoint}</code><CopyButton value={connector.endpoint} label="Copy endpoint" /></div>
                    <div className="meta-row">
                        <span><ProviderBadge provider={connector.provider} /></span>
                        <span className="mono">{connector.model}</span>
                        <span>{requiresKey ? <a href="#api-keys" className="meta-link"><KeyRound size={14} /> API key required · {apiKeys.length} active</a> : <><Unlock size={14} /> Public, no key</>}</span>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><div><div className="card-title"><Play size={16} /><h2>Playground</h2></div><p>Runs the same validation and provider path as the public endpoint{requiresKey ? '. It runs inside the hub, so it needs no key' : ''}.</p></div></div>
                    <form className="card-body" onSubmit={executeTest} onKeyDown={submitOnShortcut}>
                        <div className="playground-fields">
                            {connector.input_schema.map((field) => <TestField key={field.name} field={field} value={values[field.name]} file={files[field.name]} onValue={(value) => setValues((current) => ({ ...current, [field.name]: value }))} onFile={(file) => setFiles((current) => ({ ...current, [field.name]: file }))} />)}
                        </div>
                        <div className="playground-actions" style={{ marginTop: 18 }}>
                            <span className="playground-tools">
                                {hasSamples && <button type="button" className="button button-secondary button-sm" onClick={fillSample} disabled={loadingSample}><Sparkles size={14} /> {loadingSample ? 'Loading…' : 'Use sample'}</button>}
                                <CopyButton value={curl} label="Copy as cURL" showLabel icon={<Terminal size={14} />} />
                                <span className="muted kbd-hint"><kbd>⌘</kbd> <kbd>↵</kbd> to run</span>
                            </span>
                            <button type="submit" className="button button-primary" disabled={testing || !isActive}>{testing ? <><span className="spinner" /> Running…</> : <><Play size={15} /> Run test</>}</button>
                        </div>
                        {testing && <div className="running" aria-live="polite"><span className="spinner" /><div className="shimmer"><span /><span /></div><span>Waiting for {connector.provider}…</span></div>}
                        {result && !testing && <TestResult result={result} elapsed={elapsed} />}
                    </form>
                </div>

                {requiresKey && <ApiKeysCard connectorId={connector.id} endpoint={connector.endpoint} keys={apiKeys} onIssued={setSessionKey} />}

                <details className="card disclosure">
                    <summary><span className="card-title"><Settings2 size={16} />Instructions & output schema</span><ChevronDown size={17} className="chevron" /></summary>
                    <div className="disclosure-body stack">
                        <div className="field"><span className="field-label">System instructions</span><p className="prose-block">{connector.system_prompt || 'No instructions provided.'}</p></div>
                        <CodeBlock title="Output schema" tabs={[{ label: 'schema.json', code: JSON.stringify(connector.output_schema, null, 2), language: 'json' }]} />
                    </div>
                </details>

                <div className="card">
                    <div className="card-header"><div><div className="card-title"><History size={16} /><h2>Recent executions</h2></div><p>Stored server-side and kept across restarts.</p></div></div>
                    {recentLogs.length === 0
                        ? <div className="empty-inline"><History size={24} /><span>No executions yet. Run a test to see it here.</span></div>
                        : <div className="table-wrap"><table>
                            <thead><tr><th>Status</th><th>When</th><th>Source</th>{requiresKey && <th>Key</th>}<th className="num">Duration</th><th className="num">Tokens</th><th>Result</th></tr></thead>
                            <tbody>{recentLogs.map((log) => <tr key={log.id}>
                                <td><StatusBadge status={log.status} /></td>
                                <td><RelativeTime value={log.created_at} fallback="Unknown" /></td>
                                <td><span className="chip">{log.source}</span></td>
                                {requiresKey && <td>{log.api_key ? <span className="mono muted" title={log.api_key.prefix}>{log.api_key.name}</span> : <span className="muted">—</span>}</td>}
                                <td className="num">{log.duration_ms === null ? '—' : `${log.duration_ms.toLocaleString()} ms`}</td>
                                <td className="num">{log.total_tokens?.toLocaleString() ?? <span className="muted">—</span>}</td>
                                <td>{log.error_code ? <code className="mono" style={{ color: 'var(--danger)' }}>{log.error_code}</code> : <span className="muted">OK</span>}</td>
                            </tr>)}</tbody>
                        </table></div>}
                </div>
            </div>

            <aside className="stack sticky-aside">
                <StatsCard stats={stats} />
                <div className="card">
                    <div className="card-header"><div className="card-title"><Settings2 size={16} /><h2>Configuration</h2></div></div>
                    <dl className="def-list">
                        <div><dt>Provider</dt><dd><ProviderBadge provider={connector.provider} /></dd></div>
                        <div><dt>Model</dt><dd className="mono">{connector.model}</dd></div>
                        <div><dt>Inputs</dt><dd>{connector.input_schema.length}</dd></div>
                        <div><dt>Auth</dt><dd>{requiresKey ? `API key (${apiKeys.length})` : 'None'}</dd></div>
                        <div><dt>Updated</dt><dd><RelativeTime value={connector.updated_at} fallback="—" /></dd></div>
                    </dl>
                </div>
            </aside>
        </section>

        <ConfirmDialog open={confirming} title={`Delete ${connector.name}?`} description="The endpoint stops working immediately and its execution history is removed. This can't be undone." confirmLabel="Delete connector" processing={deleting} onConfirm={destroy} onClose={() => setConfirming(false)} />
    </AppShell>;
}

function StatsCard({ stats }: { stats: Stats }) {
    const rate = stats.total ? Math.round((stats.successful / stats.total) * 100) : null;

    return <div className="card">
        <div className="card-header"><div className="card-title"><BarChart3 size={16} /><h2>Usage</h2></div></div>
        <div className="card-body success-rate">
            <div className="success-rate-head"><span className="muted">Success rate</span><span className="success-rate-value">{rate === null ? '—' : `${rate}%`}</span></div>
            <div className="bar" role="img" aria-label={`${stats.successful} succeeded, ${stats.failed} failed`}>
                {stats.total > 0 && <><span className="bar-success" style={{ width: `${(stats.successful / stats.total) * 100}%` }} /><span className="bar-danger" style={{ width: `${(stats.failed / stats.total) * 100}%` }} /></>}
            </div>
            <div className="bar-legend"><span><i className="legend-dot bar-success" />{stats.successful} succeeded</span><span><i className="legend-dot bar-danger" />{stats.failed} failed</span></div>
        </div>
        <dl className="stat-list">
            <div><dt>Requests</dt><dd>{stats.total.toLocaleString()}</dd></div>
            <div><dt>Avg. latency</dt><dd>{stats.total ? `${stats.average_duration_ms.toLocaleString()} ms` : '—'}</dd></div>
            <div><dt>Tokens</dt><dd>{stats.usage_reported_runs ? stats.total_tokens.toLocaleString() : '—'}</dd></div>
            <div><dt>Last used</dt><dd><RelativeTime value={stats.last_used_at} /></dd></div>
        </dl>
    </div>;
}

function TestResult({ result, elapsed }: { result: TestResponse; elapsed: number | null }) {
    const [view, setView] = useState<'data' | 'raw'>('data');
    const raw = useMemo(() => JSON.stringify(result, null, 2), [result]);
    const shown = result.success && view === 'data' ? JSON.stringify(result.data, null, 2) : raw;
    const duration = result.meta?.duration_ms ?? elapsed;
    const tokens = result.meta?.usage?.total_tokens;
    const fieldErrors = Object.entries(result.error?.fields ?? {});

    return <div className={`result ${result.success ? 'is-success' : 'is-error'}`} aria-live="polite">
        <div className="result-header">
            <span className="result-status">{result.success ? <><CheckCircle2 size={16} /> Success</> : <><XCircle size={16} /> {result.error?.code || 'Request failed'}</>}</span>
            <span className="result-meta">
                {duration !== null && duration !== undefined && <span><Clock size={13} />{duration.toLocaleString()} ms</span>}
                {tokens !== null && tokens !== undefined && <span><Coins size={13} />{tokens.toLocaleString()} tokens</span>}
            </span>
            {result.success && <div className="segmented" role="group" aria-label="Result view">
                <button type="button" className={view === 'data' ? 'is-active' : ''} onClick={() => setView('data')}>Data</button>
                <button type="button" className={view === 'raw' ? 'is-active' : ''} onClick={() => setView('raw')}>Raw</button>
            </div>}
            <CopyButton value={shown} label="Copy result" />
        </div>
        {!result.success && result.error?.message && <p className="result-message">{result.error.message}</p>}
        {fieldErrors.length > 0 && <ul className="result-fields">{fieldErrors.map(([name, messages]) => <li key={name}><strong className="mono">{name}</strong>: {messages.join(' ')}</li>)}</ul>}
        <pre>{highlightJson(shown)}</pre>
    </div>;
}

function TestField({ field, value, file, onValue, onFile }: { field: InputField; value: string | boolean | undefined; file: File | null | undefined; onValue: (value: string | boolean) => void; onFile: (file: File | null) => void }) {
    const id = `input-${field.name}`;
    const label = <span className="field-label"><span>{field.name}{field.required && <span className="required-mark">*</span>}</span><small className="mono">{field.type}</small></span>;
    const hint = field.description ? <p className="field-hint">{field.description}</p> : null;

    if (field.type === 'boolean') {
        return <div className="field"><label className="switch" htmlFor={id}><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onValue(event.target.checked)} /><span className="switch-track" /><span className="mono">{field.name}</span>{field.required && <span className="required-mark">*</span>}</label>{hint}</div>;
    }

    if (field.type === 'image' || field.type === 'file') {
        return <div className="field">{label}<FileDrop field={field} file={file} onFile={onFile} />{hint}</div>;
    }

    if (field.type === 'json') {
        return <label className="field" htmlFor={id}>{label}<textarea id={id} className="textarea code-input" value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} placeholder='{"example": true}' rows={5} spellCheck={false} />{hint}</label>;
    }

    if (field.type === 'text') {
        return <label className="field" htmlFor={id}>{label}<textarea id={id} className="textarea" value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} rows={3} placeholder={`Enter ${field.name.replace(/_/g, ' ')}`} />{hint}</label>;
    }

    return <label className="field" htmlFor={id}>{label}<input id={id} className="input" type="number" value={String(value ?? '')} onChange={(event) => onValue(event.target.value)} placeholder="0" />{hint}</label>;
}

function FileDrop({ field, file, onFile }: { field: InputField; file: File | null | undefined; onFile: (file: File | null) => void }) {
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const isImage = field.type === 'image';

    useEffect(() => {
        if (!file || !file.type.startsWith('image/')) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const clear = () => {
        onFile(null);
        if (input.current) input.current.value = '';
    };

    return <div className={`dropzone ${dragging ? 'is-dragging' : ''}`} onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDrop={() => setDragging(false)}>
        <input ref={input} type="file" aria-label={`Upload ${field.name}`} accept={isImage ? 'image/jpeg,image/png,image/webp' : '.txt,.json,text/plain,application/json'} onChange={(event) => onFile(event.target.files?.[0] || null)} />
        <span className="dropzone-icon">{preview ? <img src={preview} alt="" /> : isImage ? <ImageIcon size={18} /> : <FileUp size={18} />}</span>
        <span style={{ minWidth: 0 }}>
            <strong>{file ? file.name : <>Drop a {isImage ? 'image' : 'file'} or <span style={{ color: 'var(--accent-text)' }}>browse</span></>}</strong>
            <small>{file ? formatBytes(file.size) : isImage ? 'JPEG, PNG or WebP, up to 4 MB' : 'TXT or JSON, up to 4 MB'}</small>
        </span>
        {file && <button type="button" className="icon-button" onClick={clear} aria-label={`Remove ${file.name}`}><X size={15} /></button>}    </div>;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
