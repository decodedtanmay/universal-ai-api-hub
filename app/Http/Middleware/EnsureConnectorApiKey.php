<?php

namespace App\Http\Middleware;

use App\Models\Connector;
use App\Models\ConnectorApiKey;
use App\Models\ExecutionLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authorise calls to connectors that require an API key.
 *
 * Keys are scoped to one connector, so a key issued for one endpoint cannot call another.
 */
final class EnsureConnectorApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Connector $connector */
        $connector = $request->route('connector');

        if ($connector->auth_mode === 'none') {
            return $next($request);
        }

        $provided = $request->bearerToken() ?: $request->header('X-API-Key');

        if (! is_string($provided) || $provided === '') {
            return $this->reject($connector, 'A valid API key is required. Send it as "Authorization: Bearer <key>" or "X-API-Key: <key>".');
        }

        $key = ConnectorApiKey::findActiveFor($connector, $provided);

        if ($key === null) {
            return $this->reject($connector, 'The API key is invalid, revoked, or belongs to a different connector.');
        }

        $key->forceFill(['last_used_at' => now()])->saveQuietly();
        $request->attributes->set('connector_api_key', $key);

        return $next($request);
    }

    private function reject(Connector $connector, string $message): Response
    {
        rescue(fn () => ExecutionLog::create([
            'connector_id' => $connector->id,
            'source' => 'api',
            'status' => 'failed',
            'provider' => $connector->provider,
            'model' => $connector->model,
            'duration_ms' => 0,
            'error_code' => 'UNAUTHORIZED',
            'error_message' => $message,
        ]));

        return response()->json([
            'success' => false,
            'data' => null,
            'error' => ['code' => 'UNAUTHORIZED', 'message' => $message],
        ], 401, ['WWW-Authenticate' => 'Bearer']);
    }
}
