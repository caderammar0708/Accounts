import { useForm, usePage } from '@inertiajs/react';
import SlideOver from './SlideOver';
import CommonInput from './CommonInput';
import SearchableSelect from './SearchableSelect';
import CommonButton from './CommonButton';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getDetailTypeOptions } from '@/Utils/accountDetailTypeOptions';

const Toggle = ({ checked, onChange, label, description, disabled }) => (
    <label className={`flex items-start gap-3 select-none group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className="relative mt-1">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={disabled}
                className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
        </div>
        <div className="flex flex-col">
            <span className={`text-xs font-bold text-slate-700 leading-tight ${disabled ? '' : 'group-hover:text-slate-900 transition-colors'}`}>
                {label}
            </span>
            {description && (
                <span className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    {description}
                </span>
            )}
        </div>
    </label>
);

export default function QuickAddAccount({ isOpen, onClose, onSuccess, defaultType = 'asset', account = null, initialParentAccount = null, currencies = [], multiCurrencyEnabled, homeCurrencyId, initialName = '', locations = [] }) {
    const isEdit = !!account;
    const { auth } = usePage().props;
    const company = auth?.company;
    
    const defaultCurrency = homeCurrencyId || '';
    const currencyOptions = currencies;

    const [parentAccounts, setParentAccounts] = useState([]);
    const [nameDuplicateError, setNameDuplicateError] = useState('');

    const initialDate = localStorage.getItem('last_opening_balance_date') || new Date().toISOString().split('T')[0];

    const { data, setData, post, patch, processing, errors, reset, clearErrors, setError } = useForm({
        account_code: '',
        name: '',
        account_type: defaultType,
        sub_type: getDetailTypeOptions(defaultType)?.[0]?.value || '',
        opening_balance: '0.00',
        opening_balance_date: initialDate,
        description: '',
        is_active: true,
        currency_id: defaultCurrency,
        is_subaccount: false,
        parent_id: '',
        location_id: null,
        is_locked: false,
        is_system: false,
    });

    const [accountWasLockedInitially, setAccountWasLockedInitially] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (account) {
                setAccountWasLockedInitially(!!account.is_locked);
                const formattedBalance = parseFloat(account.opening_balance || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                setData({
                    account_code: account.account_code || '',
                    name: account.name || '',
                    account_type: account.account_type || 'asset',
                    sub_type: account.sub_type || '',
                    opening_balance: formattedBalance,
                    opening_balance_date: account.opening_balance_date || initialDate,
                    description: account.description || '',
                    is_active: !!account.is_active,
                    currency_id: account.currency_id || defaultCurrency,
                    is_subaccount: !!account.parent_id,
                    parent_id: account.parent_id || '',
                    location_id: account.location_id || null,
                    is_locked: !!account.is_locked,
                    is_system: !!account.is_system,
                });
            } else {
                setAccountWasLockedInitially(false);
                reset();
                const accType = initialParentAccount ? initialParentAccount.account_type : defaultType;
                setData(prev => ({
                    ...prev,
                    name: initialName || '',
                    account_type: accType,
                    sub_type: initialParentAccount ? initialParentAccount.sub_type : (getDetailTypeOptions(accType)?.[0]?.value || ''),
                    opening_balance: '0.00',
                    opening_balance_date: initialDate,
                    is_subaccount: !!initialParentAccount,
                    parent_id: initialParentAccount ? initialParentAccount.id : '',
                    location_id: null,
                    is_locked: false,
                    is_system: false,
                }));
            }
            clearErrors();
        }
    }, [isOpen, account, initialParentAccount, initialName]);

    const validateAccountName = (value) => {
        const normalized = String(value || '').trim().toLowerCase();
        return parentAccounts.some(acc => acc.value !== account?.id && String(acc.name || '').trim().toLowerCase() === normalized);
    };

    const handleTypeChange = (value) => {
        const detailOptions = getDetailTypeOptions(value);

        setData(prev => ({
            ...prev,
            account_type: value,
            sub_type: detailOptions?.[0]?.value || ''
        }));
    };

    const handleBalanceChange = (e) => {
        const rawValue = e.target.value;
        const cleanValue = rawValue.replace(/[^\d.,-]/g, ''); // Allow digits, commas, decimals, and minus sign
        setData('opening_balance', cleanValue);
    };

    const handleBalanceBlur = () => {
        const numericValue = parseFloat(String(data.opening_balance || '').replace(/,/g, ''));
        if (!isNaN(numericValue)) {
            setData('opening_balance', numericValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }));
        } else {
            setData('opening_balance', '0.00');
        }
    };

    const handleDateChange = (e) => {
        const dateVal = e.target.value;
        setData('opening_balance_date', dateVal);

        axios.post(route('api.accounts.save-date'), { date: dateVal })
            .catch(err => console.error("Failed to save date to session:", err));

        localStorage.setItem('last_opening_balance_date', dateVal);
    };

    useEffect(() => {
        if (isOpen) {
            axios.get(route('api.accounts'))
                .then(res => {
                    const accs = res.data || [];
                    setParentAccounts(accs.map(a => ({
                        ...a,
                        name: a.label.split(' - ')[1] || a.label
                    })));
                })
                .catch(err => console.error("Failed to load accounts for parent select:", err));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !isEdit && data.account_type) {
            axios.get(route('api.accounts.next-code'), {
                params: { type: data.account_type }
            })
                .then(res => {
                    if (res.data && res.data.next_code) {
                        setData('account_code', res.data.next_code);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch next account code:", err);
                });
        }
    }, [isOpen, isEdit, data.account_type]);

    useEffect(() => {
        setNameDuplicateError(validateAccountName(data.name) ? 'An account with this name already exists.' : '');
    }, [data.name, parentAccounts]);

    const submit = (e) => {
        e.preventDefault();

        if (validateAccountName(data.name)) {
            setError('name', 'An account with this name already exists.');
            setNameDuplicateError('An account with this name already exists.');
            return;
        }

        const options = {
            onSuccess: (page) => {
                const newAccount = page.props.flash?.new_account || account;
                onSuccess && onSuccess(newAccount);
                onClose();
            },
        };

        if (isEdit) {
            patch(route('chart-of-account.update', account.id), options);
        } else {
            post(route('chart-of-account.store'), options);
        }
    };

    const submitAndNew = (e) => {
        e.preventDefault();

        if (validateAccountName(data.name)) {
            setError('name', 'An account with this name already exists.');
            setNameDuplicateError('An account with this name already exists.');
            return;
        }

        const options = {
            onSuccess: () => {
                reset();
                clearErrors();
                if (onSuccess) onSuccess(null, true); // true indicates save and new
            },
        };

        if (isEdit) {
            patch(route('chart-of-account.update', account.id), options);
        } else {
            post(route('chart-of-account.store'), options);
        }
    };

    const handleDelete = () => {
        import('@inertiajs/react').then(({ router }) => {
            if (confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
                router.delete(route('chart-of-account.destroy', account.id), {
                    onSuccess: () => {
                        onClose();
                    }
                });
            }
        });
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Account" : "Add New Account"}
        >
            <form onSubmit={submit} className="space-y-6">
                {(data.is_locked || data.is_system) && (
                    <div className="p-3 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium flex flex-col items-center gap-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-center">
                            <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-center leading-snug">
                            {data.is_system
                                ? "This is a system account. Its properties cannot be modified or deleted."
                                : "This account is locked and cannot be edited or deleted."}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <CommonInput
                        type="select"
                        label="Account Type"
                        value={data.account_type}
                        onChange={e => handleTypeChange(e.target.value)}
                        error={errors.account_type}
                        required
                        disabled={data.is_locked}
                    >
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                        <option value="equity">Equity</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </CommonInput>

                    <CommonInput
                        type="select"
                        label="Detail Type"
                        value={data.sub_type}
                        onChange={e => setData('sub_type', e.target.value)}
                        error={errors.sub_type}
                        required
                        options={getDetailTypeOptions(data.account_type)}
                        disabled={data.is_locked}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <CommonInput
                        label="Account Code"
                        value={data.account_code}
                        onChange={e => setData('account_code', e.target.value)}
                        error={errors.account_code}
                        required
                        disabled={data.is_locked}
                    />
                    <CommonInput
                        label="Account Name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        error={errors.name || nameDuplicateError}
                        required
                        disabled={data.is_locked}
                    />
                </div>

                <div className="pt-4 border-t border-slate-150 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Location</label>
                    <SearchableSelect
                        options={[
                            { value: null, label: 'Common (All Locations)' },
                            ...locations.map(l => ({ value: l.id, label: l.name }))
                        ]}
                        value={data.location_id}
                        onChange={val => setData('location_id', val)}
                        placeholder="Select Location"
                        disabled={data.is_locked}
                    />
                    {errors.location_id && <p className="text-xs text-red-500 mt-1">{errors.location_id}</p>}
                </div>

                <div className="pt-4 border-t border-slate-150">
                    <Toggle
                        checked={data.is_subaccount}
                        onChange={val => setData('is_subaccount', val)}
                        label="Make this a sub-account"
                        description="Sub-accounts nest under parent accounts in financial statements."
                        disabled={data.is_locked}
                    />
                </div>

                {data.is_subaccount && (
                    <div className="pt-4 border-t border-slate-150 space-y-4">
                        <div className={data.is_locked ? "opacity-50 pointer-events-none" : ""}>
                            <SearchableSelect
                                label="Parent Account"
                                value={data.parent_id}
                                onChange={(val) => setData('parent_id', val)}
                                error={errors.parent_id}
                                required={data.is_subaccount}
                                options={parentAccounts
                                    .filter(acc => String(acc.account_type).toLowerCase() === String(data.account_type).toLowerCase() && (!account || acc.value !== account.id))
                                    .map(acc => ({
                                        value: acc.value,
                                        label: `${acc.label} ${acc.account_type ? `(${acc.account_type})` : ''}`
                                    }))}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-150">
                    <CommonInput
                        type="textarea"
                        label="Description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        error={errors.description}
                        rows="3"
                        className="resize-none"
                        disabled={data.is_locked}
                    />
                </div>

                {multiCurrencyEnabled && (
                    <div className="pt-4 border-t border-slate-100">
                        <CommonInput
                            type="select"
                            label="Account Currency"
                            value={data.currency_id}
                            onChange={e => setData('currency_id', e.target.value)}
                            error={errors.currency_id}
                            disabled={data.is_locked}
                        >
                            <option value="">Select Currency</option>
                            {currencyOptions.map((currency) => (
                                <option key={currency.id} value={currency.id}>
                                    {currency.code} - {currency.name}
                                </option>
                            ))}
                        </CommonInput>
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium italic">All transactions for this account will be recorded in this currency.</p>
                    </div>
                )}

                {!isEdit && ['asset', 'liability', 'equity'].includes(data.account_type) && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <CommonInput
                            type="text"
                            label="Opening Balance"
                            value={data.opening_balance}
                            onChange={handleBalanceChange}
                            onFocus={e => e.target.select()}
                            onBlur={handleBalanceBlur}
                            error={errors.opening_balance}
                            icon={<span className="text-[10px] font-bold text-slate-400">{(typeof data.currency === 'object' ? data.currency?.symbol || data.currency?.code : data.currency) || (typeof company?.home_currency === 'object' ? (company?.home_currency?.symbol || company?.home_currency?.code) : company?.home_currency) || company?.home_currency_prefix || ''}</span>}
                            disabled={data.is_locked}
                        />
                        <CommonInput
                            type="date"
                            label="As of Date"
                            value={data.opening_balance_date}
                            onChange={handleDateChange}
                            error={errors.opening_balance_date}
                            disabled={data.is_locked}
                        />
                    </div>
                )}

                <div className="pt-4 border-t border-slate-150">
                    <Toggle
                        checked={data.is_locked}
                        onChange={val => setData('is_locked', val)}
                        label="Lock Account"
                        description="Locking prevents deletion or modification of the account details."
                    />
                </div>

                <div className="sticky bottom-0 bg-white pt-6 flex items-center justify-between gap-3 border-t border-slate-100">
                    <div>
                        {isEdit && !data.is_locked && !data.is_system && (
                            <CommonButton
                                type="button"
                                variant="danger"
                                onClick={handleDelete}
                                processing={processing}
                            >
                                Delete
                            </CommonButton>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <CommonButton variant="ghost" onClick={onClose} size="sm">
                            {(data.is_locked || data.is_system) ? "Close" : "Cancel"}
                        </CommonButton>
                        {(!data.is_locked || !accountWasLockedInitially || !isEdit) && (
                            <>
                                {!isEdit && (
                                    <CommonButton
                                        type="button"
                                        variant="secondary"
                                        processing={processing}
                                        size="sm"
                                        onClick={submitAndNew}
                                    >
                                        Save &amp; New
                                    </CommonButton>
                                )}
                                <CommonButton type="submit" variant="primary" processing={processing} size="sm">
                                    {isEdit ? "Update Account" : "Save Account"}
                                </CommonButton>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </SlideOver>
    );
}

// Cache busting comment to fix FTP deployment stuck issue
