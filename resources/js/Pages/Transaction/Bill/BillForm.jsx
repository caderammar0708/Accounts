import { useState, useEffect, useRef } from "react";
import { useForm, usePage, Head } from "@inertiajs/react";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import { showToast } from "@/Components/ToastNotification";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddAccount from "@/Components/QuickAddAccount";
import QuickAddPayee from "@/Components/QuickAddPayee";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import CurrencyExchangeInput from "@/Components/CurrencyExchangeInput";
import TermModal from "@/Components/TermModal";
import { useDateFormat, formatDate } from "@/Utils/dateFormat";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";
import axios from "axios";

export default function BillForm({
    auth,
    terms = [],
    bill = null,
    nextBillNo = ""
}) {
    const { props } = usePage();
    const company = auth.company;
    const homeCurrencyObj = typeof company?.home_currency === 'object' ? company.home_currency : null;
    const homeCurrencyStr = typeof company?.home_currency === 'string' ? company.home_currency : '';
    const currencyPrefix = company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || company?.home_currency_prefix || '';
    const dateFormat = useDateFormat();

    // Accordion States (Expanded by default)
    const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);
    const [isItemsExpanded, setIsItemsExpanded] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(bill?.id || null);

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [payeeInitialName, setPayeeInitialName] = useState('');
    const [accountInitialName, setAccountInitialName] = useState('');
    const [isTermModalOpen, setIsTermModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [accountModalType, setAccountModalType] = useState('payment');
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);
    const [addingAccountRowIndex, setAddingAccountRowIndex] = useState(null);
    const actionRef = useRef('save');
    const [payeeOptions, setPayeeOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    const fetchPayees = async (search = '') => {
        try {
            const response = await axios.get(route('api.payees', { search, type: 'Supplier' }));
            setPayeeOptions(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payees:", error);
            return [];
        }
    };

    const fetchAccounts = async (search = '') => {
        try {
            const response = await axios.get(route('api.accounts', { search }));
            setAccountOptions(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            return [];
        }
    };

    const fetchItems = async (search = '') => {
        try {
            const response = await axios.get(route('api.items', { search }));
            setProductOptions(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch items:", error);
        }
    };

    const searchItems = async (search = '') => {
        const response = await axios.get(route('api.items', { search }));
        return response.data;
    };

    useEffect(() => {
        fetchPayees();
        fetchAccounts();
        fetchItems();
    }, []);

    const defaultTerms = [
        { value: "Due on Receipt", label: "Due on Receipt" },
        { value: "Net 15", label: "Net 15" },
        { value: "Net 30", label: "Net 30" },
        { value: "Net 60", label: "Net 60" },
    ];
    const [termOptions, setTermOptions] = useState(() => {
        if (terms && terms.length > 0) {
            return terms.map(t => ({ value: t.name, label: t.name }));
        }
        return defaultTerms;
    });

    const calculateDueDate = (dateStr, termName) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return "";

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return "";

        let daysToAdd = 30; // default for Net 30
        if (termName) {
            const lower = termName.toLowerCase();
            if (lower.includes("receipt")) {
                daysToAdd = 0;
            } else {
                const match = termName.match(/\d+/);
                if (match) {
                    daysToAdd = parseInt(match[0], 10);
                }
            }
        }
        date.setDate(date.getDate() + daysToAdd);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getInitialBillDate = () => {
        if (bill?.billDate) return bill.billDate;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const initialBillDate = getInitialBillDate();
    const initialTerms = bill?.terms || "Net 30";
    const initialDueDate = bill?.dueDate || calculateDueDate(initialBillDate, initialTerms);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        supplier: bill?.supplier || bill?.payee_id || "",
        mailingAddress: bill?.mailingAddress || "",
        terms: initialTerms,
        billDate: initialBillDate,
        dueDate: initialDueDate,
        billNo: bill?.billNo || nextBillNo || "",
        memo: bill?.memo || "",
        items: bill?.items && bill.items.length > 0 ? bill.items.map(i => ({
            ...i,
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { category: "", description: "", amount: "0.00" },
            { category: "", description: "", amount: "0.00" },
        ],
        itemDetails: bill?.itemDetails && bill.itemDetails.length > 0 ? bill.itemDetails.map(i => ({
            ...i,
            qty: parseFloat(i.qty || 0).toLocaleString('en-US'),
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
        ],
        exchange_rate: bill?.exchange_rate || 1,
        currency_id: bill?.currency_id || "",
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        if (bill) {
            setData({
                supplier: bill.supplier || bill.payee_id || "",
                mailingAddress: bill.mailingAddress || "",
                terms: bill.terms || "Net 30",
                billDate: bill.billDate || "",
                dueDate: bill.dueDate || "",
                billNo: bill.billNo || "",
                memo: bill.memo || "",
                items: bill.items && bill.items.length > 0 ? bill.items.map(i => ({
                    ...i,
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [
                    { category: "", description: "", amount: "0.00" },
                    { category: "", description: "", amount: "0.00" },
                ],
                itemDetails: bill.itemDetails && bill.itemDetails.length > 0 ? bill.itemDetails.map(i => ({
                    ...i,
                    qty: parseFloat(i.qty || 0).toLocaleString('en-US'),
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ],
                exchange_rate: bill.exchange_rate || 1,
                currency_id: bill.currency_id || "",
                action: 'save'
            });
        }
        clearErrors();
    }, [bill?.id]);

    useEffect(() => {
        if (errors.error) {
            showToast('error', errors.error);
            clearErrors('error');
        }
    }, [errors.error]);

    useEffect(() => {
        transform((data) => ({
            ...data,
            action: actionRef.current,  // ADD THIS LINE
            items: data.items
                .filter(item => item.category || item.description || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    amount: String(item.amount).replace(/,/g, '')
                })),
            itemDetails: data.itemDetails
                .filter(item => item.product || item.description || (item.qty && item.qty !== "0" && item.qty !== "1") || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    qty: String(item.qty).replace(/,/g, ''),
                    rate: String(item.rate).replace(/,/g, ''),
                    amount: String(item.amount).replace(/,/g, '')
                }))
        }));
    }, [transform]);;

    const totalAmount = (
        data.items.reduce(
            (sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0),
            0
        ) +
        data.itemDetails.reduce(
            (sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0),
            0
        )
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
            const product = productOptions.find(p => p.value === value);
            if (product) {
                const rateValue = parseFloat(product.purchase_price) || parseFloat(product.rate) || 0;
                updated[index].rate = formatCurrencyValue(rateValue);
                const q = parseFloat(updated[index].qty) || 0;
                updated[index].amount = formatCurrencyValue(q * rateValue);
                updated[index].description = product.description || "";
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

    const handleBillDateChange = (dateVal) => {
        localStorage.setItem('last_transaction_date', dateVal);
        setData(prev => ({
            ...prev,
            billDate: dateVal,
            dueDate: calculateDueDate(dateVal, prev.terms)
        }));
        setIsDirty(true);
    };

    const handleTermsChange = (termsVal) => {
        setData(prev => ({
            ...prev,
            terms: termsVal,
            dueDate: calculateDueDate(data.billDate, termsVal)
        }));
        setIsDirty(true);
    };

    const handleSave = (action = 'save', pinOverride = null) => {
        if (parseFloat(totalAmount) > 9999999999999.99) {
            showToast('error', 'Total amount is too large. Please enter a smaller value.');
            return;
        }

        const isEdit = !!(bill?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.billDate, auth?.books_lock_date, isEdit)) {
            actionRef.current = action;
            setPendingAction(action);
            setIsPinModalOpen(true);
            return;
        }

        actionRef.current = action;
        setPendingAction(action);

        transform((d) => ({
            ...d,
            action,
            books_pin: pinOverride !== null ? pinOverride : d.books_pin,
            items: d.items
                .filter(item => item.category || item.description || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    amount: String(item.amount).replace(/,/g, '')
                })),
            itemDetails: d.itemDetails
                .filter(item => item.product || item.description || (item.qty && item.qty !== "0" && item.qty !== "1") || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    qty: String(item.qty).replace(/,/g, ''),
                    rate: String(item.rate).replace(/,/g, ''),
                    amount: String(item.amount).replace(/,/g, '')
                }))
        }));

        const currentId = savedEntryId || bill?.id;
        const url = currentId ? route('bill.update', currentId) : route('bill.store');
        const method = currentId ? patch : post;

        method(url, {
            preserveScroll: true,
            preserveState: (page) => Object.keys(page.props.errors).length > 0 || action === 'save',
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.bill?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                if (action === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    }
                }

                if (action === 'new') {
                    setSavedEntryId(null);
                    const currentNo = data.billNo || '1001';
                    const num = parseInt(String(currentNo).replace(/[^0-9]/g, '')) || 1000;
                    const nextNo = String(num + 1).padStart(4, '0');
                    setData({
                        supplier: "", mailingAddress: "",
                        terms: "Net 30",
                        billDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        dueDate: "",
                        billNo: nextNo,
                        memo: "", action: 'save',
                        items: [
                            { category: "", description: "", amount: "0.00" },
                            { category: "", description: "", amount: "0.00" },
                        ],
                        itemDetails: [
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                        ],
                        exchange_rate: 1, currency_id: "",
                    });
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
            options: accountOptions,
            onSearch: fetchAccounts,
            type: "select",
            width: "280px",
            onAddNew: (index, search) => {
                setAccountModalType('payment');
                setAccountInitialName(search || '');
                setAddingAccountRowIndex(index);
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
            width: "120px"
        },
    ];

    const ITEM_COLUMNS = [
        {
            key: "product",
            label: "Product/Service",
            placeholder: "Select product",
            options: productOptions,
            onSearch: searchItems,
            type: "select",
            width: "280px",
            onAddNew: (index) => {
                setAddingItemRowIndex(index);
                setIsItemModalOpen(true);
            }
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "80px", className: "text-right" },
        { key: "rate", label: "Rate", type: "currency", width: "120px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: "Amount", type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
    ];

    return (
        <TransactionLayout
            historyType="bill"
            title={
                <div className="flex items-center">
                    {`Bill #${data.billNo}`}
                    <BooksLockIndicator date={data.billDate} lockDate={auth?.books_lock_date} isEdit={!!(bill?.id || savedEntryId)} />
                </div>
            }
            amount={totalAmount}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
        >
            <Head title={`Bill #${data.billNo}`} />
            <div className="py-6 px-1 space-y-8">
                {/* ROW 1: Supplier & Address */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Supplier"
                                placeholder="Who are you paying?"
                                value={data.supplier}
                                onChange={(val) => {
                                    const payee = payeeOptions.find(p => p.value === val);
                                    setData(prev => ({
                                        ...prev,
                                        supplier: val,
                                        mailingAddress: payee?.billing_address || prev.mailingAddress,
                                        currency_id: payee?.currency_id || prev.currency_id
                                    }));
                                    setIsDirty(true);
                                }}
                                options={payeeOptions}
                                onSearch={fetchPayees}
                                size="sm"
                                error={errors.supplier}
                                onAddNew={(search) => {
                                    setPayeeInitialName(search || '');
                                    setIsPayeeModalOpen(true);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ROW 2: Terms, Dates, No */}
                <div className="flex items-end gap-6">
                    <div className="w-[180px]">
                        <SearchableSelect
                            label="Terms"
                            value={data.terms}
                            onChange={handleTermsChange}
                            onAddNew={() => setIsTermModalOpen(true)}
                            options={termOptions}
                            size="sm"
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            type="date"
                            label="Bill date"
                            value={data.billDate}
                            onChange={(e) => handleBillDateChange(e.target.value)}
                            size="sm"
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            type="date"
                            label="Due date"
                            value={data.dueDate}
                            onChange={(e) => { setData('dueDate', e.target.value); setIsDirty(true); }}
                            size="sm"
                        />
                    </div>
                    <div className="flex-1"></div>
                    <div className="w-[160px]">
                        <CommonInput
                            label="Bill no."
                            value={data.billNo}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('billNo', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('billNo', val);
                            }}
                            onChange={(e) => { setData('billNo', e.target.value); setIsDirty(true); }}
                            size="sm"
                        />
                    </div>
                </div>

                <CurrencyExchangeInput
                    auth={auth}
                    selectedAccount={payeeOptions.find(a => String(a.value) === String(data.supplier))}
                    exchangeRate={data.exchange_rate}
                    onExchangeRateChange={(val) => { setData('exchange_rate', val); setIsDirty(true); }}
                    error={errors.exchange_rate}
                    transactionDate={data.billDate}
                    isEdit={!!bill?.id || !!savedEntryId}
                />
            </div>

            {/* Collapsible Category details Accordion */}
            <div className="mt-8 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                <button
                    type="button"
                    onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                >
                    <div className="flex items-center gap-3">
                        <span className={`text-slate-500 transition-transform duration-300 transform inline-block text-xs ${isCategoryExpanded ? 'rotate-90' : ''}`}>
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
                            addRow={() => {
                                setData("items", [...data.items, { category: "", description: "", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
                            removeRow={(index) => {
                                const remaining = data.items.filter((_, i) => i !== index);
                                setData("items", remaining.length > 0 ? remaining : [{ category: "", description: "", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
                            clearRows={() => {
                                setData("items", [{ category: "", description: "", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
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
                        <span className={`text-slate-500 transition-transform duration-300 transform inline-block text-xs ${isItemsExpanded ? 'rotate-90' : ''}`}>
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
                            addRow={() => {
                                setData("itemDetails", [...data.itemDetails, { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
                            removeRow={(index) => {
                                const remaining = data.itemDetails.filter((_, i) => i !== index);
                                setData("itemDetails", remaining.length > 0 ? remaining : [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
                            clearRows={() => {
                                setData("itemDetails", [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                                setIsDirty(true);
                            }}
                            currencyPrefix={currencyPrefix}
                            hideActions={true}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-10 mt-8 pb-12">
                <div className="w-[400px]">
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

            <TermModal
                isOpen={isTermModalOpen}
                onClose={() => setIsTermModalOpen(false)}
                onSave={(newTerm) => {
                    setTermOptions([...termOptions, { value: newTerm.name, label: newTerm.name }]);
                    handleTermsChange(newTerm.name);
                }}
            />

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => {
                    setIsPayeeModalOpen(false);
                    setPayeeInitialName('');
                }}
                initialName={payeeInitialName}
                onSuccess={(newPayee) => {
                    if (newPayee) {
                        setPayeeOptions(prev => {
                            const exists = prev.some(p => p.value === newPayee.value);
                            return exists ? prev : [newPayee, ...prev];
                        });
                        fetchPayees();
                        setData(prev => ({
                            ...prev,
                            supplier: newPayee.value,
                            email: newPayee.email || prev.email,
                            mailingAddress: newPayee.billing_address || prev.mailingAddress,
                            currency_id: newPayee.currency_id || prev.currency_id
                        }));
                        setIsDirty(true);
                    }
                }}
                initialType="supplier"
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => {
                    setIsAccountModalOpen(false);
                    setAccountInitialName('');
                    setAddingAccountRowIndex(null);
                }}
                initialName={accountInitialName}
                defaultType={accountModalType}
                onSuccess={(newAcc) => {
                    if (newAcc) {
                        setAccountOptions(prev => {
                            const exists = prev.some(a => a.value === newAcc.value);
                            return exists ? prev : [newAcc, ...prev];
                        });
                        fetchAccounts();
                        if (addingAccountRowIndex !== null && addingAccountRowIndex !== undefined) {
                            setData(prev => {
                                const updated = [...prev.categoryDetails];
                                if (updated[addingAccountRowIndex]) {
                                    updated[addingAccountRowIndex] = {
                                        ...updated[addingAccountRowIndex],
                                        category: newAcc.value
                                    };
                                }
                                return { ...prev, categoryDetails: updated };
                            });
                            setIsDirty(true);
                        }
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
                    fetchItems().then(() => {
                        if (addingItemRowIndex !== null && newItem) {
                            const updated = [...data.itemDetails];
                            updated[addingItemRowIndex].product = newItem.id;
                            updated[addingItemRowIndex].description = newItem.description || "";
                            const rateValue = parseFloat(newItem.purchase_price) || parseFloat(newItem.sale_price) || 0;
                            updated[addingItemRowIndex].rate = formatCurrencyValue(rateValue);
                            const q = parseFloat(updated[addingItemRowIndex].qty) || 0;
                            updated[addingItemRowIndex].amount = formatCurrencyValue(q * rateValue);
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

