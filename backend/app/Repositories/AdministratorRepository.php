<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

final class AdministratorRepository
{
    /** @return array{id: int, name: string, email: string, password_hash: string, is_active: int}|null */
    public function findByEmail(string $email): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, name, email, password_hash, is_active FROM administrators WHERE email = :email LIMIT 1'
        );
        $statement->execute(['email' => $email]);
        $administrator = $statement->fetch();

        return is_array($administrator) ? $administrator : null;
    }

    /** @return array{id: int, name: string, email: string, is_active: int}|null */
    public function findActiveById(int $id): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, name, email, is_active FROM administrators WHERE id = :id AND is_active = TRUE LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $administrator = $statement->fetch();

        return is_array($administrator) ? $administrator : null;
    }
}