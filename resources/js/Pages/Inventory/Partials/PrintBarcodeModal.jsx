import React, { useState } from 'react';
import CommonButton from '@/Components/CommonButton';

export default function PrintBarcodeModal({ isOpen, onClose, onConfirm, item }) {
    const [count, setCount] = useState(10); // default to 10 copies

    if (!isOpen || !item) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(item, count);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-slate-800">Print Barcodes</h3>
                    <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-primary-50 border border-primary-100 p-3 rounded-lg">
                        <div className="font-bold text-sm text-primary-800">{item.name}</div>
                        <div className="text-xs text-primary-600 mt-1">SKU: {item.sku || 'No SKU! Cannot print barcode.'}</div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Number of Copies</label>
                        <input
                            type="number"
                            className="w-full text-sm py-2 px-3 border-slate-300 rounded shadow-sm focus:border-primary focus:ring-blue-500"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max="1000"
                            required
                            disabled={!item.sku}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Optimized for 2" / 3" thermal printers.</p>
                    </div>

                    <div className="pt-2 flex gap-2">
                        <CommonButton variant="ghost" type="button" onClick={onClose} className="w-1/3 justify-center">Cancel</CommonButton>
                        <CommonButton 
                            variant="primary" 
                            type="submit" 
                            className="w-2/3 justify-center"
                            disabled={!item.sku}
                        >
                            Generate
                        </CommonButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
