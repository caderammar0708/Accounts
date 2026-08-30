<?php

namespace App\Traits;

use App\Models\Accounting\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

trait AccountingControllerTrait
{
    /**
     * Handle standard action redirects (save, new, close) for accounting controllers.
     *
     * @param Request $request
     * @param string $routePrefix e.g., 'pay-bill', 'receive-payment'
     * @param int|string $id The ID of the JournalEntry to edit
     * @param string $successMessage
     * @return \Illuminate\Http\RedirectResponse
     */
    protected function handleActionRedirect(Request $request, $routePrefix, $id, $successMessage)
    {
        $action = $request->input('action', 'save');
        
        if ($action === 'close') {
            $lastValidRoute = session('last_valid_route', route('dashboard'));
            return redirect()->to($lastValidRoute)->with('success', $successMessage);
        }

        if ($action === 'new') {
            return redirect()->route($routePrefix . '.create')->with('success', $successMessage);
        }

        return redirect()->route($routePrefix . '.edit', $id)->with('success', $successMessage);
    }

    /**
     * Get the next auto-incrementing reference number for a transaction type.
     *
     * @param string $transactionType
     * @param int $defaultStart
     * @return string
     */
    protected function getNextReferenceNumber($transactionType, $defaultStart = 1001)
    {
        $lastRef = JournalEntry::where('transaction_type', $transactionType)
            ->whereNotNull('reference')
            ->orderByRaw('CAST(reference AS UNSIGNED) DESC')
            ->first();

        $nextNo = ($lastRef && is_numeric($lastRef->reference)) ? (int) $lastRef->reference + 1 : $defaultStart;
        return (string) str_pad($nextNo, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if transaction date is locked and validate provided PIN.
     *
     * @param string|\Carbon\Carbon $date
     * @param string|null $providedPin
     * @return void
     */
    protected function checkBooksLock($date, ?string $providedPin = null)
    {
        \App\Services\BooksLockService::check($date, $providedPin);
    }

    /**
     * Sync attachments provided in request to the given model.
     *
     * @param \Illuminate\Database\Eloquent\Model $model
     * @param Request $request
     * @return void
     */
    protected function syncAttachments($model, Request $request)
    {
        if ($request->filled('attachment_ids') && method_exists($model, 'attachAttachments')) {
            $ids = is_array($request->input('attachment_ids')) ? $request->input('attachment_ids') : [$request->input('attachment_ids')];
            $model->attachAttachments($ids);
        }
    }
}
