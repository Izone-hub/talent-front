import { apiClient } from './client';

export const dashboardService = {
    getDashboard: async () => {
        const response = await apiClient.get('/admin/dashboard');
        return response;
    }
};
