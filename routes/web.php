<?php

use App\Http\Controllers\ConnectorApiKeyController;
use App\Http\Controllers\ConnectorController;
use App\Http\Controllers\ConnectorDocumentationController;
use App\Http\Controllers\ConnectorExecutionController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/connectors');
Route::get('/health', static fn () => response()->json(['status' => 'ok']));
Route::resource('connectors', ConnectorController::class);
Route::get('connectors/{connector}/docs', [ConnectorDocumentationController::class, 'show'])->name('connectors.docs');
Route::post('connectors/{connector}/test', [ConnectorExecutionController::class, 'test'])->middleware('throttle:ai-hub')->name('connectors.test');
Route::post('connectors/{connector}/keys', [ConnectorApiKeyController::class, 'store'])->middleware('throttle:ai-hub')->name('connectors.keys.store');
Route::delete('connectors/{connector}/keys/{apiKey}', [ConnectorApiKeyController::class, 'destroy'])->scopeBindings()->name('connectors.keys.destroy');
