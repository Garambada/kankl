
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGlobalState } from '../context/GlobalStateContext';

export const Layout: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const { userProfile } = useGlobalState();
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: '📊' },
        { name: 'Briefing', href: '/briefing', icon: '📝' },
        { name: 'Experts', href: '/speakers', icon: '👥' },
        { name: 'Bookings', href: '/bookings', icon: '📅' },
        { name: 'Round Table', href: '/round-table', icon: '⚔️' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
                <div className="flex items-center justify-center h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                    <h1 className="text-xl font-bold tracking-wider">Boardroom Club</h1>
                </div>
                <div className="flex-1 flex flex-col py-6 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-soft border-r-4 border-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Admin Mode - Conditionally Rendered */}
                {userProfile?.role === 'admin' && (
                    <div className="px-3 pb-4">
                        <Link
                            to="/admin"
                            className={`flex items-center px-4 py-3 text-sm font-bold bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 hover:text-white hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all shadow-sm ${location.pathname.startsWith('/admin') ? 'ring-1 ring-purple-500 from-purple-600/40 to-indigo-600/40 text-white' : ''
                                }`}
                        >
                            <span className="mr-3 text-lg">🛡️</span>
                            Admin Mode
                        </Link>
                    </div>
                )}

                <div className="p-4 border-t border-slate-800">
                    <div className="text-xs text-slate-500 text-center">
                        © 2026 Founders Studio
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Glassmorphism Top Bar */}
                <header className="absolute top-0 left-0 right-0 h-16 z-10 bg-white/70 backdrop-blur-md shadow-sm border-b border-white/20 flex items-center justify-between px-8">
                    <div className="md:hidden">
                        {/* Mobile Menu Button Placeholder */}
                        <span className="font-bold text-slate-800">Boardroom Club</span>
                    </div>
                    <div className="flex-1"></div> {/* Spacer */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <span className="text-sm font-medium text-slate-600">{userProfile?.name}</span>
                        ) : (
                            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Sign In
                            </Link>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={logout}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors shadow-sm"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto bg-gray-50 pt-20 px-4 pb-8 md:px-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
