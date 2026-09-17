export type InputType = 'text' | 'number' | 'boolean' | 'image' | 'file' | 'json';

export type InputField = {
    name: string;
    type: InputType;
    required: boolean;
    description?: string;
};

export type Connector = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    provider: string;
    model: string;
    system_prompt: string;
    input_schema: InputField[];
    output_schema: Record<string, any>;
    auth_mode: 'api_key' | 'none';
    status: 'draft' | 'active' | 'disabled';
    endpoint: string;
    request_count: number;
    last_used_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type Provider = { id: string; label: string; models: string[]; supports_images: boolean };
export type Flash = { success?: string | null };

export type ExecutionLog = {
    id: number;
    source: string;
    status: 'running' | 'succeeded' | 'failed';
    duration_ms: number | null;
    total_tokens: number | null;
    error_code: string | null;
    created_at: string | null;
};
