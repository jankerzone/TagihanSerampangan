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

    budgetItems: {
        update: (id: string, updates: any) => api.request(`/api/budget-items/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    },

    incomeSources: {
        update: (id: string, updates: any) => api.request(`/api/income-sources/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    },

    savings: {
        update: (id: string, updates: any) => api.request(`/api/savings/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    },

    savingsGoals: {
        getAll: () => api.request('/api/savings/goals'),
        getOne: (id: string) => api.request(`/api/savings/goals/${id}`),
        create: (data: any) => api.request('/api/savings/goals', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, updates: any) => api.request(`/api/savings/goals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
        delete: (id: string) => api.request(`/api/savings/goals/${id}`, { method: 'DELETE' }),
        getSummary: () => api.request('/api/savings/summary'),
    },

    savingsContributions: {
        getByMonth: (monthKey: string) => api.request(`/api/savings/contributions/${monthKey}`),
        getByGoal: (goalId: string) => api.request(`/api/savings/goals/${goalId}/contributions`),
        create: (data: any) => api.request('/api/savings/contributions', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, updates: any) => api.request(`/api/savings/contributions/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
        delete: (id: string) => api.request(`/api/savings/contributions/${id}`, { method: 'DELETE' }),
        getMonthTotal: (monthKey: string) => api.request(`/api/savings/contributions/${monthKey}/total`),
    },

    settings: {
        getGlobal: () => api.request('/api/settings/global'),
        saveGlobal: (data: any) => api.request('/api/settings/global', { method: 'POST', body: JSON.stringify(data) }),
    },

    telegram: {
        generateLinkCode: () => api.request('/telegram/generate-link-code', { method: 'POST' }),
    }
};
