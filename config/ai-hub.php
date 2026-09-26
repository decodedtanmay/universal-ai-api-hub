<?php

return [
    'provider_timeout_seconds' => (int) env('AI_PROVIDER_TIMEOUT_SECONDS', 40),
    'max_upload_kilobytes' => (int) env('AI_HUB_MAX_UPLOAD_KB', 4096),
    'max_text_characters' => (int) env('AI_HUB_MAX_TEXT_CHARS', 20000),
    'rate_limit_per_minute' => (int) env('AI_HUB_RATE_LIMIT_PER_MINUTE', 20),
    'connector_rate_limit_per_minute' => (int) env('AI_HUB_CONNECTOR_RATE_LIMIT_PER_MINUTE', 120),
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
