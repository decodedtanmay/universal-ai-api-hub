import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronUp, Globe, KeyRound, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { AppShell } from '../../components/AppShell';
import { ProviderBadge } from '../../components/Badges';
import { useScrollSpy } from '../../components/useScrollSpy';
import { availableTemplates, type ConnectorTemplate } from '../../templates';
import type { Connector, InputField, InputType, Provider } from '../../types';

type Props = { connector: Connector | null; providers: Provider[]; existingSlugs?: string[] };
type ConnectorFormData = { name: string; slug: string; description: string; provider: string; model: string; system_prompt: string; input_schema: InputField[]; output_schema: Record<string, any>; auth_mode: 'api_key' | 'none'; status: 'draft' | 'active' | 'disabled' };
type SectionId = 'identity' | 'model' | 'inputs' | 'output' | 'access';

const allTypes: InputType[] = ['text', 'number', 'boolean', 'image', 'file', 'json'];
const fileTypes: InputType[] = ['image', 'file'];
const blankField = (): InputField => ({ name: '', type: 'text', required: true, description: '' });
const blankSchema: Record<string, any> = { type: 'object', properties: {}, required: [], additionalProperties: false };

const sections: { id: SectionId; label: string; keys: RegExp }[] = [
    { id: 'identity', label: 'Identity', keys: /^(name|slug|description)$/ },
    { id: 'model', label: 'Model', keys: /^(provider|model|system_prompt)$/ },
    { id: 'inputs', label: 'Inputs', keys: /^input_schema/ },
    { id: 'output', label: 'Output', keys: /^output_schema/ },
    { id: 'access', label: 'Access', keys: /^(auth_mode|status)$/ },
];
const sectionIds = sections.map((section) => section.id);

