/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, event, status, message }) {
	if (import.meta.env.DEV) {
		console.error(`[Client Error] ${status}:`, error);
	}
	return {
		message: status === 404 ? 'Not found' : status === 403 ? 'Access denied' : 'An unexpected error occurred',
	};
}
