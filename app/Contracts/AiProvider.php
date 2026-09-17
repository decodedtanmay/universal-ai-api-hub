<?php

namespace App\Contracts;

use App\Data\ProviderResult;
use Illuminate\Http\UploadedFile;

interface AiProvider
{
    public function name(): string;

    /**
     * @param array<string, mixed> $input
     * @param array<string, mixed> $outputSchema
     * @param array<string, UploadedFile> $files
     */
    public function generate(
        string $model,
        string $systemPrompt,
        array $input,
        array $outputSchema,
        array $files = [],
    ): ProviderResult;
}
