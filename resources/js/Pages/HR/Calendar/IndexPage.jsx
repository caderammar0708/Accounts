import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import Modal from '@/Components/Modal';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

export default function CalendarIndexPage({ auth, currentMonth, holidays, leaves }) {
    const selectedDate = dayjs(currentMonth, 'YYYY-MM');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState('');
    const [holidayName, setHolidayName] = useState('');
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [editingHolidayId, setEditingHolidayId] = useState(null);

    const changeMonth = (offset) => {
        const newMonth = selectedDate.add(offset, 'month').format('YYYY-MM');
        router.get('/calendar', { month: newMonth }, { preserveState: true });
    };

    const daysInMonth = selectedDate.daysInMonth();
    const startDay = selectedDate.startOf('month').day(); // 0 is Sunday
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Group leaves by date
    const leavesByDate = {};
    leaves.forEach((l) => {
        let current = dayjs(l.start_date);
        const end = dayjs(l.end_date);
        while (current <= end || current.isSame(end, 'day')) {
            const dateStr = current.format('YYYY-MM-DD');
            if (!leavesByDate[dateStr]) leavesByDate[dateStr] = [];
            leavesByDate[dateStr].push(l);
            current = current.add(1, 'day');
        }
    });

    // Group holidays by date
    const holidaysByDate = {};
    holidays.forEach((h) => {
        holidaysByDate[dayjs(h.date).format('YYYY-MM-DD')] = h;
    });

    const openModal = (dateStr, holiday = null) => {
        setModalDate(dateStr);
        if (holiday) {
            setHolidayName(holiday.name);
            setIsHalfDay(holiday.is_half_day);
            setEditingHolidayId(holiday.id);
        } else {
            setHolidayName('');
            setIsHalfDay(false);
            setEditingHolidayId(null);
        }
        setIsModalOpen(true);
    };

    const saveHoliday = (e) => {
        e.preventDefault();
        if (editingHolidayId) {
            // Note: Since we don't have a specific holiday update route yet, 
            // you might want to create a HolidaysController. For now assuming we just need the UI.
            alert('Holiday update endpoint not yet implemented.');
        } else {
            alert('Holiday create endpoint not yet implemented.');
        }
        setIsModalOpen(false);
    };

    const deleteHoliday = () => {
        if (editingHolidayId && confirm('Are you sure you want to delete this holiday?')) {
            alert('Holiday delete endpoint not yet implemented.');
            setIsModalOpen(false);
        }
    };

    const ChevronLeftIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    );

    const ChevronRightIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );

    const PlusIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );

    const CalendarIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    );

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Leave & Holiday Calendar</h2>}
        >
            <Head title="Leave & Holiday Calendar" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Toolbar */}
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <CalendarIcon />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                                {selectedDate.format('MMMM YYYY')}
                            </h2>
                        </div>
                        
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 shadow-inner border border-gray-100">
                            <button 
                                onClick={() => changeMonth(-1)} 
                                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all focus:outline-none"
                                title="Previous Month"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <div className="px-4 py-1 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                {selectedDate.format('YYYY')}
                            </div>
                            <button 
                                onClick={() => changeMonth(1)} 
                                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all focus:outline-none"
                                title="Next Month"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                                <div key={day} className="py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span className="hidden sm:inline">{day}</span>
                                    <span className="sm:hidden">{day.substring(0, 3)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-7 auto-rows-fr bg-gray-50/20">
                            {Array.from({ length: startDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[140px] border-b border-r border-gray-100 p-2 opacity-50 bg-gray-50"></div>
                            ))}
                            {days.map(day => {
                                const dateStr = selectedDate.date(day).format('YYYY-MM-DD');
                                const dayLeaves = leavesByDate[dateStr] || [];
                                const holiday = holidaysByDate[dateStr];
                                const isToday = dateStr === dayjs().format('YYYY-MM-DD');

                                return (
                                    <div key={day} className={`min-h-[140px] border-b border-r border-gray-100 p-3 hover:bg-indigo-50/30 transition-colors relative group ${isToday ? 'bg-indigo-50/50' : 'bg-white'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700'}`}>
                                                {day}
                                            </span>
                                            <button 
                                                onClick={() => openModal(dateStr, holiday)}
                                                className="p-1 rounded-full text-indigo-500 opacity-0 group-hover:opacity-100 hover:bg-indigo-100 transition-all focus:outline-none"
                                                title={holiday ? 'Edit Holiday' : 'Add Holiday'}
                                            >
                                                <PlusIcon />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-1.5 overflow-y-auto max-h-[85px] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                            {holiday && (
                                                <div 
                                                    onClick={() => openModal(dateStr, holiday)}
                                                    className="cursor-pointer text-xs px-2 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-lg shadow-sm truncate hover:shadow-md transition-shadow"
                                                    title={holiday.name}
                                                >
                                                    ✨ {holiday.name} {holiday.is_half_day ? '(Half)' : ''}
                                                </div>
                                            )}
                                            {dayLeaves.map((l) => (
                                                <div 
                                                    key={l.id} 
                                                    className="text-xs px-2 py-1.5 bg-amber-50 text-amber-800 font-medium border border-amber-100 rounded-lg truncate shadow-sm" 
                                                    title={`${l.employee?.name || 'Unknown Staff'} - ${l.leave_type?.name || 'Unknown Leave'}`}
                                                >
                                                    🏖️ {l.employee?.name || 'Unknown Staff'} <span className="opacity-75 font-normal">({l.day_type === 'Half Day' ? '1/2' : 'Full'})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <h3 className="text-xl font-bold leading-6 text-gray-900 mb-2">
                        {editingHolidayId ? 'Edit Holiday' : 'Add Holiday'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {dayjs(modalDate).format('dddd, MMMM D, YYYY')}
                    </p>
                    
                    <form onSubmit={saveHoliday} className="space-y-5">
                        <CommonInput
                            label="Holiday Name"
                            value={holidayName}
                            onChange={e => setHolidayName(e.target.value)}
                            placeholder="e.g., Independence Day"
                            required
                        />
                        <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                            <input 
                                type="checkbox" 
                                id="halfDayCheck"
                                checked={isHalfDay} 
                                onChange={e => setIsHalfDay(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                            />
                            <label htmlFor="halfDayCheck" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer select-none">
                                This is a half-day holiday
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                            {editingHolidayId && (
                                <button 
                                    type="button" 
                                    onClick={deleteHoliday} 
                                    className="px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                            <CommonButton 
                                type="button" 
                                variant="secondary"
                                onClick={() => setIsModalOpen(false)} 
                            >
                                Cancel
                            </CommonButton>
                            <CommonButton type="submit">
                                {editingHolidayId ? 'Save Changes' : 'Create Holiday'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
