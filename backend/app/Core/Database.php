<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

final class Database
{
    /** @var array{host: string, port: string, database: string, username: string, password: string} */
    private static array $config;

    private static ?PDO $connection = null;

    /** @param array{host: string, port: string, database: string, username: string, password: string} $config */
    public static function configure(array $config): void
    {
        self::$config = $config;
    }

    public static function connection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            self::$config['host'],
            self::$config['port'],
            self::$config['database'],
        );

        self::$connection = new PDO($dsn, self::$config['username'], self::$config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$connection;
    }
}