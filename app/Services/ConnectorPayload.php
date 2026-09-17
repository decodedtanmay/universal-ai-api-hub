<?php

namespace App\Services;

use App\Models\Connector;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class ConnectorPayload
{
    public function __construct(private ConnectorConfiguration $configuration)
    {
    }

    /** @return array<string, mixed> */
    public function from(Request $request, ?Connector $connector = null): array
    {
        $providerNames = array_keys(config('ai-hub.providers'));
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/', Rule::unique('connectors', 'slug')->ignore($connector?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'provider' => ['required', Rule::in($providerNames)],
            'model' => ['required', 'string', 'max:200'],
            'system_prompt' => ['required', 'string', 'max:12000'],
            'input_schema' => ['required', 'array', 'max:25'],
            'input_schema.*.name' => ['required', 'string'],
            'input_schema.*.type' => ['required', 'string'],
            'input_schema.*.required' => ['required', 'boolean'],
            'input_schema.*.description' => ['nullable', 'string', 'max:500'],
            'output_schema' => ['required', 'array'],
            'auth_mode' => ['required', Rule::in(['api_key', 'none'])],
            'status' => ['required', Rule::in(['draft', 'active', 'disabled'])],
        ]);

        $payload['slug'] = $payload['slug'] ?: Str::slug($payload['name']);
        $this->configuration->validateFields($payload['input_schema'], $payload['provider']);
        $this->configuration->validateOutputSchema($payload['output_schema']);

        return $payload;
    }
}
