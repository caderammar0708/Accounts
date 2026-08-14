<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceStation\Warranty;
use App\Models\Accounting\SalesInvoice;
use Inertia\Inertia;

class WarrantyController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $warranties = Warranty::with(['warrantyPolicy', 'vehicle.customer', 'customer', 'invoiceItem.invoice'])
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($search, function ($query, $search) {
                $searchTerm = "%{$search}%";

                return $query->whereHas('customer', function ($q) use ($searchTerm) {
                    $q->where('display_name', 'like', $searchTerm);
                })->orWhereHas('vehicle', function ($q) use ($searchTerm) {
                    $q->where('vehicle_no', 'like', $searchTerm);
                })->orWhereHas('invoiceItem.invoice', function ($q) use ($searchTerm) {
                    $q->where('receipt_no', 'like', $searchTerm);
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('ServiceStation/Warranties/Index', [
            'warranties' => $warranties,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(Warranty $warranty)
    {
        $warranty->load(['warrantyPolicy', 'vehicle.customer', 'customer', 'invoiceItem.invoice', 'claims.resolvedInvoice']);

        $warranty->start_date = $warranty->start_date ? \Carbon\Carbon::parse($warranty->start_date)->format('M j, Y') : null;
        $warranty->end_date = $warranty->end_date ? \Carbon\Carbon::parse($warranty->end_date)->format('M j, Y') : null;

        foreach ($warranty->claims as $claim) {
            $claim->claim_date = $claim->claim_date ? \Carbon\Carbon::parse($claim->claim_date)->format('M j, Y') : null;
        }

        $resolvedInvoices = SalesInvoice::orderBy('receipt_no')->limit(50)->get();

        return Inertia::render('ServiceStation/Warranties/Show', [
            'warranty' => $warranty,
            'resolvedInvoices' => $resolvedInvoices,
        ]);
    }
}
