import React, { useState } from 'react';

interface Booking {
    id: number;
    speaker_name: string;
    booking_time: string;
    status: string;
    notes?: string;
}

interface BookingCalendarProps {
    bookings: Booking[];
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
    };

    const getBookingsForDay = (day: number) => {
        const date = new Date(year, month, day);
        return bookings.filter(b => {
            const bookingDate = new Date(b.booking_time);
            return isSameDay(bookingDate, date);
        });
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border border-slate-100 rounded-lg"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(new Date(), new Date(year, month, day));

            days.push(
                <div key={day} className={`h-24 border ${isToday ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-white'} rounded-lg p-2 transition-all hover:shadow-md relative overflow-hidden group`}>
                    <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-hide">
                        {dayBookings.map(b => (
                            <div key={b.id} className="text-xs p-1 rounded bg-indigo-100 text-indigo-700 truncate" title={`${b.speaker_name}: ${b.notes || 'Advisory'}`}>
                                • {b.speaker_name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        ←
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {renderDays()}
            </div>
        </div>
    );
};
