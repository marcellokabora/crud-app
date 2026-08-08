<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiGuard;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\Session;
use App\Core\ValidationException;
use App\Repositories\AdministratorRepository;
use App\Repositories\LoginAttemptRepository;

final class AuthController
{
    public function __construct(
        private readonly AdministratorRepository $administrators,
        private readonly LoginAttemptRepository $loginAttempts,
    ) {
    }

    public function login(Request $request): Response
    {
        ApiGuard::csrf();
        $input = $request->json();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        $ipAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            throw new ValidationException([
                'credentials' => ['Enter a valid email address and password.'],
            ]);
        }

        if ($this->loginAttempts->isLimited($email, $ipAddress)) {
            throw new HttpException(429, 'too_many_attempts', 'Too many login attempts. Try again later.');
        }

        $administrator = $this->administrators->findByEmail($email);

        $passwordHash = $administrator['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $passwordMatches = password_verify($password, $passwordHash);

        if ($administrator === null || !$administrator['is_active'] || !$passwordMatches) {
            $this->loginAttempts->record($email, $ipAddress, false);
            throw new HttpException(401, 'invalid_credentials', 'The email or password is incorrect.');
        }

        $this->loginAttempts->record($email, $ipAddress, true);
        Session::authenticate((int) $administrator['id']);

        return Response::json(['data' => $this->publicAdministrator($administrator)]);
    }

    public function me(): Response
    {
        $id = ApiGuard::authenticated();
        $administrator = $this->administrators->findActiveById($id);

        if ($administrator === null) {
            Session::logout();
            throw new HttpException(401, 'unauthenticated', 'Authentication is required.');
        }

        return Response::json(['data' => $this->publicAdministrator($administrator)]);
    }

    public function csrf(): Response
    {
        return Response::json(['data' => ['token' => Session::csrfToken()]]);
    }

    public function logout(): Response
    {
        ApiGuard::authenticated();
        ApiGuard::csrf();
        Session::logout();

        return Response::empty();
    }

    /** @param array<string, mixed> $administrator */
    private function publicAdministrator(array $administrator): array
    {
        return [
            'id' => (int) $administrator['id'],
            'name' => (string) $administrator['name'],
            'email' => (string) $administrator['email'],
        ];
    }
}