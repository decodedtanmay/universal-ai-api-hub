<?php

namespace App\Http\Middleware;

use App\Models\Connector;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureConnectorApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Connector $connector */
        $connector = $request->route('connector');

        if ($connector->auth_mode === 'none') {
            return $next($request);
        }

        $expected = config('ai-hub.api_key');

        if (! is_string($expected) || $expected === '') {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => ['code' => 'API_AUTH_NOT_CONFIGURED', 'message' => 'Endpoint authentication is not configured.'],
            ], 503);
        }

        $provided = $request->bearerToken() ?: $request->header('X-API-Key');

        if (! is_string($provided) || ! hash_equals($expected, $provided)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'error' => ['code' => 'UNAUTHORIZED', 'message' => 'A valid API key is required.'],
            ], 401);
        }

        return $next($request);
    }
}
