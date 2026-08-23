<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$controller = app()->make(\App\Http\Controllers\Inventory\TankDipReadingController::class);
try {
    $request = \Illuminate\Http\Request::create('/fuel-station/dip-readings', 'GET');
    $response = $controller->index($request);
    echo "Success!";
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
