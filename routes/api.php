<?php

use App\Http\Controllers\ConnectorExecutionController;
use Illuminate\Support\Facades\Route;

Route::post('/connectors/{connector:slug}', ConnectorExecutionController::class)
    ->middleware(['throttle:ai-hub', 'connector.key'])
    ->name('connectors.execute');
