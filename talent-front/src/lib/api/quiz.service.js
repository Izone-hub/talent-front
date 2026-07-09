import { apiClient } from './client';

export const quizService = {
    getQuiz: async (quizId) => {
        return apiClient.get(`/quizzes/${quizId}`);
    },

    startQuiz: async (quizId, applicationId, jobId) => {
        return apiClient.post(`/quizzes/${quizId}/start`, {
            application_id: applicationId,
            job_id: jobId,
        });
    },

    getQuestion: async (quizId) => {
        return apiClient.get(`/quizzes/${quizId}/question`);
    },

    saveAnswer: async (quizId, questionId, userAnswer, timeSpentSeconds, isSkipped) => {
        return apiClient.post(`/quizzes/${quizId}/answer`, {
            question_id: questionId,
            user_answer: userAnswer,
            time_spent_seconds: timeSpentSeconds,
            is_skipped: isSkipped,
        });
    },

    runCode: async (quizId, questionId, language, code) => {
        return apiClient.post(`/quizzes/${quizId}/run-code`, {
            question_id: questionId,
            language,
            code,
        });
    },

    submitQuiz: async (quizId) => {
        return apiClient.post(`/quizzes/${quizId}/submit`);
    },
};
