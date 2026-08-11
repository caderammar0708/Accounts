<?php

namespace App\Observers;

use App\Models\Accounting\JournalEntry;
use App\Services\BooksLockService;

class JournalEntryObserver
{
    public function creating(JournalEntry $journalEntry)
    {
        $this->checkLock($journalEntry);
    }

    public function updating(JournalEntry $journalEntry)
    {
        $this->checkLock($journalEntry);

        // If the date was changed, check both the old and new dates
        if ($journalEntry->isDirty('date')) {
            $oldDate = $journalEntry->getOriginal('date');
            if ($oldDate) {
                BooksLockService::check($oldDate, request()->input('books_pin'));
            }
        }
    }

    public function deleting(JournalEntry $journalEntry)
    {
        $this->checkLock($journalEntry);
    }

    private function checkLock(JournalEntry $journalEntry)
    {
        if ($journalEntry->date) {
            BooksLockService::check($journalEntry->date, request()->input('books_pin'));
        }
    }
}
