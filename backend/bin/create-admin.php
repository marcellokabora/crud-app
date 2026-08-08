<?php

declare(strict_types=1);

use App\Core\Database;

require dirname(__DIR__) . '/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This command can only run from the command line.\n");
    exit(1);
}

[$script, $name, $email] = array_pad($argv, 3, null);
$name = trim((string) $name);
$email = strtolower(trim((string) $email));
$password = (string) getenv('ADMIN_PASSWORD');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
    fwrite(STDERR, "Set ADMIN_PASSWORD to at least 12 characters, then run: php {$script} \"Admin Name\" admin@example.com\n");
    exit(1);
}

$statement = Database::connection()->prepare(
    'INSERT INTO administrators (name, email, password_hash) VALUES (:name, :email, :password_hash)'
);
$statement->execute([
    'name' => $name,
    'email' => $email,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
]);

fwrite(STDOUT, "Administrator created.\n");