
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Add Token)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor (Handle 401)
// Queue for concurrent 401s
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response Interceptor (Handle 401 & Refresh Token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    // Start refreshing
                    // We must use a separate axios instance or fetch to avoid infinite loops if this fails
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('accessToken', access_token);

                    // Update header
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;

                    processQueue(null, access_token);
                    isRefreshing = false;

                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    console.error("Token refresh failed:", refreshError);
                    // Fall through to logout
                }
            } else {
                isRefreshing = false;
            }

            console.warn("Session expired. Redirecting to login...");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // Clear global state to prevent stale data
            localStorage.removeItem('boardroom_briefing');
            localStorage.removeItem('boardroom_speakers');
            localStorage.removeItem('boardroom_bookings');
            localStorage.removeItem('boardroom_chat_histories');
            localStorage.removeItem('boardroom_roundtable'); // Clean up round table state too

            // Clear dynamic chat sessions
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('chat_session_')) {
                    localStorage.removeItem(key);
                }
            });

            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API Functions
export const authAPI = {
    login: (formData: FormData) =>
        api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get('/users/me'),
};

export const bookingsAPI = {
    create: (data: { speaker_id: number; booking_time: string; notes?: string }) =>
        api.post('/bookings', data),
    list: () => api.get('/bookings'),
    delete: (id: number) => api.delete(`/bookings/${id}`),
};

export const speakersAPI = {
    list: () => api.get('/speakers'),
};

export const chatAPI = {
    sendMessage: (data: { speaker_id: string; message: string; conversation_id?: string }) =>
        api.post('/advisory/chat', data),

    getConversation: (conversationId: string) =>
        api.get(`/advisory/conversations/${conversationId}`),
};

export const briefingAPI = {
    getToday: () => api.get('/briefings/today'),
    getHistory: (startDate: string, endDate: string) =>
        api.get(`/briefings?start_date=${startDate}&end_date=${endDate}`),
};



export const keywordsAPI = {
    list: () => api.get('/keywords'),
    add: (word: string) => api.post('/keywords', { word }),
    delete: (id: number) => api.delete(`/keywords/${id}`),
};

export const adminAPI = {
    getUsers: () => api.get('/users'),
    createUser: (data: any) => api.post('/users', data),
    deleteUser: (id: number) => api.delete(`/users/${id}`),
    getAllBookings: () => api.get('/bookings/all'),
    deleteBooking: (id: number) => api.delete(`/bookings/admin/${id}`),
};

export default api;
