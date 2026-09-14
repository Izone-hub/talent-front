import { apiClient } from './client';

export const applicationService = {
    // The backend already filters, joins and aggregates: /applications/my
    // returns { applications, stats }. getMyApplications keeps the legacy
    // array contract for consumers that only need the list.
    getMyApplications: async () => {
        const overview = await apiClient.get('/applications/my');
        return overview && Array.isArray(overview.applications) ? overview.applications : [];
    },

    // Structured payload for the My Applications dashboard: UI-ready rows plus
    // precomputed stats (total / active / accepted / rejected).
    getMyApplicationsOverview: async () => {
        const overview = await apiClient.get('/applications/my');
        return {
            applications: overview && Array.isArray(overview.applications) ? overview.applications : [],
            stats: overview?.stats || { total: 0, active: 0, accepted: 0, rejected: 0 },
        };
    },

    getApplicationDetail: async (id) => {
        const response = await apiClient.get(`/applications/${id}`);
        return response;
    },

    getCandidateFeedback: async (id) => {
        try {
            return await apiClient.get(`/admin/applications/${id}/feedback`);
        } catch (error) {
            console.warn('Failed to load candidate feedback:', error);
            return null;
        }
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
    },

    // Admin Applications overview: one aggregate request that returns every
    // published job with its per-job application counters, the summary stats
    // and the quiz-completed candidates - all computed server-side.
    getAdminApplicationsOverview: async () => {
        const response = await apiClient.get('/admin/applications/overview');
        return {
            jobs: response?.jobs || [],
            quizCandidates: response?.quiz_candidates || [],
            summary: response?.summary || {
                total_applicants: 0,
                quiz_done: 0,
                shortlisted: 0,
                accepted: 0,
            },
        };
    }
};
