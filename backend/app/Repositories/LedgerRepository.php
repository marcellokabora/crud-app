<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Core\HttpException;
use Throwable;

final class LedgerRepository
{
    /** @return array{client: array<string, mixed>, summary: array{earnings_minor: int, expenses_minor: int, balance_minor: int}, entries: list<array<string, mixed>>} */
    public function report(int $clientId, ?string $from, ?string $to): array
    {
        $connection = Database::connection();
        $clientStatement = $connection->prepare(
            'SELECT id, name, email, phone, external_reference, notes, is_active, created_at, updated_at
             FROM clients
               WHERE id = :id AND is_active = TRUE'
        );
        $clientStatement->execute(['id' => $clientId]);
        $client = $clientStatement->fetch();

        if ($client === false) {
            throw new HttpException(404, 'client_not_found', 'The client was not found.');
        }

        $conditions = ['client_id = :client_id', 'voided_at IS NULL'];
        $parameters = ['client_id' => $clientId];

        if ($from !== null) {
            $conditions[] = 'occurred_on >= :from_date';
            $parameters['from_date'] = $from;
        }
        if ($to !== null) {
            $conditions[] = 'occurred_on <= :to_date';
            $parameters['to_date'] = $to;
        }

        $where = implode(' AND ', $conditions);
        $entriesStatement = $connection->prepare(
            "SELECT id, type, amount_minor, occurred_on, description, created_at
             FROM ledger_entries
             WHERE {$where}
             ORDER BY occurred_on DESC, id DESC"
        );
        $entriesStatement->execute($parameters);
        $entries = $entriesStatement->fetchAll();

        $earnings = 0;
        $expenses = 0;
        foreach ($entries as &$entry) {
            $entry['id'] = (int) $entry['id'];
            $entry['amount_minor'] = (int) $entry['amount_minor'];
            if ($entry['type'] === 'earning') {
                $earnings += $entry['amount_minor'];
            } else {
                $expenses += $entry['amount_minor'];
            }
        }
        unset($entry);

        return [
            'client' => $client,
            'summary' => [
                'earnings_minor' => $earnings,
                'expenses_minor' => $expenses,
                'balance_minor' => $earnings - $expenses,
            ],
            'entries' => $entries,
        ];
    }

    /** @param array{client_id: int, type: string, amount_minor: int, occurred_on: string, description: string} $entry */
    public function create(array $entry, int $administratorId, string $ipAddress): int
    {
        $connection = Database::connection();
        $connection->beginTransaction();

        try {
            $clientStatement = $connection->prepare('SELECT id FROM clients WHERE id = :id AND is_active = TRUE FOR UPDATE');
            $clientStatement->execute(['id' => $entry['client_id']]);
            if ($clientStatement->fetchColumn() === false) {
                throw new HttpException(404, 'client_not_found', 'The active client was not found.');
            }

            $statement = $connection->prepare(
                'INSERT INTO ledger_entries (client_id, type, amount_minor, occurred_on, description, created_by)
                 VALUES (:client_id, :type, :amount_minor, :occurred_on, :description, :created_by)'
            );
            $statement->execute($entry + ['created_by' => $administratorId]);
            $entryId = (int) $connection->lastInsertId();

            $auditStatement = $connection->prepare(
                'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, metadata, ip_address)
                 VALUES (:administrator_id, :action, :entity_type, :entity_id, :metadata, :ip_address)'
            );
            $auditStatement->execute([
                'administrator_id' => $administratorId,
                'action' => 'ledger_entry.created',
                'entity_type' => 'ledger_entry',
                'entity_id' => $entryId,
                'metadata' => json_encode([
                    'client_id' => $entry['client_id'],
                    'type' => $entry['type'],
                    'amount_minor' => $entry['amount_minor'],
                    'occurred_on' => $entry['occurred_on'],
                ], JSON_THROW_ON_ERROR),
                'ip_address' => $ipAddress,
            ]);

            $connection->commit();

            return $entryId;
        } catch (Throwable $exception) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $exception;
        }
    }

    public function void(int $entryId, int $clientId, int $administratorId, string $ipAddress): void
    {
        $connection = Database::connection();
        $connection->beginTransaction();

        try {
            $statement = $connection->prepare(
                'UPDATE ledger_entries
                 SET voided_at = CURRENT_TIMESTAMP, voided_by = :voided_by, void_reason = :void_reason
                 WHERE id = :id AND client_id = :client_id AND voided_at IS NULL'
            );
            $statement->execute([
                'voided_by' => $administratorId,
                'void_reason' => 'Removed by administrator.',
                'id' => $entryId,
                'client_id' => $clientId,
            ]);
            if ($statement->rowCount() === 0) {
                throw new HttpException(404, 'ledger_entry_not_found', 'The active ledger entry was not found.');
            }

            $auditStatement = $connection->prepare(
                'INSERT INTO audit_logs (administrator_id, action, entity_type, entity_id, metadata, ip_address)
                 VALUES (:administrator_id, :action, :entity_type, :entity_id, :metadata, :ip_address)'
            );
            $auditStatement->execute([
                'administrator_id' => $administratorId,
                'action' => 'ledger_entry.voided',
                'entity_type' => 'ledger_entry',
                'entity_id' => $entryId,
                'metadata' => json_encode(['client_id' => $clientId], JSON_THROW_ON_ERROR),
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