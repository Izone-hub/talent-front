import { apiClient } from './client';

export const usersService = {
    // Admin-only: paginated list of registered users. When category is set,
    // only accepted users in that category are returned. The backend returns
    // { items, pagination }.
    listUsers: async (limit = 50, offset = 0, category = '') => {
        const query = category
            ? `?limit=${limit}&offset=${offset}&category=${encodeURIComponent(category)}`
            : `?limit=${limit}&offset=${offset}`;
        const response = await apiClient.get(`/admin/users${query}`);
        return {
            items: response?.items || [],
            pagination: response?.pagination || { limit, offset, total: 0, has_more: false },
        };
    },

    // Admin-only: per-category counts of accepted users for the category cards.
    getUserCategoryCounts: async () => {
        const response = await apiClient.get('/admin/users/categories');
        return response?.categories || [];
    },

    // Admin-only: backfill categories for users accepted before the column
    // existed. Idempotent; returns { message, updated }.
    reindexUserCategories: async () => {
        return apiClient.post('/admin/users/reindex-categories');
    },

    // Admin-only: single user profile (sensitive fields stripped server-side).
    getUser: async (userId) => {
        return apiClient.get(`/admin/users/${userId}`);
    },

    // Admin-only: every application the user submitted across all jobs.
    getUserApplications: async (userId) => {
        const response = await apiClient.get(`/admin/users/${userId}/applications`);
        return response || [];
    },

    // Admin-only: CV versions uploaded by the user.
    getUserCVs: async (userId) => {
        const response = await apiClient.get(`/admin/users/${userId}/cv`);
        return {
            versions: response?.versions || [],
            total: response?.total || 0,
        };
    },

    // Admin-only: download a user's CV as a PDF blob.
    downloadUserCV: async (userId, cvId) => {
        return apiClient.get(`/admin/users/${userId}/cv/${cvId}/download`, { responseType: 'blob' });
    },
};