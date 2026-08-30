<script>
	import { onMount } from "svelte";
	import { auth } from "$lib/stores/authStore";
	import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
	import { jobService } from "$lib/api/job.service";
	import { savedJobService } from "$lib/api/savedJob.service";
	import { applicationService } from "$lib/api/application.service";
	import {
		Search,
		MapPin,
		Briefcase,
		Building2,
		Bookmark,
		ChevronRight,
		ChevronDown,
		Globe,
		LayoutGrid,
		Sparkles,
		X,
	} from "@lucide/svelte";

	let { data } = $props();

	/** @type {any[]} */
	let allJobs = $state([]);
	/** @type {any[]} */
	let savedJobs = $state([]);
	/** @type {any[]} */
	let appliedJobs = $state([]);
	let isLoadingJobs = $state(true);
	let activeTab = $state("all");
	let categoryFilter = $state("");
	let searchQuery = $state("");

	let selectedJob = $state(null);
	let isLoadingDetail = $state(false);

	const CATEGORIES = [
		{ value: "full_stack_developer", label: "Full Stack Developer" },
		{ value: "web_developer", label: "Web Developer" },
		{ value: "frontend_developer", label: "Frontend Developer" },
		{ value: "backend_developer", label: "Backend Developer" },
		{ value: "system_architect", label: "System Architect" },
		{ value: "mobile_developer", label: "Mobile Developer" },
	];

	const CATEGORY_STYLES = {
		full_stack_developer: { label: "Full Stack", cls: "bg-violet-50 text-violet-700 ring-violet-200/70" },
		web_developer: { label: "Web Developer", cls: "bg-sky-50 text-sky-700 ring-sky-200/70" },
		frontend_developer: { label: "Frontend", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
		backend_developer: { label: "Backend", cls: "bg-teal-50 text-teal-700 ring-teal-200/70" },
		system_architect: { label: "System Architect", cls: "bg-amber-50 text-amber-700 ring-amber-200/70" },
		mobile_developer: { label: "Mobile", cls: "bg-rose-50 text-rose-700 ring-rose-200/70" },
	};

	const JOB_TYPES = {
		"full-time": "Full Time",
		"part-time": "Part Time",
		contract: "Contract",
		freelance: "Freelance",
		internship: "Internship",
	};

	const statusOrder = {
		accepted: 0, shortlisted: 1, interviewed: 2, under_review: 3,
		quiz_completed: 4, quiz_started: 5, submitted: 6,
		rejected: 7, withdrawn: 8, not_applied: 9,
	};

	async function loadPublishedJobs() {
		isLoadingJobs = true;
		try {
			const [result, myApps] = await Promise.all([
				jobService.listPublishedJobs(""),
				$auth.isAuthenticated
					? applicationService.getMyApplications().catch(() => [])
					: Promise.resolve([]),
			]);
			const apps = Array.isArray(myApps) ? myApps : [];
			const appStatusMap = {};
			for (const a of apps) {
				appStatusMap[a.JobID] = { applied: true, status: a.Status, application_id: a.ID };
			}
			let list = (Array.isArray(result) ? result : []).map((j) => ({
				...j,
				user_application: appStatusMap[j.id] || j.user_application || { applied: false },
			}));
			list.sort((a, b) => {
				const aS = a.user_application?.applied ? a.user_application.status || "submitted" : "not_applied";
				const bS = b.user_application?.applied ? b.user_application.status || "submitted" : "not_applied";
				return (statusOrder[aS] ?? 9) - (statusOrder[bS] ?? 9);
			});
			allJobs = list;
		} catch (error) {
			console.error("Error loading jobs:", error);
			allJobs = [];
		} finally {
			isLoadingJobs = false;
		}
	}

	async function refreshApplicationStatuses() {
		const apps = await applicationService.getMyApplications().catch(() => []);
		appliedJobs = (Array.isArray(apps) ? apps : []).map((a) => ({
			id: a.JobID,
			title: a.JobTitle,
			company: a.JobCompany,
			status: a.JobStatus,
			location: a.JobLocation,
			job_type: a.JobType,
			user_application: { applied: true, status: a.Status, application_id: a.ID },
		}));
		const map = {};
		for (const a of apps) {
			map[a.JobID] = { applied: true, status: a.Status, application_id: a.ID };
		}
		allJobs = allJobs.map((j) => ({
			...j,
			user_application: map[j.id] || j.user_application || { applied: false },
		}));
	}

	async function loadSavedJobs() {
		const saved = await savedJobService.listSavedJobs().catch(() => []);
		savedJobs = (Array.isArray(saved) ? saved : []).map((j) => ({
			id: j.JobID,
			title: j.Title,
			company: j.Company,
			location: j.Location,
			status: j.JobStatus || j.status,
			job_type: j.JobType,
			salary_currency: j.SalaryCurrency,
			salary_min: j.SalaryMin,
			salary_max: j.SalaryMax,
			remote_possible: j.RemotePossible,
			description: j.Description,
			category: j.Category,
			company_logo: j.CompanyLogo,
		}));
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const cat = params.get('category');
			if (cat) categoryFilter = cat;
		}
		loadPublishedJobs();
	});

	$effect(() => {
		if ($auth.isAuthenticated) {
			refreshApplicationStatuses();
			loadSavedJobs();
		}
	});

	let tabs = $derived([
		{ value: "all", label: "All Jobs", count: allJobs.length },
		{ value: "saved", label: "Saved", count: savedJobs.length },
		{ value: "applied", label: "Applied", count: appliedJobs.length },
	]);

	let displayedJobs = $derived.by(() => {
		let list = activeTab === "all" ? allJobs : activeTab === "saved" ? savedJobs : appliedJobs;

		if (activeTab === "all" && categoryFilter) {
			list = list.filter((j) => j.category === categoryFilter);
		}

		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter((j) =>
				`${j.title || ""} ${j.company || ""} ${j.location || ""} ${j.category || ""}`
					.toLowerCase()
					.includes(q)
			);
		}
		return list;
	});

	function clearFilters() {
		categoryFilter = "";
		searchQuery = "";
	}

	function catInfo(cat) {
		const c = CATEGORY_STYLES[cat];
		if (c) return c;
		return { label: String(cat || "").replace(/_/g, " "), cls: "bg-slate-50 text-slate-600 ring-slate-200/70" };
	}

	function typeLabel(job_type) {
		return JOB_TYPES[job_type] || String(job_type || "").replace(/-/g, " ");
	}

	function getJobStatus(job) {
		const status = (job?.status || "published").toLowerCase();
		if (status === "closed" || status === "archived") return { label: "Closed", color: "rose" };
		if (status === "published") return { label: "Open", color: "emerald" };
		return { label: status, color: "slate" };
	}

	function getApplicationBadge(job) {
		const app = job?.user_application;
		if (!app || !app.applied) return null;
		const status = (app.status || "submitted").toLowerCase();
		const badges = {
			submitted: { label: "Applied", color: "blue" },
			quiz_started: { label: "Quiz in Progress", color: "amber" },
			quiz_completed: { label: "Quiz Done", color: "teal" },
			under_review: { label: "Under Review", color: "indigo" },
			shortlisted: { label: "Shortlisted", color: "violet" },
			interviewed: { label: "Interviewed", color: "purple" },
			accepted: { label: "Accepted", color: "emerald" },
			rejected: { label: "Not Selected", color: "rose" },
			withdrawn: { label: "Withdrawn", color: "slate" },
		};
		return badges[status] || { label: status, color: "slate" };
	}

	function initials(name = "") {
		const parts = name.split(" ").filter(Boolean);
		return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
	}

	function avatarTone(name = "") {
		const tones = [
			"from-indigo-500 to-violet-500",
			"from-sky-500 to-blue-500",
			"from-emerald-500 to-teal-500",
			"from-amber-500 to-orange-500",
			"from-rose-500 to-pink-500",
			"from-fuchsia-500 to-purple-500",
		];
		let h = 0;
		for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 9973;
		return tones[h % tones.length];
	}

	async function openJobDetail(jobSummary) {
		selectedJob = jobSummary;
		const modal = document.getElementById("job-detail-modal");
		if (modal) modal.checked = true;

		try {
			isLoadingDetail = true;
			const fullJob = await jobService.getPublishedJob(jobSummary.id);
			if (fullJob) {
				if (!fullJob.user_application && jobSummary.user_application) {
					fullJob.user_application = jobSummary.user_application;
				}
				selectedJob = fullJob;
			}
		} catch (error) {
			console.error("Error fetching full job detail:", error);
		} finally {
			isLoadingDetail = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/60 to-white">
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- ─── Page heading ─── -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
				Open Positions
			</h1>
			<p class="mt-1 text-sm text-slate-500">
				Browse available roles and apply with one click.
			</p>
		</div>

		<!-- ─── Filter toolbar ─── -->
		<div class="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 xl:flex-row xl:items-center">
			<!-- Search -->
			<div class="relative flex-1">
				<Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search jobs, companies, or locations…"
					class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = "")}
						aria-label="Clear search"
						class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>

			<div class="flex flex-1 flex-col gap-3 sm:flex-row xl:flex-initial xl:gap-4">
				<!-- Category dropdown -->
				<div class="relative sm:flex-1 xl:w-64">
					<LayoutGrid class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<select
						bind:value={categoryFilter}
						disabled={activeTab !== "all"}
						class="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 text-sm font-semibold text-slate-700 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-45"
					>
						<option value="">All Categories</option>
						{#each CATEGORIES as cat}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
					<ChevronDown class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				</div>

				<!-- Segmented tabs -->
				<div class="inline-flex shrink-0 rounded-xl bg-slate-100 p-1">
					{#each tabs as tab (tab.value)}
						<button
							onclick={() => (activeTab = tab.value)}
							class="relative inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all {activeTab === tab.value
								? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
								: 'text-slate-500 hover:text-slate-700'}"
						>
							{#if tab.value === "saved"}
								<Bookmark class="h-3.5 w-3.5" />
							{/if}
							{tab.label}
							<span
								class="hidden min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold sm:inline-flex {activeTab === tab.value
									? 'bg-indigo-100 text-indigo-700'
									: 'bg-white/70 text-slate-500'}"
							>
								{tab.count}
							</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- ─── Results bar ─── -->
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm font-medium text-slate-500">
				{#if isLoadingJobs}
					Loading positions…
				{:else if displayedJobs.length === 1}
					1 position available
				{:else}
					{displayedJobs.length} positions available
				{/if}
			</p>
			{#if categoryFilter || searchQuery}
				<button
					onclick={clearFilters}
					class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
				>
					<X class="h-3.5 w-3.5" />
					{categoryFilter ? catInfo(categoryFilter).label : ''}{searchQuery ? ' · "' + searchQuery + '"' : ''}
					Clear
				</button>
			{/if}
		</div>

		<!-- ─── Job cards ─── -->
		{#if isLoadingJobs}
			<div class="grid gap-5 sm:grid-cols-2">
				{#each [1, 2, 3, 4, 5, 6] as _}
					<div class="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
						<div class="flex items-start gap-4">
							<div class="skeleton h-14 w-14 shrink-0 rounded-xl"></div>
							<div class="flex-1">
								<div class="skeleton mb-2 h-5 w-3/4 rounded-lg"></div>
								<div class="skeleton h-4 w-1/2 rounded-lg"></div>
							</div>
						</div>
						<div class="mt-5 flex gap-2">
							<div class="skeleton h-6 w-20 rounded-lg"></div>
							<div class="skeleton h-6 w-16 rounded-lg"></div>
							<div class="skeleton h-6 w-24 rounded-lg"></div>
						</div>
						<div class="skeleton mt-4 h-3 w-full rounded-md"></div>
						<div class="skeleton mt-2 h-3 w-2/3 rounded-md"></div>
					</div>
				{/each}
			</div>
		{:else if displayedJobs.length === 0}
			<div class="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
				<div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
					<Briefcase class="h-8 w-8 text-slate-400" />
				</div>
				<h3 class="text-lg font-bold text-slate-700">No jobs found</h3>
				<p class="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">
					{#if activeTab === "saved" && !$auth.isAuthenticated}
						Sign in to bookmark jobs and keep them here.
					{:else if activeTab === "applied" && !$auth.isAuthenticated}
						Sign in to see the jobs you've applied to.
					{:else if searchQuery || (categoryFilter && activeTab === 'all')}
						There are no matches for your search. Try a different term or category.
					{:else}
						No openings at the moment — check back soon!
					{/if}
				</p>
				{#if searchQuery || categoryFilter}
					<button
						onclick={clearFilters}
						class="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
					>
						<X class="h-4 w-4" />
						Clear filters
					</button>
				{:else if (activeTab === "saved" || activeTab === "applied") && !$auth.isAuthenticated}
					<button
						onclick={() => auth.loginWithGithub()}
						class="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
					>
						Sign in with GitHub
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-5 sm:grid-cols-2">
				{#each displayedJobs as job, index (job.id)}
					{@const cat = catInfo(job.category)}
					{@const status = getJobStatus(job)}
					{@const appBadge = getApplicationBadge(job)}
					{@const isAccepted = job.user_application?.status === "accepted"}
					<div
						role="button"
						tabindex="0"
						onclick={() => openJobDetail(job)}
						onkeydown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								openJobDetail(job);
							}
						}}
						class="job-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70 {isAccepted
							? 'border-emerald-200'
							: 'border-slate-200/70'}"
						style="animation-delay: {Math.min(index * 60, 360)}ms"
					>
						{#if isAccepted}
							<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
						{/if}

						<!-- Accepted banner -->
						{#if isAccepted}
							<div class="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 ring-1 ring-emerald-200/70" style="animation: shimmer 2.2s ease-in-out infinite;">
								<span class="text-base">🎉</span>
								<span class="text-xs font-bold text-emerald-700">You've been accepted!</span>
								<a
									href="/applications/accepted"
									onclick={(e) => e.stopPropagation()}
									class="ml-auto shrink-0 text-xs font-bold text-emerald-600 underline underline-offset-2 hover:text-emerald-800"
								>
									View details
								</a>
							</div>
						{/if}

						<!-- Header: logo + title -->
						<div class="flex items-start gap-4">
							<div class="relative shrink-0">
								{#if job.company_logo}
									<img
										src={job.company_logo}
										alt={job.company}
										loading="lazy"
										class="h-14 w-14 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-100"
									/>
								{:else}
									<span
										class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br {avatarTone(job.company)} text-base font-bold text-white shadow-sm"
									>
										{initials(job.company) || 'IZ'}
									</span>
								{/if}
								{#if status.color === "emerald"}
									<span class="absolute -right-1 -top-1 flex h-3 w-3">
										<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70"></span>
										<span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
									</span>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="line-clamp-1 text-base font-bold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600 sm:text-[17px]">
									{job.title}
								</h3>
								<p class="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
									<Building2 class="h-3.5 w-3.5 shrink-0 text-slate-400" />
									<span class="truncate">{job.company}</span>
								</p>
							</div>
							{#if status.color === "rose"}
								<span class="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 ring-1 ring-rose-100">
									Closed
								</span>
							{/if}
						</div>

						<!-- Chips -->
						<div class="mt-4 flex flex-wrap gap-2">
							{#if appBadge}
								<span
									class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ring-1
									{appBadge.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' : ''}
									{appBadge.color === 'blue' ? 'bg-blue-50 text-blue-700 ring-blue-200/70' : ''}
									{appBadge.color === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-200/70' : ''}
									{appBadge.color === 'teal' ? 'bg-teal-50 text-teal-700 ring-teal-200/70' : ''}
									{appBadge.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200/70' : ''}
									{appBadge.color === 'violet' ? 'bg-violet-50 text-violet-700 ring-violet-200/70' : ''}
									{appBadge.color === 'purple' ? 'bg-purple-50 text-purple-700 ring-purple-200/70' : ''}
									{appBadge.color === 'rose' ? 'bg-rose-50 text-rose-500 ring-rose-200/70' : ''}
									{appBadge.color === 'slate' ? 'bg-slate-100 text-slate-500 ring-slate-200/70' : ''}"
								>
									{#if appBadge.color === "emerald"}
										<Sparkles class="h-3 w-3" />
									{/if}
									{appBadge.label}
								</span>
							{/if}
							{#if cat.label}
								<span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 {cat.cls}">
									{cat.label}
								</span>
							{/if}
							{#if job.job_type}
								<span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
									{typeLabel(job.job_type)}
								</span>
							{/if}
							{#if job.remote_possible}
								<span class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">
									<Globe class="h-3 w-3" />
									Remote
								</span>
							{/if}
							{#if job.location}
								<span class="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
									<MapPin class="h-3 w-3 text-slate-400" />
									{job.location}
								</span>
							{/if}
						</div>

						<!-- Description -->
						{#if job.description}
							<p class="mt-3.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
								{job.description}
							</p>
						{/if}

						<!-- Footer -->
						<div class="mt-auto flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
							<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-all duration-200 group-hover:gap-2.5 group-hover:text-indigo-700">
								View details
								<ChevronRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<JobDetailModal
	job={selectedJob}
	modalId="job-detail-modal"
	loading={isLoadingDetail}
	isApplied={selectedJob?.user_application?.applied ?? false}
/>

<style>
	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.65;
		}
	}

	:global(.job-card) {
		animation: cardFadeIn 0.4s ease-out both;
	}
</style>