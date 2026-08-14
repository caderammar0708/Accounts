import SearchableSelect from "@/Components/SearchableSelect";

export default function TopFormSection({ form, setForm }) {
    return (
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 border-b pb-4">

            <div>
                <SearchableSelect
                    label="Payee"
                    placeholder="Who did you pay?"
                    value={form.payee}
                    onChange={(val) => setForm({ ...form, payee: val })}
                    options={[
                        { label: "Internal Supplier", value: "1" },
                        { label: "External Supplier", value: "2" }
                    ]}
                />
            </div>

            <div>
                <SearchableSelect
                    label="Payment account"
                    value={form.account}
                    onChange={(val) => setForm({ ...form, account: val })}
                    options={[
                        { label: "Cash", value: "Cash" },
                        { label: "Bank Account", value: "Bank" },
                        { label: "Petty Cash", value: "Petty Cash" }
                    ]}
                />
            </div>

            <div className="flex items-end text-sm text-gray-500 pb-1">
                Balance 666,500.00
            </div>

            <div>
                <label className="text-xs text-gray-500 block mb-1">Payment date</label>
                <input
                    type="date"
                    className="w-full border-b border-gray-300 text-sm py-1 bg-transparent outline-none"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
            </div>

            <div>
                <SearchableSelect
                    label="Payment method"
                    value={form.method}
                    onChange={(val) => setForm({ ...form, method: val })}
                    options={[
                        { label: "Cash", value: "Cash" },
                        { label: "Check", value: "Check" },
                        { label: "Credit Card", value: "Credit Card" },
                        { label: "Direct Debit", value: "Direct Debit" }
                    ]}
                />
            </div>

            <div>
                <label className="text-xs text-gray-500 block mb-1">Ref no.</label>
                <input
                    className="w-full border-b border-gray-300 text-sm py-1 bg-transparent outline-none"
                    value={form.ref}
                    onChange={(e) => setForm({ ...form, ref: e.target.value })}
                />
            </div>

        </div>
    );
}
