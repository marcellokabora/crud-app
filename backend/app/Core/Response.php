<?php

declare(strict_types=1);

namespace App\Core;

final class Response
{
    /** @param array<string, mixed> $payload */
    private function __construct(
        private readonly array $payload,
        private readonly int $status,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function json(array $payload, int $status = 200): self
    {
        return new self($payload, $status);
    }

    public static function empty(int $status = 204): self
    {
        return new self([], $status);
    }

    public function send(): void
    {
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store');
        if ($this->status !== 204) {
            echo json_encode($this->payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        }
    }
}