export default function ConnectorForm({ connector, providers, existingSlugs = [] }: Props) {
    const initial: ConnectorFormData = connector
        ? { name: connector.name, slug: connector.slug, description: connector.description ?? '', provider: connector.provider, model: connector.model, system_prompt: connector.system_prompt, input_schema: connector.input_schema, output_schema: connector.output_schema, auth_mode: connector.auth_mode, status: connector.status }
        : { name: '', slug: '', description: '', provider: providers[0]?.id ?? 'gemini', model: providers[0]?.models[0] ?? '', system_prompt: '', input_schema: [blankField()], output_schema: blankSchema, auth_mode: 'api_key', status: 'draft' };
    const initialSchemaText = useMemo(() => JSON.stringify(initial.output_schema, null, 2), []);
    const form = useForm<ConnectorFormData>({ ...initial });
    const [schemaText, setSchemaText] = useState(initialSchemaText);
    const [slugTouched, setSlugTouched] = useState(Boolean(connector));
    const activeSection = useScrollSpy(sectionIds);
    const selectedProvider = useMemo(() => providers.find((provider) => provider.id === form.data.provider), [form.data.provider, providers]);
    const supportsImages = selectedProvider?.supports_images ?? false;
    const errors = form.errors as Record<string, string>;
    const errorCount = Object.keys(errors).length;
    const isDirty = form.isDirty || schemaText !== initialSchemaText;
    const backHref = connector ? `/connectors/${connector.id}` : '/connectors';

    const schemaState = useMemo(() => {
        try {
            const parsed = JSON.parse(schemaText);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { valid: false, message: 'Schema must be a JSON object' };
            return { valid: true, message: `${Object.keys(parsed.properties ?? {}).length} output properties` };
        } catch (error) {
            return { valid: false, message: error instanceof Error ? error.message.replace(/^JSON\.parse: /, '') : 'Invalid JSON' };
        }
    }, [schemaText]);

    const duplicateNames = useMemo(() => {
        const seen = new Map<string, number>();
        form.data.input_schema.forEach((field) => { if (field.name) seen.set(field.name, (seen.get(field.name) ?? 0) + 1); });
        return new Set([...seen].filter(([, count]) => count > 1).map(([name]) => name));
    }, [form.data.input_schema]);

    const uniqueSlug = (base: string) => {
        let candidate = base;
        for (let suffix = 2; candidate && existingSlugs.includes(candidate); suffix++) candidate = `${base}-${suffix}`;

        return candidate;
    };
    const setName = (name: string) => form.setData((data) => ({ ...data, name, slug: slugTouched ? data.slug : uniqueSlug(slugify(name)) }));
    const templates = useMemo(() => connector ? [] : availableTemplates(providers), [connector, providers]);
    const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);
    const applyTemplate = (template: ConnectorTemplate) => {
        form.setData((data) => ({
            ...data,
            name: template.name,
            slug: uniqueSlug(slugify(template.name)),
            description: template.description,
            provider: template.provider,
            model: template.model,
            system_prompt: template.system_prompt,
            input_schema: template.input_schema.map((field) => ({ ...field })),
            status: 'active',
        }));
        setSchemaText(JSON.stringify(template.output_schema, null, 2));
        setSlugTouched(false);
        setAppliedTemplate(template.id);
    };
    const setField = (index: number, patch: Partial<InputField>) => form.setData('input_schema', form.data.input_schema.map((field, current) => current === index ? { ...field, ...patch } : field));
    const removeField = (index: number) => form.setData('input_schema', form.data.input_schema.filter((_, current) => current !== index));
    const moveField = (index: number, direction: -1 | 1) => {
        const fields = [...form.data.input_schema];
        const target = index + direction;
        if (target < 0 || target >= fields.length) return;
        [fields[index], fields[target]] = [fields[target], fields[index]];
        form.setData('input_schema', fields);
    };

    const formatSchema = () => {
        try { setSchemaText(JSON.stringify(JSON.parse(schemaText), null, 2)); } catch { /* keep the user's text while it is invalid */ }
    };

    const indentOnTab = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Tab' || event.shiftKey) return;
        event.preventDefault();
        const target = event.currentTarget;
        const { selectionStart, selectionEnd } = target;
        const next = `${schemaText.slice(0, selectionStart)}  ${schemaText.slice(selectionEnd)}`;
        setSchemaText(next);
        requestAnimationFrame(() => target.setSelectionRange(selectionStart + 2, selectionStart + 2));
    };

    const submit = (event?: FormEvent) => {
        event?.preventDefault();
        if (!schemaState.valid) {
            document.getElementById('output')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        const outputSchema = JSON.parse(schemaText) as Record<string, any>;
        form.transform((data) => ({ ...data, output_schema: outputSchema }));
        const options = { preserveScroll: 'errors' as const };
        if (connector) {
            form.patch(`/connectors/${connector.id}`, options);
        } else {
            form.post('/connectors', options);
        }
    };

    const saveOnShortcut = (event: KeyboardEvent<HTMLFormElement>) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            submit();
        }
    };

    return <AppShell>
        <Head title={connector ? `Edit ${connector.name}` : 'Create connector'} />
        <section className="page-header">
            <div>
                <Link href={backHref} className="back-link"><ChevronLeft size={15} /> {connector ? connector.name : 'Connectors'}</Link>
                <p className="eyebrow"><Sparkles size={13} /> {connector ? 'Edit connector' : 'New connector'}</p>
                <h1>{connector ? 'Connector settings' : 'Create a connector'}</h1>
                <p className="page-subtitle">{connector ? 'Changes apply to the live endpoint as soon as you save.' : 'Define the contract once. The endpoint, validation, docs and playground are generated for you.'}</p>
            </div>
        </section>

        {templates.length > 0 && <section className="template-picker" aria-label="Start from a template">
            <div className="template-picker-head"><span className="field-label">Start from a template</span><span className="muted">Fills every section below. Edit anything before saving.</span></div>
            <div className="template-grid">{templates.map((template) => <button key={template.id} type="button" className={`template-card ${appliedTemplate === template.id ? 'is-active' : ''}`} aria-pressed={appliedTemplate === template.id} onClick={() => applyTemplate(template)}>
                <span className="template-card-top"><ProviderBadge provider={template.provider} label="" />{appliedTemplate === template.id && <Check size={15} className="template-check" />}</span>
                <strong>{template.name}</strong>
                <small>{template.summary}</small>
            </button>)}</div>
        </section>}

        <form onSubmit={submit} onKeyDown={saveOnShortcut} className="editor" noValidate>
            <nav className="editor-nav" aria-label="Form sections">
                {sections.map((section, index) => {
                    const hasError = Object.keys(errors).some((key) => section.keys.test(key)) || (section.id === 'output' && !schemaState.valid);
                    return <a key={section.id} href={`#${section.id}`} className={`${activeSection === section.id ? 'is-active' : ''} ${hasError ? 'has-error' : ''}`}><span className="editor-nav-index">{hasError ? '!' : index + 1}</span>{section.label}</a>;
                })}
            </nav>

            <div className="editor-sections">
                {errorCount > 0 && <div className="error-summary" role="alert"><AlertCircle size={18} /><span>Please fix {errorCount === 1 ? 'the highlighted issue' : `${errorCount} highlighted issues`} before saving.</span></div>}

                <section id="identity" className="card editor-section">
                    <SectionHeader title="Identity" description="How this connector is named and addressed." />
                    <div className="card-body">
                        <div className="form-grid cols-2">
                            <Field label="Name" required error={errors.name}><input className="input" value={form.data.name} onChange={(event) => setName(event.target.value)} placeholder="Article Writer" autoFocus={!connector} /></Field>
                            <Field label="Endpoint slug" required error={errors.slug} hint={!slugTouched && !connector ? 'Generated from the name' : undefined}>
                                <div className="input-group"><span className="input-addon">/api/connectors/</span><input className="input mono" value={form.data.slug} onChange={(event) => { setSlugTouched(true); form.setData('slug', slugify(event.target.value, false)); }} placeholder="article-writer" /></div>
                            </Field>
                        </div>
                        <Field label="Description" error={errors.description} hint="Shown in the dashboard and generated docs."><textarea className="textarea" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder="What does this API do?" rows={2} /></Field>
                    </div>
                </section>

                <section id="model" className="card editor-section">
                    <SectionHeader title="Model" description="Provider credentials stay in server environment variables." />
                    <div className="card-body">
                        <Field label="Provider" required error={errors.provider}>
                            <div className="choice-grid" role="radiogroup" aria-label="Provider">
                                {providers.map((provider) => <label key={provider.id} className="choice">
                                    <input type="radio" name="provider" value={provider.id} checked={form.data.provider === provider.id} onChange={() => form.setData((data) => ({ ...data, provider: provider.id, model: provider.models.includes(data.model) ? data.model : provider.models[0] ?? '' }))} />
                                    <ProviderBadge provider={provider.id} label="" />
                                    <span><strong>{provider.label}</strong><small>{provider.supports_images ? 'Text, images & files' : 'Text only'} · {provider.models.length} model{provider.models.length === 1 ? '' : 's'}</small></span>
                                    <Check size={16} className="choice-check" />
                                </label>)}
                            </div>
                        </Field>
                        <Field label="Model" required error={errors.model} hint="Pick a suggested model or type any model ID the provider supports.">
                            <input className="input mono" list="provider-models" value={form.data.model} onChange={(event) => form.setData('model', event.target.value)} placeholder="Enter a supported model ID" />
                            <datalist id="provider-models">{selectedProvider?.models.map((model) => <option key={model} value={model} />)}</datalist>
                            {selectedProvider && selectedProvider.models.length > 0 && <div className="suggestions">{selectedProvider.models.map((model) => <button key={model} type="button" className={`suggestion ${form.data.model === model ? 'is-active' : ''}`} onClick={() => form.setData('model', model)}>{model}</button>)}</div>}
                        </Field>
                        <Field label="System instructions" required error={errors.system_prompt} counter={`${form.data.system_prompt.length.toLocaleString()} chars`}>
                            <textarea className="textarea" value={form.data.system_prompt} onChange={(event) => form.setData('system_prompt', event.target.value)} placeholder="You are an assistant that… Describe the task, constraints, tone and what a good answer looks like." rows={8} />
                        </Field>
                    </div>
                </section>

                <section id="inputs" className="card editor-section">
                    <SectionHeader title="Inputs" description="Each field becomes a validation rule, a playground control and a documented request parameter." aside={<span className="chip">{form.data.input_schema.length} field{form.data.input_schema.length === 1 ? '' : 's'}</span>} />
                    <div className="card-body">
                        <div className="field-rows">
                            {form.data.input_schema.map((field, index) => <InputRow
                                key={index}
                                field={field}
                                index={index}
                                total={form.data.input_schema.length}
                                supportsImages={supportsImages}
                                providerLabel={selectedProvider?.label ?? form.data.provider}
                                duplicate={duplicateNames.has(field.name)}
                                errors={Object.entries(errors).filter(([key]) => key.startsWith(`input_schema.${index}.`)).map(([, message]) => message)}
                                onChange={setField}
                                onMove={moveField}
                                onRemove={() => removeField(index)}
                            />)}
                        </div>
                        {errors.input_schema && <p className="field-error"><AlertCircle size={13} />{errors.input_schema}</p>}
                        <button type="button" className="add-field" onClick={() => form.setData('input_schema', [...form.data.input_schema, blankField()])}><Plus size={16} /> Add input field</button>
                    </div>
                </section>

                <section id="output" className="card editor-section">
                    <SectionHeader title="Structured output" description="A JSON Schema. Provider responses that don't match it are rejected before they reach callers." />
                    <div className="card-body">
                        <div className={`field ${!schemaState.valid || errors.output_schema ? 'has-error' : ''}`}>
                            <div className="editor-toolbar">
                                <span className={`json-state ${schemaState.valid ? 'is-valid' : 'is-invalid'}`}>{schemaState.valid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{schemaState.valid ? 'Valid JSON' : 'Invalid JSON'}<span className="json-state-detail" style={{ color: 'var(--code-muted)', fontWeight: 500 }}>· {schemaState.message}</span></span>
                                <button type="button" className="copy-button" onClick={formatSchema} disabled={!schemaState.valid}><Wand2 size={13} /> Format</button>
                            </div>
                            <textarea className="textarea code-input" aria-label="Output schema" value={schemaText} onChange={(event) => setSchemaText(event.target.value)} onKeyDown={indentOnTab} spellCheck={false} rows={14} />
                            {errors.output_schema && <p className="field-error"><AlertCircle size={13} />{errors.output_schema}</p>}
                        </div>
                    </div>
                </section>

                <section id="access" className="card editor-section">
                    <SectionHeader title="Access" description="Who can call the endpoint, and whether it's live." />
                    <div className="card-body">
                        <Field label="Authentication" error={errors.auth_mode}>
                            <div className="choice-grid" role="radiogroup" aria-label="Authentication">
                                <label className="choice"><input type="radio" name="auth_mode" checked={form.data.auth_mode === 'api_key'} onChange={() => form.setData('auth_mode', 'api_key')} /><KeyRound size={18} /><span><strong>API key required</strong><small>Callers send a key issued for this connector. Manage keys on its page.</small></span><Check size={16} className="choice-check" /></label>
                                <label className="choice"><input type="radio" name="auth_mode" checked={form.data.auth_mode === 'none'} onChange={() => form.setData('auth_mode', 'none')} /><Globe size={18} /><span><strong>Public</strong><small>Anyone with the URL can call it.</small></span><Check size={16} className="choice-check" /></label>
                            </div>
                        </Field>
                        <Field label="Status" error={errors.status} hint={statusHint(form.data.status)}>
                            <div className="segmented" role="radiogroup" aria-label="Status" style={{ justifySelf: 'start' }}>
                                {(['draft', 'active', 'disabled'] as const).map((status) => <label key={status}><input type="radio" name="status" checked={form.data.status === status} onChange={() => form.setData('status', status)} /><span style={{ textTransform: 'capitalize' }}>{status}</span></label>)}
                            </div>
                        </Field>
                    </div>
                </section>

                <div className="save-bar">
                    <span className={`save-state ${isDirty ? 'is-dirty' : ''}`}><span className="badge-dot" style={{ background: 'currentColor' }} />{isDirty ? 'Unsaved changes' : 'No changes'}</span>
                    <div className="save-bar-actions">
                        <span className="muted kbd-hint"><kbd>⌘</kbd> <kbd>S</kbd></span>
                        <Link href={backHref} className="button button-ghost">Cancel</Link>
                        <button type="submit" className="button button-primary" disabled={form.processing}>{form.processing ? <><span className="spinner" /> Saving…</> : connector ? 'Save changes' : 'Create connector'}</button>
                    </div>
                </div>
            </div>
        </form>
    </AppShell>;
}

