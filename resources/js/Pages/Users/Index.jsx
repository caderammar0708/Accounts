import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function Index({ users = [] }) {
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.assigned_role && u.assigned_role.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg text-slate-800 tracking-tight">System Users</h2>
                    <div className="flex items-center gap-2">
                        <Link href={route('roles.index')}>
                            <CommonButton variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs">
                                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                Roles & Permissions
                            </CommonButton>
                        </Link>
                        <Link href={route('users.create')}>
                            <CommonButton variant="primary" size="sm" className="bg-[#00713D] hover:bg-[#005a30] text-white flex items-center gap-1 text-xs">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add New User
                            </CommonButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="System Users - JBooks" />

            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Find a user by name, email, or role..."
                                className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-full focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-1/3">User Profile</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned Role</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Invitation</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phone</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => {
                                    const roleDisplay = user.assigned_role || user.role || 'Staff';
                                    const isAdmin = roleDisplay.toLowerCase() === 'admin';

                                    return (
                                        <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs shrink-0">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-tight">{user.name}</div>
                                                        <div className="text-[10px] text-slate-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    isAdmin ? 'bg-[#00713D]/10 text-[#00713D] border border-[#00713D]/20' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}>
                                                    {roleDisplay}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {user.is_active ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Authorized</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Revoked</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {user.is_invited ? (
                                                    new Date(user.invite_expires_at) < new Date() ? (
                                                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider">Expired</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-wider">Pending</span>
                                                    )
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Completed</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                                                {user.phone || '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-2">
                                                {user.is_invited && (
                                                    <Link
                                                        href={route('users.resend-invite', user.id)}
                                                        method="post"
                                                        as="button"
                                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700"
                                                    >
                                                        Resend Invite
                                                    </Link>
                                                )}
                                                <Link
                                                    href={route('users.edit', user.id)}
                                                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this user?')) {
                                                            router.delete(route('users.destroy', user.id));
                                                        }
                                                    }}
                                                    className="text-[11px] font-bold text-red-500 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                                            No users match your filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
