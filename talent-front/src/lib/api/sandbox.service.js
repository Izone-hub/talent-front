import { apiClient } from "./client";

export const sandboxService = {
	getLanguages: async () => {
		const response = await apiClient.get("/sandbox/languages");
		return response?.languages || [];
	},

	execute: async (language, code, stdin = "") => {
		const response = await apiClient.post("/sandbox/execute", {
			language,
			code,
			type: "standard",
			stdin,
			time_limit: 30,
			memory_limit: 256,
		});
		return response;
	},

	parse: async (language, code) => {
		const response = await apiClient.post("/sandbox/parse", {
			language,
			code,
		});
		return response;
	},

	executeFunction: async (language, code, testCases) => {
		const response = await apiClient.post("/sandbox/execute", {
			language,
			code,
			type: "function",
			stdin: JSON.stringify(testCases),
			time_limit: 30,
			memory_limit: 256,
		});
		return response;
	},

	executeFramework: async (language, files) => {
		const response = await apiClient.post("/sandbox/execute", {
			language,
			type: "framework",
			files,
			time_limit: 120,
			memory_limit: 512,
		});
		return response;
	},
};
