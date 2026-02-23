import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryFirstCard } from '../components/SummaryFirstCard';
import { briefingAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile } = useGlobalState();
    const { briefing, setBriefing, isBriefingLoaded } = useGlobalState();
    const [loading, setLoading] = useState(!isBriefingLoaded);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [isKeywordsLoaded, setIsKeywordsLoaded] = useState(false);

    useEffect(() => {
        const fetchBriefing = async () => {
            if (isBriefingLoaded) {
                setLoading(false);
                return;
            }

            try {
                const response = await briefingAPI.getToday();
                setBriefing(response.data);
            } catch (error) {
                console.error("Failed to fetch briefing:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBriefing();
    }, [isBriefingLoaded, setBriefing]);

    // Fetch Keywords - unconditionally called
    useEffect(() => {
        if (!isKeywordsLoaded) {
            import('../services/api').then(({ keywordsAPI }) => {
                keywordsAPI.list()
                    .then(res => {
                        setKeywords(res.data);
                        setIsKeywordsLoaded(true);
                    })
                    .catch(err => console.error("Failed to load keywords:", err));
            });
        }
    }, [isKeywordsLoaded]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 animate-pulse font-medium">Synthesizing Global Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!briefing || !briefing.top_news || briefing.top_news.length === 0) {
        return (
            <div className="min-h-screen p-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Executive Dashboard</h1>
                <div className="glass-panel p-8 rounded-xl text-center">
                    <p className="text-slate-500 mb-4">No intelligence data available for today.</p>
                    <button onClick={() => window.location.reload()} className="text-blue-600 font-medium hover:underline">
                        Refresh Data
                    </button>
                </div>
            </div>
        );
    }

    const topStory = briefing.top_news[0];

    const executiveBriefing = [
        {
            level: 1,
            title: "Executive Summary",
            content: topStory.what,
            icon: "📊",
            expandable: true
        },
        {
            level: 2,
            title: "Strategic Impact",
            content: topStory.so_what,
            icon: "🎯",
            expandable: true
        },
        {
            level: 3,
            title: "Action Plan",
            content: topStory.now_what,
            icon: "🚀",
            expandable: true
        }
    ];

    // Map recommendations to nextActions if available, otherwise use generic actions
    const actions = briefing.recommendations && briefing.recommendations.length > 0
        ? briefing.recommendations.map((r: any) => r.title)
        : ["Review full briefing", "Schedule deep dive"];

    const handleAddKeyword = async () => {
        if (!newKeyword.trim()) return;
        try {
            const { keywordsAPI } = await import('../services/api');
            const res = await keywordsAPI.add(newKeyword.trim());
            setKeywords([...keywords, res.data]);
            setNewKeyword('');
        } catch (error) {
            console.error("Failed to add keyword:", error);
        }
    };

    const handleDeleteKeyword = async (id: number) => {
        try {
            const { keywordsAPI } = await import('../services/api');
            await keywordsAPI.delete(id);
            setKeywords(keywords.filter(k => k.id !== id));
        } catch (error) {
            console.error("Failed to delete keyword:", error);
        }
    };

    return (
        <div className="min-h-screen pb-12">
            {/* Hero Section */}
            <div className="relative mb-10 p-8 rounded-3xl bg-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{userProfile?.name || 'Guest'}</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Here is your daily strategic intelligence. Global markets show high volatility in the semiconductor sector today.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Briefing Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-1 rounded-2xl">
                        <SummaryFirstCard layers={executiveBriefing} nextActions={actions} />
                    </div>
                </div>

                {/* Side Widgets Column */}
                <div className="space-y-6">
                    {/* Stats Widget */}
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-blue-500">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                            Live System Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-500 text-sm font-medium">Active Experts</span>
                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">3 Online</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-500 text-sm font-medium">Intelligence Feeds</span>
                                <span className="font-mono font-bold text-slate-800">{briefing.top_news.length + briefing.watch_list.length} Sources</span>
                            </div>
                        </div>
                    </div>

                    {/* Manage Topics Widget (Admin Only) */}
                    {userProfile?.role === 'admin' && (
                        <div className="glass-card p-6 rounded-2xl">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                                <span>Manage Topics</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{keywords.length} Active</span>
                            </h3>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                                    placeholder="Add topic (e.g. Bio-tech)"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                />
                                <button
                                    onClick={handleAddKeyword}
                                    className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {keywords.map(k => (
                                    <span key={k.id} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50">
                                        {k.word}
                                        <button
                                            onClick={() => handleDeleteKeyword(k.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors w-4 h-4 flex items-center justify-center rounded-full"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {keywords.length === 0 && (
                                    <p className="text-xs text-slate-400 italic">No custom topics. Using default feed.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="p-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-all hover:shadow-sm hover:border-blue-300 group"
                            >
                                <span className="block text-2xl mb-1 group-hover:scale-110 transition-transform">📅</span>
                                Schedule
                            </button>
                            <button
                                onClick={() => navigate('/briefing')}
                                className="p-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-all hover:shadow-sm hover:border-blue-300 group"
                            >
                                <span className="block text-2xl mb-1 group-hover:scale-110 transition-transform">💾</span>
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
