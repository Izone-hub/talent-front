<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/authStore";
	import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
	import FindJobSearch from "$lib/components/jobs/FindJobSearch.svelte";
	import { jobService } from "$lib/api/job.service";
	import { savedJobService } from "$lib/api/savedJob.service";
	import { applicationService } from "$lib/api/application.service";
	import {
		Briefcase,
		ChevronRight,
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
	let activeTab = $state("all"); // "all" | "saved" | "applied"
	let categoryFilter = $state("");
	let searchQuery = $state("");

	let selectedJob = $state(null);
	let isLoadingDetail = $state(false);

	// A user who has already accepted a job must not keep browsing open
	// positions — redirect them to their accepted-job area instead.
	const hasAcceptedJob = $derived(
		$auth.isAuthenticated && Boolean($auth.user?.acceptance_job_id)
	);
	const isAuthed = $derived($auth.isAuthenticated);

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

	const statusOrder = {
		accepted: 0, shortlisted: 1, interviewed: 2, under_review: 3,
		quiz_completed: 4, quiz_started: 5, submitted: 6,
		rejected: 7, withdrawn: 8, not_applied: 9,
	};

	// Single page loader: waits for the auth store to settle, then performs each
	// network call at most once per page entry. Previously the mount-time job
	// fetch and the auth-settled effect each requested /applications/my,
	// doubling the slowest request on this page.
	let loadStarted = false;

	$effect(() => {
		// Accepted users are sent to their accepted-job area and never get to
		// browse/apply through this page; everyone else loads exactly once.
		if ($auth.loading) return;
		if (hasAcceptedJob) {
			goto("/applications/accepted", { replaceState: true });
			return;
		}
		if (loadStarted) return;
		loadStarted = true;
		loadPageData();
	});

	async function loadPageData() {
		isLoadingJobs = true;
		try {
			const withUser = $auth.isAuthenticated && !hasAcceptedJob;
			const [result, myApps] = await Promise.all([
				jobService.listPublishedJobs(""),
				withUser ? applicationService.getMyApplications().catch(() => []) : Promise.resolve([]),
			]);
			const apps = Array.isArray(myApps) ? myApps : [];
			applyJobState(result, apps);

			if (withUser) {
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
		} catch (error) {
			console.error("Error loading jobs:", error);
			allJobs = [];
		} finally {
			isLoadingJobs = false;
		}
	}

	// Builds the job list (annotated with the viewer's per-job application
	// status) and the "Applied" tab data from one /applications/my response.
	function applyJobState(result, apps) {
		const map = {};
		for (const a of apps) {
			map[a.JobID] = { applied: true, status: a.Status, application_id: a.ID };
		}
		const list = (Array.isArray(result) ? result : []).map((j) => ({
			...j,
			user_application: map[j.id] || j.user_application || { applied: false },
		}));
		list.sort((a, b) => {
			const aS = a.user_application?.applied ? a.user_application.status || "submitted" : "not_applied";
			const bS = b.user_application?.applied ? b.user_application.status || "submitted" : "not_applied";
			return (statusOrder[aS] ?? 9) - (statusOrder[bS] ?? 9);
		});
		allJobs = list;
		appliedJobs = apps.map((a) => ({
			id: a.JobID,
			title: a.JobTitle,
			company: a.JobCompany,
			status: a.JobStatus,
			location: a.JobLocation,
			job_type: a.JobType,
			user_application: { applied: true, status: a.Status, application_id: a.ID },
		}));
	}

	onMount(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const cat = params.get("category");
			if (cat) categoryFilter = cat;
		}
	});

	// Real counts fed to the search panel (backend data only).
	const totalJobs = $derived(allJobs.length);
	const savedCount = $derived(isAuthed ? savedJobs.length : null);
	const appliedCount = $derived(isAuthed ? appliedJobs.length : null);

	/** Real job categories present in the loaded job list, with live counts. */
	let popularCategories = $derived.by(() => {
		const counts = {};
		for (const j of allJobs) {
			if (j.category) counts[j.category] = (counts[j.category] || 0) + 1;
		}
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([value, count]) => ({
				value,
				count,
				label:
					CATEGORIES.find((c) => c.value === value)?.label ||
					CATEGORY_STYLES[value]?.label ||
					String(value).replace(/_/g, " "),
			}));
	});

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
		activeTab = "all";
	}

	function handleSearchCategory(value) {
		// "" = All Jobs
		activeTab = "all";
		categoryFilter = value;
		searchQuery = "";
	}

	function handleSearchShortcut(key) {
		activeTab = key;
		searchQuery = "";
		categoryFilter = "";
	}

	function catInfo(cat) {
		const c = CATEGORY_STYLES[cat];
		if (c) return c;
		return { label: String(cat || "").replace(/_/g, " "), cls: "bg-slate-50 text-slate-600 ring-slate-200/70" };
	}

	// Tiny optional status chip shown on the card (closed job, or the viewer's
	// own application state such as "Quiz Done"). Everything else about the job
	// lives in the detail modal, so the card stays clean and minimal.
	function cardStatus(job) {
		const jobStatus = (job?.status || "published").toLowerCase();
		if (jobStatus === "closed" || jobStatus === "archived") {
			return { label: "Closed", cls: "bg-rose-50 text-rose-500 ring-rose-200/70" };
		}
		const app = job?.user_application;
		if (!app || !app.applied) return null;
		const status = String(app.status || "submitted").toLowerCase();
		const chips = {
			submitted: { label: "Applied", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
			quiz_started: { label: "Quiz in Progress", cls: "bg-amber-50 text-amber-700 ring-amber-200/70" },
			quiz_completed: { label: "Quiz Done", cls: "bg-teal-50 text-teal-700 ring-teal-200/70" },
			under_review: { label: "Under Review", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200/70" },
			shortlisted: { label: "Shortlisted", cls: "bg-violet-50 text-violet-700 ring-violet-200/70" },
			interviewed: { label: "Interviewed", cls: "bg-purple-50 text-purple-700 ring-purple-200/70" },
			accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/70" },
			rejected: { label: "Not Selected", cls: "bg-rose-50 text-rose-500 ring-rose-200/70" },
			withdrawn: { label: "Withdrawn", cls: "bg-slate-100 text-slate-500 ring-slate-200/70" },
		};
		return chips[status] || null;
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

	/** First letter used for the letter-based logo fallback. */
	function logoLetter(name = "") {
		return String(name || "").trim().charAt(0).toUpperCase() || "J";
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
		<!-- ─── Page heading + expandable search (single search UI) ─── -->
		<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-8">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
					Open Positions
				</h1>
				<p class="mt-1 text-sm text-slate-500">
					Browse available roles and apply with one click.
				</p>
			</div>
			<FindJobSearch
				bind:query={searchQuery}
				jobs={allJobs}
				categories={popularCategories}
				totalJobs={totalJobs}
				savedCount={savedCount}
				appliedCount={appliedCount}
				selectedCategory={categoryFilter}
				activeView={activeTab}
				loading={isLoadingJobs}
				onSelectJob={(job) => openJobDetail(job)}
				onSelectCategory={handleSearchCategory}
				onShortcut={handleSearchShortcut}
			/>
		</div>

		<!-- ─── Results bar ─── -->
		<div class="mb-5 flex min-h-6 flex-wrap items-center justify-between gap-3">
			<p class="text-sm font-medium text-slate-500">
				{#if isLoadingJobs}
					Loading positions…
				{:else if displayedJobs.length === 1}
					1 position available
				{:else}
					{displayedJobs.length} positions available
				{/if}
			</p>
			{#if categoryFilter || searchQuery || activeTab !== "all"}
				<button
					onclick={clearFilters}
					class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
				>
					<X class="h-3.5 w-3.5" />
					{activeTab !== "all" ? (activeTab === "saved" ? "Saved Roles" : "Applied Positions") : ''}
					{activeTab === "all" && categoryFilter ? catInfo(categoryFilter).label : ''}
					{searchQuery ? ' · "' + searchQuery + '"' : ''}
					Clear
				</button>
			{/if}
		</div>

		<!-- ─── Job cards ─── -->
		{#if isLoadingJobs}
			<div class="grid gap-5 sm:grid-cols-2" role="status" aria-busy="true" aria-label="Loading open positions">
				{#each [1, 2, 3, 4, 5, 6] as _}
					<div class="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
						<div class="flex items-center gap-4">
							<div class="skeleton h-11 w-11 shrink-0 rounded-xl"></div>
							<div class="min-w-0 flex-1">
								<div class="skeleton mb-2 h-5 w-2/3 rounded-lg"></div>
								<div class="skeleton h-4 w-1/3 rounded-lg"></div>
							</div>
						</div>
						<!-- Description slot (2 lines) -->
						<div class="skeleton mt-4 h-3 w-full rounded-md"></div>
						<div class="skeleton mt-2 h-3 w-4/5 rounded-md"></div>
						<div class="skeleton mt-6 h-4 w-24 self-end rounded-md"></div>
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
					{#if activeTab === "saved" && !isAuthed}
						Sign in to bookmark jobs and keep them here.
					{:else if activeTab === "applied" && !isAuthed}
						Sign in to see the jobs you've applied to.
					{:else if searchQuery || categoryFilter || activeTab !== "all"}
						There are no matches for your current filters. Try a different search or category.
					{:else}
						No openings at the moment — check back soon!
					{/if}
				</p>
				{#if searchQuery || categoryFilter || activeTab !== "all"}
					<button
						onclick={clearFilters}
						class="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
					>
						<X class="h-4 w-4" />
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-5 sm:grid-cols-2">
				{#each displayedJobs as job, index (job.id)}
					{@const statusChip = cardStatus(job)}
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
						class="job-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"
						style="animation-delay: {Math.min(index * 60, 360)}ms"
					>
						<!-- Header: small logo + title + company -->
						<div class="flex items-center gap-4">
							<div class="relative shrink-0">
								{#if job.company_logo && !job.logo_failed}
									<img
										src={job.company_logo}
										alt={job.company}
										loading="lazy"
										onerror={() => (job.logo_failed = true)}
										class="h-11 w-11 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-100"
									/>
								{:else}
									<!-- Letter fallback for missing/broken logos -->
									<span
										class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br {avatarTone(job.company || job.title)} text-base font-bold text-white shadow-sm"
									>
										{logoLetter(job.company || job.title)}
									</span>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="line-clamp-1 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
									{job.title}
								</h3>
								<p class="mt-1 truncate text-sm font-medium text-slate-500">
									{job.company}
								</p>
							</div>
							{#if statusChip}
								<span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 {statusChip.cls}">
									{statusChip.label}
								</span>
							{/if}
						</div>

						<!-- Short supporting description (fixed 2-line slot) -->
						<p class="mt-4 line-clamp-2 min-h-[2.85rem] text-sm leading-relaxed text-slate-500">
							{job.description || ""}
						</p>

						<!-- Footer: single entry-point action -->
						<div class="mt-auto flex min-h-8 items-center justify-end pt-4">
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

	:global(.job-card) {
		animation: cardFadeIn 0.4s ease-out both;
	}
</style>
