<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

final class LoginAttemptRepository
{
    public function isLimited(string $email, string $ipAddress): bool
    {
        $statement = Database::connection()->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE was_successful = FALSE
               AND attempted_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)
               AND (email = :email OR ip_address = :ip_address)'
        );
        $statement->execute(['email' => $email, 'ip_address' => $ipAddress]);

        return (int) $statement->fetchColumn() >= 5;
    }

    public function record(string $email, string $ipAddress, bool $successful): void
    {
        $statement = Database::connection()->prepare(
            'INSERT INTO login_attempts (email, ip_address, was_successful)
             VALUES (:email, :ip_address, :was_successful)'
        );
        $statement->execute([
            'email' => $email,
            'ip_address' => $ipAddress,
            'was_successful' => $successful ? 1 : 0,
        ]);
    }
}