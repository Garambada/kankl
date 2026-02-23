import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI } from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{ page_content: string; metadata: any }>;
}

// Markdown Styles for Chat Bubbles
const ChatMarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold mb-2 mt-2" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-base font-bold mb-1 mt-2" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-sm font-bold mb-1 mt-1" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
    li: ({ node, ...props }: any) => <li className="mb-0.5" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-2 leading-relaxedLast:mb-0" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-2 border-slate-300 pl-2 py-0.5 my-1 bg-black/5 italic text-sm" {...props} />,
    table: ({ node, ...props }: any) => <div className="overflow-x-auto my-2 rounded border border-slate-200"><table className="w-full text-left text-xs" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-slate-100 font-semibold" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 bg-white/50" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-black/5 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-2 py-1.5" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-2 py-1.5 align-top" {...props} />,
    a: ({ node, ...props }: any) => <a className="underline hover:text-blue-500" target="_blank" rel="noopener noreferrer" {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
        return inline ? (
            <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
        ) : (
            <code className="block bg-black/80 text-white rounded p-2 text-xs font-mono my-2 overflow-x-auto" {...props}>{children}</code>
        );
    }
};

export const Chat: React.FC<{ speakerId?: string }> = ({ speakerId = "1" }) => {
    const { chatHistories, setChatHistory, addChatMessage } = useGlobalState();
    const messages = chatHistories[speakerId] || [];

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversation from localStorage or API on mount
    useEffect(() => {
        const loadHistory = async () => {
            // Always try to load the session ID for the *current* speaker
            const savedId = localStorage.getItem(`chat_session_${speakerId}`);
            setConversationId(savedId);

            // optimization: if we have messages in global state, use them and don't fetch
            if (chatHistories[speakerId] && chatHistories[speakerId].length > 0) {
                return;
            }

            if (savedId) {
                try {
                    const response = await chatAPI.getConversation(savedId);
                    const history = response.data.messages.map((msg: any) => ({
                        id: msg.message_id,
                        role: msg.role,
                        content: msg.content,
                        sources: msg.sources
                    }));
                    setChatHistory(speakerId, history);
                } catch (error) {
                    console.error("Failed to load history:", error);
                    // If 404, maybe clear local storage
                    localStorage.removeItem(`chat_session_${speakerId}`);
                    setConversationId(null);
                }
            }
        };
        loadHistory();
    }, [speakerId, chatHistories, setChatHistory]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        addChatMessage(speakerId, userMsg);

        setInput('');
        setIsLoading(true);

        try {
            const response = await chatAPI.sendMessage({
                speaker_id: speakerId,
                message: input,
                conversation_id: conversationId || undefined
            });

            // Save conversation ID if new
            if (response.data.conversation_id && response.data.conversation_id !== conversationId) {
                setConversationId(response.data.conversation_id);
                localStorage.setItem(`chat_session_${speakerId}`, response.data.conversation_id);
            }

            const assistantMsg: Message = {
                id: response.data.message_id,
                role: 'assistant',
                content: response.data.response,
                sources: response.data.sources
            };
            addChatMessage(speakerId, assistantMsg);
        } catch (error) {
            console.error("Failed to send message", error);
            const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: "⚠️ Connecting to AI Engine failed. Please try again." };
            addChatMessage(speakerId, errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white absolute bottom-0 right-0 z-10"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                            EX
                        </div>
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800 block leading-tight">Expert Advisory</span>
                        <span className="text-xs text-slate-500">Speaker ID: {speakerId}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">Solar Pro 3</span>
                    <button
                        onClick={() => {
                            localStorage.removeItem(`chat_session_${speakerId}`);
                            setChatHistory(speakerId, []); // Use global setter
                            setConversationId(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Reset Chat"
                    >
                        ↺
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shadow-sm">
                            🤖
                        </div>
                        <p className="font-medium">Ask me anything about the strategy...</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full group`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs mr-3 mt-1 shadow-md flex-shrink-0 gradient-mask-b-0">
                                    AI
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed transition-all ${msg.role === 'user'
                                ? 'bg-slate-900 text-white rounded-br-none shadow-md'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                                }`}>
                                <div className={`markdown-body ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={ChatMarkdownComponents}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Sources Display */}
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 ml-10 max-w-[85%]">
                                <details className="group">
                                    <summary className="list-none cursor-pointer text-xs text-slate-400 hover:text-blue-600 flex items-center transition-colors select-none">
                                        <div className="mr-2 p-1 bg-slate-100 rounded-md group-hover:bg-blue-50 transition-colors">
                                            📚
                                        </div>
                                        <span>View {msg.sources.length} Sources</span>
                                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-open:rotate-180">▼</span>
                                    </summary>
                                    <div className="mt-2 space-y-2 p-3 bg-white rounded-xl text-xs text-slate-600 border border-slate-100 shadow-sm">
                                        {msg.sources.map((src, idx) => (
                                            <div key={idx} className="border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                                <div className="font-semibold text-slate-800 mb-0.5">
                                                    Source {idx + 1}
                                                    {src.metadata?.page && ` (Page ${src.metadata.page})`}
                                                </div>
                                                <div className="line-clamp-2 text-slate-500 italic">
                                                    "{src.page_content}"
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs mr-3 mt-1 shadow-sm flex-shrink-0">
                            AI
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-10">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl pl-5 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all shadow-inner placeholder-slate-400"
                        placeholder="Type your strategic query..."
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        Send
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-300 font-medium">AI generated content. Check important info.</span>
                </div>
            </div>
        </div>
    );
};
