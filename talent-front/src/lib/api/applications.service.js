import { apiClient } from './client';

export const applicationService = {
    /**
     * Fetch all applications for the logged-in candidate
     */
    getMyApplications: async () => {
        const response = await apiClient.get('/applications/my');
        return response;
    },

    /**
     * Fetch all applications for a specific job (Admin/Employer)
     * @param {string} jobId 
     */
    getJobApplications: async (jobId) => {
        const response = await apiClient.get(`/jobs/${jobId}/applications`);
        return response;
    },

    /**
     * Accept a candidate's application (Admin/Employer)
     * @param {string} applicationId 
     */
    acceptApplication: async (applicationId) => {
        const response = await apiClient.patch(`/applications/${applicationId}/accept`);
        return response;
    }
};
