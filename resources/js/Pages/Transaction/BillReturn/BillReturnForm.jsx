import { useState, useEffect } from "react";
import { useForm, Head } from "@inertiajs/react";
import { showToast } from "@/Components/ToastNotification";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddAccount from "@/Components/QuickAddAccount";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function BillReturnForm({ auth, nextRef = "", billReturn = null }) {
    const currencyPrefix = auth.company?.home_currency_prefix || '';

    const [supplierOptions, setSupplierOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);

    // Accordion States (Expanded by default)
    const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);
    const [isItemsExpanded, setIsItemsExpanded] = useState(true);

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [accountModalType, setAccountModalType] = useState('payment');
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(billReturn?.id || null);

    const fetchSuppliers = (search = "") => {
        axios.get(route('api.payees', { search, type: 'Supplier' })).then(res => setSupplierOptions(res.data));
    };

    const fetchProducts = (search = "") => {
        return axios.get(route('api.items', { search })).then(res => {
            setProductOptions(res.data);
            return res.data;
        });
    };

    const searchItems = async (search = "") => {
        const response = await axios.get(route('api.items', { search }));
        return response.data;
    };

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => {
            setAccountOptions(res.data);
        });
    };

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchAccounts();
    }, []);

    const getInitialDate = () => {
        if (billReturn?.date) return billReturn.date;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        supplier: billReturn?.supplier || billReturn?.supplier_id || "",
        date: billReturn?.date || billReturn?.date || getInitialDate(),
        reference: billReturn?.reference || billReturn?.billReturn_no || nextRef || "1001",
        memo: billReturn?.memo || "",
        items: billReturn?.items?.length > 0 ? billReturn.items : [
            { category: "", description: "", amount: "0.00" },
            { category: "", description: "", amount: "0.00" },
        ],
        itemDetails: billReturn?.itemDetails?.length > 0 ? billReturn.itemDetails.map(i => ({
            ...i,
            qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
        ],
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        if (billReturn) {
            setData({
                supplier: billReturn.supplier || billReturn.supplier_id || "",
                date: billReturn.date || billReturn.date || "",
                reference: billReturn.reference || billReturn.billReturn_no || "",
                memo: billReturn.memo || "",
                items: billReturn.items?.length > 0 ? billReturn.items.map(i => ({ ...i, amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })) : [{ category: "", description: "", amount: "0.00" }],
                itemDetails: billReturn.itemDetails?.length > 0 ? billReturn.itemDetails.map(i => ({
                    ...i,
                    qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }],
            });
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            setData({
                supplier: "",
                date: cachedDate,
                reference: nextRef || "1001",
                memo: "",
                items: [
                    { category: "", description: "", amount: "0.00" },
                    { category: "", description: "", amount: "0.00" },
                ],
                itemDetails: [
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ],
            });
        }
    }, [billReturn?.id, nextRef]);

    const totalAmount = (
        data.items.reduce((sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0), 0) +
        data.itemDetails.reduce((sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0), 0)
    ).toFixed(2);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const handleItemChange = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;
        setData("items", updated);
        setIsDirty(true);
    };

    const handleProductItemChange = (index, field, value) => {
        const updated = [...data.itemDetails];
        updated[index][field] = value;

        if (field === "product") {
            const product = productOptions.find(p => String(p.value) === String(value));
            if (product) {
                const costPrice = parseFloat(product.purchase_price) || parseFloat(product.cost_price) || parseFloat(product.rate) || parseFloat(product.sale_price) || 0;
                updated[index].rate = formatCurrencyValue(costPrice);
                const q = parseFloat(updated[index].qty) || 0;
                updated[index].amount = formatCurrencyValue(q * costPrice);
                updated[index].description = product.description || product.name || "";
            }
        }

        if (field === "qty" || field === "rate") {
            let q = parseFloat(String(updated[index].qty).replace(/,/g, '')) || 0;
            if (q < 0) {
                q = 0;
                updated[index].qty = "0";
            }
            const r = parseCurrency(updated[index].rate);
            updated[index].amount = formatCurrencyValue(q * r);
        } else if (field === "amount") {
            const a = parseCurrency(value);
            let q = parseFloat(updated[index].qty) || 0;
            if (q < 0) {
                q = 0;
                updated[index].qty = "0";
            }
            if (q !== 0) {
                updated[index].rate = formatCurrencyValue(a / q);
            }
        }
        setData("itemDetails", updated);
        setIsDirty(true);
    };

    const handleSave = (actionType = 'save', pinOverride = null) => {
        const isEdit = !!(billReturn?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.date, auth?.books_lock_date, isEdit)) {
            actionRef.current = actionType;
            setPendingAction(actionType);
            setIsPinModalOpen(true);
            return;
        }

        actionRef.current = actionType;
        setPendingAction(actionType);

        transform((data) => ({
            ...data,
            action: actionType,
            books_pin: pinOverride !== null ? pinOverride : data.books_pin,
            items: data.items
                .filter(item => item.category || item.description || parseCurrency(item.amount) > 0)
                .map(item => ({
                    ...item,
                    amount: parseCurrency(item.amount)
                })),
            itemDetails: data.itemDetails
                .filter(item => item.product || item.description || (item.qty && item.qty !== "0" && item.qty !== "1") || parseCurrency(item.amount) > 0)
                .map(item => ({
                    ...item,
                    qty: String(item.qty).replace(/,/g, ''),
                    rate: parseCurrency(item.rate),
                    amount: parseCurrency(item.amount)
                }))
        }));

        const currentId = savedEntryId || billReturn?.id;
        const url = currentId ? route('bill-return.update', currentId) : route('bill-return.store');
        const method = currentId ? patch : post;

        method(url, {
            preserveScroll: true,
            preserveState: actionType !== 'new',
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.billReturn?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                if (actionType === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } 
                }

                if (actionType === 'new') {
                    setSavedEntryId(null);
                    const currentNo = data.reference || nextRef || '1001';
                    const num = parseInt(String(currentNo).replace(/[^0-9]/g, '')) || 1000;
                    const nextNo = String(num + 1).padStart(4, '0');
                    setData({
                        supplier: "",
                        date: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        reference: nextNo,
                        memo: "",
                        items: [
                            { category: "", description: "", amount: "0.00" },
                            { category: "", description: "", amount: "0.00" },
                        ],
                        itemDetails: [
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                        ],
                        action: 'save'
                    });
                    reset();
                    clearErrors();
                    setIsDirty(false);
                }
            }
        });
    };

    const BILL_COLUMNS = [
        {
            key: "category",
            label: "Category",
            placeholder: "Choose a category",
            options: accountOptions,
            onSearch: fetchAccounts,
            type: "select",
            width: "320px",
            onAddNew: () => {
                setAccountModalType('payment');
                setIsAccountModalOpen(true);
            }
        },
        { key: "description", label: "Description" },
        {
            key: "amount",
            label: "Amount",
            type: "currency",
            className: "text-right",
            inputClass: "text-right",
            width: "140px"
        },
    ];

    const ITEM_COLUMNS = [
        {
            key: "product",
            label: "Product/Service",
            placeholder: "Select product",
            options: productOptions,
            onSearch: searchItems,
            onAddNew: (index) => {
                setAddingItemRowIndex(index);
                setIsItemModalOpen(true);
            },
            type: "select",
            width: "320px"
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "100px", className: "text-right" },
        { key: "rate", label: "Rate", type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: "Amount", type: "currency", width: "160px", className: "text-right", inputClass: "text-right" },
    ];

    return (
        <TransactionLayout
            historyType="bill_return"
            title={
                <div className="flex items-center">
                    {`Bill Return #${data.reference}`}
                    <BooksLockIndicator date={data.date} lockDate={auth?.books_lock_date} isEdit={!!(billReturn?.id || savedEntryId)} />
                </div>
            }
            amount={totalAmount}
            currencyPrefix={currencyPrefix}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
        >
            <Head title="Bill Return" />
            <div className="py-6 px-1 space-y-8">
                {/* Error Banner */}
                {errors.error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {errors.error}
                    </div>
                )}

                <div className="flex items-start gap-8">
                    <div className="w-[320px]">
                        <SearchableSelect
                            label="Supplier"
                            placeholder="Select a supplier"
                            value={data.supplier}
                            onSearch={fetchSuppliers}
                            onAddNew={() => setIsPayeeModalOpen(true)}
                            onChange={(val) => { setData('supplier', val); setIsDirty(true); }}
                            options={supplierOptions}
                            error={errors.supplier}
                        />
                    </div>
                    <div className="w-[180px]">
                        <CommonInput
                            type="date"
                            label="Return date"
                            value={data.date}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData('date', newDate);
                                setIsDirty(true);
                            }}
                            error={errors.date}
                            size="sm"
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            label="Return no."
                            value={data.reference}
                            onChange={(e) => { setData('reference', e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('reference', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('reference', val);
                            }}
                            error={errors.reference}
                            size="sm"
                            inputClass="font-mono text-right"
                        />
                    </div>
                </div>

                {/* Collapsible Category details Accordion */}
                <div className="mt-8 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text - slate - 500 transition - transform duration - 300 transform inline - block text - xs ${isCategoryExpanded ? 'rotate-90' : ''} `}>
                                ▶
                            </span>
                            <span className="font-semibold text-slate-700 text-sm">Category details</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">
                                {data.items.filter(item => item.category).length} lines
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            Total Category: <span className="text-slate-800 font-black">{currencyPrefix} {data.items.reduce((sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </span>
                    </button>
                    {isCategoryExpanded && (
                        <div className="p-4 bg-slate-50/10">
                            <LineItemsTable
                                columns={BILL_COLUMNS}
                                items={data.items}
                                handleItemChange={handleItemChange}
                                addRow={() => { setData("items", [...data.items, { category: "", description: "", amount: "0.00" }]); setIsDirty(true); }}
                                removeRow={(index) => {
                                    const remaining = data.items.filter((_, i) => i !== index);
                                    setData("items", remaining.length > 0 ? remaining : [{ category: "", description: "", amount: "0.00" }]);
                                    setIsDirty(true);
                                }}
                                clearRows={() => { setData("items", [{ category: "", description: "", amount: "0.00" }]); setIsDirty(true); }}
                                currencyPrefix={currencyPrefix}
                                hideActions={true}
                            />
                        </div>
                    )}
                </div>

                {/* Collapsible Item details Accordion */}
                <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text - slate - 500 transition - transform duration - 300 transform inline - block text - xs ${isItemsExpanded ? 'rotate-90' : ''} `}>
                                ▶
                            </span>
                            <span className="font-semibold text-slate-700 text-sm">Item details</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                {data.itemDetails.filter(item => item.product).length} lines
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            Total Item: <span className="text-slate-800 font-black">{currencyPrefix} {data.itemDetails.reduce((sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </span>
                    </button>
                    {isItemsExpanded && (
                        <div className="p-4 bg-slate-50/10">
                            <LineItemsTable
                                columns={ITEM_COLUMNS}
                                items={data.itemDetails}
                                handleItemChange={handleProductItemChange}
                                addRow={() => { setData("itemDetails", [...data.itemDetails, { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]); setIsDirty(true); }}
                                removeRow={(index) => {
                                    const remaining = data.itemDetails.filter((_, i) => i !== index);
                                    setData("itemDetails", remaining.length > 0 ? remaining : [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                                    setIsDirty(true);
                                }}
                                clearRows={() => { setData("itemDetails", [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]); setIsDirty(true); }}
                                currencyPrefix={currencyPrefix}
                                hideActions={true}
                            />
                        </div>
                    )}
                </div>

                <div className="w-[400px] mt-8">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="Add a memo..."
                        value={data.memo}
                        onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                    />
                </div>
            </div>

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={(newPayee) => {
                    fetchSuppliers();
                    if (newPayee) setData("supplier", newPayee.value);
                }}
                initialType="supplier"
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                type={accountModalType}
                onSuccess={(newAcc) => {
                    if (newAcc) {
                        fetchAccounts();
                    }
                }}
            />

            <InventoryItemSidePanel
                isOpen={isItemModalOpen}
                onClose={() => {
                    setIsItemModalOpen(false);
                    setAddingItemRowIndex(null);
                }}
                onSuccess={(newItem) => {
                    fetchProducts().then(() => {
                        if (addingItemRowIndex !== null && newItem) {
                            const updated = [...data.itemDetails];
                            updated[addingItemRowIndex].product = newItem.id;
                            updated[addingItemRowIndex].description = newItem.description || newItem.name || "";
                            const costPrice = parseFloat(newItem.cost_price) || parseFloat(newItem.purchase_price) || parseFloat(newItem.sale_price) || 0;
                            updated[addingItemRowIndex].rate = formatCurrencyValue(costPrice);
                            const q = parseFloat(updated[addingItemRowIndex].qty) || 0;
                            updated[addingItemRowIndex].amount = formatCurrencyValue(q * costPrice);
                            setData("itemDetails", updated);
                        }
                        setAddingItemRowIndex(null);
                    });
                }}
            />

            <PinPromptModal
                isOpen={isPinModalOpen}
                onClose={() => {
                    setIsPinModalOpen(false);
                    setPendingAction(null);
                    setData('books_pin', '');
                    clearErrors('books_pin');
                }}
                onSubmit={(pin) => {
                    setData('books_pin', pin);
                    handleSave(pendingAction, pin);
                }}
                errorMessage={errors.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? errors.books_pin : null}
            />
        </TransactionLayout>
    );
}
