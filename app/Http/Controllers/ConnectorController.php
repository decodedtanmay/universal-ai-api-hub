<?php

namespace App\Http\Controllers;

use App\Models\Connector;
use App\Services\ConnectorPayload;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConnectorController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Connectors/Index', [
            'connectors' => Connector::query()
                ->withCount('executionLogs')
                ->withMax('executionLogs', 'created_at')
                ->latest()
                ->get()
                ->map(fn (Connector $connector) => $this->summary($connector)),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Connectors/Form', [
            'connector' => null,
            'providers' => $this->providers(),
        ]);
    }

    public function store(Request $request, ConnectorPayload $payload)
    {
        $connector = Connector::create($payload->from($request));

        return to_route('connectors.show', $connector)->with('success', 'Connector created.');
    }

    public function show(Connector $connector): Response
    {
        $logs = $connector->executionLogs()->latest()->get();
        $stats = [
            'total' => $logs->count(),
            'successful' => $logs->where('status', 'succeeded')->count(),
            'failed' => $logs->where('status', 'failed')->count(),
            'last_used_at' => $logs->max('created_at')?->toIso8601String(),
            'average_duration_ms' => (int) round($logs->whereNotNull('duration_ms')->avg('duration_ms') ?? 0),
            'input_tokens' => (int) $logs->sum('input_tokens'),
            'output_tokens' => (int) $logs->sum('output_tokens'),
            'total_tokens' => (int) $logs->sum('total_tokens'),
            'usage_reported_runs' => $logs->whereNotNull('total_tokens')->count(),
        ];

        return Inertia::render('Connectors/Show', [
            'connector' => $this->summary($connector),
            'stats' => $stats,
            'recentLogs' => $logs->take(12)->map(fn ($log) => [
                'id' => $log->id,
                'source' => $log->source,
                'status' => $log->status,
                'duration_ms' => $log->duration_ms,
                'total_tokens' => $log->total_tokens,
                'error_code' => $log->error_code,
                'created_at' => $log->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function edit(Connector $connector): Response
    {
        return Inertia::render('Connectors/Form', [
            'connector' => $connector,
            'providers' => $this->providers(),
        ]);
    }

    public function update(Request $request, Connector $connector, ConnectorPayload $payload)
    {
        $connector->update($payload->from($request, $connector));

        return to_route('connectors.show', $connector)->with('success', 'Connector updated.');
    }

    public function destroy(Connector $connector)
    {
        $connector->delete();

        return to_route('connectors.index')->with('success', 'Connector deleted.');
    }

    /** @return array<int, array<string, mixed>> */
    private function providers(): array
    {
        return collect(config('ai-hub.providers'))
            ->map(fn (array $provider, string $id) => ['id' => $id, ...$provider])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function summary(Connector $connector): array
    {
        return [
            'id' => $connector->id,
            'name' => $connector->name,
            'slug' => $connector->slug,
            'description' => $connector->description,
            'provider' => $connector->provider,
            'model' => $connector->model,
            'system_prompt' => $connector->system_prompt,
            'input_schema' => $connector->input_schema,
            'output_schema' => $connector->output_schema,
            'auth_mode' => $connector->auth_mode,
            'status' => $connector->status,
            'endpoint' => url('/api/connectors/'.$connector->slug),
            'request_count' => $connector->execution_logs_count ?? $connector->executionLogs()->count(),
            'last_used_at' => $connector->execution_logs_max_created_at ?? $connector->executionLogs()->max('created_at'),
            'created_at' => $connector->created_at?->toIso8601String(),
            'updated_at' => $connector->updated_at?->toIso8601String(),
        ];
    }
}
