<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FuelStation\TankDipReading;
use App\Models\FuelStation\Tank;
use App\Models\Company;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TankDipReadingController extends Controller
{
    public function index(Request $request)
    {
        $companyId = Company::current()?->id;
        
        $query = TankDipReading::with(['tank', 'creator'])
            ->when($companyId, fn($q) => $q->where('company_id', $companyId))
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');
            
        if ($request->has('tank_id') && $request->tank_id) {
            $query->where('tank_id', $request->tank_id);
        }
        
        $dipReadings = $query->paginate(15)->withQueryString();
        
        $tanks = Tank::orderBy('name')
            ->get(['id', 'name', 'current_stock', 'capacity']);
            
        return Inertia::render('FuelStation/DipReadings/Index', [
            'dipReadings' => $dipReadings,
            'tanks' => $tanks,
            'filters' => request()->all('tank_id')
        ]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'tank_id' => 'required|exists:tanks,id',
            'date' => 'required|date',
            'physical_dip' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);
        
        $tank = Tank::findOrFail($request->tank_id);
        $bookStock = $tank->current_stock ?? 0;
        $variance = $request->physical_dip - $bookStock;
        
        TankDipReading::create([
            'company_id' => Company::current()?->id,
            'tank_id' => $tank->id,
            'date' => Carbon::parse($request->date)->format('Y-m-d'),
            'book_stock' => $bookStock,
            'physical_dip' => $request->physical_dip,
            'variance' => $variance,
            'notes' => $request->notes,
            'created_by' => Auth::id(),
        ]);
        
        return redirect()->back()->with('success', 'Dip reading recorded successfully.');
    }
    
    public function destroy($id)
    {
        $dipReading = TankDipReading::findOrFail($id);
        $dipReading->delete();
        return redirect()->back()->with('success', 'Dip reading deleted successfully.');
    }
}
