<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo "Tanks: " . json_encode(Illuminate\Support\Facades\Schema::getColumnListing('tanks')) . "\n";
echo "TankDipReadings: " . json_encode(Illuminate\Support\Facades\Schema::getColumnListing('tank_dip_readings')) . "\n";
