import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function RoleEdit({ role = {}, groupedPermissions = {} }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name || '',
        permissions: role.permissions || [],
    });

    const allPermissionNames = Object.values(groupedPermissions).flatMap(group => group.map(p => p.name));

    const handleTogglePermission = (permName) => {
        if (data.permissions.includes(permName)) {
            setData('permissions', data.permissions.filter(p => p !== permName));
        } else {
            setData('permissions', [...data.permissions, permName]);
        }
    };

    const handleToggleGroup = (groupPerms) => {
        const groupNames = groupPerms.map(p => p.name);
        const allGroupSelected = groupNames.every(name => data.permissions.includes(name));

        if (allGroupSelected) {
            setData('permissions', data.permissions.filter(p => !groupNames.includes(p)));
        } else {
            const toAdd = groupNames.filter(name => !data.permissions.includes(name));
            setData('permissions', [...data.permissions, ...toAdd]);
        }
    };

    const handleSelectAll = () => {
        if (data.permissions.length === allPermissionNames.length) {
            setData('permissions', []);
        } else {
            setData('permissions', [...allPermissionNames]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AuthenticatedLayout header="Edit Role">
            <Head title={`Edit Role ${role.name} - JBooks`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('roles.index')}
                                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Edit Role: {role.name}
                                </h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Modify access permissions and role configurations</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CommonButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleSelectAll}
                        >
                            {data.permissions.length === allPermissionNames.length ? 'Deselect All' : 'Select All Permissions'}
                        </CommonButton>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role Details Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            Role Information
                        </h3>
                        <div className="max-w-md">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                disabled={role.is_admin}
                                onChange={e => setData('name', e.target.value)}
                                className={`w-full text-xs font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                                    role.is_admin ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                                }`}
                            />
                            {role.is_admin && (
                                <p className="text-2xs text-slate-400 mt-1">The primary Admin role name cannot be modified.</p>
                            )}
                            {errors.name && (
                                <p className="text-xs font-bold text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Module Permissions</h3>
                                <p className="text-xs text-slate-500">
                                    {data.permissions.length} of {allPermissionNames.length} permissions granted
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                                const groupNames = perms.map(p => p.name);
                                const isGroupAllSelected = groupNames.every(name => data.permissions.includes(name));
                                const hasSomeSelected = groupNames.some(name => data.permissions.includes(name));

                                return (
                                    <div key={moduleName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        {/* Module Card Header */}
                                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`group-${moduleName}`}
                                                    checked={isGroupAllSelected}
                                                    ref={el => {
                                                        if (el) el.indeterminate = hasSomeSelected && !isGroupAllSelected;
                                                    }}
                                                    onChange={() => handleToggleGroup(perms)}
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                                                />
                                                <label htmlFor={`group-${moduleName}`} className="text-xs font-black text-slate-800 uppercase tracking-wider cursor-pointer">
                                                    {moduleName}
                                                </label>
                                            </div>
                                            <span className="text-2xs text-slate-400 font-bold">
                                                {groupNames.filter(n => data.permissions.includes(n)).length}/{groupNames.length}
                                            </span>
                                        </div>

                                        {/* Permissions list */}
                                        <div className="p-4 space-y-2.5 flex-1">
                                            {perms.map(p => {
                                                const checked = data.permissions.includes(p.name);
                                                return (
                                                    <label
                                                        key={p.name}
                                                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                                            checked
                                                                ? 'border-primary/30 bg-primary/5 text-slate-900 shadow-xs'
                                                                : 'border-transparent hover:bg-slate-50 text-slate-600'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => handleTogglePermission(p.name)}
                                                            className="w-4 h-4 mt-0.5 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer shrink-0"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold leading-tight">{p.label}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{p.name}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <CommonButton
                            href={route('roles.index')}
                            variant="secondary"
                            size="md"
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={processing || !data.name.trim()}
                            className="bg-primary hover:bg-primary-600 text-white shadow-sm"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
