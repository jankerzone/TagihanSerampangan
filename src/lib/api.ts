import { getCurrentUser } from "./utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Handle unauthorized (logout)
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'API Request Failed');
        }

        return response.json();
    },

    auth: {
        login: (data: any) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
        register: (data: any) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    },

    data: {
        getMonthData: (monthKey: string) => api.request(`/api/${monthKey}`),
        saveMonthData: (monthKey: string, data: any) => api.request(`/api/${monthKey}`, { method: 'POST', body: JSON.stringify(data) }),
    },

    settings: {
        getGlobal: () => api.request('/api/settings/global'),
        saveGlobal: (data: any) => api.request('/api/settings/global', { method: 'POST', body: JSON.stringify(data) }),
    }
};
