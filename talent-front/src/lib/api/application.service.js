import { apiClient } from './client';

export const applicationService = {
    getMyApplications: async () => {
        const response = await apiClient.get('/applications/my');
        return response || [];
    },

    getApplicationDetail: async (id) => {
        const response = await apiClient.get(`/applications/${id}`);
        return response;
    }
};
