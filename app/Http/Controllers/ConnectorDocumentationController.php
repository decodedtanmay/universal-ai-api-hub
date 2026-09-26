<?php

namespace App\Http\Controllers;

use App\Models\Connector;
use Inertia\Inertia;
use Inertia\Response;

class ConnectorDocumentationController extends Controller
{
    public function show(Connector $connector): Response
    {
        return Inertia::render('Connectors/Documentation', [
            'connector' => [
                'id' => $connector->id,
                'name' => $connector->name,
                'slug' => $connector->slug,
                'description' => $connector->description,
                'provider' => $connector->provider,
                'model' => $connector->model,
                'input_schema' => $connector->input_schema,
                'output_schema' => $connector->output_schema,
                'auth_mode' => $connector->auth_mode,
                'endpoint' => url('/api/connectors/'.$connector->slug),
            ],
            'limits' => [
                'max_upload_kb' => (int) config('ai-hub.max_upload_kilobytes'),
                'max_text_characters' => (int) config('ai-hub.max_text_characters'),
                'rate_limit_per_minute' => (int) config('ai-hub.rate_limit_per_minute'),
            ],
        ]);
    }
}
