<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Spatie\Permission\Models\Permission;
use App\Models\User;

$permissions = ['manage-payroll', 'view-payroll', 'manage-leave-requests', 'manage-system', 'view-attendance-report'];
foreach ($permissions as $p) {
    Permission::firstOrCreate(['name' => $p]);
}
$user = User::first();
if ($user) {
    $user->givePermissionTo($permissions);
    echo 'Assigned permissions to User ' . $user->name . "\n";
}
