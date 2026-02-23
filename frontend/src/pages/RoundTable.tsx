import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGlobalState } from '../context/GlobalStateContext';
// import { advisoryAPI } from '../services/api'; // We might need to add this to api.ts first
import api from '../services/api'; // Direct use for now or add to api.ts

interface Message {
    role: string;
    content: string;
}

// Markdown Styles for Dark Theme (Moderator)
const DarkMarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold mb-4 text-purple-200 border-b border-purple-700 pb-2" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold mb-3 text-purple-300 mt-6" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold mb-2 text-purple-400 mt-4" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-slate-300" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-slate-300" {...props} />,
    li: ({ node, ...props }: any) => <li className="mb-1 pl-1" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-4 leading-relaxed text-slate-300" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-slate-800/50 italic text-slate-400 rounded-r" {...props} />,
    table: ({ node, ...props }: any) => <div className="overflow-x-auto my-6 rounded-lg border border-slate-700 shadow-sm"><table className="w-full text-left text-sm text-slate-300" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-slate-800 text-xs uppercase text-slate-400" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-700 bg-slate-900" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-6 py-3 font-medium tracking-wider" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-6 py-4 whitespace-nowrap" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-purple-200" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="border-slate-700 my-6" {...props} />,
};

// Markdown Styles for Light Theme (Speakers)
const LightMarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-3 text-slate-800" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mb-2 text-slate-700 mt-4" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-base font-bold mb-1 text-slate-600 mt-2" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-slate-600" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-slate-600" {...props} />,
    li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-3 leading-relaxed text-slate-700" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-slate-300 pl-4 py-1 my-2 bg-slate-50 italic text-slate-500" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-slate-900" {...props} />,
    table: ({ node, ...props }: any) => <div className="overflow-x-auto my-4 rounded border border-slate-200"><table className="w-full text-left text-sm" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-slate-50 text-slate-500" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 bg-white" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-2 font-medium" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-2" {...props} />,
};

