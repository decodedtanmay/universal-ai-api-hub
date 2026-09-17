<?php

namespace App\Services\Providers;

use App\Contracts\AiProvider;
use App\Data\ProviderResult;
use App\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

final class GroqProvider implements AiProvider
{
    public function name(): string
    {
        return 'groq';
    }

    public function generate(
        string $model,
        string $systemPrompt,
        array $input,
        array $outputSchema,
        array $files = [],
    ): ProviderResult {
        $key = config('services.groq.key');

        if (! is_string($key) || $key === '') {
            throw new ProviderException('Groq is not configured on this server.', 'PROVIDER_NOT_CONFIGURED', 503);
        }

        if ($files !== []) {
            throw new ProviderException('The selected Groq connector does not support file or image inputs.', 'MODEL_INPUT_UNSUPPORTED', 422);
        }

        try {
            $response = Http::acceptJson()
                ->withToken($key)
                ->timeout(config('ai-hub.provider_timeout_seconds'))
                ->post(rtrim((string) config('services.groq.base_url'), '/').'/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt."\n\nReturn only a JSON object that exactly matches this schema. Do not add properties or markdown.\n".json_encode($outputSchema, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)],
                        ['role' => 'user', 'content' => 'Connector input: '.json_encode($input, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)],
                    ],
                    'response_format' => ['type' => 'json_object'],
                ]);
        } catch (ConnectionException) {
            throw new ProviderException('Groq did not respond before the request timed out.', 'PROVIDER_TIMEOUT', 504);
        }

        if (! $response->successful()) {
            throw new ProviderException(
                $response->status() === 429 ? 'Groq is temporarily rate limited.' : 'Groq could not process this request.',
                $response->status() === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_ERROR',
                $response->status() === 429 ? 503 : 502,
            );
        }

        $json = $response->json();
        $content = data_get($json, 'choices.0.message.content');

        if (! is_string($content) || $content === '') {
            throw new ProviderException('Groq returned an incomplete response.', 'INVALID_PROVIDER_RESPONSE');
        }

        $usage = data_get($json, 'usage', []);

        return new ProviderResult(
            $content,
            data_get($usage, 'prompt_tokens'),
            data_get($usage, 'completion_tokens'),
            data_get($usage, 'total_tokens'),
        );
    }
}
