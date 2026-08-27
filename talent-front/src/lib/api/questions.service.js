import { apiClient } from "./client";

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question_text
 * @property {string} category
 * @property {string} question_type
 * @property {string[]} [options]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {number} time_limit_seconds
 * @property {number} max_attempts
 * @property {number} difficulty_level
 * @property {string} status
 */

export const questionService = {
    /**
     * Create a new question
     * @param {Object} questionData 
     * @returns {Promise<Question>}
     */
    createQuestion: async (questionData) => {
        try {
            const response = await apiClient.post("/questions", questionData);
            return response;
        } catch (error) {
            console.error("Failed to create question:", error);
            throw error;
        }
    },

    /**
     * Get a specific question by ID
     * @param {string} id 
     * @returns {Promise<Question>}
     */
    getQuestion: async (id) => {
        try {
            const response = await apiClient.get(`/questions/${id}`);
            return response;
        } catch (error) {
            console.error(`Failed to get question with id ${id}:`, error);
            throw error;
        }
    },

    /**
     * Update an existing question
     * @param {string} id 
     * @param {Object} questionData 
     * @returns {Promise<Question>}
     */
    updateQuestion: async (id, questionData) => {
        try {
            const response = await apiClient.put(`/questions/${id}`, questionData);
            return response;
        } catch (error) {
            console.error(`Failed to update question with id ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a question
     * @param {string} id 
     */
    deleteQuestion: async (id) => {
        try {
            const response = await apiClient.delete(`/questions/${id}`);
            return response;
        } catch (error) {
            console.error(`Failed to delete question with id ${id}:`, error);
            throw error;
        }
    },

    /**
     * List questions with pagination and search
     * @param {number} limit 
     * @param {number} offset 
     * @param {string} search 
     * @returns {Promise<{questions: Question[], total: number, limit: number, offset: number}>}
     */
    listQuestions: async (limit = 20, offset = 0, search = "") => {
        try {
            const params = new URLSearchParams({ limit, offset });
            if (search) params.set("search", search);
            const response = await apiClient.get(`/questions?${params.toString()}`);
            return response;
        } catch (error) {
            console.error("Failed to list questions:", error);
            throw error;
        }
    },

    /**
     * Test code against a coding challenge question
     * @param {string} id
     * @param {string} code
     * @returns {Promise<{stdout: string, stderr: string, exit_code: number, passed: boolean}>}
     */
    testQuestion: async (id, code) => {
        try {
            const response = await apiClient.post(`/questions/${id}/test`, { code });
            return response;
        } catch (error) {
            console.error(`Failed to test question ${id}:`, error);
            throw error;
        }
    },

    /**
     * Validate code against all test cases for a coding challenge question
     * @param {string} id
     * @param {string} code
     * @returns {Promise<{question_id: string, language: string, total_passed: number, total_failed: number, total_cases: number, all_passed: boolean, test_results: Array}>}
     */
    validateQuestion: async (id, code) => {
        try {
            const response = await apiClient.post(`/questions/${id}/validate`, { code });
            return response;
        } catch (error) {
            console.error(`Failed to validate question ${id}:`, error);
            throw error;
        }
    }
};