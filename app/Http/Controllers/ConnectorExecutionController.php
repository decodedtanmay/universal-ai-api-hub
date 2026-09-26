<?php

namespace App\Http\Controllers;

use App\Data\ExecutionOutcome;
use App\Exceptions\ProviderException;
use App\Models\Connector;
use App\Services\ExecuteConnector;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ConnectorExecutionController extends Controller
{
    public function __invoke(Request $request, Connector $connector, ExecuteConnector $executor)
    {
        return $this->execute($request, $connector, $executor, 'api');
    }

    public function test(Request $request, Connector $connector, ExecuteConnector $executor)
    {
        return $this->execute($request, $connector, $executor, 'playground');
    }

    private function execute(Request $request, Connector $connector, ExecuteConnector $executor, string $source)
    {
        try {
            $this->ensureJsonBodyIsWellFormed($request);
            $outcome = $executor->run($connector, $request, $source);

            return response()->json($this->success($connector, $outcome));
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INPUT_VALIDATION_FAILED',
                    'message' => 'One or more inputs are invalid.',
                    'fields' => $exception->errors(),
                ],
            ], 422);
        } catch (ProviderException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => ['code' => $exception->errorCode, 'message' => $exception->getMessage()],
            ], $exception->statusCode);
        }
    }

    private function ensureJsonBodyIsWellFormed(Request $request): void
    {
        $body = $request->getContent();

        if ($request->isJson() && $body !== '' && json_decode($body) === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new ProviderException('The request body is not valid JSON.', 'INVALID_JSON', 400);
        }
    }

    /** @return array<string, mixed> */
    private function success(Connector $connector, ExecutionOutcome $outcome): array
    {
        return [
            'success' => true,
            'data' => $outcome->data,
            'error' => null,
            'meta' => [
                'provider' => $connector->provider,
                'model' => $connector->model,
                'duration_ms' => $outcome->durationMs,
                'usage' => [
                    'input_tokens' => $outcome->inputTokens,
                    'output_tokens' => $outcome->outputTokens,
                    'total_tokens' => $outcome->totalTokens,
                ],
            ],
        ];
    }
}
