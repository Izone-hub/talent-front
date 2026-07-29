import { apiClient } from './client';

export const intelligenceService = {
    /**
     * Fetch GitHub intelligence data.
     * @param {string} id - Quiz attempt ID (from quiz result page) or user ID (from admin detail page).
     *                        The backend resolves the user internally.
     */
    fetchGitHubIntelligence: async (id) => {
        const response = await apiClient.post(`/intelligence/github/${id}/fetch`);
        return response;
    }
};
