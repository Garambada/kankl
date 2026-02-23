import React, { useState, useEffect } from 'react';
import { bookingsAPI, speakersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';

export const Speakers: React.FC = () => {
    const { speakers, setSpeakers, isSpeakersLoaded, bookings, setBookings } = useGlobalState();
    const [selectedSpeaker, setSelectedSpeaker] = useState<any | null>(null);
    const [bookingDate, setBookingDate] = useState('2026-03-20');
    const [bookingTime, setBookingTime] = useState('14:00');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            // Load Speakers
            if (!isSpeakersLoaded || speakers.length === 0) {
                try {
                    const response = await speakersAPI.list();
                    if (response.data && response.data.length > 0) {
                        setSpeakers(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch speakers:", error);
                }
            }

            // Load Bookings for valid duplication check
            try {
                const response = await bookingsAPI.list();
                setBookings(response.data);
                console.log("Loaded bookings for duplication check:", response.data);
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            }
        };
        fetchData();
    }, [isSpeakersLoaded, setSpeakers, setBookings]);

    const openBookingModal = (speaker: any) => {
        setSelectedSpeaker(speaker);
    };

    const closeBookingModal = () => {
        setSelectedSpeaker(null);
    };

    const handleConfirmBooking = async () => {
        if (!selectedSpeaker || !bookingDate || !bookingTime) return;

        // Check for duplicates (Client-side)
        const bookingTimestamp = `${bookingDate}T${bookingTime}:00`;

        // Simple string comparison for now. Ideally, use date parsing for robustness.
        const isDuplicate = bookings.some(b =>
            b.speaker_id === selectedSpeaker.id &&
            (b.booking_time === bookingTimestamp || b.booking_time.startsWith(bookingTimestamp))
        );

        if (isDuplicate) {
            const confirm = window.confirm(
                `⚠️ Duplicate Booking Detected\n\nYou already have a session with ${selectedSpeaker.name} at ${bookingDate} ${bookingTime}.\n\nDo you want to proceed anyway?`
            );
            if (!confirm) return;
        }

        try {
            const payload = {
                speaker_id: selectedSpeaker.id,
                booking_time: bookingTimestamp,
                notes: "Requested via Expert Network"
            };

            // 1. Send Request
            const response = await bookingsAPI.create(payload);

            // 2. Update Global State
            // If backend returns the created booking, append it. Otherwise fetch list.
            try {
                const updatedList = await bookingsAPI.list();
                setBookings(updatedList.data);
            } catch (e) {
                // Fallback: Optimistic update if list fetch fails
                const newBooking = {
                    id: Date.now(), // Temp ID
                    speaker_id: selectedSpeaker.id,
                    speaker_name: selectedSpeaker.name,
                    booking_time: bookingTimestamp,
                    notes: payload.notes,
                    status: 'pending'
                };
                setBookings([...bookings, newBooking]);
            }

            alert(`✅ Request Sent! \nYour advisory session with ${selectedSpeaker.name} has been requested.`);
            closeBookingModal();
        } catch (error) {
            console.error(error);
            alert("❌ Failed to request advisory. Please check your login status.");
        }
    };

    const handleChat = (id: number) => {
        navigate(`/briefing?expertId=${id}`);
    };

    // Extract unique expertise tags
    const allTags = Array.from(new Set(speakers.flatMap(s => s.expertise.split(',').map(t => t.trim()))));

    // Filter speakers
    const filteredSpeakers = speakers.filter(speaker => {
        const matchesSearch = speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            speaker.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag ? speaker.expertise.includes(selectedTag) : true;
        return matchesSearch && matchesTag;
    });

    return (
        <div className="min-h-screen relative pb-12">
            <div className="mb-10 pl-2 border-l-4 border-blue-600 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Expert Network</h1>
                    <p className="text-slate-500 text-lg">Connect with industry leaders for strategic insights.</p>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search experts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/80 border border-slate-200 rounded-full px-5 py-2.5 pl-10 w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
                    </div>
                </div>
            </div>

            {/* Expertise Tags */}
            <div className="mb-8 flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedTag ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                >
                    All
                </button>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tag === selectedTag ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSpeakers.map((speaker) => (
                    <div key={speaker.id} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full">
                        <div className="h-48 bg-slate-200 w-full object-cover flex items-center justify-center relative overflow-hidden">
                            <img
                                src={speaker.image && speaker.image.startsWith('http') && !speaker.image.includes("placeholder")
                                    ? speaker.image
                                    : `https://api.dicebear.com/7.x/personas/svg?seed=${speaker.name}&backgroundColor=b6e3f4`}
                                alt={speaker.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                            <div className="absolute bottom-4 left-6 right-6">
                                <h3 className="text-2xl font-bold text-white mb-0.5 drop-shadow-md">{speaker.name}</h3>
                                <p className="text-sm font-medium text-blue-300 uppercase tracking-wide drop-shadow-sm">{speaker.title}</p>
                            </div>
                        </div>
                        <div className="p-6 bg-white/50 backdrop-blur-sm flex-1 flex flex-col">
                            {/* Bio Section */}
                            <div className="mb-4 flex-1">
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {speaker.bio || "No biography available."}
                                </p>
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Expertise</span>
                                <div className="flex flex-wrap gap-2">
                                    {speaker.expertise.split(',').map((exp: string, idx: number) => (
                                        <span key={idx} className="bg-white border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                            {exp.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2 mt-auto">
                                <button
                                    onClick={() => handleChat(speaker.id)}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
                                >
                                    <span className="mr-2">💬</span> Chat
                                </button>
                                <button
                                    onClick={() => openBookingModal(speaker)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm"
                                >
                                    Booking
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Modal */}
            {selectedSpeaker && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fadeIn border border-white/20">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Advisory Session</h2>
                        <p className="text-slate-500 mb-8">
                            Request a session with <span className="font-bold text-blue-600">{selectedSpeaker.name}</span>.
                        </p>

                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected Date</label>
                                <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preferred Time</label>
                                <input
                                    type="time"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={closeBookingModal}
                                className="flex-1 px-4 py-3.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                className="flex-1 px-4 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-black font-medium shadow-lg hover:shadow-xl transition-all transform active:scale-95"
                            >
                                Confirm Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
