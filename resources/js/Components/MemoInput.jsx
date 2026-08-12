export default function MemoInput({ value, onChange, label = "Memo", placeholder = "Add a note..." }) {
    return (
        <div className="w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
            <textarea
                className="w-full border-b border-slate-200 py-2 text-sm leading-snug focus:border-primary-500 transition-colors bg-transparent outline-none resize-none min-h-[60px]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
