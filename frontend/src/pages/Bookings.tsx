import React, { useEffect, useState } from 'react';
import { bookingsAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';
import { BookingCalendar } from '../components/BookingCalendar';

export const Bookings: React.FC = () => {
    const { bookings, setBookings, isBookingsLoaded } = useGlobalState();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    useEffect(() => {
        const fetchBookings = async () => {
            if (isBookingsLoaded) return;

            try {
                const response = await bookingsAPI.list();
                setBookings(response.data);
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            }
        };
        fetchBookings();
    }, [isBookingsLoaded, setBookings]);

    const handleDelete = async (id: number) => {
        console.log("Attempting to delete booking:", id);
        // Removed confirm for reliability, or replaced with custom UI later
        try {
            await bookingsAPI.delete(id);
            setBookings(bookings.filter(b => b.id !== id));
            console.log("Booking deleted successfully");
        } catch (error) {
            console.error("Failed to delete booking:", error);
            alert("Failed to cancel booking. Please try again.");
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Bookings</h1>
                    <p className="text-slate-500 text-lg">Manage and view all global advisory sessions.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Calendar
                        </button>
                    </div>
                    <button
                        onClick={() => window.location.href = '/speakers'}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-black shadow-lg hover:shadow-xl transition-all flex items-center transform active:scale-95"
                    >
                        <span className="mr-2 text-xl font-light">+</span> New Request
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <BookingCalendar bookings={bookings} />
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-white/40">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/80 backdrop-blur-sm">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Speaker</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/60 divide-y divide-slate-50 relative z-10">
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl mb-3 opacity-50">📅</span>
                                                <p className="font-medium">No bookings found.</p>
                                                <p className="text-sm mt-1 opacity-70">Request a new session from the Expert Network.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-white/80 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 mr-3 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {booking.speaker_name.charAt(0)}
                                                </div>
                                                <div className="font-bold text-slate-800">{booking.speaker_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-slate-600 font-mono text-sm">
                                            {new Date(booking.booking_time).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-slate-600">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                                {booking.notes || "Advisory Session"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${booking.status === 'confirmed'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 self-center ${booking.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm flex gap-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline opacity-60 group-hover:opacity-100 transition-opacity">
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(booking.id)}
                                                className="text-red-500 hover:text-red-700 font-medium hover:underline opacity-60 group-hover:opacity-100 transition-opacity"
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
