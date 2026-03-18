import { apiClient } from './client';

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} description
 * @property {string} requirements
 * @property {string} job_type
 * @property {string} experience_level
 * @property {string} location
 * @property {boolean} remote_possible
 * @property {number} salary_min
 * @property {number} salary_max
 * @property {string} salary_currency
 * @property {string} status
 * @property {string} published_at
 * @property {string} expires_at
 * @property {number} [views_count]
 * @property {number} [applications_count]
 * @property {string} created_at
 * @property {string} updated_at
 */

export const jobService = {
    /**
     * Fetch all published jobs
     * @returns {Promise<Job[]>}
     */
    listPublishedJobs: async () => {
        try {
            const response = await apiClient.get('/jobs');
            // User provided response has { jobs: [], total: X, ... }
            return response?.jobs || [];
        } catch (error) {
            console.error('Failed to list published jobs:', error);
            throw error;
        }
    },

    /**
     * Fetch a specific published job by ID
     * @param {string} id 
     * @returns {Promise<Job>}
     */
    getPublishedJob: async (id) => {
        try {
            const response = await apiClient.get(`/jobs/${id}`);
            return response;
        } catch (error) {
            console.error(`Failed to get job with id ${id}:`, error);
            throw error;
        }
    },

    /** Admin Features **/

    createJob: async (jobData) => {
        const response = await apiClient.post('/jobs', jobData);
        return response;
    },

    listMyJobs: async () => {
        const response = await apiClient.get('/jobs/my');
        return response?.jobs || [];
    },

    updateJob: async (id, jobData) => {
        const response = await apiClient.put(`/jobs/${id}`, jobData);
        return response;
    },

    publishJob: async (id) => {
        const response = await apiClient.patch(`/jobs/${id}/publish`);
        return response;
    },

    closeJob: async (id) => {
        const response = await apiClient.patch(`/jobs/${id}/close`);
        return response;
    },

    archiveJob: async (id) => {
        const response = await apiClient.patch(`/jobs/${id}/archive`);
        return response;
    }
};
