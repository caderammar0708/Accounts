import { useForm, Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ auth, vehicle, customers }) {
    const isEdit = !!vehicle;

    const { data, setData, post, put, processing, errors } = useForm({
        vehicle_no: vehicle?.vehicle_no || '',
        customer_id: vehicle?.customer_id || '',
        vehicle_type: vehicle?.vehicle_type || '',
        brand: vehicle?.brand || '',
        model: vehicle?.model || '',
        fuel_type: vehicle?.fuel_type || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('vehicles.update', vehicle.id));
        } else {
            post(route('vehicles.store'));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={isEdit ? "Edit Vehicle" : "Register Vehicle"}>
            <Head title={isEdit ? "Edit Vehicle" : "Register Vehicle"} />

            <div className="py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SearchableSelect
                                    label="Customer (Owner)"
                                    value={data.customer_id}
                                    onChange={val => setData('customer_id', val)}
                                    required
                                    error={errors.customer_id}
                                    options={[
                                        { value: '', label: 'Select Customer' },
                                        ...(customers || []).map(c => ({ value: c.id, label: c.display_name }))
                                    ]}
                                />
                                <CommonInput
                                    label="Vehicle No."
                                    value={data.vehicle_no}
                                    onChange={e => setData('vehicle_no', e.target.value)}
                                    required
                                    error={errors.vehicle_no}
                                    placeholder="e.g. ABC-1234"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CommonInput
                                    type="select"
                                    label="Vehicle Type"
                                    value={data.vehicle_type}
                                    onChange={e => setData('vehicle_type', e.target.value)}
                                    required
                                    error={errors.vehicle_type}
                                    options={[
                                        { value: '', label: 'Select Type' },
                                        { value: 'Car', label: 'Car' },
                                        { value: 'Bike', label: 'Bike' },
                                        { value: 'Van', label: 'Van' },
                                        { value: 'Truck', label: 'Truck' },
                                    ]}
                                />
                                <CommonInput
                                    type="select"
                                    label="Fuel Type"
                                    value={data.fuel_type}
                                    onChange={e => setData('fuel_type', e.target.value)}
                                    required
                                    error={errors.fuel_type}
                                    options={[
                                        { value: '', label: 'Select Fuel' },
                                        { value: 'Petrol', label: 'Petrol' },
                                        { value: 'Diesel', label: 'Diesel' },
                                        { value: 'Electric', label: 'Electric' },
                                        { value: 'Hybrid', label: 'Hybrid' },
                                    ]}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CommonInput
                                    label="Brand"
                                    value={data.brand}
                                    onChange={e => setData('brand', e.target.value)}
                                    required
                                    error={errors.brand}
                                />
                                <CommonInput
                                    label="Model"
                                    value={data.model}
                                    onChange={e => setData('model', e.target.value)}
                                    required
                                    error={errors.model}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <Link href={route('vehicles.index')}>
                                <CommonButton variant="ghost" type="button">Cancel</CommonButton>
                            </Link>
                            <CommonButton variant="primary" type="submit" processing={processing}>
                                {isEdit ? 'Update' : 'Save'} Vehicle
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}