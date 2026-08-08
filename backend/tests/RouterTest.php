<?php

declare(strict_types=1);

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use PHPUnit\Framework\TestCase;

final class RouterTest extends TestCase
{
    public function testDispatchesARegisteredRoute(): void
    {
        $router = new Router();
        $router->get('/health', static fn (): Response => Response::json(['data' => ['status' => 'ok']]));

        $response = $router->dispatch(new Request('GET', '/health', [], ''));

        ob_start();
        $response->send();
        $body = ob_get_clean();

        self::assertSame(200, http_response_code());
        self::assertSame(['data' => ['status' => 'ok']], json_decode((string) $body, true, flags: JSON_THROW_ON_ERROR));
    }

    public function testUnknownRouteReturnsNotFound(): void
    {
        $response = (new Router())->dispatch(new Request('GET', '/missing', [], ''));

        ob_start();
        $response->send();
        $body = ob_get_clean();

        self::assertSame(404, http_response_code());
        self::assertSame('not_found', json_decode((string) $body, true, flags: JSON_THROW_ON_ERROR)['error']['code']);
    }
}