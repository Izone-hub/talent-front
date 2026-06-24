import { apiClient } from './client.js';

export const quizService = {
    async listQuizzes() {
        return await apiClient.get('/quizzes');
    },
    async getQuiz(id) {
        return await apiClient.get(`/quizzes/${id}`);
    },
    async startQuiz(id) {
        return await apiClient.post(`/quizzes/${id}/start`);
    },
    async getQuizQuestions(id) {
        return await apiClient.get(`/quizzes/${id}/questions`);
    },
    async saveAnswer(id, data) {
        return await apiClient.post(`/quizzes/${id}/answer`, data);
    },
    async submitQuiz(id) {
        return await apiClient.post(`/quizzes/${id}/submit`);
    }
};
