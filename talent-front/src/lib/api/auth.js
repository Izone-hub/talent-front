import { apiClient } from './client';

export const authApi = {
    // Initiate GitHub login - redirects to GitHub
    githubLogin: () => {
        // Direct redirect to your GitHub login endpoint
        window.location.href = `${apiClient.baseUrl}/auth/github/login`;
    },

    // Get current user info (protected by your middleware)
    getCurrentUser: async () => {
        try {
            const user = await apiClient.get('/auth/me');
            return user;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    },

    // Check if user is authenticated
    checkAuth: async () => {
        try {
            const user = await apiClient.get('/auth/me');
            console.log("Raw user data from /auth/me:", user);
            return {
                authenticated: !!user,
                user: user
            };
        } catch (error) {
            return {
                authenticated: false,
                user: null
            };
        }
    }
};