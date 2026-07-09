import { apiClient } from './client';

export const intelligenceService = {
    fetchGitHubIntelligence: async (userId) => {
        const response = await apiClient.post(`/intelligence/github/${userId}/fetch`);
        return response;
    }
};
