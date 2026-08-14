import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import Modal from '@/Components/Modal';

export default function LocationsIndex({ locations = [], users = [] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Form for Create / Edit Location
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        is_active: true,
    });

    // Form for Assign User
    const assignForm = useForm({
        user_id: '',
    });

    const handleOpenCreate = () => {
        reset();
        clearErrors();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (location) => {
        setSelectedLocation(location);
        setData({
            name: location.name || '',
            code: location.code || '',
            is_active: Boolean(location.is_active),
        });
        clearErrors();
        setIsEditOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route('locations.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        put(route('locations.update', selectedLocation.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedLocation(null);
                reset();
            },
        });
    };

    const handleDelete = (location) => {
        if (confirm(`Are you sure you want to remove the branch "${location.name}"? Any assigned employees will become unrestricted.`)) {
            router.delete(route('locations.destroy', location.id));
        }
    };

    const handleOpenAssign = (location) => {
        setSelectedLocation(location);
        assignForm.reset();
        assignForm.clearErrors();
        setIsAssignOpen(true);
    };

    const handleAssignSubmit = (e) => {
        e.preventDefault();
        assignForm.post(route('locations.assign-user', selectedLocation.id), {
            onSuccess: () => {
                setIsAssignOpen(false);
                setSelectedLocation(null);
                assignForm.reset();
            },
        });
    };

    const handleUnassignUser = (userId, userName) => {
        if (confirm(`Are you sure you want to unassign ${userName} from their branch lock? They will become an unrestricted user.`)) {
            router.post(route('locations.unassign-user'), { user_id: userId });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-bold text-lg text-slate-800 tracking-tight">Manage Branches & Locations</h2>
                    <p className="text-xs text-slate-500">Configure company branches and assign employee access locks.</p>
                </div>
            }
        >
            <Head title="Manage Branches" />

            <div className="p-6">
                <div className="flex justify-end mb-4">
                    <CommonButton onClick={handleOpenCreate} variant="primary">
                        + Add New Branch
                    </CommonButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((loc) => (
                        <div key={loc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-lg bg-emerald-50 text-[#00713D] flex items-center justify-center font-bold">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base">{loc.name}</h3>
                                            {loc.code && <span className="text-2xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{loc.code}</span>}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${loc.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {loc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Assigned Employees</span>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAssign(loc)}
                                            className="text-xs font-semibold text-[#00713D] hover:underline flex items-center gap-1"
                                        >
                                            + Assign Employee
                                        </button>
                                    </div>

                                    {loc.users && loc.users.length > 0 ? (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {loc.users.map((usr) => (
                                                <div key={usr.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                                    <div>
                                                        <span className="font-semibold text-slate-700">{usr.name}</span>
                                                        <span className="text-2xs text-slate-400 block">{usr.email}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnassignUser(usr.id, usr.name)}
                                                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                                                        title="Unassign / Remove Lock"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center border border-dashed border-slate-200">
                                            No employees locked to this branch yet.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    onClick={() => handleOpenEdit(loc)}
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Edit Details
                                </button>
                                <button
                                    onClick={() => handleDelete(loc)}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                                >
                                    Remove Branch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {locations.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00713D] flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No Branches Configured</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Create your first branch/location to enable multi-branch scoping across sales, purchases, and inventory.</p>
                        <div className="mt-4">
                            <CommonButton onClick={handleOpenCreate} variant="primary">
                                + Create First Branch
                            </CommonButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Branch Modal */}
            <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="md">
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Add New Branch / Location</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name <span className="text-red-500">*</span></label>
                            <CommonInput
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Main Showroom, Colombo Branch"
                                error={errors.name}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Short Code</label>
                            <CommonInput
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. CMB-01, KDY"
                                error={errors.code}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active_create"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-slate-300 text-[#00713D] focus:ring-[#00713D]"
                            />
                            <label htmlFor="is_active_create" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                Branch is active
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <CommonButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </CommonButton>
                        <CommonButton type="submit" variant="primary" disabled={processing}>
                            Save Branch
                        </CommonButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Branch Modal */}
            <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="md">
                <form onSubmit={handleEditSubmit} className="p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Edit Branch Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name <span className="text-red-500">*</span></label>
                            <CommonInput
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Main Showroom"
                                error={errors.name}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Short Code</label>
                            <CommonInput
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. CMB-01"
                                error={errors.code}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active_edit"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-slate-300 text-[#00713D] focus:ring-[#00713D]"
                            />
                            <label htmlFor="is_active_edit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                Branch is active
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <CommonButton type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </CommonButton>
                        <CommonButton type="submit" variant="primary" disabled={processing}>
                            Update Branch
                        </CommonButton>
                    </div>
                </form>
            </Modal>

            {/* Assign Employee Modal */}
            <Modal show={isAssignOpen} onClose={() => setIsAssignOpen(false)} maxWidth="md">
                <form onSubmit={handleAssignSubmit} className="p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-1">Assign Employee to Branch</h3>
                    <p className="text-xs text-slate-500 mb-4">Lock an employee to {selectedLocation?.name}. They will be restricted to this branch only upon login.</p>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee / User <span className="text-red-500">*</span></label>
                        <select
                            value={assignForm.data.user_id}
                            onChange={(e) => assignForm.setData('user_id', e.target.value)}
                            className="w-full text-xs rounded-lg border-slate-300 focus:border-[#00713D] focus:ring-[#00713D]"
                        >
                            <option value="">-- Choose User --</option>
                            {users.map((usr) => (
                                <option key={usr.id} value={usr.id}>
                                    {usr.name} ({usr.email}) {usr.location_id ? (usr.location_id === selectedLocation?.id ? '[Currently Assigned Here]' : '[Assigned to Another Branch]') : '[Unrestricted]'}
                                </option>
                            ))}
                        </select>
                        {assignForm.errors.user_id && <p className="text-2xs text-red-500 mt-1">{assignForm.errors.user_id}</p>}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <CommonButton type="button" variant="secondary" onClick={() => setIsAssignOpen(false)}>
                            Cancel
                        </CommonButton>
                        <CommonButton type="submit" variant="primary" disabled={assignForm.processing}>
                            Lock Employee to Branch
                        </CommonButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
