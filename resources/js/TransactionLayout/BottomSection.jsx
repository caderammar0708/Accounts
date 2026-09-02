import React from 'react';
import { usePage } from '@inertiajs/react';
import AttachmentUpload from '@/Components/AttachmentUpload';
import CommonInput from '@/Components/CommonInput';

export default function BottomSection({ form, setForm }) {
    const { auth } = usePage().props;
    const isAttachmentsEnabled = auth?.attachments_enabled !== false;

    return (
        <div className={`grid ${isAttachmentsEnabled ? 'grid-cols-2' : 'grid-cols-1 max-w-xl'} gap-10 pt-4`}>
            <CommonInput
                type="textarea"
                label="Memo"
                rows={2}
                value={form.memo || ''}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="Enter memo..."
            />

            {isAttachmentsEnabled && (
                <div>
                    <AttachmentUpload
                        attachments={form.attachments || []}
                        onChange={(newAttachments, newIds) => {
                            setForm({
                                ...form,
                                attachments: newAttachments,
                                attachment_ids: newIds
                            });
                        }}
                    />
                </div>
            )}
        </div>
    );
}
