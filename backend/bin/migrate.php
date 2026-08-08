<?php

declare(strict_types=1);

use App\Core\Database;

require dirname(__DIR__) . '/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$connection = Database::connection();
$connection->exec(
    'CREATE TABLE IF NOT EXISTS migrations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$applied = $connection->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);

foreach (glob(dirname(__DIR__) . '/database/migrations/*.sql') ?: [] as $file) {
    $migration = basename($file);

    if (in_array($migration, $applied, true)) {
        continue;
    }

    $connection->exec((string) file_get_contents($file));
    $statement = $connection->prepare('INSERT INTO migrations (migration) VALUES (:migration)');
    $statement->execute(['migration' => $migration]);
    fwrite(STDOUT, "Applied {$migration}\n");
}