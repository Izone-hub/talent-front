import { apiClient } from './client';

export const dashboardService = {
    getDashboard: async () => {
        const response = await apiClient.get('/admin/dashboard');
        return response;
    },
    getRecentActivityPage: async (limit = 10, offset = 0) => {
        const response = await apiClient.get(`/admin/dashboard/recent-activity?limit=${limit}&offset=${offset}`);
        return response;
    }
};
