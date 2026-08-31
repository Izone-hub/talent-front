import { apiClient } from './client';

export const surveyService = {
    /**
     * Admin: Replace all screening questions for a job
     * @param {string} jobId
     * @param {Array<{question_text: string, expected_answer: boolean}>} questions
     * @returns {Promise<{questions: Array, total: number}>}
     */
    upsertQuestions: async (jobId, questions) => {
        try {
            const response = await apiClient.put(`/jobs/${jobId}/survey-questions`, { questions });
            return response;
        } catch (error) {
            console.error('Failed to save survey questions:', error);
            throw error;
        }
    },

    /**
     * Get screening questions for a job
     * @param {string} jobId
     * @returns {Promise<{questions: Array<{id: string, question_text: string, expected_answer: boolean}>, total: number}>}
     */
    getQuestions: async (jobId) => {
        try {
            const response = await apiClient.get(`/jobs/${jobId}/survey-questions`);
            return response;
        } catch (error) {
            console.error('Failed to fetch survey questions:', error);
            throw error;
        }
    },

    /**
     * Submit screening answers for a job
     * @param {string} jobId
     * @param {Object<string, boolean>} answers - question_id -> answer (true=Yes, false=No)
     * @returns {Promise<{passed: boolean, message: string, results: Array}>}
     */
    submitAnswers: async (jobId, answers) => {
        try {
            const response = await apiClient.post(`/jobs/${jobId}/apply-survey`, { answers });
            return response;
        } catch (error) {
            console.error('Failed to submit survey answers:', error);
            throw error;
        }
    },

    /**
     * Admin: Delete a single screening question
     * @param {string} jobId
     * @param {string} questionId
     */
    deleteQuestion: async (jobId, questionId) => {
        try {
            await apiClient.delete(`/jobs/${jobId}/survey-questions/${questionId}`);
        } catch (error) {
            console.error('Failed to delete survey question:', error);
            throw error;
        }
    },
};
