<script>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { NAVIGATION_LINKS } from "$lib/constants/navigation";
	import IZoneLogo from "$lib/assets/icons/IZone-logo.png";
	import GetStartModal from "$lib/components/modals/getstart-modal.svelte";
	import { auth } from "$lib/stores/authStore";

	let isGetStartModalOpen = false;
</script>

<nav
	class="sticky top-0 z-50 w-full border-b border-gray-200 bg-gray-50 opacity-90"
>
	<div
		class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
	>
		<!-- Left: Logo -->
		<div class="flex items-center gap-2">
			<img src={IZoneLogo} alt="Talent izone" class="h-7 w-auto" />
			<div class="flex flex-col leading-tight">
				<span class="text-lg font-bold text-purple-700">Talent</span>
				<span class="text-xs text-gray-500">connect your first job</span
				>
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
			{#if $auth.loading}
				<div
					class="loading loading-spinner loading-md text-purple-600"
				></div>
			{:else if $auth.isAuthenticated}
				<div class="dropdown dropdown-end">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div
						tabindex="0"
						role="button"
						class="avatar btn btn-circle btn-ghost"
						aria-label="User menu"
					>
						<div class="w-10 rounded-full border border-purple-200">
							<!-- Display user avatar if available, otherwise fallback -->
							{#if $auth.user?.avatar_url}
								<img
									alt="User Avatar"
									src={$auth.user.avatar_url}
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-purple-100 text-purple-700 font-bold"
								>
									{$auth.user?.name
										? $auth.user.name
												.charAt(0)
												.toUpperCase()
										: "U"}
								</div>
							{/if}
						</div>
					</div>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul
						tabindex="0"
						class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
					>
						<li>
							<a href="/profile" class="justify-between">
								Profile
								<span class="badge badge-primary badge-sm"
									>New</span
								>
							</a>
						</li>
						<li><a href="/applications">My Applications</a></li>
						<li>
							<button on:click={() => auth.logout()}
								>Logout</button
							>
						</li>
					</ul>
				</div>
			{:else}
				<button
					type="button"
					on:click={() => (isGetStartModalOpen = true)}
					class="rounded-md border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-600 hover:text-white"
				>
					Get Started
				</button>
			{/if}
		</div>
	</div>
</nav>

<GetStartModal
	isOpen={isGetStartModalOpen}
	on:close={() => (isGetStartModalOpen = false)}
/>
