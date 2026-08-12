import { useRef } from 'react';

export default function BottomSection({ form, setForm }) {
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            console.log('Files selected:', files);
            // Process files here
            for (let i = 0; i < files.length; i++) {
                console.log('File:', files[i].name);
                // You can upload to server here
            }
        }
    };

    return (
        <div className="grid grid-cols-2 gap-10 pt-4">

            <div>
                <label className="text-xs text-gray-500">Memo</label>
                <textarea
                    className="w-full border-b border-gray-300 text-sm py-1 leading-snug"
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                />
            </div>

            <div>
                <label className="text-xs text-gray-500">Attachments</label>
                <div
                    className="border border-dashed p-6 text-center text-sm text-gray-500 cursor-pointer hover:bg-gray-50 rounded-md"
                    onClick={() => fileInputRef.current.click()}
                >
                    📎 Upload files
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png,.doc,.docx"
                />
            </div>

        </div>
    );
}
