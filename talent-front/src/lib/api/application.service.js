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

    acceptApplication: async (applicationId) => {
        try {
            const response = await apiClient.patch(`/applications/${applicationId}/accept`);
            return response;
        } catch (error) {
            console.error('Failed to accept application:', error);
            throw error;
        }
    },

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
    },

    startReview: async (applicationId) => {
        return apiClient.patch(`/applications/${applicationId}/review`);
    },

    shortlistApplication: async (applicationId) => {
        return apiClient.patch(`/applications/${applicationId}/shortlist`);
    },

    markInterviewed: async (applicationId) => {
        return apiClient.patch(`/applications/${applicationId}/interview`);
    },

    withdrawApplication: async (applicationId) => {
        return apiClient.patch(`/applications/${applicationId}/withdraw`);
    },

    addEmployerFeedback: async (applicationId, feedback) => {
        return apiClient.patch(`/applications/${applicationId}/feedback`, { feedback });
    },

    getRecentApplications: async () => {
        const response = await apiClient.get('/applications/recent');
        return response || [];
    },

    listByStatus: async (status) => {
        const response = await apiClient.get(`/applications/status/${status}`);
        return response || [];
    },

    getApplicationCountsByJob: async (jobId) => {
        const response = await apiClient.get(`/jobs/${jobId}/applications/counts`);
        return response;
    }
};
