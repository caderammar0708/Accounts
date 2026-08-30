import { useState, useEffect, useRef } from "react";
import { useForm, usePage, Head, router } from "@inertiajs/react";
import { showToast } from "@/Components/ToastNotification";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import TermModal from "@/Components/TermModal";
import QuickAddPayee from "@/Components/QuickAddPayee";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import { useDateFormat, formatDate } from "@/Utils/dateFormat";
import axios from "axios";
import PinPromptModal from "@/Components/PinPromptModal";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";
import AttachmentUpload from "@/Components/AttachmentUpload";

export default function CreditInvoiceForm({
    auth,
    nextInvoiceNo = "",
    invoice = null
}) {
    const { props } = usePage();
    const company = auth.company;
    const homeCurrencyObj = typeof company?.home_currency === 'object' ? company.home_currency : null;
    const homeCurrencyStr = typeof company?.home_currency === 'string' ? company.home_currency : '';
    const currencyPrefix = company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || company?.home_currency_prefix || '';
    const dateFormat = useDateFormat();

    const [customerOptions, setCustomerOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [payeeInitialName, setPayeeInitialName] = useState('');
    const [isTermModalOpen, setIsTermModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const [savedEntryId, setSavedEntryId] = useState(invoice?.id || null);

    const fetchPayees = async (search = "") => {
        const res = await axios.get(route('api.payees', { search, type: 'Customer' }));
        setCustomerOptions(res.data);
        return res.data;
    };

    const handleCustomerChange = (val) => {
        setData(prev => ({ ...prev, customer: val }));
        setIsDirty(true);
        if (val) {
            axios.get(route('api.customers.info', val)).then(res => {
                if (res.data) {
                    setData(prev => {
                        const updates = { customer: val };
                        if (res.data.email) updates.email = res.data.email;
                        if (res.data.billing_address) updates.billingAddress = res.data.billing_address;
                        return { ...prev, ...updates };
                    });
                }
            }).catch(err => console.error("Failed to fetch customer info:", err));
        }
    };

    const fetchItems = (search = "") => {
        return axios.get(route('api.items', { search })).then(res => {
            setProductOptions(res.data);
            return res.data;
        });
    };

    const searchItems = async (search = "") => {
        const response = await axios.get(route('api.items', { search }));
        return response.data;
    };

    useEffect(() => {
        fetchPayees();
        fetchItems();
    }, []);
    // 1. Define CreditInvoice Specific Columns
    const INVOICE_COLUMNS = [
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
            width: "280px",
            hideChevron: true
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "80px", className: "text-right" },
        { key: "rate", label: "Rate", type: "currency", width: "120px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: "Amount", type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
    ];


    const calculateDueDate = (invoiceDateStr, termsStr) => {
        if (!invoiceDateStr) return "";
        const parts = invoiceDateStr.split('-');
        if (parts.length !== 3) return "";

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return "";

        let daysToAdd = 30;
        if (termsStr) {
            const lowerTerms = termsStr.toLowerCase();
            if (lowerTerms.includes("receipt")) {
                daysToAdd = 0;
            } else {
                const match = termsStr.match(/\d+/);
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

    const getInitialInvoiceDate = () => {
        if (invoice?.invoiceDate) return invoice.invoiceDate;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const initialInvoiceDate = getInitialInvoiceDate();
    const initialTerms = invoice?.terms || "Net 30";
    const initialDueDate = invoice?.dueDate || calculateDueDate(initialInvoiceDate, initialTerms);

    const [termOptions, setTermOptions] = useState([
        { label: "Net 30", value: "Net 30" },
        { label: "Net 15", value: "Net 15" },
        { label: "Due on receipt", value: "Due on receipt" }
    ]);

    const actionRef = useRef('save');

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        customer: invoice?.customer || "",
        email: invoice?.email || "",
        billingAddress: invoice?.billingAddress || "",
        terms: initialTerms,
        invoiceDate: initialInvoiceDate,
        dueDate: initialDueDate,
        invoiceNo: invoice?.invoiceNo || nextInvoiceNo || "0001",
        memo: invoice?.memo || "",
        memo_on_statement: invoice?.memo_on_statement || "",
        action: 'save',
        items: invoice?.items ? invoice.items.map(i => ({
            ...i,
            qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
        ],
        discount_type: invoice?.discountType || 'percent',
        discount_value: invoice?.discountValue !== undefined ? String(invoice.discountValue) : '0',
        prefix: invoice?.prefix || '',
        attachments: invoice?.attachments || [],
        attachment_ids: (invoice?.attachments || []).map(a => a.id),
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);


    useEffect(() => {
        if (invoice) {
            setData(prev => ({
                ...prev,
                customer: invoice.customer || "",
                email: invoice.email || "",
                billingAddress: invoice.billingAddress || "",
                terms: invoice.terms || "Net 30",
                invoiceDate: invoice.invoiceDate || "",
                dueDate: invoice.dueDate || calculateDueDate(invoice.invoiceDate, invoice.terms || "Net 30") || "",
                invoiceNo: invoice.invoiceNo || "",
                memo: invoice.memo || "",
                memo_on_statement: invoice.memo_on_statement || "",
                items: invoice.items ? invoice.items.map(i => ({
                    ...i,
                    qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ],
                discount_type: invoice.discountType || 'percent',
                discount_value: invoice.discountValue !== undefined ? String(invoice.discountValue) : '0',
                prefix: invoice.prefix || '',
                books_pin: ''
            }));
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            const termsVal = "Net 30";
            setData(prev => ({
                ...prev,
                customer: "",
                email: "",
                billingAddress: "",
                terms: termsVal,
                invoiceDate: cachedDate,
                dueDate: calculateDueDate(cachedDate, termsVal),
                invoiceNo: nextInvoiceNo || "0001",
                memo: "",
                memo_on_statement: "",
                items: [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ],
                discount_type: 'percent',
                discount_value: '0',
                prefix: '',
                books_pin: ''
            }));
        }
        clearErrors();
    }, [invoice ? JSON.stringify(invoice) : null, nextInvoiceNo]);

    const subtotal = data.items.reduce(
        (sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0),
        0
    );

    let discountAmount = 0;
    const dVal = parseFloat(data.discount_value || 0);
    if (dVal > 0) {
        if (data.discount_type === 'percent') {
            discountAmount = subtotal * (dVal / 100);
        } else {
            discountAmount = dVal;
        }
    }
    const totalAmount = (subtotal - discountAmount).toFixed(2);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const handleItemChange = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;

        if (field === "product") {
            const product = productOptions.find(p => p.value === value);
            if (product) {
                const rateValue = parseFloat(product.rate) || 0;
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

        if (field === "amount") {
            const r = parseCurrency(updated[index].rate);
            const a = parseCurrency(value);
            if (r > 0) {
                const newQty = a / r;
                updated[index].qty = String(newQty);
            }
        }

        setData("items", updated);
        setIsDirty(true);
    };

    const handleAddTerm = (newTerm) => {
        const option = { label: newTerm.name, value: newTerm.name };
        setTermOptions([...termOptions, option]);
        setData(prev => ({
            ...prev,
            terms: newTerm.name,
            dueDate: calculateDueDate(prev.invoiceDate, newTerm.name)
        }));
    };

    const handleSave = (actionType = 'save', pinOverride = null) => {
        const isEdit = !!(invoice?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.invoiceDate, auth?.books_lock_date, isEdit)) {
            actionRef.current = actionType;
            setPendingAction(actionType);
            setIsPinModalOpen(true);
            return;
        }

        actionRef.current = actionType;
        setPendingAction(actionType);
        const currentNo = data.invoiceNo;
        const currentId = savedEntryId || invoice?.id;

        transform((currentData) => ({
            ...currentData,
            action: actionType,
            books_pin: pinOverride !== null ? pinOverride : currentData.books_pin,
            items: currentData.items.map(item => ({
                ...item,
                qty: String(item.qty).replace(/,/g, ''),
                rate: String(item.rate).replace(/,/g, ''),
                amount: String(item.amount).replace(/,/g, '')
            }))
        }));

        const url = currentId ? route('credit-invoice.update', currentId) : route('credit-invoice.store');
        const method = currentId ? patch : post;

        method(url, {
            preserveScroll: true,
            preserveState: (page) => Object.keys(page.props.errors).length > 0 || actionType === 'save',
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');
                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.invoice?.id;
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
                    const num = parseInt(String(currentNo).replace(/[^0-9]/g, '')) || 1000;
                    const nextNo = String(num + 1).padStart(4, '0');
                    setData({
                        customer: "", email: "", billingAddress: "",
                        terms: "Net 30",
                        invoiceDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        dueDate: "",
                        invoiceNo: nextNo,
                        memo: "", memo_on_statement: "", action: 'save',
                        items: [
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                        ],
                        discount_type: 'percent',
                        discount_value: '0',
                        prefix: '',
                        books_pin: ''
                    });
                    clearErrors();
                    setIsDirty(false);
                    setIsPinModalOpen(false);
                    setPendingAction(null);
                }
            }
        });
    };

    return (
        <TransactionLayout
            historyType="credit_invoice"
            title={
                <div className="flex items-center">
                    Credit Invoice #{data.invoiceNo}
                    <BooksLockIndicator date={data.invoiceDate} lockDate={auth?.books_lock_date} isEdit={!!(invoice?.id || savedEntryId)} />
                </div>
            }
            amount={totalAmount}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            onAddLine={() => {
                setData("items", [...data.items, { product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                setIsDirty(true);
            }}
            onClearRows={() => {
                setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                setIsDirty(true);
            }}
        >
            <Head title={`Credit Invoice ${data.invoiceNo}`} />
            <div className="py-6 px-1 space-y-8">
                {/* ROW 1: Customer & Email & Balance */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[120px]">
                            <SearchableSelect
                                label="Prefix"
                                value={data.prefix}
                                onChange={(val) => { setData("prefix", val); setIsDirty(true); }}
                                options={[
                                    { label: 'None', value: '' },
                                    { label: 'Mr', value: 'Mr' },
                                    { label: 'Mrs', value: 'Mrs' },
                                    { label: 'Miss', value: 'Miss' },
                                    { label: 'Director', value: 'Director' },
                                    { label: 'Manager', value: 'Manager' },
                                ]}
                                size="sm"
                                hideAddNew={true}
                            />
                        </div>
                        <div className="w-[280px]">
                            <SearchableSelect
                                label="Customer"
                                placeholder="Select a customer"
                                value={data.customer}
                                onChange={handleCustomerChange}
                                options={customerOptions}
                                onSearch={fetchPayees}
                                size="sm"
                                error={errors.customer}
                                onAddNew={(search) => {
                                    setPayeeInitialName(search || '');
                                    setIsPayeeModalOpen(true);
                                }}
                            />
                        </div>
                        <div className="w-[320px]">
                            <CommonInput
                                label="Customer email"
                                placeholder="Separate emails with a comma"
                                value={data.email}
                                onChange={(e) => { setData("email", e.target.value); setIsDirty(true); }}
                                size="sm"
                                error={errors.email}
                            />
                        </div>
                    </div>

                    {/* Balance Display */}
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Balance Due</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{currencyPrefix}</span>
                            {parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* ROW 2: Address, Terms, Dates, No */}
                <div className="flex items-end gap-6">
                    <div className="w-[180px]">
                        <SearchableSelect
                            label="Terms"
                            value={data.terms}
                            onChange={(val) => {
                                setData(prev => ({ ...prev, terms: val, dueDate: calculateDueDate(prev.invoiceDate, val) }));
                                setIsDirty(true);
                            }}
                            onAddNew={() => setIsTermModalOpen(true)}
                            options={termOptions}
                            size="sm"
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            type="date"
                            label="Credit Sale date"
                            value={data.invoiceDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData(prev => ({ ...prev, invoiceDate: newDate, dueDate: calculateDueDate(newDate, prev.terms) }));
                                setIsDirty(true);
                            }}
                            size="sm"
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            type="date"
                            label="Due date"
                            value={data.dueDate}
                            onChange={(e) => { setData(prev => ({ ...prev, dueDate: e.target.value })); setIsDirty(true); }}
                            size="sm"
                            error={errors.dueDate}
                        />
                    </div>
                    <div className="flex-1"></div>
                    <div className="w-[160px]">
                        <CommonInput
                            label="Credit Sale no."
                            value={data.invoiceNo}
                            onChange={(e) => { setData('invoiceNo', e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('invoiceNo', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('invoiceNo', val);
                            }}
                            size="sm"
                            inputClass="font-mono text-right"
                        />
                    </div>
                </div>
            </div>

            <LineItemsTable
                columns={INVOICE_COLUMNS}
                items={data.items}
                handleItemChange={handleItemChange}
                addRow={() => {
                    setData("items", [...data.items, { product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                    setIsDirty(true);
                }}
                removeRow={(index) => {
                    setData("items", data.items.filter((_, i) => i !== index));
                    setIsDirty(true);
                }}
                clearRows={() => {
                    setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                    setIsDirty(true);
                }}
                totals={{ "Total": totalAmount }}
                currencyPrefix={currencyPrefix}
                hideActions={true}
                subtotal={subtotal}
                discountValue={data.discount_value}
                discountType={data.discount_type}
                onDiscountChange={(val, type) => {
                    setData(prev => ({ ...prev, discount_value: val, discount_type: type }));
                    setIsDirty(true);
                }}
                hideSummaryBlock={true}
            />


            <div className="flex justify-between mt-8 items-start">
                <div className="w-[400px] flex flex-col gap-4">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="This will show up on the Credit Sale."
                        value={data.memo}
                        onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                    />
                    <CommonInput
                        type="textarea"
                        label="Memo on Statement"
                        placeholder="This will show up on the customer Statement."
                        value={data.memo_on_statement}
                        onChange={(e) => { setData('memo_on_statement', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                    />
                    <AttachmentUpload
                        attachments={data.attachments}
                        onChange={(newAttachments, newIds) => {
                            setData(prev => ({
                                ...prev,
                                attachments: newAttachments,
                                attachment_ids: newIds
                            }));
                            setIsDirty(true);
                        }}
                    />
                </div>

                {/* Subtotal / Discount / Total Summary Block */}
                <div className="flex flex-col items-end gap-3 min-w-[300px] bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">{currencyPrefix}</span>
                            {parseFloat(String(subtotal || 0).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Discount Input */}
                    <div className="flex justify-between items-center w-full gap-4 mt-2">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest mt-2">Discount</span>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={data.discount_value}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    const parts = val.split('.');
                                    if (parts.length > 2) return;
                                    setData(prev => ({ ...prev, discount_value: val }));
                                    setIsDirty(true);
                                }}
                                onBlur={(e) => {
                                    const val = parseFloat(e.target.value || 0).toString();
                                    setData(prev => ({ ...prev, discount_value: val }));
                                    setIsDirty(true);
                                }}
                                className="w-[80px] h-8 text-right text-sm font-medium border border-slate-300 rounded-l-md focus:border-primary focus:ring-1 focus:ring-blue-500 outline-none px-2"
                            />
                            <div className="flex h-8 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => { setData(prev => ({ ...prev, discount_type: 'percent' })); setIsDirty(true); }}
                                    className={`px-2 text-xs font-bold transition-colors ${data.discount_type === 'percent' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setData(prev => ({ ...prev, discount_type: 'fixed' })); setIsDirty(true); }}
                                    className={`px-2 text-xs font-bold transition-colors ${data.discount_type === 'fixed' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {currencyPrefix}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-slate-200">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total</span>
                        <span className="text-lg font-black text-slate-900 flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">{currencyPrefix}</span>
                            {parseFloat(String(totalAmount || 0).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Payments List */}
                    {invoice?.payments && invoice.payments.length > 0 && (
                        <div className="w-full mt-2 pt-3 border-t border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Payments Applied</span>
                            {invoice.payments.map((payment, idx) => (
                                <div key={idx} className="flex justify-between items-center w-full mb-1">
                                    <a href={route('receive-payment.edit', payment.id)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:text-primary-700 hover:underline">
                                        Receive Payment # {payment.reference} ({formatDate(payment.date, dateFormat)})
                                    </a>
                                    <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400">{currencyPrefix}</span>
                                        {parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <TermModal
                isOpen={isTermModalOpen}
                onClose={() => setIsTermModalOpen(false)}
                onSave={handleAddTerm}
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

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => {
                    setIsPayeeModalOpen(false);
                    setPayeeInitialName('');
                }}
                initialName={payeeInitialName}
                onSuccess={(newPayee) => {
                    if (newPayee) {
                        setCustomerOptions(prev => {
                            const exists = prev.some(c => c.value === newPayee.value);
                            return exists ? prev : [newPayee, ...prev];
                        });
                        fetchPayees();
                        handleCustomerChange(newPayee.value);
                    }
                }}
                initialType="customer"
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
                            const updated = [...data.items];
                            updated[addingItemRowIndex].product = newItem.id;
                            updated[addingItemRowIndex].description = newItem.description || "";
                            const rateValue = parseFloat(newItem.sale_price || 0);
                            updated[addingItemRowIndex].rate = formatCurrencyValue(rateValue);
                            const q = parseFloat(updated[addingItemRowIndex].qty) || 0;
                            updated[addingItemRowIndex].amount = formatCurrencyValue(q * rateValue);
                            setData("items", updated);
                        }
                        setAddingItemRowIndex(null);
                    });
                }}
            />
        </TransactionLayout>
    );
}
