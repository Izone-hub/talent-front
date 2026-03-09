<script>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { NAVIGATION_LINKS } from '$lib/constants/navigation'
	import IZoneLogo from '$lib/assets/icons/IZone-logo.png'
	import GetStartModal from '$lib/components/modals/getstart-modal.svelte'

	let isGetStartModalOpen = false
</script>

<nav class="sticky top-0 z-50 w-full border-b border-gray-200 bg-gray-50 opacity-90">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Left: Logo -->
		<div class="flex items-center gap-2">
			<img src={IZoneLogo} alt="Talent izone" class="h-7 w-auto" />
			<div class="flex flex-col leading-tight">
				<span class="text-lg font-bold text-purple-700">Talent</span>
				<span class="text-xs text-gray-500">connect your first job</span>
			</div>
		</div>

		<!-- Center: Navigation -->
		<ul class="hidden items-center gap-6 md:flex">
			{#each NAVIGATION_LINKS as link (link.name)}
				<li>
					<a
						href={link.path}
						class="text-sm font-medium text-gray-700 transition-colors hover:text-purple-700"
					>
						{link.name}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Right: Actions -->
		<div class="flex items-center gap-4">
			<button
				type="button"
				on:click={() => (isGetStartModalOpen = true)}
				class="rounded-md border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-600 hover:text-white"
			>
				Get Started
			</button>
		</div>
	</div>
</nav>

<GetStartModal isOpen={isGetStartModalOpen} on:close={() => (isGetStartModalOpen = false)} />
