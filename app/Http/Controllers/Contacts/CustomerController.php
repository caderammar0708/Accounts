<?php

namespace App\Http\Controllers\Contacts;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use Inertia\Inertia;

class CustomerController extends Controller
{
    // First customer gets this number; every one after increments by 1.
    private const STARTING_CUSTOMER_NUMBER = 1211;

    private function nextCustomerNumber(): int
    {
        $max = Customer::max('customer_number');
        return $max ? $max + 1 : self::STARTING_CUSTOMER_NUMBER;
    }

    public function index(Request $request)
    {
        $customers = Customer::orderBy('display_name')->get();
        if ($request->wantsJson()) {
            return response()->json($customers);
        }
        return Inertia::render('Contacts/CustomerIndex', [
            'customers' => $customers
        ]);
    }

    public function create()
    {
        return Inertia::render('Contacts/CustomerForm', [
            'nextCustomerNumber' => $this->nextCustomerNumber(),
        ]);
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Contacts/CustomerForm', [
            'customer' => $customer,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'display_name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_number' => 'nullable|string|max:255',
            'nic' => 'nullable|string|max:50',
            'passport' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'opening_balance' => 'nullable|numeric',
        ]);

        $validatedData['opening_balance'] = $validatedData['opening_balance'] ?? 0;

        // Assigned here, not trusted from the frontend, to avoid race conditions
        // between two people creating a customer at the same time.
        $validatedData['customer_number'] = $this->nextCustomerNumber();

        $customer = Customer::create($validatedData);

        return redirect()->route('customers.index')->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $validatedData = $request->validate([
            'display_name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_number' => 'nullable|string|max:255',
            'nic' => 'nullable|string|max:50',
            'passport' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
        ]);
        // customer_number is intentionally excluded — it's assigned once at creation and never changes.

        $customer->update($validatedData);

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
