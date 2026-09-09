import { apiClient } from './client';

export const contactRequestsService = {
    list: async (limit = 50, offset = 0) => {
        const response = await apiClient.get(`/admin/contact-requests?limit=${limit}&offset=${offset}`);
        return {
            items: response?.items || [],
            pagination: response?.pagination || { limit, offset, total: 0, has_more: false },
        };
    },

    get: async (requestId) => {
        return apiClient.get(`/admin/contact-requests/${requestId}`);
    },

    listMessages: async (requestId) => {
        return apiClient.get(`/admin/contact-requests/${requestId}/messages`);
    },

    updateStatus: async (requestId, status) => {
        return apiClient.patch(`/admin/contact-requests/${requestId}/status`, { status });
    },

    reply: async (requestId, subject, message) => {
        return apiClient.post(`/admin/contact-requests/${requestId}/reply`, { subject, message });
    },

    remove: async (requestId) => {
        return apiClient.delete(`/admin/contact-requests/${requestId}`);
    },

    deleteMessage: async (requestId, messageId) => {
        return apiClient.delete(`/admin/contact-requests/${requestId}/messages/${messageId}`);
    },
};
