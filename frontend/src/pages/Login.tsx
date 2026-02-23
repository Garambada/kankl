import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const { setUserProfile } = useGlobalState();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await authAPI.login(formData);
            localStorage.setItem('accessToken', response.data.access_token);

            // Fetch User Profile immediately after login
            const meResponse = await authAPI.getMe();
            setUserProfile(meResponse.data);

            navigate('/');
        } catch (err: any) {
            setError('Authentication failed. Please verify your credentials.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex w-full max-w-5xl h-[600px] bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 m-4">

                {/* Left Side - Brand / Visual */}
                <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-black/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"></div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center mb-8">
                            <div className="text-3xl font-black text-white tracking-widest uppercase">
                                Kankl <span className="font-bold text-slate-400 normal-case tracking-normal">: Founders Studio</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Welcome To <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">The Boardroom CLUB</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-light leading-relaxed">
                            Access exclusive AI-powered strategic advisory from world-class experts.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                            <span className="text-2xl">🧠</span>
                            <div>
                                <h3 className="text-white font-medium text-sm">AI-Native Intelligence</h3>
                                <p className="text-slate-500 text-xs">Real-time synthesis of global market data.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white/90 relative">
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
                        <p className="text-slate-500 text-sm">Enter your credentials to access your executive dashboard.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center border border-red-100 animate-fadeIn">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Access Dashboard"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 mb-2">Demo Access</p>
                        <div className="flex flex-col gap-1 items-center">
                            <code className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors" title="Click to copy" onClick={() => setEmail('test_vwxamacuiz@example.com')}>
                                test_vwxamacuiz@example.com
                            </code>
                            <code className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors" title="Click to copy" onClick={() => setPassword('securepassword123')}>
                                securepassword123
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
