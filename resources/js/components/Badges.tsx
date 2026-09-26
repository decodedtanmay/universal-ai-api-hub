import type { Connector, ExecutionLog } from '../types';

type BadgeStatus = Connector['status'] | ExecutionLog['status'];

const tones: Record<BadgeStatus, string> = {
    active: 'success',
    succeeded: 'success',
    draft: 'neutral',
    running: 'warning running',
    disabled: 'danger',
    failed: 'danger',
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
    const tone = tones[status] ?? 'neutral';

    return <span className={tone.split(' ').map((part) => `badge-${part}`).join(' ') + ' badge'}><span className="badge-dot" />{status}</span>;
}

export function ProviderBadge({ provider, label }: { provider: string; label?: string }) {
    return <span className={`provider provider-${provider}`}><span className="provider-mark" aria-hidden="true">{provider.charAt(0)}</span>{label ?? provider}</span>;
}
