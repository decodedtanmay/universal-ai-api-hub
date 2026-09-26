import { Head, Link } from '@inertiajs/react';
import { BookOpen, ChevronLeft, FileCode2, Globe, KeyRound, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppShell } from '../../components/AppShell';
import { useScrollSpy } from '../../components/useScrollSpy';
import { ProviderBadge } from '../../components/Badges';
import { CodeBlock } from '../../components/CodeBlock';
import { CopyButton } from '../../components/CopyButton';
import type { Connector, InputField } from '../../types';

type Limits = { max_upload_kb: number; max_text_characters: number; rate_limit_per_minute: number };
type Props = { connector: Pick<Connector, 'id' | 'name' | 'slug' | 'description' | 'provider' | 'model' | 'input_schema' | 'output_schema' | 'auth_mode' | 'endpoint'>; limits: Limits };

const toc = [
    { id: 'endpoint', label: 'Endpoint' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'request', label: 'Request fields' },
    { id: 'examples', label: 'Examples' },
    { id: 'responses', label: 'Responses' },
    { id: 'limits', label: 'Limits' },
    { id: 'errors', label: 'Error codes' },
];
const tocIds = toc.map((item) => item.id);

const errorCodes: { status: number; code: string; description: string; auth?: boolean }[] = [
    { status: 401, code: 'UNAUTHORIZED', description: 'The API key is missing, invalid, revoked, or issued for another connector.', auth: true },
    { status: 400, code: 'INVALID_JSON', description: 'The request body is not valid JSON.' },
    { status: 403, code: 'CONNECTOR_NOT_ACTIVE', description: 'The connector is in draft or disabled.' },
    { status: 404, code: 'CONNECTOR_NOT_FOUND', description: 'No connector exists at this URL.' },
    { status: 405, code: 'METHOD_NOT_ALLOWED', description: 'Only POST is accepted.' },
    { status: 422, code: 'INPUT_VALIDATION_FAILED', description: 'One or more inputs are invalid. See error.fields.' },
    { status: 422, code: 'MODEL_INPUT_UNSUPPORTED', description: 'The model cannot accept file or image inputs.' },
    { status: 429, code: 'RATE_LIMITED', description: 'Too many requests. Wait retry_after_seconds (also sent as the Retry-After header).' },
    { status: 502, code: 'PROVIDER_ERROR', description: 'The AI provider could not process the request.' },
    { status: 502, code: 'INVALID_PROVIDER_RESPONSE', description: 'The provider returned malformed or incomplete output.' },
    { status: 502, code: 'OUTPUT_SCHEMA_MISMATCH', description: 'The provider output did not match the output schema.' },
    { status: 503, code: 'PROVIDER_RATE_LIMITED', description: 'The provider is temporarily rate limited. Retry later.' },
    { status: 503, code: 'PROVIDER_NOT_CONFIGURED', description: 'Provider credentials are missing on the server.' },
    { status: 504, code: 'PROVIDER_TIMEOUT', description: 'The provider did not respond in time.' },
    { status: 500, code: 'INTERNAL_ERROR', description: 'An unexpected server error occurred.' },
];

