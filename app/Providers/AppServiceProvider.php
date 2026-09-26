<?php

namespace App\Providers;

use App\Services\ConnectorConfiguration;
use App\Services\ConnectorPayload;
use App\Services\OutputSchemaValidator;
use App\Services\Providers\GeminiProvider;
use App\Services\Providers\GroqProvider;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GeminiProvider::class);
        $this->app->singleton(GroqProvider::class);
        $this->app->singleton(ProviderRegistry::class, fn () => new ProviderRegistry([
            $this->app->make(GeminiProvider::class),
            $this->app->make(GroqProvider::class),
        ]));
        $this->app->singleton(ConnectorConfiguration::class);
        $this->app->singleton(OutputSchemaValidator::class);
        $this->app->singleton(ConnectorPayload::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('ai-hub', fn (Request $request) => [
            Limit::perMinute((int) config('ai-hub.rate_limit_per_minute'))->by('ip:'.$request->ip()),
            Limit::perMinute((int) config('ai-hub.connector_rate_limit_per_minute'))
                ->by('connector:'.($request->route('connector') instanceof Model ? $request->route('connector')->getKey() : $request->route('connector'))),
        ]);
    }
}
