import { apiClient } from './client';

export const cvService = {
    /**
     * Upload a new CV
     * @param {File} file 
     * @returns {Promise}
     */
    uploadCV: async (file) => {
        const formData = new FormData();
        formData.append('cv', file);
        return apiClient.post('/cv/upload', formData);
    },

    /**
     * Get the current active CV
     * @returns {Promise}
     */
    getCurrentCV: async () => {
        return apiClient.get('/cv/current');
    },

    downloadCV: async (id) => {
        try {
            const blob = await apiClient.get(`/cv/${id}/download`, {
                responseType: 'blob'
            });

            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cv-version-${id}.pdf`; // Fallback name
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading CV:', error);
            alert('Failed to download CV');
        }
    },

    /**
     * Delete a CV version
     * @param {string} id 
     * @returns {Promise}
     */
    deleteCV: async (id) => {
        return apiClient.delete(`/cv/${id}`);
    }
};
