$source = "c:\develop\xampp\htdocs\jbooks-fuel"
$dest = "c:\develop\xampp\htdocs\jbooks-garage"

# 1. Copy Models
$models = @("Tank.php", "Pump.php", "Nozzle.php", "PumpShift.php", "PumpShiftNozzle.php", "PumpShiftCollection.php", "PumpShiftCreditSale.php")
foreach ($model in $models) {
    Copy-Item -Path "$source\app\Models\$model" -Destination "$dest\app\Models\$model" -Force
}

# 2. Copy Controllers
$controllers = @("TankController.php", "PumpController.php", "PumpShiftController.php")
if (!(Test-Path "$dest\app\Http\Controllers\Inventory")) {
    New-Item -ItemType Directory -Force -Path "$dest\app\Http\Controllers\Inventory"
}
foreach ($controller in $controllers) {
    Copy-Item -Path "$source\app\Http\Controllers\Inventory\$controller" -Destination "$dest\app\Http\Controllers\Inventory\$controller" -Force
}

# 3. Copy Views (PDF)
if (!(Test-Path "$dest\resources\views\exports")) {
    New-Item -ItemType Directory -Force -Path "$dest\resources\views\exports"
}
Copy-Item -Path "$source\resources\views\exports\shift_pdf.blade.php" -Destination "$dest\resources\views\exports\shift_pdf.blade.php" -Force

# 4. Copy React Pages
$pages = @("Tanks", "Pumps", "Shifts")
foreach ($page in $pages) {
    if (Test-Path "$source\resources\js\Pages\$page") {
        Copy-Item -Path "$source\resources\js\Pages\$page" -Destination "$dest\resources\js\Pages\$page" -Recurse -Force
    }
}
Copy-Item -Path "$source\resources\js\Components\StationTabs.jsx" -Destination "$dest\resources\js\Components\StationTabs.jsx" -Force

# 5. Copy Migrations
# Instead of dumping them in main, we will put them in database/migrations/modules/fuel_station
$migrationDir = "$dest\database\migrations\modules\fuel_station"
if (!(Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Force -Path $migrationDir
}

$migrations = @(
    "2026_07_16_173606_create_tanks_table.php",
    "2026_07_16_173941_create_pumps_table.php",
    "2026_07_16_174013_create_nozzles_table.php",
    "2026_07_16_182406_create_pump_shifts_table.php",
    "2026_07_16_182432_create_pump_shift_nozzles_table.php",
    "2026_07_17_140355_create_pump_shift_collections_and_credit_sales_tables.php",
    "2026_07_28_164403_change_decimal_places_in_pump_shift_nozzles_table.php",
    "2026_07_29_095745_add_order_no_to_nozzles_table.php",
    "2026_07_29_131049_add_description_to_pump_shift_collections_table.php"
)

# Wait, what about "2026_07_30_130226_add_pump_shift_id_to_invoices_table.php"?
# Since garage has sales_invoices table, I will modify the migration content during execution or create a new one. Let's create a new one.

foreach ($migration in $migrations) {
    Copy-Item -Path "$source\database\migrations\$migration" -Destination "$migrationDir\$migration" -Force
}

Write-Host "Copy completed."
