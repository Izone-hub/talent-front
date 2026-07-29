<script>
	import { onMount } from "svelte";
	import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
	import { jobService } from "$lib/api/job.service";
	import { savedJobService } from "$lib/api/savedJob.service";
	import { applicationService } from "$lib/api/application.service";
	import SkeletonCard from "$lib/components/ui/SkeletonCard.svelte";
	import EmptyState from "$lib/components/ui/EmptyState.svelte";
	let { data } = $props();

	/** @type {any[]} */
	let jobs = $state([]);
	let isLoadingJobs = $state(true);
	let filter = $state("all");

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
					user_application: { applied: true },
				}));
			} else {
				const result = await jobService.listPublishedJobs();
				jobs = Array.isArray(result) ? result : [];
			}
		} catch (error) {
			console.error("Error loading jobs:", error);
			jobs = [];
		} finally {
			isLoadingJobs = false;
		}
	}

	onMount(loadJobs);

	/**
	 * @param {any} job
	 */
	function getJobStatus(job) {
		const status = (job?.status || "published").toLowerCase();

		if (status === "closed" || status === "archived") {
			return { label: "Closed", className: "badge-error border-rose-200 bg-rose-50 text-rose-600" };
		}

		if (status === "published") {
			return { label: "Open", className: "badge-success border-emerald-200 bg-emerald-50 text-emerald-600" };
		}

		return {
			label: status.charAt(0).toUpperCase() + status.slice(1),
			className: "badge-ghost border-slate-200 bg-slate-50 text-slate-600"
		};
	}

	/**
	 * @param {any} jobSummary
	 */
	async function openJobDetail(jobSummary) {
		console.log("Opening job details for:", jobSummary.id);

		// First, show what we have so the modal opens quickly
		selectedJob = jobSummary;
		const modal = document.getElementById("job-detail-modal");
		if (modal) {
			// @ts-ignore
			modal.checked = true;
		}

		// Then, fetch full details for more information
		try {
			isLoadingDetail = true;
			const fullJob = await jobService.getPublishedJob(jobSummary.id);
			if (fullJob) {
				// Preserve user_application from the summary if the detail response doesn't include it
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

<div class="min-h-screen bg-slate-50 font-sans">
	<div class="flex w-full flex-col items-center">
		<!-- Page content here -->
		<div class="mx-auto w-full max-w-7xl px-4 py-8">
			<!-- Header -->
			<div
				class="mb-2 flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center"
			>
				<div>
					<h1
						class="text-3xl font-bold tracking-tight text-slate-800"
					>
						Active Job Openings
					</h1>
					<p class="mt-2 text-slate-500">
						Discover the latest opportunities — updated regularly.
					</p>
				</div>
				<div
					class="flex w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 md:w-auto"
				>
					<div class="shrink-0 pl-4 text-slate-400">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/></svg
						>
					</div>
					<input
						type="text"
						placeholder="Search roles..."
						class="input h-11 w-full border-none bg-transparent shadow-none focus:outline-none md:w-48"
					/>

					<div class="h-6 w-px shrink-0 bg-slate-200"></div>

					<select
						bind:value={filter}
						onchange={loadJobs}
						class="select h-11 min-h-0 cursor-pointer rounded-none border-none bg-transparent pr-8 pl-3 font-medium text-slate-600 shadow-none transition-colors hover:bg-slate-50 focus:outline-none"
					>
						<option value="all">All Jobs</option>
						<option value="saved">Saved Jobs</option>
						<option value="applied">Applied Jobs</option>
					</select>
				</div>
			</div>

			<!-- List container using daisyUI list -->
			<ul
				class="list divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white"
			>
				<li
					class="bg-slate-50/50 p-5 pb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase"
				>
					Most recent / Featured positions
				</li>

				{#if isLoadingJobs}
					<li class="p-3">
						<SkeletonCard count={5} variant="list-item" />
					</li>
				{:else if jobs.length === 0}
					<li>
						<EmptyState title="No jobs found" description="We couldn't find any job openings matching your criteria." />
					</li>
				{:else}
					{#each jobs as job (job.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<li
							class="list-row group cursor-pointer p-5 transition-colors hover:bg-slate-50"
							onclick={() => openJobDetail(job)}
						>
							<div class="list-col-grow justify-center">
								<div class="flex flex-wrap items-center gap-2">
									<div
										class="text-lg font-bold text-slate-800 transition-colors group-hover:text-indigo-600"
									>
										{job.title}
									</div>
									<span class="badge rounded-lg border px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide {getJobStatus(job).className}">
										{getJobStatus(job).label}
									</span>
								</div>
								<div
									class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/></svg
									>
									{job.company}
								</div>
							</div>

							{#if job.description}
								<p
									class="list-col-wrap hidden max-w-md text-sm leading-relaxed text-slate-500 md:block"
								>
									{job.description}
								</p>
							{/if}

							<div
								class="my-2 flex flex-wrap items-center justify-end gap-2"
							>
								{#if job.user_application?.applied}
									<div
										class="badge gap-1 rounded-lg border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-medium text-sky-600"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/></svg
										>
										Applied
									</div>
								{/if}
								{#if job.job_type}
									<div
										class="badge gap-1 rounded-lg badge-outline border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-medium text-indigo-600 badge-primary"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/></svg
										>
										{job.job_type}
									</div>
								{/if}
								{#if job.salary_min != null}
									<div
										class="badge gap-1 rounded-lg badge-outline border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-600 badge-success"
									>							
										{job.salary_currency}
										{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
									</div>
								{/if}
							</div>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</div>

	<JobDetailModal
		job={selectedJob}
		modalId="job-detail-modal"
		loading={isLoadingDetail}
		isApplied={selectedJob?.user_application?.applied ?? false}
	/>
</div>
