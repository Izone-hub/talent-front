<script>
	import { Bookmark, AlertCircle, CheckCircle, HelpCircle } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/authStore";
	import { jobService } from "$lib/api/job.service";
	import { cvService } from "$lib/api/cv.service";
	import { savedJobService } from "$lib/api/savedJob.service";
	import { surveyService } from "$lib/api/survey.service";
	import { showToast } from "$lib/stores/toast";

	let { job = null, modalId = "job-detail-modal", loading = false, isApplied = false } = $props();

	let applying = $state(false);
	let isSaved = $state(false);
	let saving = $state(false);

	// Survey screening state
	let surveyQuestions = $state([]);
	let surveyAnswers = $state({});
	let showSurvey = $state(false);
	let surveyLoading = $state(false);
	let surveyResult = $state(null);
	let currentQuestionIndex = $state(0);

	$effect(() => {
		if (job?.id && $auth.isAuthenticated) {
			savedJobService.isJobSaved(job.id).then((saved) => (isSaved = saved));
			// Fetch survey questions for this job
			surveyService.getQuestions(job.id).then((res) => {
				const qs = res?.questions || [];
				surveyQuestions = qs;
				// Initialize answers
				const init = {};
				for (const q of qs) {
					init[q.id] = null; // unanswered
				}
				surveyAnswers = init;
			}).catch(() => {
				surveyQuestions = [];
			});
		} else {
			isSaved = false;
			surveyQuestions = [];
		}
	});

	async function toggleSave() {
		if (!job?.id || saving) return;
		saving = true;
		try {
			if (isSaved) {
				await savedJobService.unsaveJob(job.id);
				isSaved = false;
				showToast("Job removed from saved", "info");
			} else {
				await savedJobService.saveJob(job.id);
				isSaved = true;
				showToast("Job saved!", "success");
			}
		} catch (e) {
			showToast("Failed to update saved status", "error");
		} finally {
			saving = false;
		}
	}

	let requirementsList = $derived(
		job?.requirements
			? job.requirements
					.split(",")
					.map((r) => r.trim())
					.filter((r) => r)
			: []
	);

	let benefitsList = $derived(
		job?.benefits
			? job.benefits
					.split(",")
					.map((b) => b.trim())
					.filter((b) => b)
			: []
	);

	function timeAgo(dateStr) {
		if (!dateStr) return "recently";
		const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return "today";
		if (diffDays === 1) return "yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return `${Math.floor(diffDays / 30)} months ago`;
	}

	async function handleApply() {
		if (!job?.id || applying) return;

		// If there are survey questions, show them first
		if (surveyQuestions.length > 0 && !showSurvey) {
			showSurvey = true;
			surveyResult = null;
			return;
		}

		applying = true;
		try {
			// Check if user has a CV before applying
			const currentCV = await cvService.getCurrentCV();
			if (!currentCV) {
				showToast("Please upload your CV before applying", "warning");
				goto("/profile");
				return;
			}

			const response = await jobService.applyForJob(job.id);
			if (response?.application_id) {
				showToast("Successfully applied! Take the quiz to proceed.", "success");
				showSurvey = false;
				if (response?.quiz_id) {
					goto(`/quizzes/${response.quiz_id}`);
					return;
				}
				goto("/applications");
			} else {
				showToast("Unexpected response from server", "error");
				goto("/applications");
				return;
			}
		} catch (error) {
			const message = error.message || "Failed to apply for the job";

			if (message.toLowerCase().includes("already applied")) {
				showToast(message, "warning");
				goto("/applications");
			} else if (message.toLowerCase().includes("cv")) {
				showToast("Please upload your CV before applying", "warning");
				goto("/profile");
			} else {
				showToast(message, "error");
				goto("/applications");
			}
		} finally {
			applying = false;
		}
	}

	function startSurvey() {
		showSurvey = true;
		surveyResult = null;
		currentQuestionIndex = 0;
	}

	function answerQuestion(questionId, answer) {
		surveyAnswers[questionId] = answer;
		surveyAnswers = { ...surveyAnswers };
	}

	function nextQuestion() {
		if (currentQuestionIndex < surveyQuestions.length - 1) {
			currentQuestionIndex++;
		} else {
			submitSurvey();
		}
	}

	function prevQuestion() {
		if (currentQuestionIndex > 0) {
			currentQuestionIndex--;
		}
	}

	async function submitSurvey() {
		surveyLoading = true;
		try {
			const result = await surveyService.submitAnswers(job.id, surveyAnswers);
			surveyResult = result;

			if (result.passed) {
				showToast("You passed the screening! Applying now...", "success");
				autoApply();
			} else {
				showToast("Sorry, you did not pass the screening questions.", "error");
			}
		} catch (error) {
			showToast(error.message || "Failed to submit answers", "error");
		} finally {
			surveyLoading = false;
		}
	}

	async function autoApply() {
		try {
			const currentCV = await cvService.getCurrentCV();
			if (!currentCV) {
				showToast("Please upload your CV before applying", "warning");
				goto("/profile");
				return;
			}
			const response = await jobService.applyForJob(job.id);
			if (response?.application_id) {
				showToast("Successfully applied! Taking you to your applications.", "success");
				setTimeout(() => {
					showSurvey = false;
					goto("/applications");
				}, 1200);
			}
		} catch (error) {
			showToast(error.message || "Failed to apply", "error");
		}
	}

	function closeSurvey() {
		showSurvey = false;
		surveyResult = null;
		currentQuestionIndex = 0;
	}
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
									<button
										onclick={toggleSave}
										disabled={saving}
										class="cursor-pointer"
									>
										{#if saving}
											<span
												class="loading loading-spinner loading-xs text-indigo-600"
											></span>
										{:else}
											<Bookmark
												class="h-5 w-5 {isSaved
													? 'text-indigo-600 fill-indigo-600'
													: 'text-indigo-600'}"
											/>
										{/if}
									</button>
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
					{#if job.category}
					<div
						class="badge gap-1.5 badge-outline border-purple-100/70 bg-purple-50/40 px-3 py-3 text-sm font-medium text-purple-700"
					>
						{job.category.replace(/_/g, ' ')}
					</div>
					{/if}
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
					{#if job.published_at}
					<div
						class="badge gap-1.5 badge-outline border-indigo-100/60 bg-indigo-50/30 px-3 py-3 text-sm font-medium text-indigo-700"
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
						Posted {timeAgo(job.published_at)}
					</div>
					{/if}
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
				{#if isApplied}
					<div
						class="btn h-12 w-full cursor-default rounded-lg border border-sky-200 bg-sky-50 text-lg font-semibold text-sky-600 sm:h-13"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						You have Applied
					</div>
				{:else if $auth.isAuthenticated}
					<button
						onclick={handleApply}
						disabled={applying}
						class="
						btn h-12 w-full rounded-lg
						border border-indigo-600/90 bg-indigo-600 text-white
						text-lg font-semibold
						transition-all duration-300 sm:h-13 hover:bg-indigo-700
						{applying ? 'pointer-events-none opacity-60' : ''}
					"
					>
						{#if applying}
							<span class="loading loading-spinner loading-sm"></span>
							Applying...
						{:else}
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
						{/if}
					</button>
				{:else}
					<button
						onclick={() => auth.loginWithGithub()}
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

	<!-- ─── Survey Screening Modal (centered) ─── -->
	{#if showSurvey}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[999] flex items-center justify-center p-4" onclick={closeSurvey}>
			<div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
			<div
				class="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-fadeIn"
				onclick={(e) => e.stopPropagation()}
			>

				{#if surveyResult}
					<!-- ── RESULT SCREEN ── -->
					<div class="flex flex-col items-center px-8 py-10 text-center">
						{#if surveyResult.passed}
							<!-- PASSED -->
							<div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-200">
								<CheckCircle size={40} class="text-white" />
							</div>
							<h4 class="mt-5 text-xl font-bold text-slate-900">You Passed! 🎉</h4>
							<p class="mt-2 text-sm leading-relaxed text-slate-500">Applying to this job now...</p>
							<div class="mt-4">
								<span class="loading loading-spinner loading-md text-emerald-600"></span>
							</div>
						{:else}
							<!-- FAILED -->
							<div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-500 shadow-lg shadow-rose-200">
								<AlertCircle size={40} class="text-white" />
							</div>
							<h4 class="mt-5 text-xl font-bold text-slate-900">Screening Not Passed</h4>
							<p class="mt-2 text-sm leading-relaxed text-slate-500">You did not meet the screening requirements for this job.</p>

							<!-- Failed questions -->
							<div class="mt-6 w-full space-y-2.5">
								{#each surveyResult.results as r}
									<div class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left {r.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}">
										{#if r.passed}
										<CheckCircle size={16} class="shrink-0 text-emerald-500" />
									{:else}
										<AlertCircle size={16} class="shrink-0 text-rose-500" />
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-slate-700">{r.question_text}</p>
										<p class="text-xs text-slate-400">Your answer: {r.your_answer ? 'Yes' : 'No'} · Expected: {r.expected ? 'Yes' : 'No'}</p>
									</div>
								</div>
								{/each}
							</div>

							<button
								onclick={closeSurvey}
								class="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
							>
								Close
							</button>
						{/if}
					</div>

				{:else}
					<!-- ── QUESTION SCREEN ── -->
					{@const q = surveyQuestions[currentQuestionIndex]}
					{@const total = surveyQuestions.length}
					{@const current = currentQuestionIndex + 1}

					<!-- Header -->
					<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<HelpCircle size={18} class="text-white/80" />
								<span class="text-sm font-semibold text-white/90">Screening</span>
							</div>
							<button
								onclick={closeSurvey}
								class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
						<!-- Progress -->
						<div class="mt-3">
							<div class="flex items-center justify-between text-xs text-white/70 mb-1.5">
								<span>Question {current} of {total}</span>
								<span>{Math.round((current / total) * 100)}%</span>
							</div>
							<div class="h-1.5 w-full rounded-full bg-white/20">
								<div class="h-full rounded-full bg-white transition-all duration-300" style="width: {(current / total) * 100}%"></div>
							</div>
						</div>
					</div>

					<!-- Question body -->
					<div class="px-6 py-6">
						<p class="text-base font-semibold leading-relaxed text-slate-800">{q.question_text}</p>

						<div class="mt-5 space-y-3">
							<button
								onclick={() => answerQuestion(q.id, true)}
								class="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 py-4 text-base font-bold transition-all duration-200
								{surveyAnswers[q.id] === true
									? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-[1.02]'
									: 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}"
							>
								<span class="flex h-7 w-7 items-center justify-center rounded-full border-2 {surveyAnswers[q.id] === true ? 'border-white bg-white/20' : 'border-slate-300'}">
									{#if surveyAnswers[q.id] === true}
										<CheckCircle size={14} class="text-white" />
									{/if}
								</span>
								Yes
							</button>

							<button
								onclick={() => answerQuestion(q.id, false)}
								class="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 py-4 text-base font-bold transition-all duration-200
								{surveyAnswers[q.id] === false
									? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200 scale-[1.02]'
									: 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'}"
							>
								<span class="flex h-7 w-7 items-center justify-center rounded-full border-2 {surveyAnswers[q.id] === false ? 'border-white bg-white/20' : 'border-slate-300'}">
									{#if surveyAnswers[q.id] === false}
										<AlertCircle size={14} class="text-white" />
									{/if}
								</span>
								No
							</button>
						</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-slate-100 bg-slate-50 px-6 py-4">
					<div class="flex items-center gap-3">
						{#if currentQuestionIndex > 0}
							<button
								onclick={prevQuestion}
								class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
							>
								Back
							</button>
						{/if}
						<button
								onclick={nextQuestion}
								disabled={surveyAnswers[q.id] === null || surveyLoading}
								class="ml-auto rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40
								{surveyAnswers[q.id] !== null
									? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
									: 'bg-slate-300'}"
							>
								{#if surveyLoading}
									<span class="loading loading-spinner loading-xs"></span>
									Submitting...
								{:else if currentQuestionIndex === total - 1}
									Submit & Apply
								{:else}
									Next →
								{/if}
							</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
	{/if}

	<label class="modal-backdrop" for={modalId}></label>
</div>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.95) translateY(10px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}
	:global(.animate-fadeIn) {
		animation: fadeIn 0.3s ease-out;
	}
</style>
