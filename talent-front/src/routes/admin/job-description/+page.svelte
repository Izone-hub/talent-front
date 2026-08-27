<script>
	import { Sparkles, Copy, Check, RotateCcw } from 'lucide-svelte';
	import { jobDescriptionService } from '$lib/api/jobDescription.service';
	import { showToast } from '$lib/stores/toast';
	import PageLoader from '$lib/components/ui/PageLoader.svelte';

	let prompt = $state('');
	let companyName = $state('');
	let generating = $state(false);
	let result = $state(null);
	let copied = $state(false);

	async function generate() {
		if (!prompt.trim()) {
			showToast('Please enter a job description prompt', 'error');
			return;
		}
		generating = true;
		result = null;
		try {
			const data = await jobDescriptionService.generate(prompt, companyName);
			result = data.job_description;
		} catch (error) {
			showToast(error.message || 'Failed to generate job description', 'error');
		} finally {
			generating = false;
		}
	}

	function copyToClipboard() {
		if (!result) return;
		const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
		navigator.clipboard.writeText(text);
		copied = true;
		showToast('Copied to clipboard', 'success');
		setTimeout(() => (copied = false), 2000);
	}

	function reset() {
		prompt = '';
		companyName = '';
		result = null;
		copied = false;
	}

	function formatResult(result) {
		if (result && typeof result === 'object' && result.raw) {
			try {
				return JSON.parse(result.raw);
			} catch {
				return result.raw;
			}
		}
		if (typeof result === 'string') {
			try {
				return JSON.parse(result);
			} catch {
				return result;
			}
		}
		return result;
	}
</script>

<div class="space-y-8 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-semibold text-gray-900 tracking-tight">
				Job Description Generator
			</h1>
			<p class="text-gray-500 mt-1 text-sm">
				Generate AI-powered job descriptions for your open positions.
			</p>
		</div>
	</div>

	<!-- Form -->
	<div class="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
		<div>
			<label for="company" class="block text-sm font-medium text-gray-700 mb-1">
				Company Name <span class="text-gray-400">(optional)</span>
			</label>
			<input
				id="company"
				type="text"
				bind:value={companyName}
				placeholder="e.g. IZONE"
				class="input input-bordered w-full"
			/>
		</div>

		<div>
			<label for="prompt" class="block text-sm font-medium text-gray-700 mb-1">
				Describe the Role
			</label>
			<textarea
				id="prompt"
				bind:value={prompt}
				placeholder="e.g. Senior React Developer with 5+ years experience, remote position, building accessible UI components, working with TypeScript and Next.js..."
				class="textarea textarea-bordered w-full h-32 resize-none"
			></textarea>
		</div>

		<div class="flex gap-2">
			<button
				class="btn btn-primary"
				onclick={generate}
				disabled={generating || !prompt.trim()}
			>
				{#if generating}
					<span class="loading loading-spinner loading-sm"></span>
					Generating...
				{:else}
					<Sparkles class="w-4 h-4" />
					Generate
				{/if}
			</button>
			<button class="btn btn-ghost" onclick={reset} disabled={generating}>
				<RotateCcw class="w-4 h-4" />
				Reset
			</button>
		</div>
	</div>

	<!-- Result -->
	{#if result}
		{@const formatted = formatResult(result)}
		<div class="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Generated Job Description</h2>
				<button class="btn btn-sm btn-ghost" onclick={copyToClipboard}>
					{#if copied}
						<Check class="w-4 h-4 text-green-500" />
						Copied
					{:else}
						<Copy class="w-4 h-4" />
						Copy
					{/if}
				</button>
			</div>

			{#if typeof formatted === 'object' && formatted !== null}
				<!-- Title -->
				{#if formatted.title}
					<h3 class="text-xl font-bold text-purple-600">{formatted.title}</h3>
				{/if}

				<!-- Meta badges -->
				<div class="flex flex-wrap gap-2">
					{#if formatted.job_type}
						<span class="badge badge-primary">{formatted.job_type}</span>
					{/if}
					{#if formatted.experience_level}
						<span class="badge badge-secondary">{formatted.experience_level}</span>
					{/if}
					{#if formatted.location}
						<span class="badge badge-outline">{formatted.location}</span>
					{/if}
					{#if formatted.remote_possible}
						<span class="badge badge-success">Remote Possible</span>
					{/if}
					{#if formatted.salary_min || formatted.salary_max}
						<span class="badge badge-info">
							{formatted.salary_currency || 'USD'}
							{formatted.salary_min?.toLocaleString() || '?'} - {formatted.salary_max?.toLocaleString() || '?'}
						</span>
					{/if}
				</div>

				<!-- Description -->
				{#if formatted.description}
					<div class="prose prose-sm max-w-none text-gray-700">
						{formatted.description}
					</div>
				{/if}

				<!-- Requirements -->
				{#if formatted.requirements}
					<div>
						<h4 class="font-semibold text-gray-900 mb-2">Requirements</h4>
						<div class="text-sm text-gray-700 whitespace-pre-line">{formatted.requirements}</div>
					</div>
				{/if}

				<!-- Responsibilities -->
				{#if formatted.responsibilities}
					<div>
						<h4 class="font-semibold text-gray-900 mb-2">Responsibilities</h4>
						<div class="text-sm text-gray-700 whitespace-pre-line">{formatted.responsibilities}</div>
					</div>
				{/if}

				<!-- Benefits -->
				{#if formatted.benefits}
					<div>
						<h4 class="font-semibold text-gray-900 mb-2">Benefits</h4>
						<div class="text-sm text-gray-700 whitespace-pre-line">{formatted.benefits}</div>
					</div>
				{/if}
			{:else}
				<pre class="text-sm text-gray-700 whitespace-pre-wrap">{formatted}</pre>
			{/if}
		</div>
	{/if}
</div>
