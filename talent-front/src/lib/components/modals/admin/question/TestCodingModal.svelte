<script>
    import { createEventDispatcher, onMount } from "svelte";
    import {
        X,
        Play,
        Loader2,
        CheckCircle2,
        XCircle,
        Code2,
        ChevronDown,
        ChevronRight,
        AlertCircle,
    } from "lucide-svelte";
    import { questionService } from "$lib/api/questions.service";
    import { showToast } from "$lib/stores/toast";
    import CodeEditor from "$lib/components/ui/CodeEditor.svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let codingQuestions = [];
    let loading = true;
    let error = null;

    // Per-question state: { [questionId]: { code, output, running, expanded } }
    let questionStates = {};

    $: if (isOpen) {
        loadCodingQuestions();
    }

    async function loadCodingQuestions() {
        loading = true;
        error = null;
        try {
            const all = await questionService.listQuestions();
            codingQuestions = (all || []).filter(
                (q) => q.question_type === "coding_challenge",
            );
            // Initialize states
            for (const q of codingQuestions) {
                if (!questionStates[q.id]) {
                    questionStates[q.id] = {
                        code: q.coding_details?.code_template || "",
                        output: null,
                        running: false,
                        expanded: false,
                    };
                }
            }
        } catch (err) {
            error = "Failed to load coding questions.";
            console.error(err);
        } finally {
            loading = false;
        }
    }

    function toggleExpanded(id) {
        questionStates[id].expanded = !questionStates[id].expanded;
        questionStates = questionStates; // trigger reactivity
    }

    async function runCode(id) {
        const state = questionStates[id];
        if (!state.code.trim() || state.running) return;

        state.running = true;
        state.output = null;
        questionStates = questionStates;

        try {
            const result = await questionService.testQuestion(id, state.code);
            state.output = result;
        } catch (err) {
            state.output = {
                error: err.message || "Execution failed",
            };
        } finally {
            state.running = false;
            questionStates = questionStates;
        }
    }

    function handleClose() {
        dispatch("close");
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Test Coding Challenges"
        onclick={(e) => e.target === e.currentTarget && handleClose()}
        onkeydown={(e) => e.key === "Escape" && handleClose()}
    >
        <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"
                    >
                        <Code2 size={20} />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-gray-900">
                            Test Coding Challenges
                        </h2>
                        <p class="text-xs text-gray-400 font-medium">
                            Run and verify all coding challenge questions
                        </p>
                    </div>
                </div>
                <button
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    onclick={handleClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6">
                {#if loading}
                    <div class="flex items-center justify-center py-12">
                        <Loader2 size={24} class="animate-spin text-indigo-500" />
                        <span class="ml-3 text-sm text-gray-500 font-medium"
                            >Loading coding questions...</span
                        >
                    </div>
                {:else if error}
                    <div
                        class="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl"
                    >
                        <AlertCircle size={20} />
                        <span class="text-sm font-medium">{error}</span>
                    </div>
                {:else if codingQuestions.length === 0}
                    <div
                        class="text-center py-12 text-gray-400 text-sm font-medium"
                    >
                        No coding challenge questions found.
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each codingQuestions as q}
                            {@const state = questionStates[q.id]}
                            <div
                                class="border border-gray-200 rounded-xl overflow-hidden"
                            >
                                <!-- Question header -->
                                <button
                                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    onclick={() => toggleExpanded(q.id)}
                                >
                                    {#if state.expanded}
                                        <ChevronDown
                                            size={16}
                                            class="text-gray-400 flex-shrink-0"
                                        />
                                    {:else}
                                        <ChevronRight
                                            size={16}
                                            class="text-gray-400 flex-shrink-0"
                                        />
                                    {/if}
                                    <div class="flex-1 min-w-0">
                                        <p
                                            class="text-sm font-semibold text-gray-900 truncate"
                                        >
                                            {q.question_text}
                                        </p>
                                        <div
                                            class="flex items-center gap-2 mt-0.5"
                                        >
                                            <span
                                                class="text-[10px] text-gray-400 font-mono"
                                                >#{q.id?.substring(0, 8)}</span
                                            >
                                            <span
                                                class="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                                >{q.coding_details?.language ||
                                                    "N/A"}</span
                                            >
                                            <span
                                                class="text-[10px] font-bold text-gray-400"
                                                >{q.difficulty || "N/A"}</span
                                            >
                                        </div>
                                    </div>
                                    {#if state.output?.passed === true}
                                        <CheckCircle2
                                            size={18}
                                            class="text-emerald-500 flex-shrink-0"
                                        />
                                    {:else if state.output?.passed === false}
                                        <XCircle
                                            size={18}
                                            class="text-red-500 flex-shrink-0"
                                        />
                                    {/if}
                                </button>

                                <!-- Expanded content -->
                                {#if state.expanded}
                                    <div
                                        class="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50/30"
                                    >
                                        <!-- Code editor -->
                                        <div>
                                            <label
                                                class="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block"
                                                >Code</label
                                            >
                                            <CodeEditor
                                                bind:value={state.code}
                                                language={q.coding_details?.language || 'python'}
                                                height="12rem"
                                                placeholder="Write your code here..."
                                            />
                                        </div>

                                        <!-- Run button -->
                                        <div class="flex items-center gap-3">
                                            <button
                                                class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={state.running ||
                                                    !state.code.trim()}
                                                onclick={() => runCode(q.id)}
                                            >
                                                {#if state.running}
                                                    <Loader2
                                                        size={16}
                                                        class="animate-spin"
                                                    />
                                                    Running...
                                                {:else}
                                                    <Play size={16} />
                                                    Run Code
                                                {/if}
                                            </button>
                                        </div>

                                        <!-- Output -->
                                        {#if state.output}
                                            <div>
                                                <label
                                                    class="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block"
                                                    >Output</label
                                                >
                                                {#if state.output.error}
                                                    <div
                                                        class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-mono"
                                                    >
                                                        {state.output.error}
                                                    </div>
                                                {:else}
                                                    <div
                                                        class="p-3 bg-slate-900 rounded-lg font-mono text-xs space-y-1"
                                                    >
                                                        <div
                                                            class="flex items-center gap-2 mb-2"
                                                        >
                                                            {#if state.output.passed}
                                                                <span
                                                                    class="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold"
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    PASSED
                                                                </span>
                                                            {:else}
                                                                <span
                                                                    class="inline-flex items-center gap-1.5 text-red-400 text-[11px] font-bold"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    FAILED
                                                                </span>
                                                            {/if}
                                                            {#if state.output.exit_code !== undefined}
                                                                <span
                                                                    class="text-gray-500 text-[10px]"
                                                                    >exit: {state.output.exit_code}</span
                                                                >
                                                            {/if}
                                                            {#if state.output.time_ms !== undefined}
                                                                <span
                                                                    class="text-gray-500 text-[10px]"
                                                                    >{state.output.time_ms}ms</span
                                                                >
                                                            {/if}
                                                        </div>
                                                        {#if state.output.stdout}
                                                            <div>
                                                                <span
                                                                    class="text-gray-500 text-[10px] font-bold"
                                                                    >stdout:</span
                                                                >
                                                                <pre
                                                                    class="text-green-400 whitespace-pre-wrap">{state.output.stdout}</pre>
                                                            </div>
                                                        {/if}
                                                        {#if state.output.stderr}
                                                            <div>
                                                                <span
                                                                    class="text-gray-500 text-[10px] font-bold"
                                                                    >stderr:</span
                                                                >
                                                                <pre
                                                                    class="text-red-400 whitespace-pre-wrap">{state.output.stderr}</pre>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="px-6 py-4 border-t border-gray-100 flex items-center justify-between"
            >
                <span class="text-xs text-gray-400 font-medium">
                    {codingQuestions.length} coding question{codingQuestions.length !==
                    1
                        ? "s"
                        : ""}
                </span>
                <button
                    class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onclick={handleClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
