<?php

namespace App\Traits;

use App\Models\Attachment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasAttachments
{
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    /**
     * Attach existing / staged attachment IDs to this model.
     *
     * @param array $attachmentIds
     * @return void
     */
    public function attachAttachments(array $attachmentIds = []): void
    {
        if (empty($attachmentIds)) {
            return;
        }

        // Filter out any empty/falsy values
        $validIds = array_filter($attachmentIds);

        if (!empty($validIds)) {
            Attachment::whereIn('id', $validIds)
                ->where(function ($query) {
                    $query->whereNull('attachable_id')
                        ->orWhere('attachable_id', $this->id);
                })
                ->update([
                    'attachable_id' => $this->id,
                    'attachable_type' => get_class($this),
                ]);
        }
    }
}
