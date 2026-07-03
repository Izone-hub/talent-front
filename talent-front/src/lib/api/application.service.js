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
            // TODO: Replace with actual backend endpoint when ready
            // const response = await apiClient.post(`/applications/${applicationId}/accept`);
            // return response;
            
            // Mock implementation
            console.log('Mock: Accepting application', applicationId);
            return { success: true, message: 'Application accepted' };
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
    rejectApplication: async (applicationId) => {
        try {
            // TODO: Replace with actual backend endpoint when ready
            // const response = await apiClient.post(`/applications/${applicationId}/reject`);
            // return response;
            
            // Mock implementation
            console.log('Mock: Rejecting application', applicationId);
            return { success: true, message: 'Application rejected' };
        } catch (error) {
            console.error('Failed to reject application:', error);
            throw error;
        }
    }
};
