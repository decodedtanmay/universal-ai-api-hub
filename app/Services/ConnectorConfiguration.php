<?php

namespace App\Services;

use App\Exceptions\ProviderException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

final class ConnectorConfiguration
{
    /** @param array<int, array<string, mixed>> $fields */
    public function validateFields(array $fields, string $provider): void
    {
        $errors = [];
        $names = [];
        $allowedTypes = ['text', 'number', 'boolean', 'image', 'file', 'json'];

        foreach ($fields as $index => $field) {
            $name = $field['name'] ?? null;
            $type = $field['type'] ?? null;

            if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9_]{0,63}$/', $name)) {
                $errors["input_schema.$index.name"][] = 'Use lowercase letters, numbers, and underscores, starting with a letter.';
            } elseif (in_array($name, $names, true)) {
                $errors["input_schema.$index.name"][] = 'Each input name must be unique.';
            }

            $names[] = $name;

            if (! is_string($type) || ! in_array($type, $allowedTypes, true)) {
                $errors["input_schema.$index.type"][] = 'Choose a supported input type.';
            }

            if (in_array($type, ['image', 'file'], true) && $provider === 'groq') {
                $errors["input_schema.$index.type"][] = 'Groq connectors in this release accept text, number, boolean, and JSON inputs only.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /** @param array<string, mixed> $schema */
    public function validateOutputSchema(array $schema): void
    {
        $errors = [];

        if (($schema['type'] ?? null) !== 'object') {
            $errors['output_schema'][] = 'The output schema root must be an object.';
        }

        if (! isset($schema['properties']) || ! is_array($schema['properties'])) {
            $errors['output_schema'][] = 'The output schema needs a properties object.';
        }

        if (isset($schema['properties']) && count($schema['properties']) > 100) {
            $errors['output_schema'][] = 'Use no more than 100 output properties.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @param array<int, array<string, mixed>> $fields
     * @return array{input: array<string, mixed>, files: array<string, UploadedFile>}
     */
    public function normalizeInput(array $fields, array $payload, array $uploadedFiles): array
    {
        $input = [];
        $files = [];
        $knownFields = array_map(fn (array $field) => $field['name'], $fields);
        $unknown = array_diff(array_keys($payload), $knownFields);

        if ($unknown !== []) {
            throw ValidationException::withMessages(['input' => ['Unknown input: '.reset($unknown).'.']]);
        }

        foreach ($fields as $field) {
            $name = $field['name'];
            $type = $field['type'];
            $required = (bool) ($field['required'] ?? false);
            $hasValue = array_key_exists($name, $payload) || array_key_exists($name, $uploadedFiles);

            if (! $hasValue && array_key_exists('default', $field) && ! $required) {
                $input[$name] = $field['default'];
                continue;
            }

            if (! $hasValue) {
                if ($required) {
                    throw ValidationException::withMessages([$name => ['This field is required.']]);
                }

                continue;
            }

            if (in_array($type, ['image', 'file'], true)) {
                $file = $uploadedFiles[$name] ?? null;

                if (! $file instanceof UploadedFile || ! $file->isValid()) {
                    throw ValidationException::withMessages([$name => ['Upload a valid file.']]);
                }

                if ($file->getSize() > config('ai-hub.max_upload_kilobytes') * 1024) {
                    throw ValidationException::withMessages([$name => ['The upload is too large.']]);
                }

                if ($type === 'image' && ! in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                    throw ValidationException::withMessages([$name => ['Use a JPEG, PNG, or WebP image.']]);
                }

                if ($type === 'file' && ! in_array($file->getMimeType(), ['text/plain', 'application/json'], true)) {
                    throw ValidationException::withMessages([$name => ['Use a TXT or JSON file.']]);
                }

                $files[$name] = $file;
                $input[$name] = ['filename' => $file->getClientOriginalName(), 'mime_type' => $file->getMimeType()];
                continue;
            }

            $value = Arr::get($payload, $name);
            $input[$name] = match ($type) {
                'text' => $this->textValue($name, $value),
                'number' => $this->numberValue($name, $value),
                'boolean' => $this->booleanValue($name, $value),
                'json' => $this->jsonValue($name, $value),
                default => throw new ProviderException('The connector input configuration is invalid.', 'INVALID_CONFIGURATION', 422),
            };
        }

        return compact('input', 'files');
    }

    private function textValue(string $name, mixed $value): string
    {
        if (! is_string($value)) {
            throw ValidationException::withMessages([$name => ['This field must be text.']]);
        }

        return $value;
    }

    private function numberValue(string $name, mixed $value): int|float
    {
        if (! is_int($value) && ! is_float($value) && (! is_string($value) || ! is_numeric($value))) {
            throw ValidationException::withMessages([$name => ['This field must be a number.']]);
        }

        return str_contains((string) $value, '.') ? (float) $value : (int) $value;
    }

    private function booleanValue(string $name, mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($normalized === null) {
            throw ValidationException::withMessages([$name => ['This field must be true or false.']]);
        }

        return $normalized;
    }

    private function jsonValue(string $name, mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        try {
            return json_decode($value, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw ValidationException::withMessages([$name => ['This field must contain valid JSON.']]);
        }
    }
}
