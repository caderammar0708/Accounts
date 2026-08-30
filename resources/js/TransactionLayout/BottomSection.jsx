import React from 'react';
import AttachmentUpload from '@/Components/AttachmentUpload';

export default function BottomSection({ form, setForm }) {
    return (
        <div className="grid grid-cols-2 gap-10 pt-4">
            <div>
                <label className="text-xs font-medium text-slate-600">Memo</label>
                <textarea
                    className="w-full border border-slate-300 rounded-lg text-sm p-2.5 mt-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={form.memo || ''}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    placeholder="Enter memo..."
                />
            </div>

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
        </div>
    );
}
