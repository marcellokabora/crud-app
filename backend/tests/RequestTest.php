<?php

declare(strict_types=1);

use App\Core\Request;
use App\Core\ValidationException;
use PHPUnit\Framework\TestCase;

final class RequestTest extends TestCase
{
    public function testJsonParsesAnObject(): void
    {
        $request = new Request('POST', '/test', [], '{"name":"Acme","active":true}');

        self::assertSame(['name' => 'Acme', 'active' => true], $request->json());
    }

    public function testJsonReturnsAnEmptyArrayForAnEmptyBody(): void
    {
        $request = new Request('POST', '/test', [], '');

        self::assertSame([], $request->json());
    }

    public function testJsonRejectsMalformedJson(): void
    {
        $request = new Request('POST', '/test', [], '{invalid');

        try {
            $request->json();
            self::fail('Malformed JSON should be rejected.');
        } catch (ValidationException $exception) {
            self::assertSame(['body' => ['The request body must contain valid JSON.']], $exception->errors);
        }
    }

    public function testJsonRejectsAListAtTheRoot(): void
    {
        $request = new Request('POST', '/test', [], '[1,2,3]');

        try {
            $request->json();
            self::fail('The JSON body must be an object.');
        } catch (ValidationException $exception) {
            self::assertSame(['body' => ['The JSON body must be an object.']], $exception->errors);
        }
    }
}