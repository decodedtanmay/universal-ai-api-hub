<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Data\ProviderResult;
use App\Models\Connector;
use App\Models\ConnectorApiKey;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectorApiKeyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance(ProviderRegistry::class, new ProviderRegistry([new class implements AiProvider
        {
            public function name(): string
            {
                return 'groq';
            }

            public function generate(string $model, string $systemPrompt, array $input, array $outputSchema, array $files = []): ProviderResult
            {
                return new ProviderResult(json_encode(['rewritten' => 'Done.']), 1, 1, 2);
            }
        }]));
    }

    private function connector(string $slug = 'rewriter', string $authMode = 'api_key'): Connector
    {
        return Connector::create([
            'name' => 'Rewriter',
            'slug' => $slug,
            'provider' => 'groq',
            'model' => 'test-model',
            'system_prompt' => 'Rewrite.',
            'input_schema' => [['name' => 'text', 'type' => 'text', 'required' => true]],
            'output_schema' => ['type' => 'object', 'properties' => ['rewritten' => ['type' => 'string']], 'required' => ['rewritten']],
            'auth_mode' => $authMode,
            'status' => 'active',
        ]);
    }

    public function test_issuing_a_key_returns_the_plaintext_once_and_stores_only_a_hash(): void
    {
        $connector = $this->connector();

        $response = $this->postJson(route('connectors.keys.store', $connector), ['name' => 'Production'])
            ->assertCreated()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('key.name', 'Production')
            ->assertJsonMissingPath('key.key_hash');

        $plaintext = $response->json('plaintext');

        $this->assertStringStartsWith('uah_', $plaintext);
        $this->assertSame(44, strlen($plaintext));
        $this->assertDatabaseMissing('connector_api_keys', ['key_hash' => $plaintext]);
        $this->assertDatabaseHas('connector_api_keys', [
            'connector_id' => $connector->id,
            'prefix' => substr($plaintext, 0, 12),
            'key_hash' => hash('sha256', $plaintext),
        ]);
        $this->get(route('connectors.show', $connector))->assertDontSee($plaintext);
    }

    public function test_a_connector_requiring_a_key_rejects_calls_without_one_and_logs_the_attempt(): void
    {
        $connector = $this->connector();

        $this->postJson('/api/connectors/rewriter', ['text' => 'hi'])
            ->assertUnauthorized()
            ->assertHeader('WWW-Authenticate', 'Bearer')
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'UNAUTHORIZED');

        $this->assertDatabaseHas('execution_logs', [
            'connector_id' => $connector->id,
            'status' => 'failed',
            'error_code' => 'UNAUTHORIZED',
        ]);
    }

    public function test_a_valid_key_is_accepted_as_bearer_token_or_header_and_attributed_in_logs(): void
    {
        $connector = $this->connector();
        ['key' => $key, 'plaintext' => $plaintext] = ConnectorApiKey::issue($connector, 'CI');

        $this->withToken($plaintext)->postJson('/api/connectors/rewriter', ['text' => 'hi'])
            ->assertOk()
            ->assertJsonPath('data.rewritten', 'Done.');

        $this->withHeader('X-API-Key', $plaintext)->postJson('/api/connectors/rewriter', ['text' => 'hi'])->assertOk();

        $this->assertNotNull($key->fresh()->last_used_at);
        $this->assertDatabaseHas('execution_logs', [
            'connector_id' => $connector->id,
            'api_key_id' => $key->id,
            'status' => 'succeeded',
        ]);
    }

    public function test_a_key_only_works_for_the_connector_it_was_issued_for(): void
    {
        $this->connector('rewriter');
        $other = $this->connector('other-rewriter');
        ['plaintext' => $plaintext] = ConnectorApiKey::issue($other, 'Other');

        $this->withToken($plaintext)->postJson('/api/connectors/rewriter', ['text' => 'hi'])
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_revoked_keys_are_rejected(): void
    {
        $connector = $this->connector();
        ['key' => $key, 'plaintext' => $plaintext] = ConnectorApiKey::issue($connector, 'Old');

        $this->delete(route('connectors.keys.destroy', [$connector, $key]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertNotNull($key->fresh()->revoked_at);
        $this->withToken($plaintext)->postJson('/api/connectors/rewriter', ['text' => 'hi'])->assertUnauthorized();
    }

    public function test_a_key_cannot_be_revoked_through_another_connector(): void
    {
        $connector = $this->connector('rewriter');
        $other = $this->connector('other-rewriter');
        ['key' => $key] = ConnectorApiKey::issue($other, 'Other');

        $this->delete(route('connectors.keys.destroy', [$connector, $key]))->assertNotFound();
        $this->assertNull($key->fresh()->revoked_at);
    }

    public function test_the_number_of_active_keys_is_capped(): void
    {
        $connector = $this->connector();
        ConnectorApiKey::factory()->count(10)->for($connector)->create();
        ConnectorApiKey::factory()->revoked()->for($connector)->create();

        $this->postJson(route('connectors.keys.store', $connector), ['name' => 'Eleventh'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_public_connectors_ignore_keys_entirely(): void
    {
        $this->connector('public-rewriter', 'none');

        $this->postJson('/api/connectors/public-rewriter', ['text' => 'hi'])->assertOk();
        $this->withToken('uah_not-a-real-key')->postJson('/api/connectors/public-rewriter', ['text' => 'hi'])->assertOk();
    }
}
