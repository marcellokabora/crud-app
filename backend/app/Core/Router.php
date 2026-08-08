<?php

declare(strict_types=1);

namespace App\Core;

use Closure;

final class Router
{
    /** @var array<string, array<string, Closure>> */
    private array $routes = [];

    public function get(string $path, Closure $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, Closure $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }

    public function options(string $path, Closure $handler): void
    {
        $this->routes['OPTIONS'][$path] = $handler;
    }

    public function dispatch(Request $request): Response
    {
        $handler = $this->routes[$request->method][$request->path] ?? null;

        if ($handler === null) {
            return Response::json([
                'error' => [
                    'code' => 'not_found',
                    'message' => 'The requested endpoint was not found.',
                ],
            ], 404);
        }

        return $handler($request);
    }
}