<?php

namespace App\Services\Providers;

use App\Contracts\AiProvider;
use App\Exceptions\ProviderException;

final class ProviderRegistry
{
    /** @param iterable<AiProvider> $providers */
    public function __construct(private iterable $providers)
    {
    }

    public function for(string $provider): AiProvider
    {
        foreach ($this->providers as $candidate) {
            if ($candidate->name() === $provider) {
                return $candidate;
            }
        }

        throw new ProviderException('The selected AI provider is unavailable.', 'PROVIDER_UNAVAILABLE', 503);
    }
}
