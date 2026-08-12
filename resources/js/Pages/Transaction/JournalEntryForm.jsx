import { useState, useEffect } from "react";
import axios from "axios";
import TransactionLayout from "@/TransactionLayout/TransactionLayout";
import { showToast } from "@/Components/ToastNotification";
import LineItemsTable from "@/TransactionLayout/LineItemsTable";
import CommonInput from "@/Components/CommonInput";
import QuickAddPayee from "@/Components/QuickAddPayee";
import QuickAddAccount from "@/Components/QuickAddAccount";
import { Head, usePage, router } from "@inertiajs/react";
import PinPromptModal from "@/Components/PinPromptModal";
import BooksLockIndicator from "@/Components/BooksLockIndicator";
import { isBooksLocked } from "@/Hooks/useBooksLock";

export default function JournalEntryForm({ journalEntry = null, nextJournalNo = "" }) {
    const isEditing = Boolean(journalEntry?.id);
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || '';

    const [payeeOptions, setPayeeOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);

    const [savedEntryId, setSavedEntryId] = useState(journalEntry?.id || null);

    // Modal States
    const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction } = useBooksLock();
    const [booksPin, setBooksPin] = useState("");
    const [booksPinError, setBooksPinError] = useState(null);

    const fetchPayees = (search = "") => {
        axios.get(route('api.payees', { search })).then(res => setPayeeOptions(res.data));
    };

    const fetchAccounts = (search = "") => {
        axios.get(route('api.accounts', { search })).then(res => setAccountOptions(res.data));
    };

    useEffect(() => {
        fetchPayees();
        fetchAccounts();
    }, []);

    const JOURNAL_COLUMNS = [
        {
            key: "account_id",
            label: "Account",
            type: "select",
            options: accountOptions,
            onAddNew: () => setIsAccountModalOpen(true),
            placeholder: "Select account",
            className: "w-[25%]"
        },
        { key: "debit", label: "Debits", type: "currency", className: "text-right w-[10%]", inputClass: "text-right" },
        { key: "credit", label: "Credits", type: "currency", className: "text-right w-[10%]", inputClass: "text-right" },
        { key: "description", label: "Description", placeholder: "Enter description", className: "w-[30%]" },
        {
            key: "payee_id",
            label: "Name",
            type: "select",
            options: payeeOptions,
            onAddNew: () => setIsPayeeModalOpen(true),
            placeholder: "Select name",
            className: "w-[25%]",
            tabIndex: 0,
            noAutoSelectOnTab: true,  // Tab without arrow-key selection → don't auto-pick first item
        },
    ];

    const getInitialDate = () => {
        if (journalEntry?.date) return journalEntry.date;
        const cached = localStorage.getItem('last_transaction_date');
        if (cached) return cached;
        return new Date().toISOString().split('T')[0];
    };

    const [form, setForm] = useState({
        date: getInitialDate(),
        journalNo: journalEntry?.reference || (nextJournalNo ? String(parseInt(nextJournalNo)).padStart(4, '0') : "0001"),
        memo: journalEntry?.description || "",
    });

    const createBlankLine = (description = "", rowId = null) => ({
        id: rowId ?? `journal-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        account_id: "",
        debit: "",
        credit: "",
        description,
        payee_id: "",
    });

    const [items, setItems] = useState([
        createBlankLine(),
        createBlankLine(),
    ]);

    useEffect(() => {
        if (journalEntry && journalEntry.lines) {
            setItems(journalEntry.lines.map(line => ({
                account_id: line.chart_of_acc_id,
                debit: line.debit ? parseFloat(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
                credit: line.credit ? parseFloat(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
                description: line.memo || "",
                payee_id: line.payee_id || ""
            })));
        }
    }, [journalEntry]);

    const [isDirty, setIsDirty] = useState(false);

    // Helper to strip commas and parse
    const parseCurrency = (val) => parseFloat(String(val || 0).replace(/,/g, '')) || 0;
    const formatCurrencyValue = (val) => {
        const numeric = parseFloat(String(val ?? 0).replace(/,/g, ''));
        return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
    };

    const totals = items.reduce(
        (acc, item) => {
            acc.debit += parseCurrency(item.debit);
            acc.credit += parseCurrency(item.credit);
            return acc;
        },
        { debit: 0, credit: 0 }
    );

    const getSuggestedBalance = (currentItems) => {
        const totalsNow = currentItems.reduce((acc, item) => {
            acc.debit += parseCurrency(item.debit);
            acc.credit += parseCurrency(item.credit);
            return acc;
        }, { debit: 0, credit: 0 });

        const difference = totalsNow.debit - totalsNow.credit;
        if (Math.abs(difference) < 0.001) return null;

        return difference > 0
            ? { credit: difference.toFixed(2) }
            : { debit: Math.abs(difference).toFixed(2) };
    };

    const getBalanceTargetIndex = (updatedRows, currentIndex, changedField) => {
        const oppositeField = changedField === "debit" ? "credit" : "debit";
        const sameField = changedField;

        // First pass: find empty row after current
        for (let i = currentIndex + 1; i < updatedRows.length; i += 1) {
            if (!updatedRows[i][oppositeField] || parseCurrency(updatedRows[i][oppositeField]) === 0) {
                return i;
            }
        }

        // Second pass: find any row after current with no same-field value
        for (let i = currentIndex + 1; i < updatedRows.length; i += 1) {
            if (!updatedRows[i][sameField] || parseCurrency(updatedRows[i][sameField]) === 0) {
                return i;
            }
        }

        return -1;
    };

    const addJournalLine = () => {
        setItems((prev) => {
            const lastDescription = [...prev].reverse().find(row => String(row.description || "").trim())?.description || "";
            const suggestion = getSuggestedBalance(prev);
            const nextLine = createBlankLine(lastDescription);

            if (suggestion?.credit !== undefined) nextLine.credit = formatCurrencyValue(suggestion.credit);
            if (suggestion?.debit !== undefined) nextLine.debit = formatCurrencyValue(suggestion.debit);

            return [...prev, nextLine];
        });
        setIsDirty(true);
    };

    // Handles live typing - NO auto-balance
    const handleItemChangeRaw = (index, field, value) => {
        setItems((prev) => {
            const updated = prev.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row
            );
            const numVal = parseCurrency(value);
            if (field === "debit" && numVal > 0) updated[index].credit = "";
            if (field === "credit" && numVal > 0) updated[index].debit = "";
            return updated;
        });
        setIsDirty(true);
    };

    // Handles blur (after formatting) - WITH auto-balance
    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const updated = prev.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row
            );

            const numVal = parseCurrency(value);
            if (field === "debit" && numVal > 0) updated[index].credit = "";
            if (field === "credit" && numVal > 0) updated[index].debit = "";

            const suggestion = getSuggestedBalance(updated);
            const targetIndex = getBalanceTargetIndex(updated, index, field);

            if (index === 0 && prev.length === 2) {
                const oppositeField = field === "debit" ? "credit" : "debit";
                if (suggestion) {
                    updated[1][oppositeField] = formatCurrencyValue(suggestion[oppositeField] ?? 0);
                    updated[1][field] = "";
                }
            } else if (suggestion && targetIndex >= 0) {
                const oppositeField = field === "debit" ? "credit" : "debit";
                updated[targetIndex][oppositeField] = formatCurrencyValue(suggestion[oppositeField] ?? 0);
            }

            return updated;
        });
        setIsDirty(true);
    };

    const handleSave = (type = 'save', pinOverride = null) => {
        const isEdit = !!(journalEntry?.id || savedEntryId);
        if (!pinOverride && isBooksLocked(form.date, auth?.books_lock_date, isEdit)) {
            setPendingAction(type);
            setIsPinModalOpen(true);
            return;
        }

        if (Math.abs(totals.debit - totals.credit) > 0.001) {
            alert("Debits and Credits must balance to save this entry.");
            return;
        }

        const currentRefNo = form.journalNo;

        const payload = {
            action: type,
            date: form.date,
            reference_no: form.journalNo,
            description: form.memo,
            lines: items
                .filter(i => i.account_id && (parseCurrency(i.debit) > 0 || parseCurrency(i.credit) > 0))
                .map(i => ({
                    ...i,
                    debit: parseCurrency(i.debit),
                    credit: parseCurrency(i.credit)
                })),
            books_pin: pinOverride !== null ? pinOverride : booksPin
        };

        setPendingAction(type);

        // Use savedEntryId if we already saved once this session
        const currentId = savedEntryId || journalEntry?.id;
        const method = currentId ? 'patch' : 'post';
        const url = currentId ? `/journal-entries/${currentId}` : "/journal-entries";

        router[method](url, payload, {
            replace: true,
            preserveState: true,   // STAY ON SAME PAGE
            preserveScroll: true,
            onSuccess: (page) => {
                showToast('success', 'Record saved successfully.');
                setIsDirty(false);

                // Capture the new entry ID from flash or response
                if (!savedEntryId && page.props?.flash?.journal_entry_id) {
                    setSavedEntryId(page.props.flash.journal_entry_id);
                }

                setIsPinModalOpen(false);
                setPendingAction(null);
                setBooksPin('');
                setBooksPinError(null);

                if (type === 'close') {
                    if (typeof onClose === 'function') {
                        onClose();
                    } else {
                        window.location.href = '/dashboard';
                    }
                }

                if (type === 'new') {
                    setSavedEntryId(null); // reset for new entry
                    setItems([createBlankLine(), createBlankLine()]);
                    const num = parseInt(String(currentRefNo).replace(/[^0-9]/g, '')) || 0;
                    const nextNo = String(num + 1).padStart(4, '0');
                    setForm({
                        date: getInitialDate(),
                        journalNo: nextNo,
                        memo: ""
                    });
                }
            },
            onError: (errors) => {
                if (errors.books_pin === 'BOOKS_LOCKED_PIN_REQUIRED' || errors.books_pin) {
                    setBooksPinError(errors.books_pin !== 'BOOKS_LOCKED_PIN_REQUIRED' ? errors.books_pin : null);
                    setIsPinModalOpen(true);
                } else {
                    alert(Object.values(errors).join('\n') || "Error saving entry ❌");
                }
            }
        });
    };
    return (
        <TransactionLayout
            historyType="journal_entry"
            title={
                <div className="flex items-center gap-2">
                    Journal Entry #{form.journalNo}
                    <BooksLockIndicator date={form.date} lockDate={auth?.books_lock_date} isEdit={!!(journalEntry?.id || savedEntryId)} />
                </div>
            }
            amount={totals.debit.toFixed(2)}
            dirty={isDirty}
            onSave={() => handleSave('save')}
            onSaveAndClose={() => handleSave('close')}
            onSaveAndNew={() => handleSave('new')}
            onAddLine={addJournalLine}
            onClearRows={() => {
                setItems([
                    createBlankLine(),
                    createBlankLine(),
                ]);
                setIsDirty(true);
            }}
        >
            <Head title={"Journal Entry"} />

            <div className="flex items-end gap-6 py-6 border-b border-slate-100">
                <div className="w-[180px]">
                    <CommonInput
                        type="date"
                        label="Journal date"
                        value={form.date}
                        onChange={(e) => {
                            const newDate = e.target.value;
                            localStorage.setItem('last_transaction_date', newDate);
                            setForm({ ...form, date: newDate });
                            setIsDirty(true);
                        }}
                        size="sm"
                    />
                </div>

                <div className="w-[180px]">
                    <CommonInput
                        label="Journal no."
                        value={form.journalNo}
                        onChange={(e) => {
                            setForm({ ...form, journalNo: e.target.value });
                            setIsDirty(true);
                        }}

                        onFocus={(e) => {
                            setTimeout(() => e.target.select(), 0);
                        }}
                        size="sm"
                        inputClass="font-mono"
                    />
                </div>
            </div>

            <LineItemsTable
                columns={JOURNAL_COLUMNS}
                items={items}
                handleItemChange={handleItemChangeRaw}
                onCurrencyBlur={handleItemChange}
                addRow={addJournalLine}
                removeRow={(index) =>
                    setItems((prev) => prev.filter((_, i) => i !== index))
                }
                totals={{
                    Debits: totals.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                    Credits: totals.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                }}
                currencyPrefix={currencyPrefix}
                clearRows={() => setItems([
                    createBlankLine(),
                    createBlankLine(),
                ])}
                hideActions={true}
            />

            <div className="mt-8 w-[500px]">
                <CommonInput
                    type="textarea"
                    label="Memo"
                    value={form.memo}
                    onChange={(e) => {
                        setForm({ ...form, memo: e.target.value });
                        setIsDirty(true);
                    }}
                    placeholder="Add a memo for this journal entry..."
                    size="sm"
                    className="h-24"
                />
            </div>

            <QuickAddPayee
                isOpen={isPayeeModalOpen}
                onClose={() => setIsPayeeModalOpen(false)}
                onSuccess={(newPayee) => fetchPayees()}
            />

            <QuickAddAccount
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSuccess={(newAcc) => fetchAccounts()}
            />

            <PinPromptModal
                isOpen={isPinModalOpen}
                onClose={() => {
                    setIsPinModalOpen(false);
                    setPendingAction(null);
                    setBooksPin('');
                    setBooksPinError(null);
                }}
                onSubmit={(pin) => {
                    setBooksPin(pin);
                    handleSave(pendingAction, pin);
                }}
                errorMessage={booksPinError}
            />
        </TransactionLayout>
    );
}
