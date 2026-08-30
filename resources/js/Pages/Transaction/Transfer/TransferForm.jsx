import { useState, useEffect } from "react";
import { useForm, Head, usePage } from "@inertiajs/react";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddAccount from "@/Components/QuickAddAccount";
import CurrencyExchangeInput from "@/Components/CurrencyExchangeInput";
import { showToast } from "@/Components/ToastNotification";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";
import AttachmentUpload from "@/Components/AttachmentUpload";
import axios from "axios";

export default function TransferForm({ transfer = null }) {
    const { auth } = usePage().props;
    const homeCurrencyObj = typeof auth?.company?.home_currency === 'object' ? auth.company.home_currency : null;
    const homeCurrencyStr = typeof auth?.company?.home_currency === 'string' ? auth.company.home_currency : '';
    const defaultCurrencyCode = String(homeCurrencyObj?.code || homeCurrencyStr || auth?.company?.home_currency_prefix || '');

    const [accountOptions, setAccountOptions] = useState([]);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountInitialName, setAccountInitialName] = useState('');
    const [accountModalType, setAccountModalType] = useState('asset');
    const [accountModalTarget, setAccountModalTarget] = useState('transfer_from');
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(transfer?.id || null);
    const [currentAction, setCurrentAction] = useState('save');


    const { data, setData, post, patch, processing, errors, reset, transform } = useForm({
        transfer_from: transfer?.transfer_from || "",
        transfer_to: transfer?.transfer_to || "",
        amount: transfer?.amount ? parseFloat(transfer.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
        date: transfer?.date || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        memo: transfer?.memo || "",
        referenceNo: transfer?.referenceNo || "",
        exchange_rate: transfer?.exchange_rate || 1,
        currency_id: transfer?.currency_id || "",
        attachments: transfer?.attachments || [],
        attachment_ids: (transfer?.attachments || []).map(a => a.id),
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        transform((data) => ({
            ...data,
            amount: String(data.amount).replace(/,/g, ''),
            action: currentAction,
        }));
    }, [data.amount, currentAction, transform]);

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => {
            setAccountOptions(res.data);
        });
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const selectedFrom = accountOptions.find(opt => opt.value === data.transfer_from);
    const selectedTo = accountOptions.find(opt => opt.value === data.transfer_to);

    const formatCurrency = (val) => {
        const num = parseFloat(String(val).replace(/,/g, "")) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleAmountChange = (e) => {
        let val = e.target.value.replace(/[^0-9.]/g, '');
        // Allow only one decimal point
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        setData('amount', val);
        setIsDirty(true);
    };

    const handleAmountBlur = () => {
        if (data.amount !== "" && data.amount !== null && data.amount !== undefined) {
            setData('amount', formatCurrency(data.amount));
        }
    };

    const handleSave = (type = 'save', pinOverride = null) => {
        const isEdit = !!(transfer?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.date, auth?.books_lock_date, isEdit)) {
            setCurrentAction(type);
            setPendingAction(type);
            setIsPinModalOpen(true);
            return;
        }

        setCurrentAction(type);
        setPendingAction(type);
        transform((d) => ({
            ...d,
            amount: String(d.amount).replace(/,/g, ''),
            action: type,
            books_pin: pinOverride !== null ? pinOverride : d.books_pin,
        }));
        const url = transfer?.id ? route('transfer.update', transfer.id) : route('transfer.store');
        const method = transfer?.id ? patch : post;

        method(url, {
            preserveScroll: true,
            preserveState: (page) => Object.keys(page.props.errors).length > 0 || type === 'save',
            replace: true,
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.transfer?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                if (type === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } 
                }

                if (type === 'new') {
                    setSavedEntryId(null);
                    reset();
                    clearErrors();
                    setIsDirty(false);
                }
            },
        });
    };

    return (
        <TransactionLayout
            historyType="transfer"
            title={
                <div className="flex items-center">
                    Transfer Funds
                    <BooksLockIndicator date={data.date} lockDate={auth?.books_lock_date} isEdit={!!(transfer?.id || savedEntryId)} />
                </div>
            }
            amount={parseFloat(String(data.amount || 0).replace(/,/g, '')).toFixed(2)}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            processing={processing}
            dirty={isDirty}
            moreOptions={transfer?.id ? { copyRoute: 'transfer', deleteRoute: 'transfer.destroy', voidRoute: 'transfer.void', isVoided: (transfer?.status || journalEntry?.status) === 'void', recordId: transfer.id, listRoute: 'dashboard' } : null}
        >
            <Head title="Transfer Funds" />

            <div className="py-6 px-1 space-y-8">
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        {/* FROM ACCOUNT */}
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Transfer Funds From"
                                options={accountOptions}
                                onSearch={fetchAccounts}
                                value={data.transfer_from}
                                onChange={(val) => { 
                                    const acct = accountOptions.find(a => String(a.value) === String(val));
                                    setData(prev => ({...prev, transfer_from: val, currency_id: acct?.currency_id || prev.currency_id}));
                                    setIsDirty(true); 
                                }}
                                placeholder="Select Source Account"
                                size="sm"
                                error={errors.transfer_from}
                                onAddNew={(search) => {
                                    setAccountModalType('asset');
                                    setAccountModalTarget('transfer_from');
                                    setAccountInitialName(search || '');
                                    setIsAccountModalOpen(true);
                                }}
                            />
                            {selectedFrom && (
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Balance</span>
                                    <span className="text-[10px] font-bold text-slate-700">{defaultCurrencyCode} {parseFloat(selectedFrom.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        {/* TO ACCOUNT */}
                        <div className="w-[380px]">
                            <SearchableSelect
                                label="Transfer Funds To"
                                options={accountOptions}
                                onSearch={fetchAccounts}
                                value={data.transfer_to}
                                onChange={(val) => { setData('transfer_to', val); setIsDirty(true); }}
                                placeholder="Select Destination Account"
                                size="sm"
                                error={errors.transfer_to}
                                onAddNew={(search) => {
                                    setAccountModalType('asset');
                                    setAccountModalTarget('transfer_to');
                                    setAccountInitialName(search || '');
                                    setIsAccountModalOpen(true);
                                }}
                            />
                            {selectedTo && (
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Balance</span>
                                    <span className="text-[10px] font-bold text-slate-700">{defaultCurrencyCode} {parseFloat(selectedTo.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Transfer Amount</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{defaultCurrencyCode}</span>
                            {parseFloat(String(data.amount || 0).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <CurrencyExchangeInput
                    auth={auth}
                    selectedAccount={accountOptions.find(a => String(a.value) === String(data.transfer_from))}
                    exchangeRate={data.exchange_rate}
                    onExchangeRateChange={(rate) => setData('exchange_rate', rate)}
                    transactionDate={data.date}
                />

                <div className="flex items-end gap-6">
                    <div className="w-[180px]">
                        <CommonInput
                            type="date"
                            label="Date"
                            value={data.date}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData('date', newDate);
                                setIsDirty(true);
                            }}
                            size="sm"
                            error={errors.date}
                        />
                    </div>
                    <div className="w-[180px]">
                        <CommonInput
                            label="Transfer Amount"
                            placeholder="0.00"
                            value={data.amount}
                            onChange={handleAmountChange}
                            onBlur={handleAmountBlur}
                            size="sm"
                            error={errors.amount}
                            inputClass="text-right font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mt-8 pt-4 border-t border-slate-100">
                    <div className="w-[450px]">
                        <CommonInput
                            type="textarea"
                            label="Memo"
                            placeholder="Why are you transferring these funds?"
                            value={data.memo}
                            onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                            size="sm"
                            className="h-24"
                            error={errors.memo}
                        />
                    </div>
                    <div className="w-[450px]">
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
                </div>
            </div>

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => {
                    setIsAccountModalOpen(false);
                    setAccountInitialName('');
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
                        setData(prev => ({
                            ...prev,
                            [accountModalTarget]: newAcc.value,
                            ...(accountModalTarget === 'transfer_from' ? { currency_id: newAcc.currency_id || prev.currency_id } : {})
                        }));
                        setIsDirty(true);
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
