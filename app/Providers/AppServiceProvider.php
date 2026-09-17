<?php

namespace App\Providers;

use App\Contracts\AiProvider;
use App\Services\ConnectorConfiguration;
use App\Services\ConnectorPayload;
use App\Services\OutputSchemaValidator;
use App\Services\Providers\GeminiProvider;
use App\Services\Providers\GroqProvider;
use App\Services\Providers\ProviderRegistry;
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
    }
}
