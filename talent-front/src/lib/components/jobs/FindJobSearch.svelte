<script>
	import { Search, X, Bookmark, Send, ChevronRight } from "@lucide/svelte";

	/**
	 * Single expandable search for the Find Job page.
	 *
	 * Desktop: a compact icon pill that smoothly expands on hover/focus.
	 * Mobile: expands to the full available width (tap to type).
	 *
	 * The suggestion panel shows POPULAR CATEGORIES first (All Jobs + real
	 * job categories) and QUICK SHORTCUTS (Saved Roles / Applied Positions)
	 * below. All counts come from the parent page's real backend data.
	 *
	 * @typedef {Object} CategoryPill
	 * @property {string} value
	 * @property {string} label
	 * @property {number} count
	 */
	let {
		query = $bindable(""),
		jobs = [], // full published job list used for live suggestions
		categories = [], // [{ value, label, count }]
		totalJobs = 0,
		savedCount = null, // null = not available (signed out)
		appliedCount = null,
		selectedCategory = "", // active category value; "" means All Jobs
		activeView = "all", // current list view: "all" | "saved" | "applied"
		loading = false,
		onSelectJob = () => {},
		onSelectCategory = () => {}, // value "" => All Jobs
		onShortcut = () => {}, // key: "saved" | "applied"
	} = $props();

	let inputEl;
	let active = $state(false);

	/** Live role/company matches shown while the user is typing. */
	let suggestions = $derived.by(() => {
		const q = String(query || "").trim().toLowerCase();
		if (!q) return [];
		return (Array.isArray(jobs) ? jobs : [])
			.filter((j) => {
				const hay = `${j.title || ""} ${j.company || ""} ${j.location || ""}`.toLowerCase();
				return hay.includes(q);
			})
			.slice(0, 6);
	});

	const hasTyped = $derived(Boolean(String(query || "").trim()));
	const inAllView = $derived(activeView === "all");

	function open() {
		active = true;
	}

	function close() {
		active = false;
	}

	/** Collapsed pill click: activate and focus the input. */
	function handlePillClick() {
		if (!active) {
			active = true;
			inputEl?.focus();
		}
	}

	function pickJob(job) {
		close();
		inputEl?.blur();
		onSelectJob(job);
	}

	function pickCategory(value) {
		close();
		inputEl?.blur();
		onSelectCategory(value);
	}

	function pickShortcut(key) {
		close();
		inputEl?.blur();
		onShortcut(key);
	}

	function clearQuery(e) {
		e.stopPropagation();
		query = "";
		inputEl?.focus();
	}

	$effect(() => {
		if (!active) return;
		const onKey = (e) => {
			if (e.key === "Escape") {
				close();
				inputEl?.blur();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
</script>

<div class="relative inline-block w-full align-top sm:w-auto" role="search">
	<!-- Expandable pill: full width on mobile, compact icon on sm+ -->
	<div
		onclick={handlePillClick}
		class="group relative flex h-11 items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out
			w-full
			sm:w-11 sm:hover:w-80 sm:focus-within:w-80
			lg:hover:w-[22rem] lg:focus-within:w-[22rem]
			{active ? 'border-indigo-300 ring-4 ring-indigo-100/70' : 'hover:border-indigo-300 hover:shadow-md'}"
	>
		<span
			class="flex h-11 w-11 shrink-0 items-center justify-center {active
				? 'text-indigo-600'
				: 'text-slate-400'}"
		>
			<Search class="h-5 w-5" />
		</span>

		<input
			bind:this={inputEl}
			bind:value={query}
			type="text"
			role="combobox"
			aria-expanded={active}
			aria-label="Search roles, jobs or companies"
			placeholder="Search roles, companies…"
			onfocusin={open}
			oninput={() => (active = true)}
			class="h-full min-w-0 flex-1 bg-transparent pr-1 text-sm text-slate-700 outline-none placeholder:text-slate-400
				{active
					? 'pointer-events-auto opacity-100'
					: 'pointer-events-none max-sm:pointer-events-auto opacity-0 max-sm:opacity-100'}"
		/>

		{#if query && active}
			<button
				type="button"
				aria-label="Clear search"
				onclick={clearQuery}
				class="mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}

		<!-- Hover preview of the placeholder on desktop while collapsed -->
		{#if !active}
			<span
				aria-hidden="true"
				class="pointer-events-none absolute inset-y-0 left-12 hidden items-center pr-3 text-sm text-slate-400 transition-opacity duration-200 sm:flex
					opacity-0 group-hover:opacity-70"
			>
				<span class="truncate">Search roles, companies…</span>
			</span>
		{/if}
	</div>

	{#if active}
		<!-- Click-away layer -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-30"
			onmousedown={() => {
				close();
				inputEl?.blur();
			}}
			aria-hidden="true"
		></div>

		<!-- Suggestion panel -->
		<div
			class="absolute left-0 right-0 top-12 z-40 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl shadow-slate-900/10 sm:left-auto sm:right-0 sm:w-[21rem]"
		>
			<div class="max-h-[min(26rem,70vh)] overflow-y-auto p-2">
				{#if loading}
					<!-- Skeleton matching the panel's final dimensions -->
					<p class="skeleton mb-2 mt-1 h-3 w-28 rounded" aria-hidden="true"></p>
					<div class="flex flex-wrap gap-1.5 px-1">
						{#each [1, 2, 3, 4] as _}
							<span class="skeleton h-8 rounded-full {_ === 1 ? 'w-24' : _ === 2 ? 'w-28' : _ === 3 ? 'w-20' : 'w-24'}"></span>
						{/each}
					</div>
					<div class="mx-1 my-2 h-px bg-slate-100" aria-hidden="true"></div>
					<div class="space-y-1.5 px-1 pb-1">
						<div class="skeleton h-11 w-full rounded-xl"></div>
						<div class="skeleton h-11 w-full rounded-xl"></div>
					</div>
				{:else if hasTyped}
					{#if suggestions.length > 0}
						<p class="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
							Matching roles
						</p>
						<div class="mt-0.5">
							{#each suggestions as job}
								<button
									type="button"
									onclick={() => pickJob(job)}
									class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50/70"
								>
									<span
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600"
									>
										{(job.company || job.title || "J").charAt(0).toUpperCase()}
									</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-sm font-semibold text-slate-700">
											{job.title}
										</span>
										<span class="block truncate text-xs text-slate-400">
											{job.company}
										</span>
									</span>
									<ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
								</button>
							{/each}
						</div>
					{:else}
						<div class="px-4 py-8 text-center">
							<p class="text-sm font-semibold text-slate-600">No matching roles</p>
							<p class="mt-1 text-xs text-slate-400">
								Try a different role, company or location.
							</p>
						</div>
					{/if}
				{:else}
					<!-- POPULAR CATEGORIES -->
					<p class="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
						Popular Categories
					</p>					<div class="flex flex-wrap gap-1.5 px-1">
						<button
							type="button"
							class="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition-all
								{inAllView && selectedCategory === ''
									? 'bg-indigo-600 text-white shadow-sm ring-indigo-600'
									: 'bg-white text-slate-600 ring-slate-200 hover:text-indigo-600 hover:ring-indigo-300'}"
							onclick={() => pickCategory("")}
						>
							<span>All Jobs</span>
							<span
								class="rounded-full px-1.5 py-0.5 text-[10px] font-bold
									{inAllView && selectedCategory === '' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}"
							>
								{totalJobs}
							</span>
						</button>
						{#each categories as c (c.value)}
							<button
								type="button"
								class="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition-all
									{inAllView && selectedCategory === c.value
										? 'bg-indigo-600 text-white shadow-sm ring-indigo-600'
										: 'bg-white text-slate-600 ring-slate-200 hover:text-indigo-600 hover:ring-indigo-300'}"
								onclick={() => pickCategory(c.value)}
							>
								<span>{c.label}</span>
								{#if c.count > 0}
									<span
											class="rounded-full px-1.5 py-0.5 text-[10px] font-bold
												{inAllView && selectedCategory === c.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}"
									>
										{c.count}
									</span>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Divider -->
					<div class="mx-1 my-2.5 h-px bg-slate-100" aria-hidden="true"></div>

					<!-- QUICK SHORTCUTS -->
					<p class="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
						Quick Shortcuts
					</p>
					<div class="mt-0.5 pb-0.5">
						{#if savedCount !== null && appliedCount !== null}
							<button
								type="button"
								onclick={() => pickShortcut("saved")}
								class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50/70"
							>
								<Bookmark class="h-4 w-4 shrink-0 text-indigo-500" />
								<span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-600">
									Saved Roles
								</span>
								<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
									{savedCount}
								</span>
							</button>
							<button
								type="button"
								onclick={() => pickShortcut("applied")}
								class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50/70"
							>
								<Send class="h-4 w-4 shrink-0 text-indigo-500" />
								<span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-600">
									Applied Positions
								</span>
								<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
									{appliedCount}
								</span>
							</button>
						{:else}
							<p class="px-3 py-2 text-xs text-slate-400">
								Sign in to track your saved roles and applications.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
