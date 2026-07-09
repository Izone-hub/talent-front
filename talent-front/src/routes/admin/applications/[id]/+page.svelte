<script>
	import { page } from "$app/stores";
	import { applicationService } from "$lib/api/application.service";
	import { intelligenceService } from "$lib/api/intelligence.service";
	import { ExternalLink, BrainCircuit, GitBranch, Code2, Loader2, ChevronLeft, Check, X } from "lucide-svelte";
	import { showToast } from "$lib/stores/toast";
	import { goto } from "$app/navigation";

	let applicationId = $state("");
	let application = $state(null);
	let loading = $state(true);
	let isProcessing = $state(false);
	let intelligenceData = $state(null);
	let loadingIntelligence = $state(false);
	let accessDenied = $state(false);

	$effect(() => {
		applicationId = $page.params.id;
		loadApplication();
	});

	async function loadApplication() {
		loading = true;
		accessDenied = false;
		try {
			const data = await applicationService.getApplicationDetail(applicationId);
			const status = (data?.Status || data?.status || "").toLowerCase();
			if (status !== "quiz_completed") {
				application = null;
				accessDenied = true;
				return;
			}
			application = data;

			// Load intelligence data
			const userId = getVal(data, "UserID", "user_id", "UserId");
			if (userId) {
				loadingIntelligence = true;
				try {
					const intelligence = await intelligenceService.fetchGitHubIntelligence(userId);
					intelligenceData = intelligence;
				} catch (error) {
					console.error("Failed to fetch GitHub intelligence:", error);
				} finally {
					loadingIntelligence = false;
				}
			}
		} catch (error) {
			showToast("Failed to load application", "error");
			console.error(error);
		} finally {
			loading = false;
		}
	}

	function isFinishedQuiz() {
		return (application?.Status || application?.status || "").toLowerCase() === "quiz_completed";
	}

	function getVal(obj, ...keys) {
		if (!obj) return null;
		for (const key of keys) {
			const val = obj[key];
			if (val != null && val !== "") return val;
		}
		return null;
	}

	function formatDate(dateStr) {
		if (!dateStr) return "—";
		try {
			return new Date(dateStr).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return "—";
		}
	}

	function statusBadgeClass(status) {
		switch ((status || "").toLowerCase()) {
			case "submitted": return "badge-info";
			case "quiz_started": return "badge-warning";
			case "quiz_completed": return "badge-warning";
			case "under_review": return "badge-info";
			case "shortlisted": return "badge-primary";
			case "interviewed": return "badge-primary";
			case "accepted": return "badge-success";
			case "rejected": return "badge-error";
			case "withdrawn": return "badge-ghost";
			default: return "badge-ghost";
		}
	}

	function getApplicationId() {
		return application?.ID || application?.id || applicationId;
	}

	async function acceptApplication() {
		if (!application) return;
		isProcessing = true;
		try {
			const response = await applicationService.acceptApplication(getApplicationId());
			application = response || {
				...application,
				Status: "accepted",
				status: "accepted"
			};

			showToast("Application accepted", "success");
			await loadApplication();
		} catch (error) {
			showToast("Failed to accept application", "error");
			console.error(error);
		} finally {
			isProcessing = false;
		}
	}

	async function rejectApplication() {
		if (!application) return;
		isProcessing = true;
		try {
			const response = await applicationService.rejectApplication(getApplicationId());
			application = response || {
				...application,
				Status: "rejected",
				status: "rejected"
			};

			showToast("Application rejected", "success");
			await loadApplication();
		} catch (error) {
			showToast("Failed to reject application", "error");
			console.error(error);
		} finally {
			isProcessing = false;
		}
	}

	function goBack() {
		goto("/admin/applications");
	}
</script>

