import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function Index({ users }) {
    return (
        <AuthenticatedLayout>
            <Head title="Team Management" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Management</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your organization's staff, roles and access permissions.</p>
                    </div>
                    <Link href={route('team.create')}>
                        <CommonButton variant="primary">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Team Member
                        </CommonButton>
                    </Link>
                </div>

                {/* Team Table */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hire Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reports To</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">No team members found</p>
                                            <p className="text-xs text-slate-400 mt-1">Start by adding your first staff member.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 leading-tight">{user.name}</div>
                                                    <div className="text-xs font-medium text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Inactive</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono uppercase">
                                            {user.hire_date || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.manager ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-600">
                                                        {user.manager.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{user.manager.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-300 italic">Direct Report</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={route('team.edit', user.id)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('team.destroy', user.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
