import { useState, useEffect, useCallback } from "react";
import { useForm, Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddPaymentMethod from "@/Components/QuickAddPaymentMethod";
import { showToast } from "@/Components/ToastNotification";
import { useDateFormat, formatDate } from "@/Utils/dateFormat";
import CommonButton from "@/Components/CommonButton";
import QuickAddAccount from "@/Components/QuickAddAccount";
import CurrencyExchangeInput from "@/Components/CurrencyExchangeInput";
import PinPromptModal from "@/Components/PinPromptModal";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function ReceivePaymentForm({ paymentMethods = [], payment = null, nextPaymentNo = "" }) {
    const { auth } = usePage().props;
    const homeCurrencyObj = typeof auth?.company?.home_currency === 'object' ? auth.company.home_currency : null;
    const homeCurrencyStr = typeof auth?.company?.home_currency === 'string' ? auth.company.home_currency : '';
    const currencyPrefix = auth?.company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || auth?.company?.home_currency_prefix || '';
    const dateFormat = useDateFormat();

    const [customerOptions, setCustomerOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [credit_invoices, setInvoices] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(payment?.id || null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        customer: payment?.customer || "",
        email: payment?.email || "",
        paymentDate: payment?.paymentDate || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        paymentMethod: payment?.paymentMethod || "",
        referenceNo: payment?.referenceNo || nextPaymentNo || "",
        depositTo: payment?.depositTo || "",
        amountReceived: payment?.amountReceived ? parseFloat(payment.amountReceived).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00",
        memo: payment?.memo || "",
        checkDate: payment?.checkDate || "",
        checkNumber: payment?.checkNumber || "",
        exchange_rate: payment?.exchange_rate || 1,
        currency_id: payment?.currency_id || "",
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    const getDefaultCashPaymentMethod = () => {
        const cashMethod = paymentMethods.find((pm) => pm.name?.toLowerCase() === 'cash' || pm.slug?.toLowerCase() === 'cash');
        return cashMethod?.id || '';
    };

    useEffect(() => {
        if (!payment?.id && !data.paymentMethod && paymentMethods.length > 0) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }
    }, [paymentMethods, payment?.id, data.paymentMethod]);


    const handleCustomerChange = (val) => {
        setData(prev => ({ ...prev, customer: val }));
        setIsDirty(true);
        if (val) {
            axios.get(route('api.customers.info', val)).then(res => {
                if (res.data && res.data.email) {
                    setData(prev => ({ ...prev, customer: val, email: res.data.email }));
                }
            }).catch(err => console.error("Failed to fetch customer info:", err));

            // Fetch outstanding credit_invoices
            const url = payment?.receive_payment_id
                ? route('api.customers.credit_invoices', val) + '?receive_payment_id=' + payment.receive_payment_id
                : route('api.customers.credit_invoices', val);
            axios.get(url).then(res => {
                setInvoices(res.data.map(inv => ({
                    ...inv,
                    applied: inv.applied || 0,
                    checked: inv.applied > 0
                })));
            }).catch(err => console.error("Failed to fetch customer credit_invoices:", err));
        } else {
            setInvoices([]);
            setData(prev => ({ ...prev, customer: "", email: "" }));
        }
    };

    const handleInvoiceCheckToggle = (originalIdx, isChecked) => {
        setInvoices(prev => {
            const updated = [...prev];
            const inv = updated[originalIdx];
            inv.checked = isChecked;

            const amountReceivedVal = parseFloat(String(data.amountReceived).replace(/,/g, '')) || 0;

            if (isChecked) {
                if (amountReceivedVal === 0) {
                    inv.applied = inv.open_balance;
                } else {
                    const otherApplied = updated.reduce((sum, item, idx) => {
                        if (idx === originalIdx) return sum;
                        return sum + (parseFloat(item.applied) || 0);
                    }, 0);
                    const remaining = Math.max(0, amountReceivedVal - otherApplied);
                    inv.applied = Math.min(inv.open_balance, remaining);
                }
            } else {
                inv.applied = 0;
            }

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);

            // Only increase amountReceived to cover the checked invoices, never decrease it automatically
            if (totalApplied > amountReceivedVal) {
                setData("amountReceived", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }

            return updated;
        });
    };
    const autoApplyAmount = (totalAmount) => {
        setInvoices(prev => {
            let remaining = totalAmount;
            return prev.map(inv => {
                if (remaining <= 0) {
                    return { ...inv, checked: false, applied: 0 };
                }
                const applyAmount = Math.min(inv.open_balance, remaining);
                remaining -= applyAmount;
                return {
                    ...inv,
                    checked: applyAmount > 0,
                    applied: applyAmount
                };
            });
        });
    };
    const handleInvoicePaymentChange = (originalIdx, value) => {
        setInvoices(prev => {
            const updated = [...prev];
            const inv = updated[originalIdx];

            const rawVal = value.replace(/[^0-9.,]/g, '');
            inv.applied = rawVal;
            const parsed = parseFloat(rawVal.replace(/,/g, '')) || 0;
            inv.checked = parsed > 0;

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);
            const amountReceivedVal = parseFloat(String(data.amountReceived).replace(/,/g, '')) || 0;

            if (totalApplied > amountReceivedVal) {
                setData("amountReceived", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }

            return updated;
        });
    };

    const filteredInvoices = credit_invoices.filter(inv => {
        if (!searchQuery) return true;
        return inv.invoice_no.toLowerCase().includes(searchQuery.toLowerCase());
    });


    const handlePaymentMethodChange = (val) => {
        const selectedMethod = paymentMethods.find((method) => method.id === val);
        const isCheque = selectedMethod?.name?.toLowerCase() === 'cheque';

        setData(prev => ({
            ...prev,
            paymentMethod: val,
            checkDate: isCheque ? prev.checkDate : "",
            checkNumber: isCheque ? prev.checkNumber : ""
        }));
        setIsDirty(true);
    };

    const selectedPaymentMethod = paymentMethods.find((method) => method.id === data.paymentMethod);
    const isChequePayment = selectedPaymentMethod?.name?.toLowerCase() === 'cheque';

    const handleSelectAllToggle = (isChecked) => {
        setInvoices(prev => {
            const amountReceivedVal = parseFloat(String(data.amountReceived).replace(/,/g, '')) || 0;
            let currentUnapplied = amountReceivedVal;

            const updated = prev.map(inv => {
                const isFiltered = filteredInvoices.some(f => f.id === inv.id);
                if (!isFiltered) return inv;

                if (isChecked) {
                    if (amountReceivedVal === 0) {
                        return {
                            ...inv,
                            checked: true,
                            applied: inv.open_balance
                        };
                    } else {
                        const apply = Math.min(inv.open_balance, currentUnapplied);
                        currentUnapplied = Math.max(0, currentUnapplied - apply);
                        return {
                            ...inv,
                            checked: apply > 0,
                            applied: apply
                        };
                    }
                } else {
                    return {
                        ...inv,
                        checked: false,
                        applied: 0
                    };
                }
            });

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);
            if (totalApplied > amountReceivedVal) {
                setData("amountReceived", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }

            return updated;
        });
    };

    const handleClearPayment = () => {
        setInvoices(prev => prev.map(inv => ({
            ...inv,
            applied: 0,
            checked: false
        })));
        setData("amountReceived", "0.00");
    };

    const amountToApply = credit_invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.applied).replace(/,/g, '')) || 0), 0);
    const amountReceivedVal = parseFloat(String(data.amountReceived).replace(/,/g, '')) || 0;
    const amountToCredit = Math.max(0, amountReceivedVal - amountToApply);

    const fetchCustomers = useCallback((search = "") => {
        axios.get(route('api.payees', { search, type: 'Customer' })).then(res => {
            setCustomerOptions(res.data);
        });
    }, []);

    const fetchAccounts = useCallback((search = "") => {
        axios.get(route('api.accounts', { search })).then(res => {
            setAccountOptions(res.data);
        });
    }, []);

    useEffect(() => {
        fetchCustomers();
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (payment) {
            setData({
                customer: payment.customer || "",
                email: payment.email || "",
                paymentDate: payment.paymentDate || "",
                paymentMethod: payment.paymentMethod || "",
                referenceNo: payment.referenceNo || "",
                depositTo: payment.depositTo || "",
                amountReceived: payment.amountReceived || "0.00",
                memo: payment.memo || "",
                checkDate: payment.checkDate || "",
                checkNumber: payment.checkNumber || "",
                exchange_rate: payment.exchange_rate || 1,
                currency_id: payment.currency_id || "",
                action: 'save',
                books_pin: ''
            });
            if (payment.customer) {
                axios.get(route('api.customers.credit_invoices', payment.customer) + '?receive_payment_id=' + payment.receive_payment_id)
                    .then(res => {
                        setInvoices(res.data.map(inv => ({
                            ...inv,
                            applied: inv.applied || 0,
                            checked: inv.applied > 0
                        })));
                    })
                    .catch(err => console.error("Failed to fetch customer credit_invoices:", err));
            }
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            setData({
                customer: "",
                email: "",
                paymentDate: cachedDate,
                paymentMethod: getDefaultCashPaymentMethod() || "",
                referenceNo: nextPaymentNo || "",
                depositTo: "",
                amountReceived: "0.00",
                memo: "",
                checkDate: "",
                checkNumber: "",
                exchange_rate: 1,
                currency_id: "",
                action: 'save',
                books_pin: ''
            });
            setInvoices([]);
            clearErrors();
            setIsDirty(false);
            setIsPinModalOpen(false);
            setPendingAction(null);
        }
        clearErrors();
    }, [payment?.id]);

    const methodOptions = paymentMethods.map(m => ({ value: m.id, label: m.name }));


    useEffect(() => {
        transform((data) => ({
            ...data,
            amountReceived: String(data.amountReceived).replace(/,/g, ''),
            credit_invoices: credit_invoices
                .filter(inv => inv.applied > 0)
                .map(inv => ({
                    id: inv.id,
                    amount: String(inv.applied)
                }))
        }));
    }, [data.amountReceived, credit_invoices]);

    useEffect(() => {
        if (errors.books_pin === 'BOOKS_LOCKED_PIN_REQUIRED') {
            setIsPinModalOpen(true);
        }
    }, [errors.books_pin]);

    const submit = (action = 'save', pinOverride = null) => {
        const isEdit = !!(payment?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.paymentDate, auth?.books_lock_date, isEdit)) {
            setPendingAction(action);
            setIsPinModalOpen(true);
            return;
        }

        setPendingAction(action);
        const currentId = savedEntryId || payment?.id;
        const url = currentId ? route('receive-payment.update', currentId) : route('receive-payment.store');
        const submitMethod = currentId ? patch : post;

        const currentRef = data.referenceNo || nextPaymentNo || '0001'; // capture BEFORE reset

        transform((d) => ({
            ...d,
            action: action,
            books_pin: pinOverride !== null ? pinOverride : d.books_pin,
            amountReceived: String(d.amountReceived).replace(/,/g, ''),
            credit_invoices: credit_invoices
                .filter(inv => inv.applied > 0)
                .map(inv => ({
                    id: inv.id,
                    amount: String(inv.applied)
                }))
        }));

        submitMethod(url, {
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
                    || page.props?.payment?.id;
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
                    const num = parseInt(String(currentRef).replace(/[^0-9]/g, '')) || 1000;
                    const nextRef = String(num + 1).padStart(4, '0');

                    reset();
                    clearErrors();
                    setInvoices([]);
                    const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
                    setData({
                        customer: "", email: "", paymentDate: cachedDate,
                        paymentMethod: getDefaultCashPaymentMethod() || "", referenceNo: nextRef,
                        depositTo: "", amountReceived: "0.00", memo: "", 
                        exchange_rate: 1, currency_id: "", action: 'save',
                        books_pin: ''
                    });
                    setIsDirty(false);
                }
            },
            onError: () => {
                if (errors.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED') {
                    setIsPinModalOpen(false);
                }
            }
        });
    };

    return (
        <TransactionLayout
            historyType="receive_payment"
            title={
                <div className="flex items-center">
                    {payment?.id ? `Edit Receive Payment no.${data.referenceNo}` : "Receive Payment"}
                    <BooksLockIndicator date={data.paymentDate} lockDate={auth?.books_lock_date} isEdit={!!(payment?.id || savedEntryId)} />
                </div>
            }
            amount={parseFloat(String(data.amountReceived || 0).replace(/,/g, '')).toFixed(2)}
            onSave={() => submit('save')}
            onSaveAndClose={() => submit('close')}
            onSaveAndNew={() => submit('new')}
            processing={processing}
            dirty={isDirty}
        >
            <Head title="Receive Payment" />

            {/* Error Banner */}
            {errors.error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                    {errors.error}
                </div>
            )}

            <div className="py-6 space-y-8">
                {/* ROW 1: Customer & Summaries */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Customer"
                                options={customerOptions}
                                value={data.customer}
                                onSearch={fetchCustomers}
                                onAddNew={() => setIsPayeeModalOpen(true)}
                                onChange={handleCustomerChange}
                                placeholder="Choose a customer"
                                size="sm"
                                error={errors.customer}
                            />
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Amount Received</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{currencyPrefix}</span>
                            {parseFloat(String(data.amountReceived || 0).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* ROW 2: ReceivePayment Details */}
                <div className="flex items-end gap-6">
                    <div className="w-[180px]">
                        <CommonInput
                            type="date"
                            placeholder={formatDate(new Date(), dateFormat)}
                            label="Payment Date"
                            value={data.paymentDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData("paymentDate", newDate);
                                setIsDirty(true);
                            }}
                            size="sm"
                            error={errors.paymentDate}
                        />
                    </div>
                    <div className="w-[220px]">
                        <SearchableSelect
                            label="Payment Method"
                            placeholder="Select method"
                            value={data.paymentMethod}
                            onChange={handlePaymentMethodChange}
                            options={methodOptions}
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
                    <div className="w-[180px]">
                        <CommonInput
                            label="Reference no."
                            value={data.referenceNo}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                setData("referenceNo", val);
                                setIsDirty(true);
                            }}

                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData("referenceNo", val);
                                // Select all after state update
                                setTimeout(() => e.target.select(), 0);
                            }}
                            size="sm"
                            inputClass="font-mono"
                            error={errors.referenceNo}
                        />
                    </div>

                    <div className="w-[220px]">
                        <SearchableSelect
                            label="Deposit To"
                            options={accountOptions}
                            onSearch={fetchAccounts}
                            onAddNew={() => setIsAccountModalOpen(true)}
                            value={data.depositTo}
                            onChange={(val) => { 
                                setData(prev => ({
                                    ...prev,
                                    depositTo: val,
                                    currency_id: accountOptions.find(a => String(a.value) === String(val))?.currency_id || prev.currency_id
                                }));
                                setIsDirty(true); 
                            }}
                            placeholder="Select Account"
                            size="sm"
                            error={errors.depositTo}
                        />
                    </div>

                    <div className="w-[180px]">
                        <CommonInput
                            label="Amount Received"
                            value={data.amountReceived}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9.]/g, '');
                                setData("amountReceived", raw);
                                setIsDirty(true);
                                autoApplyAmount(parseFloat(raw) || 0);
                            }}
                            onFocus={(e) => {
                                const val = String(data.amountReceived).replace(/,/g, '');
                                setData("amountReceived", val);
                                setTimeout(() => e.target.select(), 0);
                            }}
                            onBlur={(e) => {
                                const val = parseFloat(String(data.amountReceived).replace(/,/g, '')) || 0;
                                setData("amountReceived", val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            size="sm"
                            inputClass="font-mono text-right"
                            error={errors.amountReceived}
                        />
                    </div>
                </div>

                <CurrencyExchangeInput
                    auth={auth}
                    selectedAccount={accountOptions.find(a => String(a.value) === String(data.depositTo))}
                    exchangeRate={data.exchange_rate}
                    onExchangeRateChange={(val) => { setData('exchange_rate', val); setIsDirty(true); }}
                    error={errors.exchange_rate}
                    transactionDate={data.paymentDate}
                    isEdit={!!payment?.id || !!savedEntryId}
                />

                {/* ROW 3: Memo */}
                <div className="w-[500px] mt-8 pt-4 border-t border-slate-100">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="Add a memo..."
                        value={data.memo}
                        onChange={(e) => { setData("memo", e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                        error={errors.memo}
                    />
                </div>

                {/* Outstanding Transactions Section */}
                {data.customer && (
                    <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Outstanding Transactions</h3>
                            <div className="flex items-center gap-3">
                                <div className="relative w-48">
                                    <input
                                        type="text"
                                        placeholder="Find Credit Sale No."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-3 pr-8 h-[30px] bg-white border border-slate-350 rounded-md text-xs focus:border-green-600 focus:ring-0 focus:outline-hidden"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="px-3 h-[30px] rounded-md border border-green-650 text-green-655 font-bold text-[10px] uppercase tracking-wider hover:bg-green-50 transition-all flex items-center justify-center gap-1"
                                >
                                    Filter <span className="text-[9px] font-bold">&gt;</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="text-slate-505 hover:text-slate-850 text-[10px] uppercase tracking-wider font-bold"
                                >
                                    All
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-150">
                                        <th className="p-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={filteredInvoices.length > 0 && filteredInvoices.every(inv => inv.checked)}
                                                onChange={(e) => handleSelectAllToggle(e.target.checked)}
                                                className="rounded-sm border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Original Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Open Balance</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[160px]">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredInvoices.map((inv) => {
                                        const originalIdx = credit_invoices.findIndex(i => i.id === inv.id);
                                        return (
                                            <tr key={inv.id} className={`hover:bg-slate-50/20 transition-colors ${inv.checked ? 'bg-green-50/10' : ''}`}>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={inv.checked}
                                                        onChange={(e) => handleInvoiceCheckToggle(originalIdx, e.target.checked)}
                                                        className="rounded-sm border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold">
                                                    <a href={route('credit-invoice.edit', inv.journal_entry_id)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline cursor-pointer">
                                                        Credit Sale # {inv.invoice_no} ({formatDate(inv.invoice_date, dateFormat)})
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-medium">
                                                    {formatDate(inv.due_date, dateFormat)}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-mono text-right">
                                                    {currencyPrefix} {parseFloat(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-mono text-right">
                                                    {currencyPrefix} {parseFloat(inv.open_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="text"
                                                        placeholder="0.00"
                                                        value={inv.applied || ""}
                                                        onChange={(e) => handleInvoicePaymentChange(originalIdx, e.target.value)}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                                            if (val > 0) {
                                                                handleInvoicePaymentChange(originalIdx, Math.min(inv.open_balance, val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                            } else {
                                                                handleInvoicePaymentChange(originalIdx, "");
                                                            }
                                                        }}
                                                        onFocus={(e) => {
                                                            const val = e.target.value.replace(/,/g, '');
                                                            handleInvoicePaymentChange(originalIdx, val);
                                                            setTimeout(() => e.target.select(), 0);
                                                        }}
                                                        className="w-full px-2.5 h-[30px] border border-slate-300 rounded-sm text-xs font-mono text-slate-800 text-right focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-white"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                No outstanding credit sales found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {credit_invoices.length > 0 && (
                            <div className="flex justify-between items-start pt-4">
                                <CommonButton
                                    type="button"
                                    onClick={handleClearPayment}
                                    variant="ghost"
                                    className="!border-green-600 !text-green-600 hover:!bg-green-50"
                                >
                                    Clear Payment
                                </CommonButton>
                                <div className="text-right space-y-1.5 font-bold">
                                    <div className="flex justify-end items-center gap-10 text-[10px] text-slate-400 uppercase tracking-wider">
                                        <span>Amount to Apply</span>
                                        <span className="font-mono text-slate-850 text-xs">
                                            {currencyPrefix} {amountToApply.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-end items-center gap-10 text-[10px] text-slate-400 uppercase tracking-wider">
                                        <span>Amount to Credit</span>
                                        <span className="font-mono text-slate-850 text-xs">
                                            {currencyPrefix} {amountToCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={(newPayee) => {
                    if (newPayee) {
                        fetchCustomers();
                        setData("customer", newPayee.value);
                    }
                }}
                initialType="customer"
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAccount) => {
                    fetchAccounts();
                    if (newAccount) {
                        setData("depositTo", newAccount.value);
                    }
                }}
            />

            <QuickAddPaymentMethod
                isOpen={isMethodModalOpen}
                onClose={() => setIsMethodModalOpen(false)}
                onSuccess={(newMethod) => {
                    router.reload({ only: ['paymentMethods'] });
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
                    submit(pendingAction, pin);
                }}
                errorMessage={errors.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? errors.books_pin : null}
            />

        </TransactionLayout>
    );
}
