<?php

declare(strict_types=1);

use App\Controllers\ClientController;
use App\Controllers\LedgerController;
use App\Core\Request;
use App\Core\ValidationException;
use App\Repositories\ClientRepository;
use App\Repositories\LedgerRepository;
use PHPUnit\Framework\TestCase;

final class ControllerValidationTest extends TestCase
{
    protected function setUp(): void
    {
        $_SESSION = [
            'administrator_id' => 1,
            'authenticated_at' => time(),
            'last_activity_at' => time(),
            'csrf_token' => 'test-token',
        ];
        $_SERVER['HTTP_X_CSRF_TOKEN'] = 'test-token';
    }

    public function testClientCreationRejectsInvalidFieldsBeforePersistence(): void
    {
        $controller = new ClientController(new ClientRepository());
        $request = new Request('POST', '/api/clients', [], json_encode([
            'name' => '',
            'email' => 'not-an-email',
            'phone' => str_repeat('1', 41),
        ], JSON_THROW_ON_ERROR));

        try {
            $controller->store($request);
            self::fail('Invalid client input should be rejected.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('name', $exception->errors);
            self::assertArrayHasKey('email', $exception->errors);
            self::assertArrayHasKey('phone', $exception->errors);
        }
    }

    public function testClientRemovalRequiresAValidIdentifier(): void
    {
        $controller = new ClientController(new ClientRepository());
        $request = new Request('POST', '/api/clients/remove', [], '{"client_id":0}');

        $this->expectException(ValidationException::class);
        $controller->remove($request);
    }

    public function testLedgerCreationRejectsInvalidFinancialFieldsBeforePersistence(): void
    {
        $controller = new LedgerController(new LedgerRepository());
        $request = new Request('POST', '/api/ledger', [], json_encode([
            'client_id' => 1,
            'type' => 'credit',
            'amount' => '10.999',
            'occurred_on' => '2026-08-08',
            'description' => '',
        ], JSON_THROW_ON_ERROR));

        try {
            $controller->store($request);
            self::fail('Invalid ledger input should be rejected.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('type', $exception->errors);
            self::assertArrayHasKey('amount', $exception->errors);
            self::assertArrayHasKey('description', $exception->errors);
        }
    }

    public function testLedgerReportRejectsAReversedDateRangeBeforePersistence(): void
    {
        $controller = new LedgerController(new LedgerRepository());
        $request = new Request('GET', '/api/ledger', [
            'client_id' => '1',
            'from' => '2026-08-31',
            'to' => '2026-08-01',
        ], '');

        try {
            $controller->index($request);
            self::fail('A reversed date range should be rejected.');
        } catch (ValidationException $exception) {
            self::assertArrayHasKey('to', $exception->errors);
        }
    }
}