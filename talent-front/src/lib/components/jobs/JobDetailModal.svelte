<script>
	/** @type {any} */
	export let job = null;
	export let modalId = "job-detail-modal";
	export let loading = false;
	import { Bookmark } from "@lucide/svelte";
	import { auth } from "$lib/stores/authStore";
	$: requirementsList = job?.requirements
		? job.requirements
				.split(",")
				.map((r) => r.trim())
				.filter((r) => r)
		: [];

	$: benefitsList = job?.benefits
		? job.benefits
				.split(",")
				.map((b) => b.trim())
				.filter((b) => b)
		: [];
</script>

<input type="checkbox" id={modalId} class="modal-toggle" />
<div class="modal modal-bottom sm:modal-middle" role="dialog">
	<div
		class="
    modal-box
    max-h-[80vh]
    min-h-[40vh] w-full max-w-lg overflow-hidden
    rounded-t-3xl border border-slate-100/80
    bg-gradient-to-b from-white
    to-slate-50/70 p-0 shadow-xl
    sm:max-h-[80vh] sm:max-w-2xl
    sm:rounded-lg
    sm:shadow-2xl lg:max-w-5xl
  "
	>
		{#if job}
			<!-- ─── Sticky Header ─── -->
			<div
				class="
        sticky top-0 z-30
        border-b border-slate-100/70
        bg-white/80 px-5
        py-4 backdrop-blur-xl sm:px-8
      "
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3 sm:gap-4">
						<div>
							<h2
								class="flex items-center gap-2 text-lg leading-tight font-bold tracking-tight text-slate-800 lg:text-xl"
							>
								{job.title}
								{#if loading}
									<span
										class="loading loading-spinner loading-xs text-indigo-600"
									></span>
								{:else}
									<Bookmark class="h-5 w-5 text-indigo-600" />
								{/if}
							</h2>
							<p
								class="mt-0.5 text-sm font-medium text-indigo-600/90"
							>
								{job.company}
							</p>
						</div>
					</div>

					<label
						for={modalId}
						class="btn btn-circle text-slate-500 btn-ghost transition-colors btn-md hover:bg-slate-100/80 hover:text-slate-800"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</label>
				</div>
			</div>

			<!-- ─── Scrollable Content ─── -->
			<div
				class="max-h-[calc(92vh-140px)] overflow-y-auto px-5 pt-6 pb-30 sm:max-h-[calc(90vh-140px)] sm:px-8 lg:px-10"
			>
				<!-- Quick stats chips -->
				<div class="mb-7 flex flex-wrap gap-2.5 sm:mb-9 sm:gap-3">
					<div
						class="badge gap-1.5 badge-outline border-slate-200 bg-white/60 px-3 py-3 text-sm font-medium text-slate-600"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/></svg
						>
						{job.job_type || "Not specified"}
					</div>
					<div
						class="badge gap-1.5 badge-outline border-emerald-100/70 bg-emerald-50/40 px-3 py-3 text-sm font-medium text-emerald-700"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
							/></svg
						>
						{job.salary_currency}
						{job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}
					</div>
					<div
						class="badge gap-1.5 badge-outline border-amber-100/60 bg-amber-50/30 px-3 py-3 text-sm font-medium text-amber-700"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						{job.experience_level || "Not specified"}
					</div>
				</div>

				<!-- Description -->
				<section class="mb-8 sm:mb-10">
					<h3
						class="mb-3.5 flex items-center gap-2.5 text-lg font-semibold text-slate-800"
					>
						About the Role
					</h3>
					<div
						class="prose-slate prose-sm sm:prose-base prose max-w-none"
					>
						<p
							class="leading-relaxed whitespace-pre-line text-slate-600"
						>
							{job.description || "No description provided."}
						</p>
					</div>
				</section>

				<!-- Requirements -->
				{#if requirementsList.length > 0}
					<section class="mb-8 sm:mb-10">
						<h3
							class="mb-3.5 flex items-center gap-2.5 text-lg font-semibold text-slate-800"
						>
							Requirements
						</h3>
						<ul
							class="space-y-2.5 text-[15px] text-slate-600 sm:text-base"
						>
							{#each requirementsList as req}
								<li class="flex items-start gap-3">
									<svg
										class="text-gray mt-0.5 h-4 w-4 shrink-0"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
									<span>{req}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<!-- Benefits -->
				{#if benefitsList.length > 0}
					<section class="mb-6">
						<h3
							class="mb-3.5 flex items-center gap-2.5 text-lg font-semibold text-slate-800"
						>
							What We Offer
						</h3>
						<ul
							class="space-y-2.5 text-[15px] text-slate-600 sm:text-base"
						>
							{#each benefitsList as benefit}
								<li class="flex items-start gap-3">
									<svg
										class="text-gray mt-0.5 h-4 w-4 shrink-0"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
									<span>{benefit}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>

			<!-- ─── Sticky Footer CTA ─── -->
			<div
				class="
        sticky bottom-0 z-30
        border-t border-slate-100/70 bg-gradient-to-t from-white via-white to-transparent px-5
        pb-6 sm:px-8
      "
			>
				{#if $auth.isAuthenticated}
					<button
						class="
						btn h-12 w-full rounded-lg
						border border-indigo-600/90 bg-indigo-600 text-white
						text-lg font-semibold
						transition-all duration-300 sm:h-13 hover:bg-indigo-700
					"
					>
						Apply Now
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					</button>
				{:else}
					<button
						on:click={() => auth.loginWithGithub()}
						class="
						btn h-12 w-full rounded-lg
						border border-indigo-600/90
						text-lg font-semibold text-indigo-600/90
						transition-all duration-300 sm:h-13
					"
					>
						Login to Apply
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<label class="modal-backdrop" for={modalId}></label>
</div>