export const RoundTable: React.FC = () => {
    const { roundTableState, setRoundTableState } = useGlobalState();
    const { topic, isDebating, messages, conversationId, statusText } = roundTableState;

    const [debugInfo, setDebugInfo] = useState('');
    const isMounted = React.useRef(true);

    // Polling for real-time updates safely
    React.useEffect(() => {
        isMounted.current = true;
        let timeoutId: NodeJS.Timeout;

        const pollData = async () => {
            if (!isMounted.current || !conversationId || !isDebating) return;

            try {
                const response = await api.get(`/advisory/conversations/${conversationId}`);
                if (!isMounted.current) return;

                const newMessages = response.data.messages || [];
                const debateMessages: Message[] = newMessages.filter((m: Message) => m.role === 'assistant' && !m.content.includes("[System]"));

                setDebugInfo(`Msgs: ${debateMessages.length}, Last: ${new Date().toLocaleTimeString()}`);
                setRoundTableState({ statusText: 'Receiving live feed...', messages: debateMessages });

                const hasModerator = debateMessages.some((m: Message) =>
                    m.content.includes("Moderator Synthesis") ||
                    m.content.includes("Strategic Conclusion")
                );

                if (hasModerator) {
                    setRoundTableState({ isDebating: false, statusText: 'Debate Concluded' });
                    return; // Stop polling
                }
            } catch (error: any) {
                if (!isMounted.current) return;
                console.error("Polling error:", error);
                setRoundTableState({ statusText: `Error: ${error.message || 'Polling failed'}` });
                // We do NOT stop polling on random transient network errors, but we can back off
            }

            // Schedule next poll only after this one completes
            if (isMounted.current && isDebating) {
                timeoutId = setTimeout(pollData, 2000);
            }
        };

        if (conversationId && isDebating) {
            setRoundTableState({ statusText: 'Connecting to debate channel...' });
            pollData();
        }

        return () => {
            isMounted.current = false;
            clearTimeout(timeoutId);
        };
    }, [conversationId, isDebating, setRoundTableState]);

    const handleStartDebate = async () => {
        if (!topic.trim()) return;

        setConversationId(null);
        setRoundTableState({ isDebating: true, messages: [], conversationId: null });

        try {
            const response = await api.post('/advisory/round-table', {
                topic: topic,
                speaker_id_1: 1, // Park
                speaker_id_2: 3  // Han
            });

            if (response.data.conversation_id) {
                setRoundTableState({ conversationId: response.data.conversation_id });
            }
        } catch (error) {
            console.error("Debate failed:", error);
            alert("Failed to start debate. Please try again.");
            setRoundTableState({ isDebating: false });
        }
    };

    // Helper helpers for local updates if needed, though direct setRoundTableState is fine
    const setConversationId = (id: string | null) => setRoundTableState({ conversationId: id });
    const setTopic = (t: string) => setRoundTableState({ topic: t });

    return (
        <div className="min-h-screen pb-12">
            <div className="mb-10 pl-2 border-l-4 border-purple-600">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Round Table</h1>
                <p className="text-slate-500 text-lg">Simulate a strategic debate between top experts.</p>
            </div>

            {/* Config Panel */}
            <div className="glass-card p-8 rounded-3xl mb-12 max-w-4xl mx-auto border border-purple-100/50 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Debate Topic</label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-inner"
                            placeholder="e.g. Should we pause giant AI experiments?"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleStartDebate}
                        disabled={isDebating || !topic}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transform transition-all active:scale-95 whitespace-nowrap
                            ${isDebating || !topic
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30 hover:-translate-y-1'
                            }`}
                    >
                        {isDebating ? 'Debating...' : 'Start Debate'}
                    </button>
                </div>

                {/* Participants Preview */}
                <div className="mt-8 flex justify-center gap-12">
                    <div className="text-center group">
                        <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-2 overflow-hidden border-2 border-transparent group-hover:border-purple-500 transition-all">
                            <img src="https://api.dicebear.com/7.x/personas/svg?seed=Park" alt="Park" className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-slate-700">Park Taewung</div>
                        <div className="text-xs text-slate-400">Critical Thinker</div>
                    </div>
                    <div className="flex items-center text-slate-300 font-bold text-xl">VS</div>
                    <div className="text-center group">
                        <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-2 overflow-hidden border-2 border-transparent group-hover:border-purple-500 transition-all">
                            <img src="https://api.dicebear.com/7.x/personas/svg?seed=Han" alt="Han" className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-slate-700">Han Sang-gi</div>
                        <div className="text-xs text-slate-400">Safety Advocate</div>
                    </div>
                </div>
            </div>

            {/* Debate Stage */}
            <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((msg: Message, index: number) => {
                    // Identify Moderator
                    const isModerator = msg.content.includes("[Moderator Synthesis]") || msg.content.includes("[Strategic Conclusion]");

                    // Clean content by removing the prefixes
                    const cleanContent = msg.content
                        .replace("**[Moderator Synthesis]**", "")
                        .replace("**[Strategic Conclusion]**", "")
                        .replace("**[Position A]**", "")
                        .replace("**[Position B]**", "")
                        .replace("[Moderator Synthesis]", "")
                        .replace("[Strategic Conclusion]", "")
                        .replace("[Position A]", "")
                        .replace("[Position B]", "");

                    if (isModerator) {
                        return (
                            <div key={index} className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                                <div className="max-w-2xl w-full bg-slate-900 text-slate-200 p-8 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
                                    <div className="flex items-center justify-center gap-2 mb-6 text-purple-300 font-bold uppercase tracking-widest text-xs border-b border-slate-800 pb-4">
                                        <span>★ Strategic Synthesis</span>
                                    </div>
                                    <div className="text-lg leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={DarkMarkdownComponents}>
                                            {cleanContent}
                                        </ReactMarkdown>
                                    </div>
                                    <div className="mt-8 flex justify-center border-t border-slate-800 pt-4">
                                        <div className="px-4 py-1 rounded-full bg-slate-800 text-[10px] text-slate-500">Boardroom Moderator AI</div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Identify Speaker based on turn/content
                    const isPositionA = msg.content.includes("[Position A]") || msg.content.includes("[Opening]");

                    // Default to left for Position A, right for Position B
                    const isLeft = isPositionA || (!msg.content.includes("[Position B]") && index % 2 === 0);

                    return (
                        <div key={index} className={`flex ${isLeft ? 'justify-start' : 'justify-end'} animate-fadeIn`} style={{ animationDelay: '0.2s' }}>
                            <div className={`max-w-2xl w-full ${isLeft ? 'mr-12' : 'ml-12'}`}>
                                <div className={`flex items-center gap-3 mb-2 ${isLeft ? '' : 'flex-row-reverse'}`}>
                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shadow-sm">
                                        <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${isLeft ? 'Park' : 'Han'}`} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-slate-600 text-sm">{isLeft ? "박태웅" : "한상기"}</span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {msg.content.includes("Opening") ? "Opening" :
                                            msg.content.includes("Critique") ? "Critique" :
                                                msg.content.includes("Position A") ? "Position" :
                                                    msg.content.includes("Position B") ? "Position" :
                                                        "Rebuttal"}
                                    </span>
                                </div>
                                <div className={`p-6 rounded-3xl shadow-sm border ${isLeft ? 'bg-white rounded-tl-none border-slate-100' : 'bg-purple-50/50 rounded-tr-none border-purple-100'}`}>
                                    <div className="text-slate-700 leading-relaxed text-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={LightMarkdownComponents}>
                                            {cleanContent}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Status & Debug Indicator */}
                <div className="text-center text-sm text-slate-400 mb-4 h-6">
                    {statusText && <span className="animate-pulse">{statusText}</span>}
                </div>

                {isDebating && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                            </span>
                            <span className="text-purple-600 font-medium text-sm">Analyzing expert positions...</span>
                        </div>
                        <button
                            onClick={() => setRoundTableState({ isDebating: false, statusText: 'Stopped manually' })}
                            className="text-xs text-slate-400 hover:text-red-500 underline decoration-slate-300 hover:decoration-red-300 transition-all mt-2"
                        >
                            Force Stop (Reset)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
