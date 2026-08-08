<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiGuard;
use App\Core\Request;
use App\Core\Response;
use App\Core\ValidationException;
use App\Repositories\ClientRepository;

final class ClientController
{
    public function __construct(private readonly ClientRepository $clients)
    {
    }

    public function index(Request $request): Response
    {
        ApiGuard::authenticated();
        $query = trim($request->query['query'] ?? '');

        if (mb_strlen($query) > 100) {
            throw new ValidationException(['query' => ['Search must not exceed 100 characters.']]);
        }

        return Response::json(['data' => $this->clients->search($query)]);
    }

    public function store(Request $request): Response
    {
        $administratorId = ApiGuard::authenticated();
        ApiGuard::csrf();
        $input = $request->json();
        $client = $this->validate($input);
        $id = $this->clients->create($client, $administratorId);

        return Response::json(['data' => ['id' => $id]], 201);
    }

    public function remove(Request $request): Response
    {
        $administratorId = ApiGuard::authenticated();
        ApiGuard::csrf();
        $input = $request->json();
        $clientId = filter_var($input['client_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if ($clientId === false) {
            throw new ValidationException(['client_id' => ['A valid client is required.']]);
        }

        $ipAddress = substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
        $this->clients->deactivate((int) $clientId, $administratorId, $ipAddress);

        return Response::empty();
    }

    /** @param array<string, mixed> $input
     *  @return array{name: string, email: ?string, phone: ?string, external_reference: ?string, notes: ?string}
     */
    private function validate(array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $email = $this->nullableString($input['email'] ?? null);
        $phone = $this->nullableString($input['phone'] ?? null);
        $reference = $this->nullableString($input['external_reference'] ?? null);
        $notes = $this->nullableString($input['notes'] ?? null);
        $errors = [];

        if ($name === '' || mb_strlen($name) > 160) {
            $errors['name'][] = 'Name is required and must not exceed 160 characters.';
        }
        if ($email !== null && (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254)) {
            $errors['email'][] = 'Enter a valid email address.';
        }
        if ($phone !== null && mb_strlen($phone) > 40) {
            $errors['phone'][] = 'Phone must not exceed 40 characters.';
        }
        if ($reference !== null && mb_strlen($reference) > 80) {
            $errors['external_reference'][] = 'External reference must not exceed 80 characters.';
        }
        if ($notes !== null && mb_strlen($notes) > 5000) {
            $errors['notes'][] = 'Notes must not exceed 5,000 characters.';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'name' => $name,
            'email' => $email === null ? null : strtolower($email),
            'phone' => $phone,
            'external_reference' => $reference,
            'notes' => $notes,
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}