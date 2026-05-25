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
     * List all questions
     * @returns {Promise<Question[]>}
     */
    listQuestions: async () => {
        try {
            const response = await apiClient.get("/questions");
            return response?.questions || [];
        } catch (error) {
            console.error("Failed to list questions:", error);
            throw error;
        }
    }
};