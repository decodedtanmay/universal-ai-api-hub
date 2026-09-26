<?php

use App\Http\Middleware\EnsureConnectorApiKey;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [HandleInertiaRequests::class]);
        $middleware->alias(['connector.key' => EnsureConnectorApiKey::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $envelope = fn (string $code, string $message, int $status, array $headers = [], array $extra = []) => response()->json([
            'success' => false,
            'data' => null,
            'error' => ['code' => $code, 'message' => $message, ...$extra],
        ], $status, $headers);

        $exceptions->renderable(function (NotFoundHttpException $exception, Request $request) use ($envelope) {
            if (! $request->is('api/*')) {
                return null;
            }

            return $exception->getPrevious() instanceof ModelNotFoundException
                ? $envelope('CONNECTOR_NOT_FOUND', 'Connector not found. Check the slug in the endpoint URL.', 404)
                : $envelope('NOT_FOUND', 'No such API route.', 404);
        });
        $exceptions->renderable(function (MethodNotAllowedHttpException $exception, Request $request) use ($envelope) {
            if (! $request->is('api/*')) {
                return null;
            }

            return $envelope('METHOD_NOT_ALLOWED', 'This endpoint only accepts POST requests. See the connector documentation for the request format.', 405, ['Allow' => 'POST']);
        });
        $exceptions->renderable(function (ThrottleRequestsException $exception, Request $request) use ($envelope) {
            $headers = $exception->getHeaders();
            $retryAfter = isset($headers['Retry-After']) ? (int) $headers['Retry-After'] : null;

            return $envelope('RATE_LIMITED', 'Too many requests. Please retry shortly.', 429, $headers, ['retry_after_seconds' => $retryAfter]);
        });
    })->create();
