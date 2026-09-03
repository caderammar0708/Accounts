<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CompanySetting;

class HRSettingsController extends Controller
{
    public function remoteCheckin(Request $request)
    {
        return Inertia::render('Settings/HRSettings/RemoteCheckin', [
            'settings' => CompanySetting::current()
        ]);
    }

    public function updateRemoteCheckin(Request $request)
    {
        $validated = $request->validate([
            'remote_checkin_auto_approve' => 'boolean',
            'prayer_break_auto_approve' => 'boolean',
        ]);
        
        $settings = CompanySetting::current();
        $settings->update($validated);
        
        return back()->with('success', 'Remote check-in settings updated successfully.');
    }

    public function leaveNotification(Request $request)
    {
        return Inertia::render('Settings/HRSettings/LeaveNotification', [
            'settings' => CompanySetting::current()
        ]);
    }

    public function updateLeaveNotification(Request $request)
    {
        $validated = $request->validate([
            'receiver_email' => 'nullable|email',
            'cc_emails' => 'nullable|string',
            'bcc_emails' => 'nullable|string',
        ]);
        
        $settings = CompanySetting::current();
        $settings->update($validated);
        
        return back()->with('success', 'Leave notification settings updated successfully.');
    }

    public function payroll(Request $request)
    {
        return Inertia::render('Settings/HRSettings/Payroll', [
            'settings' => CompanySetting::current()
        ]);
    }

    public function updatePayroll(Request $request)
    {
        $validated = $request->validate([
            'basic_salary_percentage' => 'numeric|min:0|max:100',
            'allowance_percentage' => 'numeric|min:0|max:100',
            'epf_employee_percentage' => 'numeric|min:0|max:100',
            'epf_employer_percentage' => 'numeric|min:0|max:100',
            'etf_employer_percentage' => 'numeric|min:0|max:100',
        ]);
        
        $settings = CompanySetting::current();
        $settings->update($validated);
        
        return back()->with('success', 'Payroll settings updated successfully.');
    }

    public function qr(Request $request)
    {
        return Inertia::render('Settings/HRSettings/QRSettings', [
            'settings' => CompanySetting::current()
        ]);
    }

    public function updateQr(Request $request)
    {
        $validated = $request->validate([
            'qr_type' => 'required|in:Static,Dynamic',
            'qr_dynamic_interval' => 'nullable|integer|min:1',
        ]);
        
        $settings = CompanySetting::current();
        $settings->update($validated);
        
        return back()->with('success', 'QR settings updated successfully.');
    }
}
