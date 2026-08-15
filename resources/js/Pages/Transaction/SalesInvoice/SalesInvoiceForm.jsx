import { useState, useEffect } from "react";
import { useForm, Head, router } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddAccount from "@/Components/QuickAddAccount";
import CurrencyExchangeInput from "@/Components/CurrencyExchangeInput";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import QuickAddPaymentMethod from "@/Components/QuickAddPaymentMethod";
import { showToast } from "@/Components/ToastNotification";
import PinPromptModal from "@/Components/PinPromptModal";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function SalesInvoiceForm({ auth, paymentMethods = [], nextReceiptNo = "", receipt = null }) {
    const company = auth.company;
    const homeCurrencyObj = typeof company?.home_currency === 'object' ? company.home_currency : null;
    const homeCurrencyStr = typeof company?.home_currency === 'string' ? company.home_currency : '';
    const homeCurrencyPrefix = company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || company?.home_currency_prefix || '';

    const [currencies, setCurrencies] = useState([]);
    
    useEffect(() => {
        if (auth?.currency?.multi_enabled) {
            axios.get(route('api.currencies'))
                .then(res => setCurrencies(res.data))
                .catch(err => console.error("Error fetching currencies:", err));
        }
    }, [auth?.currency?.multi_enabled]);

    const [customerOptions, setCustomerOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const paymentMethodOptions = paymentMethods.map(pm => ({ value: pm.id, label: pm.name }));

    const getDefaultCashPaymentMethod = () => {
        const cashMethod = paymentMethods.find((pm) => pm.name?.toLowerCase() === 'cash' || pm.slug?.toLowerCase() === 'cash');
        return cashMethod?.id || '';
    };

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(receipt?.id || null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        customer: receipt?.customer || "",
        email: receipt?.email || "",
        billingAddress: receipt?.billingAddress || "",
        receiptDate: receipt?.receiptDate || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        receiptNo: receipt?.receiptNo || (nextReceiptNo ? nextReceiptNo : "RCPT-0001"),
        paymentMethod: receipt?.paymentMethod || "",
        depositTo: receipt?.depositTo || "",
        memo: receipt?.memo || "",
        statementMessage: receipt?.statementMessage || "",
        checkDate: receipt?.checkDate || "",
        checkNumber: receipt?.checkNumber || "",
        items: receipt?.items ? receipt.items.map(i => ({
            ...i,
            qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }
        ],
        discount_type: receipt?.discountType || 'percent',
        discount_value: receipt?.discountValue !== undefined ? String(receipt.discountValue) : '0',
        prefix: receipt?.prefix || '',
        memo_on_statement: receipt?.memo_on_statement || '',
        exchange_rate: receipt?.exchange_rate || 1,
        currency_id: receipt?.currency_id || "",
        action: 'save',
        books_pin: ''
    });

    const fetchCustomers = (search = "") => {
        axios.get(route('api.payees', { search, type: 'Customer' })).then(res => setCustomerOptions(res.data));
    };

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => setAccountOptions(res.data));
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

    useEffect(() => {
        fetchCustomers();
        fetchAccounts();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (receipt) {
            setData(prev => ({
                ...prev,
                customer: receipt.customer || "",
                email: receipt.email || "",
                billingAddress: receipt.billingAddress || "",
                receiptDate: receipt.receiptDate || "",
                receiptNo: receipt.receiptNo || "",
                paymentMethod: receipt.paymentMethod || "",
                depositTo: receipt.depositTo || "",
                memo: receipt.memo || "",
                memo_on_statement: receipt.memo_on_statement || "",
                statementMessage: receipt.statementMessage || "",
                checkDate: receipt.checkDate || "",
                checkNumber: receipt.checkNumber || "",
                items: receipt.items && receipt.items.length > 0 ? receipt.items.map(i => ({
                    ...i,
                    qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }
                ],
                discount_type: receipt.discountType || 'percent',
                discount_value: receipt.discountValue !== undefined ? String(receipt.discountValue) : '0',
                prefix: receipt.prefix || '',
                exchange_rate: receipt.exchange_rate || 1,
                currency_id: receipt.currency_id || "",
                action: 'save',
                books_pin: ''
            }));
        } else {
            setData(prev => ({
                ...prev,
                customer: "",
                email: "",
                billingAddress: "",
                receiptDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                receiptNo: nextReceiptNo ? nextReceiptNo : "RCPT-0001",
                paymentMethod: getDefaultCashPaymentMethod() || "",
                depositTo: "",
                memo: "",
                memo_on_statement: "",
                statementMessage: "",
                checkDate: "",
                checkNumber: "",
                items: [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ],
                discount_type: 'percent',
                discount_value: '0',
                prefix: '',
                exchange_rate: 1,
                currency_id: "",
                action: 'save',
                books_pin: ''
            }));
        }
        clearErrors();
    }, [receipt?.id]);

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    const isForeignCurrency = data.currency_id && String(data.currency_id) !== String(auth?.currency?.home_id);
    const foreignCurrency = isForeignCurrency ? currencies.find(c => String(c.id) === String(data.currency_id)) : null;
    const displayCurrencyPrefix = isForeignCurrency && foreignCurrency ? foreignCurrency.symbol : homeCurrencyPrefix;
    const displayCurrencyCode = isForeignCurrency && foreignCurrency ? foreignCurrency.code : defaultCurrencyCode;
    const homeCurrencyCode = currencies.find(c => String(c.id) === String(auth?.currency?.home_id))?.code || defaultCurrencyCode;

    const COLUMNS = [
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
            width: "280px"
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "80px", className: "text-right" },
        { key: "rate", label: `Rate${isForeignCurrency ? ` (${displayCurrencyPrefix})` : ''}`, type: "currency", width: "120px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: `Amount${isForeignCurrency ? ` (${displayCurrencyPrefix})` : ''}`, type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
    ];


    const handlePaymentMethodChange = (val) => {
        const selectedMethod = paymentMethods.find((method) => String(method.id) === String(val));
        const isCheque = selectedMethod?.name?.toLowerCase() === 'cheque';

        setData(prev => ({
            ...prev,
            paymentMethod: val,
            checkDate: isCheque ? prev.checkDate : "",
            checkNumber: isCheque ? prev.checkNumber : "",
        }));
        setIsDirty(true);
    };

    const selectedPaymentMethod = paymentMethods.find((method) => String(method.id) === String(data.paymentMethod));
    const isChequePayment = selectedPaymentMethod?.name?.toLowerCase() === 'cheque';

    useEffect(() => {
        if (!receipt?.id && !data.paymentMethod && paymentMethods.length > 0) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }
    }, [paymentMethods, receipt?.id, data.paymentMethod]);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const subtotal = data.items.reduce((sum, item) => sum + parseCurrency(item.amount), 0);

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

    const handleItemChange = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;

        if (field === "product") {
            const product = productOptions.find(p => p.value === value);
            if (product) {
                let rateValue = parseFloat(product.rate || 0);
                if (isForeignCurrency && data.exchange_rate > 0) {
                    rateValue = rateValue / parseFloat(data.exchange_rate);
                }
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
        setData("items", updated);
        setIsDirty(true);
    };

    const handleSave = (actionType = 'save', pinOverride = null) => {
        const isEdit = !!(receipt?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.receiptDate, auth?.books_lock_date, isEdit)) {
            setPendingAction(actionType);
            setIsPinModalOpen(true);
            return;
        }

        const currentNo = data.receiptNo;

        transform((data) => ({
            ...data,
            action: actionType,
            books_pin: pinOverride !== null ? pinOverride : data.books_pin,
            items: data.items
                .filter(item => item.product || item.description || (item.qty && item.qty !== "0" && item.qty !== "1") || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    qty: String(item.qty).replace(/,/g, ''),
                    rate: String(item.rate).replace(/,/g, ''),
                    amount: String(item.amount).replace(/,/g, '')
                }))
        }));

        setPendingAction(actionType);

        const currentId = savedEntryId || receipt?.id;
        const url = currentId ? route('sales-invoice.update', currentId) : route('sales-invoice.store');
        const submitMethod = currentId ? patch : post;

        submitMethod(url, {
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
                    || page.props?.receipt?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                const serverNextNo = page.props.nextReceiptNo || "";
                if (actionType === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    }
                }

                if (actionType === 'new') {
                    setSavedEntryId(null);
                    setData({
                        customer: "", email: "", billingAddress: "",
                        receiptDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        receiptNo: serverNextNo, paymentMethod: getDefaultCashPaymentMethod() || "", depositTo: "", memo: "", statementMessage: "",
                        items: [
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                        ],
                        discount_type: 'percent',
                        discount_value: '0',
                        prefix: '',
                        memo_on_statement: '',
                        exchange_rate: 1,
                        currency_id: "",
                        action: 'save',
                        books_pin: ''
                    });

                    reset();
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
            historyType="sales_invoice"
            title={
                <div className="flex items-center">
                    Sales Invoice #{data.receiptNo}
                    <BooksLockIndicator date={data.receiptDate} lockDate={auth?.books_lock_date} isEdit={!!(receipt?.id || savedEntryId)} />
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
            }}
            onClearRows={() => {
                setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
            }}
        >
            <Head title="Cash sale" />

            {/* Error Banner */}
            {errors.error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                    {errors.error}
                </div>
            )}

            <div className="py-3 px-1 space-y-4">
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
                                onSearch={fetchCustomers}
                                onAddNew={() => setIsPayeeModalOpen(true)}
                                onChange={(val) => {
                                    const customer = customerOptions.find(c => c.value === val);
                                    setData(d => ({
                                        ...d,
                                        customer: val,
                                        email: customer?.email || d.email,
                                        billingAddress: customer?.billing_address || d.billingAddress
                                    }));
                                    setIsDirty(true);
                                    // ADD THIS - fetch full customer info including email
                                    if (val) {
                                        axios.get(route('api.customers.info', val)).then(res => {
                                            if (res.data) {
                                                setData(d => ({
                                                    ...d,
                                                    email: res.data.email || d.email,
                                                    billingAddress: res.data.billing_address || d.billingAddress
                                                }));
                                            }
                                        }).catch(err => console.error("Failed to fetch customer info:", err));
                                    }
                                }}
                                options={customerOptions}
                                size="sm"
                                error={errors.customer}
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

                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Amount</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{displayCurrencyPrefix}</span>
                            {parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex items-end gap-6 flex-wrap">
                    <div className="w-[180px]">
                        <CommonInput
                            type="date"
                            label="Cash sale date"
                            value={data.receiptDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData('receiptDate', newDate);
                                setIsDirty(true);
                            }}
                            size="sm"
                            error={errors.receiptDate}
                        />
                    </div>
                    <div className="w-[180px]">
                        <SearchableSelect
                            label="Payment method"
                            value={data.paymentMethod}
                            onChange={handlePaymentMethodChange}
                            options={paymentMethodOptions}
                            onAddNew={() => setIsMethodModalOpen(true)}
                            size="sm"
                            error={errors.paymentMethod}
                        />
                    </div>
                    {isChequePayment && (
                        <div className="w-[180px]">
                            <CommonInput
                                type="date"
                                label="Cheque Date"
                                value={data.checkDate}
                                onChange={(e) => { setData('checkDate', e.target.value); setIsDirty(true); }}
                                size="sm"
                                error={errors.checkDate}
                            />
                        </div>
                    )}
                    {isChequePayment && (
                        <div className="w-[180px]">
                            <CommonInput
                                label="Cheque Number"
                                value={data.checkNumber}
                                onChange={(e) => { setData('checkNumber', e.target.value); setIsDirty(true); }}
                                size="sm"
                                error={errors.checkNumber}
                            />
                        </div>
                    )}
                    <div className="w-[240px]">
                        <SearchableSelect
                            label="Deposit to"
                            placeholder="Select account"
                            value={data.depositTo}
                            onSearch={fetchAccounts}
                            onAddNew={() => setIsAccountModalOpen(true)}
                            onChange={(val) => {
                                const selectedAcc = accountOptions.find(a => String(a.value) === String(val));
                                setData(d => ({
                                    ...d,
                                    depositTo: val,
                                    currency_id: selectedAcc?.currency_id || "",
                                }));
                                setIsDirty(true);
                            }}
                            options={accountOptions}
                            size="sm"
                            error={errors.depositTo}
                        />

                    </div>
                    <div>
                        <CurrencyExchangeInput
                            auth={auth}
                            selectedAccount={accountOptions.find(a => String(a.value) === String(data.depositTo))}
                            exchangeRate={data.exchange_rate}
                            onExchangeRateChange={(val) => { setData('exchange_rate', val); setIsDirty(true); }}
                            error={errors.exchange_rate}
                            transactionDate={data.receiptDate}
                            isEdit={!!receipt?.id || !!savedEntryId}
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            label="Receipt no."
                            value={data.receiptNo}
                            onChange={(e) => { setData('receiptNo', e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('receiptNo', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('receiptNo', val);
                            }}
                            size="sm"
                            inputClass="font-mono text-right"
                            error={errors.receiptNo}
                        />
                    </div>
                </div>
            </div>

            <LineItemsTable
                columns={COLUMNS}
                items={data.items}
                handleItemChange={handleItemChange}
                addRow={() => setData("items", [...data.items, { product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }])}
                removeRow={(index) => setData("items", data.items.filter((_, i) => i !== index))}
                clearRows={() => setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }])}
                totals={{ "Total": totalAmount }}
                currencyPrefix={displayCurrencyPrefix}
                hideActions={true}
                errors={errors}
                subtotal={subtotal}
                discountValue={data.discount_value}
                discountType={data.discount_type}
                onDiscountChange={(val, type) => {
                    setData(prev => ({ ...prev, discount_value: val, discount_type: type }));
                    setIsDirty(true);
                }}
                hideSummaryBlock={true}
            />


            <div className="flex justify-between mt-3 items-start">
                <div className="w-[400px] flex flex-col gap-4">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="This will show up on the Cash Sale."
                        value={data.memo}
                        onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                        error={errors.memo}
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
                </div>

                {/* Subtotal / Discount / Total Summary Block */}
                <div className="flex flex-col items-end gap-3 min-w-[300px] bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">{displayCurrencyPrefix}</span>
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
                                className="w-[80px] h-8 text-right text-sm font-medium border border-slate-300 rounded-l-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-2"
                            />
                            <div className="flex h-8 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => { setData(prev => ({ ...prev, discount_type: 'percent' })); setIsDirty(true); }}
                                    className={`px-2 text-xs font-bold transition-colors ${data.discount_type === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setData(prev => ({ ...prev, discount_type: 'fixed' })); setIsDirty(true); }}
                                    className={`px-2 text-xs font-bold transition-colors ${data.discount_type === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {displayCurrencyPrefix}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    {isForeignCurrency && (
                        <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-slate-200">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total ({displayCurrencyCode})</span>
                            <span className="text-lg font-black text-slate-900 flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-400">{displayCurrencyPrefix}</span>
                                {parseFloat(String(totalAmount || 0).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    <div className={`flex justify-between items-center w-full ${isForeignCurrency ? 'mt-1' : 'mt-2 pt-3 border-t border-slate-200'}`}>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total {isForeignCurrency ? `(${homeCurrencyCode})` : ''}</span>
                        <span className="text-lg font-black text-slate-900 flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">{homeCurrencyPrefix}</span>
                            {isForeignCurrency 
                                ? parseFloat(String(totalAmount * (data.exchange_rate || 1)).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                : parseFloat(String(totalAmount || 0).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })
                            }
                        </span>
                    </div>
                </div>
            </div>

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={(newPayee) => {
                    fetchCustomers();
                    if (newPayee) setData("customer", newPayee.value);
                }}
                initialType="customer"
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAccount) => {
                    fetchAccounts();
                    if (newAccount) setData("depositTo", newAccount.value);
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

            <QuickAddPaymentMethod
                isOpen={isMethodModalOpen}
                onClose={() => setIsMethodModalOpen(false)}
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
