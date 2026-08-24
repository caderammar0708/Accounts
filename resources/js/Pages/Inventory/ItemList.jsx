import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useMemo, Fragment } from 'react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import InventoryItemSidePanel from '@/Components/InventoryItemSidePanel';
import PrintBarcodeModal from './Partials/PrintBarcodeModal';

export default function ItemList({ items, filters, counts }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || '';
    const { delete: destroy } = useForm();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [printModalItem, setPrintModalItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || 'all');
    const [stockFilter, setStockFilter] = useState(filters?.stock_status || '');

    const handleSearch = () => {
        router.get(route('items.index'), {
            search: searchTerm,
            type: typeFilter,
            stock_status: stockFilter
        }, { preserveState: true, preserveScroll: true });
    };

    const handleFilterChange = (key, value) => {
        let newStock = stockFilter;
        let newType = typeFilter;

        if (key === 'stock_status') newStock = newStock === value ? '' : value; // toggle
        if (key === 'type') newType = value;

        if (key === 'stock_status') setStockFilter(newStock);
        if (key === 'type') setTypeFilter(newType);

        router.get(route('items.index'), {
            search: searchTerm,
            type: newType,
            stock_status: newStock
        }, { preserveState: true, preserveScroll: true });
    };

    const handleOpenCreate = () => {
        setSelectedItem(null);
        setIsPanelOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsPanelOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            destroy(route('items.destroy', { item: id, redirect_to: window.location.href }));
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'service': return 'bg-primary-100 text-primary-700';
            case 'inventory': return 'bg-green-100 text-green-700';
            case 'non-inventory': return 'bg-orange-100 text-orange-700';
            case 'bundle': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handlePrintBarcode = (item, count) => {
        window.open(route('items.print-barcode', { item: item.id, count }), '_blank');
    };

    // Group items by category (they are already sorted by category in the backend)
    const groupedItems = (() => {
        const groups = {};
        if (items && items.data) {
            items.data.forEach(item => {
                const cat = item?.category?.name || 'Uncategorized';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
            });
        }
        return groups;
    })();

    return (
        <AuthenticatedLayout header="Products & Services">
            <Head title="Products & Services" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Items</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage your products, services, and price rates.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('item-categories.index')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest"
                        >
                            Categories
                        </Link>
                        <CommonButton variant="primary" onClick={handleOpenCreate} className="px-3 py-1.5 text-xs">
                            <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Add New
                        </CommonButton>
                    </div>
                </div>

                {/* Top Cards for Inventory Status */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                        onClick={() => handleFilterChange('stock_status', 'low')}
                        className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${stockFilter === 'low' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/30' : 'border-slate-200 hover:border-orange-300'}`}
                    >
                        <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{counts?.low_stock || 0}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Low Stock</span>
                    </div>

                    <div
                        onClick={() => handleFilterChange('stock_status', 'out')}
                        className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${stockFilter === 'out' ? 'border-red-500 ring-1 ring-red-500 bg-red-50/30' : 'border-slate-200 hover:border-red-300'}`}
                    >
                        <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{counts?.out_of_stock || 0}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Out of Stock</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-3 rounded-t-xl border-x border-t border-slate-200 flex items-center gap-3">
                    <div className="w-64">
                        <CommonInput
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            size="sm"
                        />
                    </div>
                    <div className="w-40 pb-[1px]">
                        <CommonInput
                            type="select"
                            value={typeFilter}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            size="sm"
                        >
                            <option value="all">All Types</option>
                            <option value="inventory">Inventory</option>
                            <option value="service">Service</option>
                        </CommonInput>
                    </div>
                    <CommonButton onClick={handleSearch} variant="primary" className="!bg-slate-900 hover:!bg-slate-800 mt-1">Filter</CommonButton>
                    {(stockFilter || typeFilter !== 'all' || searchTerm) && (
                        <CommonButton onClick={() => { setStockFilter(''); setTypeFilter('all'); setSearchTerm(''); router.get(route('items.index')); }} variant="ghost" className="mt-1">Clear</CommonButton>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-10">Img</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Item Info</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-1/6">Type</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-1/6">SKU</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Sales Price</th>
                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(groupedItems).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-xs">
                                            No items found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    Object.keys(groupedItems).map(category => (
                                        <Fragment key={category}>
                                            {/* Category Header Row */}
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="7" className="px-4 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 bg-slate-100/50">
                                                    {category}
                                                </td>
                                            </tr>
                                            {groupedItems[category].map(item => (
                                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-2">
                                                        <div className="h-8 w-8 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-200 rounded-md">
                                                            {item.image ? (
                                                                <img src={item.image} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 line-clamp-1">{item.description || 'No description'}</div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getTypeColor(item.type)}`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">{item.sku || '-'}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {item.track_inventory ? (
                                                            <span className={`font-bold tabular-nums ${item.quantity_on_hand <= 0 ? 'text-red-600' : (item.quantity_on_hand <= item.reorder_point ? 'text-orange-600' : 'text-slate-900')}`}>
                                                                {parseFloat(item.quantity_on_hand).toLocaleString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold text-slate-900 tabular-nums">
                                                        {currencyPrefix ? `${currencyPrefix} ` : ''}{parseFloat(item.sale_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setPrintModalItem(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary-50 rounded transition-all" title="Print Barcode">
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                            </button>
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all" title="Edit">
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete">
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Links */}
                    {items && items.links && items.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-center gap-1">
                            {items.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-xs border rounded-md transition-colors ${link.active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState preserveScroll
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <InventoryItemSidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                item={selectedItem}
            />

            <PrintBarcodeModal
                isOpen={!!printModalItem}
                onClose={() => setPrintModalItem(null)}
                onConfirm={handlePrintBarcode}
                item={printModalItem}
            />
        </AuthenticatedLayout>
    );
}
