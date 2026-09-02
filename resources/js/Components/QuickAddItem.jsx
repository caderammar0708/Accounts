import { useState, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import SlideOver from "./SlideOver";
import CommonInput from "./CommonInput";
import CommonButton from "./CommonButton";
import SearchableSelect from "./SearchableSelect";
import axios from "axios";

export default function QuickAddItem({ isOpen, onClose, onSuccess }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || '';

    const [categories, setCategories] = useState([]);
    const [incomeAccounts, setIncomeAccounts] = useState([]);
    const [expenseAccounts, setExpenseAccounts] = useState([]);
    const [localErrors, setLocalErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = () => {
        axios.get(route('api.categories')).then(res => setCategories(res.data));
    };

    const fetchAccounts = () => {
        axios.get(route('api.accounts', { type: 'income' })).then(res => setIncomeAccounts(res.data));
    };

    const fetchExpenseAccounts = () => {
        axios.get(route('api.accounts', { type: 'expense' })).then(res => setExpenseAccounts(res.data));
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchAccounts();
            fetchExpenseAccounts();
            setLocalErrors({});
        }
    }, [isOpen]);

    const { data, setData, reset, transform, processing, errors } = useForm({
        type: 'service',
        name: '',
        sku: '',
        description: '',
        sale_price: '0.00',
        item_category_id: '',
        income_account_id: '',
        expense_account_id: '',
    });

    useEffect(() => {
        transform((data) => ({
            ...data,
            sale_price: String(data.sale_price).replace(/,/g, '')
        }));
    }, [transform]);

    const handlePriceChange = (e) => {
        // Store raw value while typing (no appending to existing digits)
        setData('sale_price', e.target.value);
    };

    const handlePriceFocus = (e) => {
        // Select all so user's first keystroke replaces the value
        e.target.select();
    };

    const handlePriceBlur = (e) => {
        // Format to 2 decimal places on blur
        const num = parseFloat(String(e.target.value).replace(/,/g, '')) || 0;
        setData('sale_price', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const submit = (e) => {
        e.preventDefault();
        setLocalErrors({});
        setIsSubmitting(true);

        const payload = {
            ...data,
            sale_price: String(data.sale_price).replace(/,/g, '')
        };

        axios.post(route('items.store'), payload)
            .then(res => {
                setIsSubmitting(false);
                reset();
                onClose();
                if (onSuccess) onSuccess(res.data.item);
            })
            .catch(err => {
                setIsSubmitting(false);
                if (err.response && err.response.data && err.response.data.errors) {
                    setLocalErrors(err.response.data.errors);
                } else {
                    console.error(err);
                }
            });
    };

    const itemTypes = [
        { id: 'service', name: 'Service' },
        { id: 'inventory', name: 'Inventory' },
        { id: 'non-inventory', name: 'Non-inventory' },
    ];

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="New Product/Service"
        >
            <form onSubmit={submit} className="flex flex-col h-full">
                <div className="flex-1 space-y-8">
                    <section>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Item Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {itemTypes.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setData('type', type.id)}
                                    className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                                        data.type === type.id
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-green-200 hover:text-slate-700'
                                    }`}
                                >
                                    {type.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    <CommonInput
                        label="Name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        error={localErrors.name?.[0] || errors.name}
                        required
                        placeholder="e.g. Professional Consulting"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <CommonInput
                            label="SKU"
                            value={data.sku}
                            onChange={e => setData('sku', e.target.value)}
                            error={localErrors.sku?.[0] || errors.sku}
                            placeholder="Optional"
                        />
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                            <SearchableSelect
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                value={data.item_category_id}
                                onChange={val => setData('item_category_id', val)}
                                placeholder="Select category"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50/50 -mx-6 px-6 py-6 border-y border-slate-100 space-y-6">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sales Price ({currencyPrefix})</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{currencyPrefix}</span>
                                <input
                                    type="text"
                                    value={data.sale_price}
                                    onChange={handlePriceChange}
                                    onFocus={handlePriceFocus}
                                    onBlur={handlePriceBlur}
                                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono outline-none shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Income Account</label>
                            <SearchableSelect
                                options={incomeAccounts}
                                value={data.income_account_id}
                                onChange={val => setData('income_account_id', val)}
                                placeholder="Link to Income Account"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Expense Account</label>
                            <SearchableSelect
                                options={expenseAccounts}
                                value={data.expense_account_id}
                                onChange={val => setData('expense_account_id', val)}
                                placeholder="Link to Expense Account"
                            />
                        </div>
                    </div>

                    <CommonInput
                        type="textarea"
                        label="Description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        rows={2}
                        placeholder="Brief description for credit_invoices..."
                        error={errors.description}
                    />
                </div>

                <div className="mt-auto pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
                    <CommonButton variant="ghost" onClick={onClose} type="button">Cancel</CommonButton>
                    <CommonButton variant="primary" type="submit" processing={isSubmitting || processing}>
                        Save Item
                    </CommonButton>
                </div>
            </form>
        </SlideOver>
    );
}
