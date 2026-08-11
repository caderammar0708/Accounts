import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import POSProductCard from './Partials/POSProductCard';
import POSCartItem from './Partials/POSCartItem';
import CheckoutModal from './Partials/CheckoutModal';
import SearchableSelect from '@/Components/SearchableSelect';
import Modal from '@/Components/Modal';
import { showToast } from '@/Components/ToastNotification';

export default function POSIndex({ auth, items, paymentMethods, warrantyPolicies = [], nextReceiptNo, existingReceipt, defaultDepositAccount }) {
    const isEditMode = !!existingReceipt;
    const currency = auth.currency_prefix || auth.company?.home_currency_prefix || '';
    const [cart, setCart] = useState(isEditMode ? existingReceipt.items.map(item => ({ ...item, warranty: item.warranty ?? null })) : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'service'

    // Drafts
    const [drafts, setDrafts] = useState([]);
    const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

    // Checkout & UI States
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isRepairCostExpanded, setIsRepairCostExpanded] = useState(false);
    const [selectedVehicleLabel, setSelectedVehicleLabel] = useState(isEditMode ? existingReceipt.vehicle?.vehicle_no : '');
    const [selectedCustomerLabel, setSelectedCustomerLabel] = useState(isEditMode ? existingReceipt.customer?.display_name : '');
    const [posSelectorMode, setPosSelectorMode] = useState(auth.vehicles_enabled !== false ? 'vehicle' : 'customer');

    const getDefaultCashPaymentMethod = () => {
        const cashMethod = paymentMethods.find(pm => pm.name?.toLowerCase() === 'cash' || pm.slug?.toLowerCase() === 'cash');
        return cashMethod?.id || paymentMethods[0]?.id || '';
    };

    useEffect(() => {
        const savedDrafts = JSON.parse(localStorage.getItem('pos_drafts') || '[]');
        setDrafts(savedDrafts);

        // Lock body scroll for POS
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        vehicle_id: isEditMode ? existingReceipt.vehicle_id : '',
        customer: isEditMode ? existingReceipt.customer_id : '',
        email: isEditMode ? existingReceipt.email : '',
        billingAddress: isEditMode ? existingReceipt.billingAddress : '',
        receiptDate: isEditMode ? existingReceipt.receiptDate : new Date().toISOString().split('T')[0],
        receiptNo: isEditMode ? existingReceipt.receiptNo : nextReceiptNo,
        paymentMethod: isEditMode ? existingReceipt.paymentMethod : getDefaultCashPaymentMethod(),
        depositTo: isEditMode ? existingReceipt.depositTo : (defaultDepositAccount?.id || ''),
        memo: isEditMode ? existingReceipt.memo : 'POS Sale',
        statementMessage: isEditMode ? existingReceipt.statementMessage : '',
        repairingCost: isEditMode ? existingReceipt.repairingCost : 0,
        source: 'pos',
        items: []
    });

    useEffect(() => {
        if (!isEditMode && !data.paymentMethod && paymentMethods.length > 0) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }
    }, [isEditMode, data.paymentMethod, paymentMethods]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (activeTab && item.type !== activeTab) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return item.name.toLowerCase().includes(q) || (item.sku && item.sku.toLowerCase().includes(q));
            }
            return true;
        });
    }, [items, searchQuery, activeTab]);

    const addToCart = useCallback((item) => {
        setCart(prev => {
            const existing = prev.find(i => i.product === item.id);
            if (existing) {
                return prev.map(i => {
                    if (i.product === item.id) {
                        const newQty = i.qty + 1;
                        const amtBeforeDiscount = newQty * Number(i.rate);
                        const discountAmt = amtBeforeDiscount * (i.discount / 100);
                        return { ...i, qty: newQty, amount: amtBeforeDiscount - discountAmt };
                    }
                    return i;
                });
            }
            return [...prev, {
                product: item.id,
                name: item.name,
                description: item.description || '',
                qty: 1,
                rate: Number(item.sale_price),
                discount: 0, // percentage
                amount: Number(item.sale_price),
                itemType: item.type,
                warranty: null
            }];
        });
    }, []);

    const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.amount), 0);
    const repairingCostNum = Number(data.repairingCost) || 0;
    const totalAmount = cartSubtotal + repairingCostNum;

    // Barcode Scanner Listener
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e) => {
            // Check if we are focusing an input
            const target = e.target.tagName.toLowerCase();
            const isInput = target === 'input' || target === 'textarea' || target === 'select';

            const currentTime = Date.now();
            // A scanner typically types very quickly (e.g., < 30ms per character). 
            // If the time between keystrokes is too large, reset buffer (it's human typing).
            if (currentTime - lastKeyTime > 50) {
                buffer = '';
            }

            if (e.key === 'Escape') {
                if (isCheckoutModalOpen) {
                    setIsCheckoutModalOpen(false);
                    return;
                }
                if (isExitModalOpen) {
                    setIsExitModalOpen(false);
                    return;
                }
                if (isDraftsModalOpen) {
                    setIsDraftsModalOpen(false);
                    return;
                }

                if (isInput) {
                    document.activeElement?.blur();
                    return;
                }

                if (cart.length > 0 || repairingCostNum > 0) {
                    setIsExitModalOpen(true);
                } 
                return;
            }

            if (e.key === 'Enter') {
                if (buffer.length > 2) { // Valid barcode should be > 2 chars
                    const scannedItem = items.find(i => i.sku && i.sku.toLowerCase() === buffer.toLowerCase());
                    if (scannedItem) {
                        e.preventDefault(); // Prevent form submits if focusing search
                        addToCart(scannedItem);
                        setSearchQuery(''); // clear search if they scanned into the search box
                    }
                }
                buffer = '';
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                buffer += e.key;
            }

            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, addToCart, cart, repairingCostNum, isCheckoutModalOpen, isExitModalOpen, isDraftsModalOpen]);


    const updateCartQty = (productId, delta) => {
        setCart(prev => prev.map(i => {
            if (i.product === productId) {
                const newQty = Math.max(1, i.qty + delta);
                const amtBeforeDiscount = newQty * Number(i.rate);
                const discountAmt = amtBeforeDiscount * (i.discount / 100);
                return { ...i, qty: newQty, amount: amtBeforeDiscount - discountAmt };
            }
            return i;
        }));
    };

    const updateCartDiscount = (productId, discountPct) => {
        setCart(prev => prev.map(i => {
            if (i.product === productId) {
                const pct = Math.max(0, Math.min(100, Number(discountPct) || 0));
                const amtBeforeDiscount = i.qty * Number(i.rate);
                const discountAmt = amtBeforeDiscount * (pct / 100);
                return { ...i, discount: pct, amount: amtBeforeDiscount - discountAmt };
            }
            return i;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(i => i.product !== productId));
    };

    const updateCartWarranty = (productId, warranty) => {
        setCart(prev => prev.map(item => {
            if (item.product === productId) {
                return { ...item, warranty };
            }
            return item;
        }));
    };

    const handleCheckoutClick = (action = 'cash_sale') => {
        if (cart.length === 0 && repairingCostNum === 0) {
            showToast('error', 'Cart is empty! Add items before checkout.');
            return;
        }
        if (posSelectorMode === 'vehicle' && !data.vehicle_id) {
            showToast('error', 'Please select a vehicle before completing the sale.');
            return;
        }
        if (posSelectorMode === 'customer' && !data.customer) {
            showToast('error', 'Please select a customer before completing the sale.');
            return;
        }

        if (action === 'cash_sale' && !data.paymentMethod) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }

        setData('action', action);
        setIsCheckoutModalOpen(true);
    };

    const confirmCheckout = (e) => {
        e.preventDefault();

        // Merge cart into form data
        data.items = cart.map(c => ({
            product: c.product,
            description: c.name,
            qty: c.qty,
            rate: c.rate,
            discount: c.discount,
            amount: c.amount,
            warranty: c.warranty ?? null,
        }));

        // data.action is managed by the modal or handleCheckoutClick

        if (isEditMode) {
            patch(route('pos.update', existingReceipt.id), {
                onSuccess: () => {
                    showToast('success', 'Sale updated successfully!');
                    setIsCheckoutModalOpen(false);
                },
                preserveScroll: true
            });
        } else {
            post(route('pos.store'), {
                onSuccess: (page) => {
                    const printUrl = page.props.flash?.print_url;
                    if (printUrl) {
                        window.open(printUrl, '_blank');
                    } else {
                        showToast('success', 'Sale completed successfully!');
                    }
                    setCart([]);
                    reset('vehicle_id', 'customer', 'email', 'billingAddress', 'repairingCost', 'action');
                    setSelectedVehicleLabel('');
                    setSelectedCustomerLabel('');
                    setIsCheckoutModalOpen(false);
                },
                preserveScroll: true
            });
        }
    };

    const saveDraft = () => {
        if (cart.length === 0 && repairingCostNum === 0) {
            showToast('error', 'Nothing to hold. Add items or repair cost before holding.');
            return false;
        }
        if (posSelectorMode === 'vehicle' && !data.vehicle_id) {
            showToast('error', 'Please select a vehicle before holding the sale.');
            return;
        }
        if (posSelectorMode === 'customer' && !data.customer) {
            showToast('error', 'Please select a customer before holding the sale.');
            return;
        }
        const draft = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            pos_mode: posSelectorMode,
            vehicle_id: data.vehicle_id,
            vehicle_label: selectedVehicleLabel,
            customer: data.customer,
            customer_label: selectedCustomerLabel,
            repairingCost: data.repairingCost,
            cart: cart,
            total: totalAmount
        };
        const updatedDrafts = [draft, ...drafts];
        localStorage.setItem('pos_drafts', JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);
        setCart([]);
        reset('vehicle_id', 'customer', 'repairingCost');
        setSelectedVehicleLabel('');
        setSelectedCustomerLabel('');
        showToast('success', 'Sale saved to Hold/Drafts.');
        return true;
    };

    const handleClosePOS = (e) => {
        e.preventDefault();
        if (cart.length > 0 || repairingCostNum > 0) {
            setIsExitModalOpen(true);
        } else {
            router.get(route('dashboard'));
        }
    };

    const restoreDraft = (draftId) => {
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
            setPosSelectorMode(draft.pos_mode || 'vehicle');
            setData('vehicle_id', draft.vehicle_id || '');
            setData('customer', draft.customer || '');
            setSelectedVehicleLabel(draft.vehicle_label || '');
            setSelectedCustomerLabel(draft.customer_label || '');
            setData('repairingCost', draft.repairingCost || 0);
            setCart(draft.cart || []);

            const updatedDrafts = drafts.filter(d => d.id !== draftId);
            localStorage.setItem('pos_drafts', JSON.stringify(updatedDrafts));
            setDrafts(updatedDrafts);
            setIsDraftsModalOpen(false);
        }
    };

    const handleExitChoice = (choice) => {
        if (choice === 'hold') {
            if (saveDraft()) {
                router.get(route('dashboard'));
            }
        } else if (choice === 'discard') {
            router.get(route('dashboard'));
        }
        setIsExitModalOpen(false);
    };

    const deleteDraft = (draftId) => {
        const updatedDrafts = drafts.filter(d => d.id !== draftId);
        localStorage.setItem('pos_drafts', JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);
    };

    return (
        <AuthenticatedLayout user={auth.user} header="POS Billing" hideSidebar={true}>
            <Head title="Point of Sale" />

            {/* Top Bar inside the viewport (since sidebar is hidden, we have full width) */}
            <div className="flex-1 flex overflow-hidden bg-slate-100">

                {/* Removed overlay Close button */}

                {/* Left Side - Catalog */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 bg-white border-b border-slate-200 shadow-sm z-10 flex gap-3 items-center justify-between">

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => setActiveTab('service')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'service' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Services
                            </button>
                            <button
                                onClick={() => setActiveTab('bundle')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'bundle' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Bundles
                            </button>
                        </div>

                        {/* Search & Close */}
                        <div className="relative flex-1 max-w-sm flex items-center gap-2 ml-auto">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder={`Search...`}
                                    className="w-full pl-9 pr-3 py-1.5 text-sm border-slate-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleClosePOS}
                                className="bg-white border border-slate-200 text-slate-500 hover:text-red-500 p-1.5 rounded-md shadow-sm transition-all flex items-center justify-center h-[34px] w-[34px]"
                                title="Close POS"
                            >
                                <span className="material-symbols-outlined text-[20px] leading-none">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredItems.map(item => (
                                <POSProductCard currency={currency}
                                    key={item.id}
                                    item={item}
                                    onClick={() => addToCart(item)}
                                />
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    No {activeTab} found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Cart & Checkout (Compact) */}
                <div className="w-[340px] bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-xl z-20">

                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            Current Order <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">{cart.length}</span>
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => setIsDraftsModalOpen(true)} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded">
                                View Holds ({drafts.length})
                            </button>
                            <button onClick={saveDraft} className="text-[10px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 border border-primary-100 px-2 py-1 rounded">
                                Hold Sale
                            </button>
                        </div>
                    </div>

                    <div className="p-3 border-b border-slate-200 bg-white space-y-2">
                        {auth.vehicles_enabled !== false && (
                            <div className="flex bg-slate-100 p-1 rounded-md mb-2">
                                <button
                                    className={`flex-1 text-xs py-1 px-2 rounded-sm font-medium transition-colors ${posSelectorMode === 'vehicle' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setPosSelectorMode('vehicle')}
                                >
                                    Vehicle
                                </button>
                                <button
                                    className={`flex-1 text-xs py-1 px-2 rounded-sm font-medium transition-colors ${posSelectorMode === 'customer' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setPosSelectorMode('customer')}
                                >
                                    Customer
                                </button>
                            </div>
                        )}
                        <div className="mb-2">
                            {posSelectorMode === 'vehicle' ? (
                                <SearchableSelect
                                    placeholder="Select a vehicle"
                                    value={data.vehicle_id}
                                    onChange={(val, opt) => {
                                        setData('vehicle_id', val);
                                        setSelectedVehicleLabel(opt ? opt.label : '');
                                        // Auto-set customer if backend provides it (LookupController vehicles returns customer_id)
                                        if (opt && opt.customer_id) {
                                            setData('customer', opt.customer_id);
                                        }
                                    }}
                                    fetchUrl={route('api.vehicles')}
                                    hideLabel={true}
                                />
                            ) : (
                                <SearchableSelect
                                    placeholder="Select a customer"
                                    value={data.customer}
                                    onChange={(val, opt) => {
                                        setData('customer', val);
                                        setSelectedCustomerLabel(opt ? opt.label : '');
                                    }}
                                    fetchUrl={route('api.customers')}
                                    hideLabel={true}
                                />
                            )}
                        </div>
                    </div>

                    <div className={`flex-1 p-2 bg-slate-50 min-h-0 ${cart.length === 0 ? 'flex flex-col items-center justify-center overflow-hidden' : 'overflow-y-auto'}`}>
                        {cart.length === 0 ? (
                            <div className="text-slate-400 text-sm">
                                <p>Order is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <POSCartItem currency={currency}
                                        key={item.product}
                                        item={item}
                                        warrantyPolicies={warrantyPolicies}
                                        onRemove={removeFromCart}
                                        onUpdateQty={updateCartQty}
                                        onUpdateDiscount={updateCartDiscount}
                                        onUpdateWarranty={updateCartWarranty}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                            <span>Subtotal</span>
                            <span>{currency} {Number(cartSubtotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>

                        {/* Repairing Cost Toggle */}
                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                            <button onClick={() => setIsRepairCostExpanded(!isRepairCostExpanded)} className="text-[9px] text-primary-500 hover:underline flex items-center gap-0.5 mt-0.5 text-left font-bold transition-all">
                                {isRepairCostExpanded ? '- Hide Repair Cost' : '+ Add Repair Cost'}
                            </button>

                            {isRepairCostExpanded && (
                                <div className="flex flex-col gap-1 pb-2 bg-white">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Additional Repair Cost</label>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-slate-400">{currency}</span>
                                        <input
                                            type="number"
                                            className="w-20 text-xs py-1 px-2 border-slate-300 rounded text-right font-bold bg-slate-50 focus:bg-white transition-colors shadow-sm"
                                            value={data.repairingCost}
                                            onChange={e => setData('repairingCost', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end pt-1">
                            <span className="text-sm font-bold text-slate-700">Total</span>
                            <span className="text-xl font-black text-primary-600">{currency} {Number(totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>

                        <div className="flex gap-2">
                            <CommonButton
                                variant="primary"
                                className="w-full py-1 text-sm justify-center font-bold"
                                onClick={() => handleCheckoutClick('cash_sale')}
                                disabled={cart.length === 0 && repairingCostNum === 0}
                            >
                                Complete Sale
                            </CommonButton>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 text-red-700 text-[10px] rounded border border-red-100">
                                <p className="font-bold">Error completing sale:</p>
                                <ul className="list-disc pl-4 mt-1">
                                    {Object.entries(errors).map(([key, error]) => (
                                        <li key={key}>{key}: {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modals */}
            {isDraftsModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Held Sales</h3>
                            <button onClick={() => setIsDraftsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {drafts.length === 0 ? (
                                <p className="text-center text-slate-500 text-sm py-8">No held sales found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {drafts.map(draft => {
                                        const entityStr = draft.pos_mode === 'customer' 
                                            ? (draft.customer_label || (draft.customer ? `Customer #${draft.customer}` : 'Walk-in Customer'))
                                            : (draft.vehicle_label || (draft.vehicle_id ? `Vehicle #${draft.vehicle_id}` : 'Walk-in Customer'));
                                        return (
                                            <div key={draft.id} className="border border-slate-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800">{entityStr}</div>
                                                        <div className="text-[10px] text-slate-500">{draft.date}</div>
                                                    </div>
                                                    <div className="font-black text-primary-600 text-sm">{currency} {Number(draft.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                                </div>
                                                <div className="text-xs text-slate-600 mb-3">
                                                    {draft.cart.length} items {Number(draft.repairingCost) > 0 && `+ Repair Cost (${currency} ${draft.repairingCost})`}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => restoreDraft(draft.id)} className="flex-1 bg-primary-50 text-primary-700 text-xs font-bold py-1.5 rounded hover:bg-primary-100">
                                                        Invoice It
                                                    </button>
                                                    <button onClick={() => deleteDraft(draft.id)} className="px-3 bg-red-50 text-red-600 text-xs font-bold py-1.5 rounded hover:bg-red-100">
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal show={isExitModalOpen} onClose={() => setIsExitModalOpen(false)} maxWidth="md">
                <div className="p-4 sm:p-5">
                    <h2 className="text-base font-bold text-slate-900">Active order detected</h2>
                    <p className="mt-2 text-sm text-slate-600">You have an active order in POS. Save it to Hold before leaving, or discard it?</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <CommonButton
                            onClick={() => handleExitChoice('discard')}
                            variant="ghost"
                            className="w-full sm:w-auto justify-center"
                        >
                            Discard & Leave
                        </CommonButton>
                        <CommonButton
                            onClick={() => handleExitChoice('hold')}
                            variant="primary"
                            className="w-full sm:w-auto justify-center"
                        >
                            Save to Hold & Leave
                        </CommonButton>
                        <CommonButton
                            onClick={() => setIsExitModalOpen(false)}
                            variant="secondary"
                            className="w-full sm:w-auto justify-center"
                        >
                            Continue POS
                        </CommonButton>
                    </div>
                </div>
            </Modal>

            <CheckoutModal currency={currency}
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                onConfirm={confirmCheckout}
                totalAmount={totalAmount}
                data={data}
                setData={setData}
                paymentMethods={paymentMethods}
                processing={processing}
                isEditMode={isEditMode}
                onPrint={() => {
                    if (existingReceipt) {
                        const printUrl = data.action === 'credit_sale' 
                            ? route('credit-invoice.print', existingReceipt.journal_entry_id)
                            : route('sales-invoice.print', existingReceipt.journal_entry_id);
                        window.open(printUrl, '_blank');
                    }
                }}
            />

        </AuthenticatedLayout>
    );
}
