import React from 'react';

interface NewsItem {
    news_id?: string;
    title: string;
    source?: string;
    published_at?: string;
    what?: string;
    so_what?: string;
    now_what?: string;
    expert_view?: {
        expert_name: string;
        comment: string;
    };
    impact?: string; // For executive summary items fallback
    urgency?: string;
}

interface BriefingDetailModalProps {
    item: NewsItem | null;
    onClose: () => void;
}

export const BriefingDetailModal: React.FC<BriefingDetailModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div className="pr-8">
                        {item.urgency && (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${item.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {item.urgency} Priority
                            </span>
                        )}
                        <h2 className="text-xl font-bold text-slate-800 leading-snug">{item.title}</h2>
                        {item.source && (
                            <p className="text-sm text-slate-500 mt-1">Source: {item.source} • {new Date(item.published_at || Date.now()).toLocaleDateString()}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* What / Impact */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">What (핵심 내용)</h3>
                        <p className="text-slate-700 leading-relaxed text-lg">
                            {item.what || item.impact || "詳細 content not available."}
                        </p>
                    </div>

                    {/* So What */}
                    {item.so_what && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                So What (시사점)
                            </h3>
                            <div className="bg-blue-50 p-4 rounded-xl text-slate-700 border border-blue-100 leading-relaxed">
                                {item.so_what}
                            </div>
                        </div>
                    )}

                    {/* Now What */}
                    {item.now_what && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Now What (대응 방안)
                            </h3>
                            <div className="bg-emerald-50 p-4 rounded-xl text-slate-700 border border-emerald-100 leading-relaxed">
                                {item.now_what}
                            </div>
                        </div>
                    )}

                    {/* Expert View */}
                    {item.expert_view && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                    <img
                                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${item.expert_view.expert_name}`}
                                        alt={item.expert_view.expert_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{item.expert_view.expert_name} says:</h4>
                                    <p className="text-slate-600 italic mt-1 text-sm bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                                        "{item.expert_view.comment}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
