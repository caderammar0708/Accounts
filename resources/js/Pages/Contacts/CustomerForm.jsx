import { useForm, Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';

export default function CustomerForm({ auth, customer, nextCustomerNumber }) {
    const isEdit = !!customer;
    const displayNumber = isEdit ? customer.customer_number : nextCustomerNumber;

    const initialFormData = {
        display_name: customer?.display_name || '',
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        customer_type: customer?.customer_type || '',
        company_name: customer?.company_name || '',
        email: customer?.email || '',
        phone_number: customer?.phone_number || '',
        mobile: customer?.mobile || '',
        fax: customer?.fax || '',
        website: customer?.website || '',
        nic: customer?.nic || '',
        passport: customer?.passport || '',
        address: customer?.address || '',
    };

    if (!isEdit) {
        initialFormData.opening_balance = customer?.opening_balance ?? '';
        initialFormData.opening_balance_date = customer?.opening_balance_date ?? '';
    }

    const { data, setData, post, put, processing, errors } = useForm(initialFormData);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('customers.update', customer.id));
        } else {
            post(route('customers.store'));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={isEdit ? "Edit Customer" : "New Customer"}>
            <Head title={isEdit ? "Edit Customer" : "New Customer"} />

            <div className="py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 space-y-6">

                            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer Number</span>
                                <span className="text-sm font-bold text-slate-800">{displayNumber}</span>
                            </div>

                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Primary Info</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="First Name"
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        error={errors.first_name}
                                    />
                                    <CommonInput
                                        label="Last Name"
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        error={errors.last_name}
                                    />
                                </div>
                                <div className="mt-4">
                                    <CommonInput
                                        label="Display Name (REQUIRED)"
                                        value={data.display_name}
                                        onChange={e => setData('display_name', e.target.value)}
                                        required
                                        error={errors.display_name}
                                    />
                                </div>
                                {!isEdit && (
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <CommonInput
                                            label="Opening Balance"
                                            type="number"
                                            step="0.01"
                                            value={data.opening_balance}
                                            onChange={e => setData('opening_balance', e.target.value)}
                                            error={errors.opening_balance}
                                        />
                                        <CommonInput
                                            label="Opening Balance Date"
                                            type="date"
                                            value={data.opening_balance_date}
                                            onChange={e => setData('opening_balance_date', e.target.value)}
                                            error={errors.opening_balance_date}
                                        />
                                    </div>
                                )}
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Identification</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="NIC"
                                        value={data.nic}
                                        onChange={e => setData('nic', e.target.value)}
                                        required
                                        error={errors.nic}
                                    />
                                    <CommonInput
                                        label="Passport (optional)"
                                        value={data.passport}
                                        onChange={e => setData('passport', e.target.value)}
                                        error={errors.passport}
                                    />
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Business Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Company Name"
                                        value={data.company_name}
                                        onChange={e => setData('company_name', e.target.value)}
                                        error={errors.company_name}
                                    />
                                    <CommonInput
                                        label="Customer Type"
                                        value={data.customer_type}
                                        onChange={e => setData('customer_type', e.target.value)}
                                        error={errors.customer_type}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <CommonInput
                                        label="Email Address"
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        error={errors.email}
                                    />
                                    <CommonInput
                                        label="Website"
                                        value={data.website}
                                        onChange={e => setData('website', e.target.value)}
                                        error={errors.website}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <CommonInput
                                        label="Phone Number"
                                        value={data.phone_number}
                                        onChange={e => setData('phone_number', e.target.value)}
                                        error={errors.phone_number}
                                    />
                                    <CommonInput
                                        label="Mobile"
                                        value={data.mobile}
                                        onChange={e => setData('mobile', e.target.value)}
                                        error={errors.mobile}
                                    />
                                    <CommonInput
                                        label="Fax"
                                        value={data.fax}
                                        onChange={e => setData('fax', e.target.value)}
                                        error={errors.fax}
                                    />
                                </div>
                                <div className="mt-4">
                                    <CommonInput
                                        label="Address"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        error={errors.address}
                                    />
                                </div>
                            </section>

                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <Link href={route('customers.index')}>
                                <CommonButton variant="ghost" type="button">Cancel</CommonButton>
                            </Link>
                            <CommonButton variant="primary" type="submit" processing={processing}>
                                {isEdit ? 'Update' : 'Save'} Customer
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}