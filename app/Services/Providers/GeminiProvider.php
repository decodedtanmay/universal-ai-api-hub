<?php

namespace App\Services\Providers;

use App\Contracts\AiProvider;
use App\Data\ProviderResult;
use App\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

final class GeminiProvider implements AiProvider
{
    public function name(): string
    {
        return 'gemini';
    }

    public function generate(
        string $model,
        string $systemPrompt,
        array $input,
        array $outputSchema,
        array $files = [],
    ): ProviderResult {
        $key = config('services.gemini.key');

        if (! is_string($key) || $key === '') {
            throw new ProviderException('Gemini is not configured on this server.', 'PROVIDER_NOT_CONFIGURED', 503);
        }

        $parts = [[
            'text' => "Connector input:\n".json_encode($input, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        ]];

        foreach ($files as $file) {
            $parts[] = [
                'inlineData' => [
                    'mimeType' => $file->getMimeType(),
                    'data' => base64_encode((string) file_get_contents($file->getRealPath())),
                ],
            ];
        }

        try {
            $response = Http::acceptJson()
                ->timeout(config('ai-hub.provider_timeout_seconds'))
                ->post(rtrim((string) config('services.gemini.base_url'), '/').'/models/'.$model.':generateContent?key='.urlencode($key), [
                    'systemInstruction' => ['parts' => [['text' => $systemPrompt]],],
                    'contents' => [['role' => 'user', 'parts' => $parts]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseJsonSchema' => $outputSchema,
                    ],
                ]);
        } catch (ConnectionException) {
            throw new ProviderException('Gemini did not respond before the request timed out.', 'PROVIDER_TIMEOUT', 504);
        }

        if (! $response->successful()) {
            throw new ProviderException(
                $response->status() === 429 ? 'Gemini is temporarily rate limited.' : 'Gemini could not process this request.',
                $response->status() === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_ERROR',
                $response->status() === 429 ? 503 : 502,
            );
        }

        $json = $response->json();
        $content = data_get($json, 'candidates.0.content.parts.0.text');

        if (! is_string($content) || $content === '') {
            throw new ProviderException('Gemini returned an incomplete response.', 'INVALID_PROVIDER_RESPONSE');
        }

        $usage = data_get($json, 'usageMetadata', []);

        return new ProviderResult(
            $content,
            data_get($usage, 'promptTokenCount'),
            data_get($usage, 'candidatesTokenCount'),
            data_get($usage, 'totalTokenCount'),
        );
    }
}
