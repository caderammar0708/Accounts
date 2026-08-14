import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ auth, policy, items }) {
    const isEdit = !!policy;

    const { data, setData, post, put, processing, errors } = useForm({
        name: policy?.name || '',
        applies_to: policy?.applies_to || 'service',
        duration_days: policy?.duration_days || '',
        duration_km: policy?.duration_km || '',
        expiry_rule: policy?.expiry_rule || 'whichever_first',
        terms_text: policy?.terms_text || '',
        is_active: policy?.is_active ?? true,
        applicable_item_ids: policy?.items?.map(item => item.id) || [],
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('warranty-policies.update', policy.id));
        } else {
            post(route('warranty-policies.store'));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={isEdit ? 'Edit Warranty Policy' : 'New Warranty Policy'}>
            <Head title={isEdit ? 'Edit Warranty Policy' : 'New Warranty Policy'} />

            <div className="py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CommonInput
                                    label="Policy Name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />
                                <CommonInput
                                    label="Applies To"
                                    type="select"
                                    value={data.applies_to}
                                    onChange={(e) => setData('applies_to', e.target.value)}
                                    options={[
                                        { value: 'service', label: 'Service' },
                                        { value: 'product', label: 'Product' },
                                    ]}
                                    error={errors.applies_to}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CommonInput
                                    label="Duration (days)"
                                    type="number"
                                    value={data.duration_days}
                                    onChange={(e) => setData('duration_days', e.target.value)}
                                    error={errors.duration_days}
                                />
                                <CommonInput
                                    label="Duration (km)"
                                    type="number"
                                    value={data.duration_km}
                                    onChange={(e) => setData('duration_km', e.target.value)}
                                    error={errors.duration_km}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CommonInput
                                    label="Expiry Rule"
                                    type="select"
                                    value={data.expiry_rule}
                                    onChange={(e) => setData('expiry_rule', e.target.value)}
                                    options={[
                                        { value: 'whichever_first', label: 'Whichever comes first' },
                                        { value: 'days_only', label: 'Days only' },
                                        { value: 'km_only', label: 'Kilometers only' },
                                    ]}
                                    error={errors.expiry_rule}
                                />
                                <CommonInput
                                    label="Status"
                                    type="select"
                                    value={data.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setData('is_active', e.target.value === 'active')}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                    ]}
                                />
                            </div>

                            <CommonInput
                                label="Warranty Terms"
                                type="textarea"
                                value={data.terms_text}
                                onChange={(e) => setData('terms_text', e.target.value)}
                                error={errors.terms_text}
                                className="min-h-[120px]"
                            />

                            <div>
                                <SearchableSelect
                                    label="Applicable Items"
                                    placeholder="Search items"
                                    options={items
                                        .filter(item => {
                                            if (data.applies_to === 'service') {
                                                return item.type === 'service';
                                            }
                                            return ['inventory', 'bundle', 'non-inventory'].includes(item.type);
                                        })
                                        .map(item => ({
                                            value: item.id,
                                            label: `${item.name} ${item.type ? `(${item.type})` : ''}`.trim(),
                                            type: item.type,
                                        }))}
                                    value={data.applicable_item_ids}
                                    multiple={true}
                                    onChange={(value) => setData('applicable_item_ids', value)}
                                    error={errors.applicable_item_ids}
                                    size="md"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Select the specific items or services this policy should apply to.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Link href={route('warranty-policies.index')}>
                                <CommonButton variant="ghost" type="button">Cancel</CommonButton>
                            </Link>
                            <CommonButton variant="primary" type="submit" processing={processing}>
                                {isEdit ? 'Update' : 'Save'} Policy
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
