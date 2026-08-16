import { useState, useEffect } from "react";
import useModalSession from '@/Utils/useModalSession';
import { useForm, Head } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddAccount from "@/Components/QuickAddAccount";
import { useDateFormat, formatDate } from "@/Utils/dateFormat";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function ChequeDepositForm({ auth, nextDepositNo = "", deposit = null, outstandingCheques = [], selectedChequeIds = [], onModeChange = null, onClose = null }) {
    const company = auth.company;
    const homeCurrencyObj = typeof company?.home_currency === 'object' ? company.home_currency : null;
    const homeCurrencyStr = typeof company?.home_currency === 'string' ? company.home_currency : '';
    const currencyPrefix = company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || company?.home_currency_prefix || '';
    const dateFormat = useDateFormat();

    const [depositAccountOptions, setDepositAccountOptions] = useState([]);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    
    // Manage local list of cheques (merging props + possible new fetches if needed)
    const [cheques, setCheques] = useState(
        outstandingCheques.map(chk => ({
            ...chk,
            checked: selectedChequeIds.includes(chk.id)
        }))
    );
    const [searchQuery, setSearchQuery] = useState("");

    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(deposit?.id || null);

    const fetchDepositAccounts = (search = "") => {
        const selectedAccountId = data.depositTo || deposit?.depositTo || '';
        const params = { search };

        if (selectedAccountId) {
            params.include_selected_id = selectedAccountId;
        }

        axios.get(route('api.accounts', params)).then(res => setDepositAccountOptions(res.data));
    };

    useEffect(() => {
        fetchDepositAccounts();
    }, []);

    // Also fetch dynamically if creating new and want to make sure we have latest outstanding cheques
    useEffect(() => {
        if (!deposit?.id) {
            axios.get(route('api.outstanding-cheques')).then(res => {
                setCheques(res.data.map(chk => ({ ...chk, checked: false })));
            });
        }
    }, [deposit?.id]);

    const modalSession = useModalSession('cheque_deposit');
    useEffect(() => {
        modalSession.open();
    }, []);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        depositTo: deposit?.depositTo || "",
        depositDate: deposit?.depositDate || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        depositNo: deposit?.depositNo || nextDepositNo || "1001",
        memo: deposit?.memo || "",
        selectedCheques: selectedChequeIds || [],
        action: 'save',
        books_pin: ''
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        if (deposit) {
            setData({
                depositTo: deposit.depositTo || "",
                depositDate: deposit.depositDate || "",
                depositNo: deposit.depositNo || "",
                memo: deposit.memo || "",
                selectedCheques: selectedChequeIds || [],
                action: 'save'
            });
            setCheques(outstandingCheques.map(chk => ({
                ...chk,
                checked: selectedChequeIds.includes(chk.id)
            })));
        }
        clearErrors();
    }, [deposit?.id]);

    const handleChequeCheckToggle = (id, isChecked) => {
        setCheques(prev => prev.map(chk => 
            chk.id === id ? { ...chk, checked: isChecked } : chk
        ));
        
        setData('selectedCheques', isChecked 
            ? [...data.selectedCheques, id] 
            : data.selectedCheques.filter(chkId => chkId !== id)
        );
        setIsDirty(true);
    };

    const filteredCheques = cheques.filter(chk => {
        if (!searchQuery) return true;
        return (chk.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                chk.check_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chk.reference_no?.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    const handleSelectAllToggle = (isChecked) => {
        setCheques(prev => prev.map(chk => {
            const isFiltered = filteredCheques.some(f => f.id === chk.id);
            if (!isFiltered) return chk;
            return { ...chk, checked: isChecked };
        }));

        if (isChecked) {
            const newSelected = [...new Set([...data.selectedCheques, ...filteredCheques.map(c => c.id)])];
            setData('selectedCheques', newSelected);
        } else {
            const filteredIds = filteredCheques.map(c => c.id);
            setData('selectedCheques', data.selectedCheques.filter(id => !filteredIds.includes(id)));
        }
        setIsDirty(true);
    };

    const totalAmount = cheques
        .filter(chk => chk.checked)
        .reduce((sum, chk) => sum + parseFloat(chk.amount || 0), 0)
        .toFixed(2);

    const handleSave = (action = 'save', pinOverride = null) => {
        const isEdit = !!(deposit?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.depositDate, auth?.books_lock_date, isEdit)) {
            setPendingAction(action);
            setIsPinModalOpen(true);
            return;
        }

        setPendingAction(action);
        transform((d) => ({
            ...d,
            action,
            books_pin: pinOverride !== null ? pinOverride : d.books_pin,
        }));
        const url = deposit?.id ? route('cheque-deposit.update', deposit.id) : route('cheque-deposit.store');
        const method = deposit?.id ? patch : post;

        method(url, {
            onSuccess: async (page) => {
                showToast('success', 'Cheque deposit saved successfully.');
                setIsDirty(false);
                setIsPinModalOpen(false);
                setPendingAction(null);
                clearErrors('books_pin');
                setData('books_pin', '');

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.deposit?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                try {
                    await axios.post(route('api.session.modal_last_url'), {
                        modalName: 'cheque_deposit',
                        url: window.location.pathname + window.location.search
                    });
                } catch (e) { }

                if (typeof onModeChange === 'function' && newId) {
                    try { onModeChange('edit', newId); } catch {}
                }

                if (action === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } 
                }

                if (action === 'new') {
                    setSavedEntryId(null);
                    const currentRef = data.depositNo || nextDepositNo || '1001';
                    const num = parseInt(String(currentRef).replace(/[^0-9]/g, '')) || 1000;
                    const nextRef = String(num + 1).padStart(4, '0');
                    const currentDate = data.depositDate;
                    
                    reset();
                    setData('depositNo', nextRef);
                    setData('depositDate', currentDate);
                    setData('selectedCheques', []);
                    
                    // Refetch outstanding cheques for a fresh form
                    axios.get(route('api.outstanding-cheques')).then(res => {
                        setCheques(res.data.map(chk => ({ ...chk, checked: false })));
                    });

                    clearErrors();
                    setIsDirty(false);
                }
            }
        });
    };

    return (
        <TransactionLayout
            historyType="cheque_deposit"
            title={
                <div className="flex items-center">
                    {deposit?.id ? `Edit Cheque Deposit #${data.depositNo}` : `Cheque Deposit #${data.depositNo}`}
                    <BooksLockIndicator date={data.depositDate} lockDate={auth?.books_lock_date} isEdit={!!(deposit?.id || savedEntryId)} />
                </div>
            }
            amount={parseFloat(totalAmount)}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            onDelete={deposit?.id ? () => {
                if (confirm('Are you sure you want to delete this cheque deposit?')) {
                    router.delete(route('cheque-deposit.destroy', deposit.id));
                }
            } : undefined}
        >
            <Head title="Cheque Deposit" />

            {/* Error Banner */}
            {errors.error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                    {errors.error}
                </div>
            )}
            
            {errors.selectedCheques && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded mt-2">
                    {errors.selectedCheques}
                </div>
            )}

            <div className="py-6 px-1 space-y-8">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-[320px]">
                            <SearchableSelect
                                label="Account"
                                options={depositAccountOptions}
                                value={data.depositTo}
                                onChange={(val) => { setData('depositTo', val); setIsDirty(true); }}
                                onSearch={fetchDepositAccounts}
                                onAddNew={() => setIsAccountModalOpen(true)}
                                size="sm"
                                error={errors.depositTo}
                            />
                        </div>

                        <div className="w-[180px]">
                            <CommonInput
                                type="date"
                                label="Date"
                                value={data.depositDate}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    localStorage.setItem('last_transaction_date', newDate);
                                    setData('depositDate', newDate);
                                    setIsDirty(true);
                                }}
                                size="sm"
                                error={errors.depositDate}
                            />
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Selected Total</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{currencyPrefix}</span>
                            {parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="w-full max-w-[180px] mt-3">
                            <CommonInput
                                label="Deposit no."
                                value={data.depositNo}
                                onChange={(e) => { setData('depositNo', e.target.value); setIsDirty(true); }}
                                onFocus={(e) => {
                                    const val = e.target.value.replace(/,/g, '');
                                    setData('depositNo', val);
                                    setTimeout(() => e.target.select(), 0);
                                }}
                                onBlur={(e) => {
                                    const val = e.target.value.replace(/,/g, '');
                                    setData('depositNo', val);
                                }}
                                size="sm"
                                inputClass="font-mono text-right"
                            />
                        </div>
                    </div>
                </div>

                {/* Memo section */}
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

                {/* Outstanding Cheques Table */}
                <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Outstanding Cheques</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative w-48">
                                <input
                                    type="text"
                                    placeholder="Search cheques..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-3 pr-8 h-[30px] bg-white border border-slate-350 rounded-md text-xs focus:border-green-600 focus:ring-0 focus:outline-none"
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
                                onClick={() => setSearchQuery("")}
                                className="text-slate-500 hover:text-slate-800 text-[10px] uppercase tracking-wider font-bold"
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredCheques.length > 0 && filteredCheques.every(chk => chk.checked)}
                                            onChange={(e) => handleSelectAllToggle(e.target.checked)}
                                            className="rounded-sm border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer / Desc</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Received</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cheque Date</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cheque No.</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref No.</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCheques.map((chk) => (
                                    <tr key={chk.id} className={`hover:bg-slate-50/20 transition-colors ${chk.checked ? 'bg-green-50/10' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={chk.checked}
                                                onChange={(e) => handleChequeCheckToggle(chk.id, e.target.checked)}
                                                className="rounded-sm border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-800">
                                            {chk.customer_name}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                            {chk.payment_date ? formatDate(chk.payment_date, dateFormat) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                            {chk.check_date ? formatDate(chk.check_date, dateFormat) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {chk.check_number || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                            {chk.reference_no || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-800 font-mono text-right font-bold">
                                            {currencyPrefix} {parseFloat(chk.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {filteredCheques.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            No outstanding cheques found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAccount) => {
                    fetchDepositAccounts();
                    if (newAccount) {
                        setData("depositTo", newAccount.value);
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
