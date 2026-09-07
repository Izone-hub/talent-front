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
    },

    // Latest stored AI summary for a user (reads from the DB, no live GitHub
    // call). Returns { summary, strengths, weaknesses, ... } where summary is
    // the raw analyzer payload containing the analysis section.
    getUserSummary: async (userId) => {
        return apiClient.get(`/intelligence/user/${userId}/summary`);
    }
};