export default function ConnectorDocumentation({ connector, limits }: Props) {
    const activeSection = useScrollSpy(tocIds);
    const requiresKey = connector.auth_mode === 'api_key';
    const examples = buildExamples(connector);
    const successResponse = { success: true, data: exampleFromSchema(connector.output_schema), error: null, meta: { provider: connector.provider, model: connector.model, duration_ms: 842, usage: { input_tokens: 120, output_tokens: 256, total_tokens: 376 } } };
    const errorResponse = { success: false, data: null, error: { code: 'INPUT_VALIDATION_FAILED', message: 'One or more inputs are invalid.', fields: { [connector.input_schema[0]?.name ?? 'field']: ['This field is required.'] } } };

    return <AppShell>
        <Head title={`${connector.name} API docs`} />
        <section className="page-header">
            <div>
                <Link href={`/connectors/${connector.id}`} className="back-link"><ChevronLeft size={15} /> {connector.name}</Link>
                <p className="eyebrow"><BookOpen size={13} /> API reference</p>
                <h1>{connector.name}</h1>
                <p className="page-subtitle">{connector.description || 'Generated from this connector configuration.'}</p>
            </div>
            <div className="header-actions"><Link href={`/connectors/${connector.id}`} className="button button-secondary"><Play size={15} /> Open playground</Link></div>
        </section>

        <div className="docs">
            <div className="stack">
                <DocsSection id="endpoint" title="Endpoint">
                    <p>Send a <code>POST</code> request to run the {connector.provider} model configured for this connector.</p>
                    <div className="endpoint-box"><span className="method">POST</span><code>{connector.endpoint}</code><CopyButton value={connector.endpoint} label="Copy endpoint" /></div>
                </DocsSection>

                <DocsSection id="authentication" title="Authentication">
                    {requiresKey ? <>
                        <p>Every request needs an API key issued for <strong>this connector</strong>. Keys from other connectors are rejected. Send it as a Bearer token, or in an <code>X-API-Key</code> header. Provider credentials stay on the server and are never exposed to callers.</p>
                        <div className="header-pill"><KeyRound size={14} className="muted" />Authorization: Bearer uah_…</div>
                        <p>Create and revoke keys on the <Link href={`/connectors/${connector.id}#api-keys`} className="inline-link">connector page</Link>. Each key is shown once when it is created, and only a hash is stored.</p>
                    </> : <>
                        <p>This endpoint is public, so no API key is needed. Provider credentials still stay on the server.</p>
                        <div className="header-pill"><Globe size={14} className="muted" />No authentication header required</div>
                    </>}
                </DocsSection>

                <DocsSection id="request" title="Request fields" description={examples.multipart ? 'Contains file inputs, so send as multipart/form-data.' : 'Send as application/json.'}>
                    <div className="table-wrap card" style={{ boxShadow: 'none' }}><table>
                        <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                        <tbody>{connector.input_schema.map((field) => <tr key={field.name}>
                            <td><span className="field-name">{field.name}</span></td>
                            <td><span className="type-pill">{field.type}</span></td>
                            <td>{field.required ? <span className="badge badge-accent">Required</span> : <span className="badge badge-neutral">Optional</span>}</td>
                            <td className="wrap">{field.description || <span className="muted">No description</span>}</td>
                        </tr>)}</tbody>
                    </table></div>
                </DocsSection>

                <DocsSection id="examples" title="Examples" description="Copy a snippet and replace the placeholder values.">
                    <CodeBlock title="Request examples" tabs={[{ label: 'cURL', code: examples.curl }, { label: 'JavaScript', code: examples.javascript }, { label: 'Python', code: examples.python }]} />
                </DocsSection>

                <DocsSection id="responses" title="Responses" description="Every response uses the same envelope. On success, data matches the output schema.">
                    <CodeBlock title="Responses" tabs={[{ label: '200 Success', code: JSON.stringify(successResponse, null, 2), language: 'json' }, { label: '422 Error', code: JSON.stringify(errorResponse, null, 2), language: 'json' }, { label: 'Output schema', code: JSON.stringify(connector.output_schema, null, 2), language: 'json' }]} />
                </DocsSection>

                <DocsSection id="limits" title="Limits" description="Applied to every request. Exceeding one returns a structured error, never a raw server error.">
                    <div className="table-wrap card" style={{ boxShadow: 'none' }}><table>
                        <thead><tr><th>Limit</th><th>Value</th><th>Error when exceeded</th></tr></thead>
                        <tbody>
                            <tr><td>Rate</td><td>{limits.rate_limit_per_minute} requests / minute / client</td><td><span className="field-name">RATE_LIMITED</span></td></tr>
                            <tr><td>Text and JSON fields</td><td>{limits.max_text_characters.toLocaleString()} characters</td><td><span className="field-name">INPUT_VALIDATION_FAILED</span></td></tr>
                            <tr><td>Image and file uploads</td><td>{(limits.max_upload_kb / 1024).toFixed(0)} MB each</td><td><span className="field-name">INPUT_VALIDATION_FAILED</span></td></tr>
                        </tbody>
                    </table></div>
                    <p className="field-hint">Responses include <code>X-RateLimit-Limit</code> and <code>X-RateLimit-Remaining</code> headers so clients can pace themselves.</p>
                </DocsSection>

                <DocsSection id="errors" title="Error codes" description="Branch on error.code, which stays stable. Messages are for humans and may change.">
                    <div className="table-wrap card" style={{ boxShadow: 'none' }}><table>
                        <thead><tr><th>HTTP</th><th>Code</th><th>Meaning</th></tr></thead>
                        <tbody>{errorCodes.filter((error) => !error.auth || requiresKey).map((error) => <tr key={error.code}>
                            <td><span className={`badge ${error.status >= 500 ? 'badge-danger' : 'badge-warning'}`}>{error.status}</span></td>
                            <td><span className="field-name">{error.code}</span></td>
                            <td className="wrap">{error.description}</td>
                        </tr>)}</tbody>
                    </table></div>
                </DocsSection>
            </div>

            <aside className="stack sticky-aside docs-aside">
                <nav className="card toc" aria-label="On this page">
                    <span className="toc-title">On this page</span>
                    {toc.map((item) => <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? 'is-active' : ''}>{item.label}</a>)}
                </nav>
                <div className="card">
                    <div className="card-header"><div className="card-title"><FileCode2 size={16} /><h2>Contract</h2></div></div>
                    <dl className="def-list">
                        <div><dt>Provider</dt><dd><ProviderBadge provider={connector.provider} /></dd></div>
                        <div><dt>Model</dt><dd className="mono">{connector.model}</dd></div>
                        <div><dt>Auth</dt><dd>{requiresKey ? 'Bearer key' : 'None'}</dd></div>
                        <div><dt>Request</dt><dd className="mono">{examples.multipart ? 'multipart' : 'JSON'}</dd></div>
                        <div><dt>Response</dt><dd className="mono">JSON</dd></div>
                    </dl>
                </div>
            </aside>
        </div>
    </AppShell>;
}

