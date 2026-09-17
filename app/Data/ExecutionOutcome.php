<?php

namespace App\Data;

final readonly class ExecutionOutcome
{
    /** @param array<string, mixed> $data */
    public function __construct(
        public array $data,
        public int $durationMs,
        public ?int $inputTokens,
        public ?int $outputTokens,
        public ?int $totalTokens,
    ) {
    }
}
