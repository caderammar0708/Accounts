<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\InventoryQuantityAdjustment;
use App\Models\Item;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InventoryQuantityAdjustmentController extends Controller
{
    use \App\Traits\AccountingControllerTrait;
    public function create()
    {
        
        $items = Item::query()
            ->where('track_inventory', true)
            ->get(['id', 'name', 'sku', 'description', 'quantity_on_hand']);
            
        $accounts = ChartOfAcc::query()->get(['id', 'name', 'account_code']);

        $existingReasons = InventoryQuantityAdjustment::query()
            ->whereNotNull('adjustment_reason')
            ->distinct()
            ->pluck('adjustment_reason');

        $lastRef = InventoryQuantityAdjustment::query()
            ->whereNotNull('reference_number')
            ->orderByRaw('CAST(reference_number AS UNSIGNED) DESC')
            ->first();
            
        $nextRef = ($lastRef && is_numeric($lastRef->reference_number)) ? (int) $lastRef->reference_number + 1 : 1;

        return Inertia::render('Inventory/QuantityAdjustment/Create', [
            'items' => $items,
            'accounts' => $accounts,
            'existingReasons' => $existingReasons,
            'nextReference' => (string) $nextRef,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'adjustment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'adjustment_reason' => 'required|string|max:255',
            'inventory_adjustment_account_id' => 'required|exists:chart_of_accs,id',
            'memo' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.qty_on_hand' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.change_in_qty' => 'required|numeric',
        ], [
            'items.required' => 'Please select at least one product in the adjustment lines.',
            'items.min' => 'Please select at least one product in the adjustment lines.',
            'items.*.item_id.required' => 'Please select a product for all line items.',
            'items.*.item_id.exists' => 'The selected product does not exist.',
            'items.*.new_qty.required' => 'New quantity is required for all line items.',
            'items.*.new_qty.numeric' => 'New quantity must be a valid number.',
            'items.*.change_in_qty.required' => 'Change in quantity is required.',
            'items.*.change_in_qty.numeric' => 'Change in quantity must be a valid number.',
            'inventory_adjustment_account_id.required' => 'Please select an adjustment account.',
            'inventory_adjustment_account_id.exists' => 'The selected adjustment account is invalid.',
        ]);

        $this->checkBooksLock($request->adjustment_date, $request->books_pin);

        
        try {
            $journalEntry = null;
            DB::transaction(function () use ($validated, &$journalEntry, $request) {
                $adjustment = InventoryQuantityAdjustment::create([
                    'adjustment_date' => \Carbon\Carbon::parse($validated['adjustment_date'])->format('Y-m-d'),
                    'reference_number' => $validated['reference_number'] ?? null,
                    'adjustment_reason' => $validated['adjustment_reason'],
                    'inventory_adjustment_account_id' => $validated['inventory_adjustment_account_id'],
                    'memo' => $validated['memo'] ?? null,
                ]);

                $journalLines = [];
                $totalAmount = 0.0;

                foreach ($validated['items'] as $itemData) {
                    $adjustment->items()->create([
                        'item_id' => $itemData['item_id'],
                        'description' => $itemData['description'] ?? null,
                        'qty_on_hand' => $itemData['qty_on_hand'],
                        'new_qty' => $itemData['new_qty'],
                        'change_in_qty' => $itemData['change_in_qty'],
                    ]);

                    // Update the quantity_on_hand in the Item model
                    $item = Item::query()->findOrFail($itemData['item_id']);
                    $item->quantity_on_hand = $itemData['new_qty'];
                    $item->save();

                    $changeInQty = (float) $itemData['change_in_qty'];
                    if ($changeInQty != 0) {
                        $cost = (float) $item->purchase_price;
                        $lineVal = abs($changeInQty) * $cost;
                        $totalAmount += $lineVal;

                        // Find the item's inventory asset account
                        $inventoryAccountId = $item->inventory_account_id ?? 
                            (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? 
                             ChartOfAcc::getOrCreateDefault('inventory')->id);

                        $descSuffix = !empty($itemData['description']) ? ' (' . $itemData['description'] . ')' : '';
                        $lineMemo = "Inventory Qty Adj: " . $item->name . $descSuffix;

                        if ($changeInQty > 0) {
                            // Inventory Increase:
                            // Debit: Inventory Asset Account
                            // Credit: Inventory Adjustment Account
                            $journalLines[] = [
                                'chart_of_acc_id' => $inventoryAccountId,
                                'debit' => $lineVal,
                                'credit' => 0,
                                'memo' => $lineMemo,
                            ];
                            $journalLines[] = [
                                'chart_of_acc_id' => $validated['inventory_adjustment_account_id'],
                                'debit' => 0,
                                'credit' => $lineVal,
                                'memo' => $lineMemo,
                            ];
                        } else {
                            // Inventory Decrease:
                            // Debit: Inventory Adjustment Account
                            // Credit: Inventory Asset Account
                            $journalLines[] = [
                                'chart_of_acc_id' => $validated['inventory_adjustment_account_id'],
                                'debit' => $lineVal,
                                'credit' => 0,
                                'memo' => $lineMemo,
                            ];
                            $journalLines[] = [
                                'chart_of_acc_id' => $inventoryAccountId,
                                'debit' => 0,
                                'credit' => $lineVal,
                                'memo' => $lineMemo,
                            ];
                        }
                    }
                }

                // Create the Journal Entry for the adjustment
                $journalEntry = JournalEntry::create([
                        'date' => \Carbon\Carbon::parse($validated['adjustment_date'])->format('Y-m-d'),
                        'reference' => $validated['reference_number'] ?? 'ADJ-' . time(),
                        'description' => $validated['memo'] ?? ('Inventory quantity adjustment - ' . $validated['adjustment_reason']),
                        'transaction_type' => 'inventory_adjustment',
                        'total_amount' => $totalAmount,
                        'status' => 'posted',
                        'created_by' => Auth::id(),
                        'transactionable_id' => $adjustment->id,
                        'transactionable_type' => InventoryQuantityAdjustment::class,
                    ]);

                    foreach ($journalLines as $line) {
                        $journalEntry->lines()->create($line);
                    }

                    $adjustment->attachAttachments($request->input('attachment_ids', []));
                if ($journalEntry) {
                    $journalEntry->attachAttachments($request->input('attachment_ids', []));
                }
            });
            $action = $request->input('action', 'save');

            if ($action === 'new') {
                return redirect()->route('inventory-adjustment.create')->with('success', 'Inventory quantity adjustment saved successfully.');
            }

            if ($action === 'close') {
                $lastValidRoute = session('last_valid_route', route('dashboard'));
                return redirect()->to($lastValidRoute)->with('success', 'Inventory quantity adjustment saved successfully.');
            }

            if ($journalEntry) {
                return redirect()->route('inventory-adjustment.edit', $journalEntry->id)->with('success', 'Inventory quantity adjustment saved successfully.');
            }
            return redirect()->route('items.index')->with('success', 'Inventory quantity adjustment saved successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inventory Adjustment Store Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            if ($request->expectsJson() || ($request->header('X-Inertia') === null && $request->isJson())) {
                return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
            }
            return redirect()->back()->withInput()->withErrors(['error' => $e->getMessage()])->with('error', $e->getMessage());
        }
    }
    
    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load(['lines', 'attachments']);
        $adjustment = InventoryQuantityAdjustment::with(['items.item', 'attachments'])->findOrFail($journalEntry->transactionable_id);

        $items = Item::query()
            ->where('track_inventory', true)
            ->get(['id', 'name', 'sku', 'description', 'quantity_on_hand']);
            
        $accounts = ChartOfAcc::query()->get(['id', 'name', 'account_code']);

        $existingReasons = InventoryQuantityAdjustment::query()
            ->whereNotNull('adjustment_reason')
            ->distinct()
            ->pluck('adjustment_reason');

        $adjustmentData = [
            'id' => $journalEntry->id,
            'adjustment_date' => $adjustment->adjustment_date,
            'reference_number' => $adjustment->reference_number,
            'adjustment_reason' => $adjustment->adjustment_reason,
            'inventory_adjustment_account_id' => $adjustment->inventory_adjustment_account_id,
            'memo' => $adjustment->memo,
            'items' => $adjustment->items->map(function ($adjItem) {
                return [
                    'id' => $adjItem->id,
                    'item_id' => $adjItem->item_id,
                    'sku' => $adjItem->item->sku ?? '',
                    'description' => $adjItem->description ?? '',
                    'qty_on_hand' => (float) $adjItem->qty_on_hand,
                    'new_qty' => (float) $adjItem->new_qty,
                    'change_in_qty' => (float) $adjItem->change_in_qty,
                ];
            })->toArray(),
            'attachments' => ($adjustment && $adjustment->attachments->isNotEmpty()) ? $adjustment->attachments : $journalEntry->attachments,
        ];

        return Inertia::render('Inventory/QuantityAdjustment/Edit', [
            'items' => $items,
            'accounts' => $accounts,
            'existingReasons' => $existingReasons,
            'adjustment' => $adjustmentData,
        ]);
    }

    public function update(Request $request, JournalEntry $journalEntry)
    {
        $validated = $request->validate([
            'adjustment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
            'adjustment_reason' => 'required|string|max:255',
            'inventory_adjustment_account_id' => 'required|exists:chart_of_accs,id',
            'memo' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.qty_on_hand' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.change_in_qty' => 'required|numeric',
        ], [
            'items.required' => 'Please select at least one product in the adjustment lines.',
            'items.min' => 'Please select at least one product in the adjustment lines.',
            'items.*.item_id.required' => 'Please select a product for all line items.',
            'items.*.item_id.exists' => 'The selected product does not exist.',
            'items.*.new_qty.required' => 'New quantity is required for all line items.',
            'items.*.new_qty.numeric' => 'New quantity must be a valid number.',
            'items.*.change_in_qty.required' => 'Change in quantity is required.',
            'items.*.change_in_qty.numeric' => 'Change in quantity must be a valid number.',
            'inventory_adjustment_account_id.required' => 'Please select an adjustment account.',
            'inventory_adjustment_account_id.exists' => 'The selected adjustment account is invalid.',
        ]);

        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->adjustment_date, $request->books_pin);

        try {
            DB::transaction(function () use ($validated, $journalEntry, $request) {
                $adjustment = InventoryQuantityAdjustment::findOrFail($journalEntry->transactionable_id);

                // Revert previous items
                foreach ($adjustment->items as $oldItem) {
                    $item = Item::find($oldItem->item_id);
                    if ($item) {
                        $item->decrement('quantity_on_hand', $oldItem->change_in_qty);
                    }
                }
                
                $adjustment->items()->delete();

                // Update business document
                $adjustment->update([
                    'adjustment_date' => \Carbon\Carbon::parse($validated['adjustment_date'])->format('Y-m-d'),
                    'reference_number' => $validated['reference_number'] ?? null,
                    'adjustment_reason' => $validated['adjustment_reason'],
                    'inventory_adjustment_account_id' => $validated['inventory_adjustment_account_id'],
                    'memo' => $validated['memo'] ?? null,
                ]);

                $journalLines = [];
                $totalAmount = 0.0;

                foreach ($validated['items'] as $itemData) {
                    $adjustment->items()->create([
                        'item_id' => $itemData['item_id'],
                        'description' => $itemData['description'] ?? null,
                        'qty_on_hand' => $itemData['qty_on_hand'],
                        'new_qty' => $itemData['new_qty'],
                        'change_in_qty' => $itemData['change_in_qty'],
                    ]);

                    $item = Item::findOrFail($itemData['item_id']);
                    // Apply new qty change
                    $item->increment('quantity_on_hand', $itemData['change_in_qty']);

                    $changeInQty = (float) $itemData['change_in_qty'];
                    if ($changeInQty != 0) {
                        $cost = (float) $item->purchase_price;
                        $lineVal = abs($changeInQty) * $cost;
                        $totalAmount += $lineVal;

                        $inventoryAccountId = $item->inventory_account_id ?? 
                            (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? 
                             ChartOfAcc::getOrCreateDefault('inventory')->id);

                        $descSuffix = !empty($itemData['description']) ? ' (' . $itemData['description'] . ')' : '';
                        $lineMemo = "Inventory Qty Adj: " . $item->name . $descSuffix;

                        if ($changeInQty > 0) {
                            $journalLines[] = [
                                'chart_of_acc_id' => $inventoryAccountId,
                                'debit' => $lineVal,
                                'credit' => 0,
                                'memo' => $lineMemo,
                            ];
                            $journalLines[] = [
                                'chart_of_acc_id' => $validated['inventory_adjustment_account_id'],
                                'debit' => 0,
                                'credit' => $lineVal,
                                'memo' => $lineMemo,
                            ];
                        } else {
                            $journalLines[] = [
                                'chart_of_acc_id' => $validated['inventory_adjustment_account_id'],
                                'debit' => $lineVal,
                                'credit' => 0,
                                'memo' => $lineMemo,
                            ];
                            $journalLines[] = [
                                'chart_of_acc_id' => $inventoryAccountId,
                                'debit' => 0,
                                'credit' => $lineVal,
                                'memo' => $lineMemo,
                            ];
                        }
                    }
                }

                $journalEntry->update([
                    'date' => \Carbon\Carbon::parse($validated['adjustment_date'])->format('Y-m-d'),
                    'reference' => $validated['reference_number'] ?? 'ADJ-' . time(),
                    'description' => $validated['memo'] ?? ('Inventory quantity adjustment - ' . $validated['adjustment_reason']),
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines()->delete();

                foreach ($journalLines as $line) {
                    $journalEntry->lines()->create($line);
                }

                $adjustment = InventoryQuantityAdjustment::find($journalEntry->transactionable_id);
                if ($adjustment) {
                    $adjustment->attachAttachments($request->input('attachment_ids', []));
                }
                $journalEntry->attachAttachments($request->input('attachment_ids', []));
            });

            $action = $request->input('action', 'save');
            if ($action === 'close') {
                $lastValidRoute = session('last_valid_route', route('dashboard'));
                return redirect()->to($lastValidRoute)->with('success', 'Inventory quantity adjustment updated successfully.');
            }
            if ($action === 'new') {
                return redirect()->route('inventory-adjustment.create')->with('success', 'Inventory quantity adjustment updated successfully.');
            }
            return redirect()->route('inventory-adjustment.edit', $journalEntry->id)->with('success', 'Inventory quantity adjustment updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inventory Adjustment Update Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            if ($request->expectsJson() || ($request->header('X-Inertia') === null && $request->isJson())) {
                return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
            }
            return redirect()->back()->withInput()->withErrors(['error' => $e->getMessage()])->with('error', $e->getMessage());
        }
    }

    public function void(Request $request, JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, $request->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            $adjustment = InventoryQuantityAdjustment::find($journalEntry->transactionable_id);

            if ($adjustment) {
                foreach ($adjustment->items as $oldItem) {
                    $item = Item::find($oldItem->item_id);
                    if ($item) {
                        $item->decrement('quantity_on_hand', $oldItem->change_in_qty);
                    }
                }
                $adjustment->update(['status' => 'void', 'voided_at' => now()]);
            }

            $journalEntry->update(['status' => 'void', 'total_amount' => 0, 'voided_at' => now()]);
            $journalEntry->lines()->update(['debit' => 0, 'credit' => 0, 'fc_debit' => 0, 'fc_credit' => 0]);
        });

        return redirect()->back()->with('success', 'Inventory quantity adjustment voided successfully.');
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        DB::transaction(function () use ($journalEntry) {
            $adjustment = InventoryQuantityAdjustment::find($journalEntry->transactionable_id);

            if ($adjustment) {
                // Revert previous items
                foreach ($adjustment->items as $oldItem) {
                    $item = Item::find($oldItem->item_id);
                    if ($item) {
                        $item->decrement('quantity_on_hand', $oldItem->change_in_qty);
                    }
                }
                $adjustment->items()->delete();
                $adjustment->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });

        return redirect()->route('items.index')->with('success', 'Inventory quantity adjustment deleted successfully.');
    }
}
