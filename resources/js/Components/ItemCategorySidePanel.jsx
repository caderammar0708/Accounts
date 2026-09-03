import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import SlideOver from './SlideOver';
import CommonInput from './CommonInput';
import CommonButton from './CommonButton';
import SearchableSelect from './SearchableSelect';

export default function ItemCategorySidePanel({
    isOpen,
    onClose,
    category = null,
    parents = [],
    locations = [],
    onSuccess = null
}) {
    const isEdit = !!category;
    const { auth } = usePage().props;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        parent_id: '',
        location_id: null,
    });

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setData({
                    name: category.name || '',
                    parent_id: category.parent_id || '',
                    location_id: category.location_id || null,
                });
            } else {
                reset();
                clearErrors();
            }
        }
    }, [isOpen, category]);

    const submit = (e) => {
        e.preventDefault();
        const options = {
            onSuccess: (page) => {
                handleClose();
                if (onSuccess) onSuccess(page);
            },
        };

        if (isEdit) {
            patch(route('item-categories.update', category.id), options);
        } else {
            post(route('item-categories.store'), options);
        }
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Edit Category" : "New Category"}
        >
            <form onSubmit={submit} className="space-y-6">
                <CommonInput
                    label="Category Name"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    error={errors.name}
                    required
                />

                {Boolean(auth?.location) && (
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Location</label>
                        <SearchableSelect
                            options={[
                                { value: null, label: 'Common (All Locations)' },
                                ...locations.map(l => ({ value: l.id, label: l.name }))
                            ]}
                            value={data.location_id}
                            onChange={val => setData('location_id', val)}
                            placeholder="Select Location"
                        />
                        {errors.location_id && <p className="text-xs text-red-500 mt-1">{errors.location_id}</p>}
                    </div>
                )}

                <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
                    <CommonButton variant="ghost" onClick={handleClose} type="button">Cancel</CommonButton>
                    <CommonButton variant="primary" type="submit" processing={processing}>
                        {isEdit ? "Update Category" : "Save Category"}
                    </CommonButton>
                </div>
            </form>
        </SlideOver>
    );
}
