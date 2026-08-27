<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import { intelligenceService } from "$lib/api/intelligence.service";
    import { applicationService } from "$lib/api/application.service";
    import { questionService } from "$lib/api/questions.service";
    import {
        Loader2, XCircle, ArrowLeft, Github,
        Target, FileText, Briefcase,
        CheckCircle2, BookOpen, Award
    } from "@lucide/svelte";

    const id = $page.params.id;

    let loading = $state(true);
    let data = $state(null);
    let error = $state("");

    function initials(name) {
        if (!name) return "?";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    function displayName(d) {
        if (d?.full_name) return d.full_name;
        if (d?.github_username) return d.github_username;
        return "Unknown";
    }

    function formatTime(s) {
        if (!s && s !== 0) return "--";
        const m = Math.floor(s / 60);
        const sec = s % 60;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }

    // The backend nests the ATS score inside ai_summary.summary as a JSON string
    // (e.g. { analysis: { ats_score, checks: [...] } }). Parse it into the shape
    // the ATS Score card renders ({ score, grade, checks, summary }).
    function extractAtsScore(intelligence) {
        const raw = intelligence?.ai_summary?.summary;
        if (!raw) return null;

        let parsed = raw;
        if (typeof raw === "string") {
            try {
                parsed = JSON.parse(raw);
            } catch {
                return null;
            }
        }
        if (!parsed || typeof parsed !== "object") return null;

        const analysis = parsed.analysis || parsed;
        const score = analysis?.ats_score;
        if (typeof score !== "number") return null;

        const grade =
            score >= 80
                ? "Excellent"
                : score >= 60
                  ? "Good"
                  : score >= 40
                    ? "Fair"
                    : "Needs Work";

        const checks = Array.isArray(analysis?.checks)
            ? analysis.checks.map((c) => ({
                  label: c.field || c.label || c.message || "Check",
                  score: c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0,
                  max: 1,
                  message: c.message || c.detail || "",
              }))
            : [];

        return {
            score,
            grade,
            checks,
            summary: checks.length
                ? `${checks.filter((c) => c.score >= 1).length} of ${checks.length} checks passing`
                : `ATS score ${score}%`,
        };
    }

    $effect(() => {
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            goto("/auth");
            return;
        }
        loadData();
    });

    async function loadData() {
        const uid = $auth.user?.id;
        if (!uid) {
            error = "User not authenticated";
            loading = false;
            return;
        }
        // The intelligence endpoint expects a USER id (NOT the quiz attempt id from
        // the URL). Client users see their own report; admins pass ?user_id=.
        const search = $page.url.searchParams;
        const applicationId = search.get("application_id");
        const targetId = search.get("user_id") || uid;

        // Job context so the header can tell users WHICH job this attempt belongs
        // to. The list pages pass ?job_title=&job_company= directly; when only
        // ?application_id= is present (deep link), resolve them from the
        // application detail endpoint. Both are best-effort — never fail the page.
        let jobTitle = search.get("job_title") || "";
        let jobCompany = search.get("job_company") || "";
        if (applicationId && (!jobTitle || !jobCompany)) {
            try {
                const detail = await applicationService.getApplicationDetail(applicationId);
                jobTitle = jobTitle || detail?.JobTitle || detail?.job_title || "";
                jobCompany = jobCompany || detail?.JobCompany || detail?.job_company || "";
            } catch {
                // keep whatever was passed via the URL
            }
        }
        const quizTitle = search.get("quiz_title") || "";
        try {
            // 1. Authoritative source: the GitHub intelligence report from the
            //    backend. It carries quiz_answers (PascalCase), github_intelligence
            //    and ai_summary. This is what the page is designed to render.
            let intelligence = null;
            try {
                intelligence = await intelligenceService.fetchGitHubIntelligence(targetId);
            } catch {
                intelligence = null;
            }

            // 2. Fallback: the quiz result saved locally after submitting the quiz
            //    (works offline or when the intelligence endpoint is unavailable).
            let local = null;
            try {
                local = await quizService.getResult(id, uid);
            } catch {
                local = null;
            }

            const user = $auth.user || {};
            // The backend returns answers for ALL of the user's quiz attempts
            // (GetUserQuizAnswers filters only by user_id). Each answer carries
            // its own QuizAttemptID, so keep only the ones that belong to THIS
            // quiz attempt (the URL id). This stops answers from other quizzes
            // / jobs taken by the same user from showing up here.
            const allApiAnswers = Array.isArray(intelligence?.quiz_answers)
                ? intelligence.quiz_answers
                : [];
            // The local result (saved at submit time) carries the correct answer
            // per question — use it to fill the Correct Answer column when the API
            // hasn't been rebuilt to include it yet. The API's own value (if
            // present) always wins.
            const correctByQuestion = new Map();
            if (Array.isArray(local?.answers)) {
                for (const a of local.answers) {
                    if (a.question_id && a.correct_answer != null) {
                        correctByQuestion.set(a.question_id, a.correct_answer);
                    }
                }
            }
            // Admins: enrich from the existing (unchanged) GET /questions endpoint —
            // no backend change required. Clients get a 403 here, silently ignored.
            if ($auth.user?.role === "admin") {
                try {
                    const allQ = await questionService.listQuestions();
                    for (const q of allQ) {
                        const qid = q.ID ?? q.id;
                        const qa = q.CorrectAnswer ?? q.correct_answer;
                        if (qid && qa != null && !correctByQuestion.has(qid)) {
                            correctByQuestion.set(qid, qa);
                        }
                    }
                } catch {
                    // ignore — falls back to localStorage / "--"
                }
            }
            const apiAnswers = allApiAnswers
                .filter((a) => a.QuizAttemptID === id)
                .map((a) => ({
                    ...a,
                    CorrectAnswer:
                        a.CorrectAnswer ?? correctByQuestion.get(a.QuestionID) ?? null,
                }));
            const localAnswers = Array.isArray(local?.answers)
                ? local.answers.map((a) => ({
                      UserAnswer: a.user_answer,
                      CorrectAnswer: a.correct_answer,
                      IsCorrect: a.is_correct,
                      IsSkipped: a.is_skipped,
                      TimeSpentSeconds: a.time_spent_seconds,
                  }))
                : [];

            // The quiz score is computed from the AUTHORITATIVE per-attempt answers
            // returned by the backend (each carries IsCorrect), not the session-local
            // snapshot. The local snapshot under-counts questions when a quiz was
            // resumed across sessions/tabs (earlier answers exist only in the
            // backend), which inflates the score. Fall back to it only when the API
            // has no answers for this attempt. This also gives admins a score card
            // (they have no localStorage).
            let quizAttempt = null;
            if (apiAnswers.length) {
                const correctCount = apiAnswers.filter((a) => a.IsCorrect).length;
                const totalCount = apiAnswers.length;
                const attemptScore =
                    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
                quizAttempt = {
                    score: attemptScore,
                    correct_count: correctCount,
                    total_count: totalCount,
                    passed: attemptScore >= 70,
                    passing_score: 70,
                    status: "completed",
                };
            } else if (local) {
                quizAttempt = {
                    score: local.score ?? 0,
                    correct_count: local.correct_answers ?? 0,
                    total_count: local.total_questions ?? 0,
                    passed: local.passed ?? false,
                    passing_score: local.passing_score ?? 70,
                    status: "completed",
                };
            }

            data = {
                job_title: jobTitle,
                job_company: jobCompany,
                quiz_title: local?.title || quizTitle || "Technical Core Assessment",
                full_name:
                    intelligence?.github_username ||
                    user.name ||
                    user.github_username ||
                    "",
                github_username:
                    intelligence?.github_username || user.github_username || "",
                user_id: intelligence?.user_id || targetId,
                github_intelligence: intelligence?.github_intelligence || null,
                ai_summary: intelligence?.ai_summary || null,
                quiz_attempt: quizAttempt,
                quiz_answers: apiAnswers.length ? apiAnswers : localAnswers,
                ats_score: extractAtsScore(intelligence),
            };

            // Calculate combined final exam score: 80% quiz + 20% ATS
            const quizPct = data.quiz_attempt?.score ?? 0;
            const atsPct = data.ats_score?.score ?? null;
            if (atsPct !== null) {
                data.final_score = Math.round(quizPct * 0.8 + atsPct * 0.2);
            } else {
                data.final_score = quizPct;
            }
        } catch (e) {
            error = e.message || "Failed to load quiz result";
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 font-sans">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <div class="flex items-center justify-center py-20">
                <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
            </div>

        {:else if error}
            <div class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <XCircle class="mx-auto h-12 w-12 text-red-400" />
                <h2 class="mt-4 text-lg font-semibold text-red-700">Failed to load data</h2>
                <p class="mt-2 text-sm text-red-500">{error}</p>
                <button onclick={() => goto("/applications")} class="btn mt-6 gap-2 border-red-300 bg-white text-red-600 hover:bg-red-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back
                </button>
            </div>

        {:else if data}

            <!-- User Header -->
            <div class="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-500 p-6 text-white shadow-lg sm:p-8">
                <div class="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-white/5 blur-2xl" />
                <div class="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white shadow-inner backdrop-blur-sm">
                        {initials(data.github_username || data.full_name)}
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-3">
                            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{displayName(data)}</h1>
                            {#if data.github_username}
                                <a href="https://github.com/{data.github_username}" target="_blank" rel="noopener noreferrer" class="badge gap-1 border-white/30 bg-white/10 text-white hover:bg-white/20" style="padding: 0.375rem 0.75rem;">
                                    <Github class="h-3.5 w-3.5" />
                                    @{data.github_username}
                                </a>
                            {/if}
                        </div>
                        {#if data.job_title}
                            <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm font-medium text-indigo-100">
                                <Briefcase class="h-4 w-4 shrink-0" />
                                <span>{data.job_title}</span>
                                {#if data.job_company}
                                    <span class="opacity-80">&middot; {data.job_company}</span>
                                {/if}
                            </div>
                        {/if}
                        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-indigo-100">
                            {#if data.quiz_title}
                                <span class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                    <BookOpen class="h-3 w-3" />
                                    {data.quiz_title}
                                </span>
                            {/if}
                            <span class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                ID: {data.user_id || id}
                            </span>
                            {#if data.filename}
                                <span class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                    <FileText class="h-3 w-3" />
                                    {data.filename}
                                </span>
                            {/if}
                            {#if data.char_count}
                                <span class="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                    {data.char_count.toLocaleString()} chars
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>



            <!-- Final Exam Score -->
            <div class="mb-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm">
                <div class="mb-4 flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                        <Award class="h-4 w-4 text-white" />
                    </div>
                    <h2 class="text-sm font-semibold uppercase tracking-wider text-indigo-700">Final Exam Score</h2>
                </div>

                <div class="mb-6 text-center">
                    <span class="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-7xl font-bold text-transparent">
                        {data.final_score}
                    </span>
                    <span class="text-3xl font-bold text-slate-400">%</span>

                    <div class="mt-3 text-sm text-slate-500">
                        {#if data.ats_score}
                            <span class="font-medium text-indigo-600">80%</span> Quiz + <span class="font-medium text-indigo-600">20%</span> ATS CV Format
                        {:else}
                            Quiz Score (ATS CV not available)
                        {/if}
                    </div>

                    <div class="mt-3">
                        {#if data.final_score >= 70}
                            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                <CheckCircle2 class="h-4 w-4" />
                                PASSED
                            </span>
                        {:else}
                            <span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                                <XCircle class="h-4 w-4" />
                                FAILED
                            </span>
                        {/if}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="rounded-xl bg-white p-4 text-center shadow-sm">
                        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Quiz Score</div>
                        <div class="mt-1 text-2xl font-bold text-slate-700">{data.quiz_attempt?.score ?? 0}%</div>
                        <div class="text-xs text-slate-400">× 80% = {Math.round((data.quiz_attempt?.score ?? 0) * 0.8)}</div>
                    </div>
                    <div class="rounded-xl bg-white p-4 text-center shadow-sm">
                        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">ATS CV Score</div>
                        <div class="mt-1 text-2xl font-bold text-slate-700">{data.ats_score?.score ?? '--'}%</div>
                        <div class="text-xs text-slate-400">{data.ats_score ? `× 20% = ${Math.round(data.ats_score.score * 0.2)}` : 'Not available'}</div>
                    </div>
                </div>
            </div>

            <!-- Quiz Score -->
            {#if data.quiz_attempt}
                {@const pct = data.quiz_attempt.score ?? 0}
                <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="mb-4 flex items-center gap-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <Target class="h-4 w-4 text-indigo-600" />
                        </div>
                        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Quiz Score</h2>
                    </div>

                    <div class="mb-6 text-center">
                        <span class="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-6xl font-bold text-transparent">
                            {pct}
                        </span>
                        <span class="text-2xl font-bold text-slate-400">%</span>

                        <div class="mt-2 text-sm text-slate-500">
                            {data.quiz_attempt.correct_count ?? 0} / {data.quiz_attempt.total_count ?? 0} correct
                        </div>

                        {#if data.quiz_attempt.passed !== null && data.quiz_attempt.passed !== undefined}
                            <div class="mt-3">
                                {#if data.quiz_attempt.passed}
                                    <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                        <CheckCircle2 class="h-4 w-4" />
                                        PASSED
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                                        <XCircle class="h-4 w-4" />
                                        FAILED
                                    </span>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <div class="mb-3">
                        <div class="mb-1 flex items-center justify-between text-sm">
                            <span class="font-medium text-slate-700">Score</span>
                            <span class="font-semibold text-slate-500">{pct}%</span>
                        </div>
                        <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700" style="width: {pct}%"></div>
                        </div>
                    </div>

                    <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                        Passing threshold: {data.quiz_attempt.passing_score ?? 0}% &middot; Status: <span class="font-medium capitalize">{data.quiz_attempt.status}</span>
                    </div>
                </div>
            {/if}

            <!-- ATS Score -->
            {#if data.ats_score}
                {@const ats = data.ats_score}
                <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="mb-4 flex items-center gap-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <Target class="h-4 w-4 text-indigo-600" />
                        </div>
                        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">ATS Score</h2>
                    </div>

                    <div class="mb-6 text-center">
                        <span class="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-6xl font-bold text-transparent">
                            {ats.score}
                        </span>
                        <span class="text-2xl font-bold text-slate-400">%</span>

                        <div class="mt-3">
                            <span class="badge gap-1.5 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                {ats.grade}
                            </span>
                        </div>
                    </div>

                    {#each ats.checks as check}
                        {@const pct = check.max > 0 ? Math.round((check.score / check.max) * 100) : 0}
                        <div class="mb-3">
                            <div class="mb-1 flex items-center justify-between text-sm">
                                <span class="font-medium text-slate-700">{check.label}</span>
                                <span class="font-semibold text-slate-500">{check.score}/{check.max}</span>
                            </div>
                            <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700" style="width: {pct}%"></div>
                            </div>
                            {#if check.message}
                                <p class="mt-1 text-xs text-slate-500">{check.message}</p>
                            {/if}
                        </div>
                    {/each}

                    {#if ats.summary}
                        <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                            {ats.summary}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Extracted Text -->
            {#if data.extracted_text}
                <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="mb-4 flex items-center gap-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <FileText class="h-4 w-4 text-indigo-600" />
                        </div>
                        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Extracted Text</h2>
                    </div>
                    <pre class="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{data.extracted_text}</pre>
                </div>
            {/if}

            <!-- Quiz Answers -->
            {#if data.quiz_answers?.length}
                <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="mb-4 flex items-center gap-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <BookOpen class="h-4 w-4 text-indigo-600" />
                        </div>
                        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Quiz Answers</h2>
                    </div>

                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="table table-zebra table-sm w-full text-sm">
                            <thead>
                                <tr class="bg-slate-50 text-xs uppercase text-slate-500">
                                    <th class="px-3 py-2">#</th>
                                    <th class="px-3 py-2">Your Answer</th>
                                    <th class="px-3 py-2">Correct Answer</th>
                                    <th class="px-3 py-2">Result</th>
                                    <th class="px-3 py-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.quiz_answers as answer, idx}
                                    <tr>
                                        <td class="px-3 py-2 font-mono text-xs text-slate-400">{idx + 1}</td>
                                        <td class="max-w-xs truncate px-3 py-2">
                                            {#if answer.IsSkipped}
                                                <span class="text-amber-500 italic">Skipped</span>
                                            {:else}
                                                <!-- || (not ??) so empty-string answers also render as -- -->
                                                <span class="text-slate-700">{answer.UserAnswer || "--"}</span>
                                            {/if}
                                        </td>
                                        <td class="max-w-xs truncate px-3 py-2">
                                            {#if answer.IsSkipped}
                                                <span class="text-slate-400">--</span>
                                            {:else}
                                                <span class="font-medium {answer.IsCorrect ? 'text-emerald-600' : 'text-red-500'}">
                                                    {answer.CorrectAnswer || "--"}
                                                </span>
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2">
                                            {#if answer.IsSkipped}
                                                <span class="badge badge-sm badge-ghost">Skipped</span>
                                            {:else if answer.IsCorrect}
                                                <span class="badge badge-sm badge-success">Correct</span>
                                            {:else}
                                                <span class="badge badge-sm badge-error">Wrong</span>
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2 font-mono text-xs text-slate-500">
                                            {formatTime(answer.TimeSpentSeconds)}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}

            <!-- Bottom Actions -->
            <div class="flex justify-center gap-3 pb-8">
                <button onclick={() => goto("/applications")} class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back to Applications
                </button>
            </div>

        {/if}
    </div>
</div>