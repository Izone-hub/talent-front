/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, event, status, message }) {
	if (import.meta.env.DEV) {
		console.error(`[Server Error] ${status}:`, error);
	}
	return {
		message: status === 404 ? 'Not found' : status === 403 ? 'Access denied' : 'An unexpected error occurred',
	};
}
