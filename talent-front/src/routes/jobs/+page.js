import { jobService } from '$lib/api/job.service';

/** @type {import('./$types').PageLoad} */
export async function load() {
    try {
        const jobs = await jobService.listPublishedJobs();
        return {
            jobs: jobs || []
        };
    } catch (error) {
        console.error('Error loading jobs:', error);
        // Fallback or let error handling handle it
        return {
            jobs: [],
            error: 'Failed to load jobs'
        };
    }
}
