<?php

return [
    'api_key' => env('HUB_API_KEY'),
    'provider_timeout_seconds' => (int) env('AI_PROVIDER_TIMEOUT_SECONDS', 40),
    'max_upload_kilobytes' => (int) env('AI_HUB_MAX_UPLOAD_KB', 4096),
    'providers' => [
        'gemini' => [
            'label' => 'Google Gemini',
            'models' => ['gemini-3.6-flash'],
            'supports_images' => true,
        ],
        'groq' => [
            'label' => 'Groq',
            'models' => ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b'],
            'supports_images' => false,
        ],
    ],
];
