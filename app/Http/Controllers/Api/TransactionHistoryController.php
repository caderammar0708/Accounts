<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index(Request $request, string $transactionType)
    {
        $limit = max(1, (int) $request->query('limit', 5));

        return response()->json($this->buildRecords($transactionType, $limit, false));
    }

    public function page(string $transactionType)
    {
        return Inertia::render('Transaction/TransactionHistoryPage', [
            'transactionType' => $this->normalizeType($transactionType),
            'records' => $this->buildRecords($transactionType, 100, true),
        ]);
    }

    private function buildRecords(string $transactionType, int $limit = 5, bool $isPage = false): array
    {
        $normalizedType = $this->normalizeType($transactionType);

        $query = JournalEntry::query()
            ->where('transaction_type', $normalizedType)
            ->when($normalizedType === 'credit_invoice', function ($query) {
                $query->whereHasMorph('transactionable', [\App\Models\Accounting\CreditInvoice::class], function ($q) {
                    $q->whereNull('source_type');
                });
            })
            ->with(['payee', 'transactionable']);

        if ($isPage) {
            $query->orderByDesc('date')->orderByDesc('created_at');
        } else {
            $query->orderByDesc('updated_at');
        }

        return $query->limit($limit)
            ->get()
            ->map(function (JournalEntry $entry) use ($normalizedType) {
                $memo = $entry->description
                    ?: $entry->transactionable?->memo
                    ?: $entry->transactionable?->description
                    ?: '—';

                if (mb_strlen($memo) > 100) {
                    $memo = mb_substr($memo, 0, 97) . '...';
                }

                $amount = $entry->total_amount
                    ?: $entry->transactionable?->total_amount
                    ?: $entry->transactionable?->amount
                    ?: 0;
                    
                $refNo = $entry->reference 
                    ?: $entry->transactionable?->reference_number
                    ?: $entry->transactionable?->invoice_no
                    ?: $entry->transactionable?->bill_no
                    ?: $entry->transactionable?->receipt_number
                    ?: '—';
                    
                $payeeName = $entry->payee?->display_name
                    ?: $entry->transactionable?->customer?->display_name
                    ?: $entry->transactionable?->supplier?->display_name
                    ?: '—';

                return [
                    'id' => $entry->id,
                    'date' => $entry->date
                        ?: $entry->transactionable?->invoice_date
                        ?: $entry->transactionable?->bill_date
                        ?: $entry->transactionable?->receipt_date
                        ?: $entry->transactionable?->payment_date
                        ?: $entry->created_at?->toDateString(),
                    'ref_no' => $refNo,
                    'payee_account' => $payeeName,
                    'memo' => $memo,
                    'debit' => in_array($normalizedType, ['invoice', 'receive_payment', 'bank_deposit', 'payment', 'pay_bill', 'bill_return', 'journal_entry', 'inventory_adjustment']) ? $amount : 0,
                    'credit' => in_array($normalizedType, ['bill', 'invoice_return', 'sales_invoice']) ? $amount : 0,
                    'amount' => $amount,
                    'status' => $entry->status ?: $entry->transactionable?->status ?: 'posted',
                ];
            })
            ->values()
            ->toArray();
    }

    private function normalizeType(string $type): string
    {
        $map = [
            'pos'     => 'pos',

            'sales invoice'     => 'sales_invoice',
            'credit invoice'    => 'credit_invoice',
            'return invoice'    => 'return_invoice',
            'receive payment'   => 'receive_payment',

            'payment'           => 'payment',
            'bill'              => 'bill',
            'pay bill'          => 'pay_bill',
            'bill_return'       => 'bill_return',

            'bank deposit'      => 'bank_deposit',
            'transfer'          => 'transfer',
            'journal entry'     => 'journal_entry',
            'inventory qty adj' => 'inventory_adjustment',
            'inventory adjustment' => 'inventory_adjustment',
        ];

        $normalized = strtolower(trim(str_replace(['_', ' ', '-'], ' ', $type)));

        return $map[$normalized] ?? $normalized;
    }
}
