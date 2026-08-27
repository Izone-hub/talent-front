import { apiClient } from "./client";

export const questionGenerationService = {
	generate: async (prompt, questionType = "", difficulty = "") => {
		const response = await apiClient.post("/admin/generate-questions", {
			prompt,
			question_type: questionType,
			difficulty: difficulty,
		});
		return response;
	},
};
