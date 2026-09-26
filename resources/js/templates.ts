import type { InputField, Provider } from './types';

export type ConnectorTemplate = {
    id: string;
    name: string;
    summary: string;
    provider: 'gemini' | 'groq';
    model: string;
    description: string;
    system_prompt: string;
    input_schema: InputField[];
    output_schema: Record<string, unknown>;
};

const str = { type: 'string' };

export const connectorTemplates: ConnectorTemplate[] = [
    {
        id: 'card-scanner',
        name: 'Card Scanner',
        summary: 'Image in, contact JSON out',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        description: 'Extract contact details from a business card image.',
        system_prompt: 'You are a business card extraction system. Extract the person\'s name, company, designation, phone, email and website from the supplied image. Preserve the printed spelling. Use an empty string when a value is absent. Return only valid JSON matching the configured output structure.',
        input_schema: [{ name: 'card_image', type: 'image', required: true, description: 'Business card photo (JPEG, PNG or WebP)', example: '/samples/business-card.png' }],
        output_schema: { type: 'object', properties: { name: str, company: str, designation: str, phone: str, email: str, website: str }, required: ['name', 'company', 'designation', 'phone', 'email', 'website'], additionalProperties: false },
    },
    {
        id: 'article-writer',
        name: 'Article Writer',
        summary: 'Topic and tone in, article JSON out',
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        description: 'Write a structured article from a topic and writing parameters.',
        system_prompt: 'You are a professional content writer. Write an article on the supplied topic, following the requested keywords, word count and tone when provided. Return a short title, a one-sentence summary and the article body.',
        input_schema: [
            { name: 'topic', type: 'text', required: true, description: 'What the article is about', example: 'Digital marketing for small bakeries' },
            { name: 'keywords', type: 'text', required: false, description: 'Comma-separated SEO keywords', example: 'SEO, local search, social media' },
            { name: 'word_count', type: 'number', required: false, description: 'Approximate length in words', example: '300' },
            { name: 'options', type: 'json', required: false, description: 'Extra writing options', example: '{"tone":"professional"}' },
        ],
        output_schema: { type: 'object', properties: { title: str, summary: str, body: str }, required: ['title', 'summary', 'body'], additionalProperties: false },
    },
    {
        id: 'invoice-scanner',
        name: 'Invoice Scanner',
        summary: 'Invoice image in, invoice JSON out',
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        description: 'Extract vendor, totals and dates from an invoice image.',
        system_prompt: 'You are an invoice extraction system. Read the supplied invoice image and extract the vendor name, invoice number, invoice date, due date, currency, subtotal, tax and total. Amounts must be numbers without thousands separators. Use an empty string for missing text values and 0 for missing amounts. Return only valid JSON matching the configured output structure.',
        input_schema: [{ name: 'invoice_image', type: 'image', required: true, description: 'Invoice photo or scan (JPEG, PNG or WebP)', example: '/samples/invoice.png' }],
        output_schema: { type: 'object', properties: { vendor: str, invoice_number: str, invoice_date: str, due_date: str, currency: str, subtotal: { type: 'number' }, tax: { type: 'number' }, total: { type: 'number' } }, required: ['vendor', 'invoice_number', 'invoice_date', 'due_date', 'currency', 'subtotal', 'tax', 'total'], additionalProperties: false },
    },
    {
        id: 'content-rewriter',
        name: 'Content Rewriter',
        summary: 'Text and instructions in, rewrite out',
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        description: 'Rewrite text following custom instructions.',
        system_prompt: 'You are an expert editor. Rewrite the supplied text following the supplied instructions. Keep the original meaning unless told otherwise. Also list the main changes you made.',
        input_schema: [
            { name: 'text', type: 'text', required: true, description: 'The text to rewrite', example: 'our product is really good and lots of people like it a lot, you should buy it' },
            { name: 'instructions', type: 'text', required: true, description: 'How to rewrite it', example: 'Make it concise and professional' },
        ],
        output_schema: { type: 'object', properties: { rewritten: str, changes: { type: 'array', items: str } }, required: ['rewritten', 'changes'], additionalProperties: false },
    },
];

/**
 * Keep only templates whose provider exists on this server and whose inputs the provider can accept.
 */
export function availableTemplates(providers: Provider[]): ConnectorTemplate[] {
    return connectorTemplates.filter((template) => {
        const provider = providers.find((candidate) => candidate.id === template.provider);
        if (!provider) return false;

        return provider.supports_images || template.input_schema.every((field) => field.type !== 'image' && field.type !== 'file');
    });
}
