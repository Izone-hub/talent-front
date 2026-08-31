import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		sveltekit(),
	],
	optimizeDeps: {
		include: ['lucide-svelte', 'svelte-codemirror-editor', 'codemirror', '@codemirror/lang-javascript', '@codemirror/lang-python', '@codemirror/lang-go', '@codemirror/lang-java', '@codemirror/lang-cpp', '@codemirror/lang-rust', '@codemirror/lang-sql', '@codemirror/theme-one-dark', '@codemirror/state', '@codemirror/view']
	},
	ssr: {
		noExternal: ['lucide-svelte']
	}
})
