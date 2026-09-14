<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import {
        CheckCircle2,
        XCircle,
        Loader2,
        ArrowLeft,
        SkipForward,
        Lightbulb,
        HelpCircle,
        X,
        ChevronRight,
        ChevronLeft,
    } from "@lucide/svelte";

    const quizId = $page.params.id;

    let loading = $state(true);
    let result = $state(null);
    let error = $state("");

    // Modal state for question detail
    let selectedQuestion = $state(null);
    let modalDetail = $state(null);
    let modalLoading = $state(false);
    let questionDetailsCache = $state(new Map());

    let selectedQuestionIndex = $derived(
        (result?.answers || []).findIndex(
            (a) => (a.question_id || a.QuestionID) === (selectedQuestion?.question_id || selectedQuestion?.QuestionID)
        )
    );
    let canGoPrev = $derived(selectedQuestionIndex > 0);
    let canGoNext = $derived(
        selectedQuestionIndex >= 0 && selectedQuestionIndex < (result?.answers || []).length - 1
    );

    async function openQuestionModal(question) {
        if (!question) return;
        selectedQuestion = question;
        const qid = question.question_id || question.QuestionID;

        if (questionDetailsCache.has(qid)) {
            modalDetail = questionDetailsCache.get(qid);
            modalLoading = false;
            return;
        }

        modalLoading = true;
        modalDetail = null;
        try {
            const detail = await quizService.getQuestionDetail(quizId, qid);
            const nextMap = new Map(questionDetailsCache);
            nextMap.set(qid, detail);
            questionDetailsCache = nextMap;
            if (selectedQuestion && (selectedQuestion.question_id === qid || selectedQuestion.QuestionID === qid)) {
                modalDetail = detail;
            }
        } catch (e) {
            console.error("Failed to load question detail:", e);
            modalDetail = {
                question_id: qid,
                question_text: question.question_text || question.QuestionText,
                question_type: question.question_type || question.QuestionType,
                difficulty: question.difficulty || question.Difficulty,
                points: question.points || question.Points,
                user_answer: question.user_answer || question.UserAnswer,
                is_correct: question.is_correct || question.IsCorrect,
                is_skipped: question.is_skipped || question.IsSkipped,
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
        if (canGoPrev && result?.answers) {
            openQuestionModal(result.answers[selectedQuestionIndex - 1]);
        }
    }

    function goToNextQuestion() {
        if (canGoNext && result?.answers) {
            openQuestionModal(result.answers[selectedQuestionIndex + 1]);
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

    $effect(() => {
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            goto("/auth");
            return;
        }
        loadReview();
    });

    async function loadReview() {
        const uid = $auth.user?.id;
        if (!uid) {
            error = "User not authenticated";
            loading = false;
            return;
        }
        try {
            const summary = await quizService.getResult(quizId);
            let questions = [];
            try {
                const qRes = await quizService.getReviewQuestions(quizId);
                questions = Array.isArray(qRes) ? qRes : [];
            } catch {
                questions = [];
            }
            result = {
                ...(summary || {}),
                title: summary?.job_title || "Quiz Review",
                answers: questions,
            };
        } catch (e) {
            error = e.message || "Failed to load quiz review";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:window onkeydown={handleModalKeydown} />

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <!-- ─── Header Skeleton ─── -->
            <div class="mb-6 flex items-center justify-between" role="status" aria-busy="true" aria-label="Loading review">
                <div class="space-y-1.5">
                    <div class="skeleton h-8 w-48 rounded-lg"></div>
                    <div class="skeleton h-4 w-64 rounded"></div>
                </div>
                <div class="skeleton h-8 w-32 rounded-xl"></div>
            </div>

            <!-- ─── Score Summary Skeleton (3 Cards) ─── -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-center gap-6">
                    {#each [1, 2, 3] as _}
                        <div class="flex items-center gap-3">
                            <div class="skeleton h-10 w-10 shrink-0 rounded-xl"></div>
                            <div class="space-y-1.5">
                                <div class="skeleton h-3 w-12 rounded"></div>
                                <div class="skeleton h-6 w-16 rounded"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- ─── Question List Skeleton ─── -->
            <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                {#each [1, 2, 3, 4, 5, 6] as _}
                    <div class="flex items-center justify-between gap-4 p-4">
                        <div class="flex items-center gap-3.5 flex-1 min-w-0">
                            <div class="skeleton h-9 w-9 shrink-0 rounded-xl"></div>
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

            <!-- ─── Bottom Actions Skeleton ─── -->
            <div class="mt-8 flex justify-center gap-3">
                <div class="skeleton h-9 w-32 rounded-xl"></div>
                <div class="skeleton h-9 w-36 rounded-xl"></div>
            </div>

        {:else if error}
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <XCircle class="mx-auto h-12 w-12 text-slate-400" />
                <h2 class="mt-4 text-lg font-semibold text-slate-800">Failed to load review</h2>
                <p class="mt-2 text-sm text-slate-500">{error}</p>
                <button onclick={() => goto("/applications")} class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition">
                    <ArrowLeft class="h-4 w-4" />
                    Back to Applications
                </button>
            </div>

        {:else if result}
            <!-- Header -->
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">{result.title || "Quiz Review"}</h1>
                    <p class="mt-1 text-sm text-slate-500">Question-by-question review with explanations</p>
                </div>
                <button onclick={() => goto("/quizzes/" + quizId + "/result")} class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-200 hover:text-blue-600 transition">
                    <ArrowLeft class="h-3.5 w-3.5" />
                    Back to Results
                </button>
            </div>

            <!-- Score Summary -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-center gap-6">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <CheckCircle2 class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Score</p>
                            <p class="text-lg font-bold text-slate-900">{result.score}%</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl {result.passed ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'}">
                            <HelpCircle class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Result</p>
                            <p class="text-lg font-bold {result.passed ? 'text-emerald-700' : 'text-blue-700'}">{result.passed ? 'PASSED' : 'COMPLETED'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <HelpCircle class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Questions</p>
                            <p class="text-lg font-bold text-slate-900">{result.total_questions}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Question Review -->
            <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                {#each result.answers as answer, i (answer.question_id || answer.QuestionID || i)}
                    {@const isAnswerCorrect = Boolean(answer.is_correct)}
                    {@const isAnswerSkipped = Boolean(answer.is_skipped)}
                    {@const pts = answer.points}
                    {@const qNum = answer.question_number || (i + 1)}
                    <button
                        type="button"
                        onclick={() => openQuestionModal(answer)}
                        class="group flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50/80 cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                    >
                        <div class="flex items-center gap-3.5 min-w-0 flex-1">
                            <!-- Question Number Pill -->
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200/60 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                                #{qNum}
                            </div>

                            <!-- Question Text & Metadata Badges -->
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2 mb-1">
                                    {#if answer.difficulty}
                                        <span class="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                                            {answer.difficulty}
                                        </span>
                                    {/if}
                                    {#if answer.question_type}
                                        <span class="inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                                            {String(answer.question_type).replace(/_/g, " ")}
                                        </span>
                                    {/if}
                                    {#if pts !== null && pts !== undefined}
                                        <span class="text-[11px] font-medium text-slate-400">
                                            {pts} {pts === 1 ? 'pt' : 'pts'}
                                        </span>
                                    {/if}
                                </div>
                                <p class="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                    {answer.question_text || `Question ${qNum}`}
                                </p>
                            </div>
                        </div>

                        <!-- Right side: Status Pill & View Action -->
                        <div class="flex items-center gap-3 shrink-0">
                            {#if isAnswerSkipped}
                                <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
                                    <SkipForward class="h-3 w-3 text-slate-400" /> Skipped
                                </span>
                            {:else if isAnswerCorrect}
                                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/70">
                                    <CheckCircle2 class="h-3 w-3 text-emerald-600" /> Correct
                                </span>
                            {:else}
                                <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
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

            <!-- ─── Question Details Modal Dialog ─── -->
            {#if selectedQuestion}
                {@const qNum = selectedQuestion.question_number || (selectedQuestionIndex + 1)}
                {@const isAnswerCorrect = Boolean(selectedQuestion.is_correct)}
                {@const isAnswerSkipped = Boolean(selectedQuestion.is_skipped)}
                {@const pts = selectedQuestion.points}
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
                                {#if selectedQuestion.difficulty}
                                    <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 capitalize">
                                        {selectedQuestion.difficulty}
                                    </span>
                                {/if}
                                {#if selectedQuestion.question_type}
                                    <span class="inline-flex items-center rounded-md border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 capitalize">
                                        {String(selectedQuestion.question_type).replace(/_/g, " ")}
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
                                    {detail?.question_text || selectedQuestion.question_text || `Question ${qNum}`}
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
                                                {@const isSelectedOpt = isOptionSelected(opt, selectedQuestion.user_answer || detail?.user_answer)}
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
                                                {selectedQuestion.user_answer || detail?.user_answer || "—"}
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

            <!-- Bottom Actions -->
            <div class="mt-8 flex justify-center gap-3">
                <button onclick={() => goto("/quizzes/" + quizId + "/result")} class="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700">
                    <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Results
                </button>
                <button onclick={() => goto("/applications")} class="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700">
                    <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    All Applications
                </button>
            </div>
        {/if}
    </div>
</div>
