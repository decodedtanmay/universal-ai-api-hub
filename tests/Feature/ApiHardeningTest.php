<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Data\ProviderResult;
use App\Models\Connector;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiHardeningTest extends TestCase
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
                return new ProviderResult(json_encode(['title' => 'Echo', 'body' => json_encode($input)]), 1, 1, 2);
            }
        }]));
    }

    private function connector(): Connector
    {
        return Connector::create([
            'name' => 'Article Writer',
            'slug' => 'article-writer',
            'provider' => 'groq',
            'model' => 'test-model',
            'system_prompt' => 'Write.',
            'input_schema' => [['name' => 'topic', 'type' => 'text', 'required' => true]],
            'output_schema' => [
                'type' => 'object',
                'properties' => ['title' => ['type' => 'string'], 'body' => ['type' => 'string']],
                'required' => ['title', 'body'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);
    }

    public function test_unknown_connector_returns_the_standard_envelope_without_internals(): void
    {
        $this->postJson('/api/connectors/does-not-exist')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'CONNECTOR_NOT_FOUND')
            ->assertJsonMissing(['message' => 'No query results for model [App\\Models\\Connector] does-not-exist']);
    }

    public function test_unknown_api_route_returns_the_standard_envelope(): void
    {
        $this->getJson('/api/nothing-here')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_get_on_an_endpoint_explains_that_post_is_required(): void
    {
        $this->connector();

        $this->getJson('/api/connectors/article-writer')
            ->assertStatus(405)
            ->assertHeader('Allow', 'POST')
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'METHOD_NOT_ALLOWED');
    }

    public function test_malformed_json_is_reported_as_invalid_json_not_a_missing_field(): void
    {
        $this->connector();

        $this->call('POST', '/api/connectors/article-writer', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], '{topic:')
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'INVALID_JSON');
    }

    public function test_query_string_parameters_are_not_treated_as_inputs(): void
    {
        $this->connector();

        $this->postJson('/api/connectors/article-writer?utm_source=newsletter&cache=1', ['topic' => 'Laravel'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_form_encoded_requests_still_work(): void
    {
        $this->connector();

        $this->post('/api/connectors/article-writer', ['topic' => 'Laravel'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_text_longer_than_the_configured_limit_is_rejected(): void
    {
        config(['ai-hub.max_text_characters' => 50]);
        $this->connector();

        $this->postJson('/api/connectors/article-writer', ['topic' => str_repeat('a', 51)])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'INPUT_VALIDATION_FAILED')
            ->assertJsonPath('error.fields.topic.0', 'This field is too long. The maximum is 50 characters.');

        $this->postJson('/api/connectors/article-writer', ['topic' => str_repeat('a', 50)])->assertOk();
    }

    public function test_clients_are_rate_limited_with_a_structured_error_and_headers(): void
    {
        config(['ai-hub.rate_limit_per_minute' => 2]);
        $this->connector();

        $this->postJson('/api/connectors/article-writer', ['topic' => 'one'])
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit');
        $this->postJson('/api/connectors/article-writer', ['topic' => 'two'])->assertOk();

        $this->postJson('/api/connectors/article-writer', ['topic' => 'three'])
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'RATE_LIMITED')
            ->assertJsonStructure(['error' => ['code', 'message', 'retry_after_seconds']]);
    }

    public function test_the_playground_route_is_rate_limited_too(): void
    {
        config(['ai-hub.rate_limit_per_minute' => 1]);
        $connector = $this->connector();

        $this->postJson(route('connectors.test', $connector), ['topic' => 'one'])->assertOk();
        $this->postJson(route('connectors.test', $connector), ['topic' => 'two'])
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'RATE_LIMITED');
    }

    public function test_input_field_examples_are_saved_with_the_connector(): void
    {
        $this->post(route('connectors.store'), [
            'name' => 'Rewriter',
            'slug' => 'rewriter',
            'provider' => 'groq',
            'model' => 'openai/gpt-oss-20b',
            'system_prompt' => 'Rewrite.',
            'input_schema' => [['name' => 'text', 'type' => 'text', 'required' => true, 'example' => 'Make this shorter']],
            'output_schema' => ['type' => 'object', 'properties' => ['rewritten' => ['type' => 'string']]],
            'auth_mode' => 'none',
            'status' => 'active',
        ])->assertRedirect();

        $this->assertSame('Make this shorter', Connector::where('slug', 'rewriter')->first()->input_schema[0]['example']);
    }
}
