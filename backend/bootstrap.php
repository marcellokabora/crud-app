<?php

declare(strict_types=1);

use App\Core\Database;
use App\Core\Env;
use App\Core\Session;

require __DIR__ . '/vendor/autoload.php';

Env::load(__DIR__ . '/.env');

date_default_timezone_set(Env::get('APP_TIMEZONE', 'UTC'));

Database::configure([
    'host' => Env::get('DB_HOST', '127.0.0.1'),
    'port' => Env::get('DB_PORT', '3306'),
    'database' => Env::get('DB_DATABASE', 'client_ledger'),
    'username' => Env::get('DB_USERNAME', 'client_ledger'),
    'password' => Env::get('DB_PASSWORD', ''),
]);

Session::start(Env::get('APP_ENV', 'production') === 'production');