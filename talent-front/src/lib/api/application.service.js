import { apiClient } from './client';

export const applicationService = {
    getMyApplications: async () => {
        const response = await apiClient.get('/applications/my');
        return response || [];
    },

    getApplicationDetail: async (id) => {
        const response = await apiClient.get(`/applications/${id}`);
        return response;
    },

    getJobApplications: async (jobId) => {
        const response = await apiClient.get(`/jobs/${jobId}/applications`);
        return response || [];
    },

    /**
     * Accept a job application
     * @param {string} applicationId - The application ID
     * @returns {Promise<Object>}
     */
    acceptApplication: async (applicationId) => {
        try {
            const response = await apiClient.patch(`/applications/${applicationId}/accept`);
            return response;
        } catch (error) {
            console.error('Failed to accept application:', error);
            throw error;
        }
    },

    /**
     * Reject a job application
     * @param {string} applicationId - The application ID
     * @returns {Promise<Object>}
     */
    rejectApplication: async (applicationId, reason = '', feedback = '') => {
        try {
            const response = await apiClient.patch(`/applications/${applicationId}/reject`, {
                reason,
                feedback,
            });
            return response;
        } catch (error) {
            console.error('Failed to reject application:', error);
            throw error;
        }
    }
};
