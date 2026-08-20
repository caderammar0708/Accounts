import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head, Link } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Create({ roles = [] }) {
    const roleOptions = roles.map(r => ({
        value: r.name,
        label: r.name,
    }));

    const defaultRole = roles.find(r => r.name === 'Staff')?.name || roles[0]?.name || 'Admin';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role: defaultRole,
        phone: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('users.store'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Create System User" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="px-10 pt-10 pb-6 border-b border-slate-100 bg-slate-50/30 text-center">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-4">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Create User</h1>
                        </div>

                        <form onSubmit={submit} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="col-span-2">
                                    <CommonInput
                                        label="Full Name"
                                        placeholder="Enter full name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <CommonInput
                                        type="email"
                                        label="Email Address"
                                        placeholder="email@example.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Assigned Role <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={roleOptions}
                                        value={data.role}
                                        onChange={(val) => setData('role', val)}
                                        placeholder="Select user role..."
                                        error={errors.role}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <CommonInput
                                        label="Phone Number (Optional)"
                                        placeholder="+94 7X XXX XXXX"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        error={errors.phone}
                                    />
                                </div>
                            </div>

                            <div className="text-sm text-slate-500 leading-relaxed">
                                When you create this account, the user will receive an invitation email with a secure password setup link and permissions matching their assigned role.
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <Link href={route('users.index')}>
                                    <button type="button" className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                        Cancel
                                    </button>
                                </Link>
                                <CommonButton
                                    type="submit"
                                    variant="primary"
                                    className="px-10 bg-slate-900 hover:bg-slate-800"
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Create User Account'}
                                </CommonButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
