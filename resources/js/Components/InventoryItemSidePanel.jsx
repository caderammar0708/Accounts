import { useForm, router, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import SlideOver from './SlideOver';
import CommonInput from './CommonInput';
import CommonButton from './CommonButton';
import SearchableSelect from './SearchableSelect';
import ItemCategorySidePanel from './ItemCategorySidePanel';
import QuickAddAccount from './QuickAddAccount';
import Modal from './Modal';

const Toggle = ({ checked, onChange, label, description }) => (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
        <div className="relative mt-1">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
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

const FormSection = ({ title, children, show = true }) => {
    if (!show) return null;
    return (
        <div className="pt-4 border-t border-slate-150 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
};

export default function InventoryItemSidePanel({
    isOpen,
    onClose,
    item = null,
    categories: initialCategories = [],
    incomeAccounts: initialIncomeAccounts = [],
    expenseAccounts: initialExpenseAccounts = [],
    inventoryAccounts: initialInventoryAccounts = [],
    suppliers: initialSuppliers = [],
    allItems: initialAllItems = [],
    locations: initialLocations = [],
    onSuccess = null
}) {
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || '$';
    const isEdit = !!item;
    const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
    const [localCategories, setLocalCategories] = useState(initialCategories);
    const [localInventoryAccounts, setLocalInventoryAccounts] = useState(initialInventoryAccounts);
    const [localIncomeAccounts, setLocalIncomeAccounts] = useState(initialIncomeAccounts);
    const [localExpenseAccounts, setLocalExpenseAccounts] = useState(initialExpenseAccounts);
    const [localSuppliers, setLocalSuppliers] = useState(initialSuppliers);
    const [localAllItems, setLocalAllItems] = useState(initialAllItems);
    const [localLocations, setLocalLocations] = useState(initialLocations);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountInitialName, setAccountInitialName] = useState('');
    const [accountModalType, setAccountModalType] = useState('asset');

    const findDefaultAccounts = () => {
        let defaultInventoryId = '';
        if (initialInventoryAccounts && initialInventoryAccounts.length > 0) {
            const match = initialInventoryAccounts.find(acc => acc.account_code === '1200' || acc.name.toLowerCase().includes('inventory asset') || acc.name.toLowerCase().includes('inventory'));
            defaultInventoryId = match ? match.id : initialInventoryAccounts[0].id;
        }

        let defaultIncomeId = '';
        if (initialIncomeAccounts && initialIncomeAccounts.length > 0) {
            const match = initialIncomeAccounts.find(acc => acc.account_code === '4000' || acc.name.toLowerCase().includes('sales income') || acc.name.toLowerCase().includes('sales'));
            defaultIncomeId = match ? match.id : initialIncomeAccounts[0].id;
        }

        let defaultExpenseId = '';
        if (initialExpenseAccounts && initialExpenseAccounts.length > 0) {
            const match = initialExpenseAccounts.find(acc => acc.account_code === '5000' || acc.name.toLowerCase().includes('cost of goods sold') || acc.name.toLowerCase().includes('cogs'));
            defaultExpenseId = match ? match.id : initialExpenseAccounts[0].id;
        }

        return {
            inventory_account_id: defaultInventoryId,
            income_account_id: defaultIncomeId,
            expense_account_id: defaultExpenseId
        };
    };

    const initialDefaults = findDefaultAccounts();

    const { data, setData, post, patch, processing, errors, setError, reset, clearErrors, transform } = useForm({
        type: 'service',
        name: '',
        sku: '',
        image: '',
        description: '',
        sale_price: '0.00',
        item_category_id: '',
        location_id: '',
        income_account_id: initialDefaults.income_account_id,
        expense_account_id: initialDefaults.expense_account_id,
        purchase_price: '0.00',
        purchase_description: '',
        preferred_supplier_id: '',
        quantity_on_hand: '0',
        as_of_date: '',
        reorder_point: '0',
        inventory_account_id: initialDefaults.inventory_account_id,
        is_sold: true,
        is_purchased: false,
        update_historical: false,
        bundle_items: []
    });

    const itemTypes = [
        { id: 'service', name: 'Service' },
        { id: 'inventory', name: 'Inventory' },
        { id: 'non-inventory', name: 'Non-inventory' },
        { id: 'bundle', name: 'Bundle' },
    ];

    const fileInputRef = useRef(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    useEffect(() => {
        if (data.image instanceof File) {
            const url = URL.createObjectURL(data.image);
            setImagePreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setImagePreviewUrl(data.image || null);
        }
    }, [data.image]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setData('image', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        setShowHistoricalConfirm(false);
        if (isOpen) {
            setIsLoadingOptions(true);
            axios.get(route('api.items.create-options'))
                .then(res => {
                    const dataOptions = res.data;
                    setLocalCategories(dataOptions.categories || []);
                    setLocalIncomeAccounts(dataOptions.incomeAccounts || []);
                    setLocalExpenseAccounts(dataOptions.expenseAccounts || []);
                    setLocalInventoryAccounts(dataOptions.inventoryAccounts || []);
                    setLocalSuppliers(dataOptions.suppliers || []);
                    setLocalAllItems(dataOptions.allItems || []);
                    setLocalLocations(dataOptions.locations || []);

                    // If creating a new item, set default accounts dynamically from the fetched list
                    if (!item) {
                        const invAccs = dataOptions.inventoryAccounts || [];
                        const incAccs = dataOptions.incomeAccounts || [];
                        const expAccs = dataOptions.expenseAccounts || [];

                        let defaultInventoryId = '';
                        if (invAccs.length > 0) {
                            const match = invAccs.find(acc => acc.account_code === '1200' || acc.name.toLowerCase().includes('inventory asset') || acc.name.toLowerCase().includes('inventory'));
                            defaultInventoryId = match ? match.id : invAccs[0].id;
                        }

                        let defaultIncomeId = '';
                        if (incAccs.length > 0) {
                            const match = incAccs.find(acc => acc.account_code === '4000' || acc.name.toLowerCase().includes('sales income') || acc.name.toLowerCase().includes('sales'));
                            defaultIncomeId = match ? match.id : incAccs[0].id;
                        }

                        let defaultExpenseId = '';
                        if (expAccs.length > 0) {
                            const match = expAccs.find(acc => acc.account_code === '5000' || acc.name.toLowerCase().includes('cost of goods sold') || acc.name.toLowerCase().includes('cogs'));
                            defaultExpenseId = match ? match.id : expAccs[0].id;
                        }

                        setData(prev => ({
                            ...prev,
                            inventory_account_id: prev.inventory_account_id || defaultInventoryId,
                            income_account_id: prev.income_account_id || defaultIncomeId,
                            expense_account_id: prev.expense_account_id || defaultExpenseId
                        }));
                    }
                })
                .catch(err => console.error("Failed to fetch item creation options:", err))
                .finally(() => setIsLoadingOptions(false));

            if (item) {
                setData({
                    type: item.type || 'service',
                    name: item.name || '',
                    sku: item.sku || '',
                    image: item.image || '',
                    description: item.description || '',
                    sale_price: item.sale_price ? parseFloat(item.sale_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00',
                    item_category_id: item.item_category_id || '',
                    location_id: item.location_id || '',
                    income_account_id: item.income_account_id || '',
                    expense_account_id: item.expense_account_id || '',
                    purchase_price: item.purchase_price ? parseFloat(item.purchase_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00',
                    purchase_description: item.purchase_description || '',
                    preferred_supplier_id: item.preferred_supplier_id || '',
                    quantity_on_hand: item.quantity_on_hand ? String(Math.round(parseFloat(item.quantity_on_hand))) : '0',
                    as_of_date: item.as_of_date || '',
                    reorder_point: item.reorder_point ? String(Math.round(parseFloat(item.reorder_point))) : '0',
                    inventory_account_id: item.inventory_account_id || '',
                    is_sold: item.is_sold !== undefined ? !!item.is_sold : true,
                    is_purchased: item.is_purchased !== undefined ? !!item.is_purchased : false,
                    update_historical: false,
                    bundle_items: item.bundle_components ? item.bundle_components.map(bc => ({
                        item_id: bc.item_id || '',
                        quantity: bc.quantity ? parseFloat(bc.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.00'
                    })) : []
                });
            } else {
                setData({
                    type: 'service',
                    name: '',
                    sku: '',
                    image: '',
                    description: '',
                    sale_price: '0.00',
                    item_category_id: '',
                    location_id: '',
                    income_account_id: '',
                    expense_account_id: '',
                    purchase_price: '0.00',
                    purchase_description: '',
                    preferred_supplier_id: '',
                    quantity_on_hand: '0',
                    as_of_date: '',
                    reorder_point: '0',
                    inventory_account_id: '',
                    is_sold: true,
                    is_purchased: false,
                    update_historical: false,
                    bundle_items: []
                });
                clearErrors();
            }
        }
    }, [isOpen, item]);

    const handleCategorySuccess = () => {
        const oldIds = localCategories.map(c => c.id);
        router.reload({
            only: ['categories'],
            onSuccess: (page) => {
                const newCategories = page.props.categories;
                setLocalCategories(newCategories);
                const newlyCreated = newCategories.find(c => !oldIds.includes(c.id));
                if (newlyCreated) {
                    setData('item_category_id', newlyCreated.id);
                }
            }
        });
    };

    const handleAccountSuccess = (newAcc, type) => {
        if (newAcc) {
            const accOption = {
                id: newAcc.value || newAcc.id,
                account_code: newAcc.account_code || (newAcc.label ? newAcc.label.split(' - ')[0] : ''),
                name: newAcc.name || (newAcc.label ? (newAcc.label.split(' - ')[1] || newAcc.label) : ''),
                value: newAcc.value || newAcc.id,
                label: newAcc.label || `${newAcc.account_code || ''} - ${newAcc.name || ''}`
            };

            if (type === 'asset') {
                setLocalInventoryAccounts(prev => [accOption, ...prev.filter(a => String(a.id || a.value) !== String(accOption.id))]);
                setData('inventory_account_id', accOption.id);
            } else if (type === 'income') {
                setLocalIncomeAccounts(prev => [accOption, ...prev.filter(a => String(a.id || a.value) !== String(accOption.id))]);
                setData('income_account_id', accOption.id);
            } else if (type === 'expense' || type === 'payment') {
                setLocalExpenseAccounts(prev => [accOption, ...prev.filter(a => String(a.id || a.value) !== String(accOption.id))]);
                setData('expense_account_id', accOption.id);
            }
        }

        router.reload({
            only: ['inventoryAccounts', 'incomeAccounts', 'expenseAccounts'],
            onSuccess: (page) => {
                if (page.props.inventoryAccounts) setLocalInventoryAccounts(page.props.inventoryAccounts);
                if (page.props.incomeAccounts) setLocalIncomeAccounts(page.props.incomeAccounts);
                if (page.props.expenseAccounts) setLocalExpenseAccounts(page.props.expenseAccounts);
            }
        });
    };

    const handleTypeChange = (newType) => {
        setData(prev => {
            const updated = { ...prev, type: newType };
            if (newType === 'inventory') {
                updated.is_sold = true;
                updated.is_purchased = true;
            } else if (newType === 'bundle') {
                updated.is_sold = true;
                updated.is_purchased = false;
            } else {
                updated.is_sold = true;
                updated.is_purchased = false;
            }
            return updated;
        });
    };

    const addBundleItem = () => {
        setData('bundle_items', [...data.bundle_items, { item_id: '', quantity: '1.00' }]);
    };

    const updateBundleItem = (index, field, value) => {
        const updated = data.bundle_items.map((item, idx) => {
            if (idx === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setData('bundle_items', updated);
    };

    const removeBundleItem = (index) => {
        const updated = data.bundle_items.filter((_, idx) => idx !== index);
        setData('bundle_items', updated);
    };

    const processSubmit = (updateHistorical = false) => {
        const payload = {
            ...data,
            sale_price: String(data.sale_price).replace(/,/g, ''),
            purchase_price: String(data.purchase_price).replace(/,/g, ''),
            quantity_on_hand: String(data.quantity_on_hand).replace(/,/g, ''),
            reorder_point: String(data.reorder_point).replace(/,/g, ''),
            update_historical: updateHistorical,
        };

        if (onSuccess) {
            setIsSubmitting(true);
            clearErrors();

            const hasFile = data.image instanceof File;
            let requestPayload = payload;
            let headers = {};

            if (hasFile) {
                const formData = new FormData();
                Object.keys(payload).forEach(key => {
                    if (key === 'bundle_items') {
                        payload[key].forEach((item, index) => {
                            formData.append(`bundle_items[${index}][item_id]`, item.item_id);
                            formData.append(`bundle_items[${index}][quantity]`, item.quantity);
                        });
                    } else if (payload[key] !== null && payload[key] !== undefined) {
                        formData.append(key, typeof payload[key] === 'boolean' ? (payload[key] ? 1 : 0) : payload[key]);
                    }
                });
                requestPayload = formData;
                headers = { 'Content-Type': 'multipart/form-data' };
            }

            const request = isEdit
                ? axios.post(route('items.update', item.id), hasFile ? requestPayload : { ...payload, _method: 'PATCH' }, { headers })
                : axios.post(route('items.store'), requestPayload, { headers });

            request.then(res => {
                setIsSubmitting(false);
                setShowHistoricalConfirm(false);
                onClose();
                onSuccess(res.data.item);
            }).catch(err => {
                setIsSubmitting(false);
                setShowHistoricalConfirm(false);
                if (err.response && err.response.data && err.response.data.errors) {
                    const serverErrors = err.response.data.errors;
                    Object.keys(serverErrors).forEach(key => {
                        setError(key, serverErrors[key][0]);
                    });
                } else {
                    console.error(err);
                }
            });
        } else {
            const options = {
                onSuccess: (page) => {
                    setShowHistoricalConfirm(false);
                    onClose();
                    if (onSuccess) onSuccess(page);
                },
            };

            if (isEdit) {
                transform((formData) => ({
                    ...formData,
                    _method: 'PATCH',
                    update_historical: updateHistorical
                }));
                post(route('items.update', { item: item.id, redirect_to: window.location.href }), options);
            } else {
                post(route('items.store', { redirect_to: window.location.href }), options);
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            let changed = false;

            const showSales = data.type === 'inventory' || data.type === 'bundle' || ((data.type === 'service' || data.type === 'non-inventory') && data.is_sold);
            const showPurchases = data.type === 'inventory' || ((data.type === 'service' || data.type === 'non-inventory') && data.is_purchased);
            const showInventory = data.type === 'inventory';

            if (showSales && data.income_account_id != item.income_account_id) changed = true;
            if (showPurchases && data.expense_account_id != item.expense_account_id) changed = true;
            if (showInventory && data.inventory_account_id != item.inventory_account_id) changed = true;

            if (changed) {
                setShowHistoricalConfirm(true);
                return;
            }
        }
        processSubmit(false);
    };

    // Conditional visibility checkers
    const showInventoryDetails = data.type === 'inventory';
    const showSalesSection = data.type === 'inventory' || data.type === 'bundle' || ((data.type === 'service' || data.type === 'non-inventory') && data.is_sold);
    const showPurchasingSection = data.type === 'inventory' || ((data.type === 'service' || data.type === 'non-inventory') && data.is_purchased);
    const showBundleSection = data.type === 'bundle';
    const showToggles = data.type === 'service' || data.type === 'non-inventory';

    const [showHistoricalConfirm, setShowHistoricalConfirm] = useState(false);

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Product/Service" : "New Product/Service"}
        >
            <form onSubmit={submit} className="space-y-5">

                {/* Item Type Selection */}
                <div className="grid grid-cols-4 gap-1.5">
                    {itemTypes.map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => handleTypeChange(type.id)}
                            className={`px-1 py-1.5 rounded-sm border text-[10px] font-bold transition-all text-center ${data.type === type.id
                                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-primary-200 hover:text-slate-700'
                                }`}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
                {errors.type && <p className="mt-0.5 text-xs text-red-600">{errors.type}</p>}

                {/* 1. Basic Information */}
                <FormSection title="Basic Information">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Left Column: Input Fields */}
                        <div className="flex-1 w-full space-y-3">
                            <CommonInput
                                label="Name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g. Professional Consulting"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-bold text-slate-600 ml-0.5 text-xs">SKU</label>
                                        <button
                                            type="button"
                                            onClick={() => setData('sku', 'ITM-' + Math.floor(100000 + Math.random() * 900000))}
                                            className="text-[10px] text-primary hover:text-primary-700"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                    <CommonInput
                                        value={data.sku}
                                        onChange={e => setData('sku', e.target.value)}
                                        error={errors.sku}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Category</label>
                                    <SearchableSelect
                                        options={localCategories.map(c => ({ value: c.id, label: c.name }))}
                                        value={data.item_category_id}
                                        onChange={val => setData('item_category_id', val)}
                                        placeholder="Select category"
                                        onAddNew={() => setIsCategoryPanelOpen(true)}
                                    />
                                    {errors.item_category_id && <p className="mt-1 text-xs text-red-600">{errors.item_category_id}</p>}
                                </div>
                            </div>
                            
                            {Boolean(auth?.company?.branches_enabled) && (
                                <div className="mt-4">
                                    <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Location</label>
                                    <SearchableSelect
                                        options={[
                                            { value: null, label: 'Common (All Locations)' },
                                            ...localLocations.map(l => ({ value: l.id, label: l.name }))
                                        ]}
                                        value={data.location_id}
                                        onChange={val => setData('location_id', val)}
                                        placeholder="Select location"
                                    />
                                    {errors.location_id && <p className="mt-1 text-xs text-red-600">{errors.location_id}</p>}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Passport Photo Upload */}
                        <div className="flex flex-col items-center sm:items-start shrink-0 pt-1">
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1 self-start">Photo</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-24 h-24 border border-dashed border-slate-300 hover:border-primary-500 hover:bg-slate-50 rounded-sm transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group select-none bg-white shadow-sm"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                {imagePreviewUrl ? (
                                    <>
                                        <img
                                            src={imagePreviewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                                            title="Remove Photo"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                        <svg className="w-5 h-5 text-slate-400 mb-1 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary-500 transition-colors">Upload</span>
                                    </div>
                                )}
                            </div>
                            {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
                        </div>
                    </div>
                </FormSection>

                {/* Toggles for Sales/Purchasing (Service / Non-inventory only) */}
                {showToggles && (
                    <div className="pt-4 border-t border-slate-150 space-y-3">
                        <Toggle
                            checked={data.is_sold}
                            onChange={val => setData('is_sold', val)}
                            label="I sell this to my customers"
                            description="Enable this if the item is sold in credit_invoices or receipts."
                        />
                        <Toggle
                            checked={data.is_purchased}
                            onChange={val => setData('is_purchased', val)}
                            label="I purchase this from a supplier"
                            description="Enable this if the item is bought via purchase orders or bills."
                        />
                    </div>
                )}

                {/* 2. Inventory Details Section */}
                <FormSection title="Inventory Details" show={showInventoryDetails}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Initial Qty on Hand</label>
                            <input
                                type="text"
                                value={data.quantity_on_hand}
                                onChange={e => setData('quantity_on_hand', e.target.value)}
                                onFocus={e => e.target.select()}
                                onBlur={e => {
                                    const num = Math.round(parseFloat(String(e.target.value).replace(/,/g, '')) || 0);
                                    setData('quantity_on_hand', num.toString());
                                }}
                                className="w-full px-2 h-[30px] bg-white border border-slate-300 rounded-sm text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all font-mono"
                                placeholder="0"
                            />
                            {errors.quantity_on_hand && <p className="mt-1 text-xs text-red-600">{errors.quantity_on_hand}</p>}
                        </div>

                        <CommonInput
                            type="date"
                            label="As of Date"
                            value={data.as_of_date}
                            onChange={e => setData('as_of_date', e.target.value)}
                            error={errors.as_of_date}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Reorder Point (Min Stock)</label>
                            <input
                                type="text"
                                value={data.reorder_point}
                                onChange={e => setData('reorder_point', e.target.value)}
                                onFocus={e => e.target.select()}
                                onBlur={e => {
                                    const num = parseFloat(String(e.target.value).replace(/,/g, '')) || 0;
                                    setData('reorder_point', num.toLocaleString('en-US'));
                                }}
                                className="w-full px-2 h-[30px] bg-white border border-slate-300 rounded-sm text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all font-mono"
                                placeholder="0"
                            />
                            {errors.reorder_point && <p className="mt-1 text-xs text-red-600">{errors.reorder_point}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Inventory Asset Account</label>
                            <SearchableSelect
                                options={localInventoryAccounts.map(acc => ({ value: acc.id, label: `${acc.account_code} - ${acc.name}` }))}
                                value={data.inventory_account_id}
                                onChange={val => setData('inventory_account_id', val)}
                                placeholder="Link to Inventory Asset"
                                onAddNew={(search) => {
                                    setAccountModalType('asset');
                                    setAccountInitialName(search || '');
                                    setIsAccountModalOpen(true);
                                }}
                            />
                            {errors.inventory_account_id && <p className="mt-1 text-xs text-red-600">{errors.inventory_account_id}</p>}
                        </div>
                    </div>
                </FormSection>

                {/* 3. Sales Information Section */}
                <FormSection title="Sales Information" show={showSalesSection}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Sales Price / Rate</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currencyPrefix}</span>
                                <input
                                    type="text"
                                    value={data.sale_price}
                                    onChange={e => setData('sale_price', e.target.value)}
                                    onFocus={e => e.target.select()}
                                    onBlur={e => {
                                        const num = parseFloat(String(e.target.value).replace(/,/g, '')) || 0;
                                        setData('sale_price', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                    }}
                                    className="w-full pl-6 pr-2 h-[30px] bg-white border border-slate-300 rounded-sm text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.sale_price && <p className="mt-1 text-xs text-red-600">{errors.sale_price}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Income Account</label>
                            <SearchableSelect
                                options={localIncomeAccounts.map(acc => ({ value: acc.id, label: `${acc.account_code} - ${acc.name}` }))}
                                value={data.income_account_id}
                                onChange={val => setData('income_account_id', val)}
                                placeholder="Link to Income Account"
                                onAddNew={(search) => {
                                    setAccountModalType('income');
                                    setAccountInitialName(search || '');
                                    setIsAccountModalOpen(true);
                                }}
                            />
                            {errors.income_account_id && <p className="mt-1 text-xs text-red-600">{errors.income_account_id}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="font-bold text-slate-600 ml-0.5 text-xs">Sales Description</label>
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            rows="2"
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-sm text-xs leading-snug focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all resize-none"
                            placeholder="Description for credit_invoices..."
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>
                </FormSection>

                {/* 4. Purchasing Information Section */}
                <FormSection title="Purchasing Information" show={showPurchasingSection}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Purchase Cost</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currencyPrefix}</span>
                                <input
                                    type="text"
                                    value={data.purchase_price}
                                    onChange={e => setData('purchase_price', e.target.value)}
                                    onFocus={e => e.target.select()}
                                    onBlur={e => {
                                        const num = parseFloat(String(e.target.value).replace(/,/g, '')) || 0;
                                        setData('purchase_price', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                    }}
                                    className="w-full pl-6 pr-2 h-[30px] bg-white border border-slate-300 rounded-sm text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.purchase_price && <p className="mt-1 text-xs text-red-600">{errors.purchase_price}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 ml-0.5 text-xs mb-1">Expense Account</label>
                            <SearchableSelect
                                options={localExpenseAccounts.map(acc => ({ value: acc.id, label: `${acc.account_code} - ${acc.name}` }))}
                                value={data.expense_account_id}
                                onChange={val => setData('expense_account_id', val)}
                                placeholder="Link to Expense Account"
                                onAddNew={(search) => {
                                    setAccountModalType('expense');
                                    setAccountInitialName(search || '');
                                    setIsAccountModalOpen(true);
                                }}
                            />
                            {errors.expense_account_id && <p className="mt-1 text-xs text-red-600">{errors.expense_account_id}</p>}
                        </div>
                    </div>



                    <div className="space-y-1">
                        <label className="font-bold text-slate-600 ml-0.5 text-xs">Purchase Description</label>
                        <textarea
                            value={data.purchase_description}
                            onChange={e => setData('purchase_description', e.target.value)}
                            rows="2"
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-sm text-xs leading-snug focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition-all resize-none"
                            placeholder="Description for purchase orders/bills..."
                        />
                        {errors.purchase_description && <p className="mt-1 text-xs text-red-600">{errors.purchase_description}</p>}
                    </div>
                </FormSection>

                {/* 5. Bundle Items Section */}
                {showBundleSection && (
                    <div className="pt-4 border-t border-slate-150 space-y-3">
                        <div className="flex items-center justify-between pb-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bundle Components</h3>
                            <button
                                type="button"
                                onClick={addBundleItem}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-primary-50 border border-primary-200 text-primary-600 rounded-sm hover:bg-primary-100 transition-all uppercase tracking-wider shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                Add Line
                            </button>
                        </div>
                        {errors.bundle_items && <p className="text-xs text-red-600 font-bold">{errors.bundle_items}</p>}

                        <div className="border border-slate-150 rounded bg-white overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-2/3">Product / Service</th>
                                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-1/4">Quantity</th>
                                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.bundle_items.map((bi, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/20 transition-colors">
                                            <td className="p-2">
                                                <SearchableSelect
                                                    options={localAllItems.map(i => ({ value: i.id, label: `${i.name} (${i.sku || 'No SKU'})` }))}
                                                    value={bi.item_id}
                                                    onChange={val => updateBundleItem(idx, 'item_id', val)}
                                                    placeholder="Select item"
                                                    variant="table"
                                                    hideChevron
                                                />
                                                {errors[`bundle_items.${idx}.item_id`] && (
                                                    <p className="mt-0.5 text-[9px] text-red-500 font-bold ml-1">{errors[`bundle_items.${idx}.item_id`]}</p>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={bi.quantity}
                                                    onChange={e => updateBundleItem(idx, 'quantity', e.target.value)}
                                                    onFocus={e => e.target.select()}
                                                    onBlur={e => {
                                                        const num = parseFloat(String(e.target.value).replace(/,/g, '')) || 1.00;
                                                        updateBundleItem(idx, 'quantity', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                    }}
                                                    className="w-full px-2 py-1 bg-transparent border-none focus:bg-slate-50/50 focus:ring-0 text-xs font-mono text-slate-800 text-right h-8"
                                                    placeholder="1.00"
                                                />
                                                {errors[`bundle_items.${idx}.quantity`] && (
                                                    <p className="mt-0.5 text-[9px] text-red-500 font-bold text-right mr-1">{errors[`bundle_items.${idx}.quantity`]}</p>
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeBundleItem(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.bundle_items.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-3 py-6 text-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No bundle items added</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* {item && (data.inventory_account_id !== item.inventory_account_id || data.income_account_id !== item.income_account_id || data.expense_account_id !== item.expense_account_id) && (
                        <div className="mt-4 flex items-start p-3 bg-amber-50 rounded border border-amber-200">
                            <input
                                type="checkbox"
                                id="update_historical"
                                className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                checked={data.update_historical}
                                onChange={e => setData('update_historical', e.target.checked)}
                            />
                            <label htmlFor="update_historical" className="ml-2 text-xs text-amber-800">
                                <span className="font-bold block">Update historical transactions?</span>
                                Check this if you want past credit_invoices and bills to use the new accounts. (Warning: This will change past financial reports).
                            </label>
                        </div>
                    )} */}


                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                    <CommonButton variant="ghost" onClick={onClose} type="button" size="sm">Cancel</CommonButton>
                    <CommonButton variant="primary" type="submit" processing={processing || isSubmitting} size="sm">
                        {isEdit ? "Update Item" : "Save Item"}
                    </CommonButton>
                </div>
            </form>

            <ItemCategorySidePanel
                isOpen={isCategoryPanelOpen}
                onClose={() => setIsCategoryPanelOpen(false)}
                parents={localCategories}
                onSuccess={handleCategorySuccess}
            />

            {isAccountModalOpen && (
                <QuickAddAccount
                    isOpen={isAccountModalOpen}
                    onClose={() => {
                        setIsAccountModalOpen(false);
                        setAccountInitialName('');
                    }}
                    initialName={accountInitialName}
                    defaultType={accountModalType}
                    onSuccess={(newAcc) => handleAccountSuccess(newAcc, accountModalType)}
                />
            )}

            <Modal show={showHistoricalConfirm} onClose={() => setShowHistoricalConfirm(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Update Account</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">
                        You've changed the account for this product/service. Do you want to update historical transactions with this new account? If you select 'Also Update Old Ones', past transactions will use the new account. Otherwise, only new transactions will use the new account.
                    </p>
                    <div className="flex justify-end gap-2">
                        <CommonButton
                            type="button"
                            onClick={() => setShowHistoricalConfirm(false)}
                            disabled={processing || isSubmitting}
                            variant="ghost"
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            type="button"
                            onClick={() => processSubmit(false)}
                            disabled={processing || isSubmitting}
                            variant="secondary"
                            className="!bg-slate-600 !text-white hover:!bg-slate-700"
                        >
                            Only New Ones
                        </CommonButton>
                        <CommonButton
                            type="button"
                            onClick={() => processSubmit(true)}
                            disabled={processing || isSubmitting}
                            variant="primary"
                        >
                            Also Update Old Ones
                        </CommonButton>
                    </div>
                </div>
            </Modal>
        </SlideOver>
    );
}
