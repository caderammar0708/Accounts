import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head } from '@inertiajs/react';
import { useState } from 'react';
import SlideOver from '@/Components/SlideOver';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import ContactsTabs from '@/Components/ContactsTabs';
export default function CustomerIndex({ customers = [] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        display_name: '',
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone_number: '',
        nic: '',
        passport: '',
        address: '',
        opening_balance: ''
    });

    const handleOpenCreate = () => {
        setIsEdit(false);
        setSelectedId(null);
        reset();
        clearErrors();
        setIsCreateOpen(true);
    };

    const handleEdit = (customer) => {
        setIsEdit(true);
        setSelectedId(customer.id);
        clearErrors();

        setData({
            display_name: customer.display_name || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            company_name: customer.company_name || '',
            email: customer.email || '',
            phone_number: customer.phone_number || '',
            nic: customer.nic || '',
            passport: customer.passport || '',
            address: customer.address || '',
            opening_balance: ''
        });
        setIsCreateOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            destroy(route('customers.destroy', id));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('customers.update', selectedId), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        } else {
            post(route('customers.store'), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">Contacts</h2>
            }
        >
            <Head title="Contacts - Customers" />

            <div className="p-6">
                <ContactsTabs />
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Find a customer"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-full focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                        </div>

                        <CommonButton variant="primary" onClick={handleOpenCreate}>New customer</CommonButton>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer / Company</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Details</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-800">{customer.display_name}</span>
                                                <span className="text-[10px] text-slate-400">{customer.company_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-[10px] text-slate-600">
                                                <span>{customer.email}</span>
                                                <span>{customer.phone_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <CommonButton variant="ghost" size="xs" onClick={() => handleEdit(customer)}>
                                                    Edit
                                                </CommonButton>
                                                <div className="h-3 w-px bg-slate-200" />
                                                <CommonButton
                                                    variant="ghost"
                                                    size="xs"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    Delete
                                                </CommonButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                            No customers found. Click "New customer" to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <SlideOver
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title={isEdit ? "Edit Customer" : "New Customer"}
            >
                <form onSubmit={submit} className="space-y-8">
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Primary Info</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <CommonInput
                                    label="First Name"
                                    value={data.first_name}
                                    onChange={e => setData('first_name', e.target.value)}
                                />
                                <CommonInput
                                    label="Last Name"
                                    value={data.last_name}
                                    onChange={e => setData('last_name', e.target.value)}
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
                        </section>

                        {!isEdit && (
                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Opening Balance</h3>
                                <CommonInput
                                    label="Opening Balance"
                                    type="number"
                                    step="0.01"
                                    value={data.opening_balance}
                                    onChange={e => setData('opening_balance', e.target.value)}
                                    error={errors.opening_balance}
                                />
                            </section>
                        )}

                        <section>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Business Details</h3>
                            <CommonInput
                                label="Company Name"
                                value={data.company_name}
                                onChange={e => setData('company_name', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <CommonInput
                                    label="Email Address"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                <CommonInput
                                    label="Phone Number"
                                    value={data.phone_number}
                                    onChange={e => setData('phone_number', e.target.value)}
                                />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Legal / Identification</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <CommonInput
                                    label="NIC"
                                    value={data.nic}
                                    onChange={e => setData('nic', e.target.value)}
                                    error={errors.nic}
                                />
                                <CommonInput
                                    label="Passport"
                                    value={data.passport}
                                    onChange={e => setData('passport', e.target.value)}
                                    error={errors.passport}
                                />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Address</h3>
                            <div className="mt-4">
                                <CommonInput
                                    type="textarea"
                                    label="Address"
                                    rows={2}
                                    value={data.address}
                                    onChange={(e) => setData("address", e.target.value)}
                                    error={errors.address}
                                />
                            </div>
                        </section>

                    </div>

                    <div className="sticky bottom-0 bg-white pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
                        <CommonButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</CommonButton>
                        <CommonButton variant="primary" type="submit" processing={processing}>
                            {isEdit ? "Update Customer" : "Save Customer"}
                        </CommonButton>
                    </div>
                </form>
            </SlideOver>
        </AuthenticatedLayout>
    );
}