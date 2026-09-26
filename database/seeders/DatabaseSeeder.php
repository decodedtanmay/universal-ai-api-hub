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
                'example' => 'Why dark mode reduces eye strain',
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

        Connector::updateOrCreate(['slug' => 'content-rewriter'], [
            'name' => 'Content Rewriter',
            'description' => 'Rewrite text to follow custom instructions. Requires an API key.',
            'provider' => 'groq',
            'model' => 'openai/gpt-oss-20b',
            'system_prompt' => 'You are an expert editor. Rewrite the supplied text following the supplied instructions. Keep the original meaning unless told otherwise. List the main changes you made.',
            'input_schema' => [
                ['name' => 'text', 'type' => 'text', 'required' => true, 'description' => 'The text to rewrite', 'example' => 'our product is really good and lots of people like it a lot, you should buy it'],
                ['name' => 'instructions', 'type' => 'text', 'required' => true, 'description' => 'How to rewrite it', 'example' => 'Make it concise and professional'],
            ],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'rewritten' => ['type' => 'string'],
                    'changes' => ['type' => 'array', 'items' => ['type' => 'string']],
                ],
                'required' => ['rewritten', 'changes'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'api_key',
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
                'example' => '/samples/business-card.png',
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
