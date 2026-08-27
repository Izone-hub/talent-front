<script>
	import { onMount } from "svelte";
	import { auth } from "$lib/stores/authStore";
	import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
	import { jobService } from "$lib/api/job.service";
	import { savedJobService } from "$lib/api/savedJob.service";
	import { applicationService } from "$lib/api/application.service";
	import SkeletonCard from "$lib/components/ui/SkeletonCard.svelte";
	import EmptyState from "$lib/components/ui/EmptyState.svelte";
	import { Search, MapPin, Clock, Briefcase, DollarSign, Bookmark, ChevronRight, Sparkles } from "@lucide/svelte";

	let { data } = $props();

	/** @type {any[]} */
	let jobs = $state([]);
	let isLoadingJobs = $state(true);
	let filter = $state("all");
	let categoryFilter = $state("");
	let searchQuery = $state("");

	let selectedJob = $state(null);
	let isLoadingDetail = $state(false);

	async function loadJobs() {
		isLoadingJobs = true;
		try {
			if (filter === "saved") {
				const saved = await savedJobService.listSavedJobs();
				jobs = (Array.isArray(saved) ? saved : []).map((j) => ({
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
				}));
			} else if (filter === "applied") {
				const apps = await applicationService.getMyApplications();
				jobs = (Array.isArray(apps) ? apps : []).map((a) => ({
					id: a.JobID,
					jobId: a.JobID,
					title: a.JobTitle,
					company: a.JobCompany,
					status: a.JobStatus,
					user_application: { applied: true, status: a.Status, application_id: a.ID },
				}));
			} else {
				const [result, myApps] = await Promise.all([
					jobService.listPublishedJobs(categoryFilter),
					$auth.isAuthenticated ? applicationService.getMyApplications().catch(() => []) : Promise.resolve([]),
				]);
				const allJobs = Array.isArray(result) ? result : [];
				const apps = Array.isArray(myApps) ? myApps : [];

				// Build a map of job_id -> application status
				const appStatusMap = {};
				for (const a of apps) {
					appStatusMap[a.JobID] = { applied: true, status: a.Status, application_id: a.ID };
				}

				// Merge application status into jobs
				jobs = allJobs.map((j) => ({
					...j,
					user_application: appStatusMap[j.id] || j.user_application || { applied: false },
				}));

				// Sort: accepted first, then other applied statuses, then unapplied
				const statusOrder = {
					accepted: 0, shortlisted: 1, interviewed: 2, under_review: 3,
					quiz_completed: 4, quiz_started: 5, submitted: 6,
					rejected: 7, withdrawn: 8, not_applied: 9,
				};
				jobs.sort((a, b) => {
					const aStatus = a.user_application?.applied ? (a.user_application.status || 'submitted') : 'not_applied';
					const bStatus = b.user_application?.applied ? (b.user_application.status || 'submitted') : 'not_applied';
					return (statusOrder[aStatus] ?? 9) - (statusOrder[bStatus] ?? 9);
				});
			}
		} catch (error) {
			console.error("Error loading jobs:", error);
			jobs = [];
		} finally {
			isLoadingJobs = false;
		}
	}

	let filteredJobs = $derived(
		searchQuery.trim()
			? jobs.filter(
					(j) =>
						(j.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
						(j.company || "").toLowerCase().includes(searchQuery.toLowerCase())
			  )
			: jobs
	);

	$effect(() => {
		// Re-load when category filter changes (only for the 'all' tab)
		if (filter === 'all') {
			loadJobs();
		}
	});

	onMount(loadJobs);

	function getJobStatus(job) {
		const status = (job?.status || "published").toLowerCase();
		if (status === "closed" || status === "archived")
			return { label: "Closed", color: "rose" };
		if (status === "published")
			return { label: "Open", color: "emerald" };
		return { label: status, color: "slate" };
	}

	function getApplicationBadge(job) {
		const app = job?.user_application;
		if (!app || !app.applied) return null;
		const status = (app.status || "submitted").toLowerCase();

		const badges = {
			submitted: { label: "Submitted", color: "blue" },
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

	function formatSalary(job) {
		if (!job.salary_min) return null;
		const min = job.salary_min.toLocaleString();
		const max = job.salary_max?.toLocaleString();
		return `${job.salary_currency || ""} ${min}${max ? ` - ${max}` : ""}`;
	}

	function timeAgo(dateStr) {
		if (!dateStr) return "";
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now - date;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays}d ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
		return `${Math.floor(diffDays / 30)}mo ago`;
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

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
	<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
				Find Your Next Role
			</h1>
			<p class="mt-2 text-lg text-slate-500">
				Explore open positions and apply today.
			</p>
		</div>

		<!-- Search & Filters -->
		<div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<Search class="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by title or company..."
					class="input input-bordered h-11 w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				/>
			</div>
			<select
				bind:value={categoryFilter}
				class="select h-11 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-600 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
			>
				<option value="">All Categories</option>
				<option value="full_stack_developer">Full Stack Developer</option>
				<option value="web_developer">Web Developer</option>
				<option value="frontend_developer">Frontend Developer</option>
				<option value="backend_developer">Backend Developer</option>
				<option value="system_architect">System Architect</option>
				<option value="mobile_developer">Mobile Developer</option>
			</select>
			<div class="flex gap-2">
				{#each [
					{ value: "all", label: "All Jobs" },
					{ value: "saved", label: "Saved" },
					{ value: "applied", label: "Applied" },
				] as tab}
					<button
						onclick={() => { filter = tab.value; loadJobs(); }}
						class="btn h-11 rounded-xl border px-4 text-sm font-medium transition-all {filter === tab.value
							? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
							: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
					>
						{#if tab.value === 'saved'}
							<Bookmark class="h-4 w-4" />
						{/if}
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Job Count -->
		{#if !isLoadingJobs && filteredJobs.length > 0}
			<p class="mb-4 text-sm font-medium text-slate-400">
				{filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''} available
			</p>
		{/if}

		<!-- Job Cards -->
		{#if isLoadingJobs}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [1, 2, 3, 4] as _}
					<div class="rounded-2xl border border-slate-100 bg-white p-6">
						<div class="skeleton mb-3 h-5 w-3/4 rounded-lg"></div>
						<div class="skeleton mb-4 h-4 w-1/2 rounded-lg"></div>
						<div class="flex gap-2">
							<div class="skeleton h-6 w-16 rounded-full"></div>
							<div class="skeleton h-6 w-20 rounded-full"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredJobs.length === 0}
			<div class="rounded-2xl border border-slate-100 bg-white py-20 text-center">
				<Briefcase class="mx-auto mb-4 h-12 w-12 text-slate-200" />
				<h3 class="text-lg font-semibold text-slate-700">No jobs found</h3>
				<p class="mt-1 text-sm text-slate-400">
					{searchQuery ? "Try a different search term." : "No openings at the moment — check back soon!"}
				</p>
			</div>
		{:else}				<div class="grid gap-4 sm:grid-cols-2">
					{#each filteredJobs as job, index (job.id)}							{@const isAccepted = job.user_application?.status === 'accepted'}
							<button
							onclick={() => openJobDetail(job)}
							class="job-card group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-200
							{isAccepted
								? 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-green-50 shadow-md shadow-emerald-100/50 hover:shadow-lg hover:shadow-emerald-200/60'
								: 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50'}"
							style="animation-delay: {Math.min(index * 50, 300)}ms"
						>
							{#if isAccepted}
								<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
								<div class="mb-4 flex items-center gap-2 rounded-xl bg-emerald-100/60 px-3 py-2" style="animation: shimmer 2s ease-in-out infinite;">
									<span class="text-sm">🎉</span>
									<span class="text-xs font-semibold text-emerald-700">You've been accepted!</span>
									<a
									href="/applications/accepted"
									onclick={(e) => e.stopPropagation()}
									class="ml-auto text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
									>
										View details
									</a>
								</div>
							{/if}
						<!-- Top row: title + status -->
						<div class="mb-3 flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<h3 class="truncate text-lg font-bold transition-colors {isAccepted ? 'text-emerald-800 group-hover:text-emerald-600' : 'text-slate-800 group-hover:text-indigo-600'}">
									{job.title}
								</h3>
								<p class="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
									<Briefcase class="h-3.5 w-3.5 text-slate-400" />
									{job.company}
								</p>								</div>
							{#if getJobStatus(job)}
								{@const jobStatus = getJobStatus(job)}
								<span
									class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
									{jobStatus.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
									{jobStatus.color === 'rose' ? 'bg-rose-50 text-rose-500' : ''}
									{jobStatus.color === 'slate' ? 'bg-slate-100 text-slate-500' : ''}"
								>
									{jobStatus.label}
								</span>
							{/if}
						</div>

						<!-- Meta chips -->
						<div class="mb-4 flex flex-wrap gap-2">								{#if job.job_type}
									<span class="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
										<MapPin class="h-3 w-3 text-slate-400" />
										{job.job_type}
									</span>
								{/if}
								{#if job.category}
									<span class="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
										{job.category.replace(/_/g, ' ')}
									</span>
								{/if}
							{#if job.location}
								<span class="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
									<MapPin class="h-3 w-3 text-slate-400" />
									{job.location}
								</span>
							{/if}
							{#if formatSalary(job)}
								<span class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
									<DollarSign class="h-3 w-3" />
									{formatSalary(job)}
								</span>
							{/if}
							{#if job.published_at}
								<span class="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
									<Clock class="h-3 w-3" />
									{timeAgo(job.published_at)}
								</span>
							{/if}
						</div>

						<!-- Description preview -->
						{#if job.description}
							<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
								{job.description}
							</p>
						{/if}

						<!-- Bottom row: application status + CTA -->
						<div class="flex items-center justify-between">
							{#if getApplicationBadge(job)}
								{@const appBadge = getApplicationBadge(job)}
								<span
									class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
									{appBadge.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
									{appBadge.color === 'amber' ? 'bg-amber-50 text-amber-600' : ''}
									{appBadge.color === 'teal' ? 'bg-teal-50 text-teal-600' : ''}
									{appBadge.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : ''}
									{appBadge.color === 'violet' ? 'bg-violet-50 text-violet-600' : ''}
									{appBadge.color === 'purple' ? 'bg-purple-50 text-purple-600' : ''}
									{appBadge.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : ''}
									{appBadge.color === 'rose' ? 'bg-rose-50 text-rose-500' : ''}
									{appBadge.color === 'slate' ? 'bg-slate-100 text-slate-500' : ''}"
								>
									{#if appBadge.color === 'emerald'}
										<Sparkles class="h-3 w-3" />
									{/if}
									{appBadge.label}
								</span>
								{#if appBadge.label === 'Accepted'}
									<a
										href="/applications/accepted"
										onclick={(e) => e.stopPropagation()}
										class="text-xs font-medium text-emerald-600 hover:text-emerald-800"
									>
										View details →
									</a>
								{/if}
							{:else}
								<span></span>
							{/if}
							<span class="flex items-center gap-1 text-xs font-medium text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
								View
								<ChevronRight class="h-3.5 w-3.5" />
							</span>
						</div>
					</button>
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
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes shimmer {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	:global(.job-card) {
		animation: cardFadeIn 0.35s ease-out both;
	}
</style>
