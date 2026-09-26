import { router } from '@inertiajs/react';
import { AlertTriangle, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { ApiKey } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { CopyButton } from './CopyButton';
import { RelativeTime } from './RelativeTime';

type Props = { connectorId: number; endpoint: string; keys: ApiKey[]; onIssued: (plaintext: string) => void };
type Issued = { key: ApiKey; plaintext: string };

export function ApiKeysCard({ connectorId, endpoint, keys, onIssued }: Props) {
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [issued, setIssued] = useState<Issued | null>(null);
    const [revoking, setRevoking] = useState<ApiKey | null>(null);
    const [revokeProcessing, setRevokeProcessing] = useState(false);

    const create = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            const response = await fetch(`/connectors/${connectorId}/keys`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                credentials: 'same-origin',
                body: JSON.stringify({ name: name.trim() || 'Default key' }),
            });
            const body = await response.json();
            if (!response.ok) {
                setError(body?.errors?.name?.[0] ?? body?.error?.message ?? 'The key could not be created.');
                return;
            }
            setIssued(body as Issued);
            onIssued(body.plaintext);
            setCreating(false);
            setName('');
            router.reload({ only: ['apiKeys'] });
        } catch {
            setError('The key could not be created. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const revoke = () => {
        if (!revoking) return;
        router.delete(`/connectors/${connectorId}/keys/${revoking.id}`, {
            preserveScroll: true,
            onStart: () => setRevokeProcessing(true),
            onFinish: () => { setRevokeProcessing(false); setRevoking(null); },
            onSuccess: () => { if (issued?.key.id === revoking.id) setIssued(null); },
        });
    };

    const exampleCurl = issued ? `curl -X POST '${endpoint}' \\\n  -H 'Authorization: Bearer ${issued.plaintext}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{ ... }'` : '';

    return <div className="card" id="api-keys">
        <div className="card-header">
            <div><div className="card-title"><KeyRound size={16} /><h2>API keys</h2></div><p>Scoped to this connector. Stored as SHA-256 hashes, so each key is shown only once.</p></div>
            {!creating && <button type="button" className="button button-secondary button-sm" onClick={() => { setCreating(true); setIssued(null); }}><Plus size={14} /> New key</button>}
        </div>

        {issued && <div className="key-reveal" role="status">
            <div className="key-reveal-head"><ShieldCheck size={16} /><strong>Copy “{issued.key.name}” now.</strong><span>It won't be shown again. The playground's “Copy as cURL” includes it for this session.</span></div>
            <div className="endpoint-box"><code>{issued.plaintext}</code><CopyButton value={issued.plaintext} label="Copy key" showLabel /></div>
            <details className="key-reveal-curl"><summary>Example request</summary><pre>{exampleCurl}</pre></details>
            <button type="button" className="button button-ghost button-sm" onClick={() => setIssued(null)}>I've saved it</button>
        </div>}

        {creating && <form className="key-create" onSubmit={create}>
            <label className="field" style={{ flex: 1 }}>
                <span className="sr-only">Key name</span>
                <input className="input" autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Key name, for example “Mobile app” or “Evaluator”" />
            </label>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setError(null); }}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? <><span className="spinner" /> Creating…</> : 'Create key'}</button>
            {error && <p className="field-error" style={{ flexBasis: '100%' }}>{error}</p>}
        </form>}

        {keys.length === 0
            ? <div className="empty-inline"><AlertTriangle size={22} /><strong>No active keys</strong><span>Every API call is rejected with UNAUTHORIZED until you create one.</span></div>
            : <div className="table-wrap"><table>
                <thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last used</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{keys.map((key) => <tr key={key.id}>
                    <td><strong>{key.name}</strong></td>
                    <td><code className="mono muted">{key.prefix}••••••••</code></td>
                    <td><RelativeTime value={key.created_at} fallback="—" /></td>
                    <td><RelativeTime value={key.last_used_at} fallback="Never" /></td>
                    <td className="num"><button type="button" className="button button-danger-ghost button-sm" onClick={() => setRevoking(key)}><Trash2 size={13} /> Revoke</button></td>
                </tr>)}</tbody>
            </table></div>}

        <ConfirmDialog open={revoking !== null} title={`Revoke “${revoking?.name ?? ''}”?`} description="Requests using this key are rejected immediately. This can't be undone, but you can issue a new key at any time." confirmLabel="Revoke key" processing={revokeProcessing} processingLabel="Revoking…" onConfirm={revoke} onClose={() => setRevoking(null)} />
    </div>;
}
