import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const { userProfile } = useGlobalState();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'schedules'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create User Modal State
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'member' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createUserError, setCreateUserError] = useState('');

    useEffect(() => {
        if (!userProfile) return;
        if (userProfile.role !== 'admin') {
            navigate('/');
            return;
        }

        fetchData();
    }, [userProfile, navigate, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await adminAPI.getUsers();
                setUsers(res.data);
            } else {
                const res = await adminAPI.getAllBookings();
                setBookings(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await adminAPI.deleteUser(id);
                fetchData();
            } catch (err) {
                console.error("Delete user failed", err);
                alert("Failed to delete user.");
            }
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        setCreateUserError('');
        try {
            await adminAPI.createUser(newUserForm);
            setIsCreateUserModalOpen(false);
            setNewUserForm({ name: '', email: '', password: '', role: 'member' });
            fetchData(); // Refresh the table
        } catch (err: any) {
            console.error("Create user failed", err);
            setCreateUserError(err.response?.data?.detail || "Failed to create user");
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleDeleteBooking = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this global booking?")) {
            try {
                await adminAPI.deleteBooking(id);
                fetchData();
            } catch (err) {
                console.error("Delete booking failed", err);
                alert("Failed to delete booking.");
            }
        }
    };

    if (!userProfile || userProfile.role !== 'admin') return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Administration</h1>
                <p className="text-slate-500 mt-2">Manage user accounts and platform operations.</p>
            </header>

            {/* Tabs & Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2 border-b border-slate-200 flex-grow">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('schedules')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'schedules' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Global Schedules
                    </button>
                </div>
                {activeTab === 'users' && (
                    <button
                        onClick={() => setIsCreateUserModalOpen(true)}
                        className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Create User
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {activeTab === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-200">ID</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Name</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Email</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Role</th>
                                        <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                            <td className="px-6 py-4 font-mono text-xs">{u.id}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                                            <td className="px-6 py-4">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {u.id !== userProfile.id && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-200">Booking ID</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Expert</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Date & Time</th>
                                        <th className="px-6 py-4 border-b border-slate-200">Status</th>
                                        <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                            <td className="px-6 py-4 font-mono text-xs">{b.id}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{b.speaker_name}</td>
                                            <td className="px-6 py-4">{new Date(b.booking_time).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">{b.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteBooking(b.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No bookings found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create User Modal */}
            {isCreateUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
                        <button
                            onClick={() => setIsCreateUserModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New User</h2>

                        {createUserError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {createUserError}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newUserForm.name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isCreatingUser}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center"
                                >
                                    {isCreatingUser ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
