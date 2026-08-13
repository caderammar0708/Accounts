import { useRef, useState } from "react";
import SearchableSelect from "@/Components/SearchableSelect";
import CommonInput from "@/Components/CommonInput";
import CommonButton from "@/Components/CommonButton";

export default function LineItemsTable({
    columns,
    items,
    handleItemChange,
    addRow,
    removeRow,
    duplicateRow,
    moveRow,
    clearRows,
    totals,
    currencyPrefix = "$",
    onCurrencyBlur = null,
    hideActions = false,
    discountValue = "0",
    discountType = "percent",
    onDiscountChange = null,
    subtotal = null,
    hideSummaryBlock = false,
}) {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const inputRefs = useRef({});

    const onDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        moveRow?.(draggedIndex, index > draggedIndex ? 'down' : 'up');
        setDraggedIndex(index);
    };

    const onDragEnd = () => {
        setDraggedIndex(null);
    };

    // Helper to format currency as user types
    const formatCurrency = (value) => {
        if (!value && value !== 0) return "";
        // Remove non-numeric characters except for decimal point
        const cleanValue = String(value).replace(/[^\d.]/g, "");
        const parts = cleanValue.split(".");
        // Format integer part with commas
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const evaluateMathExpression = (expr) => {
        try {
            const cleanExpr = String(expr).replace(/,/g, '').replace(/[^0-9+\-*/.]/g, '');
            if (!cleanExpr) return 0;
            // eslint-disable-next-line no-new-func
            const result = new Function(`return ${cleanExpr}`)();
            return isNaN(result) || !isFinite(result) ? 0 : result;
        } catch {
            return parseFloat(String(expr).replace(/,/g, '')) || 0;
        }
    };

    const handleCurrencyChange = (index, key, rawValue) => {
        // Strip commas and store raw typed value (allows free typing without appending)
        const stripped = String(rawValue).replace(/,/g, "");
        handleItemChange(index, key, stripped);
    };

    const handleCurrencyFocus = (e) => {
        e.target.select();
    };

    const handleDescriptionFocus = (e) => {
        e.target.select();
    };

    const getVisibleColumns = () => columns.filter((col) => col.tabIndex !== -1);

    const handleFieldKeyDown = (e, index, colKey) => {
        const visibleColumns = getVisibleColumns();
        const currentColumnIndex = visibleColumns.findIndex((column) => column.key === colKey);

        // ── Shift+Tab: jump backward to previous row's last column ──────────
        if (e.key === 'Tab' && e.shiftKey) {
            // Only intercept when on the first column of a non-first row
            if (currentColumnIndex === 0 && index > 0) {
                e.preventDefault();
                e.stopPropagation();
                const lastCol = visibleColumns[visibleColumns.length - 1];
                const prevField = inputRefs.current[`${index - 1}-${lastCol.key}`];
                if (prevField) {
                    prevField.focus?.();
                    // If it's a SearchableSelect, open it so the user can see the value
                    if (typeof prevField.open === 'function') {
                        setTimeout(() => prevField.open(), 0);
                    }
                }
            }
            return; // let browser handle all other Shift+Tab cases
        }

        if (e.key !== 'Tab') return;

        // ── Tab forward ──────────────────────────────────────────────────────
        const nextColumn = visibleColumns[currentColumnIndex + 1];

        if (nextColumn) {
            // Moving to another column in the same row — let the browser Tab
            // naturally land on the next SearchableSelect container, then open it.
            const nextField = inputRefs.current[`${index}-${nextColumn.key}`];
            if (nextField?.open) {
                setTimeout(() => nextField.open?.(), 0);
            }
            return;
        }

        // Last column of this row — must move to next row's first column.
        // We MUST prevent default here so the browser doesn't land on action buttons.
        e.preventDefault();
        e.stopPropagation();

        if (index !== items.length - 1) {
            // Jump to first column of the next existing row
            const nextRowField = inputRefs.current[`${index + 1}-${visibleColumns[0].key}`];
            if (nextRowField) {
                nextRowField.focus?.();
                if (typeof nextRowField.open === 'function') {
                    setTimeout(() => nextRowField.open(), 0);
                }
            }
            return;
        }

        // On the very last row — add a new row then focus its first column
        addRow?.();

        requestAnimationFrame(() => {
            const nextIndex = items.length;
            const field = inputRefs.current[`${nextIndex}-${visibleColumns[0].key}`];
            if (field) {
                field.focus?.();
                if (typeof field.open === 'function') {
                    setTimeout(() => field.open(), 0);
                }
            }
        });
    };
    const handleCurrencyBlur = (index, key, rawValue) => {
        const num = evaluateMathExpression(rawValue);
        const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const updateFn = onCurrencyBlur || handleItemChange;
        updateFn(index, key, formatted);

        if (key === 'amount') {
            const item = items[index];
            const rate = parseFloat(String(item.rate || 0).replace(/,/g, '')) || 0;
            if (rate > 0) {
                const newQty = num / rate;
                updateFn(index, 'qty', String(newQty));
            }
        }
    };

    return (
        <div className="mt-6 bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="w-8 px-1 py-1.5 border-r border-slate-200"></th>
                            <th className="w-8 px-1 py-1.5 border-r border-slate-200 text-center text-xs font-black text-slate-500 uppercase tracking-tight">#</th>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width }}
                                    className={`px-2 py-1.5 text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 last:border-r-0 ${col.className || ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="w-20 px-1 py-1.5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, index) => (
                            <tr
                                key={item.id ?? index}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDragEnd={onDragEnd}
                                className={`group hover:bg-slate-50/50 transition-all ${draggedIndex === index ? 'opacity-40 bg-primary-50' : ''}`}
                            >
                                {/* Drag Handle */}
                                <td className="px-0.5 py-0.5 align-middle w-8 border-r border-slate-100">
                                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 transition-colors">
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zM7 9a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zm-6 7a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4zm3 0a2 2 0 100 4 2 2 0 000-4z" />
                                            </svg>
                                        </div>
                                    </div>
                                </td>

                                {/* Row Number */}
                                <td className="px-1 py-0.5 align-middle w-8 border-r border-slate-100 text-center text-xs text-slate-400 font-bold">
                                    {index + 1}
                                </td>

                                {/* Dynamic Columns */}
                                {columns.map((col) => (
                                    <td key={col.key} className="px-0 py-0 border-r border-slate-100 last:border-r-0 align-middle h-8">
                                        <div className="w-full h-full">
                                            {col.options ? (
                                                <SearchableSelect
                                                    ref={(node) => {
                                                        inputRefs.current[`${index}-${col.key}`] = node;
                                                    }}
                                                    value={item[col.key] || ""}
                                                    onChange={(val) => handleItemChange(index, col.key, val)}
                                                    options={col.options}
                                                    placeholder={col.placeholder}
                                                    variant="table"
                                                    size="sm"
                                                    onAddNew={col.onAddNew ? () => col.onAddNew(index) : null}
                                                    onSearch={col.onSearch}
                                                    hideChevron={col.hideChevron}
                                                    tabIndex={col.tabIndex ?? 0}
                                                    noAutoSelectOnTab={col.noAutoSelectOnTab ?? false}
                                                    onKeyDown={(e) => handleFieldKeyDown(e, index, col.key)}
                                                    onTabSelect={() => {
                                                        // After Tab-select, navigate to the next field.
                                                        // Priority 1: next column in the same row.
                                                        const visibleColumns = getVisibleColumns();
                                                        const currentColIdx = visibleColumns.findIndex(c => c.key === col.key);
                                                        const nextCol = visibleColumns[currentColIdx + 1];

                                                        if (nextCol) {
                                                            // Delay to let React re-render after selection state update
                                                            requestAnimationFrame(() => {
                                                                setTimeout(() => {
                                                                    const nextRef = inputRefs.current[`${index}-${nextCol.key}`];
                                                                    if (nextRef) {
                                                                        nextRef.focus?.();
                                                                        if (typeof nextRef.open === 'function') {
                                                                            nextRef.open();
                                                                        }
                                                                    }
                                                                }, 50);
                                                            });
                                                            return;
                                                        }

                                                        // Priority 2: last column — move to next row's first column.
                                                        requestAnimationFrame(() => {
                                                            setTimeout(() => {
                                                                if (index < items.length - 1) {
                                                                    // Jump to the next existing row
                                                                    const nextRef = inputRefs.current[`${index + 1}-${visibleColumns[0].key}`];
                                                                    if (nextRef) {
                                                                        nextRef.focus?.();
                                                                        if (typeof nextRef.open === 'function') {
                                                                            nextRef.open();
                                                                        }
                                                                    }
                                                                } else {
                                                                    // Last row — add a new row then focus it
                                                                    addRow?.();
                                                                    requestAnimationFrame(() => {
                                                                        const newIdx = items.length;
                                                                        const newRef = inputRefs.current[`${newIdx}-${visibleColumns[0].key}`];
                                                                        if (newRef) {
                                                                            newRef.focus?.();
                                                                            if (typeof newRef.open === 'function') {
                                                                                setTimeout(() => newRef.open(), 0);
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            }, 50);
                                                        });
                                                    }}
                                                />
                                            ) : col.type === 'checkbox' ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!item[col.key]}
                                                        onChange={(e) => handleItemChange(index, col.key, e.target.checked)}
                                                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                        tabIndex={col.tabIndex ?? 0}
                                                    />
                                                </div>
                                            ) : (
                                                <CommonInput
                                                    ref={(node) => {
                                                        inputRefs.current[`${index}-${col.key}`] = node;
                                                    }}
                                                    type={col.type === 'currency' || col.type === 'number' ? 'text' : (col.type || "text")}
                                                    variant="table"
                                                    size="sm"
                                                    value={item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : ""}
                                                    onChange={(e) => col.type === 'currency'
                                                        ? handleCurrencyChange(index, col.key, e.target.value)
                                                        : col.type === 'number'
                                                            ? handleItemChange(index, col.key, String(e.target.value).replace(/,/g, ''))
                                                            : handleItemChange(index, col.key, e.target.value)
                                                    }
                                                    min={col.min}
                                                    onKeyDown={(e) => handleFieldKeyDown(e, index, col.key)}
                                                    onFocus={col.type === 'currency'
                                                        ? handleCurrencyFocus
                                                        : col.type === 'number'
                                                            ? (e) => { e.target.value = String(e.target.value).replace(/,/g, ''); e.target.select(); }
                                                            : col.key === 'description'
                                                                ? handleDescriptionFocus
                                                                : undefined}
                                                    onClick={col.key === 'description' ? (e) => e.currentTarget.select() : undefined}
                                                    onBlur={col.type === 'currency'
                                                        ? (e) => handleCurrencyBlur(index, col.key, e.target.value)
                                                        : col.type === 'number'
                                                            ? (e) => {
                                                                const num = parseFloat(String(e.target.value).replace(/,/g, ''));
                                                                handleItemChange(index, col.key, isNaN(num) ? "" : num.toLocaleString('en-US', { maximumFractionDigits: 4 }));
                                                            }
                                                            : undefined
                                                    }
                                                    placeholder={col.placeholder || ""}
                                                    className={col.inputClass || ''}
                                                    tabIndex={col.tabIndex ?? 0}
                                                />
                                            )}
                                        </div>
                                    </td>
                                ))}

                                {/* Actions */}
                                <td className="px-1 py-0.5 align-middle w-20 text-right">
                                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CommonButton
                                            type="button"
                                            tabIndex={-1}
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => duplicateRow?.(index)}
                                            className="!p-1 hover:text-green-600 hover:bg-green-50"
                                            title="Duplicate Row"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 00-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                            </svg>
                                        </CommonButton>
                                        <CommonButton
                                            type="button"
                                            tabIndex={-1}
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => removeRow(index)}
                                            className="!p-1 hover:text-red-500 hover:bg-red-50"
                                            title="Remove Row"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </CommonButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section - Directly below table */}
            {!hideSummaryBlock && (
                <div className="flex justify-end py-4 pr-11 bg-white border-t border-slate-100">
                    {onDiscountChange ? (
                        <div className="flex flex-col items-end gap-3 min-w-[300px]">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Subtotal</span>
                                <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                                    <span className="text-xs font-bold text-slate-400">{currencyPrefix}</span>
                                    {parseFloat(String(subtotal || 0).replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Discount Input */}
                            <div className="flex justify-between items-center w-full gap-4">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mt-2">Discount</span>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={discountValue}
                                        onChange={(e) => {
                                            // Allow only numbers and a single decimal point
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = val.split('.');
                                            if (parts.length > 2) return;
                                            onDiscountChange(val, discountType);
                                        }}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value || 0).toString();
                                            onDiscountChange(val, discountType);
                                        }}
                                        className="w-[80px] h-8 text-right text-sm font-medium border border-slate-300 rounded-l-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-2"
                                    />
                                    <div className="flex h-8 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => onDiscountChange(discountValue, 'percent')}
                                            className={`px-2 text-xs font-bold transition-colors ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            %
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDiscountChange(discountValue, 'fixed')}
                                            className={`px-2 text-xs font-bold transition-colors ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            $
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-slate-200">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total</span>
                                <span className="text-lg font-black text-slate-900 flex items-center gap-1">
                                    <span className="text-xs font-bold text-slate-400">{currencyPrefix}</span>
                                    {totals && Object.values(totals)[0] ? parseFloat(String(Object.values(totals)[0]).replace(/,/g, '') || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        totals && (
                            <div className="flex items-center gap-8 pr-4">
                                {Object.entries(totals).map(([label, value]) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
                                        <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                                            <span className="text-xs font-bold text-slate-400">{currencyPrefix}</span>
                                            {parseFloat(String(value).replace(/,/g, '') || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Footer / Actions */}
            <div className="px-3 py-3 bg-slate-50/50 flex gap-2 border-t border-slate-200">
                {addRow && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        onClick={addRow}
                        className="gap-1.5 bg-white"
                    >
                        Add Row
                    </CommonButton>
                )}
                {clearRows && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        onClick={clearRows}
                        className="gap-1.5 bg-white"
                    >
                        Clear All
                    </CommonButton>
                )}

            </div>
        </div>
    );
}