<div class="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/40 text-slate-900">
	<div class="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
		{#if loading}
			<div class="flex min-h-[70vh] flex-col items-center justify-center gap-3 rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
				<span class="loading loading-spinner loading-lg text-purple-600"></span>
				<span class="text-sm text-slate-500">Loading application details...</span>
			</div>
		{:else if !application}
			<div class="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/70 bg-white/80 p-12 text-center shadow-sm backdrop-blur">
				<div class="max-w-md space-y-4">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
						<BrainCircuit size={30} />
					</div>
					<div>
						<h3 class="text-2xl font-semibold tracking-tight text-slate-900">{accessDenied ? "Quiz not finished yet" : "Application not found"}</h3>
						<p class="mt-2 text-sm text-slate-500">
							{accessDenied
								? "Only quiz-completed applications are visible."
								: "This application is unavailable."}
						</p>
					</div>
					<button onclick={goBack} class="btn btn-primary gap-2 shadow-sm">
						<ChevronLeft size={18} />
						Go Back
					</button>
				</div>
			</div>
		{:else if isFinishedQuiz()}
			<div class="mb-5 flex items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
				<button onclick={goBack} class="btn btn-ghost btn-sm gap-2 text-slate-600 hover:text-slate-900">
					<ChevronLeft size={18} />
					Back to Applications
				</button>
				<span class="badge {statusBadgeClass(application.Status || application.status)} badge-lg border-none px-4 py-3 font-medium capitalize">
					{application.Status || application.status || "unknown"}
				</span>
			</div>

			<div class="grid gap-6 xl:grid-cols-12 xl:items-start">
				<div class="space-y-6 xl:col-span-8">
					<section class="min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
						<div class="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 px-6 py-8 text-white sm:px-8">
							<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
								<div class="flex-1 space-y-4">
									<div class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20">
										<BrainCircuit size={14} />
										Application
									</div>
									<h1 class="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
										{getVal(application, "Name", "name", "ApplicantName", "applicant_name") || getVal(application, "GithubUsername_2", "GithubUsername", "github_username") || "Applicant"}
									</h1>
									<p class="max-w-2xl break-words text-sm text-white/80 sm:text-base">
										Applied: {formatDate(application.SubmittedAt || application.submitted_at)}
									</p>
								</div>
								<div class="grid w-full min-w-0 gap-3 sm:grid-cols-2">
									<div class="rounded-2xl bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur-sm">
										<p class="text-[11px] uppercase tracking-[0.22em] text-white/70">Email</p>
										<p class="mt-2 break-words text-sm font-medium leading-snug text-white">{getVal(application, "Email", "email", "ApplicantEmail", "applicant_email") || "—"}</p>
									</div>
									<div class="rounded-2xl bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur-sm">
										<p class="text-[11px] uppercase tracking-[0.22em] text-white/70">GitHub</p>
										<p class="mt-2 break-words text-sm font-medium leading-snug text-white">{getVal(application, "GithubUsername", "github_username", "GithubUsername_2") || "—"}</p>
									</div>
									<div class="rounded-2xl bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur-sm">
										<p class="text-[11px] uppercase tracking-[0.22em] text-white/70">Submitted</p>
										<p class="mt-2 text-sm font-medium leading-snug text-white">{formatDate(application.SubmittedAt || application.submitted_at)}</p>
									</div>
									<div class="rounded-2xl bg-white/15 p-4 ring-1 ring-white/15 backdrop-blur-sm">
										<p class="text-[11px] uppercase tracking-[0.22em] text-white/70">Status</p>
										<p class="mt-2 break-words text-sm font-medium leading-snug text-white">{application.Status || application.status || "unknown"}</p>
									</div>
								</div>
							</div>
						</div>

						<div class="p-4">
							<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
								{#if getVal(application, "PhoneNumber", "phone_number")}
									<div class="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
										<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Phone</p>
										<p class="mt-2 break-words text-sm font-medium leading-snug text-slate-900">{getVal(application, "PhoneNumber", "phone_number")}</p>
									</div>
								{/if}
								{#if getVal(application, "Location", "location")}
									<div class="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
										<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Location</p>
										<p class="mt-2 break-words text-sm font-medium leading-snug text-slate-900">{getVal(application, "Location", "location")}</p>
									</div>
								{/if}
							</div>

							{#if application.QuizScore != null || application.quiz_score != null}
								<div class="mt-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-5 sm:p-6">
									<div class="mb-4 flex items-center justify-between">
										<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Quiz Results</h2>
										<span class="badge badge-lg {getVal(application, 'QuizPassed', 'quiz_passed') ? 'badge-success' : 'badge-error'} border-none px-3 py-2 font-medium">
											{getVal(application, 'QuizPassed', 'quiz_passed') ? 'Passed' : 'Failed'}
										</span>
									</div>
									<div class="grid gap-4 md:grid-cols-2">
										<div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
											<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Score</p>
											<p class="mt-3 text-4xl font-semibold text-slate-900">{getVal(application, "QuizScore", "quiz_score")}<span class="text-xl text-slate-400">/100</span></p>
										</div>
										<div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
											<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Verdict</p>
											<p class="mt-3 text-sm text-slate-600">{getVal(application, 'QuizPassed', 'quiz_passed') ? 'Passed screening.' : 'Did not pass screening.'}</p>
										</div>
									</div>
								</div>
							{/if}

							{#if getVal(application, "CoverLetter", "cover_letter", "CoverLetterText", "cover_letter_text")}
								<div class="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
									<div class="mb-4 flex items-center gap-2">
										<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Cover Letter</h2>
									</div>
									<div class="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap break-words ring-1 ring-slate-200">
										{getVal(application, "CoverLetter", "cover_letter", "CoverLetterText", "cover_letter_text")}
									</div>
								</div>
							{/if}

							<div class="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
								<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Links & Resources</h2>
								<div class="mt-4 flex flex-wrap gap-3">
									{#if getVal(application, "GithubUsername", "github_username", "GithubUsername_2")}
										<a
											href="https://github.com/{getVal(application, 'GithubUsername', 'github_username', 'GithubUsername_2')}"
											target="_blank"
											rel="noopener noreferrer"
											class="btn btn-outline gap-2"
										>
											<ExternalLink size={16} />
											GitHub Profile
										</a>
									{/if}
									{#if getVal(application, "PortfolioUrl", "portfolio_url", "PortfolioURL", "portfolioUrl")}
										<a
											href={getVal(application, "PortfolioUrl", "portfolio_url", "PortfolioURL", "portfolioUrl")}
											target="_blank"
											rel="noopener noreferrer"
											class="btn btn-outline gap-2"
										>
											<ExternalLink size={16} />
											Portfolio
										</a>
									{/if}
								</div>
							</div>
						</div>
					</section>
				</div>

				<aside class="min-w-0 space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
					<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
						<div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
							<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Actions</h2>
						</div>
						<div class="space-y-3 p-6">
							<button
								onclick={rejectApplication}
								class="btn btn-error btn-block gap-2"
								disabled={isProcessing || (application.Status || application.status) === 'rejected'}
							>
								{#if isProcessing}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									<X size={18} />
								{/if}
								Reject Application
							</button>
							<button
								onclick={acceptApplication}
								class="btn btn-success btn-block gap-2"
								disabled={isProcessing || (application.Status || application.status) === 'accepted'}
							>
								{#if isProcessing}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									<Check size={18} />
								{/if}
								Accept Application
							</button>
						</div>
					</div>

					<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
						<div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
							<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Intelligence</h2>
						</div>
						<div class="p-6">
							{#if loadingIntelligence}
								<div class="flex items-center gap-2 text-sm text-slate-500">
									<Loader2 size={18} class="animate-spin" />
									Fetching GitHub intelligence...
								</div>
							{:else if intelligenceData}
								<div class="space-y-4">
									<div class="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-4 ring-1 ring-slate-200">
										<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
											<GitBranch size={14} />
											GitHub Profile
										</div>
										<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
												<p class="text-xs text-slate-500">Activity</p>
												<p class="mt-1 break-words text-sm font-semibold capitalize leading-snug text-slate-900">{intelligenceData.github_intelligence?.activity_level || "—"}</p>
											</div>
											<div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
												<p class="text-xs text-slate-500">Focus</p>
												<p class="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{intelligenceData.github_intelligence?.focus || "—"}</p>
											</div>
											<div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
												<p class="text-xs text-slate-500">Repos</p>
												<p class="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{intelligenceData.github_intelligence?.public_repos ?? "—"}</p>
											</div>
											<div class="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
												<p class="text-xs text-slate-500">Followers</p>
												<p class="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{intelligenceData.github_intelligence?.followers ?? "—"}</p>
											</div>
										</div>
										{#if intelligenceData.github_intelligence?.top_languages?.length}
											<div class="mt-4 border-t border-white/60 pt-4">
												<p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Top Languages</p>
												<div class="mt-2 flex flex-wrap gap-2">
													{#each intelligenceData.github_intelligence.top_languages as lang}
														<span class="badge badge-sm border-none bg-purple-100 text-purple-700">{lang}</span>
													{/each}
												</div>
											</div>
										{/if}
									</div>

									{#if intelligenceData.cv_signals}
										<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
											<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
												<Code2 size={14} />
												CV Signals
											</div>
											<div class="mt-3 space-y-3">
												<div class="rounded-xl bg-white p-3 ring-1 ring-slate-100">
													<p class="text-xs text-slate-500">Experience Level</p>
													<p class="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{intelligenceData.cv_signals.experience_level || "—"}</p>
												</div>
												<div class="rounded-xl bg-white p-3 ring-1 ring-slate-100">
													<p class="text-xs text-slate-500">Projects Listed</p>
													<p class="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{intelligenceData.cv_signals.projects_listed ?? "—"}</p>
												</div>
												<div class="rounded-xl bg-white p-3 ring-1 ring-slate-100">
													<p class="text-xs text-slate-500">Credibility</p>
													<p class="mt-1 break-words text-sm font-semibold capitalize leading-snug text-slate-900">{intelligenceData.cv_signals.credibility || "—"}</p>
												</div>
												<div class="rounded-xl bg-white p-3 ring-1 ring-slate-100">
													<p class="text-xs text-slate-500">GitHub Alignment</p>
													<p class="mt-1 break-words text-sm font-semibold capitalize leading-snug text-slate-900">{intelligenceData.cv_signals.alignment_with_github?.replace(/_/g, " ") || "—"}</p>
												</div>
											</div>
											{#if intelligenceData.cv_signals.claimed_skills?.length}
												<div class="mt-4 border-t border-slate-200 pt-4">
													<p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Claimed Skills</p>
													<div class="mt-2 flex flex-wrap gap-2">
														{#each intelligenceData.cv_signals.claimed_skills as skill}
															<span class="badge badge-sm border-none bg-emerald-100 text-emerald-700">{skill}</span>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									{/if}

								</div>
							{:else}
								<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
									No GitHub intelligence data available.
								</div>
							{/if}
						</div>
					</div>
				</aside>
			</div>

			{#if intelligenceData?.ai_summary}
				<section class="mt-6 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
					<div class="border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
						<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
							<BrainCircuit size={14} />
							AI Summary
						</div>
					</div>
					<div class="grid gap-4 p-6 sm:p-8 xl:grid-cols-2">
						{#if intelligenceData.ai_summary.summary}
							<div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 xl:col-span-2">
								<p class="text-xs font-medium text-slate-500">Summary</p>
								<p class="mt-2 break-words text-sm leading-6 text-slate-700">{intelligenceData.ai_summary.summary}</p>
							</div>
						{/if}
						{#if intelligenceData.ai_summary.strengths}
							<div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
								<p class="text-xs font-medium text-slate-500">Strengths</p>
								<p class="mt-2 break-words text-sm leading-6 text-slate-700">{intelligenceData.ai_summary.strengths}</p>
							</div>
						{/if}
						{#if intelligenceData.ai_summary.weaknesses}
							<div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
								<p class="text-xs font-medium text-slate-500">Weaknesses</p>
								<p class="mt-2 break-words text-sm leading-6 text-slate-700">{intelligenceData.ai_summary.weaknesses}</p>
							</div>
						{/if}
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>