function SectionHeader({ title, description, aside }: { title: string; description: string; aside?: ReactNode }) {
    return <div className="card-header"><div><h2>{title}</h2><p>{description}</p></div>{aside}</div>;
}

function Field({ label, required = false, error, hint, counter, children }: { label: string; required?: boolean; error?: string; hint?: string; counter?: string; children: ReactNode }) {
    return <div className={`field ${error ? 'has-error' : ''}`}>
        <span className="field-label"><span>{label}{required && <span className="required-mark">*</span>}</span>{counter && <small>{counter}</small>}</span>
        {children}
        {error ? <p className="field-error"><AlertCircle size={13} />{error}</p> : hint && <p className="field-hint">{hint}</p>}
    </div>;
}

type InputRowProps = {
    field: InputField;
    index: number;
    total: number;
    supportsImages: boolean;
    providerLabel: string;
    duplicate: boolean;
    errors: string[];
    onChange: (index: number, patch: Partial<InputField>) => void;
    onMove: (index: number, direction: -1 | 1) => void;
    onRemove: () => void;
};

function InputRow({ field, index, total, supportsImages, providerLabel, duplicate, errors, onChange, onMove, onRemove }: InputRowProps) {
    const unsupported = !supportsImages && fileTypes.includes(field.type);
    const types = allTypes.filter((type) => supportsImages || !fileTypes.includes(type) || type === field.type);

    return <div className={`field-row ${errors.length || duplicate ? 'has-error' : ''}`}>
        <div className="reorder">
            <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move field ${index + 1} up`}><ChevronUp size={14} /></button>
            <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} aria-label={`Move field ${index + 1} down`}><ChevronDown size={14} /></button>
        </div>
        <input className="input mono" aria-label={`Field ${index + 1} name`} value={field.name} onChange={(event) => onChange(index, { name: event.target.value.replace(/\s+/g, '_') })} placeholder="field_name" />
        <select className="select" aria-label={`Field ${index + 1} type`} value={field.type} onChange={(event) => onChange(index, { type: event.target.value as InputType })}>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <input className="input field-description" aria-label={`Field ${index + 1} description`} value={field.description ?? ''} onChange={(event) => onChange(index, { description: event.target.value })} placeholder="Description (shown in docs)" />
        <label className="switch"><input type="checkbox" checked={field.required} onChange={(event) => onChange(index, { required: event.target.checked })} /><span className="switch-track" />Required</label>
        <button type="button" className="icon-button is-bare is-danger" onClick={onRemove} disabled={total <= 1} aria-label={`Remove field ${index + 1}`} title={total <= 1 ? 'A connector needs at least one input' : 'Remove field'}><Trash2 size={15} /></button>
        {!fileTypes.includes(field.type) && field.type !== 'boolean' && <input className="input mono field-example" aria-label={`Field ${index + 1} example value`} value={field.example ?? ''} onChange={(event) => onChange(index, { example: event.target.value })} placeholder="Example value (powers the playground's “Use sample” button)" />}
        {unsupported && <p className="field-row-warning"><AlertTriangle size={13} />{providerLabel} can't accept {field.type} inputs. Choose another type or a provider with vision support.</p>}
        {duplicate && <p className="field-row-warning" style={{ color: 'var(--danger)' }}><AlertCircle size={13} />Another field already uses the name “{field.name}”.</p>}
        {errors.map((message) => <p key={message} className="field-row-warning" style={{ color: 'var(--danger)' }}><AlertCircle size={13} />{message}</p>)}
    </div>;
}

function statusHint(status: ConnectorFormData['status']): string {
    if (status === 'active') return 'Live. The endpoint and playground accept requests.';
    if (status === 'disabled') return 'Switched off. Requests are rejected.';

    return 'Work in progress. Requests are rejected until you activate it.';
}

function slugify(value: string, trim = true): string {
    const slug = value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '');

    return trim ? slug.replace(/-+$/, '') : slug;
}

