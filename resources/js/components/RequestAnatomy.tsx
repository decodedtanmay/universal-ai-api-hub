import { Check } from 'lucide-react';
import type { Connector } from '../types';
import { highlightJson } from './CodeBlock';

const cardSample = {
    name: 'Priya Nair',
    company: 'LUMINA LABS',
    designation: 'Senior Product Designer',
    email: 'priya.nair@luminalabs.example',
};

/**
 * A static, animated illustration of what the hub does to every request, using a real connector's details.
 */
export function RequestAnatomy({ connector }: { connector: Connector | null }) {
    const slug = connector?.slug ?? 'business-card-scanner';
    const model = connector?.model ?? 'gemini-3.6-flash';
    const inputs = connector?.input_schema.map((field) => field.type).join(', ') ?? 'image';
    const sample = slug === 'business-card-scanner' || !connector
        ? cardSample
        : Object.fromEntries(Object.keys((connector.output_schema.properties as Record<string, unknown>) ?? {}).slice(0, 4).map((key) => [key, '…']));
    const response = JSON.stringify({ success: true, data: sample }, null, 2);

    const steps = [
        { label: 'Authenticate', detail: connector?.auth_mode === 'api_key' ? 'connector-scoped key' : 'public endpoint' },
        { label: 'Validate input', detail: `${inputs} · size limits` },
        { label: 'Route to provider', detail: model },
        { label: 'Verify output', detail: 'JSON Schema' },
        { label: 'Log & respond', detail: '200 OK' },
    ];

    return <div className="anatomy" aria-label="How a request flows through the hub">
        <div className="anatomy-bar">
            <span className="anatomy-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="anatomy-title"><span className="method">POST</span>/api/connectors/{slug}</span>
        </div>
        <div className="anatomy-terminal">
            <ol className="anatomy-steps">
                {steps.map((step, index) => <li key={step.label} style={{ animationDelay: `${0.25 + index * 0.22}s` }}>
                    <span className="anatomy-check"><Check size={11} strokeWidth={3} /></span>
                    <span className="anatomy-label">{step.label}</span>
                    <span className="anatomy-detail">{step.detail}</span>
                </li>)}
            </ol>
            <pre className="anatomy-response" style={{ animationDelay: '1.45s' }}>{highlightJson(response)}</pre>
        </div>
    </div>;
}
