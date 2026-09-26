import { Check, Copy } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type Props = { value: string; label?: string; showLabel?: boolean; className?: string; icon?: ReactNode };

export function CopyButton({ value, label = 'Copy', showLabel = false, className = '', icon }: Props) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1600);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return <button type="button" className={`copy-button ${copied ? 'is-copied' : ''} ${className}`} onClick={copy} aria-label={label} title={label}>
        {copied ? <Check size={14} /> : icon ?? <Copy size={14} />}
        {showLabel && <span>{copied ? 'Copied' : label}</span>}
        <span className="sr-only" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
    </button>;
}
