<?php

namespace App\Models;

use Database\Factories\ConnectorApiKeyFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * An API key that authorises calls to a single connector.
 *
 * Only a SHA-256 hash of the key is stored; the plaintext exists only in the response that creates it.
 */
class ConnectorApiKey extends Model
{
    /** @use HasFactory<ConnectorApiKeyFactory> */
    use HasFactory;

    public const PREFIX = 'uah_';

    protected $fillable = ['connector_id', 'name', 'prefix', 'key_hash', 'last_used_at', 'revoked_at'];

    protected $hidden = ['key_hash'];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /**
     * Create a key for the connector and return it together with its one-time plaintext.
     *
     * @return array{key: self, plaintext: string}
     */
    public static function issue(Connector $connector, string $name): array
    {
        $plaintext = self::PREFIX.Str::random(40);

        $key = $connector->apiKeys()->create([
            'name' => $name,
            'prefix' => substr($plaintext, 0, 12),
            'key_hash' => self::hash($plaintext),
        ]);

        return ['key' => $key, 'plaintext' => $plaintext];
    }

    public static function hash(string $plaintext): string
    {
        return hash('sha256', $plaintext);
    }

    public static function findActiveFor(Connector $connector, string $plaintext): ?self
    {
        return $connector->apiKeys()->active()->where('key_hash', self::hash($plaintext))->first();
    }

    public function connector(): BelongsTo
    {
        return $this->belongsTo(Connector::class);
    }

    /** @param Builder<self> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('revoked_at');
    }
}
