import { useState, useEffect, useRef } from "react";
import { useForm, Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddPaymentMethod from "@/Components/QuickAddPaymentMethod";
import { showToast } from "@/Components/ToastNotification";
import QuickAddAccount from "@/Components/QuickAddAccount";
import CurrencyExchangeInput from "@/Components/CurrencyExchangeInput";
import { useDateFormat, formatDate } from "@/Utils/dateFormat";
import CommonButton from "@/Components/CommonButton";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function PayBill({ paymentMethods = [], payment = null }) {
    const { auth } = usePage().props;
    const homeCurrencyObj = typeof auth?.company?.home_currency === 'object' ? auth.company.home_currency : null;
    const homeCurrencyStr = typeof auth?.company?.home_currency === 'string' ? auth.company.home_currency : '';
    const currencyPrefix = auth?.company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || auth?.company?.home_currency_prefix || '';
    const dateFormat = useDateFormat();

    const [supplierOptions, setSupplierOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [bills, setBills] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const actionRef = useRef('save');
    const [isDirty, setIsDirty] = useState(false);

    const getDefaultCashPaymentMethod = () => {
        const cashMethod = paymentMethods.find((pm) => pm.name?.toLowerCase() === 'cash' || pm.slug?.toLowerCase() === 'cash');
        return cashMethod?.id || '';
    };

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        supplier: payment?.supplier || "",
        paymentDate: payment?.paymentDate || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        paymentMethod: payment?.paymentMethod || "",
        referenceNo: payment?.referenceNo || "0001",
        paymentAccount: payment?.paymentAccount || "",
        amount: payment?.amount || "0.00",
        memo: payment?.memo || "",
        checkDate: payment?.checkDate || "",
        checkNumber: payment?.checkNumber || "",
        exchange_rate: payment?.exchange_rate || 1,
        currency_id: payment?.currency_id || "",
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        if (!payment?.id && !data.paymentMethod && paymentMethods.length > 0) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }
    }, [paymentMethods, payment?.id, data.paymentMethod]);

    const handleSupplierChange = (val) => {
        const payee = supplierOptions.find(p => p.value === val);
        setData(prev => ({ 
            ...prev, 
            supplier: val,
            currency_id: payee?.currency_id || prev.currency_id
        }));
        setIsDirty(true);
        if (val) {
            // Fetch outstanding bills
            const url = payment?.receive_payment_id
                ? route('api.suppliers.bills', val) + '?receive_payment_id=' + payment.receive_payment_id
                : route('api.suppliers.bills', val);
            axios.get(url).then(res => {
                setBills(res.data.map(bill => ({
                    ...bill,
                    applied: bill.applied || 0,
                    checked: bill.applied > 0
                })));
            }).catch(err => console.error("Failed to fetch supplier bills:", err));
        } else {
            setBills([]);
            setData(prev => ({ ...prev, supplier: "" }));
        }
    };

    const handleBillCheckToggle = (originalIdx, isChecked) => {
        setBills(prev => {
            const updated = [...prev];
            const bill = updated[originalIdx];
            bill.checked = isChecked;

            const amountVal = parseFloat(String(data.amount).replace(/,/g, '')) || 0;

            if (isChecked) {
                if (amountVal === 0) {
                    bill.applied = bill.open_balance;
                } else {
                    const otherApplied = updated.reduce((sum, item, idx) => {
                        if (idx === originalIdx) return sum;
                        return sum + (parseFloat(item.applied) || 0);
                    }, 0);
                    const remaining = Math.max(0, amountVal - otherApplied);
                    bill.applied = Math.min(bill.open_balance, remaining);
                }
            } else {
                bill.applied = 0;
            }

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);
            setData("amount", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

            return updated;
        });
        setIsDirty(true);
    };

    const handleBillPaymentChange = (originalIdx, value) => {
        setBills(prev => {
            const updated = [...prev];
            const bill = updated[originalIdx];

            const rawVal = value.replace(/[^0-9.,]/g, '');
            bill.applied = rawVal;
            const parsed = parseFloat(rawVal.replace(/,/g, '')) || 0;
            bill.checked = parsed > 0;

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);
            setData("amount", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

            return updated;
        });
        setIsDirty(true);
    };

    const filteredBills = bills.filter(bill => {
        if (!searchQuery) return true;
        return bill.bill_no.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelectAllToggle = (isChecked) => {
        setBills(prev => {
            const amountVal = parseFloat(String(data.amount).replace(/,/g, '')) || 0;
            let currentUnapplied = amountVal;

            const updated = prev.map(bill => {
                const isFiltered = filteredBills.some(f => f.id === bill.id);
                if (!isFiltered) return bill;

                if (isChecked) {
                    if (amountVal === 0) {
                        return {
                            ...bill,
                            checked: true,
                            applied: bill.open_balance
                        };
                    } else {
                        const apply = Math.min(bill.open_balance, currentUnapplied);
                        currentUnapplied = Math.max(0, currentUnapplied - apply);
                        return {
                            ...bill,
                            checked: apply > 0,
                            applied: apply
                        };
                    }
                } else {
                    return {
                        ...bill,
                        checked: false,
                        applied: 0
                    };
                }
            });

            const totalApplied = updated.reduce((sum, item) => sum + (parseFloat(String(item.applied).replace(/,/g, '')) || 0), 0);
            setData("amount", totalApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

            return updated;
        });
    };

    const handleClearPayment = () => {
        setBills(prev => prev.map(bill => ({
            ...bill,
            applied: 0,
            checked: false
        })));
        setData("amount", "0.00");
    };

    // ── Auto-distribute a typed amount across outstanding bills ─────────────
    const handleAmountChange = (rawValue) => {
        // Strip anything that isn't a digit or decimal
        const stripped = rawValue.replace(/[^0-9.]/g, '');
        setData('amount', stripped);
        setIsDirty(true);

        const total = parseFloat(stripped) || 0;

        if (bills.length === 0) return;

        let remaining = total;
        const updated = bills.map(bill => {
            if (remaining <= 0) {
                return { ...bill, applied: 0, checked: false };
            }
            const apply = Math.min(parseFloat(bill.open_balance) || 0, remaining);
            remaining = Math.max(0, remaining - apply);
            return { ...bill, applied: apply > 0 ? apply : 0, checked: apply > 0 };
        });

        setBills(updated);
    };

    const handleAmountBlur = (rawValue) => {
        const num = parseFloat(String(rawValue).replace(/,/g, '')) || 0;
        const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setData('amount', formatted);
        // Re-distribute using the formatted (numeric) value
        handleAmountChange(String(num));
    };


    const amountToApply = bills.reduce((sum, bill) => sum + (parseFloat(String(bill.applied).replace(/,/g, '')) || 0), 0);
    const amountVal = parseFloat(String(data.amount).replace(/,/g, '')) || 0;
    const amountToCredit = Math.max(0, amountVal - amountToApply);

    const fetchSuppliers = (search = "") => {
        axios.get(route('api.payees', { search, type: 'Supplier' })).then(res => {
            setSupplierOptions(res.data);
        });
    };

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => {
            // Usually we only pay from Banks, Cash, Credit Cards. But we'll leave it open like Receive Payment.
            setAccountOptions(res.data);
        });
    };

    useEffect(() => {
        fetchSuppliers();
        fetchAccounts();
    }, []);


    useEffect(() => {
        if (payment) {
            setData({
                supplier: payment.supplier || "",
                paymentDate: payment.paymentDate || "",
                paymentMethod: payment.paymentMethod || "",
                referenceNo: payment.referenceNo || "",
                paymentAccount: payment.paymentAccount || "",
                amount: payment.amount || "0.00",
                memo: payment.memo || "",
                checkDate: payment.checkDate || "",
                checkNumber: payment.checkNumber || "",
                exchange_rate: payment.exchange_rate || 1,
                currency_id: payment.currency_id || "",
                action: 'save'
            });
            if (payment.supplier) {
                axios.get(route('api.suppliers.bills', payment.supplier) + '?receive_payment_id=' + payment.receive_payment_id)
                    .then(res => {
                        setBills(res.data.map(bill => ({
                            ...bill,
                            applied: bill.applied || 0,
                            checked: bill.applied > 0
                        })));
                    })
                    .catch(err => console.error("Failed to fetch supplier bills:", err));
            }
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            setData({
                supplier: "",
                paymentDate: cachedDate,
                paymentMethod: getDefaultCashPaymentMethod() || "",
                referenceNo: "0001",
                paymentAccount: "",
                amount: "0.00",
                memo: "",
                checkDate: "",
                checkNumber: "",
                exchange_rate: 1,
                currency_id: "",
                action: 'save'
            });
            setBills([]);
        }
        clearErrors();
    }, [payment?.id]);

    const methodOptions = paymentMethods.map(m => ({ value: m.id, label: m.name }));

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
        transform((data) => ({
            ...data,
            amount: String(data.amount).replace(/,/g, ''),
            action: actionRef.current,
            bills: bills
                .filter(bill => bill.applied > 0)
                .map(bill => ({
                    id: bill.id,
                    amount: String(bill.applied)
                }))
        }));
    }, [transform, data.amount, bills]);

    const submit = (action = 'save', pinOverride = null) => {
        const isEdit = !!payment?.id;
        if (!pinOverride && isBooksLocked(data.paymentDate, auth?.books_lock_date, isEdit)) {
            actionRef.current = action;
            setPendingAction(action);
            setIsPinModalOpen(true);
            return;
        }

        actionRef.current = action;
        setPendingAction(action);

        transform((d) => ({
            ...d,
            amount: String(d.amount).replace(/,/g, ''),
            action: action,
            books_pin: pinOverride !== null ? pinOverride : d.books_pin,
            bills: bills
                .filter(bill => bill.applied > 0)
                .map(bill => ({
                    id: bill.id,
                    amount: String(bill.applied)
                }))
        }));

        const currentRefNo = data.referenceNo; // capture BEFORE submit

        const url = payment?.id ? route('pay-bill.update', payment.id) : route('pay-bill.store');
        const submitMethod = payment?.id ? patch : post;

        submitMethod(url, {
            preserveScroll: true,
            preserveState: (page) => Object.keys(page.props.errors).length > 0 || action !== 'new',
            onSuccess: () => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');
                if (action === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } 
                }

                if (action === 'new') {
                    const num = parseInt(String(currentRefNo).replace(/[^0-9]/g, '')) || 0;
                    const nextNo = String(num + 1).padStart(4, '0');
                    reset();
                    clearErrors();
                    setBills([]);
                    const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
                    setData({
                        supplier: "", paymentDate: cachedDate, paymentMethod: getDefaultCashPaymentMethod() || "",
                        referenceNo: nextNo, paymentAccount: "", amount: "0.00",
                        memo: "", action: 'save'
                    });
                    setIsDirty(false);
                }
            }
        });
    };

    return (
        <TransactionLayout
            historyType="pay_bill"
            title={
                <div className="flex items-center">
                    {`Pay Bill #${data.referenceNo}`}
                    <BooksLockIndicator date={data.paymentDate} lockDate={auth?.books_lock_date} isEdit={!!payment?.id} />
                </div>
            }
            amount={parseFloat(String(data.amount || 0).replace(/,/g, '')).toFixed(2)}
            onSave={() => submit('save')}
            onSaveAndClose={() => submit('close')}
            onSaveAndNew={() => submit('new')}
            processing={processing}
            dirty={isDirty}
        >
            <Head title="Pay Bill" />

            {/* Error Banner */}
            {errors.error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                    {errors.error}
                </div>
            )}

            <div className="py-6 space-y-8">
                {/* ROW 1: Supplier & Summaries */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Supplier"
                                options={supplierOptions}
                                value={data.supplier}
                                onSearch={fetchSuppliers}
                                onAddNew={() => setIsPayeeModalOpen(true)}
                                onChange={handleSupplierChange}
                                placeholder="Choose a supplier"
                                size="sm"
                                error={errors.supplier}
                            />
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Amount Paid</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{currencyPrefix}</span>
                            {parseFloat(String(data.amount || 0).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* ROW 2: Payment Details */}
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
                            onChange={(e) => { setData("referenceNo", e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('referenceNo', val);
                                setTimeout(() => e.target.select(), 0);
                            }}
                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('referenceNo', val);
                            }}
                            size="sm"
                            inputClass="font-mono"
                            error={errors.referenceNo}
                        />
                    </div>
                    <div className="w-[220px]">
                        <SearchableSelect
                            label="Payment Account"
                            options={accountOptions}
                            onSearch={fetchAccounts}
                            onAddNew={() => setIsAccountModalOpen(true)}
                            value={data.paymentAccount}
                            onChange={(val) => { setData("paymentAccount", val); setIsDirty(true); }}
                            placeholder="Select Account"
                            size="sm"
                            error={errors.paymentAccount}
                        />
                    </div>
                    {/* Amount input — drives auto-distribution across bills */}
                    <div className="w-[160px]">
                        <CommonInput
                            label="Amount"
                            value={data.amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            onFocus={(e) => {
                                // Strip formatting so the user sees a plain number
                                const plain = String(data.amount).replace(/,/g, '');
                                setData('amount', plain === '0.00' ? '' : plain);
                                setTimeout(() => e.target.select(), 0);
                            }}
                            onBlur={(e) => handleAmountBlur(e.target.value)}
                            placeholder="0.00"
                            size="sm"
                            inputClass="font-mono text-right"
                            error={errors.amount}
                        />
                    </div>
                </div>

                <CurrencyExchangeInput
                    auth={auth}
                    selectedAccount={accountOptions.find(a => String(a.value) === String(data.paymentAccount))}
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
                {data.supplier && (
                    <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Outstanding Bills</h3>
                            <div className="flex items-center gap-3">
                                <div className="relative w-48">
                                    <input
                                        type="text"
                                        placeholder="Find Bill No."
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
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-150">
                                        <th className="p-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={filteredBills.length > 0 && filteredBills.every(bill => bill.checked)}
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
                                    {filteredBills.map((bill) => {
                                        const originalIdx = bills.findIndex(b => b.id === bill.id);
                                        return (
                                            <tr key={bill.id} className={`hover:bg-slate-50/20 transition-colors ${bill.checked ? 'bg-green-50/10' : ''}`}>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={bill.checked}
                                                        onChange={(e) => handleBillCheckToggle(originalIdx, e.target.checked)}
                                                        className="rounded-sm border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold">
                                                    <a href={route('bill.edit', bill.journal_entry_id)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline cursor-pointer">
                                                        Bill # {bill.bill_no} ({formatDate(bill.bill_date, dateFormat)})
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-medium">
                                                    {formatDate(bill.due_date, dateFormat)}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-mono text-right">
                                                    {currencyPrefix} {parseFloat(bill.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-650 font-mono text-right">
                                                    {currencyPrefix} {parseFloat(bill.open_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="text"
                                                        placeholder="0.00"
                                                        value={bill.applied || ""}
                                                        onChange={(e) => handleBillPaymentChange(originalIdx, e.target.value)}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                                            if (val > 0) {
                                                                handleBillPaymentChange(originalIdx, Math.min(bill.open_balance, val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                            } else {
                                                                handleBillPaymentChange(originalIdx, "");
                                                            }
                                                        }}
                                                        onFocus={(e) => {
                                                            const val = e.target.value.replace(/,/g, '');
                                                            handleBillPaymentChange(originalIdx, val);
                                                            setTimeout(() => e.target.select(), 0);
                                                        }}
                                                        className="w-full px-2.5 h-[30px] border border-slate-300 rounded-sm text-xs font-mono text-slate-800 text-right focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-white"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredBills.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                No outstanding bills found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {bills.length > 0 && (
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
                        fetchSuppliers();
                        setData("supplier", newPayee.value);
                    }
                }}
                initialType="supplier"
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAccount) => {
                    fetchAccounts();
                    if (newAccount) {
                        setData("paymentAccount", newAccount.value);
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
