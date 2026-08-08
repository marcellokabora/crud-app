<?php

declare(strict_types=1);

namespace App\Core;

use JsonException;

final class Request
{
    /** @param array<string, string> $query */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        private readonly string $body,
    ) {
    }

    public static function capture(): self
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH);

        return new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            is_string($path) ? rtrim($path, '/') ?: '/' : '/',
            array_map('strval', $_GET),
            file_get_contents('php://input') ?: '',
        );
    }

    /** @return array<string, mixed> */
    public function json(): array
    {
        if ($this->body === '') {
            return [];
        }

        try {
            $root = json_decode($this->body, false, 512, JSON_THROW_ON_ERROR);
            $data = json_decode($this->body, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new ValidationException(['body' => ['The request body must contain valid JSON.']]);
        }

        if (!$root instanceof \stdClass || !is_array($data)) {
            throw new ValidationException(['body' => ['The JSON body must be an object.']]);
        }

        return $data;
    }
}