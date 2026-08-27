import { apiClient } from './client';

export const jobDescriptionService = {
	generate: async (prompt, companyName = '') => {
		const response = await apiClient.post('/admin/generate-job-description', {
			prompt,
			company_name: companyName
		});
		return response;
	},

	enhanceJobPost: async (jobData) => {
		const prompt = `You are an expert job posting writer. Enhance and optimize the following job posting for a professional job board. Return a JSON object with these fields: title, description, requirements (newline-separated string), responsibilities, benefits, job_type, experience_level, salary_min, salary_max, salary_currency, remote_possible (boolean).

Current job posting data:
Title: ${jobData.title || ''}
Description: ${jobData.description || ''}
Requirements: ${jobData.requirements || ''}
Responsibilities: ${jobData.responsibilities || ''}
Benefits: ${jobData.benefits || ''}
Job Type: ${jobData.job_type || ''}
Experience Level: ${jobData.experience_level || ''}
Salary Min: ${jobData.salary_min || ''}
Salary Max: ${jobData.salary_max || ''}
Salary Currency: ${jobData.salary_currency || ''}
Remote: ${jobData.remote_possible || false}

Instructions: Improve the title to be more compelling, make the description more engaging and professional, ensure requirements are specific and well-structured as a bulleted list, make responsibilities clear and actionable. Keep the same salary range and job type. Return ONLY the JSON object with no extra text.`;

		const response = await apiClient.post('/admin/generate-job-description', {
			prompt
		});
		return response;
	}
};
