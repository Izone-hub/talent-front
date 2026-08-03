import { apiClient } from './client';

export const dashboardService = {
    getDashboard: async () => {
        const response = await apiClient.get('/admin/dashboard');
        return response;
    },
    getRecentActivity: async (limit = 10, page = 1) => {
        const response = await apiClient.get(`/admin/dashboard/recent-activity?limit=${limit}&page=${page}`);
        return response;
    }
};
