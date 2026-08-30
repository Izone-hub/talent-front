import { apiClient } from './client';

export const settingsService = {
    getCompanySettings: async () => {
        const response = await apiClient.get('/admin/settings');
        return response;
    },
    updateCompanySettings: async (settings) => {
        const response = await apiClient.put('/admin/settings', settings);
        return response;
    }
};
