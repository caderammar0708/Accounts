import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, usePage, Head } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Create({ managers }) {
    const { auth } = usePage().props;
    const managerOptions = managers.map(m => ({ value: m.id, label: m.name }));

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
        hire_date: '',
        manager_id: '',
        is_active: true,
    });

    function submit(e) {
        e.preventDefault();
        let payload = {
            ...data,
            manager_id: auth.user.role === 'manager' ? auth.user.id : data.manager_id,
        };
        post(route('team.store'), payload);
    }

    return (
        <AuthenticatedLayout>
            <Head title="Add Team Member" />
            
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="px-10 pt-10 pb-6 border-b border-slate-100 bg-slate-50/30 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Add Team Member</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Register a new staff member and configure their access.</p>
                        </div>

                        <form onSubmit={submit} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="col-span-2">
                                    <CommonInput
                                        label="Full Name"
                                        placeholder="John Doe"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <CommonInput
                                        type="email"
                                        label="Email Address"
                                        placeholder="john@example.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                    />
                                </div>

                                <CommonInput
                                    type="password"
                                    label="Password"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />

                                <CommonInput
                                    type="password"
                                    label="Confirm Password"
                                    placeholder="••••••••"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                />

                                <CommonInput
                                    type="date"
                                    label="Hire Date"
                                    value={data.hire_date}
                                    onChange={(e) => setData('hire_date', e.target.value)}
                                    error={errors.hire_date}
                                />

                                {auth.user.role === 'admin' && (
                                    <SearchableSelect
                                        label="Assign Manager"
                                        placeholder="Select a manager"
                                        value={data.manager_id}
                                        onChange={(val) => setData('manager_id', val)}
                                        options={managerOptions}
                                        error={errors.manager_id}
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-3 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-5 w-5 text-primary border-slate-300 rounded-lg focus:ring-primary/20 transition-all cursor-pointer"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Enable Account Access
                                </label>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <Link href={route('team.index')}>
                                    <button type="button" className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                        Back to Team
                                    </button>
                                </Link>
                                <CommonButton
                                    type="submit"
                                    variant="primary"
                                    className="px-10"
                                    disabled={processing}
                                >
                                    {processing ? 'Creating...' : 'Create Member'}
                                </CommonButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
