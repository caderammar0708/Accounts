import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import Modal from '@/Components/Modal';

export default function RoleIndex({ roles = [] }) {
    const { flash = {} } = usePage().props;
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        if (!roleToDelete) return;
        setDeleting(true);
        router.delete(route('roles.destroy', roleToDelete.id), {
            onFinish: () => {
                setDeleting(false);
                setRoleToDelete(null);
            },
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout header="Role & Permission Management">
            <Head title="Roles & Permissions - JBooks" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header Banner */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-400 flex items-center justify-center shadow-md shadow-green-900/10 text-white">
                                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage user access privileges, roles, and granular feature permissions</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CommonButton
                            href={route('roles.create')}
                            variant="primary"
                            size="md"
                            className="bg-primary hover:bg-primary-600 text-white flex items-center gap-2 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Create Role
                        </CommonButton>
                    </div>
                </div>

                {/* Feedback Alerts */}
                {flash.success && (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                        <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                        <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Roles Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/75">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-2xs font-black text-slate-500 uppercase tracking-wider">
                                        Role Name
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-2xs font-black text-slate-500 uppercase tracking-wider">
                                        Assigned Users
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-2xs font-black text-slate-500 uppercase tracking-wider">
                                        Permissions Granted
                                    </th>
                                    <th className="px-6 py-3.5 text-right text-2xs font-black text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                    role.is_admin
                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {role.is_admin ? 'shield_person' : 'verified_user'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 text-sm">{role.name}</span>
                                                    {role.is_admin && (
                                                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                                                            Primary Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                    {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {role.permissions_count} permissions
                                                </span>
                                                {role.is_admin ? (
                                                    <span className="text-2xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                        Full System Access
                                                    </span>
                                                ) : (
                                                    <span className="text-2xs text-slate-500">
                                                        (Custom privileges)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                                            <Link
                                                href={route('roles.edit', role.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                                Edit
                                            </Link>
                                            {!role.is_admin && (
                                                <button
                                                    onClick={() => setRoleToDelete(role)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">delete</span>
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {roles.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No roles found. Click "Create Role" to add one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={roleToDelete !== null} onClose={() => setRoleToDelete(null)} maxWidth="md">
                {roleToDelete && (
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 text-center mb-2">
                            Delete Role "{roleToDelete.name}"?
                        </h3>
                        {roleToDelete.users_count > 0 ? (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-6">
                                <p className="font-bold">Cannot delete this role yet:</p>
                                <p className="mt-1">
                                    There are currently <strong>{roleToDelete.users_count} user(s)</strong> assigned to this role. Please reassign those users to another role in User Management before deleting.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center mb-6">
                                Are you sure you want to permanently delete this role? Any permissions assigned to this role will be removed.
                            </p>
                        )}
                        <div className="flex items-center justify-end gap-3">
                            <CommonButton
                                variant="secondary"
                                size="sm"
                                onClick={() => setRoleToDelete(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </CommonButton>
                            {roleToDelete.users_count === 0 && (
                                <CommonButton
                                    variant="primary"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete Role'}
                                </CommonButton>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
