<?php

namespace Database\Seeders;

use App\Models\Connector;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Connector::updateOrCreate(['slug' => 'article-writer'], [
            'name' => 'Article Writer',
            'description' => 'Generate a structured article.',
            'provider' => 'groq',
            'model' => 'openai/gpt-oss-20b',
            'system_prompt' => 'Write a concise article using the supplied topic.',
            'input_schema' => [[
                'name' => 'topic',
                'type' => 'text',
                'required' => true,
                'description' => 'Article topic',
            ]],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'title' => ['type' => 'string'],
                    'body' => ['type' => 'string'],
                ],
                'required' => ['title', 'body'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);

        Connector::updateOrCreate(['slug' => 'business-card-scanner'], [
            'name' => 'Business Card Scanner',
            'description' => 'Extract contact details from a business-card image.',
            'provider' => 'gemini',
            'model' => 'gemini-3.6-flash',
            'system_prompt' => 'Read the supplied business card image and extract its contact information. Return each requested field as a string. Preserve the printed spelling where possible. Use an empty string when a requested value is absent.',
            'input_schema' => [[
                'name' => 'card_image',
                'type' => 'image',
                'required' => true,
                'description' => 'Business card image in JPEG, PNG, or WebP format',
            ]],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'name' => ['type' => 'string'],
                    'company' => ['type' => 'string'],
                    'designation' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'website' => ['type' => 'string'],
                ],
                'required' => ['name', 'company', 'designation', 'phone', 'email', 'website'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);
    }
}
