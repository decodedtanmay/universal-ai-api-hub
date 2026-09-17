<?php

namespace App\Data;

final readonly class ProviderResult
{
    public function __construct(
        public string $content,
        public ?int $inputTokens = null,
        public ?int $outputTokens = null,
        public ?int $totalTokens = null,
    ) {
    }
}
