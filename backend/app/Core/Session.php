<?php

declare(strict_types=1);

namespace App\Core;

final class Session
{
    private const IDLE_TIMEOUT = 1800;
    private const ABSOLUTE_TIMEOUT = 43200;

    public static function start(bool $secure): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name('ledger_session');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_start();
    }

    public static function administratorId(): ?int
    {
        $id = $_SESSION['administrator_id'] ?? null;

        if (!is_int($id)) {
            return null;
        }

        $now = time();
        $authenticatedAt = (int) ($_SESSION['authenticated_at'] ?? 0);
        $lastActivityAt = (int) ($_SESSION['last_activity_at'] ?? 0);

        if ($authenticatedAt < $now - self::ABSOLUTE_TIMEOUT || $lastActivityAt < $now - self::IDLE_TIMEOUT) {
            self::logout();
            return null;
        }

        $_SESSION['last_activity_at'] = $now;

        return $id;
    }

    public static function authenticate(int $administratorId): void
    {
        session_regenerate_id(true);
        $_SESSION['administrator_id'] = $administratorId;
        $_SESSION['authenticated_at'] = time();
        $_SESSION['last_activity_at'] = time();
        self::rotateCsrfToken();
    }

    public static function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], '', $params['secure'], $params['httponly']);
        }

        session_destroy();
    }

    public static function csrfToken(): string
    {
        if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            self::rotateCsrfToken();
        }

        return (string) $_SESSION['csrf_token'];
    }

    private static function rotateCsrfToken(): void
    {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}