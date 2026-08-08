<?php

declare(strict_types=1);

namespace App\Core;

final class ApiGuard
{
    public static function authenticated(): int
    {
        $administratorId = Session::administratorId();

        if ($administratorId === null) {
            throw new HttpException(401, 'unauthenticated', 'Authentication is required.');
        }

        return $administratorId;
    }

    public static function csrf(): void
    {
        $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (!is_string($provided) || !hash_equals(Session::csrfToken(), $provided)) {
            throw new HttpException(419, 'csrf_mismatch', 'The security token is invalid or expired.');
        }
    }
}