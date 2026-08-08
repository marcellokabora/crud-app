<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\ClientController;
use App\Controllers\LedgerController;
use App\Core\Env;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Core\ValidationException;
use App\Repositories\AdministratorRepository;
use App\Repositories\ClientRepository;
use App\Repositories\LedgerRepository;
use App\Repositories\LoginAttemptRepository;

require dirname(__DIR__) . '/bootstrap.php';

$router = new Router();
$authController = new AuthController(new AdministratorRepository(), new LoginAttemptRepository());
$clientController = new ClientController(new ClientRepository());
$ledgerController = new LedgerController(new LedgerRepository());

$origin = Env::get('APP_ORIGIN', 'http://localhost:3000');
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($requestOrigin === $origin) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Vary: Origin');
}

$router->get('/api/health', static fn (): Response => Response::json([
    'data' => [
        'status' => 'ok',
        'service' => 'client-ledger-api',
    ],
]));
$router->get('/api/auth/csrf', fn (): Response => $authController->csrf());
$router->post('/api/auth/login', fn (Request $request): Response => $authController->login($request));
$router->get('/api/auth/me', fn (): Response => $authController->me());
$router->post('/api/auth/logout', fn (): Response => $authController->logout());
$router->get('/api/clients', fn (Request $request): Response => $clientController->index($request));
$router->post('/api/clients', fn (Request $request): Response => $clientController->store($request));
$router->post('/api/clients/remove', fn (Request $request): Response => $clientController->remove($request));
$router->get('/api/ledger', fn (Request $request): Response => $ledgerController->index($request));
$router->post('/api/ledger', fn (Request $request): Response => $ledgerController->store($request));
$router->post('/api/ledger/remove', fn (Request $request): Response => $ledgerController->remove($request));

foreach (['/api/auth/csrf', '/api/auth/login', '/api/auth/logout', '/api/clients', '/api/clients/remove', '/api/ledger', '/api/ledger/remove'] as $path) {
    $router->options($path, static fn (): Response => Response::empty());
}

try {
    if ($requestOrigin !== '' && $requestOrigin !== $origin) {
        throw new HttpException(403, 'origin_not_allowed', 'The request origin is not allowed.');
    }

    $response = $router->dispatch(Request::capture());
} catch (ValidationException $exception) {
    $response = Response::json([
        'error' => [
            'code' => 'validation_failed',
            'message' => $exception->getMessage(),
            'fields' => $exception->errors,
        ],
    ], 422);
} catch (HttpException $exception) {
    $response = Response::json([
        'error' => [
            'code' => $exception->errorCode,
            'message' => $exception->getMessage(),
        ],
    ], $exception->status);
} catch (Throwable $exception) {
    error_log($exception->getMessage());

    $response = Response::json([
        'error' => [
            'code' => 'internal_error',
            'message' => 'An unexpected error occurred.',
        ],
    ], 500);
}

$response->send();