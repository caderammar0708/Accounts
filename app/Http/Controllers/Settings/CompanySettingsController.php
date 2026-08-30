<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

class CompanySettingsController extends Controller
{
    private function handleModuleMigrations($module, $enabled, $dropTables = false)
    {
        $path = database_path('migrations/modules/' . $module);
        
        if ($enabled) {
            $exitCode = Artisan::call('migrate', [
                '--path' => $path,
                '--realpath' => true,
                '--force' => true,
            ]);
            if ($exitCode !== 0) {
                \Illuminate\Support\Facades\Log::error("Migration failed for $module. Output: " . Artisan::output());
                throw ValidationException::withMessages(['business_type' => "Migration failed for $module. Check logs."]);
            }
        } elseif ($dropTables) {
            Artisan::call('migrate:reset', [
                '--path' => $path,
                '--realpath' => true,
                '--force' => true,
            ]);
        }
    }
    /**
     * Helper to get the active company.
     */
    private function getActiveCompany()
    {
        return \App\Models\Company::current();
    }

    private function getSettings()
    {
        return CompanySetting::current();
    }

    public function index()
    {
        $company = $this->getActiveCompany();

        $settings = $this->getSettings();

        // Merge company info and specific settings
        $salesSettings = class_exists(\App\Models\SalesSetting::class)
            ? (\App\Models\SalesSetting::query()->first()?->toArray() ?? [])
            : [];

        $advancedSettings = class_exists(\App\Models\AdvancedSettings::class)
            ? (\App\Models\AdvancedSettings::query()->first()?->toArray() ?? [])
            : [];

        $mergedData = array_merge($company ? $company->toArray() : [], $settings ? $settings->toArray() : [], [
            'settings_metadata' => [
                'payments' => [
                    'show_tags' => $settings->show_tags ?? false,
                    'bill_payment_terms' => $settings->bill_payment_terms ?? null,
                ],
                'sales' => $salesSettings,
                'advanced' => $advancedSettings,
                'print_settings' => \App\Models\PrintSetting::query()->get(),
            ],
        ]);

        return Inertia::render('Settings/Company', [
            'settings' => $mergedData,
            'currencies' => \App\Models\Currency::where('is_active', true)->get(),
        ]);
    }

    /**
     * Update General Company Info
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'website' => 'nullable|string',
            'industry' => 'nullable|string',
            'home_currency_prefix' => 'nullable|string|max:10',
        ]);

        $company = $this->getActiveCompany();
        if ($company) {
            $company->update($validated);
        } else {
            \App\Models\Company::create($validated);
        }
        
        return back()->with('message', 'Company information updated successfully.');
    }

    /**
     * Update Legal & Tax Info
     */
public function updateLegal(Request $request)
{
    $validated = $request->validate([
        'legal_name' => 'nullable|string|max:255',
        'tax_id' => 'nullable|string|max:100',
        'business_type' => 'nullable|string',
        'legal_address' => 'nullable|string',
    ]);

    $company = $this->getActiveCompany();
    if ($company) {
        $company->update($validated);
    } else {
        \App\Models\Company::create($validated);
    }

    return back()->with('message', 'Legal information updated successfully.');
}
    /**
     * Update Alerts Settings
     */
    public function updateAlerts(Request $request)
    {
        $validated = $request->validate([
            'low_stock_to_emails' => 'nullable|string',
            'low_stock_cc_emails' => 'nullable|string',
            'low_stock_bcc_emails' => 'nullable|string',
        ]);

        $this->getSettings()->update($validated);

        return back()->with('message', 'Alerts settings updated successfully.');
    }

// Update Accounting Settings

public function updateAccounting(Request $request)
{
    $validated = $request->validate([
        'acct_method' => 'required|string|max:50',
        'fin_year_start' => 'required|string|max:20',
        'tax_year_start' => 'required|string|max:50',
        'tax_form' => 'required|string|max:100',
        'books_lock_date' => 'nullable|date',
        'books_lock_pin' => 'nullable|string|size:6',
        'current_pin' => 'nullable|string',
    ]);

    $settings = $this->getSettings();
    $updateData = [
        'acct_method' => $validated['acct_method'],
        'fin_year_start' => $validated['fin_year_start'],
        'tax_year_start' => $validated['tax_year_start'],
        'tax_form' => $validated['tax_form'],
        'books_lock_date' => $validated['books_lock_date'],
    ];

    if ($validated['books_lock_date']) {
        if ($settings->books_lock_pin && $settings->books_lock_date) {
            // Modifying existing lock
            if (!$validated['current_pin']) {
                throw ValidationException::withMessages(['current_pin' => 'Current PIN is required to change lock settings.']);
            }
            if (!Hash::check($validated['current_pin'], $settings->books_lock_pin)) {
                throw ValidationException::withMessages(['current_pin' => 'Current PIN is incorrect.']);
            }
        }
        if ($validated['books_lock_pin']) {
            $updateData['books_lock_pin'] = Hash::make($validated['books_lock_pin']);
        }
    } else {
        // Removing lock
        if ($settings->books_lock_pin) {
            if (!$validated['current_pin']) {
                throw ValidationException::withMessages(['current_pin' => 'Current PIN is required to remove lock.']);
            }
            if (!Hash::check($validated['current_pin'], $settings->books_lock_pin)) {
                throw ValidationException::withMessages(['current_pin' => 'Current PIN is incorrect.']);
            }
        }
        $updateData['books_lock_date'] = null;
        $updateData['books_lock_pin'] = null;
    }

    $settings->update($updateData);
    return back()->with('message', 'Accounting settings updated successfully.');
}

