// fetch wrappper
import { PUBLIC_API_BASE_URL } from '$env/static/public'

export async function apiFetch(endpoint, options = {}) {
	const res = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {})
		},
		...options
	})

	if (!res.ok) {
		const error = await res.text()
		throw new Error(error || 'API request failed')
	}

	return res.json()
}
