<?php

namespace App\Http\Controllers;

use App\Models\Connector;
use App\Models\ConnectorApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ConnectorApiKeyController extends Controller
{
    public const MAX_ACTIVE_KEYS = 10;

    /**
     * Issue a key. The plaintext is returned in this response only and is never stored.
     */
    public function store(Request $request, Connector $connector): JsonResponse
    {
        $validated = $request->validate(['name' => ['required', 'string', 'max:60']]);

        if ($connector->apiKeys()->active()->count() >= self::MAX_ACTIVE_KEYS) {
            throw ValidationException::withMessages(['name' => 'A connector can have at most '.self::MAX_ACTIVE_KEYS.' active keys. Revoke one first.']);
        }

        ['key' => $key, 'plaintext' => $plaintext] = ConnectorApiKey::issue($connector, $validated['name']);

        return response()->json([
            'key' => self::present($key),
            'plaintext' => $plaintext,
        ], 201, ['Cache-Control' => 'no-store']);
    }

    public function destroy(Connector $connector, ConnectorApiKey $apiKey): RedirectResponse
    {
        if ($apiKey->revoked_at === null) {
            $apiKey->forceFill(['revoked_at' => now()])->save();
        }

        return back()->with('success', "Key \"{$apiKey->name}\" revoked. Requests using it are now rejected.");
    }

    /** @return array<string, mixed> */
    public static function present(ConnectorApiKey $key): array
    {
        return [
            'id' => $key->id,
            'name' => $key->name,
            'prefix' => $key->prefix,
            'last_used_at' => $key->last_used_at?->toIso8601String(),
            'created_at' => $key->created_at?->toIso8601String(),
        ];
    }
}
