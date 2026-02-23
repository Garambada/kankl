import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for our data
// (In a real app, these should be shared interfaces, but for now we'll define loosely or import if available)

interface BriefingData {
    executive_summary: any[];
    top_news: any[];
    watch_list: any[];
    recommendations?: any[];
    date: string;
}

interface Speaker {
    id: number;
    name: string;
    title: string;
    image: string;
    expertise: string;
    bio: string;
}

interface Booking {
    id: number;
    speaker_id: number;
    speaker_name: string;
    booking_time: string;
    notes: string;
    status: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{ page_content: string; metadata: any }>;
}

interface UserProfile {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface GlobalStateContextType {
    // Data
    userProfile: UserProfile | null;
    briefing: BriefingData | null;
    speakers: Speaker[];
    bookings: Booking[];
    chatHistories: Record<string, ChatMessage[]>; // Keyed by expertId

    // Round Table State
    roundTableState: {
        topic: string;
        messages: any[]; // Using any to avoid duplicating Message interface here, or define it
        isDebating: boolean;
        conversationId: string | null;
        statusText: string;
    };

    // Setters
    setUserProfile: (data: UserProfile | null) => void;
    setBriefing: (data: BriefingData | null) => void;
    setSpeakers: (data: Speaker[]) => void;
    setBookings: (data: Booking[]) => void;
    setChatHistory: (expertId: string, messages: ChatMessage[]) => void;
    addChatMessage: (expertId: string, message: ChatMessage) => void;

    setRoundTableState: (state: Partial<GlobalStateContextType['roundTableState']>) => void;

    // Reset function for logout
    resetAll: () => void;

    // Loading states to prevent double-fetching if desired (optional, but good for UX)
    isProfileLoaded: boolean;
    isBriefingLoaded: boolean;
    isSpeakersLoaded: boolean;
    isBookingsLoaded: boolean;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available
    const [userProfile, setUserProfileState] = useState<UserProfile | null>(() => {
        try {
            const saved = localStorage.getItem('boardroom_userProfile');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });

    const [briefing, setBriefingState] = useState<BriefingData | null>(() => {
        try {
            const saved = localStorage.getItem('boardroom_briefing');
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });

    const [speakers, setSpeakersState] = useState<Speaker[]>(() => {
        try {
            const saved = localStorage.getItem('boardroom_speakers');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [bookings, setBookingsState] = useState<Booking[]>(() => {
        try {
            const saved = localStorage.getItem('boardroom_bookings');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
        try {
            const saved = localStorage.getItem('boardroom_chat_histories');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Round Table State
    const [roundTableState, setRoundTableStateState] = useState(() => {
        try {
            const saved = localStorage.getItem('boardroom_roundtable');
            return saved ? JSON.parse(saved) : {
                topic: '',
                messages: [],
                isDebating: false,
                conversationId: null,
                statusText: ''
            };
        } catch (e) {
            return {
                topic: '',
                messages: [],
                isDebating: false,
                conversationId: null,
                statusText: ''
            };
        }
    });

    // Persistence Effects
    React.useEffect(() => {
        if (userProfile) localStorage.setItem('boardroom_userProfile', JSON.stringify(userProfile));
    }, [userProfile]);

    React.useEffect(() => {
        if (briefing) localStorage.setItem('boardroom_briefing', JSON.stringify(briefing));
    }, [briefing]);

    React.useEffect(() => {
        if (speakers.length > 0) localStorage.setItem('boardroom_speakers', JSON.stringify(speakers));
    }, [speakers]);

    React.useEffect(() => {
        if (bookings.length > 0) localStorage.setItem('boardroom_bookings', JSON.stringify(bookings));
    }, [bookings]);

    React.useEffect(() => {
        if (Object.keys(chatHistories).length > 0) {
            localStorage.setItem('boardroom_chat_histories', JSON.stringify(chatHistories));
        }
    }, [chatHistories]);

    React.useEffect(() => {
        localStorage.setItem('boardroom_roundtable', JSON.stringify(roundTableState));
    }, [roundTableState]);

    const setUserProfile = React.useCallback((data: UserProfile | null) => {
        setUserProfileState(data);
    }, []);

    const setBriefing = React.useCallback((data: BriefingData | null) => {
        setBriefingState(data);
    }, []);

    const setSpeakers = React.useCallback((data: Speaker[]) => {
        setSpeakersState(data);
    }, []);

    const setBookings = React.useCallback((data: Booking[]) => {
        setBookingsState(data);
    }, []);

    const setChatHistory = React.useCallback((expertId: string, messages: ChatMessage[]) => {
        setChatHistories(prev => ({
            ...prev,
            [expertId]: messages
        }));
    }, []);

    const addChatMessage = React.useCallback((expertId: string, message: ChatMessage) => {
        setChatHistories(prev => {
            const currentHistory = prev[expertId] || [];
            return {
                ...prev,
                [expertId]: [...currentHistory, message]
            };
        });
    }, []);

    const setRoundTableState = React.useCallback((newState: Partial<GlobalStateContextType['roundTableState']>) => {
        setRoundTableStateState((prev: any) => ({
            ...prev,
            ...newState
        }));
    }, []);

    const resetAll = React.useCallback(() => {
        // 1. Reset Memory State
        setUserProfileState(null);
        setBriefingState(null);
        setSpeakersState([]);
        setBookingsState([]);
        setChatHistories({});
        setRoundTableStateState({
            topic: '',
            messages: [],
            isDebating: false,
            conversationId: null,
            statusText: ''
        });

        // 2. Clear LocalStorage immediately
        localStorage.removeItem('boardroom_userProfile');
        localStorage.removeItem('boardroom_briefing');
        localStorage.removeItem('boardroom_speakers');
        localStorage.removeItem('boardroom_bookings');
        localStorage.removeItem('boardroom_chat_histories');
        localStorage.removeItem('boardroom_roundtable');
    }, []);

    const value = React.useMemo(() => ({
        userProfile,
        briefing,
        speakers,
        bookings,
        chatHistories,
        roundTableState,
        setUserProfile,
        setBriefing,
        setSpeakers,
        setBookings,
        setChatHistory,
        addChatMessage,
        setRoundTableState,
        resetAll,
        isProfileLoaded: !!userProfile,
        isBriefingLoaded: !!briefing,
        isSpeakersLoaded: speakers.length > 0,
        isBookingsLoaded: bookings.length > 0,
    }), [userProfile, briefing, speakers, bookings, chatHistories, roundTableState, setUserProfile, setBriefing, setSpeakers, setBookings, setChatHistory, addChatMessage, setRoundTableState, resetAll]);

    return (
        <GlobalStateContext.Provider value={value}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
};
