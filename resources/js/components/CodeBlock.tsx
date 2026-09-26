import { useId, useState, type ReactNode } from 'react';
import { CopyButton } from './CopyButton';

type Tab = { label: string; code: string; language?: 'json' | 'shell' | 'code' };
type Props = { title?: string; tabs: Tab[] };

export function CodeBlock({ title, tabs }: Props) {
    const [active, setActive] = useState(0);
    const id = useId();
    const current = tabs[active] ?? tabs[0];

    return <div className="code-block">
        <div className="code-block-header">
            {tabs.length > 1
                ? <div className="code-tabs" role="tablist" aria-label={title}>{tabs.map((tab, index) => <button key={tab.label} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} aria-selected={index === active} onClick={() => setActive(index)}>{tab.label}</button>)}</div>
                : <span className="code-block-title">{title ?? current.label}</span>}
            <CopyButton value={current.code} label="Copy code" showLabel />
        </div>
        <pre id={`${id}-panel`} role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `${id}-tab-${active}` : undefined}>{current.language === 'json' ? highlightJson(current.code) : current.code}</pre>
    </div>;
}

/**
 * Lightweight JSON token colouring for pretty-printed JSON strings.
 */
export function highlightJson(json: string): ReactNode[] {
    const pattern = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of json.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (index > cursor) nodes.push(json.slice(cursor, index));

        if (match[1]) {
            nodes.push(<span key={index} className={match[2] ? 'tok-key' : 'tok-string'}>{match[1]}</span>);
            if (match[2]) nodes.push(match[2]);
        } else if (match[3]) {
            nodes.push(<span key={index} className="tok-literal">{match[3]}</span>);
        } else {
            nodes.push(<span key={index} className="tok-number">{match[4]}</span>);
        }

        cursor = index + match[0].length;
    }

    nodes.push(json.slice(cursor));

    return nodes;
}
