<script>
	import { page } from "$app/stores";
	import { applicationService } from "$lib/api/application.service";
	import { intelligenceService } from "$lib/api/intelligence.service";
	import { ExternalLink, BrainCircuit, GitBranch, Code2, Loader2, ChevronLeft, ChevronDown, Check, X, Target, AlertTriangle, ShieldCheck, BarChart3, Lightbulb, BookOpen, Trophy } from "lucide-svelte";
	import PassFailBadge from "$lib/components/ui/PassFailBadge.svelte";
	import PageLoader from "$lib/components/ui/PageLoader.svelte";
	import ButtonLoader from "$lib/components/ui/ButtonLoader.svelte";
	import { showToast } from "$lib/stores/toast";
	import { goto } from "$app/navigation";

	let applicationId = $state("");
	let application = $state(null);
	let loading = $state(true);
	let isProcessing = $state(false);
	let intelligenceData = $state(null);
	let parsedAnalysis = $state(null);
	let parsedGithub = $state(null);
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

			const userId = getVal(data, "UserID", "user_id", "UserId");
			if (userId) {
				loadingIntelligence = true;
				try {
					const intelligence = await intelligenceService.fetchGitHubIntelligence(userId);
					intelligenceData = intelligence;
					parseIntelligenceData(intelligence);
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

	function parseIntelligenceData(data) {
		if (!data) return;

		const aiSummary = data.ai_summary;
		if (aiSummary?.summary) {
			try {
				const parsed = typeof aiSummary.summary === "string"
					? JSON.parse(aiSummary.summary)
					: aiSummary.summary;
				parsedAnalysis = parsed?.analysis || null;
				parsedGithub = parsed?.github || null;
			} catch {
				parsedAnalysis = null;
				parsedGithub = null;
			}
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

	function computeQuizStats() {
		const answers = intelligenceData?.quiz_answers || [];
		const total = answers.length;
		const correct = answers.filter(a => a.IsCorrect === true).length;
		const accuracy = total ? Math.round((correct / total) * 100) : 0;
		const last = answers.length ? answers[answers.length - 1]?.LastSavedAt : null;
		return { total, correct, accuracy, last };
	}

	function getStrengths() {
		const s = intelligenceData?.ai_summary?.strengths;
		if (!s) return [];
		return s.split(";").map(x => x.trim()).filter(Boolean);
	}

	function getWeaknesses() {
		const w = intelligenceData?.ai_summary?.weaknesses;
		if (!w) return [];
		return w.split(";").map(x => x.trim()).filter(Boolean);
	}

	function getLangPercentage(lang) {
		if (typeof lang === "object" && lang.percentage) return lang.percentage;
		return null;
	}

	function getLangName(lang) {
		if (typeof lang === "string") return lang;
		return lang?.language || lang?.name || String(lang);
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

	const quizStats = $derived(computeQuizStats());
	const atsScore = $derived(parsedAnalysis?.ats_score ?? null);
	const scoreBreakdown = $derived(parsedAnalysis?.score_breakdown || null);
	const checks = $derived(parsedAnalysis?.checks || []);
	const suggestedSkills = $derived(parsedAnalysis?.suggested_fields?.skills || []);
	const suggestedHeadline = $derived(parsedAnalysis?.suggested_fields?.headline || null);
	const suggestedEducation = $derived(parsedAnalysis?.suggested_fields?.education || []);
	const suggestedExperience = $derived(parsedAnalysis?.suggested_fields?.experience || []);
	const ghIntelligence = $derived(intelligenceData?.github_intelligence || {});
	const ghLanguages = $derived(parsedGithub?.languages || ghIntelligence.top_languages || []);

	let openSections = $state({
		atsScore: true,
		strengths: true,
		fieldChecks: false,
		githubProfile: true,
		suggested: false,
		quizActivity: false,
	});

	function toggleSection(key) {
		openSections[key] = !openSections[key];
	}
</script>

<div class="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/40 text-slate-900">
	<div class="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
		{#if loading}
			<PageLoader message="Loading application details..." />
		{:else if !application}
			<div class="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/70 bg-white/80 p-12 text-center shadow-sm backdrop-blur">
				<div class="max-w-md space-y-4">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
						<BrainCircuit size={30} />
					</div>
					<div>
						<h3 class="text-2xl font-semibold tracking-tight text-slate-900">{accessDenied ? "Quiz not finished yet" : "Application not found"}</h3>
						<p class="mt-2 text-sm text-slate-500">
							{accessDenied ? "Only quiz-completed applications are visible." : "This application is unavailable."}
						</p>
					</div>
					<button onclick={goBack} class="btn btn-primary gap-2 shadow-sm">
						<ChevronLeft size={18} />
						Go Back
					</button>
				</div>
			</div>
		{:else if isFinishedQuiz()}
			<!-- Header bar -->
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
				<!-- Left panel -->
				<div class="space-y-6 xl:col-span-8">
					<!-- Applicant hero -->
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
										<PassFailBadge score={getVal(application, 'QuizScore', 'quiz_score') || 0} passingThreshold={50} />
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

					<!-- ATS Score card -->
					{#if loadingIntelligence}
						<div class="rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
							<div class="flex items-center justify-center gap-2 text-sm text-slate-500">
								<Loader2 size={18} class="animate-spin" />
								Analyzing resume intelligence...
							</div>
						</div>
					{:else if intelligenceData}
						{#if atsScore != null}
							<section class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
								<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 text-left" onclick={() => toggleSection('atsScore')}>
									<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
										<Target size={14} />
										ATS Score
										<span class="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-600">weighted</span>
										<ChevronDown size={16} class="transition-transform duration-200 {openSections.atsScore ? 'rotate-180' : ''}" />
									</div>
								</button>
								{#if openSections.atsScore}
									<div class="p-6 sm:p-8">
										<div class="flex items-center gap-6">
											<span class="text-5xl font-bold tracking-tight text-slate-900">{atsScore}</span>
											<span class="text-xl font-medium text-slate-400">/ 100</span>
										</div>
										{#if scoreBreakdown}
											<div class="mt-4 flex flex-wrap gap-3">
												{#if scoreBreakdown.clarity != null}
													<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
														<ShieldCheck size={13} />
														Clarity: {scoreBreakdown.clarity}
													</span>
												{/if}
												{#if scoreBreakdown.keywords != null}
													<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
														<BarChart3 size={13} />
														Keywords: {scoreBreakdown.keywords}
													</span>
												{/if}
												{#if scoreBreakdown.structure != null}
													<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
														<BookOpen size={13} />
														Structure: {scoreBreakdown.structure}
													</span>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</section>
						{/if}

						<!-- Strengths & Weaknesses -->
						{#if getStrengths().length > 0 || getWeaknesses().length > 0}
							<section class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
								<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 text-left" onclick={() => toggleSection('strengths')}>
									<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
										<Lightbulb size={14} />
										Strengths & Weaknesses
										<ChevronDown size={16} class="ml-auto transition-transform duration-200 {openSections.strengths ? 'rotate-180' : ''}" />
									</div>
								</button>
								{#if openSections.strengths}
									<div class="p-6 sm:p-8">
										{#if getStrengths().length > 0}
											<div class="mb-5">
												<h3 class="mb-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
													<Check size={15} />
													Strengths
												</h3>
												<ul class="space-y-2">
													{#each getStrengths() as s}
														<li class="flex items-start gap-2 text-sm text-slate-700">
															<span class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
																<Check size={12} class="text-emerald-600" />
															</span>
															{s}
														</li>
													{/each}
												</ul>
											</div>
										{/if}
										{#if getWeaknesses().length > 0}
											<div>
												<h3 class="mb-3 flex items-center gap-1.5 text-sm font-semibold text-red-600">
													<AlertTriangle size={15} />
													Weaknesses
												</h3>
												<ul class="space-y-2">
													{#each getWeaknesses() as w}
														<li class="flex items-start gap-2 text-sm text-slate-700">
															<span class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-100 flex items-center justify-center">
																<X size={12} class="text-red-600" />
															</span>
															{w}
														</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								{/if}
							</section>
						{/if}

						<!-- Field checks -->
						{#if checks.length > 0}
							<section class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
								<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 text-left" onclick={() => toggleSection('fieldChecks')}>
									<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
										<ShieldCheck size={14} />
										Field Checks
										<span class="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-slate-600">{checks.length}</span>
										<ChevronDown size={16} class="transition-transform duration-200 {openSections.fieldChecks ? 'rotate-180' : ''}" />
									</div>
								</button>
								{#if openSections.fieldChecks}
									<div class="divide-y divide-slate-100 p-2">
										{#each checks as check}
											<div class="flex items-start gap-3 px-4 py-3">
												{#if check.status === "pass"}
													<span class="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
														<Check size={14} class="text-emerald-600" />
													</span>
												{:else if check.status === "warn"}
													<span class="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
														<AlertTriangle size={14} class="text-amber-600" />
													</span>
												{:else}
													<span class="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-red-100 flex items-center justify-center">
														<X size={14} class="text-red-600" />
													</span>
												{/if}
												<div class="min-w-0 flex-1">
													<div class="flex items-center gap-2 flex-wrap">
														<span class="text-sm font-semibold text-slate-800">{check.field || check.label || "—"}</span>
														<span class="badge badge-sm border-none {check.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : check.status === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
															{check.status}
														</span>
													</div>
													<p class="mt-0.5 text-xs text-slate-500">{check.message || check.detail || ""}</p>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</section>
						{/if}
					{:else}
						<div class="rounded-3xl border border-dashed border-slate-200 bg-white/90 p-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
							No intelligence data available.
						</div>
					{/if}
				</div>

				<!-- Right sidebar -->
				<aside class="min-w-0 space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
					<!-- Actions -->
					<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
						<div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
							<h2 class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">Actions</h2>
						</div>
						<div class="space-y-3 p-6">
							<ButtonLoader
								loading={isProcessing}
								disabled={isProcessing || (application.Status || application.status) === 'rejected'}
								onclick={rejectApplication}
								color="error"
								variant="outline"
							>
								<X size={18} />
								Reject Application
							</ButtonLoader>
							<ButtonLoader
								loading={isProcessing}
								disabled={isProcessing || (application.Status || application.status) === 'accepted'}
								onclick={acceptApplication}
								color="success"
							>
								<Check size={18} />
								Accept Application
							</ButtonLoader>
						</div>
					</div>

					{#if !loadingIntelligence && intelligenceData}
						<!-- GitHub profile -->
						<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
							<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 text-left" onclick={() => toggleSection('githubProfile')}>
								<div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
									<GitBranch size={14} />
									GitHub Profile
									<ChevronDown size={16} class="ml-auto transition-transform duration-200 {openSections.githubProfile ? 'rotate-180' : ''}" />
								</div>
							</button>
							{#if openSections.githubProfile}
								<div class="p-6 space-y-4">
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-500">User</span>
										<span class="font-semibold text-slate-900">{parsedGithub?.username || ghIntelligence.github_username || getVal(application, "GithubUsername", "github_username", "GithubUsername_2") || "—"}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-500">Repos</span>
										<span class="font-semibold text-slate-900">{parsedGithub?.repo_count ?? ghIntelligence.public_repos ?? "—"}</span>
									</div>

									<div class="rounded-2xl bg-slate-50 p-4 grid grid-cols-2 gap-3 ring-1 ring-slate-100">
										<div>
											<p class="text-[11px] uppercase tracking-wider text-slate-400">Followers</p>
											<p class="mt-1 text-lg font-bold text-slate-900">{ghIntelligence.followers ?? "—"}</p>
										</div>
										<div>
											<p class="text-[11px] uppercase tracking-wider text-slate-400">Following</p>
											<p class="mt-1 text-lg font-bold text-slate-900">{ghIntelligence.following ?? "—"}</p>
										</div>
										<div>
											<p class="text-[11px] uppercase tracking-wider text-slate-400">Activity</p>
											<p class="mt-1 text-sm font-bold capitalize text-slate-900">{ghIntelligence.activity_level || "—"}</p>
										</div>
										<div>
											<p class="text-[11px] uppercase tracking-wider text-slate-400">Focus</p>
											<p class="mt-1 text-sm font-bold text-slate-900">{ghIntelligence.focus || "—"}</p>
										</div>
									</div>

									{#if ghLanguages.length > 0}
										<div>
											<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Top Languages</p>
											<div class="flex flex-wrap gap-2">
												{#each ghLanguages as lang}
													<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
														{getLangName(lang)}
														{#if getLangPercentage(lang)}
															<span class="text-slate-400">{getLangPercentage(lang)}%</span>
														{/if}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Suggested headline & skills -->
						{#if suggestedHeadline || suggestedSkills.length > 0 || suggestedEducation.length > 0}
							<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
								<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 text-left" onclick={() => toggleSection('suggested')}>
									<div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
										<BrainCircuit size={14} />
										Suggested Headline & Skills
										<ChevronDown size={16} class="ml-auto transition-transform duration-200 {openSections.suggested ? 'rotate-180' : ''}" />
									</div>
								</button>
								{#if openSections.suggested}
									<div class="p-6 space-y-5">
										{#if suggestedHeadline}
											<div class="rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-900 ring-1 ring-blue-100">
												{suggestedHeadline}
											</div>
										{/if}
										{#if suggestedSkills.length > 0}
											<div>
												<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Suggested Skills</p>
												<div class="flex flex-wrap gap-2">
													{#each suggestedSkills as skill}
														<span class="inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">{skill}</span>
													{/each}
												</div>
											</div>
										{/if}
										{#if suggestedEducation.length > 0}
											<div>
												<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Education (Extracted)</p>
												<ul class="space-y-1">
													{#each suggestedEducation as edu}
														<li class="flex items-start gap-2 text-sm text-slate-700">
															<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span>
															{edu}
														</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Quiz activity -->
						<div class="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
							<button class="w-full border-b border-slate-200 bg-slate-50 px-6 py-4 text-left" onclick={() => toggleSection('quizActivity')}>
								<div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
									<Trophy size={14} />
									Quiz Activity
									<ChevronDown size={16} class="ml-auto transition-transform duration-200 {openSections.quizActivity ? 'rotate-180' : ''}" />
								</div>
							</button>
							{#if openSections.quizActivity}
								<div class="p-6">
									<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
										<span><span class="font-semibold text-slate-900">Attempts:</span> <span class="text-slate-600">{quizStats.total}</span></span>
										<span><span class="font-semibold text-slate-900">Correct:</span> <span class="text-slate-600">{quizStats.correct}</span></span>
										<span><span class="font-semibold text-slate-900">Accuracy:</span> <span class="text-slate-600">{quizStats.accuracy}%</span></span>
									</div>
									{#if quizStats.last}
										<p class="mt-2 text-xs text-slate-400">Last saved: {new Date(quizStats.last).toLocaleString()}</p>
									{/if}
								</div>
							{/if}
						</div>

						<p class="text-right text-xs text-slate-400">data from dat.json · ATS v1</p>
					{/if}
				</aside>
			</div>
		{/if}
	</div>
</div>
