<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConnectorController;
use App\Http\Controllers\ConnectorDocumentationController;
use App\Http\Controllers\ConnectorExecutionController;

Route::redirect('/', '/connectors');
Route::get('/health', static fn () => response()->json(['status' => 'ok']));
Route::resource('connectors', ConnectorController::class);
Route::get('connectors/{connector}/docs', [ConnectorDocumentationController::class, 'show'])->name('connectors.docs');
Route::post('connectors/{connector}/test', [ConnectorExecutionController::class, 'test'])->name('connectors.test');
