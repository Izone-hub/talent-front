<script>
	import { goto } from '$app/navigation'
	import { createEventDispatcher } from 'svelte'
	import { ArrowBigRight } from 'lucide-svelte'

	export let isOpen = false

	import { auth } from '$lib/stores/authStore'

	const dispatch = createEventDispatcher()

	function close() {
		dispatch('close')
	}

	function handleContinue() {
		if ($auth.isAuthenticated) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto('/jobs')
			close()
		} else {
			auth.loginWithGithub()
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="modal {isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle" role="dialog">
	<div class="relative modal-box max-w-5xl text-center">
		<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" on:click={close}
			>✕</button
		>

		<div class="mb-4 flex justify-center">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-8 w-8"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
			</div>
		</div>

		<h3 class="text-lg font-bold">Start with your GitHub Account</h3>
		<p class="py-4 text-base-content/70">
			Browse through hundreds of active job listings tailored to your skills and get started on your
			new career path today.
		</p>

		<div class="mx-auto modal-action max-w-lg items-center justify-center">
			<button class="btn w-full btn-primary" on:click={handleContinue}
				>Continue with GitHub <ArrowBigRight class="ml-2 inline-block h-4 w-4" /></button
			>
		</div>
	</div>

	<!-- svelte-ignore a11y_label_has_associated_control -->
	<label class="modal-backdrop" on:click={close}>Close</label>
</div>
