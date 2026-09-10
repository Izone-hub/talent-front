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
        Target, FileText, Briefcase, Building2,
        CheckCircle2, BookOpen, Award,
        ThumbsUp, ThumbsDown, MessageSquare, Send,
        AlertTriangle, Clock, HelpCircle, SkipForward, User,
        X, ChevronRight, ChevronLeft, Lightbulb
    } from "@lucide/svelte";

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
    let questionFilter = $state("all"); // "all" | "correct" | "incorrect"

    let displayedAnswers = $derived.by(() => {
        const list = data?.quiz_answers || [];
        if (questionFilter === "correct") return list.filter((a) => a.IsCorrect);
        if (questionFilter === "incorrect") return list.filter((a) => !a.IsCorrect);
        return list;
    });

    // Question Detail Modal state
    let selectedQuestion = $state(null);
    let modalDetail = $state(null);
    let modalLoading = $state(false);
    let questionDetailsCache = $state(new Map());

    let selectedQuestionIndex = $derived(
        displayedAnswers.findIndex(
            (a) => (a.QuestionID || a.ID) === (selectedQuestion?.QuestionID || selectedQuestion?.ID)
        )
    );
    let canGoPrev = $derived(selectedQuestionIndex > 0);
    let canGoNext = $derived(
        selectedQuestionIndex >= 0 && selectedQuestionIndex < displayedAnswers.length - 1
    );

    async function openQuestionModal(question) {
        if (!question) return;
        selectedQuestion = question;
        const qid = question.QuestionID || question.ID;

        if (questionDetailsCache.has(qid)) {
            modalDetail = questionDetailsCache.get(qid);
            modalLoading = false;
            return;
        }

        modalLoading = true;
        modalDetail = null;
        try {
            const detail = await quizService.getQuestionDetail(id, qid);
            const nextMap = new Map(questionDetailsCache);
            nextMap.set(qid, detail);
            questionDetailsCache = nextMap;
            if (selectedQuestion && (selectedQuestion.QuestionID === qid || selectedQuestion.ID === qid)) {
                modalDetail = detail;
            }
        } catch (e) {
            console.error("Failed to load question detail:", e);
            modalDetail = {
                question_id: qid,
                question_text: question.QuestionText,
                question_type: question.QuestionType,
                difficulty: question.Difficulty,
                points: question.Points,
                user_answer: question.UserAnswer,
                is_correct: question.IsCorrect,
                is_skipped: question.IsSkipped,
            };
        } finally {
            modalLoading = false;
        }
    }

    function closeQuestionModal() {
        selectedQuestion = null;
        modalDetail = null;
        modalLoading = false;
    }

    function goToPrevQuestion() {
        if (canGoPrev) {
            openQuestionModal(displayedAnswers[selectedQuestionIndex - 1]);
        }
    }

    function goToNextQuestion() {
        if (canGoNext) {
            openQuestionModal(displayedAnswers[selectedQuestionIndex + 1]);
        }
    }

    function handleModalKeydown(event) {
        if (!selectedQuestion) return;
        if (event.key === "Escape") {
            closeQuestionModal();
        } else if (event.key === "ArrowLeft" && canGoPrev) {
            goToPrevQuestion();
        } else if (event.key === "ArrowRight" && canGoNext) {
            goToNextQuestion();
        }
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            closeQuestionModal();
        }
    }

    function getModalOptions(rawOptions) {
        if (!rawOptions) return [];
        let opts = rawOptions;
        if (typeof opts === "string") {
            try {
                opts = JSON.parse(opts);
            } catch {
                return [];
            }
        }
        if (!Array.isArray(opts)) return [];
        return opts.map((opt, idx) => {
            if (typeof opt === "string") {
                const letter = String.fromCharCode(65 + idx);
                return { letter, text: opt, value: opt };
            }
            if (typeof opt === "object" && opt !== null) {
                const letter = opt.option || opt.key || String.fromCharCode(65 + idx);
                const text = opt.text || opt.label || opt.value || "";
                const value = opt.value || opt.option || text;
                return { letter, text, value };
            }
            return { letter: String.fromCharCode(65 + idx), text: String(opt), value: String(opt) };
        });
    }

    function isOptionSelected(opt, userAnswer) {
        if (!userAnswer) return false;
        const ua = String(userAnswer).trim().toLowerCase();
        const optLetter = String(opt.letter || "").trim().toLowerCase();
        const optText = String(opt.text || "").trim().toLowerCase();
        const optVal = String(opt.value || "").trim().toLowerCase();
        return ua === optLetter || ua === optText || ua === optVal;
    }

    function isOptionCorrect(opt, correctAnswer) {
        if (!correctAnswer) return false;
        const ca = String(correctAnswer).trim().toLowerCase();
        const optLetter = String(opt.letter || "").trim().toLowerCase();
        const optText = String(opt.text || "").trim().toLowerCase();
        const optVal = String(opt.value || "").trim().toLowerCase();
        return ca === optLetter || ca === optText || ca === optVal;
    }


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
            // 1. Authoritative lightweight summary from the backend
            const summary = await quizService.getResult(id);

            // 2. Separate lightweight question review list (no answer keys)
            let reviewQuestions = [];
            try {
                const res = await quizService.getReviewQuestions(id);
                reviewQuestions = Array.isArray(res) ? res : [];
            } catch {
                reviewQuestions = [];
            }

            // 3. GitHub intelligence report for ATS CV evaluation (best-effort)
            let intelligence = null;
            try {
                intelligence = await intelligenceService.fetchGitHubIntelligence(targetId);
            } catch {
                intelligence = null;
            }

            const user = $auth.user || {};

            // Authoritative attempt data directly from the backend summary response
            const quizAttempt = {
                score: summary?.score ?? 0,
                correct_count: summary?.correct_answers ?? 0,
                total_count: summary?.total_questions ?? reviewQuestions.length,
                answered_count: summary?.answered_questions ?? reviewQuestions.length,
                passed: summary?.passed ?? ((summary?.score ?? 0) >= (summary?.passing_score ?? 70)),
                passing_score: summary?.passing_score ?? 70,
                status: summary?.status || "completed",
                time_spent_seconds: summary?.time_spent_seconds ?? 0,
            };

            data = {
                job_title: summary?.job_title || jobTitle,
                job_company: summary?.company || jobCompany,
                quiz_title: summary?.job_title || quizTitle || "Technical Core Assessment",
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
                quiz_answers: reviewQuestions.map((q, idx) => ({
                    QuestionID: q.question_id,
                    QuestionNumber: q.question_number || (idx + 1),
                    QuestionText: q.question_text,
                    QuestionType: q.question_type,
                    Difficulty: q.difficulty,
                    Points: q.points,
                    UserAnswer: q.user_answer,
                    IsCorrect: q.is_correct,
                    IsSkipped: q.is_skipped,
                })),
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

<svelte:window onkeydown={handleModalKeydown} />

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <!-- ─── Result Header Topbar Skeleton ─── -->
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3" role="status" aria-busy="true" aria-label="Loading quiz results">
                <div class="skeleton h-9 w-40 rounded-xl"></div>
                <div class="skeleton h-7 w-44 rounded-full"></div>
            </div>

            <!-- ─── Result Header Hero Card Skeleton (Exact shape & size) ─── -->
            <div class="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                    <!-- Score Box Skeleton: identical size and shape (h-24 w-28 rounded-2xl) -->
                    <div class="skeleton h-24 w-28 shrink-0 rounded-2xl"></div>

                    <!-- Header Details Skeleton -->
                    <div class="flex-1 text-center sm:text-left w-full">
                        <div class="flex justify-center sm:justify-start mb-2">
                            <div class="skeleton h-6 w-24 rounded-full"></div>
                        </div>
                        <div class="skeleton mx-auto h-7 sm:h-8 w-64 max-w-full rounded-lg sm:mx-0"></div>
                        <div class="mt-2 flex justify-center sm:justify-start">
                            <div class="skeleton h-4 w-72 max-w-full rounded"></div>
                        </div>
                        <div class="mt-2 flex justify-center sm:justify-start">
                            <div class="skeleton h-3.5 w-44 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── Summary Cards Skeleton (5 Metric Cards) ─── -->
            <div class="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {#each [1, 2, 3, 4, 5] as _, i}
                    <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm min-h-[96px] {i === 4 ? 'col-span-2 sm:col-span-1' : ''}">
                        <div class="flex items-center justify-between">
                            <div class="skeleton h-3.5 w-14 rounded"></div>
                            <div class="skeleton h-7 w-7 rounded-lg"></div>
                        </div>
                        <div class="mt-2 space-y-1.5">
                            <div class="skeleton h-6 w-12 rounded"></div>
                            <div class="skeleton h-3 w-20 rounded"></div>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- ─── Question Review Skeleton (Identical row structure & controls) ─── -->
            <div class="mb-8">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                        <div class="skeleton h-6 w-36 rounded-lg"></div>
                        <div class="skeleton h-5 w-8 rounded-full"></div>
                    </div>
                    <div class="skeleton h-8 w-60 rounded-xl"></div>
                </div>
                <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                    {#each [1, 2, 3, 4, 5, 6] as _}
                        <div class="flex items-center justify-between gap-4 p-4">
                            <div class="flex items-center gap-3.5 flex-1 min-w-0">
                                <!-- Question Number Box: h-8 w-8 rounded-lg -->
                                <div class="skeleton h-8 w-8 shrink-0 rounded-lg"></div>
                                <div class="space-y-1.5 flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <div class="skeleton h-3.5 w-14 rounded"></div>
                                        <div class="skeleton h-3.5 w-20 rounded"></div>
                                    </div>
                                    <div class="skeleton h-4 w-3/4 rounded"></div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 shrink-0">
                                <div class="skeleton h-6 w-20 rounded-full"></div>
                                <div class="skeleton h-6 w-14 rounded-lg"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- ─── Feedback Card Skeleton ─── -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="skeleton h-4 w-44 rounded"></div>
                    <div class="skeleton h-4 w-28 rounded-full"></div>
                </div>
                <div class="flex items-center gap-3 mb-4">
                    <div class="skeleton h-9 w-24 rounded-xl"></div>
                    <div class="skeleton h-9 w-28 rounded-xl"></div>
                </div>
                <div class="skeleton h-20 w-full rounded-xl"></div>
                <div class="mt-3 flex items-center justify-between">
                    <div class="skeleton h-9 w-32 rounded-xl"></div>
                    <div class="skeleton h-3 w-48 rounded"></div>
                </div>
            </div>

            <!-- ─── Bottom Actions Skeleton ─── -->
            <div class="mt-8 flex justify-center pb-8">
                <div class="skeleton h-10 w-44 rounded-xl"></div>
            </div>

        {:else if error}
            <div class="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <XCircle class="mx-auto h-12 w-12 text-slate-400" />
                <h2 class="mt-4 text-lg font-bold text-slate-800">Unable to load results</h2>
                <p class="mt-2 text-sm text-slate-500">{error}</p>
                <button
                    onclick={() => goto("/applications")}
                    class="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <ArrowLeft class="h-4 w-4" />
                    Back to Applications
                </button>
            </div>

        {:else if data}
            {@const totalQuestions = data.quiz_attempt?.total_count ?? data.quiz_answers?.length ?? 0}
            {@const correctCount = data.quiz_attempt?.correct_count ?? data.quiz_answers?.filter(a => a.IsCorrect).length ?? 0}
            {@const skippedCount = data.quiz_answers?.filter(a => a.IsSkipped).length ?? 0}
            {@const wrongCount = Math.max(0, totalQuestions - correctCount - skippedCount)}
            {@const isPassed = data.final_score >= 70}
            {@const totalTimeSeconds = data.quiz_answers?.reduce((acc, a) => acc + (a.TimeSpentSeconds || 0), 0) || 0}

            <!-- ─── Result Header Topbar ─── -->
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
                <a
                    href="/applications"
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-600"
                >
                    <ArrowLeft class="h-4 w-4" />
                    Back to Applications
                </a>
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200/60">
                        <Award class="h-3.5 w-3.5 text-blue-600" />
                        Assessment Dashboard
                    </span>
                </div>
            </div>

            <!-- ─── Result Header Hero Card (Single Visual Score Indicator) ─── -->
            <div class="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                    <!-- Strong Overall Score Element -->
                    <div class="flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-2xl {isPassed ? 'bg-emerald-50 border border-emerald-200/80 ring-1 ring-emerald-200/50' : 'bg-blue-50 border border-blue-200/80 ring-1 ring-blue-200/50'} text-center p-3">
                        <span class="text-3xl sm:text-4xl font-extrabold tracking-tight {isPassed ? 'text-emerald-700' : 'text-blue-700'}">
                            {data.final_score}<span class="text-base font-normal {isPassed ? 'text-emerald-600' : 'text-blue-500'}">%</span>
                        </span>
                        <span class="text-[10px] font-bold uppercase tracking-wider {isPassed ? 'text-emerald-700' : 'text-blue-600'}">Score</span>
                    </div>

                    <!-- Header Details -->
                    <div class="flex-1 text-center sm:text-left">
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                            {#if isPassed}
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                                    <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> PASSED
                                </span>
                            {:else}
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                    <Target class="h-3.5 w-3.5 text-blue-600" /> COMPLETED
                                </span>
                            {/if}
                        </div>

                        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            {data.quiz_title || "Technical Core Assessment"}
                        </h1>

                        {#if data.job_title}
                            <div class="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
                                <span class="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                    <Briefcase class="h-3.5 w-3.5 text-slate-400" />
                                    {data.job_title}
                                </span>
                                {#if data.job_company}
                                    <span class="inline-flex items-center gap-1.5">
                                        <Building2 class="h-3.5 w-3.5 text-slate-400" />
                                        {data.job_company}
                                    </span>
                                {/if}
                                {#if data.full_name}
                                    <span class="inline-flex items-center gap-1.5 text-slate-400">
                                        <User class="h-3.5 w-3.5 text-slate-400" />
                                        {data.full_name}
                                    </span>
                                {/if}
                            </div>
                        {/if}

                        <p class="mt-2 text-xs text-slate-500">
                            {#if data.ats_score}
                                Weighted score: <strong class="text-slate-700 font-semibold">80% Technical Quiz</strong> ({data.quiz_attempt?.score ?? 0}%) + <strong class="text-slate-700 font-semibold">20% ATS CV</strong> ({data.ats_score.score}%)
                            {:else}
                                Passing threshold: <strong class="text-slate-700 font-semibold">70%</strong>
                            {/if}
                        </p>
                    </div>
                </div>
            </div>

            <!-- ─── Summary Cards (5 Metric Cards) ─── -->
            <div class="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                <!-- Card 1: Score -->
                <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition hover:shadow-md min-h-[96px]">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Score</span>
                        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Award class="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{data.final_score}%</div>
                        <div class="text-[11px] text-slate-400 truncate">Passing: 70%</div>
                    </div>
                </div>

                <!-- Card 2: Correct answers -->
                <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition hover:shadow-md min-h-[96px]">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Correct</span>
                        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle2 class="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{correctCount}</div>
                        <div class="text-[11px] text-slate-400 truncate">{totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}% accuracy</div>
                    </div>
                </div>

                <!-- Card 3: Incorrect answers -->
                <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition hover:shadow-md min-h-[96px]">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Incorrect</span>
                        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <XCircle class="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{wrongCount}</div>
                        <div class="text-[11px] text-slate-400 truncate">{skippedCount > 0 ? `${skippedCount} skipped` : 'Needs review'}</div>
                    </div>
                </div>

                <!-- Card 4: Total questions -->
                <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition hover:shadow-md min-h-[96px]">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Questions</span>
                        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <HelpCircle class="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{totalQuestions}</div>
                        <div class="text-[11px] text-slate-400 truncate">{totalTimeSeconds > 0 ? `${formatTime(totalTimeSeconds)} total` : 'Completed'}</div>
                    </div>
                </div>

                <!-- Card 5: Completion status -->
                <div class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition hover:shadow-md col-span-2 sm:col-span-1 min-h-[96px]">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
                        <div class="flex h-7 w-7 items-center justify-center rounded-lg {isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}">
                            {#if isPassed}
                                <CheckCircle2 class="h-3.5 w-3.5" />
                            {:else}
                                <Target class="h-3.5 w-3.5" />
                            {/if}
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="text-lg sm:text-xl font-bold tracking-tight {isPassed ? 'text-emerald-700' : 'text-blue-700'}">
                            {isPassed ? 'Passed' : 'Completed'}
                        </div>
                        <div class="text-[11px] text-slate-400 truncate">{isPassed ? 'Threshold met' : 'Below 70%'}</div>
                    </div>
                </div>
            </div>

            <!-- ─── ATS CV Evaluation Card (Clean Card, No Circular Graphics) ─── -->
            {#if data.ats_score}
                {@const ats = data.ats_score}
                <div class="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FileText class="h-5 w-5" />
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-slate-800">ATS CV Evaluation</h3>
                                <p class="text-xs text-slate-400">Resume alignment with role requirements</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-bold text-slate-800">{ats.score}%</span>
                            <span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                {ats.grade}
                            </span>
                        </div>
                    </div>

                    {#if ats.checks.length}
                        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {#each ats.checks as check}
                                <div class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                        {#if check.score >= 1}
                                            <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
                                        {:else if check.score > 0}
                                            <AlertTriangle class="h-4 w-4 shrink-0 text-slate-400" />
                                        {:else}
                                            <XCircle class="h-4 w-4 shrink-0 text-slate-400" />
                                        {/if}
                                        <div class="min-w-0 flex-1">
                                            <p class="text-xs font-medium text-slate-700 truncate">{check.label}</p>
                                            {#if check.message}
                                                <p class="text-[11px] text-slate-400 truncate">{check.message}</p>
                                            {/if}
                                        </div>
                                    </div>
                                    <span class="ml-2 text-xs font-semibold text-slate-600 shrink-0">{check.score}/{check.max}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if ats.summary}
                        <div class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            {ats.summary}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- ─── Extracted CV Text (if available) ─── -->
            {#if data.extracted_text}
                <div class="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <h3 class="mb-3 text-sm font-semibold text-slate-700">Extracted CV Text</h3>
                    <pre class="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs font-mono leading-relaxed text-slate-600 border border-slate-100">{data.extracted_text}</pre>
                </div>
            {/if}

            <!-- ─── Question Review (Clean Question Cards) ─── -->
            {#if data.quiz_answers?.length}
                <div class="mb-8">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-lg font-bold tracking-tight text-slate-900">Question Review</h2>
                            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                {data.quiz_answers.length}
                            </span>
                        </div>

                        <!-- Filter tabs -->
                        <div class="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onclick={() => questionFilter = "all"}
                                class="rounded-lg px-3 py-1 text-xs font-semibold transition {questionFilter === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                            >
                                All ({data.quiz_answers.length})
                            </button>
                            <button
                                type="button"
                                onclick={() => questionFilter = "correct"}
                                class="rounded-lg px-3 py-1 text-xs font-semibold transition {questionFilter === 'correct' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                            >
                                Correct ({correctCount})
                            </button>
                            <button
                                type="button"
                                onclick={() => questionFilter = "incorrect"}
                                class="rounded-lg px-3 py-1 text-xs font-semibold transition {questionFilter === 'incorrect' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                            >
                                Incorrect ({wrongCount})
                            </button>
                        </div>
                    </div>

                    {#if displayedAnswers.length === 0}
                        <div class="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
                            No questions match the selected filter.
                        </div>
                    {:else}
                        <!-- Compact Question List -->
                        <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                            {#each displayedAnswers as answer, idx (answer.ID || answer.QuestionID || idx)}
                                {@const isAnswerCorrect = Boolean(answer.IsCorrect)}
                                {@const isAnswerSkipped = Boolean(answer.IsSkipped)}
                                {@const pts = answer.Points}
                                {@const qNum = answer.QuestionNumber || (idx + 1)}
                                <button
                                    type="button"
                                    onclick={() => openQuestionModal(answer)}
                                    class="group flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50/80 cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                                >
                                    <div class="flex items-center gap-3.5 min-w-0 flex-1">
                                        <!-- Question Number Pill (Uniform Neutral) -->
                                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-semibold text-xs text-slate-700 border border-slate-200/60">
                                            #{qNum}
                                        </div>

                                        <!-- Question Text & Metadata Badges -->
                                        <div class="min-w-0 flex-1">
                                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                                {#if answer.Difficulty}
                                                    <span class="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                                                        {answer.Difficulty}
                                                    </span>
                                                {/if}
                                                {#if answer.QuestionType}
                                                    <span class="inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                                                        {String(answer.QuestionType).replace(/_/g, " ")}
                                                    </span>
                                                {/if}
                                                {#if pts !== null && pts !== undefined}
                                                    <span class="text-[11px] font-medium text-slate-400">
                                                        {pts} {pts === 1 ? 'pt' : 'pts'}
                                                    </span>
                                                {/if}
                                            </div>
                                            <p class="truncate text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                                                {answer.QuestionText || `Question ${qNum}`}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Right side: Status Pill & View Action -->
                                    <div class="flex items-center gap-2.5 shrink-0">
                                        {#if isAnswerSkipped}
                                            <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200/70">
                                                <SkipForward class="h-3 w-3 text-slate-400" /> Skipped
                                            </span>
                                        {:else if isAnswerCorrect}
                                            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60">
                                                <CheckCircle2 class="h-3 w-3 text-emerald-600" /> Correct
                                            </span>
                                        {:else}
                                            <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
                                                <XCircle class="h-3 w-3 text-slate-400" /> Incorrect
                                            </span>
                                        {/if}

                                        <span class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                            View
                                            <ChevronRight class="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- ─── Question Details Modal Dialog ─── -->
            {#if selectedQuestion}
                {@const qNum = selectedQuestion.QuestionNumber || (selectedQuestionIndex + 1)}
                {@const isAnswerCorrect = Boolean(selectedQuestion.IsCorrect)}
                {@const isAnswerSkipped = Boolean(selectedQuestion.IsSkipped)}
                {@const pts = selectedQuestion.Points}
                {@const detail = modalDetail}
                {@const modalOptions = getModalOptions(detail?.options)}

                <div
                    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <!-- Backdrop click target -->
                    <button
                        type="button"
                        class="fixed inset-0 cursor-default bg-transparent border-none p-0 focus:outline-none"
                        onclick={closeQuestionModal}
                        aria-label="Close modal overlay"
                        tabindex="-1"
                    ></button>

                    <!-- Modal Card Container -->
                    <div
                        class="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
                    >
                        <!-- Modal Header -->
                        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                            <div class="flex flex-wrap items-center gap-2.5">
                                <span id="modal-title" class="text-base font-bold text-slate-900">
                                    Question #{qNum}
                                </span>
                                {#if selectedQuestion.Difficulty}
                                    <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 capitalize">
                                        {selectedQuestion.Difficulty}
                                    </span>
                                {/if}
                                {#if selectedQuestion.QuestionType}
                                    <span class="inline-flex items-center rounded-md border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 capitalize">
                                        {String(selectedQuestion.QuestionType).replace(/_/g, " ")}
                                    </span>
                                {/if}
                                {#if pts !== null && pts !== undefined}
                                    <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200/60">
                                        {pts} {pts === 1 ? 'pt' : 'pts'}
                                    </span>
                                {/if}
                            </div>

                            <div class="flex items-center gap-2">
                                {#if isAnswerSkipped}
                                    <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                        <SkipForward class="h-3 w-3 text-slate-400" /> Skipped
                                    </span>
                                {:else if isAnswerCorrect}
                                    <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                        <CheckCircle2 class="h-3 w-3 text-emerald-600" /> Correct
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                        <XCircle class="h-3 w-3 text-slate-400" /> Incorrect
                                    </span>
                                {/if}

                                <button
                                    type="button"
                                    onclick={closeQuestionModal}
                                    class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X class="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Modal Body (Scrollable) -->
                        <div class="overflow-y-auto p-6 space-y-5">
                            <!-- Question Statement -->
                            <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Question Prompt</p>
                                <p class="text-base font-semibold text-slate-900 leading-relaxed">
                                    {detail?.question_text || selectedQuestion.QuestionText || `Question ${qNum}`}
                                </p>
                            </div>

                            {#if modalLoading}
                                <div class="flex flex-col items-center justify-center py-12 space-y-3">
                                    <Loader2 class="h-8 w-8 animate-spin text-slate-400" />
                                    <p class="text-sm font-medium text-slate-500">Loading details...</p>
                                </div>
                            {:else}
                                <!-- If Multiple Choice with Options -->
                                {#if modalOptions.length > 0}
                                    <div>
                                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Options</p>
                                        <div class="space-y-2">
                                            {#each modalOptions as opt}
                                                {@const isCorrectOpt = isOptionCorrect(opt, detail?.correct_answer)}
                                                {@const isSelectedOpt = isOptionSelected(opt, selectedQuestion.UserAnswer || detail?.user_answer)}
                                                <div
                                                    class="flex items-start gap-3 rounded-xl border p-3.5 transition {isCorrectOpt
                                                        ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200/60'
                                                        : isSelectedOpt
                                                          ? 'border-slate-300 bg-slate-50/80 ring-1 ring-slate-200'
                                                          : 'border-slate-200 bg-white'}"
                                                >
                                                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold {isCorrectOpt
                                                        ? 'bg-emerald-600 text-white'
                                                        : isSelectedOpt
                                                          ? 'bg-slate-700 text-white'
                                                          : 'bg-slate-100 text-slate-600'}">
                                                        {opt.letter}
                                                    </span>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="text-sm {isCorrectOpt ? 'font-semibold text-emerald-900' : isSelectedOpt ? 'font-semibold text-slate-900' : 'text-slate-700'}">
                                                            {opt.text}
                                                        </p>
                                                    </div>
                                                    <div class="flex items-center gap-1.5 shrink-0">
                                                        {#if isCorrectOpt}
                                                            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                                <CheckCircle2 class="h-3 w-3" /> Correct Answer
                                                            </span>
                                                        {/if}
                                                        {#if isSelectedOpt}
                                                            <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium {isCorrectOpt ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}">
                                                                Your Choice
                                                            </span>
                                                        {/if}
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                <!-- Answer Comparison Box -->
                                <div class="grid grid-cols-1 gap-3 {detail?.correct_answer ? 'sm:grid-cols-2' : ''}">
                                    <!-- Candidate's Answer -->
                                    <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                        <span class="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-slate-500">
                                            Your Submitted Answer
                                        </span>
                                        {#if isAnswerSkipped}
                                            <span class="text-sm font-medium italic text-slate-500 flex items-center gap-1.5">
                                                <SkipForward class="h-4 w-4 text-slate-400" /> Skipped
                                            </span>
                                        {:else}
                                            <p class="text-sm font-semibold break-words text-slate-900">
                                                {selectedQuestion.UserAnswer || detail?.user_answer || "—"}
                                            </p>
                                        {/if}
                                    </div>

                                    <!-- Authoritative Correct Answer -->
                                    {#if detail?.correct_answer}
                                        <div class="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                                            <span class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block mb-1.5">
                                                Correct Answer
                                            </span>
                                            <p class="text-sm font-semibold text-emerald-900 break-words flex items-center gap-1.5">
                                                <CheckCircle2 class="h-4 w-4 text-emerald-600 shrink-0" />
                                                {detail.correct_answer}
                                            </p>
                                        </div>
                                    {/if}
                                </div>

                                <!-- Code Execution Output (if available) -->
                                {#if detail?.code_output}
                                    <div>
                                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Execution Output</p>
                                        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-slate-200 overflow-x-auto shadow-inner">
                                            <pre class="whitespace-pre-wrap">{detail.code_output}</pre>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Explanation Callout -->
                                {#if detail?.explanation}
                                    <div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-800">
                                        <div class="flex items-center gap-2 font-semibold text-blue-900 mb-1">
                                            <Lightbulb class="h-4 w-4 text-blue-600 shrink-0" />
                                            <span>Explanation</span>
                                        </div>
                                        <p class="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            {detail.explanation}
                                        </p>
                                    </div>
                                {/if}
                            {/if}
                        </div>

                        <!-- Modal Footer with Navigation & Close -->
                        <div class="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onclick={goToPrevQuestion}
                                    disabled={!canGoPrev}
                                    class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronLeft class="h-3.5 w-3.5" />
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onclick={goToNextQuestion}
                                    disabled={!canGoNext}
                                    class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Next
                                    <ChevronRight class="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onclick={closeQuestionModal}
                                class="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
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
                                <div class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
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
                                <MessageSquare class="h-4 w-4 text-slate-700" />
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
                                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {feedbackRating === 'negative' ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}"
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
                            class="w-full rounded-xl border px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-colors {activeValidationError ? 'border-slate-400 bg-slate-100/60 focus:border-slate-500 focus:ring-1 focus:ring-slate-400' : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-300'}"
                        ></textarea>

                        {#if activeValidationError}
                            <div class="mt-2 rounded-xl border border-slate-200 bg-slate-100/90 p-3 text-xs text-slate-800">
                                <div class="flex items-center gap-1.5 font-medium">
                                    <AlertTriangle class="h-4 w-4 shrink-0 text-slate-600" />
                                    <span>{activeValidationError}</span>
                                </div>
                                {#if activeUnreadableWords.length > 0}
                                    <div class="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2">
                                        <span class="text-[11px] font-medium text-slate-600">Flagged meaningless/unreadable:</span>
                                        {#each activeUnreadableWords as w}
                                            <span class="inline-flex items-center rounded-md bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-300 shadow-2xs">
                                                {w}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if feedbackErrorMessage && !activeValidationError}
                            <div class="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
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
                                    class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
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
                <button onclick={() => goto("/applications")} class="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700">
                    <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Applications
                </button>
            </div>

        {/if}
    </div>
</div>