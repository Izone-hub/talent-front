<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import PassFailBadge from "$lib/components/ui/PassFailBadge.svelte";
    import {
        CheckCircle2,
        XCircle,
        Loader2,
        ArrowLeft,
        Clock,
        Trophy,
        Target,
        SkipForward,
    } from "@lucide/svelte";

    const quizId = $page.params.id;

    let loading = $state(true);
    let result = $state(null);
    let error = $state("");

    function percentage() {
        if (!result || !result.total_questions) return 0;
        return Math.round((result.correct_answers / result.total_questions) * 100);
    }

    function gradeColor() {
        const pct = percentage();
        if (pct >= 80) return "text-emerald-600";
        if (pct >= 60) return "text-amber-600";
        return "text-red-600";
    }

    function gradeRing() {
        const pct = percentage();
        if (pct >= 80) return "stroke-emerald-500";
        if (pct >= 60) return "stroke-amber-500";
        return "stroke-red-500";
    }

    function difficultyColor(d) {
        const map = { easy: "badge-success", medium: "badge-warning", hard: "badge-error", expert: "badge-neutral" };
        return map[d] || "badge-ghost";
    }

    function formatTime(s) {
        if (!s && s !== 0) return "--";
        const m = Math.floor(s / 60);
        const sec = s % 60;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }

    function formatDate(d) {
        if (!d) return "--";
        return new Date(d).toLocaleString();
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
            error = e.message || "Failed to load quiz results";
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
                <h2 class="mt-4 text-lg font-semibold text-red-700">Failed to load results</h2>
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
                    <h1 class="text-2xl font-bold text-slate-800">{result.title || "Quiz Results"}</h1>
                    <p class="mt-1 text-sm text-slate-500">Completed {formatDate(result.completed_at)}</p>
                </div>
                <button onclick={() => goto("/applications")} class="btn btn-sm gap-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back
                </button>
            </div>

            <!-- Score Overview -->
            <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                            <Trophy class="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Score</p>
                            <p class="text-xl font-bold {gradeColor()}">{result.score}%</p>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                            <CheckCircle2 class="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Correct</p>
                            <p class="text-xl font-bold text-emerald-600">{result.correct_answers}/{result.total_questions}</p>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                            <XCircle class="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Wrong</p>
                            <p class="text-xl font-bold text-red-500">{result.wrong_answers}</p>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                            <Clock class="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Time Spent</p>
                            <p class="text-xl font-bold text-amber-600">{formatTime(result.time_spent_seconds)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pass/Fail + Progress -->
            <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <div class="flex items-center gap-4">
                        <PassFailBadge score={result.score} passing_threshold={result.passing_score} showScore={true} />
                    </div>
                    <div class="flex flex-col items-center gap-1 sm:items-end">
                        <div class="flex h-20 w-20 items-center justify-center">
                            <svg class="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" stroke-width="6" />
                                <circle cx="36" cy="36" r="30" fill="none" class={gradeRing()} stroke-width="6" stroke-dasharray="188.5" stroke-dashoffset={188.5 - (188.5 * percentage()) / 100} stroke-linecap="round" />
                            </svg>
                            <span class="absolute text-lg font-bold {gradeColor()}">{percentage()}%</span>
                        </div>
                        <span class="text-xs text-slate-400">Overall</span>
                    </div>
                </div>
            </div>

            <!-- Answer Review -->
            <div class="mb-6">
                <h2 class="mb-4 text-lg font-semibold text-slate-800">Answer Review</h2>
                <div class="space-y-3">
                    {#each result.answers as answer, i}
                        <div class="rounded-2xl border {answer.is_correct ? 'border-emerald-200 bg-emerald-50/50' : answer.is_skipped ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50/50'} p-5 shadow-sm">
                            <div class="flex items-start justify-between gap-3">
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
                                    <p class="text-sm font-medium text-slate-800">{answer.question_text}</p>

                                    <div class="mt-3 space-y-1.5 text-sm">
                                        <div class="flex items-start gap-2">
                                            <span class="mt-0.5 shrink-0 font-medium text-slate-500">Your answer:</span>
                                            {#if answer.is_skipped}
                                                <span class="flex items-center gap-1 text-slate-400 italic">
                                                    <SkipForward class="h-3.5 w-3.5" />
                                                    Skipped
                                                </span>
                                            {:else if answer.is_correct}
                                                <span class="flex items-center gap-1 font-medium text-emerald-700">
                                                    <CheckCircle2 class="h-3.5 w-3.5" />
                                                    {userAnswerLabel(answer)}
                                                </span>
                                            {:else}
                                                <span class="flex items-center gap-1 font-medium text-red-600">
                                                    <XCircle class="h-3.5 w-3.5" />
                                                    {userAnswerLabel(answer)}
                                                </span>
                                            {/if}
                                        </div>
                                        {#if !answer.is_correct && answer.correct_answer}
                                            <div class="flex items-start gap-2">
                                                <span class="mt-0.5 shrink-0 font-medium text-slate-500">Correct answer:</span>
                                                <span class="font-medium text-emerald-700">{answer.correct_answer}</span>
                                            </div>
                                        {/if}
                                    </div>
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
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Bottom Actions -->
            <div class="flex justify-center gap-3">
                <button onclick={() => goto("/quizzes/" + quizId + "/review")} class="btn gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                    Review Answers
                </button>
                <button onclick={() => goto("/applications")} class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                    <ArrowLeft class="h-4 w-4" />
                    Back to Applications
                </button>
            </div>
        {/if}
    </div>
</div>
