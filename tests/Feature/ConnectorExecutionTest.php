<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Data\ProviderResult;
use App\Models\Connector;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ConnectorExecutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_connector_executes_through_the_shared_pipeline(): void
    {
        $this->app->instance(ProviderRegistry::class, new ProviderRegistry([new class implements AiProvider {
            public function name(): string { return 'groq'; }
            public function generate(string $model, string $systemPrompt, array $input, array $outputSchema, array $files = []): ProviderResult
            {
                return new ProviderResult(json_encode(['title' => 'Laravel guide', 'body' => 'A concise article.']), 12, 8, 20);
            }
        }]));

        $connector = Connector::create([
            'name' => 'Article Writer',
            'slug' => 'article-writer',
            'description' => 'Write an article.',
            'provider' => 'groq',
            'model' => 'test-model',
            'system_prompt' => 'Write a concise article.',
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

        $this->postJson('/api/connectors/'.$connector->slug, ['topic' => 'Laravel'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Laravel guide')
            ->assertJsonPath('meta.usage.total_tokens', 20);

        $this->assertDatabaseHas('execution_logs', [
            'connector_id' => $connector->id,
            'status' => 'succeeded',
            'total_tokens' => 20,
        ]);
    }

    public function test_invalid_input_returns_a_safe_validation_envelope(): void
    {
        $connector = Connector::create([
            'name' => 'Article Writer',
            'slug' => 'article-writer',
            'provider' => 'groq',
            'model' => 'test-model',
            'system_prompt' => 'Write a concise article.',
            'input_schema' => [['name' => 'topic', 'type' => 'text', 'required' => true]],
            'output_schema' => ['type' => 'object', 'properties' => [], 'additionalProperties' => false],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);

        $this->postJson('/api/connectors/'.$connector->slug, [])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'INPUT_VALIDATION_FAILED');

        $this->assertDatabaseHas('execution_logs', [
            'connector_id' => $connector->id,
            'status' => 'failed',
            'error_code' => 'INPUT_VALIDATION_FAILED',
        ]);
    }
}
