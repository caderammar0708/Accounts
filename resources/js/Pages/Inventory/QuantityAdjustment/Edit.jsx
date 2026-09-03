import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';
import BooksLockIndicator from '@/Components/BooksLockIndicator';
import PinPromptModal from '@/Components/PinPromptModal';
import { useBooksLock, isBooksLocked } from '@/Hooks/useBooksLock';
import { usePage } from '@inertiajs/react';
import AttachmentUpload from '@/Components/AttachmentUpload';
import { showToast } from '@/Components/ToastNotification';
import RecentTransactionHistory from '@/Components/RecentTransactionHistory';

const FormSection = ({ title, children, show = true }) => {
    if (!show) return null;
    return (
        <div className="pt-4 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
};

export default function EditAdjustment({ items, accounts, existingReasons = [], adjustment }) {
    const { data, setData, patch, processing, errors, transform, clearErrors, isDirty } = useForm({
        adjustment_date: adjustment.adjustment_date || new Date().toISOString().split('T')[0],
        reference_number: adjustment.reference_number || '1',
        adjustment_reason: adjustment.adjustment_reason || 'Damaged Goods',
        inventory_adjustment_account_id: adjustment.inventory_adjustment_account_id || (accounts.length > 0 ? accounts[0].id : ''),
        memo: adjustment.memo || '',
        items: adjustment.items?.length ? adjustment.items : [
            { id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 }
        ],
        attachments: adjustment.attachments || [],
        attachment_ids: (adjustment.attachments || []).map(a => a.id),
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const defaultReasons = [
        'Damaged Goods',
        'Stocktaking',
        'Theft',
        'Promotional',
        'Other'
    ];
    
    // Combine defaults and db reasons, removing duplicates
    const allReasons = [...new Set([...defaultReasons, ...existingReasons])];
    
    const reasons = allReasons.map(r => ({ value: r, label: r }));

    const addLine = () => {
        setData('items', [
            ...data.items,
            { id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 }
        ]);
    };

    const clearLines = () => {
        setData('items', [{ id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 }]);
    };

    const removeLine = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        if (newItems.length === 0) {
            newItems.push({ id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 });
        }
        setData('items', newItems);
    };

    const handleItemChange = (index, value) => {
        const selectedItem = items.find(i => String(i.id) === String(value));
        const newItems = data.items.map((item, i) => {
            if (i !== index) return item;
            if (selectedItem) {
                const qtyOnHand = parseFloat(selectedItem.quantity_on_hand) || 0;
                return {
                    ...item,
                    item_id: selectedItem.id,
                    sku: selectedItem.sku || '',
                    description: selectedItem.description || '',
                    qty_on_hand: qtyOnHand,
                    new_qty: qtyOnHand,
                    change_in_qty: 0
                };
            } else {
                return {
                    ...item,
                    item_id: '',
                    sku: '',
                    description: '',
                    qty_on_hand: 0,
                    new_qty: 0,
                    change_in_qty: 0
                };
            }
        });
        setData('items', newItems);
    };

    const cleanQtyInput = (val, allowNegative = false) => {
        if (val === '' || val === null || val === undefined) return '';
        let str = String(val).replace(/,/g, '');
        let isNegative = false;
        if (allowNegative) {
            isNegative = str.startsWith('-');
            str = str.replace(/^-/, '');
        }
        // Remove all non-digit and non-period characters
        str = str.replace(/[^\d.]/g, '');
        // Ensure only one period
        const parts = str.split('.');
        let clean = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');

        // Prevent leading zero stacking: '05' -> '5', but keep '0', '0.x'
        if (clean.length > 1 && clean.startsWith('0') && clean[1] !== '.') {
            clean = clean.replace(/^0+/, '');
            if (clean === '' || clean.startsWith('.')) clean = '0' + clean;
        }

        if (allowNegative && isNegative) {
            return '-' + clean;
        }
        return clean;
    };

    const handleNewQtyChange = (index, value) => {
        const cleaned = cleanQtyInput(value, false);
        const parsedNewQty = parseFloat(cleaned);
        const newItems = data.items.map((item, i) => {
            if (i !== index) return item;
            const qtyOnHand = parseFloat(item.qty_on_hand) || 0;
            let changeInQty = 0;
            if (!isNaN(parsedNewQty)) {
                changeInQty = Math.round((parsedNewQty - qtyOnHand + Number.EPSILON) * 10000) / 10000;
            } else if (cleaned === '') {
                changeInQty = -qtyOnHand;
            } else {
                changeInQty = item.change_in_qty;
            }
            return {
                ...item,
                new_qty: cleaned,
                change_in_qty: changeInQty
            };
        });
        setData('items', newItems);
    };

    const handleChangeQtyChange = (index, value) => {
        const cleaned = cleanQtyInput(value, true);
        const parsedChangeQty = parseFloat(cleaned);
        const newItems = data.items.map((item, i) => {
            if (i !== index) return item;
            const qtyOnHand = parseFloat(item.qty_on_hand) || 0;
            let newQty = qtyOnHand;
            if (!isNaN(parsedChangeQty)) {
                newQty = Math.round((qtyOnHand + parsedChangeQty + Number.EPSILON) * 10000) / 10000;
            } else if (cleaned === '' || cleaned === '-') {
                newQty = qtyOnHand;
            } else {
                newQty = item.new_qty;
            }
            return {
                ...item,
                change_in_qty: cleaned,
                new_qty: newQty
            };
        });
        setData('items', newItems);
    };

    const handleNewQtyBlur = (index) => {
        const item = data.items[index];
        if (!item) return;
        if (item.new_qty === '' || isNaN(parseFloat(item.new_qty))) {
            handleNewQtyChange(index, '0');
        }
    };

    const handleChangeQtyBlur = (index) => {
        const item = data.items[index];
        if (!item) return;
        if (item.change_in_qty === '' || item.change_in_qty === '-' || isNaN(parseFloat(item.change_in_qty))) {
            handleChangeQtyChange(index, '0');
        }
    };

    const { auth } = usePage().props;

    const submit = (e, actionType = 'save', pinOverride = null) => {
        if (e && e.preventDefault) e.preventDefault();
        console.log("Submitting inventory adjustment update...", { actionType, pinOverride, data });

        if (!pinOverride && isBooksLocked(data.adjustment_date, auth?.books_lock_date, true)) {
            setPendingAction(actionType);
            setIsPinModalOpen(true);
            return;
        }

        const validItems = data.items.filter(item => item.item_id && item.item_id !== '');
        if (validItems.length === 0) {
            showToast('error', 'Please select at least one product in the adjustment lines.');
            return;
        }

        if (!data.inventory_adjustment_account_id) {
            showToast('error', 'Please select an adjustment account.');
            return;
        }

        if (!data.adjustment_date) {
            showToast('error', 'Please select an adjustment date.');
            return;
        }

        if (!data.adjustment_reason) {
            showToast('error', 'Please select or enter an adjustment reason.');
            return;
        }

        setPendingAction(actionType);

        transform((currentData) => ({
            ...currentData,
            books_pin: pinOverride !== null ? pinOverride : currentData.books_pin,
            items: currentData.items.filter(item => item.item_id && item.item_id !== '').map(item => ({
                ...item,
                new_qty: parseFloat(item.new_qty) || 0,
                change_in_qty: parseFloat(item.change_in_qty) || 0,
            }))
        }));

        patch(route('inventory-adjustment.update', { journalEntry: adjustment.id, action: actionType }), {
            onSuccess: (page) => {
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');
                showToast('success', page?.props?.flash?.success || 'Inventory quantity adjustment updated successfully.');
            },
            onError: (errs) => {
                console.error("Inventory adjustment update failed:", errs);
                const firstError = Object.values(errs)[0];
                const msg = typeof firstError === 'string' ? firstError : 'Failed to update adjustment. Please check the form errors.';
                showToast('error', msg);
            }
        });
    };

    const handleDelete = () => {
        router.delete(route('inventory-adjustment.destroy', adjustment.id));
    };

    return (
        <AuthenticatedLayout header="Edit Inventory Quantity Adjustment">
            <Head title="Edit Inventory Quantity Adjustment" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto ">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <RecentTransactionHistory historyType="inventory_adjustment" dirty={isDirty} />
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                Edit Inventory Quantity Adjustment #{data.reference_number}
                                <BooksLockIndicator date={data.adjustment_date} lockDate={auth?.books_lock_date} isEdit={true} />
                            </h1>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors uppercase tracking-widest border border-red-200"
                        >
                            Delete
                        </button>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs font-bold space-y-1 animate-in fade-in">
                            <div className="font-extrabold text-sm mb-1 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Please correct the following errors:
                            </div>
                            {errors.error && <div>• {errors.error}</div>}
                            {errors.items && <div>• {errors.items}</div>}
                            {Object.entries(errors)
                                .filter(([k]) => !['error', 'items', 'books_pin'].includes(k))
                                .map(([k, msg]) => (
                                    <div key={k}>• {msg}</div>
                                ))
                            }
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <CommonInput
                            type="date"
                            label="Adjustment date"
                            value={data.adjustment_date}
                            onChange={e => setData('adjustment_date', e.target.value)}
                            error={errors.adjustment_date}
                        />
                        <CommonInput
                            label="Reference number"
                            value={data.reference_number}
                            onChange={e => setData('reference_number', e.target.value)}
                            error={errors.reference_number}
                        />
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Adjustment Reason</label>
                            <SearchableSelect
                                options={reasons}
                                value={data.adjustment_reason}
                                onChange={val => setData('adjustment_reason', val)}
                                placeholder="Select reason"
                                allowCustom={true}
                            />
                            {errors.adjustment_reason && <div className="text-red-500 text-xs mt-1 font-bold">{errors.adjustment_reason}</div>}
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Adjustment Account</label>
                            <SearchableSelect
                                options={accounts.map(acc => ({ value: acc.id, label: acc.account_code ? `${acc.account_code} - ${acc.name}` : acc.name }))}
                                value={data.inventory_adjustment_account_id}
                                onChange={val => setData('inventory_adjustment_account_id', val)}
                                placeholder="Select account"
                            />
                            {errors.inventory_adjustment_account_id && <div className="text-red-500 text-xs mt-1 font-bold">{errors.inventory_adjustment_account_id}</div>}
                        </div>
                    </div>

                    {/* Table */}
                    <FormSection title="Adjustment Lines">
                        <div className="border border-slate-150 rounded bg-white overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-10 text-center">#</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[250px]">Product / Variant</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[120px]">SKU</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[100px]">Qty on hand</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[100px]">New Qty</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[100px]">Change</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/20 transition-colors">
                                            <td className="p-2 text-center text-[10px] font-mono text-slate-400 font-bold">{index + 1}</td>
                                            <td className="p-2">
                                                <SearchableSelect
                                                    options={items.map(i => ({ value: i.id, label: `${i.name}` }))}
                                                    value={item.item_id}
                                                    onChange={val => handleItemChange(index, val)}
                                                    placeholder="Select item"
                                                    variant="table"
                                                    hideChevron
                                                    error={!!errors[`items.${index}.item_id`]}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" readOnly className="w-full px-2 py-1.5 bg-transparent border-none focus:ring-0 text-xs text-slate-500 font-mono" value={item.sku || ''} />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" className="w-full px-2 py-1.5 bg-transparent border-none focus:bg-slate-50/50 focus:ring-0 text-xs text-slate-800" value={item.description || ''} onChange={e => {
                                                    const val = e.target.value;
                                                    setData('items', data.items.map((it, i) => i === index ? { ...it, description: val } : it));
                                                }} />
                                            </td>
                                            <td className="p-2">
                                                <CommonInput
                                                    type="text"
                                                    variant="table"
                                                    size="sm"
                                                    readOnly
                                                    inputClass="text-right font-mono text-slate-500 cursor-default px-2 py-1.5"
                                                    value={item.qty_on_hand ?? 0}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <CommonInput
                                                    type="text"
                                                    inputMode="decimal"
                                                    variant="table"
                                                    size="sm"
                                                    inputClass={`text-right font-mono text-slate-800 focus:bg-slate-50/50 rounded px-2 py-1.5 ${errors[`items.${index}.new_qty`] ? 'bg-red-50 text-red-700 ring-1 ring-red-400' : ''}`}
                                                    value={item.new_qty !== undefined && item.new_qty !== null ? item.new_qty : ''}
                                                    onChange={e => handleNewQtyChange(index, e.target.value)}
                                                    onFocus={e => setTimeout(() => e.target.select(), 0)}
                                                    onClick={e => e.target.select()}
                                                    onBlur={() => handleNewQtyBlur(index)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <CommonInput
                                                    type="text"
                                                    inputMode="decimal"
                                                    variant="table"
                                                    size="sm"
                                                    inputClass="text-right font-mono text-slate-800 focus:bg-slate-50/50 rounded px-2 py-1.5"
                                                    value={item.change_in_qty !== undefined && item.change_in_qty !== null ? item.change_in_qty : ''}
                                                    onChange={e => handleChangeQtyChange(index, e.target.value)}
                                                    onFocus={e => setTimeout(() => e.target.select(), 0)}
                                                    onClick={e => e.target.select()}
                                                    onBlur={() => handleChangeQtyBlur(index)}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {errors.items && (
                                <div className="p-3 bg-red-50/50 border-t border-red-100 text-red-600 text-xs font-bold">
                                    {errors.items}
                                </div>
                            )}
                            <div className="p-3 border-t border-slate-100 flex gap-2">
                                <button type="button" onClick={addLine} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-primary-50 border border-primary-200 text-primary-600 rounded-sm hover:bg-primary-100 transition-all uppercase tracking-wider shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                    Add Line
                                </button>
                                <button type="button" onClick={clearLines} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500 rounded-sm hover:bg-slate-100 transition-all uppercase tracking-wider shadow-sm">
                                    Clear all lines
                                </button>
                            </div>
                        </div>
                    </FormSection>

                    <div className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                            <CommonInput
                                type="textarea"
                                label="Memo"
                                rows={2}
                                value={data.memo}
                                onChange={e => setData('memo', e.target.value)}
                                placeholder="Add a note for internal use..."
                            />
                        </div>
                        <div>
                            <AttachmentUpload
                                attachments={data.attachments}
                                onChange={(newAttachments, newIds) => {
                                    setData(prev => ({
                                        ...prev,
                                        attachments: newAttachments,
                                        attachment_ids: newIds
                                    }));
                                }}
                            />
                        </div>
                    </div>

                    <div className="pt-8 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => window.close()}
                            className="px-4 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3">
                            <CommonButton
                                type="button"
                                variant="secondary"
                                onClick={(e) => submit(e, 'close')}
                                disabled={processing}
                                size="sm"
                            >
                                Save and close
                            </CommonButton>
                            <CommonButton
                                type="button"
                                variant="primary"
                                onClick={(e) => submit(e, 'save')}
                                disabled={processing}
                                size="sm"
                            >
                                Save
                            </CommonButton>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Inventory Adjustment"
                message="Are you sure you want to delete this inventory adjustment? This action cannot be undone and will reverse the item quantities and journal entry."
            />

            <PinPromptModal
                isOpen={isPinModalOpen}
                onClose={() => {
                    setIsPinModalOpen(false);
                    setPendingAction(null);
                    setData('books_pin', '');
                }}
                onSubmit={(pin) => {
                    setData('books_pin', pin);
                    submit(null, pendingAction, pin);
                }}
                errorMessage={errors.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? errors.books_pin : null}
            />
        </AuthenticatedLayout>
    );
}
