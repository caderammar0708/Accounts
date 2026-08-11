<?php

/**
 * Setup Environment for Local Development
 * Usage: php setup-env.php <client_name>
 * Example: php setup-env.php aaass
 */

if ($argc < 2) {
    echo "Usage: php setup-env.php <client_name>\n";
    echo "Available clients:\n";
    $targets = json_decode(file_get_contents(__DIR__ . '/env/targets.json'), true);
    foreach (array_keys($targets) as $client) {
        echo " - $client\n";
    }
    exit(1);
}

$clientName = $argv[1];
$targetsFile = __DIR__ . '/env/targets.json';
$baseFile = __DIR__ . '/env/.env.local.base';
$envFile = __DIR__ . '/.env';

if (!file_exists($targetsFile)) {
    die("Error: env/targets.json not found.\n");
}

if (!file_exists($baseFile)) {
    die("Error: env/.env.local.base not found.\n");
}

$targets = json_decode(file_get_contents($targetsFile), true);

if (!isset($targets[$clientName])) {
    die("Error: Client '$clientName' not found in targets.json.\n");
}

if (!isset($targets[$clientName]['local'])) {
    die("Error: Local configuration missing for client '$clientName'.\n");
}

$localConfig = $targets[$clientName]['local'];
$baseConfig = file_get_contents($baseFile);

// Build new .env content
$newEnv = $baseConfig . "\n\n# Client Specific Overrides ($clientName)\n";
foreach ($localConfig as $key => $value) {
    $newEnv .= "$key=$value\n";
}

file_put_contents($envFile, $newEnv);

echo "Successfully generated .env for $clientName!\n";
