import { useState, useEffect, useRef } from "react";
import { useForm, usePage, Head } from "@inertiajs/react";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddAccount from "@/Components/QuickAddAccount";
import QuickAddPayee from "@/Components/QuickAddPayee";
import { showToast } from "@/Components/ToastNotification";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";
import axios from "axios";

export default function ChequeForm({
    auth,
    cheque = null,
    nextChequeNo = ""
}) {
    const company = auth.company;
    const currencyPrefix = company?.home_currency_prefix || company?.home_currency || '';
    const defaultCurrencyCode = company?.home_currency || company?.home_currency_prefix || '';

    const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);

    const [payeeOptions, setPayeeOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [customerOptions, setCustomerOptions] = useState([]);

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [accountModalType, setAccountModalType] = useState('asset');

    const fetchPayees = (search = "") => {
        axios.get(route('api.payees', { search })).then(res => {
            setPayeeOptions(res.data);
        });
    };

    const fetchAccounts = (search = "", type = "") => {
        axios.get(route('api.accounts', { search, type })).then(res => {
            setAccountOptions(res.data);
        });
    };

    const fetchCustomers = () => {
        axios.get(route('api.payees')).then(res => {
            setCustomerOptions(
                res.data
                    .filter(p => p.type === 'Customer')
                    .map(p => ({ value: p.value, label: p.label }))
            );
        });
    };

    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(cheque?.id || null);

    useEffect(() => {
        fetchPayees();
        fetchAccounts();
        fetchCustomers();
    }, []);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const getInitialPaymentDate = () => {
        if (cheque?.date) return cheque.date;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const initialPaymentDate = getInitialPaymentDate();

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        payee: cheque?.payee || "",
        account: cheque?.account || "",
        date: cheque?.date || initialPaymentDate,
        cheque_no: cheque?.cheque_no || nextChequeNo || "",
        mailing_address: cheque?.mailing_address || "",
        memo: cheque?.memo || "",
        items: cheque?.items && cheque.items.length > 0 ? cheque.items.map(i => ({ ...i, amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })) : [
            { category: "", description: "", amount: "0.00", customer_id: "" },
        ],
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    const actionRef = useRef('save');


    const totalAmount = (
        data.items.reduce((sum, item) => sum + parseCurrency(item.amount), 0)
    ).toFixed(2);

    const selectedAccountBalance = accountOptions.find(a => String(a.value) === String(data.account))?.balance || "0.00";

    useEffect(() => {
        if (cheque) {
            setData({
                payee: cheque.payee || "",
                account: cheque.account || "",
                date: cheque.date || "",
                cheque_no: cheque.cheque_no || "",
                mailing_address: cheque.mailing_address || "",
                memo: cheque.memo || "",
                items: cheque.items && cheque.items.length > 0 ? cheque.items.map(i => ({ ...i, amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })) : [
                    { category: "", description: "", amount: "0.00", customer_id: "" }
                ],
                action: 'save'
            });
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            setData({
                payee: "",
                account: "",
                date: cachedDate,
                cheque_no: nextChequeNo || "",
                mailing_address: "",
                memo: "",
                items: [
                    { category: "", description: "", amount: "0.00", customer_id: "" },
                ],
                action: 'save'
            });
        }
        clearErrors();
    }, [cheque?.id]);

    useEffect(() => {
        transform((data) => ({
            ...data,
            action: actionRef.current,
            items: data.items
                .filter(item => item.category && (parseFloat(String(item.amount).replace(/,/g, '')) > 0))
                .map(item => ({
                    ...item,
                    amount: String(item.amount).replace(/,/g, '')
                })),
        }));
    }, [transform]);

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...data.items];
        updatedItems[index][field] = value;
        setData("items", updatedItems);
        setIsDirty(true);
    };

    const handlePaymentDateChange = (dateVal) => {
        localStorage.setItem('last_transaction_date', dateVal);
        setData("date", dateVal);
        setIsDirty(true);
    };

    const handleAccountChange = (val) => {
        setData("account", val);
        setIsDirty(true);
    };

    const handleSave = (action = 'save', pinOverride = null) => {
        const isEdit = !!(cheque?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.date, auth?.books_lock_date, isEdit)) {
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
                .filter(item => item.category && (parseFloat(String(item.amount).replace(/,/g, '')) > 0))
                .map(item => ({
                    ...item,
                    amount: String(item.amount).replace(/,/g, '')
                })),
        }));

        const currentId = savedEntryId || cheque?.id;
        const url = currentId ? route('cheque.update', currentId) : route('cheque.store');
        const method = currentId ? patch : post;

        method(url, {
            preserveScroll: true,
            preserveState: (page) => Object.keys(page.props.errors).length > 0 || action === 'save',
            onSuccess: (page) => {
                showToast('success', 'Cheque saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.cheque?.id
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
                    const currentNo = data.cheque_no || nextChequeNo || 'CHQ-0001';
                    const num = parseInt(String(currentNo).replace(/[^0-9]/g, '')) || 0;
                    const nextRef = 'CHQ-' + String(num + 1).padStart(4, '0');

                    reset();
                    clearErrors();
                    fetchAccounts();
                    const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
                    setData({
                        payee: "", account: "", date: cachedDate, cheque_no: nextRef, mailing_address: "", memo: "",
                        items: [{ category: "", description: "", amount: "0.00", customer_id: "" }],
                        action: 'save'
                    });
                    setIsDirty(false);
                }
            }
        });
    };

    const CHEQUE_COLUMNS = [
        {
            key: "category",
            label: "Category",
            placeholder: "Choose a category",
            options: accountOptions,
            type: "select",
            width: "280px",
            onAddNew: () => {
                setAccountModalType('payment');
                setIsAccountModalOpen(true);
            }
        },
        { key: "description", label: "Description", placeholder: "What was this for?" },
        {
            key: "amount",
            label: "Amount",
            type: "currency",
            className: "text-right",
            inputClass: "text-right",
            width: "120px"
        },
        {
            key: "customer_id",
            label: "Customer",
            placeholder: "Select customer",
            options: customerOptions,
            type: "select",
            width: "220px",
        }
    ];

    return (
        <TransactionLayout
            historyType="cheque"
            title={
                <div className="flex items-center">
                    {cheque?.id ? `Edit Cheque no.${data.cheque_no}` : "New Cheque"}
                    <BooksLockIndicator date={data.date} lockDate={auth?.books_lock_date} isEdit={!!(cheque?.id || savedEntryId)} />
                </div>
            }
            amount={totalAmount}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
        >
            <Head title={cheque?.id ? `Edit Cheque no.${data.cheque_no}` : "New Cheque"} />
            <div className="py-6 px-1 space-y-8">
                {errors.error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                        {errors.error}
                    </div>
                )}

                {/* ROW 1 */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Payee"
                                placeholder="Who did you pay?"
                                value={data.payee}
                                onChange={(val) => { setData("payee", val); setIsDirty(true); }}
                                options={payeeOptions}
                                size="sm"
                                error={errors.payee}
                                onAddNew={() => setIsPayeeModalOpen(true)}
                            />
                        </div>
                        <div className="w-[380px]">
                            <div className="mb-6">
                                <SearchableSelect
                                    label="Bank Account"
                                    placeholder="Select account"
                                    value={data.account}
                                    onChange={handleAccountChange}
                                    options={accountOptions}
                                    size="sm"
                                    error={errors.account}
                                    onAddNew={() => {
                                        setAccountModalType('asset');
                                        setIsAccountModalOpen(true);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {data.account && (
                        <div className="text-right flex flex-col items-end">
                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Account Balance</p>
                            <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                                <span className="text-slate-400 text-sm font-medium mr-1">{currencyPrefix}</span>
                                {parseFloat(selectedAccountBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>

                {/* ROW 2 */}
                <div className="flex items-end gap-6">
                    <div className="w-[200px]">
                        <CommonInput
                            type="date"
                            label="ReceivePayment Date"
                            value={data.date}
                            onChange={(e) => handlePaymentDateChange(e.target.value)}
                            size="sm"
                            error={errors.date}
                        />
                    </div>
                    <div className="w-[180px]">
                        <CommonInput
                            label="Cheque no."
                            placeholder=""
                            value={data.cheque_no}
                            onChange={(e) => { setData("cheque_no", e.target.value); setIsDirty(true); }}
                            size="sm"
                            error={errors.cheque_no}
                        />
                    </div>
                </div>
            </div>

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
                            columns={CHEQUE_COLUMNS}
                            items={data.items}
                            handleItemChange={handleItemChange}
                            addRow={() => { setData("items", [...data.items, { category: "", description: "", amount: "0.00", customer_id: "" }]); setIsDirty(true); }}
                            removeRow={(index) => {
                                const remaining = data.items.filter((_, i) => i !== index);
                                setData("items", remaining.length > 0 ? remaining : [{ category: "", description: "", amount: "0.00", customer_id: "" }]);
                                setIsDirty(true);
                            }}
                            clearRows={() => { setData("items", [{ category: "", description: "", amount: "0.00", customer_id: "" }]); setIsDirty(true); }}
                            currencyPrefix={currencyPrefix}
                            hideActions={true}
                        />
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-12 gap-8 pb-12">
                <div className="col-span-4">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="Add a memo..."
                        value={data.memo}
                        onChange={(e) => { setData("memo", e.target.value); setIsDirty(true); }}
                        className="h-24"
                        size="sm"
                        error={errors.memo}
                    />
                </div>
                <div className="col-span-8 flex flex-col justify-end items-end pb-2">
                    <div className="text-right flex items-center gap-6">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Grand Total</span>
                        <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-sm font-bold mr-2">{currencyPrefix}</span>
                            {parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={(newPayee) => {
                    if (newPayee) {
                        fetchPayees();
                        setData("payee", newPayee.value);
                    }
                }}
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                type={accountModalType}
                onSuccess={(newAcc) => {
                    if (newAcc) {
                        fetchAccounts();
                        setData("account", newAcc.value);
                    }
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
