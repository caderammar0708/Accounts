import { useState, useEffect, useRef } from "react";
import { useForm, Head } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import { showToast } from "@/Components/ToastNotification";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import PinPromptModal from "@/Components/PinPromptModal";
import { useBooksLock, isBooksLocked } from "@/Hooks/useBooksLock";

export default function InvoiceReturnForm({ auth, nextRef = "", invoiceReturn = null }) {
    const company = auth.company;
    const homeCurrencyObj = typeof company?.home_currency === 'object' ? company.home_currency : null;
    const homeCurrencyStr = typeof company?.home_currency === 'string' ? company.home_currency : '';
    const currencyPrefix = company?.home_currency_prefix || homeCurrencyObj?.symbol || homeCurrencyStr || '';
    const defaultCurrencyCode = homeCurrencyObj?.code || homeCurrencyStr || company?.home_currency_prefix || '';

    const [customerOptions, setCustomerOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);

    const fetchCustomers = (search = "") => {
        axios.get(route('api.payees', { search, type: 'Customer' })).then(res => setCustomerOptions(res.data));
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
        fetchProducts();
    }, []);

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
            width: "320px"
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "100px", className: "text-right" },
        { key: "rate", label: "Rate", type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: "Amount", type: "currency", width: "160px", className: "text-right", inputClass: "text-right" },
    ];


    const getInitialDate = () => {
        if (invoiceReturn?.date) return invoiceReturn.date;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const actionRef = useRef('save');
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(invoiceReturn?.id || null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        customer: invoiceReturn?.customer || "",
        email: invoiceReturn?.email || "",
        date: getInitialDate(),
        reference: invoiceReturn?.reference || (nextRef ? String(parseInt(nextRef)).padStart(4, '0') : "1001"),
        memo: invoiceReturn?.memo || "",
        statementMessage: invoiceReturn?.statementMessage || "",
        prefix: invoiceReturn?.prefix || "",
        action: 'save',
        books_pin: '',
        items: invoiceReturn?.items ? invoiceReturn.items.map(i => ({
            ...i,
            qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })) : [
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
        ],
    });

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock(errors);

    useEffect(() => {
        if (invoiceReturn) {
            setData(prev => ({
                ...prev,
                customer: invoiceReturn.customer || "",
                email: invoiceReturn.email || "",
                date: invoiceReturn.date || "",
                reference: invoiceReturn.reference || "",
                memo: invoiceReturn.memo || "",
                statementMessage: invoiceReturn.statementMessage || "",
                prefix: invoiceReturn.prefix || "",
                items: invoiceReturn.items ? invoiceReturn.items.map(i => ({
                    ...i,
                    qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                })) : [
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ]
            }));
        } else {
            const cachedDate = localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0];
            setData(prev => ({
                ...prev,
                customer: "",
                email: "",
                date: cachedDate,
                reference: nextRef ? String(parseInt(nextRef)).padStart(4, '0') : "1001",
                memo: "",
                statementMessage: "",
                prefix: "",
                items: [
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                    { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                ]
            }));
        }
        clearErrors();
    }, [invoiceReturn?.id, nextRef]);



    const totalAmount = data.items.reduce(
        (sum, item) => sum + (parseFloat(String(item.amount).replace(/,/g, '')) || 0),
        0
    ).toFixed(2);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const handleItemChange = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;

        if (field === "product") {
            const product = productOptions.find(p => p.value === value);
            if (product) {
                const rateValue = parseFloat(product.rate || 0);
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

    const handleSave = (action = 'save', pinOverride = null) => {
        const isEdit = !!(invoiceReturn?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(data.date, auth?.books_lock_date, isEdit)) {
            actionRef.current = action;
            setPendingAction(action);
            setIsPinModalOpen(true);
            return;
        }

        actionRef.current = action;
        setPendingAction(action);

        const currentId = savedEntryId || invoiceReturn?.id;

        transform((data) => ({
            ...data,
            action: action,
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

        const url = currentId ? route('invoice-return.update', currentId) : route('invoice-return.store');
        const method = currentId ? patch : post;

        method(url, {
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
                    || page.props?.invoiceReturn?.id
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
                    const currentNo = data.reference || '1001';
                    const num = parseInt(String(currentNo).replace(/[^0-9]/g, '')) || 1000;
                    const nextNo = String(num + 1).padStart(4, '0');
                    setData({
                        customer: "", email: "", prefix: "",
                        date: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        reference: nextNo, memo: "", statementMessage: "", action: 'save',
                        items: [
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                            { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" },
                        ]
                    });
                    reset();
                    clearErrors();
                    setIsDirty(false);
                }
            }
        });
    };
    return (
        <TransactionLayout
            historyType="invoice_return"
            title={
                <div className="flex items-center">
                    Invoice Return #{data.reference}
                    <BooksLockIndicator date={data.date} lockDate={auth?.books_lock_date} isEdit={!!(invoiceReturn?.id || savedEntryId)} />
                </div>
            }
            amount={totalAmount}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            onAddLine={() => {
                setData("items", [...data.items, { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                setIsDirty(true);
            }}
            onClearRows={() => {
                setData("items", [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                setIsDirty(true);
            }}
        >
            <Head title="Invoice Return" />
            <div className="py-6 px-1 space-y-8">
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
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Return Amount</p>
                        <p className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
                            <span className="text-slate-400 text-[10px] font-medium mr-1">{currencyPrefix}</span>
                            {parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex items-end gap-6 flex-wrap">
                    <div className="w-[180px]">
                        <CommonInput
                            type="date"
                            label="Return date"
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
                    <div className="w-[160px]">
                        <CommonInput
                            label="Return no."
                            value={data.reference}
                            onChange={(e) => { setData('reference', e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('reference', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('reference', val);
                            }}
                            size="sm"
                            inputClass="font-mono text-right"
                            error={errors.reference}
                        />
                    </div>
                </div>
            </div>

            <LineItemsTable
                columns={COLUMNS}
                items={data.items}
                handleItemChange={handleItemChange}
                addRow={() => {
                    setData("items", [...data.items, { product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                    setIsDirty(true);
                }}
                removeRow={(index) => {
                    setData("items", data.items.filter((_, i) => i !== index));
                    setIsDirty(true);
                }}
                clearRows={() => {
                    setData("items", [{ product: "", description: "", qty: "1", rate: "0.00", amount: "0.00" }]);
                    setIsDirty(true);
                }}
                totals={{ "Total": totalAmount }}
                currencyPrefix={currencyPrefix}
                hideActions={true}
                errors={errors}
            />

            <div className="grid grid-cols-2 gap-10 mt-8">
                <div className="space-y-6">
                    <div className="w-[400px]">
                        <CommonInput
                            type="textarea"
                            label="Message displayed on sales return"
                            placeholder="Enter message"
                            value={data.memo}
                            onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                            size="sm"
                            className="h-20"
                            error={errors.memo}
                        />
                    </div>
                    <div className="w-[400px]">
                        <CommonInput
                            type="textarea"
                            label="Message displayed on statement"
                            placeholder="Enter message"
                            value={data.statementMessage}
                            onChange={(e) => { setData('statementMessage', e.target.value); setIsDirty(true); }}
                            size="sm"
                            className="h-20"
                            error={errors.statementMessage}
                        />
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
