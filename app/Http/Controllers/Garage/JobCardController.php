<?php

namespace App\Http\Controllers\Garage;

use App\Http\Controllers\Controller;
use App\Models\ServiceStation\JobCard;
use App\Models\Customer;
use App\Models\Device;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $jobCards = JobCard::with(['customer', 'device'])
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);
            
        return Inertia::render('ServiceStation/JobCards/Index', [
            'jobCards' => $jobCards,
            'filters' => $request->only('status')
        ]);
    }

    public function create()
    {
        $customers = Customer::with('devices')->get();
        return Inertia::render('ServiceStation/JobCards/Form', [
            'customers' => $customers
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'device_id' => 'nullable|exists:devices,id',
            'service_date' => 'required|date',
            'complaint' => 'nullable|string',
            'technician_assigned' => 'nullable|string',
            'estimated_delivery_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric',
            'status' => 'required|string',
        ]);

        // Auto generate job card number
        $latest = JobCard::query()->latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $validated['job_card_number'] = 'JC-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
        
        $jobCard = JobCard::create($validated);

        if ($request->hasFile('photos')) {
            $photos = [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('job_cards/photos', 'public');
                $photos[] = $path;
            }
            $jobCard->update(['photos' => $photos]);
        }

        return redirect()->route('job-cards.index')->with('success', 'Job Card created successfully.');
    }

    public function show(JobCard $jobCard)
    {
        $jobCard->load(['customer', 'device']);
        return Inertia::render('ServiceStation/JobCards/Show', [
            'jobCard' => $jobCard
        ]);
    }

    public function edit(JobCard $jobCard)
    {
        $jobCard->load(['customer', 'device']);
        $customers = Customer::with('devices')->get();
        return Inertia::render('ServiceStation/JobCards/Form', [
            'jobCard' => $jobCard,
            'customers' => $customers
        ]);
    }

    public function update(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'device_id' => 'nullable|exists:devices,id',
            'service_date' => 'required|date',
            'complaint' => 'nullable|string',
            'technician_assigned' => 'nullable|string',
            'estimated_delivery_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric',
            'status' => 'required|string',
            'customer_signature' => 'nullable|string'
        ]);

        $jobCard->update($validated);

        if ($request->hasFile('photos')) {
            $photos = $jobCard->photos ?? [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('job_cards/photos', 'public');
                $photos[] = $path;
            }
            $jobCard->update(['photos' => $photos]);
        }

        return redirect()->route('job-cards.index')->with('success', 'Job Card updated successfully.');
    }

    public function destroy(JobCard $jobCard)
    {
        if ($jobCard->photos) {
            foreach ($jobCard->photos as $photo) {
                Storage::disk('public')->delete($photo);
            }
        }
        $jobCard->delete();
        return redirect()->route('job-cards.index')->with('success', 'Job Card deleted successfully.');
    }
}
