import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chat } from '../components/Chat';
import { briefingAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';
import { BriefingDetailModal } from '../components/BriefingDetailModal';

export const Briefing: React.FC = () => {
    const { briefing, setBriefing, isBriefingLoaded } = useGlobalState();
    const [searchParams] = useSearchParams();
    const expertId = searchParams.get('expertId') || "1"; // Default to Expert 1 (Park Taewung)
    const [selectedNews, setSelectedNews] = useState<any | null>(null);

    useEffect(() => {
        const fetchBriefing = async () => {
            if (isBriefingLoaded) return; // Use cached data if available

            try {
                const response = await briefingAPI.getToday();
                setBriefing(response.data);
            } catch (error) {
                console.error("Failed to fetch briefing:", error);
            }
        };
        fetchBriefing();
    }, [isBriefingLoaded, setBriefing]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full pb-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-blue-500 h-[480px] flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 flex-shrink-0">Daily Intelligence</h3>
                    <div className="overflow-y-auto pr-2 flex-grow custom-scrollbar">
                        {briefing ? (
                            <ul className="space-y-3 text-sm text-slate-600">
                                {/* Map Executive Summary as high-level points */}
                                {briefing.executive_summary.map((item: any, idx: number) => (
                                    <li
                                        key={idx}
                                        onClick={() => setSelectedNews(item)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${item.urgency === 'high' ? 'bg-red-50/50 border-red-200 text-red-800 hover:bg-red-100' : 'bg-blue-50/50 border-blue-200 text-slate-700 hover:bg-blue-100'}`}
                                    >
                                        <strong className="block mb-1 text-slate-900 flex justify-between items-center">
                                            {item.title}
                                            <span className="text-[10px] opacity-70">Details &rarr;</span>
                                        </strong>
                                        {item.impact}
                                    </li>
                                ))}
                                {/* Also show Top News titles if summary is short */}
                                {briefing.top_news.map((news: any, idx: number) => (
                                    <li
                                        key={`news-${idx}`}
                                        onClick={() => setSelectedNews(news)}
                                        className="p-3 bg-white/50 rounded-xl border border-slate-200 cursor-pointer hover:bg-white hover:shadow-md transition-all hover:scale-[1.02]"
                                    >
                                        <strong className="text-slate-800 block mb-1">Insight: {news.title}</strong>
                                        <div className="flex justify-end">
                                            <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Click to Read</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex justify-center p-4">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl h-[300px] flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 flex-shrink-0">Watch List</h3>
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                        {briefing ? (
                            briefing.watch_list.map((item: any, idx: number) => (
                                <div key={idx} className="bg-slate-50/80 p-3 rounded-xl text-xs text-slate-600 border border-slate-100">
                                    <span className="font-bold block text-blue-600 mb-1">#{item.title}</span>
                                    {item.summary}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 animate-pulse">Loading...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="glass-panel rounded-2xl p-1 h-[800px] flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="p-6 pb-2 relative z-10">
                        <h2 className="text-xl font-bold text-slate-800">Advisory Chat</h2>
                        <p className="text-sm text-slate-500">Chat with our AI-Native personas for strategic insights.</p>
                    </div>
                    <div className="flex-grow relative z-10 overflow-hidden">
                        <Chat speakerId={expertId} />
                    </div>
                </div>
            </div>

            <BriefingDetailModal
                item={selectedNews}
                onClose={() => setSelectedNews(null)}
            />
        </div>
    );
};
