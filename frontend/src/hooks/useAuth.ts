
import { useState, useEffect } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);

    // Determine if we can use context (conditional hook usage is risky but useAuth is custom)
    // Actually, useAuth must be used inside Provider for this to work.
    // If useAuth is used in App.tsx OUTSIDE the provider, this fails.
    // Let's assume useAuth is safe or protect it.
    let resetGlobalState: (() => void) | undefined;
    try {
        const { resetAll } = useGlobalState();
        resetGlobalState = resetAll;
    } catch (e) {
        // Fallback if used outside provider (e.g. initial auth check)
        // console.warn("useAuth used outside GlobalStateProvider, resetAll unavailable");
    }

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsAuthenticated(true);
            setUser({ name: 'Demo User', role: 'member' });
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('accessToken', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        // Clear auth token
        localStorage.removeItem('accessToken');

        // Reset Global Memory State (Critical to stop re-persistence loops)
        if (resetGlobalState) {
            resetGlobalState();
        }

        // Clear Persistent Storage manually (Backup)
        localStorage.removeItem('boardroom_briefing');
        localStorage.removeItem('boardroom_speakers');
        localStorage.removeItem('boardroom_bookings');
        localStorage.removeItem('boardroom_chat_histories');
        localStorage.removeItem('boardroom_roundtable');

        // Clear dynamic chat sessions
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('chat_session_')) {
                localStorage.removeItem(key);
            }
        });

        setIsAuthenticated(false);
        setUser(null);

        // Force reload to clear memory state if needed, or rely on state updates
        window.location.href = '/login';
    };

    return { isAuthenticated, user, login, logout };
};
