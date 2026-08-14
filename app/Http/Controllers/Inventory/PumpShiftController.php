<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\FuelStation\PumpShift;
use App\Models\FuelStation\PumpShiftNozzle;
use App\Models\Employee;
use App\Models\FuelStation\Pump;
use App\Models\FuelStation\Nozzle;
use App\Models\ChartOfAcc;
use App\Models\Customer;
use App\Models\FuelStation\PumpShiftCollection;
use App\Models\FuelStation\PumpShiftCreditSale;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PumpShiftController extends Controller
{
    public function index(Request $request)
    {
        
        $activeQuery = PumpShift::with(['employee', 'shiftNozzles.nozzle'])
            ->where('status', 'open');
            
        $pendingQuery = PumpShift::with(['employee', 'shiftNozzles.nozzle'])
            ->where('status', 'pending_collection');
            
        $closedQuery = PumpShift::with(['employee', 'shiftNozzles.nozzle'])
            ->where('status', 'closed');

        if ($request->start_date) {
            $activeQuery->whereDate('start_time', '>=', $request->start_date);
            $pendingQuery->whereDate('start_time', '>=', $request->start_date);
            $closedQuery->whereDate('end_time', '>=', $request->start_date);
        }
        
        if ($request->end_date) {
            $activeQuery->whereDate('start_time', '<=', $request->end_date);
            $pendingQuery->whereDate('start_time', '<=', $request->end_date);
            $closedQuery->whereDate('end_time', '<=', $request->end_date);
        }
            
        $activeShifts = $activeQuery->latest('start_time')->get();
        $pendingShifts = $pendingQuery->latest('start_time')->get();
        $closedShifts = $closedQuery->latest('end_time')->limit(50)->get();
            
        return Inertia::render('FuelStation/Shifts/Index', [
            'activeShifts' => $activeShifts,
            'pendingShifts' => $pendingShifts,
            'closedShifts' => $closedShifts,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    public function create()
    {
        $employees = Employee::withoutGlobalScope(\App\Scopes\LocationScope::class)->get();
        $pumps = Pump::with(['nozzles' => function ($q) {
            $q->orderBy('order_no')->orderBy('name');
        }, 'nozzles.tank.fuel_type'])->get();
            
        $pumps = $pumps->map(function($pump) {
            $pump->nozzles = $pump->nozzles->map(function($nozzle) {
                $lastReading = PumpShiftNozzle::where('nozzle_id', $nozzle->id)
                    ->whereNotNull('closing_reading')
                    ->latest('updated_at')
                    ->first();
                $nozzle->last_reading = $lastReading ? $lastReading->closing_reading : 0;
                return $nozzle;
            });
            return $pump;
        });

        $lastShift = PumpShift::latest('end_time')->first();
        $lastEndTime = $lastShift ? ($lastShift->end_time ?? $lastShift->start_time) : now();

        return Inertia::render('FuelStation/Shifts/Create', [
            'employees' => $employees,
            'pumps' => $pumps,
            'lastEndTime' => $lastEndTime,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'nozzles' => 'required|array|min:1',
            'nozzles.*.id' => 'required|exists:nozzles,id',
            'nozzles.*.opening_reading' => 'required|numeric|min:0'
        ]);

        DB::transaction(function() use ($request) {
            $shift = PumpShift::create([
                'employee_id' => $request->employee_id,
                'start_time' => $request->start_time ?? now(),
                'status' => 'open'
            ]);

            foreach ($request->nozzles as $nozzleData) {
                $nozzleModel = Nozzle::with('tank.fuel_type')->find($nozzleData['id']);
                $price = 0;
                if ($nozzleModel && $nozzleModel->tank && $nozzleModel->tank->fuel_type) {
                    $price = $nozzleModel->tank->fuel_type->sale_price;
                }

                PumpShiftNozzle::create([
                    'pump_shift_id' => $shift->id,
                    'nozzle_id' => $nozzleData['id'],
                    'opening_reading' => $nozzleData['opening_reading'],
                    'price_per_liter' => $price
                ]);
            }
        });

        return redirect()->route('shifts.index')->with('success', 'Shift started successfully.');
    }

    public function editActive(PumpShift $shift)
    {
        $shift->load(['shiftNozzles']);
        $employees = Employee::withoutGlobalScope(\App\Scopes\LocationScope::class)->get();
        $pumps = Pump::with(['nozzles' => function ($q) {
            $q->orderBy('order_no')->orderBy('name');
        }, 'nozzles.tank.fuel_type'])->get();
            
        $pumps = $pumps->map(function($pump) use ($shift) {
            $pump->nozzles = $pump->nozzles->map(function($nozzle) use ($shift) {
                $shiftNozzle = $shift->shiftNozzles->firstWhere('nozzle_id', $nozzle->id);
                if ($shiftNozzle) {
                    $nozzle->last_reading = $shiftNozzle->opening_reading;
                    $nozzle->is_in_shift = true;
                } else {
                    $lastReading = PumpShiftNozzle::where('nozzle_id', $nozzle->id)
                        ->where('pump_shift_id', '!=', $shift->id)
                        ->whereNotNull('closing_reading')
                        ->latest('updated_at')
                        ->first();
                    $nozzle->last_reading = $lastReading ? $lastReading->closing_reading : 0;
                    $nozzle->is_in_shift = false;
                }
                return $nozzle;
            });
            return $pump;
        });

        return Inertia::render('FuelStation/Shifts/Create', [
            'shift' => $shift,
            'employees' => $employees,
            'pumps' => $pumps
        ]);
    }

    public function updateActive(Request $request, PumpShift $shift)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'nozzles' => 'required|array|min:1',
            'nozzles.*.id' => 'required|exists:nozzles,id',
            'nozzles.*.opening_reading' => 'required|numeric|min:0'
        ]);

        DB::transaction(function() use ($request, $shift) {
            $shift->update([
                'employee_id' => $request->employee_id,
                'start_time' => $request->start_time ?? now(),
            ]);

            $requestedNozzleIds = collect($request->nozzles)->pluck('id')->toArray();
            
            PumpShiftNozzle::where('pump_shift_id', $shift->id)
                ->whereNotIn('nozzle_id', $requestedNozzleIds)
                ->delete();

            foreach ($request->nozzles as $nozzleData) {
                $shiftNozzle = PumpShiftNozzle::where('pump_shift_id', $shift->id)
                    ->where('nozzle_id', $nozzleData['id'])
                    ->first();

                if ($shiftNozzle) {
                    $shiftNozzle->update([
                        'opening_reading' => $nozzleData['opening_reading']
                    ]);
                } else {
                    $nozzleModel = Nozzle::with('tank.fuel_type')->find($nozzleData['id']);
                    $price = 0;
                    if ($nozzleModel && $nozzleModel->tank && $nozzleModel->tank->fuel_type) {
                        $price = $nozzleModel->tank->fuel_type->sale_price;
                    }
    
                    PumpShiftNozzle::create([
                        'pump_shift_id' => $shift->id,
                        'nozzle_id' => $nozzleData['id'],
                        'opening_reading' => $nozzleData['opening_reading'],
                        'price_per_liter' => $price
                    ]);
                }
            }
        });

        return redirect()->route('shifts.index')->with('success', 'Active shift updated successfully.');
    }

    public function edit(PumpShift $shift)
    {
        $shift->load(['employee', 'shiftNozzles.nozzle.pump', 'shiftNozzles.nozzle.tank.fuel_type']);
        $shift->setRelation('shiftNozzles', $shift->shiftNozzles->sortBy(function($sn) {
            return ($sn->nozzle->order_no ?? 0) . '-' . ($sn->nozzle->name ?? '');
        })->values());
        
        return Inertia::render('FuelStation/Shifts/Close', [
            'shift' => $shift
        ]);
    }

    public function update(Request $request, PumpShift $shift)
    {
        $request->validate([
            'nozzles' => 'required|array',
            'nozzles.*.id' => 'required|exists:pump_shift_nozzles,id',
            'nozzles.*.opening_reading' => 'required|numeric',
            'nozzles.*.closing_reading' => 'required|numeric',
            'end_time' => 'nullable|date'
        ]);

        // Manual validation for closing >= opening
        $errors = [];
        foreach ($request->nozzles as $index => $nData) {
            if (isset($nData['closing_reading']) && isset($nData['opening_reading'])) {
                if ($nData['closing_reading'] < $nData['opening_reading']) {
                    $errors["nozzles.{$index}.closing_reading"] = "Closing reading must be at least {$nData['opening_reading']}.";
                }
            }
        }
        
        if (!empty($errors)) {
            throw \Illuminate\Validation\ValidationException::withMessages($errors);
        }

        DB::transaction(function() use ($request, $shift) {
            $totalSalesValue = 0;

            foreach ($request->nozzles as $nData) {
                $shiftNozzle = PumpShiftNozzle::find($nData['id']);
                if ($shiftNozzle && $shiftNozzle->pump_shift_id == $shift->id) {
                    $opening = $nData['opening_reading'];
                    $closing = $nData['closing_reading'];
                    $volume = $closing - $opening;
                    $value = $volume * $shiftNozzle->price_per_liter;
                    
                    $shiftNozzle->update([
                        'opening_reading' => $opening,
                        'closing_reading' => $closing,
                        'volume_sold' => $volume,
                        'total_value' => $value
                    ]);
                    
                    $totalSalesValue += $value;
                }
            }

            $shift->update([
                'end_time' => $request->end_time ?? now(),
                'status' => 'pending_collection',
                'total_sales_value' => $totalSalesValue,
            ]);
        });

        return redirect()->route('shifts.index')->with('success', 'Shift meter readings closed. Please enter collections.');
    }

    public function editCollections(PumpShift $shift)
    {
        $shift->load(['employee', 'shiftNozzles.nozzle.pump.tank.fuel_type', 'collections', 'creditSales']);
        
        $accounts = ChartOfAcc::get();
        $customers = Customer::get();

        return Inertia::render('FuelStation/Shifts/Collections', [
            'shift' => $shift,
            'accounts' => $accounts,
            'customers' => $customers
        ]);
    }

    public function saveDraft(Request $request, PumpShift $shift)
    {
        $request->validate([
            'collections' => 'nullable|array',
            'collections.*.chart_of_acc_id' => 'required|exists:chart_of_accs,id',
            'collections.*.amount' => 'required|numeric|min:0',
            'credit_sales' => 'nullable|array',
            'credit_sales.*.customer_id' => 'required|exists:customers,id',
            'credit_sales.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function() use ($request, $shift) {
            $shift->collections()->delete();
            $shift->creditSales()->delete();

            if ($request->collections) {
                foreach ($request->collections as $collection) {
                    $amt = floatval($collection['amount'] ?? 0);
                    if ($amt > 0) {
                        PumpShiftCollection::create([
                            'pump_shift_id' => $shift->id,
                            'chart_of_acc_id' => $collection['chart_of_acc_id'],
                            'description' => $collection['description'] ?? null,
                            'amount' => $amt
                        ]);
                    }
                }
            }

            if ($request->credit_sales) {
                foreach ($request->credit_sales as $sale) {
                    $amt = floatval($sale['amount'] ?? 0);
                    if ($amt > 0) {
                        PumpShiftCreditSale::create([
                            'pump_shift_id' => $shift->id,
                            'customer_id' => $sale['customer_id'],
                            'description' => $sale['description'] ?? null,
                            'amount' => $amt
                        ]);
                    }
                }
            }
            $shift->update(['status' => 'pending_collection']);
        });

        return redirect()->route('shifts.index')->with('success', 'Shift draft saved.');
    }

    public function reopen(PumpShift $shift)
    {
        DB::transaction(function() use ($shift) {
            $jes = JournalEntry::where('transactionable_type', \App\Models\FuelStation\PumpShift::class)
                ->where('transactionable_id', $shift->id)->get();
            foreach ($jes as $je) {
                $je->lines()->delete();
                $je->delete();
            }
            
            $invoices = \App\Models\Accounting\SalesInvoice::where('pump_shift_id', $shift->id)->get();
            foreach ($invoices as $invoice) {
                $invJes = JournalEntry::where('transactionable_type', \App\Models\Accounting\SalesInvoice::class)
                    ->where('transactionable_id', $invoice->id)->get();
                foreach ($invJes as $je) {
                    $je->lines()->delete();
                    $je->delete();
                }
                $invoice->items()->delete();
                $invoice->delete();
            }

            $shift->update(['status' => 'pending_collection']);
        });

        return redirect()->route('shifts.collections.edit', $shift->id)->with('success', 'Shift reopened for editing.');
    }

    public function settle(Request $request, PumpShift $shift)
    {
        $request->validate([
            'collections' => 'nullable|array',
            'collections.*.chart_of_acc_id' => 'required|exists:chart_of_accs,id',
            'collections.*.amount' => 'required|numeric|min:0',

            'credit_sales' => 'nullable|array',
            'credit_sales.*.customer_id' => 'required|exists:customers,id',
            'credit_sales.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function() use ($request, $shift) {
            // Clean up old settlement data if re-settling
            $oldInvoices = \App\Models\Accounting\SalesInvoice::where('pump_shift_id', $shift->id)->get();
            foreach ($oldInvoices as $inv) {
                $jes = \App\Models\JournalEntry::where('transactionable_type', \App\Models\Accounting\SalesInvoice::class)
                    ->where('transactionable_id', $inv->id)
                    ->get();
                foreach ($jes as $je) {
                    $je->lines()->delete();
                    $je->delete();
                }
                \App\Models\Accounting\SalesInvoiceItem::where('sales_invoice_id', $inv->id)->delete();
                $inv->delete();
            }

            $jes = \App\Models\JournalEntry::where('transactionable_type', \App\Models\FuelStation\PumpShift::class)
                ->where('transactionable_id', $shift->id)
                ->get();
            foreach ($jes as $je) {
                $je->lines()->delete();
                $je->delete();
            }

            $shift->collections()->delete();
            $shift->creditSales()->delete();

            $totalCollections = 0;
            if ($request->collections) {
                foreach ($request->collections as $collection) {
                    $amt = floatval($collection['amount'] ?? 0);
                    if ($amt > 0) {
                        PumpShiftCollection::create([
                            'pump_shift_id' => $shift->id,
                            'chart_of_acc_id' => $collection['chart_of_acc_id'],
                            'description' => $collection['description'] ?? null,
                            'amount' => $amt
                        ]);
                        $totalCollections += $amt;
                    }
                }
            }

            $totalCreditSales = 0;
            if ($request->credit_sales) {
                foreach ($request->credit_sales as $cs) {
                    $amt = floatval($cs['amount'] ?? 0);
                    if ($amt > 0) {
                        PumpShiftCreditSale::create([
                            'pump_shift_id' => $shift->id,
                            'customer_id' => $cs['customer_id'],
                            'description' => $cs['description'] ?? null,
                            'amount' => $amt
                        ]);
                        $totalCreditSales += $amt;
                    }
                }
            }

            $totalCollected = $totalCollections + $totalCreditSales;
            $discrepancy = $totalCollected - $shift->total_sales_value;

            if (abs($discrepancy) > 0.01) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'discrepancy' => ['Total collections and credit sales must exactly match Total Sales.']
                ]);
            }

            $shift->update([
                'status' => 'closed',
                'discrepancy' => $discrepancy
            ]);

            // Accounting Integration
            $shift->load('shiftNozzles.nozzle.tank.fuel_type');
            $itemSales = [];
            foreach ($shift->shiftNozzles as $sn) {
                $item = $sn->nozzle->tank->fuel_type ?? null;
                $tank = $sn->nozzle->tank ?? null;
                if ($item) {
                    $itemId = $item->id;
                    if (!isset($itemSales[$itemId])) {
                        $itemSales[$itemId] = ['item' => $item, 'tank' => $tank, 'volume' => 0, 'value' => 0];
                    }
                    $itemSales[$itemId]['volume'] += $sn->volume_sold;
                    $itemSales[$itemId]['value'] += $sn->total_value;
                }
            }

            $mainItem = count($itemSales) > 0 ? reset($itemSales)['item'] : \App\Models\Item::firstOrCreate(
                ['name' => 'Fuel Sales'],
                [
                    'type' => 'service',
                    'income_account_id' => ChartOfAcc::getOrCreateDefault('uncategorized-income')->id,
                    'sale_price' => 0,
                    'description' => 'Generic Fuel Sales for Shift Settlement',
                    'track_inventory' => false
                ]
            );

            // Create Invoices for Credit Sales
            if ($request->credit_sales) {
                $lastInvoice = \App\Models\Accounting\SalesInvoice::where('receipt_no', 'like', 'SFT-%')
                    ->orderByRaw('CAST(SUBSTRING(receipt_no, 5) AS UNSIGNED) DESC')
                    ->first();
                $nextInvoiceNo = 1;
                if ($lastInvoice) {
                    $parts = explode('-', $lastInvoice->receipt_no);
                    if (count($parts) == 2 && is_numeric($parts[1])) {
                        $nextInvoiceNo = intval($parts[1]) + 1;
                    }
                }

                foreach ($request->credit_sales as $cs) {
                    $amt = floatval($cs['amount'] ?? 0);
                    if ($amt > 0) {
                        $invoice = \App\Models\Accounting\SalesInvoice::create([
                            'pump_shift_id' => $shift->id,
                            'customer_id' => $cs['customer_id'],
                            'receipt_date' => \Carbon\Carbon::parse($shift->start_time)->format('Y-m-d'),
                            'due_date' => \Carbon\Carbon::parse($shift->start_time)->addDays(30)->format('Y-m-d'),
                            'receipt_no' => 'SFT-' . str_pad($nextInvoiceNo++, 5, '0', STR_PAD_LEFT),
                            'total_amount' => $amt,
                            'memo' => 'Credit sale from Shift. ' . ($cs['description'] ?? ''),
                            'status' => 'posted',
                        ]);

                        \App\Models\Accounting\SalesInvoiceItem::create([
                            'sales_invoice_id' => $invoice->id,
                            'item_id' => $mainItem->id,
                            'description' => 'Fuel Sale',
                            'quantity' => 1,
                            'rate' => $amt,
                            'amount' => $amt,
                        ]);

                        $journalEntry = \App\Models\JournalEntry::create([
                            'date' => \Carbon\Carbon::parse($shift->start_time)->format('Y-m-d'),
                            'due_date' => \Carbon\Carbon::parse($shift->start_time)->addDays(30)->format('Y-m-d'),
                            'reference' => $invoice->receipt_no,
                            'description' => $invoice->memo,
                            'transaction_type' => 'invoice',
                            'payee_id' => $cs['customer_id'],
                            'payee_type' => \App\Models\Customer::class,
                            'total_amount' => $amt,
                            'status' => 'posted',
                            'created_by' => auth()->id(),
                            'transactionable_id' => $invoice->id,
                            'transactionable_type' => \App\Models\Accounting\SalesInvoice::class,
                        ]);

                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => ChartOfAcc::getOrCreateDefault('accounts-receivable')->id,
                            'payee_id' => $cs['customer_id'],
                            'payee_type' => \App\Models\Customer::class,
                            'debit' => $amt,
                            'credit' => 0,
                            'memo' => $invoice->memo,
                        ]);

                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => $mainItem->income_account_id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id,
                            'payee_id' => $cs['customer_id'],
                            'payee_type' => \App\Models\Customer::class,
                            'debit' => 0,
                            'credit' => $amt,
                            'memo' => $invoice->memo,
                        ]);
                    }
                }
            }

            // Create Journal Entry for Cash Collections and Discrepancy
            if ($totalCollections > 0 || abs($discrepancy) > 0.01) {
                $settleJournal = \App\Models\JournalEntry::create([
                    'date' => \Carbon\Carbon::parse($shift->start_time)->format('Y-m-d'),
                    'reference' => 'SHIFT-SETTLE-' . strtoupper(substr(str_replace('-', '', $shift->id), -8)),
                    'description' => 'Cash/Bank Settlement for Shift ' . $shift->id,
                    'transaction_type' => 'journal',
                    'total_amount' => $totalCollections,
                    'status' => 'posted',
                    'created_by' => auth()->id(),
                    'transactionable_id' => $shift->id,
                    'transactionable_type' => \App\Models\FuelStation\PumpShift::class,
                ]);

                // Debit Cash/Bank accounts
                if ($request->collections) {
                    foreach ($request->collections as $collection) {
                        $amt = floatval($collection['amount'] ?? 0);
                        if ($amt > 0) {
                            \App\Models\JournalEntryLine::create([
                                'journal_entry_id' => $settleJournal->id,
                                'chart_of_acc_id' => $collection['chart_of_acc_id'],
                                'debit' => $amt,
                                'credit' => 0,
                                'memo' => 'Collection for Shift ' . $shift->id,
                            ]);
                        }
                    }
                }

                // Credit Sales for the Cash Portion and COGS Processing
                $cashSales = $shift->total_sales_value - $totalCreditSales;
                $totalValueSold = $shift->total_sales_value;
                
                foreach ($itemSales as $sale) {
                    $item = $sale['item'];
                    $volume = $sale['volume'];
                    $value = $sale['value'];
                    
                    if ($item->type === 'inventory') {
                        $item->decrement('quantity_on_hand', $volume);
                        if ($sale['tank']) {
                            $sale['tank']->decrement('current_stock', $volume);
                        }
                        
                        $cogsAmount = \App\Models\InventoryBatch::deplete($item, $volume);
                        if ($cogsAmount > 0) {
                            $cogsAccount = $item->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                            $inventoryAccount = $item->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;
                            
                            \App\Models\JournalEntryLine::create([
                                'journal_entry_id' => $settleJournal->id,
                                'chart_of_acc_id' => $cogsAccount,
                                'debit' => $cogsAmount,
                                'credit' => 0,
                                'memo' => 'COGS for Shift ' . $shift->id,
                            ]);
                            \App\Models\JournalEntryLine::create([
                                'journal_entry_id' => $settleJournal->id,
                                'chart_of_acc_id' => $inventoryAccount,
                                'debit' => 0,
                                'credit' => $cogsAmount,
                                'memo' => 'Inventory reduction for Shift ' . $shift->id,
                            ]);
                        }
                    }
                    
                    if ($totalValueSold > 0) {
                        $ratio = $value / $totalValueSold;
                        $cashSalePortion = $cashSales * $ratio;
                    } else {
                        $cashSalePortion = 0;
                    }

                    if ($cashSalePortion > 0) {
                        $incomeAccount = $item->income_account_id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id;
                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $settleJournal->id,
                            'chart_of_acc_id' => $incomeAccount,
                            'debit' => 0,
                            'credit' => $cashSalePortion,
                            'memo' => 'Cash Sales (' . $item->name . ') for Shift ' . $shift->id,
                        ]);
                    } else if ($cashSalePortion < 0) {
                        $incomeAccount = $item->income_account_id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id;
                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $settleJournal->id,
                            'chart_of_acc_id' => $incomeAccount,
                            'debit' => abs($cashSalePortion),
                            'credit' => 0,
                            'memo' => 'Cash Sales Refund (' . $item->name . ') for Shift ' . $shift->id,
                        ]);
                    }
                }
                
                if (empty($itemSales) && $cashSales > 0) {
                    \App\Models\JournalEntryLine::create([
                        'journal_entry_id' => $settleJournal->id,
                        'chart_of_acc_id' => $mainItem->income_account_id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id,
                        'debit' => 0,
                        'credit' => $cashSales,
                        'memo' => 'Cash Sales for Shift ' . $shift->id,
                    ]);
                } else if (empty($itemSales) && $cashSales < 0) {
                    \App\Models\JournalEntryLine::create([
                        'journal_entry_id' => $settleJournal->id,
                        'chart_of_acc_id' => $mainItem->income_account_id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id,
                        'debit' => abs($cashSales),
                        'credit' => 0,
                        'memo' => 'Cash Sales Refund for Shift ' . $shift->id,
                    ]);
                }

                // Handle Discrepancy
                if (abs($discrepancy) > 0.01) {
                    $overShortAccount = ChartOfAcc::getOrCreateDefault('uncategorized-expense');
                    if ($discrepancy > 0) { // Over (Collected > Sales) -> Income/Credit
                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $settleJournal->id,
                            'chart_of_acc_id' => $overShortAccount->id,
                            'debit' => 0,
                            'credit' => $discrepancy,
                            'memo' => 'Cash Over for Shift ' . $shift->id,
                        ]);
                    } else { // Short (Collected < Sales) -> Expense/Debit
                        \App\Models\JournalEntryLine::create([
                            'journal_entry_id' => $settleJournal->id,
                            'chart_of_acc_id' => $overShortAccount->id,
                            'debit' => abs($discrepancy),
                            'credit' => 0,
                            'memo' => 'Cash Short for Shift ' . $shift->id,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('shifts.index')->with('success', 'Shift collections settled and shift closed.');
    }

    public function destroy(PumpShift $shift)
    {
        $shift->delete();
        return redirect()->route('shifts.index')->with('success', 'Shift deleted.');
    }

    public function exportCsv(PumpShift $shift)
    {
        $shift->load(['employee', 'shiftNozzles.nozzle.pump', 'collections.account', 'creditSales.customer']);
        
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=shift_export_{$shift->id}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($shift) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, ['Pump Shift Export', $shift->id]);
            fputcsv($file, ['Operator', $shift->employee?->name]);
            fputcsv($file, ['Start Time', $shift->start_time]);
            fputcsv($file, ['End Time', $shift->end_time]);
            fputcsv($file, ['Total Sales', $shift->total_sales_value]);
            fputcsv($file, ['Discrepancy', $shift->discrepancy]);
            fputcsv($file, []);
            
            fputcsv($file, ['--- METER READINGS ---']);
            fputcsv($file, ['Nozzle', 'Opening', 'Closing', 'Volume', 'Price', 'Total']);
            foreach ($shift->shiftNozzles as $sn) {
                fputcsv($file, [
                    $sn->nozzle?->name,
                    $sn->opening_reading,
                    $sn->closing_reading,
                    $sn->volume_sold,
                    $sn->price_per_liter,
                    $sn->total_value
                ]);
            }
            fputcsv($file, []);
            
            fputcsv($file, ['--- COLLECTIONS (CASH/BANK) ---']);
            fputcsv($file, ['Account', 'Amount']);
            foreach ($shift->collections as $col) {
                fputcsv($file, [
                    $col->account?->name,
                    $col->amount
                ]);
            }
            fputcsv($file, []);

            fputcsv($file, ['--- CREDIT SALES ---']);
            fputcsv($file, ['Customer', 'Description', 'Amount']);
            foreach ($shift->creditSales as $cs) {
                fputcsv($file, [
                    $cs->customer?->display_name,
                    $cs->description,
                    $cs->amount
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportPdf(PumpShift $shift)
    {
        $shift->load(['employee', 'shiftNozzles.nozzle.pump', 'collections.account', 'creditSales.customer']);
        return view('exports.shift_pdf', compact('shift'));
    }
}
