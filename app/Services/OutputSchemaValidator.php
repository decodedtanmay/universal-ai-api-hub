<?php

namespace App\Services;

use App\Exceptions\ProviderException;
use Opis\JsonSchema\Validator;

final class OutputSchemaValidator
{
    /** @param array<string, mixed> $schema */
    public function decodeAndValidate(string $content, array $schema): array
    {
        $content = trim($content);
        $content = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $content) ?? $content;

        try {
            $decoded = json_decode($content, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new ProviderException('The AI provider returned malformed JSON.', 'INVALID_PROVIDER_RESPONSE');
        }

        if (! is_array($decoded) || array_is_list($decoded)) {
            throw new ProviderException('The AI provider did not return an object.', 'OUTPUT_SCHEMA_MISMATCH');
        }

        $data = json_decode(json_encode($decoded, JSON_THROW_ON_ERROR), false, 64, JSON_THROW_ON_ERROR);
        $schemaObject = json_decode(json_encode($schema, JSON_THROW_ON_ERROR), false, 64, JSON_THROW_ON_ERROR);
        $result = (new Validator())->validate($data, $schemaObject);

        if (! $result->isValid()) {
            throw new ProviderException('The AI response did not match the connector output schema.', 'OUTPUT_SCHEMA_MISMATCH');
        }

        return $decoded;
    }
}
