<?php

namespace Database\Factories;

use App\Models\ConnectorApiKey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ConnectorApiKey>
 */
class ConnectorApiKeyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $plaintext = ConnectorApiKey::PREFIX.Str::random(40);

        return [
            'name' => fake()->words(2, true),
            'prefix' => substr($plaintext, 0, 12),
            'key_hash' => ConnectorApiKey::hash($plaintext),
        ];
    }

    public function revoked(): static
    {
        return $this->state(fn () => ['revoked_at' => now()]);
    }
}
