<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import { showToast } from "$lib/stores/toast";
    import {
        Play,
        CheckCircle2,
        XCircle,
        ChevronRight,
        ChevronLeft,
        Loader2,
        Code2,
        Terminal,
        Clock,
        BarChart3,
        ArrowLeft,
        Send,
    } from "@lucide/svelte";

    const quizId = $page.params.id;
    const applicationId = $page.url.searchParams.get("application_id");
    const jobId = $page.url.searchParams.get("job_id");

    let phase = $state("loading");
    let quiz = $state(null);
    let question = $state(null);
    let questionNumber = $state(0);
    let selectedOption = $state("");
    let code = $state("");
    let codeOutput = $state(null);
    let isRunningCode = $state(false);
    let isSaving = $state(false);
    let isSubmitting = $state(false);
    let submitted = $state(false);
    let resultMessage = $state("");
    let questionHistory = $state([]);
    let historyIndex = $state(-1);

    function getQuizQuestionCount() {
        return quiz?.questions_per_quiz || quiz?.total_questions || 10;
    }

    function isLastQuestion() {
        return questionNumber >= getQuizQuestionCount();
    }

    function snapshotCurrentQuestion() {
        if (!question) return null;

        return {
            question,
            selectedOption,
            code,
            codeOutput,
        };
    }

    function persistCurrentQuestionState() {
        if (historyIndex < 0 || !questionHistory[historyIndex]) return;

        const updatedHistory = [...questionHistory];
        updatedHistory[historyIndex] = snapshotCurrentQuestion();
        questionHistory = updatedHistory;
    }

    function restoreQuestionState(entry) {
        question = entry.question;
        selectedOption = entry.selectedOption || "";
        code = entry.code || "";
        codeOutput = entry.codeOutput ?? null;
    }

    function optionsList(q) {
        if (!q?.options) return [];
        let opts = q.options;
        if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch { return []; }
        }
        return Array.isArray(opts) ? opts : [];
    }

    function isCoding(q) {
        return q?.question_type === "coding_challenge";
    }

    function isMcq(q) {
        return q?.question_type === "multiple_choice" || q?.question_type === "multiple_select" || q?.question_type === "true_false";
    }

    function codingDetails(q) {
        return q?.coding_details || null;
    }

    function optionValue(opt) {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) return opt.option || opt.text || opt.value || JSON.stringify(opt);
        return String(opt);
    }

    function optionText(opt) {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) return opt.text || opt.label || opt.option || JSON.stringify(opt);
        return String(opt);
    }

    function optionLetter(opt) {
        if (typeof opt === "object" && opt !== null && opt.option) return opt.option;
        return null;
    }

    function difficultyColor(d) {
        const map = { easy: "badge-success", medium: "badge-warning", hard: "badge-error", expert: "badge-neutral" };
        return map[d] || "badge-ghost";
    }

    async function startQuiz() {
        phase = "starting";
        try {
            await quizService.startQuiz(quizId, applicationId, jobId);
            showToast("Quiz started!", "success");
            await loadNextQuestion();
        } catch (e) {
            showToast("Failed to start quiz", "error");
            phase = "ready";
        }
    }

    async function loadNextQuestion() {
        try {
            const q = await quizService.getQuestion(quizId);
            if (q && q.status === "finished") {
                question = null;
                resultMessage = q.message || "Quiz complete!";
                phase = "finished";
                return;
            }
            if (!q || !q.id) {
                phase = "ready";
                return;
            }

            if (question) {
                persistCurrentQuestionState();
            }

            const nextHistory = questionHistory.slice(0, historyIndex + 1);
            nextHistory.push({
                question: q,
                selectedOption: "",
                code: "",
                codeOutput: null,
            });

            questionHistory = nextHistory;
            historyIndex = nextHistory.length - 1;
            question = q;
            questionNumber = historyIndex + 1;
            selectedOption = "";
            code = "";
            codeOutput = null;
            const details = codingDetails(q);
            if (details?.code_template) {
                code = details.code_template;
            }
        } catch (e) {
            showToast("Failed to load question", "error");
            if (questionNumber === 0) {
                phase = "ready";
            }
        }
    }

    async function saveCurrentAnswer() {
        if (!question || isSaving) return;
        isSaving = true;
        try {
            persistCurrentQuestionState();
            const answer = isCoding(question) ? code : (selectedOption || "");
            await quizService.saveAnswer(quizId, question.id, answer, 0, !selectedOption && !isCoding(question));
            return true;
        } catch (e) {
            showToast("Failed to save answer", "error");
            return false;
        } finally {
            isSaving = false;
        }
    }

    async function saveAndNext() {
        const saved = await saveCurrentAnswer();
        if (!saved) return;

        try {
            await loadNextQuestion();
        } catch (e) {
            showToast("Failed to save answer", "error");
        }
    }

    function goToPreviousQuestion() {
        if (historyIndex <= 0 || isSaving || isSubmitting) return;

        persistCurrentQuestionState();
        const previousIndex = historyIndex - 1;
        const previousEntry = questionHistory[previousIndex];
        if (!previousEntry) return;

        historyIndex = previousIndex;
        questionNumber = previousIndex + 1;
        restoreQuestionState(previousEntry);
        phase = "active";
    }

    async function handlePrimaryAction() {
        if (!question || isSaving) return;

        const saved = await saveCurrentAnswer();
        if (!saved) return;

        if (isLastQuestion()) {
            await submitQuiz();
            return;
        }

        await loadNextQuestion();
    }

    async function runCode() {
        if (!question || isRunningCode) return;
        isRunningCode = true;
        codeOutput = null;
        try {
            const details = codingDetails(question);
            const lang = details?.language || "python";
            const result = await quizService.runCode(quizId, question.id, lang, code);
            codeOutput = result;
        } catch (e) {
            codeOutput = { stderr: "Execution error: " + (e.message || "Unknown error"), exitCode: 1 };
        } finally {
            isRunningCode = false;
        }
    }

    async function submitQuiz() {
        if (isSubmitting) return;
        isSubmitting = true;
        try {
            await quizService.submitQuiz(quizId);
            resultMessage = "Quiz submitted successfully!";
            showToast("Quiz submitted!", "success");
            submitted = true;
        } catch (e) {
            if (e.message && e.message.includes("already completed")) {
                resultMessage = "Quiz was already completed.";
                submitted = true;
            } else {
                showToast("Failed to submit quiz: " + e.message, "error");
            }
        } finally {
            isSubmitting = false;
            phase = "finished";
        }
    }

    function goToApplications() {
        goto("/applications");
    }

    function selectOption(val) {
        selectedOption = selectedOption === val ? "" : val;
    }

    onMount(async () => {
        if (!$auth.isAuthenticated) {
            goto("/auth");
            return;
        }

        try {
            quiz = await quizService.getQuiz(quizId);
        } catch {
            // quiz may not exist yet
        }

        try {
            const q = await quizService.getQuestion(quizId);
            if (q && q.status === "finished") {
                const msg = (q.message || "").toLowerCase();
                if (msg.includes("no more questions")) {
                    phase = "ready";
                } else {
                    phase = "finished";
                    resultMessage = q.message || "You've completed this quiz!";
                }
            } else if (q && q.id) {
                question = q;
                questionNumber = 1;
                questionHistory = [{ question: q, selectedOption: "", code: "", codeOutput: null }];
                historyIndex = 0;
                const details = codingDetails(q);
                if (details?.code_template) {
                    code = details.code_template;
                }
                phase = "active";
            } else {
                phase = "ready";
            }
        } catch {
            phase = "ready";
        }
    });
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        <!-- Loading -->
        {#if phase === "loading"}
            <div class="flex items-center justify-center py-32">
                <Loader2 class="h-10 w-10 animate-spin text-indigo-600" />
            </div>

        <!-- Ready / Start Screen -->
        {:else if phase === "ready"}
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
                    <Code2 class="h-10 w-10 text-indigo-600" />
                </div>
                <h1 class="text-2xl font-bold text-slate-800">
                    {quiz?.title || "Technical Assessment"}
                </h1>
                <p class="mx-auto mt-3 max-w-md text-slate-500">
                    You'll be presented with a series of questions to assess your skills.
                    Take your time and answer each question carefully.
                </p>
                <div class="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                    <span class="flex items-center gap-1.5">
                        <BarChart3 class="h-4 w-4" />
                        Mixed difficulty
                    </span>
                    <span class="flex items-center gap-1.5">
                        <Clock class="h-4 w-4" />
                        No time limit
                    </span>
                </div>
                <button
                    onclick={startQuiz}
                    class="btn mt-8 gap-2 border-indigo-600 bg-indigo-600 px-8 text-white hover:bg-indigo-700"
                >
                    {#if phase === "starting"}
                        <Loader2 class="h-4 w-4 animate-spin" />
                        Starting...
                    {:else}
                        <Play class="h-4 w-4" />
                        Start Quiz
                    {/if}
                </button>
            </div>

        <!-- Active Question -->
        {:else if phase === "active" && question}
            <div class="space-y-4">
                <!-- Progress -->
                <div class="flex items-center justify-between text-sm text-slate-500">
                    <span>Question {questionNumber}</span>
                    <span class="badge {difficultyColor(question.difficulty)} badge-sm">
                        {question.difficulty || "mixed"}
                    </span>
                </div>

                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                        class="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style="width: {Math.min(questionNumber * 10, 100)}%"
                    ></div>
                </div>

                <!-- Question Card -->
                <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 class="text-lg font-semibold leading-relaxed text-slate-800">
                        {question.question_text}
                    </h2>

                    <!-- MCQ Options -->
                    {#if isMcq(question)}
                        <div class="mt-6 space-y-3">
                            {#each optionsList(question) as opt, i}
                                <button
                                    onclick={() => selectOption(optionValue(opt))}
                                    class="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all {selectedOption === optionValue(opt)
                                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}"
                                >
                                    <span
                                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold {selectedOption === optionValue(opt)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600'}"
                                    >
                                        {optionLetter(opt) || String.fromCharCode(65 + i)}
                                    </span>
                                    <span class="text-sm text-slate-700">{optionText(opt)}</span>
                                </button>
                            {/each}
                        </div>

                    <!-- Coding Challenge -->
                    {:else if isCoding(question)}
                        {@const details = codingDetails(question)}
                        {#if details?.language}
                            <div class="mt-4">
                                <span class="badge badge-outline gap-1 border-slate-300 bg-slate-100 text-xs text-slate-600">
                                    <Terminal class="h-3 w-3" />
                                    {details.language}
                                </span>
                                {#if details.execution_time_limit}
                                    <span class="badge badge-outline ml-2 border-slate-300 bg-slate-100 text-xs text-slate-600">
                                        <Clock class="h-3 w-3" />
                                        {details.execution_time_limit}ms
                                    </span>
                                {/if}
                            </div>
                        {/if}

                        <div class="mt-4">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Your Solution
                                </label>
                                <button
                                    onclick={runCode}
                                    disabled={isRunningCode}
                                    class="btn btn-ghost btn-sm gap-1.5 text-indigo-600 hover:bg-indigo-50"
                                >
                                    {#if isRunningCode}
                                        <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                        Running...
                                    {:else}
                                        <Play class="h-3.5 w-3.5" />
                                        Run Code
                                    {/if}
                                </button>
                            </div>
                            <textarea
                                bind:value={code}
                                class="mt-2 h-52 w-full resize-y rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-sm leading-relaxed text-green-300 shadow-inner outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                spellcheck="false"
                            ></textarea>
                        </div>

                        <!-- Code Output -->
                        {#if codeOutput}
                            <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <Terminal class="h-3.5 w-3.5" />
                                    Output
                                    {#if codeOutput.passed !== undefined}
                                        {#if codeOutput.passed}
                                            <span class="ml-auto flex items-center gap-1 text-emerald-600">
                                                <CheckCircle2 class="h-3.5 w-3.5" />
                                                Passed
                                            </span>
                                        {:else}
                                            <span class="ml-auto flex items-center gap-1 text-red-600">
                                                <XCircle class="h-3.5 w-3.5" />
                                                Failed
                                            </span>
                                        {/if}
                                    {/if}
                                </div>
                                <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300"><code>{codeOutput.stdout || codeOutput.stderr || "No output"}</code></pre>
                                {#if codeOutput.timeMs}
                                    <p class="mt-1 text-xs text-slate-400">Executed in {codeOutput.timeMs}ms</p>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400">Next saves your answer. Blank answers are treated as skipped.</span>
                    <div class="flex gap-2">
                        {#if historyIndex > 0}
                            <button
                                onclick={goToPreviousQuestion}
                                disabled={isSaving || isSubmitting}
                                class="btn btn-ghost btn-sm gap-1.5 text-slate-500 hover:bg-slate-100"
                            >
                                <ChevronLeft class="h-3.5 w-3.5" />
                                Previous
                            </button>
                        {/if}
                        <button
                            onclick={handlePrimaryAction}
                            disabled={isSaving}
                            class="btn btn-sm gap-1.5 border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {#if isSaving}
                                <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                Saving...
                            {:else if isLastQuestion()}
                                <Send class="h-3.5 w-3.5" />
                                Submit Quiz
                            {:else}
                                Next
                                <ChevronRight class="h-3.5 w-3.5" />
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

        <!-- Finished / Submit Screen -->
        {:else if phase === "finished"}
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
                    <CheckCircle2 class="h-10 w-10 text-emerald-600" />
                </div>
                <h1 class="text-2xl font-bold text-slate-800">Quiz Complete!</h1>
                <p class="mt-3 text-slate-500">
                    {resultMessage || "Your answers have been submitted for review."}
                </p>
                <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    {#if !submitted}
                        <button
                            onclick={submitQuiz}
                            disabled={isSubmitting}
                            class="btn gap-2 border-indigo-600 bg-indigo-600 px-8 text-white hover:bg-indigo-700"
                        >
                            {#if isSubmitting}
                                <Loader2 class="h-4 w-4 animate-spin" />
                                Submitting...
                            {:else}
                                <Send class="h-4 w-4" />
                                Submit Quiz
                            {/if}
                        </button>
                    {/if}
                    <button
                        onclick={goToApplications}
                        class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft class="h-4 w-4" />
                        Back to Applications
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
