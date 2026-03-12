// Base API client with authentication handling
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
	constructor() {
		this.baseUrl = API_BASE_URL;
	}

	async request(endpoint, options = {}) {
		const url = `${this.baseUrl}${endpoint}`;

		const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

		const isFormData = options.body instanceof FormData;

		const defaultOptions = {
			credentials: 'include',
			headers: {
				...(isFormData ? {} : { 'Content-Type': 'application/json' }),
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
				...options.headers,
			},
		};

		const fetchOptions = {
			...defaultOptions,
			...options,
			headers: {
				...defaultOptions.headers,
				...options.headers,
			},
		};

		try {
			const response = await fetch(url, fetchOptions);

			if (response.status === 401) {
				// Don't throw or redirect, let caller handle 401 logic
				this.handleUnauthorized();
				return null;
			}

			// Check if we want a blob (for downloads)
			if (options.responseType === 'blob') {
				return response.blob();
			}

			// Parse JSON response
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'API request failed');
			}

			return data;
		} catch (error) {
			console.error(`API Error (${endpoint}):`, error);
			throw error;
		}
	}

	// Convenience methods
	get(endpoint, options = {}) {
		return this.request(endpoint, { ...options, method: 'GET' });
	}

	post(endpoint, body, options = {}) {
		return this.request(endpoint, {
			...options,
			method: 'POST',
			body: body instanceof FormData ? body : JSON.stringify(body),
		});
	}

	put(endpoint, body, options = {}) {
		return this.request(endpoint, {
			...options,
			method: 'PUT',
			body: body instanceof FormData ? body : JSON.stringify(body),
		});
	}
	patch(endpoint, body, options = {}) {
		return this.request(endpoint, {
			...options,
			method: 'PATCH',
			body: body instanceof FormData ? body : JSON.stringify(body),
		});
	}

	delete(endpoint, options = {}) {
		return this.request(endpoint, { ...options, method: 'DELETE' });
	}

	handleUnauthorized() {
		// Log auth failure, but don't redirect automatically to avoid infinite loops
		console.warn('Unauthorized request detected');
	}
}

export const apiClient = new ApiClient();