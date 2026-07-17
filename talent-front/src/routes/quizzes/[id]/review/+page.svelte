<script>
    import { onMount } from "svelte";
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
    } from "@lucide/svelte";

    const quizId = $page.params.id;

    let loading = $state(true);
    let result = $state(null);
    let error = $state("");

    function difficultyColor(d) {
        const map = { easy: "badge-success", medium: "badge-warning", hard: "badge-error", expert: "badge-neutral" };
        return map[d] || "badge-ghost";
    }

    function optionText(opt) {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) return opt.text || opt.label || opt.option || JSON.stringify(opt);
        return String(opt);
    }

    function optionsList(q) {
        if (!q?.options) return [];
        let opts = q.options;
        if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch { return []; }
        }
        return Array.isArray(opts) ? opts : [];
    }

    function optionLetter(opt) {
        if (typeof opt === "object" && opt !== null && opt.option) return opt.option;
        return null;
    }

    function answerLetter(q, val) {
        if (!q?.options) return "";
        const opts = optionsList(q);
        for (let i = 0; i < opts.length; i++) {
            const o = opts[i];
            const ov = typeof o === "string" ? o : o.option || o.text || o.value || "";
            if (ov === val) {
                return optionLetter(o) || String.fromCharCode(65 + i);
            }
        }
        return "";
    }

    function correctAnswerLetter(q) {
        if (!q?.options || !q?.correct_answer) return "";
        return answerLetter(q, q.correct_answer);
    }

    function userAnswerLabel(q) {
        if (!q) return "";
        if (q.is_skipped) return "Skipped";
        return q.user_answer || "(no answer)";
    }

    onMount(async () => {
        if (!$auth.isAuthenticated) {
            goto("/auth");
            return;
        }

        try {
            result = await quizService.getResult(quizId);
        } catch (e) {
            error = e.message || "Failed to load quiz review";
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        {#if loading}
            <div class="flex items-center justify-center py-20">
                <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
            </div>

        {:else if error}
            <div class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <XCircle class="mx-auto h-12 w-12 text-red-400" />
                <h2 class="mt-4 text-lg font-semibold text-red-700">Failed to load review</h2>
                <p class="mt-2 text-sm text-red-500">{error}</p>
                <button onclick={() => goto("/applications")} class="btn mt-6 gap-2 border-red-300 bg-white text-red-600 hover:bg-red-50">
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
                <button onclick={() => goto("/quizzes/" + quizId + "/result")} class="btn btn-sm gap-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back to Results
                </button>
            </div>

            <!-- Score Summary -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex flex-wrap items-center gap-6">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                            <CheckCircle2 class="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Score</p>
                            <p class="text-lg font-bold text-emerald-600">{result.score}%</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                            <HelpCircle class="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Result</p>
                            <p class="text-lg font-bold {result.passed ? 'text-emerald-600' : 'text-red-600'}">{result.passed ? 'PASSED' : 'FAILED'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                            <HelpCircle class="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500">Questions</p>
                            <p class="text-lg font-bold text-amber-600">{result.total_questions}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Question Review -->
            <div class="space-y-4">
                {#each result.answers as answer, i}
                    <div class="rounded-2xl border {answer.is_correct ? 'border-emerald-200' : answer.is_skipped ? 'border-slate-200' : 'border-red-200'} bg-white p-6 shadow-sm">
                        <!-- Question Header -->
                        <div class="mb-3 flex items-start justify-between gap-3">
                            <div class="flex-1">
                                <div class="mb-1 flex items-center gap-2">
                                    <span class="text-xs font-semibold text-slate-400 uppercase">Q{i + 1}</span>
                                    {#if answer.difficulty}
                                        <span class="badge badge-sm {difficultyColor(answer.difficulty)}">{answer.difficulty}</span>
                                    {/if}
                                    {#if answer.question_type}
                                        <span class="badge badge-sm badge-outline border-slate-300 text-xs text-slate-500">{answer.question_type.replace(/_/g, ' ')}</span>
                                    {/if}
                                </div>
                                <p class="text-base font-semibold text-slate-800">{answer.question_text}</p>
                            </div>
                            {#if answer.is_correct}
                                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                    <CheckCircle2 class="h-4 w-4 text-emerald-600" />
                                </div>
                            {:else}
                                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {answer.is_skipped ? 'bg-slate-200' : 'bg-red-100'}">
                                    {#if answer.is_skipped}
                                        <SkipForward class="h-4 w-4 text-slate-500" />
                                    {:else}
                                        <XCircle class="h-4 w-4 text-red-500" />
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <!-- Your Answer vs Correct Answer -->
                        <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div class="rounded-xl border {answer.is_correct ? 'border-emerald-200 bg-emerald-50/50' : answer.is_skipped ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50/50'} p-3">
                                <p class="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Your Answer</p>
                                {#if answer.is_skipped}
                                    <p class="flex items-center gap-1.5 text-sm text-slate-400 italic">
                                        <SkipForward class="h-3.5 w-3.5" />
                                        Skipped
                                    </p>
                                {:else}
                                    <p class="flex items-center gap-1.5 text-sm font-medium {answer.is_correct ? 'text-emerald-700' : 'text-red-600'}">
                                        {#if answer.is_correct}
                                            <CheckCircle2 class="h-3.5 w-3.5" />
                                        {:else}
                                            <XCircle class="h-3.5 w-3.5" />
                                        {/if}
                                        {userAnswerLabel(answer)}
                                    </p>
                                {/if}
                            </div>
                            <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                <p class="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Correct Answer</p>
                                <p class="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                                    <CheckCircle2 class="h-3.5 w-3.5" />
                                    {answer.correct_answer}
                                </p>
                            </div>
                        </div>

                        <!-- Explanation -->
                        {#if answer.explanation}
                            <div class="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                                <div class="flex items-start gap-2.5">
                                    <div class="mt-0.5 shrink-0">
                                        <Lightbulb class="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p class="text-xs font-semibold text-blue-700 uppercase tracking-wider">Explanation</p>
                                        <p class="mt-1 text-sm leading-relaxed text-slate-700">{answer.explanation}</p>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Bottom Actions -->
            <div class="mt-8 flex justify-center gap-3">
                <button onclick={() => goto("/quizzes/" + quizId + "/result")} class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back to Results
                </button>
                <button onclick={() => goto("/applications")} class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    All Applications
                </button>
            </div>
        {/if}
    </div>
</div>
