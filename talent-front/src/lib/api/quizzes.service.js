import { apiClient } from './client.js';

export const quizService = {
    async listQuizzes() {
        return await apiClient.get('/quizzes');
    },
    async getQuiz(id) {
        return await apiClient.get(`/quizzes/${id}`);
    },
    async startQuiz(id, data) {
        return await apiClient.post(`/quizzes/${id}/start`, data);
    },
    async getQuizQuestions(id) {
        return await apiClient.get(`/quizzes/${id}/questions`);
    },
    async getQuizQuestion(id) {
        return await apiClient.get(`/quizzes/${id}/question`);
    },
    async saveAnswer(id, data) {
        return await apiClient.post(`/quizzes/${id}/answer`, data);
    },
    async runCode(id, data) {
        return await apiClient.post(`/quizzes/${id}/run-code`, data);
    },
    async submitQuiz(id) {
        return await apiClient.post(`/quizzes/${id}/submit`);
    }
};
