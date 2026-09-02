import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import CommonButton from '@/Components/CommonButton';
import ItemCategorySidePanel from '@/Components/ItemCategorySidePanel';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

const SortableRow = ({ cat, handleEdit, handleDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, position: 'relative' };

    return (
        <tr ref={setNodeRef} style={style} className={`group hover:bg-slate-50/50 transition-colors ${isDragging ? 'bg-white shadow-xl ring-1 ring-slate-900/5' : ''}`}>
            <td className="px-6 py-4 flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-primary-600 transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                </div>
                <div className="text-sm font-bold text-slate-900">{cat.name}</div>
            </td>

            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function CategoryList({ categories, locations }) {
    const { delete: destroy } = useForm();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [itemsList, setItemsList] = useState(categories);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    useEffect(() => {
        setItemsList(categories);
    }, [categories]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = itemsList.findIndex((item) => item.id === active.id);
            const newIndex = itemsList.findIndex((item) => item.id === over.id);
            
            const newItems = arrayMove(itemsList, oldIndex, newIndex);
            setItemsList(newItems);

            // Calculate new sort orders
            const payload = newItems.map((item, index) => ({
                id: item.id,
                sort_order: index + 1
            }));

            // Save to server
            setIsSavingOrder(true);
            axios.post(route('item-categories.reorder'), { categories: payload })
                .then(() => {
                    setIsSavingOrder(false);
                })
                .catch(error => {
                    console.error('Error saving order', error);
                    setIsSavingOrder(false);
                    // Revert on error
                    setItemsList(categories);
                });
        }
    };

    const handleOpenCreate = () => {
        setSelectedCategory(null);
        setIsPanelOpen(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setIsPanelOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this category? All sub-categories will also be deleted.')) {
            destroy(route('item-categories.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header="Item Categories"
        >
            <Head title="Item Categories" />

            <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
                        <p className="text-sm text-slate-500 mt-1">Organize your products and services into groups.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('items.index')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest"
                        >
                            Back to Items
                        </Link>
                        <CommonButton
                            variant="primary"
                            onClick={handleOpenCreate}
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Add Category
                        </CommonButton>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <tbody className={`divide-y divide-slate-50 ${isSavingOrder ? 'opacity-50' : ''}`}>
                                    <SortableContext items={itemsList.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        {itemsList.map((cat) => (
                                            <SortableRow key={cat.id} cat={cat} handleEdit={handleEdit} handleDelete={handleDelete} />
                                        ))}
                                    </SortableContext>
                                    
                                    {itemsList.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No categories found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </DndContext>
                        </table>
                    </div>
                </div>
            </div>

            <ItemCategorySidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                category={selectedCategory}
                parents={categories}
                locations={locations}
            />
        </AuthenticatedLayout>
    );
}
