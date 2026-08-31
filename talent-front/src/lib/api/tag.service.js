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
    },

    /**
     * Assign multiple tags to a single job by tag names
     * Looks up each tag by name and assigns it to the job
     * @param {string} jobId 
     * @param {string[]} tagNames 
     * @param {Tag[]} allTags - Full list of available tags for ID lookup
     * @returns {Promise<Array>}
     */
    /**
     * Get jobs assigned to a specific tag
     * @param {string} tagId
     * @returns {Promise<Object>} - { jobs: [], limit, offset }
     */
    getTagJobs: async (tagId) => {
        try {
            const response = await apiClient.get(`/tags/${tagId}/jobs`);
            return response || { jobs: [] };
        } catch (error) {
            console.error(`Failed to get jobs for tag ${tagId}:`, error);
            return { jobs: [] };
        }
    },

    /**
     * Get questions linked to a specific tag
     * @param {string} tagId
     * @returns {Promise<Object>} - { questions: [], limit, offset }
     */
    getTagQuestions: async (tagId) => {
        try {
            const response = await apiClient.get(`/tags/${tagId}/questions`);
            return response || { questions: [] };
        } catch (error) {
            console.error(`Failed to get questions for tag ${tagId}:`, error);
            return { questions: [] };
        }
    },

    assignTagsToJob: async (jobId, tagNames, allTags = []) => {
        const promises = tagNames.map(async (tagName) => {
            // Find the tag object from the full list to get its ID
            const tagObj = allTags.find(
                (t) => (t.name || t.Name || '').toLowerCase() === tagName.toLowerCase()
            );
            const tagId = tagObj?.id || tagObj?.ID;
            if (tagId) {
                return apiClient.post('/tags/assign', { tag_id: tagId, job_id: jobId });
            } else {
                // Fallback: assign by name if ID not found
                return apiClient.post('/tags/assign', { tag_name: tagName, job_id: jobId });
            }
        });
        return Promise.allSettled(promises);
    }
};