function DocsSection({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
    return <section id={id} className="card docs-section">
        <div className="card-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><a href={`#${id}`} className="muted" aria-label={`Link to ${title}`}>#</a></div>
        <div className="card-body">{children}</div>
    </section>;
}

function buildExamples(connector: Props['connector']) {
    const multipart = connector.input_schema.some((field) => field.type === 'image' || field.type === 'file');
    const requiresKey = connector.auth_mode === 'api_key';
    const body = Object.fromEntries(connector.input_schema.map((field) => [field.name, exampleFor(field)]));
    const json = JSON.stringify(body, null, 2);

    if (multipart) {
        const curlFields = connector.input_schema.map((field) => isFile(field) ? `  -F '${field.name}=@${filePlaceholder(field)}'` : `  -F '${field.name}=${formValue(field)}'`);
        const jsFields = connector.input_schema.map((field) => isFile(field) ? `form.append('${field.name}', fileInput.files[0]);` : `form.append('${field.name}', ${JSON.stringify(formValue(field))});`);
        const pyData = connector.input_schema.filter((field) => !isFile(field)).map((field) => `    "${field.name}": ${JSON.stringify(formValue(field))},`);
        const pyFiles = connector.input_schema.filter(isFile).map((field) => `    "${field.name}": open("${filePlaceholder(field)}", "rb"),`);

        return {
            multipart,
            curl: [`curl -X POST '${connector.endpoint}'`, ...(requiresKey ? ["  -H 'Authorization: Bearer <your-api-key>'"] : []), ...curlFields].join(' \\\n'),
            javascript: ['const form = new FormData();', ...jsFields, '', `const response = await fetch('${connector.endpoint}', {`, "  method: 'POST',", ...(requiresKey ? ["  headers: { Authorization: 'Bearer <your-api-key>' },"] : []), '  body: form,', '});', '', 'const { success, data, error } = await response.json();'].join('\n'),
            python: ['import requests', '', 'response = requests.post(', `    "${connector.endpoint}",`, ...(requiresKey ? ['    headers={"Authorization": "Bearer <your-api-key>"},'] : []), '    data={', ...pyData.map((line) => `    ${line}`), '    },', '    files={', ...pyFiles.map((line) => `    ${line}`), '    },', ')', '', 'print(response.json())'].join('\n'),
        };
    }

    return {
        multipart,
        curl: [`curl -X POST '${connector.endpoint}'`, "  -H 'Content-Type: application/json'", ...(requiresKey ? ["  -H 'Authorization: Bearer <your-api-key>'"] : []), `  -d '${json.replace(/\n/g, '\n  ')}'`].join(' \\\n'),
        javascript: [`const response = await fetch('${connector.endpoint}', {`, "  method: 'POST',", '  headers: {', "    'Content-Type': 'application/json',", ...(requiresKey ? ["    Authorization: 'Bearer <your-api-key>',"] : []), '  },', `  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),`, '});', '', 'const { success, data, error } = await response.json();'].join('\n'),
        python: ['import requests', '', 'response = requests.post(', `    "${connector.endpoint}",`, ...(requiresKey ? ['    headers={"Authorization": "Bearer <your-api-key>"},'] : []), `    json=${toPython(body).replace(/\n/g, '\n    ')},`, ')', '', 'print(response.json())'].join('\n'),
    };
}

function isFile(field: InputField): boolean {
    return field.type === 'image' || field.type === 'file';
}

function filePlaceholder(field: InputField): string {
    return field.type === 'image' ? '/path/to/image.jpg' : '/path/to/document.txt';
}

function formValue(field: InputField): string {
    const value = exampleFor(field);

    return typeof value === 'string' ? value : JSON.stringify(value);
}

function exampleFor(field: InputField): unknown {
    if (field.type === 'number') return 1;
    if (field.type === 'boolean') return true;
    if (field.type === 'json') return { example: true };
    if (isFile(field)) return filePlaceholder(field);
    return `Example ${field.name}`;
}

function toPython(value: Record<string, unknown>): string {
    return JSON.stringify(value, null, 4).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
}

function exampleFromSchema(schema: Record<string, any>, name = 'value', depth = 0): unknown {
    if (!schema || depth > 5) return null;
    if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
    const type = Array.isArray(schema.type) ? schema.type.find((candidate: string) => candidate !== 'null') : schema.type;

    if (type === 'object' || schema.properties) {
        return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, property]) => [key, exampleFromSchema(property as Record<string, any>, key, depth + 1)]));
    }
    if (type === 'array') return [exampleFromSchema(schema.items ?? {}, name, depth + 1)];
    if (type === 'number' || type === 'integer') return 0;
    if (type === 'boolean') return false;

    return `Example ${name}`;
}
