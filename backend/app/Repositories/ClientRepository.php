<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Core\HttpException;
use PDOException;
use Throwable;

final class ClientRepository
{
    /** @return list<array<string, mixed>> */
    public function search(string $query): array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, name, email, phone, external_reference, notes, is_active, created_at, updated_at
             FROM clients
                 WHERE is_active = TRUE
                    AND (name LIKE :name_query
                     OR email LIKE :email_query
                     OR external_reference LIKE :reference_query)
             ORDER BY name ASC, id ASC
             LIMIT 100'
        );
        $pattern = '%' . $query . '%';
        $statement->execute([
            'name_query' => $pattern,
            'email_query' => $pattern,
            'reference_query' => $pattern,
        ]);

        return $statement->fetchAll();
    }

    /** @param array{name: string, email: ?string, phone: ?string, external_reference: ?string, notes: ?string} $client */
    public function create(array $client, int $administratorId): int
    {
        $statement = Database::connection()->prepare(
            'INSERT INTO clients (name, email, phone, external_reference, notes, created_by)
             VALUES (:name, :email, :phone, :external_reference, :notes, :created_by)'
        );

        try {
            $statement->execute($client + ['created_by' => $administratorId]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                throw new \App\Core\ValidationException([
                    'external_reference' => ['This external reference is already in use.'],
                ]);
            }

            throw $exception;
        }

        return (int) Database::connection()->lastInsertId();
    }

    public function deactivate(int $clientId, int $administratorId, string $ipAddress): void
    {
        $connection = Database::connection();
        $connection->beginTransaction();

        try {
            $statement = $connection->prepare('UPDATE clients SET is_active = FALSE WHERE id = :id AND is_active = TRUE');
            $statement->execute(['id' => $clientId]);
            if ($statement->rowCount() === 0) {
                throw new HttpException(404, 'client_not_found', 'The active client was not found.');
            }

            $auditStatement = $connection->prepare(
                'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, metadata, ip_address)
                 VALUES (:administrator_id, :action, :entity_type, :entity_id, :metadata, :ip_address)'
            );
            $auditStatement->execute([
                'administrator_id' => $administratorId,
                'action' => 'client.deactivated',
                'entity_type' => 'client',
                'entity_id' => $clientId,
                'metadata' => json_encode(['is_active' => false], JSON_THROW_ON_ERROR),
                'ip_address' => $ipAddress,
            ]);

            $connection->commit();
        } catch (Throwable $exception) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $exception;
        }
    }
}