    /**
     * Update Currency Settings
     */
    public function updateCurrency(Request $request)
    {
        $validated = $request->validate([
            'multi_currency_enabled' => 'required|boolean',
            'home_currency_id' => 'nullable|exists:currencies,id',
        ]);

        $company = $this->getActiveCompany();
        if ($company) {
            $company->update($validated);
        } else {
            return back()->withErrors(['home_currency_id' => 'Please save your company information first before updating currency settings.']);
        }

        return back()->with('message', 'Currency settings updated successfully.');
    }

    /**
     * Update Layout Settings
     */
    public function updateLayout(Request $request)
    {
        $validated = $request->validate([
            'pos_layout_enabled' => 'required|boolean',
        ]);

        $this->getSettings()->update($validated);
        return back()->with('message', 'Layout settings updated successfully.');
    }

    public function updateWarrantyLayout(Request $request)
    {
        $validated = $request->validate([
            'warranty_layout_enabled' => 'required|boolean',
        ]);

        $this->getSettings()->update(['warranty_layout_enabled' => $validated['warranty_layout_enabled']]);
        
        $this->handleModuleMigrations('service_station', $validated['warranty_layout_enabled']);

        return back()->with('message', 'Warranty layout settings updated successfully.');
    }

    public function updateJobLayout(Request $request)
    {
        $validated = $request->validate([
            'job_layout_enabled' => 'required|boolean',
        ]);

        $this->getSettings()->update(['job_layout_enabled' => $validated['job_layout_enabled']]);
        
        $this->handleModuleMigrations('service_station', $validated['job_layout_enabled']);

        return back()->with('message', 'Job layout settings updated successfully.');
    }

    public function updateCustomerLayout(Request $request)
    {
        $validated = $request->validate([
            'customer_layout_modal' => 'required|boolean',
        ]);

        $this->getSettings()->update($validated);
        return back()->with('message', 'Customer layout settings updated successfully.');
    }

    public function updateReportsDisplayStyle(Request $request)
    {
        $validated = $request->validate([
            'reports_display_as_buttons' => 'required|boolean',
        ]);

        $this->getSettings()->update($validated);
        return back()->with('message', 'Reports display style updated successfully.');
    }

    public function updateVehiclesEnabled(Request $request)
    {
        $validated = $request->validate([
            'vehicles_enabled' => 'required|boolean',
        ]);

        $this->getSettings()->update(['vehicles_enabled' => $validated['vehicles_enabled']]);
        
        $this->handleModuleMigrations('service_station', $validated['vehicles_enabled']);

        return back()->with('message', 'Vehicles setting updated successfully.');
    }

    public function updateBranchesEnabled(Request $request)
    {
        $validated = $request->validate([
            'branches_enabled' => 'required|boolean',
            'drop_tables' => 'nullable|boolean',
        ]);

        $this->getSettings()->update(['branches_enabled' => $validated['branches_enabled']]);
        
        return back()->with('message', 'Branches setting updated successfully.');
    }

    public function updateBusinessType(Request $request)
    {
        $validated = $request->validate([
            'business_type' => 'required|string|in:Normal,Fuel Station,Service Station,Dealership',
            'drop_tables' => 'nullable|boolean',
        ]);

        $settings = $this->getSettings();
        $dropTables = $request->boolean('drop_tables');
        $type = $validated['business_type'];

        // Assign business type
        $settings->update([
            'business_type' => $type
        ]);

        $company = $this->getActiveCompany();
        if ($company) {
            $company->update(['business_type' => $type]);
        }

        if ($type === 'Dealership') {
            $this->handleModuleMigrations('dealership', true);
            $this->handleModuleMigrations('service_station', true);
            $settings->update([
                'branches_enabled' => true,
                'business_type' => 'Dealership',
                'vehicles_enabled' => true,
                'job_layout_enabled' => true,
                'warranty_layout_enabled' => true,
            ]);
            if ($dropTables) {
                $this->handleModuleMigrations('fuel_station', false, true);
            }
        } elseif ($type === 'Fuel Station') {
            $this->handleModuleMigrations('fuel_station', true);
            $settings->update([
                'branches_enabled' => false,
                'business_type' => 'Fuel Station',
            ]);
            if ($dropTables) {
                $this->handleModuleMigrations('dealership', false, true);
                $this->handleModuleMigrations('service_station', false, true);
                $settings->update([
                    'job_layout_enabled' => false,
                    'warranty_layout_enabled' => false,
                    'vehicles_enabled' => false
                ]);
            }
        } elseif ($type === 'Service Station') {
            $this->handleModuleMigrations('service_station', true);
            $settings->update([
                'branches_enabled' => false,
                'business_type' => 'Service Station',
            ]);
            if ($dropTables) {
                $this->handleModuleMigrations('dealership', false, true);
                $this->handleModuleMigrations('fuel_station', false, true);
            }
        } else { // Normal
            if ($dropTables) {
                $this->handleModuleMigrations('dealership', false, true);
                $this->handleModuleMigrations('fuel_station', false, true);
                $this->handleModuleMigrations('service_station', false, true);
                $settings->update([
                    'job_layout_enabled' => false,
                    'warranty_layout_enabled' => false,
                    'vehicles_enabled' => false
                ]);
            }
        }

        return back()->with('message', 'Business Type updated successfully.');
    }

    /**
     * Handle Logo Upload
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $company = $this->getActiveCompany();
        if (!$company) {
            return back()->withErrors(['logo' => 'Please save your company information first before uploading a logo.']);
        }

        if ($request->hasFile('logo')) {
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }

            $path = $request->file('logo')->store($company->id . '/logo', 'public');
            
            $company->update(['logo_path' => $path]);
        }

        return back()->with('message', 'Logo uploaded successfully.');
    }
}
