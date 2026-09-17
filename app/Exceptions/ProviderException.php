<?php

namespace App\Exceptions;

use RuntimeException;

final class ProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $statusCode = 502,
    ) {
        parent::__construct($message);
    }
}
