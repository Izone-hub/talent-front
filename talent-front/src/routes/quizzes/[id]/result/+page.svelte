<script>
    import { goto, replaceState } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import { intelligenceService } from "$lib/api/intelligence.service";
    import { applicationService } from "$lib/api/application.service";
    import { questionService } from "$lib/api/questions.service";
    import {
        Loader2, XCircle, ArrowLeft, Github,
        Target, FileText, Briefcase,
        CheckCircle2, BookOpen, Award,
        ThumbsUp, ThumbsDown, MessageSquare, Send,
        AlertTriangle
    } from "lucide-svelte";

    const id = $page.params.id;

    let loading = $state(true);
    let data = $state(null);
    let error = $state("");

    // Feedback state
    let feedbackRating = $state(null);
    let feedbackComment = $state("");
    let feedbackSaving = $state(false);
    let feedbackLoaded = $state(false);
    let feedbackSavedMessage = $state(false);
    let feedbackErrorMessage = $state("");
    let serverValidationError = $state("");
    let serverUnreadableWords = $state([]);
    let existingFeedback = $state(null);
    let currentApplicationId = $state("");
    let loadedAttemptId = "";
    let validationTimer = null;

    const profanePattern = /\b(f(?:uck(?:ing|er|ed|s)?|uk|ck|\*+c?k|u\*+k)|motherf(?:uck(?:ing|er|ed|s)?|\*+c?k)|sh(?:it(?:ty|ting|s)?|t|\*+t|1t)|bullsh(?:it|t|\*+t)|b(?:itch(?:es|y|ing)?|tch|1tch|\*+tch)|ass(?:es|hole|holes|hat)?|dumbass(?:es)?|jackass(?:es)?|bastard(?:s)?|cunt(?:s)?|d(?:ick(?:s|head|heads)?|1ck|\*+ck)|pussy|pussies|cock(?:s|sucker)?|whore(?:s)?|slut(?:s|ty)?|retard(?:ed|s)?|nigger(?:s)?|nigga(?:s)?|faggot(?:s)?|fag(?:s)?|wanker(?:s)?|prick(?:s)?|twat(?:s)?|douche(?:bag)?|blowjob(?:s)?)\b/i;
    const spacedProfanePattern = /\b(f[\s.\-_*]+u[\s.\-_*]+c[\s.\-_*]+k|s[\s.\-_*]+h[\s.\-_*]+i[\s.\-_*]+t|b[\s.\-_*]+i[\s.\-_*]+t[\s.\-_*]+c[\s.\-_*]+h|c[\s.\-_*]+u[\s.\-_*]+n[\s.\-_*]+t|d[\s.\-_*]+i[\s.\-_*]+c[\s.\-_*]+k)\b/i;

    const archaicAndGibberishWords = new Set([
        'ere', 'ye', 'thou', 'thee', 'thy', 'thine', 'quoth', 'yclept', 'fain',
        'hark', 'anon', 'betwixt', 'perchance', 'whilom', 'forsooth', 'eft', 'eke',
        'ern', 'erst', 'adz', 'ais', 'ala', 'alb', 'ani', 'apo', 'ara', 'erg', 'err',
        'asdf', 'asdfgh', 'asdfghjkl', 'qwerty', 'zxcv', 'jkl', 'jkljkl', 'xyz'
    ]);

    function normalizeLeet(text) {
        return text
            .toLowerCase()
            .replace(/[@]/g, 'a')
            .replace(/[\$5]/g, 's')
            .replace(/[!1|]/g, 'i')
            .replace(/[0]/g, 'o')
            .replace(/[3]/g, 'e');
    }

    function checkClientGibberish(text) {
        const tokens = text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || [];
        for (const token of tokens) {
            const clean = token.toLowerCase().replace(/'/g, '');
            // Single letters other than 'a' or 'i'
            if (clean.length === 1 && clean !== 'a' && clean !== 'i') {
                return { word: token, error: `Unrecognized single-letter word: '${token}'.` };
            }
            // 3+ identical consecutive characters (e.g. 'sooooo', 'zzzzz')
            if (/([a-zA-Z])\1{2,}/.test(clean)) {
                return { word: token, error: `Unreadable repeated characters in word: '${token}'.` };
            }
            // Meaningless / archaic words like 'ere', 'asdf'
            if (archaicAndGibberishWords.has(clean)) {
                return { word: token, error: `Unrecognized or meaningless word: '${token}'. Please write meaningful English feedback.` };
            }
            // 3+ letter word with no vowels (y counts as vowel)
            if (clean.length >= 3 && !/[aeiouy]/.test(clean)) {
                return { word: token, error: `Unreadable or meaningless word: '${token}'. Please write meaningful English feedback.` };
            }
            // 5+ consecutive consonants without vowel
            if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(clean)) {
                return { word: token, error: `Unreadable consonant sequence in word: '${token}'.` };
            }
        }
        return null;
    }

    let clientValidationResult = $derived.by(() => {
        const trimmed = feedbackComment.trim();
        if (!trimmed) return { error: "", words: [] };

        // 1. Language validation: English printable ASCII only
        for (let i = 0; i < trimmed.length; i++) {
            const code = trimmed.charCodeAt(i);
            if (code === 10 || code === 13 || code === 9) continue; // \n, \r, \t
            if (code < 32 || code > 126) {
                return {
                    error: "Feedback must be written in English using standard Latin characters.",
                    words: []
                };
            }
        }

        // 2. Profanity validation
        if (profanePattern.test(trimmed) || spacedProfanePattern.test(trimmed)) {
            return {
                error: "Inappropriate or offensive language is not allowed in feedback.",
                words: []
            };
        }
        const norm = normalizeLeet(trimmed);
        if (profanePattern.test(norm) || spacedProfanePattern.test(norm)) {
            return {
                error: "Inappropriate or offensive language is not allowed in feedback.",
                words: []
            };
        }

        // 3. Gibberish and meaningless words check
        const gibberish = checkClientGibberish(trimmed);
        if (gibberish) {
            return {
                error: gibberish.error,
                words: [gibberish.word]
            };
        }

        return { error: "", words: [] };
    });

    let activeValidationError = $derived(
        clientValidationResult.error || serverValidationError || ""
    );

    let activeUnreadableWords = $derived(
        clientValidationResult.words.length > 0
            ? clientValidationResult.words
            : serverUnreadableWords
    );

    // Debounced server dictionary validation
    $effect(() => {
        const comment = feedbackComment.trim();
        if (!comment || clientValidationResult.error) {
            serverValidationError = "";
            serverUnreadableWords = [];
            return;
        }

        if (validationTimer) clearTimeout(validationTimer);
        validationTimer = setTimeout(async () => {
            try {
                const res = await quizService.validateQuizResultFeedback(id, comment);
                if (res && res.valid === false) {
                    serverValidationError = res.error || "Unrecognized or meaningless words detected.";
                    serverUnreadableWords = res.unreadable_words || [];
                } else {
                    serverValidationError = "";
                    serverUnreadableWords = [];
                }
            } catch {
                // If server is temporarily unreachable, client-side check continues
            }
        }, 300);

        return () => {
            if (validationTimer) clearTimeout(validationTimer);
        };
    });

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
        if (loadedAttemptId === id) return;
        loadedAttemptId = id;
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
        const applicationId = search.get("application_id") || "";
        if (applicationId) currentApplicationId = applicationId;
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
        // Hide query params from URL after reading them
        replaceState($page.url.pathname);

        // Load existing feedback
        loadFeedback();
    }

    async function loadFeedback() {
        try {
            const result = await quizService.getQuizResultFeedback(id);
            if (result && (result.rating || result.comment)) {
                existingFeedback = result;
                if (!feedbackRating && result.rating) {
                    feedbackRating = result.rating;
                }
                if (!feedbackComment && result.comment) {
                    feedbackComment = result.comment;
                }
            } else {
                existingFeedback = null;
            }
        } catch {
            existingFeedback = null;
        } finally {
            feedbackLoaded = true;
        }
    }

    async function submitFeedback() {
        if (feedbackSaving || Boolean(activeValidationError)) return;
        feedbackSaving = true;
        feedbackErrorMessage = "";
        try {
            const rating = feedbackRating || "positive";
            const result = await quizService.saveQuizResultFeedback(id, rating, feedbackComment);
            existingFeedback = result;
            if (!feedbackRating) {
                feedbackRating = rating;
            }
            feedbackSavedMessage = true;
            setTimeout(() => {
                feedbackSavedMessage = false;
            }, 5000);
        } catch (e) {
            console.error("Failed to save feedback:", e);
            feedbackErrorMessage = e.message || "Failed to submit feedback.";
            if (e.message && (e.message.includes("already been submitted") || e.message.includes("conflict"))) {
                await loadFeedback();
            }
        } finally {
            feedbackSaving = false;
        }
    }
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <div class="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
                <span class="text-sm text-slate-400">Loading results…</span>
            </div>

        {:else if error}
            <div class="mx-auto max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <XCircle class="mx-auto h-10 w-10 text-red-400" />
                <h2 class="mt-3 text-lg font-semibold text-slate-800">Unable to load results</h2>
                <p class="mt-2 text-sm text-slate-500">{error}</p>
                <button onclick={() => goto("/applications")} class="btn mt-5 gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back
                </button>
            </div>

        {:else if data}

            <!-- Final Exam Score -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
                    <!-- Left: circular gauge -->
                    <div class="relative shrink-0">
                        <svg class="h-36 w-36" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke-width="7" stroke="#e2e8f0" stroke-linecap="round" />
                            <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke-width="7"
                                stroke={data.final_score >= 70 ? '#22c55e' : '#ef4444'}
                                stroke-linecap="round"
                                stroke-dasharray="{2 * Math.PI * 42}"
                                stroke-dashoffset="{2 * Math.PI * 42 * (1 - data.final_score / 100)}"
                                transform="rotate(-90 50 50)"
                                class="transition-all duration-700"
                            />
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-3xl font-bold text-slate-800">{data.final_score}<span class="text-lg text-slate-400">%</span></span>
                            <span class="text-[10px] font-medium uppercase tracking-wider text-slate-400">Final</span>
                        </div>
                    </div>
                    <!-- Right: details -->
                    <div class="flex-1 text-center sm:text-left">
                        <div class="flex items-center gap-2 justify-center sm:justify-start">
                            <Award class="h-5 w-5 text-indigo-600" />
                            <h2 class="text-lg font-semibold text-slate-800">Final Exam Score</h2>
                        </div>
                        <p class="mt-1 text-sm text-slate-500">
                            {#if data.ats_score}
                                Weighted combination of <strong class="text-slate-700">80%</strong> quiz and <strong class="text-slate-700">20%</strong> ATS CV score
                            {:else}
                                Based on quiz performance (ATS CV not available)
                            {/if}
                        </p>

                        <div class="mt-4">
                            {#if data.final_score >= 70}
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    <CheckCircle2 class="h-3.5 w-3.5" /> PASSED
                                </span>
                            {:else}
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                                    <XCircle class="h-3.5 w-3.5" /> NEEDS IMPROVEMENT
                                </span>
                            {/if}
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-3">
                            <div class="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
                                <div class="text-[11px] font-medium uppercase tracking-wider text-slate-400">Quiz</div>
                                <div class="mt-0.5 text-lg font-bold text-slate-700">{data.quiz_attempt?.score ?? 0}%</div>
                                <div class="text-[11px] text-slate-400">× 0.8 = {Math.round((data.quiz_attempt?.score ?? 0) * 0.8)}</div>
                            </div>
                            <div class="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
                                <div class="text-[11px] font-medium uppercase tracking-wider text-slate-400">ATS CV</div>
                                <div class="mt-0.5 text-lg font-bold text-slate-700">{data.ats_score?.score ?? '—'}%</div>
                                <div class="text-[11px] text-slate-400">{data.ats_score ? `× 0.2 = ${Math.round(data.ats_score.score * 0.2)}` : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quiz & ATS side by side -->
            <div class="mb-6 grid gap-6 sm:grid-cols-2">

                <!-- Quiz Score -->
                {#if data.quiz_attempt}
                    {@const pct = data.quiz_attempt.score ?? 0}
                    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="mb-3 flex items-center gap-2">
                            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                                <Target class="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <h3 class="text-sm font-medium text-slate-600">Quiz Score</h3>
                        </div>

                        <div class="flex items-center gap-4">
                            <svg class="h-20 w-20 shrink-0" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke-width="6" stroke="#e2e8f0" stroke-linecap="round" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke-width="6" stroke="#3b82f6"
                                    stroke-linecap="round"
                                    stroke-dasharray="{2 * Math.PI * 42}"
                                    stroke-dashoffset="{2 * Math.PI * 42 * (1 - pct / 100)}"
                                    transform="rotate(-90 50 50)"
                                    class="transition-all duration-700"
                                />
                            </svg>
                            <div>
                                <div class="text-2xl font-bold text-slate-800">{pct}<span class="text-sm font-normal text-slate-400">%</span></div>
                                <div class="text-xs text-slate-400">{data.quiz_attempt.correct_count ?? 0} of {data.quiz_attempt.total_count ?? 0} correct</div>
                                {#if data.quiz_attempt.passed}
                                    <span class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 class="h-3 w-3" /> Passed
                                    </span>
                                {:else}
                                    <span class="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                        <XCircle class="h-3 w-3" /> Below threshold
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="mt-4">
                            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-blue-500 transition-all duration-700" style="width: {pct}%"></div>
                            </div>
                            <div class="mt-1 flex justify-between text-[11px] text-slate-400">
                                <span>0%</span>
                                <span>Pass: {data.quiz_attempt.passing_score ?? 70}%</span>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- ATS Score -->
                {#if data.ats_score}
                    {@const ats = data.ats_score}
                    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="mb-3 flex items-center gap-2">
                            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50">
                                <FileText class="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            <h3 class="text-sm font-medium text-slate-600">ATS CV Score</h3>
                        </div>

                        <div class="flex items-center gap-4">
                            <svg class="h-20 w-20 shrink-0" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke-width="6" stroke="#e2e8f0" stroke-linecap="round" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke-width="6" stroke="#8b5cf6"
                                    stroke-linecap="round"
                                    stroke-dasharray="{2 * Math.PI * 42}"
                                    stroke-dashoffset="{2 * Math.PI * 42 * (1 - ats.score / 100)}"
                                    transform="rotate(-90 50 50)"
                                    class="transition-all duration-700"
                                />
                            </svg>
                            <div>
                                <div class="text-2xl font-bold text-slate-800">{ats.score}<span class="text-sm font-normal text-slate-400">%</span></div>
                                <div class="mt-1 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                    {ats.grade}
                                </div>
                            </div>
                        </div>

                        {#if ats.checks.length}
                            <div class="mt-4 space-y-2.5">
                                {#each ats.checks as check}
                                    {@const checkPct = check.max > 0 ? Math.round((check.score / check.max) * 100) : 0}
                                    <div>
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="text-slate-600">{check.label}</span>
                                            <span class="font-medium text-slate-500">{check.score}/{check.max}</span>
                                        </div>
                                        <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div class="h-full rounded-full bg-violet-400 transition-all duration-500" style="width: {checkPct}%"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if ats.summary}
                            <div class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                {ats.summary}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Extracted Text -->
            {#if data.extracted_text}
                <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 class="mb-3 text-sm font-medium text-slate-600">Extracted CV Text</h3>
                    <pre class="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{data.extracted_text}</pre>
                </div>
            {/if}

            <!-- Quiz Answers -->
            {#if data.quiz_answers?.length}
                {@const correctCount = data.quiz_answers.filter(a => a.IsCorrect).length}
                {@const skippedCount = data.quiz_answers.filter(a => a.IsSkipped).length}
                {@const wrongCount = data.quiz_answers.length - correctCount - skippedCount}
                <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-medium text-slate-600">Quiz Answers</h3>
                            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {data.quiz_answers.length}
                            </span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs">
                            <span class="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">✓ {correctCount}</span>
                            <span class="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600">✗ {wrongCount}</span>
                            {#if skippedCount > 0}
                                <span class="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">⊘ {skippedCount}</span>
                            {/if}
                        </div>
                    </div>

                    <div class="overflow-x-auto rounded-lg border border-slate-200">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                    <th class="px-3 py-2.5">#</th>
                                    <th class="px-3 py-2.5">Your Answer</th>
                                    <th class="px-3 py-2.5">Correct Answer</th>
                                    <th class="px-3 py-2.5">Result</th>
                                    <th class="px-3 py-2.5 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                {#each data.quiz_answers as answer, idx}
                                    <tr class="hover:bg-slate-50/50 transition-colors">
                                        <td class="px-3 py-2.5 font-mono text-xs text-slate-400 w-10">{idx + 1}</td>
                                        <td class="max-w-[12rem] truncate px-3 py-2.5">
                                            {#if answer.IsSkipped}
                                                <span class="text-amber-500 italic text-xs">Skipped</span>
                                            {:else}
                                                <span class="text-slate-700">{answer.UserAnswer || "—"}</span>
                                            {/if}
                                        </td>
                                        <td class="max-w-[12rem] truncate px-3 py-2.5">
                                            {#if answer.IsSkipped}
                                                <span class="text-slate-300">—</span>
                                            {:else}
                                                <span class="font-medium {answer.IsCorrect ? 'text-emerald-600' : 'text-red-500'}">
                                                    {answer.CorrectAnswer || "—"}
                                                </span>
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5">
                                            {#if answer.IsSkipped}
                                                <span class="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">Skipped</span>
                                            {:else if answer.IsCorrect}
                                                <span class="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Correct</span>
                                            {:else}
                                                <span class="inline-block rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">Wrong</span>
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-right font-mono text-xs text-slate-400">
                                            {formatTime(answer.TimeSpentSeconds)}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}

            <!-- Feedback -->
            {#if feedbackLoaded || (!loading && data)}
                {#if existingFeedback && (existingFeedback.rating || existingFeedback.comment)}
                    <!-- One-Time Feedback: Read-only Confirmation Card -->
                    <div class="mb-6 rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-sm ring-1 ring-emerald-500/10">
                        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div class="flex items-center gap-2.5">
                                <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                                    <CheckCircle2 class="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-slate-800">Feedback Submitted</h3>
                                    <p class="text-xs text-slate-400">Your candidate experience review has been recorded (one-time submission).</p>
                                </div>
                            </div>
                            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Response Recorded
                            </span>
                        </div>

                        <div class="flex flex-wrap items-center gap-3 mb-3">
                            {#if existingFeedback.rating === 'positive'}
                                <div class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    <ThumbsUp class="h-3.5 w-3.5" />
                                    Helpful experience
                                </div>
                            {:else if existingFeedback.rating === 'negative'}
                                <div class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                                    <ThumbsDown class="h-3.5 w-3.5" />
                                    Not helpful experience
                                </div>
                            {/if}
                            {#if existingFeedback.created_at}
                                <span class="text-xs text-slate-400">
                                    Recorded on {new Date(existingFeedback.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            {/if}
                        </div>

                        {#if existingFeedback.comment}
                            <div class="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                                <span class="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">Your Comment</span>
                                <p class="text-sm italic text-slate-700 whitespace-pre-wrap leading-relaxed">"{existingFeedback.comment}"</p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Interactive Feedback Submission (Available Only Once) -->
                    <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <MessageSquare class="h-4 w-4 text-indigo-600" />
                                <h3 class="text-sm font-medium text-slate-700">How was your experience?</h3>
                            </div>
                            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">One-time submission</span>
                        </div>

                        <div class="flex items-center gap-3 mb-4">
                            <button
                                type="button"
                                onclick={() => feedbackRating = feedbackRating === 'positive' ? null : 'positive'}
                                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {feedbackRating === 'positive' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}"
                            >
                                <ThumbsUp class="h-4 w-4" />
                                Helpful
                            </button>
                            <button
                                type="button"
                                onclick={() => feedbackRating = feedbackRating === 'negative' ? null : 'negative'}
                                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {feedbackRating === 'negative' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}"
                            >
                                <ThumbsDown class="h-4 w-4" />
                                Not helpful
                            </button>
                        </div>

                        <textarea
                            bind:value={feedbackComment}
                            spellcheck="true"
                            placeholder="Tell us more about your experience in English..."
                            maxlength="1000"
                            rows="3"
                            class="w-full rounded-xl border px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-colors {activeValidationError ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-slate-200 bg-slate-50 focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-300'}"
                        ></textarea>

                        {#if activeValidationError}
                            <div class="mt-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
                                <div class="flex items-center gap-1.5 font-medium">
                                    <AlertTriangle class="h-4 w-4 shrink-0 text-red-500" />
                                    <span>{activeValidationError}</span>
                                </div>
                                {#if activeUnreadableWords.length > 0}
                                    <div class="mt-2 flex flex-wrap items-center gap-2 border-t border-red-200/60 pt-2">
                                        <span class="text-[11px] font-medium text-red-600">Flagged meaningless/unreadable:</span>
                                        {#each activeUnreadableWords as w}
                                            <span class="inline-flex items-center rounded-md bg-white px-2 py-0.5 font-mono text-xs font-semibold text-red-700 border border-red-300 shadow-2xs underline decoration-wavy decoration-red-500">
                                                {w}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if feedbackErrorMessage && !activeValidationError}
                            <div class="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                                <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                                <span>{feedbackErrorMessage}</span>
                            </div>
                        {/if}

                        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <button
                                    type="button"
                                    onclick={submitFeedback}
                                    disabled={feedbackSaving || Boolean(activeValidationError) || (!feedbackRating && !feedbackComment.trim())}
                                    class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {#if feedbackSaving}
                                        <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                        Submitting...
                                    {:else}
                                        <Send class="h-3.5 w-3.5" />
                                        Submit feedback
                                    {/if}
                                </button>
                                {#if feedbackSavedMessage}
                                    <span class="text-xs text-emerald-600 font-medium">Thanks for your feedback!</span>
                                {/if}
                            </div>
                            <span class="text-[11px] text-slate-400">English words only • Inappropriate or meaningless words prohibited</span>
                        </div>
                    </div>
                {/if}
            {/if}

            <!-- Bottom Actions -->
            <div class="mt-8 flex justify-center pb-8">
                <button onclick={() => goto("/applications")} class="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900">
                    <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Applications
                </button>
            </div>

        {/if}
    </div>
</div>