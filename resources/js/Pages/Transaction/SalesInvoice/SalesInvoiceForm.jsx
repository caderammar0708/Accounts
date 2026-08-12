import { useState, useEffect } from "react";
import { useForm, Head, router } from "@inertiajs/react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddAccount from "@/Components/QuickAddAccount";
import InventoryItemSidePanel from "@/Components/InventoryItemSidePanel";
import QuickAddPaymentMethod from "@/Components/QuickAddPaymentMethod";
import { showToast } from "@/Components/ToastNotification";

export default function SalesInvoiceForm({ auth, paymentMethods = [], nextReceiptNo = "", receipt = null }) {
    const company = auth.company;
    const currencyPrefix = company?.home_currency_prefix || company?.home_currency || '';
    const defaultCurrencyCode = company?.home_currency || company?.home_currency_prefix || '';

    const [customerOptions, setCustomerOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const paymentMethodOptions = paymentMethods.map(pm => ({ value: pm.id, label: pm.name }));

    const getDefaultCashPaymentMethod = () => {
        const cashMethod = paymentMethods.find((pm) => pm.name?.toLowerCase() === 'cash' || pm.slug?.toLowerCase() === 'cash');
        return cashMethod?.id || '';
    };

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [addingItemRowIndex, setAddingItemRowIndex] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [savedEntryId, setSavedEntryId] = useState(receipt?.id || null);

    const fetchCustomers = (search = "") => {
        axios.get(route('api.payees', { search, type: 'Customer' })).then(res => setCustomerOptions(res.data));
    };

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => setAccountOptions(res.data));
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
        fetchAccounts();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (receipt) {
            setData({
                customer: receipt.customer || "",
                email: receipt.email || "",
                billingAddress: receipt.billingAddress || "",
                receiptDate: receipt.receiptDate || "",
                receiptNo: receipt.receiptNo || "",
                paymentMethod: receipt.paymentMethod || "",
                depositTo: receipt.depositTo || "",
                memo: receipt.memo || "",
                memo_on_statement: receipt.memo_on_statement || "",
                statementMessage: receipt.statementMessage || "",
                checkDate: receipt.checkDate || "",
                checkNumber: receipt.checkNumber || "",
                items: receipt.items && receipt.items.length > 0 ? receipt.items.map(i => ({
                    ...i,
                    qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
                    rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    warranty: i.warranty || false
                })) : [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false }
                ],
                action: 'save'
            });
        } else {
            setData({
                customer: "",
                email: "",
                billingAddress: "",
                receiptDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                receiptNo: nextReceiptNo ? nextReceiptNo : "RCPT-0001",
                paymentMethod: getDefaultCashPaymentMethod() || "",
                depositTo: "",
                memo: "",
                memo_on_statement: "",
                statementMessage: "",
                checkDate: "",
                checkNumber: "",
                items: [
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
                    { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
                ],
                discount_type: 'percent',
                discount_value: '0',
                prefix: '',
                action: 'save'
            });

        }
        clearErrors();
    }, [receipt?.id]);

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
            width: "280px"
        },
        { key: "description", label: "Description", placeholder: "Enter description" },
        { key: "qty", label: "Qty", type: "number", min: "0", width: "80px", className: "text-right" },
        { key: "rate", label: "Rate", type: "currency", width: "120px", className: "text-right", inputClass: "text-right" },
        { key: "amount", label: "Amount", type: "currency", width: "140px", className: "text-right", inputClass: "text-right" },
        { key: "warranty", label: "Warranty", type: "checkbox", width: "90px", className: "text-center" },
    ];

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        customer: receipt?.customer || "",
        email: receipt?.email || "",
        billingAddress: receipt?.billingAddress || "",
        receiptDate: receipt?.receiptDate || localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
        receiptNo: receipt?.receiptNo || (nextReceiptNo ? nextReceiptNo : "RCPT-0001"),
        paymentMethod: receipt?.paymentMethod || "",
        depositTo: receipt?.depositTo || "",
        memo: receipt?.memo || "",
        statementMessage: receipt?.statementMessage || "",
        checkDate: receipt?.checkDate || "",
        checkNumber: receipt?.checkNumber || "",
        items: receipt?.items ? receipt.items.map(i => ({
            ...i,
            qty: i.qty ? parseFloat(i.qty).toLocaleString('en-US', { maximumFractionDigits: 4 }) : "1",
            rate: parseFloat(i.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            amount: parseFloat(i.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            warranty: i.warranty || false
        })) : [
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
        ],
        discount_type: receipt?.discountType || 'percent',
        discount_value: receipt?.discountValue !== undefined ? String(receipt.discountValue) : '0',
        prefix: receipt?.prefix || '',
        memo_on_statement: receipt?.memo_on_statement || '',
        action: 'save'
    });


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
        if (!receipt?.id && !data.paymentMethod && paymentMethods.length > 0) {
            setData('paymentMethod', getDefaultCashPaymentMethod());
        }
    }, [paymentMethods, receipt?.id, data.paymentMethod]);

    const parseCurrency = (val) => parseFloat(String(val).replace(/,/g, "")) || 0;
    const formatCurrencyValue = (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const subtotal = data.items.reduce((sum, item) => sum + parseCurrency(item.amount), 0);
    
    let discountAmount = 0;
    const dVal = parseFloat(data.discount_value || 0);
    if (dVal > 0) {
        if (data.discount_type === 'percent') {
            discountAmount = subtotal * (dVal / 100);
        } else {
            discountAmount = dVal;
        }
    }
    const totalAmount = (subtotal - discountAmount).toFixed(2);

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

    const handleSave = (actionType = 'save') => {

        const currentNo = data.receiptNo;

        transform((data) => ({
            ...data,
            action: actionType,
            items: data.items
                .filter(item => item.product || item.description || (item.qty && item.qty !== "0" && item.qty !== "1") || (item.amount && item.amount !== "0.00" && item.amount !== "0"))
                .map(item => ({
                    ...item,
                    qty: String(item.qty).replace(/,/g, ''),
                    rate: String(item.rate).replace(/,/g, ''),
                    amount: String(item.amount).replace(/,/g, '')
                }))
        }));

        const currentId = savedEntryId || receipt?.id;
        const url = currentId ? route('sales-invoice.update', currentId) : route('sales-invoice.store');
        const submitMethod = currentId ? patch : post;

        submitMethod(url, {
            preserveScroll: true,
            preserveState: actionType === 'save',
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);

                const newId = page.props?.flash?.journal_entry_id
                    || page.props?.receipt?.id
                    || page.props?.record?.id;
                if (newId && !savedEntryId) {
                    setSavedEntryId(newId);
                }

                const serverNextNo = page.props.nextReceiptNo || "";
                if (actionType === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } 
                }

                if (actionType === 'new') {
                    setSavedEntryId(null);
                    setData({
                        customer: "", email: "", billingAddress: "",
                        receiptDate: localStorage.getItem('last_transaction_date') || new Date().toISOString().split('T')[0],
                        receiptNo: serverNextNo, paymentMethod: getDefaultCashPaymentMethod() || "", depositTo: "", memo: "", statementMessage: "",
                        items: [
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
                            { serviceDate: "", product: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false },
                        ],
                        discount_type: 'percent',
                        discount_value: '0',
                        prefix: '',
                        memo_on_statement: '',
                        action: 'save'
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
            historyType="sales_invoice"
            title={`Sales Invoice #${data.receiptNo}`}
            amount={totalAmount}
            processing={processing}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            onAddLine={() => {
                setData("items", [...data.items, { product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false }]);
            }}
            onClearRows={() => {
                setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false }]);
            }}
        >
            <Head title="Cash sale" />

            {/* Error Banner */}
            {errors.error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                    {errors.error}
                </div>
            )}

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
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Amount</p>
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
                            label="Cash sale date"
                            value={data.receiptDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                localStorage.setItem('last_transaction_date', newDate);
                                setData('receiptDate', newDate);
                                setIsDirty(true);
                            }}
                            size="sm"
                            error={errors.receiptDate}
                        />
                    </div>
                    <div className="w-[180px]">
                        <SearchableSelect
                            label="Payment method"
                            value={data.paymentMethod}
                            onChange={handlePaymentMethodChange}
                            options={paymentMethodOptions}
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
                    <div className="w-[240px]">
                        <SearchableSelect
                            label="Deposit to"
                            placeholder="Select account"
                            value={data.depositTo}
                            onSearch={fetchAccounts}
                            onAddNew={() => setIsAccountModalOpen(true)}
                            onChange={(val) => { setData('depositTo', val); setIsDirty(true); }}
                            options={accountOptions}
                            size="sm"
                            error={errors.depositTo}
                        />
                    </div>
                    <div className="w-[160px]">
                        <CommonInput
                            label="Receipt no."
                            value={data.receiptNo}
                            onChange={(e) => { setData('receiptNo', e.target.value); setIsDirty(true); }}
                            onFocus={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('receiptNo', val);
                                setTimeout(() => e.target.select(), 0);
                            }}

                            onBlur={(e) => {
                                const val = e.target.value.replace(/,/g, '');
                                setData('receiptNo', val);
                            }}
                            size="sm"
                            inputClass="font-mono text-right"
                            error={errors.receiptNo}
                        />
                    </div>
                </div>
            </div>

            <LineItemsTable
                columns={COLUMNS}
                items={data.items}
                handleItemChange={handleItemChange}
                addRow={() => setData("items", [...data.items, { product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false }])}
                removeRow={(index) => setData("items", data.items.filter((_, i) => i !== index))}
                clearRows={() => setData("items", [{ product: "", serviceDate: "", description: "", qty: "1", rate: "0.00", amount: "0.00", warranty: false }])}
                totals={{ "Total": totalAmount }}
                currencyPrefix={currencyPrefix}
                hideActions={true}
                errors={errors}
                subtotal={subtotal}
                discountValue={data.discount_value}
                discountType={data.discount_type}
                onDiscountChange={(val, type) => {
                    setData(prev => ({ ...prev, discount_value: val, discount_type: type }));
                    setIsDirty(true);
                }}
            />


            <div className="grid grid-cols-2 gap-10 mt-8">
                <div className="w-[400px] flex flex-col gap-4">
                    <CommonInput
                        type="textarea"
                        label="Memo"
                        placeholder="This will show up on the Cash Sale."
                        value={data.memo}
                        onChange={(e) => { setData('memo', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                        error={errors.memo}
                    />
                    <CommonInput
                        type="textarea"
                        label="Memo on Statement"
                        placeholder="This will show up on the customer Statement."
                        value={data.memo_on_statement}
                        onChange={(e) => { setData('memo_on_statement', e.target.value); setIsDirty(true); }}
                        size="sm"
                        className="h-24"
                    />
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

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAccount) => {
                    fetchAccounts();
                    if (newAccount) setData("depositTo", newAccount.value);
                }}
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

            <QuickAddPaymentMethod
                isOpen={isMethodModalOpen}
                onClose={() => setIsMethodModalOpen(false)}
                onSuccess={() => router.reload({ only: ['paymentMethods'] })}
            />

        </TransactionLayout>
    );
}
