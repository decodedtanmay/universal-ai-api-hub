import type { Connector, InputField } from './types';

type Values = Record<string, string | boolean>;
type Files = Record<string, File | null | undefined>;

const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
const isFile = (field: InputField) => field.type === 'image' || field.type === 'file';

/**
 * Build a runnable cURL command from what has actually been entered in the playground.
 */
export function buildCurl(connector: Pick<Connector, 'endpoint' | 'auth_mode' | 'input_schema'>, values: Values, files: Files, apiKey?: string | null): string {
    const authHeader = connector.auth_mode === 'api_key' ? [`  -H ${quote(`Authorization: Bearer ${apiKey || '<your-api-key>'}`)}`] : [];
    const multipart = connector.input_schema.some(isFile);

    if (multipart) {
        const parts = connector.input_schema.flatMap((field) => {
            if (isFile(field)) return [`  -F ${quote(`${field.name}=@${files[field.name]?.name ?? (field.type === 'image' ? 'image.jpg' : 'document.txt')}`)}`];
            const value = values[field.name];
            if (value === '' || value === undefined) return [];

            return [`  -F ${quote(`${field.name}=${String(value)}`)}`];
        });

        return [`curl -X POST ${quote(connector.endpoint)}`, ...authHeader, ...parts].join(' \\\n');
    }

    const body = Object.fromEntries(connector.input_schema.flatMap((field) => {
        const value = values[field.name];
        if (value === '' || value === undefined) return [];
        if (field.type === 'number') return [[field.name, Number(value)]];
        if (field.type === 'json') {
            try { return [[field.name, JSON.parse(String(value))]]; } catch { return [[field.name, String(value)]]; }
        }

        return [[field.name, value]];
    }));

    return [`curl -X POST ${quote(connector.endpoint)}`, "  -H 'Content-Type: application/json'", ...authHeader, `  -d ${quote(JSON.stringify(body, null, 2)).replace(/\n/g, '\n  ')}`].join(' \\\n');
}
