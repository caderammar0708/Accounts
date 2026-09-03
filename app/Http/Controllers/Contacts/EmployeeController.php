<?php

namespace App\Http\Controllers\Contacts;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\User;
use App\Models\HR\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with('shift')->get();
        return Inertia::render('Team/EmployeeIndex', [
            'employees' => $employees,
            'departments' => Employee::whereNotNull('department')->pluck('department')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'designations' => Employee::whereNotNull('designation')->pluck('designation')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'shifts' => Shift::select('id as value', 'name as label')->get(),
        ]);
    }

    public function edit(Employee $employee)
    {
        $employee->load(['shift']);
        return Inertia::render('Team/Profile/EditGeneral', [
            'employee' => $employee,
            'departments' => Employee::whereNotNull('department')->pluck('department')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'designations' => Employee::whereNotNull('designation')->pluck('designation')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'shifts' => Shift::select('id as value', 'name as label')->get(),
            'managers' => Employee::select('id as value', 'name as label')->where('id', '!=', $employee->id)->get(),
        ]);
    }

    public function editSalary(Employee $employee)
    {
        $employee->load(['salaryStructure']);
        
        $company = \App\Models\CompanySetting::first();

        return Inertia::render('Team/Profile/EditSalary', [
            'employee' => $employee,
            'company' => $company,
        ]);
    }

    public function editAttendance(Employee $employee)
    {
        $employee->load(['shift']);
        return Inertia::render('Team/Profile/EditAttendance', [
            'employee' => $employee,
            'shifts' => Shift::select('id as value', 'name as label')->get(),
        ]);
    }

    public function editDocuments(Employee $employee)
    {
        return Inertia::render('Team/Profile/EditDocuments', [
            'employee' => $employee,
        ]);
    }

    public function editSecurity(Employee $employee)
    {
        return Inertia::render('Team/Profile/EditSecurity', [
            'employee' => $employee,
        ]);
    }

    public function create()
    {
        return Inertia::render('Team/EmployeeForm', [
            'departments' => Employee::whereNotNull('department')->pluck('department')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'designations' => Employee::whereNotNull('designation')->pluck('designation')->unique()->values()->map(fn($d) => ['value' => $d, 'label' => $d]),
            'shifts' => Shift::select('id as value', 'name as label')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:employees,email',
            'department' => 'nullable|string|max:255',
            'designation' => 'required|string|max:255',
            'salary' => 'nullable|numeric',
            'salary_type' => 'nullable|string|in:Fixed,Hourly',
            'hours_per_day' => 'nullable|numeric|min:0|max:24',
            'sales_commission_rate' => 'nullable|numeric|min:0|max:100',
            'join_date' => 'nullable|date',
            
            'calling_name' => 'nullable|string|max:255',
            'nic' => 'nullable|string|max:50',
            'dob' => 'nullable|date',
            'shift_id' => 'nullable|exists:shifts,id',
            'left_date' => 'nullable|date',
            
            'is_field_staff' => 'boolean',
            'is_manager' => 'boolean',
            'is_auto_attendance' => 'boolean',
            
            'probation_duration_months' => 'nullable|integer|min:0',
            'probation_status' => 'nullable|string|max:50',
            'probation_confirmed_date' => 'nullable|date',
        ]);

        // Create Employee record directly
        $employee = Employee::create([
            'name' => $request->name,
            'email' => $request->email,
            'department' => $request->department,
            'designation' => $request->designation,
            'salary' => $request->salary,
            'salary_type' => $request->salary_type,
            'hours_per_day' => $request->hours_per_day,
            'sales_commission_rate' => $request->sales_commission_rate,
            'join_date' => $request->join_date,
            'employee_id' => 'EMP-' . rand(1000, 9999),
            
            'calling_name' => $request->calling_name,
            'nic' => $request->nic,
            'dob' => $request->dob,
            'shift_id' => $request->shift_id,
            'left_date' => $request->left_date,
            'is_field_staff' => $request->is_field_staff ?? false,
            'is_manager' => $request->is_manager ?? false,
            'is_auto_attendance' => $request->is_auto_attendance ?? false,
            'probation_duration_months' => $request->probation_duration_months,
            'probation_status' => $request->probation_status ?? 'probation',
            'probation_confirmed_date' => $request->probation_confirmed_date,
        ]);

        return redirect()->back()->with([
            'success' => 'Employee created successfully.',
            'new_employee' => [
                'value' => $employee->id,
                'label' => $employee->name,
                'type' => 'Employee'
            ]
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:employees,email,' . $employee->id,
            'department' => 'nullable|string|max:255',
            'designation' => 'required|string|max:255',
            'salary' => 'nullable|numeric',
            'salary_type' => 'nullable|string|in:Fixed,Hourly',
            'hours_per_day' => 'nullable|numeric|min:0|max:24',
            'sales_commission_rate' => 'nullable|numeric|min:0|max:100',
            'join_date' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'employment_type' => 'nullable|string|max:50',
            'manager_ids' => 'nullable|array',
            'manager_ids.*' => 'exists:employees,id',
            
            'calling_name' => 'nullable|string|max:255',
            'nic' => 'nullable|string|max:50',
            'dob' => 'nullable|date',
            'shift_id' => 'nullable|exists:shifts,id',
            'left_date' => 'nullable|date',
            
            'is_field_staff' => 'boolean',
            'is_manager' => 'boolean',
            'is_auto_attendance' => 'boolean',
            
            'probation_duration_months' => 'nullable|integer|min:0',
            'probation_status' => 'nullable|string|max:50',
            'probation_confirmed_date' => 'nullable|date',
        ]);

        $employee->update($request->only([
            'name', 'email', 'department', 'designation', 'salary', 'salary_type', 'hours_per_day', 'sales_commission_rate', 'join_date',
            'phone', 'mobile', 'address', 'employment_type',
            'calling_name', 'nic', 'dob', 'shift_id', 'left_date', 
            'is_field_staff', 'is_manager', 'is_auto_attendance',
            'probation_duration_months', 'probation_status', 'probation_confirmed_date'
        ]));

        if ($request->has('manager_ids')) {
            $employee->managers()->sync($request->manager_ids);
        }

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function updateSalary(Request $request, Employee $employee)
    {
        $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'ot_rate_per_hour' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'loan_deduction' => 'nullable|numeric|min:0',
            'leave_deduction' => 'nullable|numeric|min:0',
            'income_tax' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'deduct_epf' => 'boolean',
            'deduct_etf' => 'boolean',
            'deduct_tax' => 'boolean',
        ]);

        $employee->salaryStructure()->updateOrCreate(
            ['employee_id' => $employee->id],
            $request->only([
                'basic_salary', 'ot_rate_per_hour', 'bonus', 'loan_deduction',
                'leave_deduction', 'income_tax', 'allowances', 'deductions',
                'deduct_epf', 'deduct_etf', 'deduct_tax'
            ])
        );

        return redirect()->back()->with('success', 'Salary structure updated successfully.');
    }

    public function updateDocuments(Request $request, Employee $employee)
    {
        $request->validate([
            'photo' => 'nullable|image|max:2048',
            'cv' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'id_copy' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $paths = [];
        if ($request->hasFile('photo')) $paths['photo'] = $request->file('photo')->store('employees/photos', 'public');
        if ($request->hasFile('cv')) $paths['cv_path'] = $request->file('cv')->store('employees/cvs', 'public');
        if ($request->hasFile('id_copy')) $paths['id_copy_path'] = $request->file('id_copy')->store('employees/ids', 'public');
        if ($request->hasFile('certificate')) $paths['certificate_path'] = $request->file('certificate')->store('employees/certificates', 'public');

        if (!empty($paths)) {
            $employee->update($paths);
        }

        return redirect()->back()->with('success', 'Documents updated successfully.');
    }

    public function updateSecurity(Request $request, Employee $employee)
    {
        $request->validate([
            'password' => 'required|string|min:4|confirmed',
        ]);

        // Security update logic here (e.g., updating a User model if they have mobile app access)
        
        return redirect()->back()->with('success', 'Security settings updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return redirect()->back()->with('success', 'Employee removed successfully.');
    }
}
