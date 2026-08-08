<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiGuard;
use App\Core\Request;
use App\Core\Response;
use App\Core\ValidationException;
use App\Repositories\LedgerRepository;
use DateTimeImmutable;

final class LedgerController
{
    public function __construct(private readonly LedgerRepository $ledger)
    {
    }

    public function index(Request $request): Response
    {
        ApiGuard::authenticated();
        $clientId = $this->positiveInteger($request->query['client_id'] ?? null, 'client_id');
        $from = $this->date($request->query['from'] ?? null, 'from', true);
        $to = $this->date($request->query['to'] ?? null, 'to', true);

        if ($from !== null && $to !== null && $from > $to) {
            throw new ValidationException(['to' => ['The end date must be on or after the start date.']]);
        }

        return Response::json(['data' => $this->ledger->report($clientId, $from, $to)]);
    }

    public function store(Request $request): Response
    {
        $administratorId = ApiGuard::authenticated();
        ApiGuard::csrf();
        $input = $request->json();
        $entry = $this->validate($input);
        $ipAddress = substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
        $id = $this->ledger->create($entry, $administratorId, $ipAddress);

        return Response::json(['data' => ['id' => $id]], 201);
    }

    public function remove(Request $request): Response
    {
        $administratorId = ApiGuard::authenticated();
        ApiGuard::csrf();
        $input = $request->json();
        $errors = [];
        $entryId = $this->validatedId($input['entry_id'] ?? null, 'entry_id', $errors);
        $clientId = $this->validatedId($input['client_id'] ?? null, 'client_id', $errors);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $ipAddress = substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
        $this->ledger->void($entryId, $clientId, $administratorId, $ipAddress);

        return Response::empty();
    }

    /** @param array<string, mixed> $input
     *  @return array{client_id: int, type: string, amount_minor: int, occurred_on: string, description: string}
     */
    private function validate(array $input): array
    {
        $errors = [];
        $clientId = $this->positiveInteger($input['client_id'] ?? null, 'client_id', $errors);
        $type = (string) ($input['type'] ?? '');
        $amount = trim((string) ($input['amount'] ?? ''));
        $occurredOn = $this->date($input['occurred_on'] ?? null, 'occurred_on', false, $errors);
        $description = trim((string) ($input['description'] ?? ''));

        if (!in_array($type, ['earning', 'expense'], true)) {
            $errors['type'][] = 'Type must be earning or expense.';
        }
        if (!preg_match('/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/', $amount)) {
            $errors['amount'][] = 'Enter a positive amount with no more than 2 decimal places.';
        }
        if ($description === '' || mb_strlen($description) > 500) {
            $errors['description'][] = 'Description is required and must not exceed 500 characters.';
        }

        $amountMinor = 0;
        if (!isset($errors['amount'])) {
            [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '');
            $amountMinor = ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');
            if ($amountMinor <= 0 || $amountMinor > PHP_INT_MAX) {
                $errors['amount'][] = 'Amount must be greater than zero and within the supported range.';
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'client_id' => $clientId,
            'type' => $type,
            'amount_minor' => $amountMinor,
            'occurred_on' => (string) $occurredOn,
            'description' => $description,
        ];
    }

    /** @param array<string, list<string>> $errors */
    private function positiveInteger(mixed $value, string $field, array &$errors = []): int
    {
        if (filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false) {
            $errors[$field][] = 'A valid client is required.';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return (int) $value;
    }

    /** @param array<string, list<string>> $errors */
    private function validatedId(mixed $value, string $field, array &$errors): int
    {
        if (filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false) {
            $errors[$field][] = 'A valid identifier is required.';
        }

        return (int) $value;
    }

    /** @param array<string, list<string>> $errors */
    private function date(mixed $value, string $field, bool $nullable, array &$errors = []): ?string
    {
        $value = trim((string) ($value ?? ''));
        if ($nullable && $value === '') {
            return null;
        }

        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        $dateErrors = DateTimeImmutable::getLastErrors();
        if ($date === false || ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) || $date->format('Y-m-d') !== $value) {
            $errors[$field][] = 'Enter a valid date in YYYY-MM-DD format.';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $value;
    }
}