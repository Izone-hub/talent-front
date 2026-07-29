import { apiClient } from './client';

export const savedJobService = {
    listSavedJobs: async () => {
        const response = await apiClient.get('/jobs/saved');
        return response?.saved_jobs || [];
    },

    saveJob: async (jobId, notes = '') => {
        const response = await apiClient.post(`/jobs/${jobId}/save`, { notes });
        return response;
    },

    unsaveJob: async (jobId) => {
        const response = await apiClient.delete(`/jobs/${jobId}/save`);
        return response;
    },

    isJobSaved: async (jobId) => {
        const response = await apiClient.get(`/jobs/${jobId}/saved`);
        return response?.is_saved || false;
    }
};
