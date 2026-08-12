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

export default function EditAdjustment({ items, accounts, adjustment }) {
    const { data, setData, patch, processing, errors, transform } = useForm({
        adjustment_date: adjustment.adjustment_date || new Date().toISOString().split('T')[0],
        reference_number: adjustment.reference_number || '1',
        adjustment_reason: adjustment.adjustment_reason || 'Damaged Goods',
        inventory_adjustment_account_id: adjustment.inventory_adjustment_account_id || (accounts.length > 0 ? accounts[0].id : ''),
        memo: adjustment.memo || '',
        items: adjustment.items?.length ? adjustment.items : [
            { id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 }
        ],
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const reasons = [
        { value: 'Damaged Goods', label: 'Damaged Goods' },
        { value: 'Stocktaking', label: 'Stocktaking' },
        { value: 'Theft', label: 'Theft' },
        { value: 'Promotional', label: 'Promotional' },
        { value: 'Other', label: 'Other' }
    ];

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
        const newItems = [...data.items];
        newItems.splice(index, 1);
        if (newItems.length === 0) {
            newItems.push({ id: Date.now(), item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0 });
        }
        setData('items', newItems);
    };

    const handleItemChange = (index, value) => {
        const selectedItem = items.find(i => i.id === value);
        const newItems = [...data.items];
        if (selectedItem) {
            newItems[index] = {
                ...newItems[index],
                item_id: selectedItem.id,
                sku: selectedItem.sku || '',
                description: selectedItem.description || '',
                qty_on_hand: parseFloat(selectedItem.quantity_on_hand) || 0,
                new_qty: parseFloat(selectedItem.quantity_on_hand) || 0,
                change_in_qty: 0
            };
        } else {
            newItems[index] = {
                ...newItems[index],
                item_id: '', sku: '', description: '', qty_on_hand: 0, new_qty: 0, change_in_qty: 0
            };
        }
        setData('items', newItems);
    };

    const handleNewQtyChange = (index, value) => {
        const newItems = [...data.items];
        const item = { ...newItems[index], new_qty: value };
        const parsedNewQty = parseFloat(value);
        if (!isNaN(parsedNewQty)) {
            item.change_in_qty = parsedNewQty - (parseFloat(item.qty_on_hand) || 0);
        } else if (value === '') {
            item.change_in_qty = 0 - (parseFloat(item.qty_on_hand) || 0);
        }
        newItems[index] = item;
        setData('items', newItems);
    };

    const handleChangeQtyChange = (index, value) => {
        const newItems = [...data.items];
        const item = { ...newItems[index], change_in_qty: value };
        const parsedChangeQty = parseFloat(value);
        if (!isNaN(parsedChangeQty)) {
            item.new_qty = (parseFloat(item.qty_on_hand) || 0) + parsedChangeQty;
        } else if (value === '') {
            item.new_qty = parseFloat(item.qty_on_hand) || 0;
        }
        newItems[index] = item;
        setData('items', newItems);
    };

    const { auth } = usePage().props;

    const submit = (e, actionType = 'save', pinOverride = null) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!pinOverride && isBooksLocked(data.adjustment_date, auth?.books_lock_date, true)) {
            setPendingAction(actionType);
            setIsPinModalOpen(true);
            return;
        }

        setPendingAction(actionType);

        transform((data) => ({
            ...data,
            books_pin: pinOverride !== null ? pinOverride : data.books_pin,
            items: data.items.filter(item => item.item_id !== '').map(item => ({
                ...item,
                new_qty: parseFloat(item.new_qty) || 0,
                change_in_qty: parseFloat(item.change_in_qty) || 0,
            }))
        }));

        patch(route('inventory-adjustment.update', { journalEntry: adjustment.id, action: actionType }), {
            onSuccess: () => {
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');
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
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                            Edit Inventory Quantity Adjustment #{data.reference_number}
                            <BooksLockIndicator date={data.adjustment_date} lockDate={auth?.books_lock_date} isEdit={true} />
                        </h1>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors uppercase tracking-widest border border-red-200"
                        >
                            Delete
                        </button>
                    </div>

                    {errors.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm font-bold">
                            {errors.error}
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
                            />
                            {errors.adjustment_reason && <div className="text-red-500 text-xs mt-1 font-bold">{errors.adjustment_reason}</div>}
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Adjustment Account</label>
                            <SearchableSelect
                                options={accounts.map(acc => ({ value: acc.id, label: `${acc.account_code} - ${acc.name}` }))}
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
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" readOnly className="w-full px-2 py-1.5 bg-transparent border-none focus:ring-0 text-xs text-slate-500 font-mono" value={item.sku} />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" className="w-full px-2 py-1.5 bg-transparent border-none focus:bg-slate-50/50 focus:ring-0 text-xs text-slate-800" value={item.description} onChange={e => {
                                                    const newItems = [...data.items];
                                                    newItems[index].description = e.target.value;
                                                    setData('items', newItems);
                                                }} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" readOnly className="w-full px-2 py-1.5 bg-transparent border-none focus:ring-0 text-xs font-mono text-slate-500 text-right" value={item.qty_on_hand} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full px-2 py-1.5 bg-transparent border-none focus:bg-slate-50/50 focus:ring-0 text-xs font-mono text-slate-800 text-right" value={item.new_qty} onChange={e => handleNewQtyChange(index, e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full px-2 py-1.5 bg-transparent border-none focus:bg-slate-50/50 focus:ring-0 text-xs font-mono text-slate-800 text-right" value={item.change_in_qty} onChange={e => handleChangeQtyChange(index, e.target.value)} />
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

                    <div className="mt-8 w-1/2">
                        <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Memo</label>
                        <textarea
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all resize-none min-h-[80px]"
                            value={data.memo}
                            onChange={e => setData('memo', e.target.value)}
                            placeholder="Add a note for internal use..."
                        ></textarea>
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
                                variant="secondary"
                                onClick={(e) => submit(e, 'close')}
                                disabled={processing}
                                size="sm"
                            >
                                Save and close
                            </CommonButton>
                            <CommonButton
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
