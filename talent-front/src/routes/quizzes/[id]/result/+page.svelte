<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { intelligenceService } from "$lib/api/intelligence.service";
    import {
        Loader2, XCircle, ArrowLeft, Github,
        Target, FileText,
        CheckCircle2, BookOpen
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
        try {
            const result = await intelligenceService.fetchGitHubIntelligence(id);
            data = result;
        } catch (e) {
            error = e.message || "Failed to load intelligence data";
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
                        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-indigo-100">
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
                                                <span class="text-slate-700">{answer.UserAnswer ?? "--"}</span>
                                            {/if}
                                        </td>
                                        <td class="max-w-xs truncate px-3 py-2">
                                            {#if answer.IsSkipped}
                                                <span class="text-slate-400">--</span>
                                            {:else}
                                                <span class="font-medium {answer.IsCorrect ? 'text-emerald-600' : 'text-red-500'}">
                                                    {answer.CorrectAnswer ?? "--"}
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