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

        Connector::updateOrCreate(['slug' => 'invoice-scanner'], [
            'name' => 'Invoice Scanner',
            'description' => 'Extract vendor, totals and dates from an invoice image.',
            'provider' => 'gemini',
            'model' => 'gemini-3.6-flash',
            'system_prompt' => 'You are an invoice extraction system. Read the supplied invoice image and extract the vendor name, invoice number, invoice date, due date, currency, subtotal, tax and total. Amounts must be numbers without thousands separators. Use an empty string for missing text values and 0 for missing amounts. Return only valid JSON matching the configured output structure.',
            'input_schema' => [[
                'name' => 'invoice_image',
                'type' => 'image',
                'required' => true,
                'description' => 'Invoice photo or scan (JPEG, PNG or WebP)',
                'example' => '/samples/invoice.png',
            ]],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'vendor' => ['type' => 'string'],
                    'invoice_number' => ['type' => 'string'],
                    'invoice_date' => ['type' => 'string'],
                    'due_date' => ['type' => 'string'],
                    'currency' => ['type' => 'string'],
                    'subtotal' => ['type' => 'number'],
                    'tax' => ['type' => 'number'],
                    'total' => ['type' => 'number'],
                ],
                'required' => ['vendor', 'invoice_number', 'invoice_date', 'due_date', 'currency', 'subtotal', 'tax', 'total'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);

        Connector::updateOrCreate(['slug' => 'support-ticket-classifier'], [
            'name' => 'Support Ticket Classifier',
            'description' => 'Analyze customer support tickets for category, priority, sentiment, and recommended action.',
            'provider' => 'groq',
            'model' => 'openai/gpt-oss-20b',
            'system_prompt' => 'You are a customer operations AI. Analyze the support ticket and classify the category, urgency (low, medium, high, critical), sentiment (positive, neutral, negative), key issues identified, and draft a polite, actionable response.',
            'input_schema' => [
                [
                    'name' => 'ticket_text',
                    'type' => 'text',
                    'required' => true,
                    'description' => 'Customer message or ticket description',
                    'example' => 'I was charged twice for my subscription this morning ($49 x 2). Please refund the extra charge immediately as my bank account is in overdraft.',
                ],
                [
                    'name' => 'customer_tier',
                    'type' => 'text',
                    'required' => false,
                    'description' => 'Customer plan tier (standard, pro, enterprise)',
                    'example' => 'enterprise',
                ],
            ],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'category' => ['type' => 'string'],
                    'urgency' => ['type' => 'string'],
                    'sentiment' => ['type' => 'string'],
                    'summary' => ['type' => 'string'],
                    'key_issues' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'suggested_reply' => ['type' => 'string'],
                ],
                'required' => ['category', 'urgency', 'sentiment', 'summary', 'key_issues', 'suggested_reply'],
                'additionalProperties' => false,
            ],
            'auth_mode' => 'none',
            'status' => 'active',
        ]);
    }
}
