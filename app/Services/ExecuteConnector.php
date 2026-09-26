<?php

namespace App\Services;

use App\Data\ExecutionOutcome;
use App\Exceptions\ProviderException;
use App\Models\Connector;
use App\Models\ExecutionLog;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class ExecuteConnector
{
    public function __construct(
        private ConnectorConfiguration $configuration,
        private ProviderRegistry $providers,
        private OutputSchemaValidator $outputValidator,
    ) {}

    public function run(Connector $connector, Request $request, string $source): ExecutionOutcome
    {
        if ($connector->status !== 'active') {
            throw new ProviderException('This connector is not active.', 'CONNECTOR_NOT_ACTIVE', 403);
        }

        $log = ExecutionLog::create([
            'connector_id' => $connector->id,
            'api_key_id' => $request->attributes->get('connector_api_key')?->id,
            'source' => $source,
            'status' => 'running',
            'provider' => $connector->provider,
            'model' => $connector->model,
        ]);
        $startedAt = hrtime(true);

        try {
            $normalized = $this->configuration->normalizeInput(
                $connector->input_schema,
                $this->payload($request),
                $request->allFiles(),
            );
            $result = $this->providers->for($connector->provider)->generate(
                $connector->model,
                $connector->system_prompt,
                $normalized['input'],
                $connector->output_schema,
                $normalized['files'],
            );
            $data = $this->outputValidator->decodeAndValidate($result->content, $connector->output_schema);
            $duration = $this->duration($startedAt);

            $log->update([
                'status' => 'succeeded',
                'duration_ms' => $duration,
                'input_tokens' => $result->inputTokens,
                'output_tokens' => $result->outputTokens,
                'total_tokens' => $result->totalTokens,
            ]);

            return new ExecutionOutcome($data, $duration, $result->inputTokens, $result->outputTokens, $result->totalTokens);
        } catch (ValidationException $exception) {
            $this->fail($log, $startedAt, 'INPUT_VALIDATION_FAILED', 'One or more inputs are invalid.');
            throw $exception;
        } catch (ProviderException $exception) {
            $this->fail($log, $startedAt, $exception->errorCode, $exception->getMessage());
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);
            $this->fail($log, $startedAt, 'INTERNAL_ERROR', 'The connector could not complete this request.');
            throw new ProviderException('The connector could not complete this request.', 'INTERNAL_ERROR', 500);
        }
    }

    /**
     * Read only the request body, so unrelated query-string parameters (tracking tags, cache busters)
     * are never mistaken for connector inputs.
     *
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        return $request->isJson() ? $request->json()->all() : $request->request->all();
    }

    private function fail(ExecutionLog $log, int $startedAt, string $code, string $message): void
    {
        $log->update([
            'status' => 'failed',
            'duration_ms' => $this->duration($startedAt),
            'error_code' => $code,
            'error_message' => str($message)->limit(500, '')->toString(),
        ]);
    }

    private function duration(int $startedAt): int
    {
        return (int) round((hrtime(true) - $startedAt) / 1_000_000);
    }
}
