<script>
    import { page } from "$app/stores";
    import { applicationService } from "$lib/api/application.service";
    import { intelligenceService } from "$lib/api/intelligence.service";
    import { ExternalLink, BrainCircuit, GitBranch, Loader2, ChevronLeft, ChevronDown, Check, X, Target, AlertTriangle, ShieldCheck, BarChart3, Lightbulb, BookOpen, Trophy, User, Mail, Calendar, MapPin, Link, Star, Clock, Award, ThumbsUp, ThumbsDown, Sparkles, FileText, Code2 } from "lucide-svelte";
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

    let activeTab = $state("overview");

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

    // Canonical acceptance check: an applicant is accepted for this job only
    // when users.acceptance_job_id (returned on the application row) equals
    // the job of the application. application.status is never used for this -
    // it remains pure application-process history ("quiz_completed" etc).
    function isAcceptedForThisJob() {
        if (!application) return false;
        const acceptedJobId = application.acceptance_job_id || application.AcceptanceJobID || "";
        const jobId = application.job_id || application.JobID || "";
        return String(acceptedJobId) !== "" &&
            (String(acceptedJobId) === String(jobId));
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
            case "submitted": return "bg-blue-100 text-blue-700";
            case "quiz_started": return "bg-amber-100 text-amber-700";
            case "quiz_completed": return "bg-amber-100 text-amber-700";
            case "under_review": return "bg-cyan-100 text-cyan-700";
            case "shortlisted": return "bg-indigo-100 text-indigo-700";
            case "interviewed": return "bg-violet-100 text-violet-700";
            case "accepted": return "bg-emerald-100 text-emerald-700";
            case "rejected": return "bg-rose-100 text-rose-700";
            case "withdrawn": return "bg-gray-100 text-gray-500";
            default: return "bg-gray-100 text-gray-600";
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
            // Accepting never rewrites application.status (that stays process
            // history); the response carries the canonical acceptance via
            // acceptance_job_id == job_id, so just refresh from the server.
            application = response || application;
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

    const applicantName = $derived(getVal(application, "Name", "name", "ApplicantName") || "Applicant");
    const applicantInitials = $derived(
        applicantName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    );
    const applicantScore = $derived(getVal(application, "QuizScore", "quiz_score") || 0);
    const applicantEmail = $derived(getVal(application, "Email", "email"));
    const applicantGithub = $derived(getVal(application, "GithubUsername", "github_username"));
    const applicantLocation = $derived(getVal(application, "Location", "location"));
    const applicantPhone = $derived(getVal(application, "PhoneNumber", "phone_number"));
    const applicantSubmitted = $derived(application?.SubmittedAt || application?.submitted_at);
    const coverLetter = $derived(getVal(application, "CoverLetter", "cover_letter", "CoverLetterText"));

    // Composite score: 80% Quiz + 20% ATS (admin only)
    const compositeScore = $derived.by(() => {
        const quiz = applicantScore || 0;
        const ats = atsScore || 0;
        const hasQuiz = applicantScore != null && applicantScore > 0;
        const hasAts = atsScore != null && atsScore > 0;
        if (hasQuiz && hasAts) return Math.round(quiz * 0.8 + ats * 0.2);
        if (hasQuiz) return Math.round(quiz * 0.8);
        if (hasAts) return Math.round(ats * 0.2);
        return null;
    });
</script>

<div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <div class="space-y-6">
                <!-- Skeleton: Top bar -->
                <div class="flex items-center gap-3 animate-pulse">
                    <div class="w-10 h-10 rounded-lg bg-gray-200"></div>
                    <div class="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <!-- Skeleton: Hero card -->
                <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 overflow-hidden">
                    <div class="h-40 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 animate-pulse"></div>
                    <div class="px-6 py-4 bg-gray-50 flex gap-3">
                        <div class="h-8 w-24 bg-gray-200 rounded-lg"></div>
                        <div class="h-8 w-24 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
                <!-- Skeleton: Tabs -->
                <div class="flex gap-1 bg-white rounded-xl p-1">
                    <div class="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                    <div class="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                    <div class="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                    <div class="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                </div>
                <!-- Skeleton: Content -->
                <div class="grid gap-6 lg:grid-cols-3">
                    <div class="space-y-4 animate-pulse">
                        <div class="h-24 bg-white rounded-2xl ring-1 ring-gray-200/50"></div>
                        <div class="h-24 bg-white rounded-2xl ring-1 ring-gray-200/50"></div>
                    </div>
                    <div class="space-y-4 animate-pulse lg:col-span-2">
                        <div class="h-32 bg-white rounded-2xl ring-1 ring-gray-200/50"></div>
                        <div class="h-48 bg-white rounded-2xl ring-1 ring-gray-200/50"></div>
                    </div>
                </div>
            </div>

        {:else if !application || accessDenied}
            <div class="flex min-h-[60vh] items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <BrainCircuit size={32} class="text-gray-400" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900">
                        {accessDenied ? "Quiz Not Completed" : "Application Not Found"}
                    </h3>
                    <p class="mt-2 text-sm text-gray-500">
                        {accessDenied
                            ? "This application hasn't completed the quiz yet. Only quiz-completed applications are visible."
                            : "The application you're looking for doesn't exist or has been removed."}
                    </p>
                    <button onclick={goBack} class="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        <ChevronLeft size={16} />
                        Back to Applications
                    </button>
                </div>
            </div>

        {:else if isFinishedQuiz()}

        <!-- Top Navigation Bar -->
        <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    onclick={goBack}
                    class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Back"
                >
                    <ChevronLeft size={20} />
                </button>
                <div class="h-6 w-px bg-gray-200"></div>
                <div>
                    <h1 class="text-lg font-semibold text-gray-900">Application Review</h1>
                    <p class="text-xs text-gray-400">ID: #{getApplicationId()?.slice(0, 8)}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize
                    {statusBadgeClass(application.Status || application.status)}">
                    {application.Status || application.status || "unknown"}
                </span>
            </div>
        </div>

        <!-- Applicant Profile Card (Hero) -->
        <div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-200/50">
            <div class="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 py-8 sm:px-8 overflow-hidden">
                <!-- Decorative circles -->
                <div class="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5"></div>
                <div class="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5"></div>
                <div class="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-5">
                        <div class="relative">
                            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold text-white ring-4 ring-white/30 shadow-lg">
                                {applicantInitials}
                            </div>
                            {#if applicantScore > 0}
                                <div class="absolute -bottom-1 -right-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-indigo-600 shadow-md">
                                    {applicantScore}%
                                </div>
                            {/if}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">{applicantName}</h2>
                            <div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                {#if applicantEmail}
                                    <span class="flex items-center gap-1">
                                        <Mail size={13} class="text-white/50" />
                                        {applicantEmail}
                                    </span>
                                {/if}
                                {#if applicantGithub}
                                    <span class="flex items-center gap-1">
                                        <GitBranch size={13} class="text-white/50" />
                                        @{applicantGithub}
                                    </span>
                                {/if}
                                {#if applicantLocation}
                                    <span class="flex items-center gap-1">
                                        <MapPin size={13} class="text-white/50" />
                                        {applicantLocation}
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                            <p class="text-[10px] uppercase tracking-wider text-white/60">Applied</p>
                            <p class="mt-1 text-sm font-semibold text-white">{formatDate(applicantSubmitted)}</p>
                        </div>
                        <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                            <p class="text-[10px] uppercase tracking-wider text-white/60">Quiz Score</p>
                            <p class="mt-1 text-sm font-semibold text-white">{applicantScore}/100</p>
                        </div>
                        <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                            <p class="text-[10px] uppercase tracking-wider text-white/60">ATS Score</p>
                            <p class="mt-1 text-sm font-semibold text-white">{atsScore ?? "—"}/100</p>
                        </div>
                        {#if compositeScore != null}
                            <div class="rounded-xl p-3 backdrop-blur-sm ring-1 ring-white/20
                                {compositeScore >= 70 ? 'bg-white/25 ring-emerald-300/30' :
                                 compositeScore >= 50 ? 'bg-white/20 ring-amber-300/30' : 'bg-white/15 ring-rose-300/30'}">
                                <p class="text-[10px] uppercase tracking-wider text-white/60">⭐ Overall</p>
                                <p class="mt-1 text-sm font-bold text-white">{compositeScore}/100</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 px-6 py-3">
                <div class="flex flex-wrap items-center gap-3 text-sm">
                    <span class="text-gray-500">Quick actions:</span>
                    {#if applicantGithub}
                        <a href="https://github.com/{applicantGithub}" target="_blank" rel="noopener"
                           class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 transition-colors">
                            <GitBranch size={13} />
                            GitHub
                        </a>
                    {/if}
                    {#if getVal(application, "PortfolioUrl", "portfolio_url")}
                        <a href="{getVal(application, 'PortfolioUrl', 'portfolio_url')}" target="_blank" rel="noopener"
                           class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 transition-colors">
                            <ExternalLink size={13} />
                            Portfolio
                        </a>
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick={rejectApplication}
                        disabled={isProcessing || (application.Status || application.status) === 'rejected'}
                        class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={14} />
                        Reject
                    </button>
                    <button
                        onclick={acceptApplication}
                        disabled={isProcessing || isAcceptedForThisJob()}
                        class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={14} />
                        {isAcceptedForThisJob() ? 'Accepted' : 'Accept'}
                    </button>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="mb-6 flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-200/50">
            <button
                class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                    {activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                onclick={() => activeTab = 'overview'}
            >
                <span class="hidden sm:inline">📊 Overview</span>
                <span class="sm:hidden">📊</span>
            </button>
            <button
                class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                    {activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                onclick={() => activeTab = 'analysis'}
            >
                <span class="hidden sm:inline">🔍 Analysis</span>
                <span class="sm:hidden">🔍</span>
            </button>
            <button
                class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                    {activeTab === 'github' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                onclick={() => activeTab = 'github'}
            >
                <span class="hidden sm:inline">🐙 GitHub</span>
                <span class="sm:hidden">🐙</span>
            </button>
            <button
                class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                    {activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                onclick={() => activeTab = 'quiz'}
            >
                <span class="hidden sm:inline">📝 Quiz</span>
                <span class="sm:hidden">📝</span>
            </button>
        </div>

        <!-- Tab Content -->
        <div class="grid gap-6 lg:grid-cols-3">

            <!-- Sidebar (desktop only) -->
            <div class="hidden lg:block lg:col-span-1 space-y-4">
                <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Status</p>
                    <div class="mt-2 flex items-center gap-2">
                        {#if isAcceptedForThisJob()}
                            <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <span class="text-sm font-semibold capitalize text-emerald-700">
                                Accepted
                            </span>
                        {:else}
                            <span class="inline-flex h-2.5 w-2.5 rounded-full
                                {(application.Status || application.status || '').toLowerCase() === 'rejected' ? 'bg-red-500' :
                                 'bg-amber-500'}">
                            </span>
                            <span class="text-sm font-medium capitalize text-gray-900">
                                {application.Status || application.status || "unknown"}
                            </span>
                        {/if}
                    </div>
                </div>

                <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Quiz Summary</p>
                    <div class="mt-3 grid grid-cols-2 gap-3">
                        <div class="rounded-xl bg-gray-50 p-3 text-center">
                            <p class="text-lg font-bold text-gray-900">{quizStats.total}</p>
                            <p class="text-[10px] text-gray-400">Attempts</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 text-center">
                            <p class="text-lg font-bold text-gray-900">{quizStats.accuracy}%</p>
                            <p class="text-[10px] text-gray-400">Accuracy</p>
                        </div>
                    </div>
                </div>

                {#if atsScore != null}
                    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">ATS Score</p>
                        <div class="mt-2 flex items-end gap-2">
                            <span class="text-3xl font-bold text-gray-900">{atsScore}</span>
                            <span class="text-sm text-gray-400">/100</span>
                        </div>
                        <div class="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                 style="width: {atsScore}%; transition: width 0.6s ease;">
                            </div>
                        </div>
                        {#if scoreBreakdown}
                            <div class="mt-3 flex flex-wrap gap-1.5">
                                {#each Object.entries(scoreBreakdown) as [key, value]}
                                    {#if value != null}
                                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                            {key}: {value}
                                        </span>
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                {#if compositeScore != null}
                    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">⭐ Overall Rating</p>
                        <div class="mt-2 flex items-end gap-2">
                            <span class="text-3xl font-bold text-gray-900">{compositeScore}</span>
                            <span class="text-sm text-gray-400">/100</span>
                            <span class="ml-auto rounded-full px-2 py-0.5 text-xs font-bold
                                {compositeScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                 compositeScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}">
                                {compositeScore >= 70 ? 'Strong' : compositeScore >= 50 ? 'Fair' : 'Weak'}
                            </span>
                        </div>
                        <div class="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r
                                {compositeScore >= 70 ? 'from-emerald-500 to-teal-500' :
                                 compositeScore >= 50 ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-red-500'}"
                                 style="width: {compositeScore}%; transition: width 0.6s ease;">
                            </div>
                        </div>
                        <p class="mt-2 text-[10px] text-gray-400">80% Quiz · 20% ATS</p>
                    </div>
                {/if}

                {#if ghIntelligence && Object.keys(ghIntelligence).length > 0}
                    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">GitHub</p>
                        <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p class="text-sm font-bold text-gray-900">{ghIntelligence.public_repos ?? "—"}</p>
                                <p class="text-[10px] text-gray-400">Repos</p>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-900">{ghIntelligence.followers ?? "—"}</p>
                                <p class="text-[10px] text-gray-400">Followers</p>
                            </div>
                            <div>
                                <p class="text-sm font-bold capitalize text-gray-900">{ghIntelligence.activity_level || "—"}</p>
                                <p class="text-[10px] text-gray-400">Activity</p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-5">

                <!-- Tab: Overview -->
                {#if activeTab === 'overview'}
                    <div class="grid gap-3 sm:grid-cols-2">
                        {#if applicantEmail}
                            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                    <Mail size={16} class="text-gray-500" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-[10px] text-gray-400 uppercase tracking-wider">Email</p>
                                    <p class="mt-0.5 text-sm font-medium text-gray-900 truncate">{applicantEmail}</p>
                                </div>
                            </div>
                        {/if}
                        {#if applicantPhone}
                            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                    <User size={16} class="text-gray-500" />
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p>
                                    <p class="mt-0.5 text-sm font-medium text-gray-900">{applicantPhone}</p>
                                </div>
                            </div>
                        {/if}
                        {#if applicantLocation}
                            <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                    <MapPin size={16} class="text-gray-500" />
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-400 uppercase tracking-wider">Location</p>
                                    <p class="mt-0.5 text-sm font-medium text-gray-900">{applicantLocation}</p>
                                </div>
                            </div>
                        {/if}
                        <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                <Calendar size={16} class="text-gray-500" />
                            </div>
                            <div>
                                <p class="text-[10px] text-gray-400 uppercase tracking-wider">Submitted</p>
                                <p class="mt-0.5 text-sm font-medium text-gray-900">{formatDate(applicantSubmitted)}</p>
                            </div>
                        </div>
                    </div>

                    {#if coverLetter}
                        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                            <div class="flex items-center gap-2">
                                <FileText size={16} class="text-gray-400" />
                                <h3 class="text-sm font-semibold text-gray-700">Cover Letter</h3>
                            </div>
                            <div class="mt-3 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                                {coverLetter}
                            </div>
                        </div>
                    {/if}
                {/if}

                <!-- Tab: Analysis -->
                {#if activeTab === 'analysis'}
                    {#if loadingIntelligence}
                        <div class="flex items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-200/50">
                            <Loader2 size={24} class="animate-spin text-indigo-600" />
                            <span class="ml-3 text-sm text-gray-500">Analyzing resume...</span>
                        </div>
                    {:else if intelligenceData}
                        <div class="grid gap-4 sm:grid-cols-2">
                            {#if getStrengths().length > 0}
                                <div class="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm ring-1 ring-emerald-100/50 transition-all duration-200 hover:shadow-md">
                                    <div class="flex items-center gap-2 text-emerald-600">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                            <ThumbsUp size={16} />
                                        </div>
                                        <h3 class="text-sm font-semibold">Strengths</h3>
                                        <span class="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                            {getStrengths().length}
                                        </span>
                                    </div>
                                    <ul class="mt-3 space-y-2">
                                        {#each getStrengths() as s}
                                            <li class="flex items-start gap-2.5 text-sm text-gray-700">
                                                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"></span>
                                                {s}
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}

                            {#if getWeaknesses().length > 0}
                                <div class="rounded-2xl bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm ring-1 ring-rose-100/50 transition-all duration-200 hover:shadow-md">
                                    <div class="flex items-center gap-2 text-rose-600">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                                            <ThumbsDown size={16} />
                                        </div>
                                        <h3 class="text-sm font-semibold">Areas to Improve</h3>
                                        <span class="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                                            {getWeaknesses().length}
                                        </span>
                                    </div>
                                    <ul class="mt-3 space-y-2">
                                        {#each getWeaknesses() as w}
                                            <li class="flex items-start gap-2.5 text-sm text-gray-700">
                                                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"></span>
                                                {w}
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>

                        {#if checks.length > 0}
                            <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 overflow-hidden">
                                <div class="border-b border-gray-100 px-5 py-3">
                                    <div class="flex items-center gap-2">
                                        <ShieldCheck size={16} class="text-gray-400" />
                                        <h3 class="text-sm font-semibold text-gray-700">Field Validation</h3>
                                        <span class="ml-auto flex items-center gap-1.5 text-xs">
                                            <span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                                ✅ {checks.filter(c => c.status === 'pass').length}
                                            </span>
                                            <span class="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                                                ⚠️ {checks.filter(c => c.status === 'warn').length}
                                            </span>
                                            <span class="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                                                ❌ {checks.filter(c => c.status === 'fail').length}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div class="divide-y divide-gray-100">
                                    {#each checks as check}
                                        <div class="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <div class="mt-0.5 shrink-0">
                                                {#if check.status === "pass"}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                        <Check size={12} />
                                                    </span>
                                                {:else if check.status === "warn"}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                                        <AlertTriangle size={12} />
                                                    </span>
                                                {:else}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                                        <X size={12} />
                                                    </span>
                                                {/if}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <p class="text-sm font-medium text-gray-800">{check.field || check.label || "—"}</p>
                                                <p class="text-xs text-gray-500">{check.message || check.detail || ""}</p>
                                            </div>
                                            <span class="text-[10px] font-medium capitalize text-gray-400">{check.status}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        {#if suggestedHeadline || suggestedSkills.length > 0 || suggestedEducation.length > 0}
                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <div class="flex items-center gap-2">
                                    <Sparkles size={16} class="text-purple-500" />
                                    <h3 class="text-sm font-semibold text-gray-700">AI Suggestions</h3>
                                </div>

                                {#if suggestedHeadline}
                                    <div class="mt-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-3 text-sm font-medium text-purple-900">
                                        💡 {suggestedHeadline}
                                    </div>
                                {/if}

                                {#if suggestedSkills.length > 0}
                                    <div class="mt-3">
                                        <p class="text-xs text-gray-400">Suggested Skills</p>
                                        <div class="mt-1.5 flex flex-wrap gap-1.5">
                                            {#each suggestedSkills as skill}
                                                <span class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                                                    {skill}
                                                </span>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                {#if suggestedEducation.length > 0}
                                    <div class="mt-3">
                                        <p class="text-xs text-gray-400">Extracted Education</p>
                                        <ul class="mt-1.5 space-y-1">
                                            {#each suggestedEducation as edu}
                                                <li class="flex items-start gap-2 text-sm text-gray-600">
                                                    <span class="mt-1 text-gray-400">📚</span>
                                                    {edu}
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    {:else}
                        <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                                <BrainCircuit size={28} class="text-gray-300" />
                            </div>
                            <h3 class="text-sm font-semibold text-gray-700">No analysis data</h3>
                            <p class="mt-1 text-xs text-gray-400 max-w-xs mx-auto">Resume intelligence data hasn't been generated for this applicant yet.</p>
                        </div>
                    {/if}
                {/if}

                <!-- Tab: GitHub -->
                {#if activeTab === 'github'}
                    {#if loadingIntelligence}
                        <div class="flex items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-200/50">
                            <Loader2 size={24} class="animate-spin text-indigo-600" />
                            <span class="ml-3 text-sm text-gray-500">Loading GitHub data...</span>
                        </div>
                    {:else if ghIntelligence && Object.keys(ghIntelligence).length > 0}
                        <div class="space-y-4">
                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                                            <GitBranch size={16} class="text-gray-600" />
                                        </div>
                                        <h3 class="text-sm font-semibold text-gray-700">GitHub Profile</h3>
                                    </div>
                                    {#if applicantGithub}
                                        <a href="https://github.com/{applicantGithub}" target="_blank" rel="noopener"
                                           class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                                            View profile
                                            <ExternalLink size={12} />
                                        </a>
                                    {/if}
                                </div>

                                <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div class="rounded-xl bg-gray-50 p-3 text-center">
                                        <p class="text-xl font-bold text-gray-900">{ghIntelligence.public_repos ?? "—"}</p>
                                        <p class="text-[10px] text-gray-400">Repos</p>
                                    </div>
                                    <div class="rounded-xl bg-gray-50 p-3 text-center">
                                        <p class="text-xl font-bold text-gray-900">{ghIntelligence.followers ?? "—"}</p>
                                        <p class="text-[10px] text-gray-400">Followers</p>
                                    </div>
                                    <div class="rounded-xl bg-gray-50 p-3 text-center">
                                        <p class="text-xl font-bold text-gray-900">{ghIntelligence.following ?? "—"}</p>
                                        <p class="text-[10px] text-gray-400">Following</p>
                                    </div>
                                    <div class="rounded-xl bg-gray-50 p-3 text-center">
                                        <p class="text-sm font-bold capitalize text-gray-900">{ghIntelligence.activity_level || "—"}</p>
                                        <p class="text-[10px] text-gray-400">Activity</p>
                                    </div>
                                </div>

                                {#if ghIntelligence.focus}
                                    <div class="mt-3 rounded-xl bg-blue-50 p-3 flex items-center gap-2 border border-blue-100">
                                        <span class="text-blue-500 text-sm">🎯</span>
                                        <div>
                                            <p class="text-[10px] text-blue-400 uppercase tracking-wider">Primary Focus</p>
                                            <p class="text-sm font-medium text-blue-900">{ghIntelligence.focus}</p>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            {#if ghLanguages.length > 0}
                                <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                    <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Top Languages</p>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        {#each ghLanguages as lang}
                                            {@const name = getLangName(lang)}
                                            {@const pct = getLangPercentage(lang)}
                                            <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                                                <span class="h-2 w-2 rounded-full"
                                                      style="background: {['#f1e05a', '#3178c6', '#563d7c', '#e34c26', '#2b7489'][ghLanguages.indexOf(lang) % 5]}">
                                                </span>
                                                {name}
                                                {#if pct}
                                                    <span class="text-xs text-gray-400">{pct}%</span>
                                                {/if}
                                            </span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                                <GitBranch size={28} class="text-gray-300" />
                            </div>
                            <h3 class="text-sm font-semibold text-gray-700">No GitHub data</h3>
                            <p class="mt-1 text-xs text-gray-400">GitHub intelligence hasn't been collected for this applicant.</p>
                            {#if applicantGithub}
                                <a href="https://github.com/{applicantGithub}" target="_blank" rel="noopener"
                                   class="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                    Visit @{applicantGithub} →
                                </a>
                            {/if}
                        </div>
                    {/if}
                {/if}

                <!-- Tab: Quiz -->
                {#if activeTab === 'quiz'}
                    <div class="space-y-4">
                        <!-- Score Card with Circular Progress -->
                        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
                            <div class="flex flex-col sm:flex-row items-center gap-6">
                                <div class="relative">
                                    <svg class="w-28 h-28 -rotate-90">
                                        <circle cx="56" cy="56" r="48" fill="none" stroke="#f3f4f6" stroke-width="8"/>
                                        <circle cx="56" cy="56" r="48" fill="none"
                                            stroke="{applicantScore >= 70 ? '#10b981' : applicantScore >= 50 ? '#f59e0b' : '#ef4444'}"
                                            stroke-width="8"
                                            stroke-dasharray="{2 * Math.PI * 48 * (applicantScore/100)} {2 * Math.PI * 48 * (1 - applicantScore/100)}"
                                            stroke-linecap="round"
                                            class="transition-all duration-1000"/>
                                    </svg>
                                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                                        <span class="text-2xl font-bold text-gray-900">{applicantScore}</span>
                                        <span class="text-[10px] text-gray-400">/ 100</span>
                                    </div>
                                </div>
                                <div class="text-center sm:text-left">
                                    <h3 class="text-lg font-bold text-gray-900">Quiz Score</h3>
                                    <div class="mt-2 flex items-center gap-2">
                                        <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold
                                            {applicantScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                             applicantScore >= 50 ? 'bg-amber-100 text-amber-700' :
                                             'bg-rose-100 text-rose-700'}">
                                            {applicantScore >= 70 ? '✅ Passed' :
                                             applicantScore >= 50 ? '⚠️ Marginal' :
                                             '❌ Failed'}
                                        </span>
                                    </div>
                                    <p class="mt-2 text-xs text-gray-400">
                                        {applicantScore >= 70 ? 'Strong performance — recommended for next stage' :
                                         applicantScore >= 50 ? 'Moderate performance — review recommended' :
                                         'Below threshold — may need additional screening'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Stats Grid -->
                        <div class="grid grid-cols-3 gap-3">
                            <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 text-center">
                                <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                                    <Trophy size={18} class="text-indigo-500" />
                                </div>
                                <p class="text-2xl font-bold text-gray-900">{quizStats.total}</p>
                                <p class="text-[10px] text-gray-400 mt-0.5">Questions</p>
                            </div>
                            <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 text-center">
                                <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                                    <Check size={18} class="text-emerald-500" />
                                </div>
                                <p class="text-2xl font-bold text-gray-900">{quizStats.correct}</p>
                                <p class="text-[10px] text-gray-400 mt-0.5">Correct</p>
                            </div>
                            <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/50 text-center">
                                <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                                    <BarChart3 size={18} class="text-purple-500" />
                                </div>
                                <p class="text-2xl font-bold text-gray-900">{quizStats.accuracy}%</p>
                                <p class="text-[10px] text-gray-400 mt-0.5">Accuracy</p>
                            </div>
                        </div>

                        {#if quizStats.last}
                            <div class="rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-gray-200/50">
                                <p class="text-xs text-gray-400">
                                    📅 Last activity: {new Date(quizStats.last).toLocaleString()}
                                </p>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        {/if}
    </div>
</div>

<style>
    /* Tab content fade-in */
    :global(.tab-fade-in) {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Score ring animation */
    :global(.score-ring-animate) {
        animation: ringGrow 1.2s ease-out forwards;
    }

    @keyframes ringGrow {
        from {
            stroke-dasharray: 0 302;
        }
    }

    /* Smooth scrollbar */
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 4px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background: #d1d5db;
        border-radius: 9999px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
        background: #9ca3af;
    }
</style>
