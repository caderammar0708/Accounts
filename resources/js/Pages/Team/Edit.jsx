import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head, Link } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Edit({ user, managers }) {
    const managerOptions = managers.map(m => ({ value: m.id, label: m.name }));

    const { data, setData, patch, processing, errors } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        role: user.role ?? 'staff',
        hire_date: user.hire_date ?? '',
        manager_id: user.manager_id ?? '',
        is_active: user.is_active ?? true,
    });

    function submit(e) {
        e.preventDefault();
        patch(route('team.update', user.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${user.name}`} />
            
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="px-10 pt-10 pb-6 border-b border-slate-100 bg-slate-50/30 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4 font-black text-2xl">
                                {user.name.charAt(0)}
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Edit Team Member</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Update profile details and access permissions for {user.name}.</p>
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

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">System Role</label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="manager">Manager</option>
                                        <option value="staff">Staff Member</option>
                                    </select>
                                    {errors.role && <p className="text-red-500 text-[10px] mt-1 font-bold italic ml-1">{errors.role}</p>}
                                </div>

                                <CommonInput
                                    type="date"
                                    label="Hire Date"
                                    value={data.hire_date}
                                    onChange={(e) => setData('hire_date', e.target.value)}
                                    error={errors.hire_date}
                                />

                                <div className="col-span-2">
                                    <SearchableSelect
                                        label="Reports To (Manager)"
                                        placeholder="Select a manager"
                                        value={data.manager_id}
                                        onChange={(val) => setData('manager_id', val)}
                                        options={managerOptions}
                                        error={errors.manager_id}
                                    />
                                </div>
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
                                    Account Access Enabled
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
                                    {processing ? 'Updating...' : 'Save Changes'}
                                </CommonButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
