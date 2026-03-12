<script>
	import { onMount } from "svelte";
	import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
	import { jobService } from "$lib/api/job.service";

	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {any[]} */
	$: jobs = data.jobs || [];

	// State to hold the currently selected job
	/** @type {any} */
	let selectedJob = null;
	let isLoadingDetail = false;

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
						class="select h-11 min-h-0 cursor-pointer rounded-none border-none bg-transparent pr-8 pl-3 font-medium text-slate-600 shadow-none transition-colors hover:bg-slate-50 focus:outline-none"
					>
						<option selected>All Jobs</option>
						<option>Saved Jobs</option>
						<option>Applied Jobs</option>
					</select>
				</div>
			</div>

			<!-- List container using daisyUI list -->
			<ul
				class="list divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white"
			>
				<!-- Optional header row -->
				<li
					class="bg-slate-50/50 p-5 pb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase"
				>
					Most recent / Featured positions
				</li>

				{#each jobs as job (job.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<li
						class="list-row group cursor-pointer p-5 transition-colors hover:bg-slate-50"
						on:click={() => openJobDetail(job)}
					>
						<!-- Main content area -->
						<div class="list-col-grow justify-center">
							<div
								class="text-lg font-bold text-slate-800 transition-colors group-hover:text-indigo-600"
							>
								{job.title}
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

						<!-- Description column -->
						<p
							class="list-col-wrap hidden max-w-md text-sm leading-relaxed text-slate-500 md:block"
						>
							{job.description}
						</p>

						<!-- Badges / tags -->
						<div
							class="my-2 flex flex-wrap items-center justify-end gap-2"
						>
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
							<div
								class="badge gap-1 rounded-lg badge-outline border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-600 badge-success"
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
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/></svg
								>
								{job.salary_currency}
								{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
							</div>
						</div>
					</li>
				{:else}
					<li class="col-span-full py-20 text-center text-slate-500">
						<div
							class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 transition-transform hover:scale-105"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-10 w-10 text-slate-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-bold text-slate-800">
							No jobs found
						</h3>
						<p class="mt-1 text-slate-500">
							We couldn't find any job openings matching your
							criteria.
						</p>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<JobDetailModal
		job={selectedJob}
		modalId="job-detail-modal"
		loading={isLoadingDetail}
	/>
</div>
