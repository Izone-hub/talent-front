import { apiClient } from "./client";

/**
 * @typedef {Object} Tag
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {string} color
 * @property {string} created_at
 * @property {string} updated_at
 */

export const tagService = {
    /**
     * Fetch all tags
     * @returns {Promise<Tag[]>}
     */
    listTags: async () => {
        try {
            const response = await apiClient.get('/tags');
            console.log("tag list:", response);
            return response?.tags || [];
        } catch (error) {
            console.error('Failed to list tags:', error);
            throw error;
        }
    },

    /**
     * Fetch a specific tag by ID
     * @param {string} id 
     * @returns {Promise<Tag>}
     */
    getTag: async (id) => {
        try {
            const response = await apiClient.get(`/tags/${id}`);
            return response;
        } catch (error) {
            console.error(`Failed to get tag with id ${id}:`, error);
            throw error;
        }
    },

    /** Admin Features **/

    createTag: async (tagData) => {
        const response = await apiClient.post('/tags', tagData);
        return response;
    },

    updateTag: async (id, tagData) => {
        const response = await apiClient.put(`/tags/${id}`, tagData);
        return response;
    },

    deleteTag: async (id) => {
        const response = await apiClient.delete(`/tags/${id}`);
        return response;
    },

    /**
     * Assign a tag to multiple jobs
     * @param {string} tagId 
     * @param {string[]} jobIds 
     */
    assignJobs: async (tagId, jobIds) => {
        // It seems the backend expects a singular job_id and tag_id per request
        const promises = jobIds.map(jobId =>
            apiClient.post(`/tags/assign`, { tag_id: tagId, job_id: jobId })
        );
        return Promise.all(promises);
    },

    removeTagFromJob: async (tagId, jobId) => {
        const response = await apiClient.post(`/tags/remove`, {
            tag_id: tagId,
            job_id: jobId
        });
        return response;
    }
};