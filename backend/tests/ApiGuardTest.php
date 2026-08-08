<?php

declare(strict_types=1);

use App\Core\ApiGuard;
use App\Core\HttpException;
use PHPUnit\Framework\TestCase;

final class ApiGuardTest extends TestCase
{
    protected function setUp(): void
    {
        $_SESSION = [];
        unset($_SERVER['HTTP_X_CSRF_TOKEN']);
    }

    public function testAuthenticatedReturnsTheAdministratorId(): void
    {
        $_SESSION = [
            'administrator_id' => 42,
            'authenticated_at' => time(),
            'last_activity_at' => time(),
        ];

        self::assertSame(42, ApiGuard::authenticated());
    }

    public function testAuthenticatedRejectsAnAnonymousRequest(): void
    {
        try {
            ApiGuard::authenticated();
            self::fail('Anonymous requests should be rejected.');
        } catch (HttpException $exception) {
            self::assertSame(401, $exception->status);
            self::assertSame('unauthenticated', $exception->errorCode);
        }
    }

    public function testCsrfAcceptsTheSessionToken(): void
    {
        $_SESSION['csrf_token'] = 'known-token';
        $_SERVER['HTTP_X_CSRF_TOKEN'] = 'known-token';

        ApiGuard::csrf();

        self::assertTrue(true);
    }

    public function testCsrfRejectsAMismatchedToken(): void
    {
        $_SESSION['csrf_token'] = 'known-token';
        $_SERVER['HTTP_X_CSRF_TOKEN'] = 'different-token';

        try {
            ApiGuard::csrf();
            self::fail('A mismatched CSRF token should be rejected.');
        } catch (HttpException $exception) {
            self::assertSame(419, $exception->status);
            self::assertSame('csrf_mismatch', $exception->errorCode);
        }
    }
}