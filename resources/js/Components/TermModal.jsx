import { useState } from "react";

export default function TermModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState("");
    const [type, setType] = useState("fixed"); // fixed or certain_day
    const [days, setDays] = useState("");
    const [dayOfMonth, setDayOfMonth] = useState("");
    const [nextMonthThreshold, setNextMonthThreshold] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">New Term</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                                <span className="text-red-500 mr-1">*</span>Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                                    checked={type === "fixed"}
                                    onChange={() => setType("fixed")}
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-bold text-slate-700">Due in fixed number of days</span>
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                            disabled={type !== "fixed"}
                                            value={days}
                                            onChange={(e) => setDays(e.target.value)}
                                        />
                                        <span className="text-sm text-slate-600">days</span>
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    className="mt-1 w-4 h-4 text-primary focus:ring-primary border-slate-300"
                                    checked={type === "certain_day"}
                                    onChange={() => setType("certain_day")}
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-bold text-slate-700">Due by certain day of the month</span>
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                            disabled={type !== "certain_day"}
                                            value={dayOfMonth}
                                            onChange={(e) => setDayOfMonth(e.target.value)}
                                        />
                                        <span className="text-sm text-slate-600">day of month</span>
                                    </div>
                                    
                                    <div className="mt-4 space-y-2">
                                        <span className="text-sm font-bold text-slate-700 block">Due the next month if issued within</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                                disabled={type !== "certain_day"}
                                                value={nextMonthThreshold}
                                                onChange={(e) => setNextMonthThreshold(e.target.value)}
                                            />
                                            <span className="text-sm text-slate-600">days of due date</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave({ name, type, days, dayOfMonth, nextMonthThreshold });
                            onClose();
                        }}
                        className="px-8 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
