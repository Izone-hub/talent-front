<script>
    import { onMount } from "svelte";
    import { questionService } from "$lib/api/questions.service";
    import {
        Plus,
        Search,
        Eye,
        Trash2,
        Star,
        ChevronDown,
        ChevronRight,
        Code2,
        XCircle,
        HelpCircle,
        Check,
        ListChecks,
        Terminal,
    } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import CreateQuestionModal from "$lib/components/modals/admin/question/CreateQuestionModal.svelte";
    import QuestionDetailModal from "$lib/components/modals/admin/question/QuestionDetailModal.svelte";
    import DeleteConfirmationModal from "$lib/components/modals/admin/common/DeleteConfirmationModal.svelte";
    import TestCodingModal from "$lib/components/modals/admin/question/TestCodingModal.svelte";

    let questions = $state([]);
    let allQuestions = $state([]);
    let loading = $state(true);
    let isCreateModalOpen = $state(false);
    let isDetailModalOpen = $state(false);
    let selectedQuestionId = $state(null);
    let searchQuery = $state("");
    let expandedTypes = $state(new Set(["multiple_choice", "true_false", "coding_challenge"]));
    let expandedLevels = $state(new Set());

    let isTestCodingModalOpen = $state(false);
    let isDeleteModalOpen = $state(false);
    let deleteLoading = $state(false);
    let deleteTarget = $state(null);
    let deleteMessage = $state("");
    let deleteTitle = $state("");

    const levels = [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
        { value: "expert", label: "Expert" },
    ];

    onMount(() => {
        loadQuestions();
    });

    async function loadQuestions() {
        loading = true;
        try {
            const response = await questionService.listQuestions(200, 0, "");
            allQuestions = response?.questions || [];
        } catch (error) {
            showToast("Failed to load questions", "error");
        } finally {
            loading = false;
        }
    }

    function typeCfg(type) {
        switch (type?.toLowerCase()) {
            case "multiple_choice": return { label: "Multiple Choice", icon: ListChecks, bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" };
            case "true_false": return { label: "True / False", icon: Check, bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" };
            case "coding_challenge": return { label: "Coding", icon: Terminal, bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-200" };
            default: return { label: type || "Other", icon: HelpCircle, bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" };
        }
    }

    function levelCfg(level) {
        switch (level?.toLowerCase()) {
            case "easy": return { label: "Easy", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
            case "medium": return { label: "Medium", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
            case "hard": return { label: "Hard", dot: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50" };
            case "expert": return { label: "Expert", dot: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" };
            default: return { label: "Other", dot: "bg-gray-400", text: "text-gray-500", bg: "bg-gray-50" };
        }
    }

    let tree = $derived(buildTree());

    function buildTree() {
        const q = searchQuery.trim()
            ? allQuestions.filter((item) =>
                  item.question_text?.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : allQuestions;

        const order = ["multiple_choice", "true_false", "coding_challenge"];
        const byType = new Map();
        for (const item of q) {
            const type = item.question_type || "other";
            if (!byType.has(type)) byType.set(type, []);
            byType.get(type).push(item);
        }

        const nodes = [];
        const sortedTypes = [...byType.keys()].sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        for (const type of sortedTypes) {
            const typeItems = byType.get(type);
            const cfg = typeCfg(type);
            const byLevel = new Map();
            for (const item of typeItems) {
                const level = (item.difficulty || "other").toLowerCase();
                if (!byLevel.has(level)) byLevel.set(level, []);
                byLevel.get(level).push(item);
            }
            const levelNodes = [];
            for (const lvl of levels) {
                const lvlItems = byLevel.get(lvl.value);
                if (lvlItems && lvlItems.length) {
                    const lcfg = levelCfg(lvl.value);
                    levelNodes.push({
                        value: lvl.value,
                        label: lcfg.label,
                        dot: lcfg.dot,
                        text: lcfg.text,
                        bg: lcfg.bg,
                        questions: lvlItems,
                    });
                }
            }
            if (byLevel.has("other")) {
                levelNodes.push({
                    value: "other",
                    label: "Other",
                    dot: "bg-gray-400",
                    text: "text-gray-500",
                    bg: "bg-gray-50",
                    questions: byLevel.get("other"),
                });
            }
            nodes.push({ value: type, label: cfg.label, icon: cfg.icon, bg: cfg.bg, text: cfg.text, ring: cfg.ring, levels: levelNodes, count: typeItems.length });
        }
        return nodes;
    }

    function toggleType(type) {
        const next = new Set(expandedTypes);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        expandedTypes = next;
    }

    function toggleLevel(key) {
        const next = new Set(expandedLevels);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        expandedLevels = next;
    }

    function openDetailModal(id) {
        selectedQuestionId = id;
        isDetailModalOpen = true;
    }

    function openDeleteModal(id) {
        deleteTarget = { type: "single", id };
        deleteTitle = "Delete Question";
        deleteMessage = "Are you sure? This will permanently remove this question.";
        isDeleteModalOpen = true;
    }

    async function handleConfirmDelete() {
        deleteLoading = true;
        try {
            await questionService.deleteQuestion(deleteTarget.id);
            showToast("Question deleted", "success");
            await loadQuestions();
            isDeleteModalOpen = false;
        } catch (error) {
            showToast("Failed to delete", "error");
        } finally {
            deleteLoading = false;
        }
    }

    async function handleCreateQuestion(event) {
        try {
            await questionService.createQuestion(event.detail);
            showToast("Question created successfully", "success");
            isCreateModalOpen = false;
            await loadQuestions();
        } catch (error) {
            showToast("Failed to create question", "error");
        }
    }
</script>

<div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Question Bank</h1>
            <p class="text-gray-500 mt-0.5 text-sm">{allQuestions.length} questions</p>
        </div>
        <div class="flex items-center gap-2">
            <button
                class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                onclick={() => (isTestCodingModalOpen = true)}
            >
                <Code2 size={16} />
                Test Coding
            </button>
            <button
                class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
                onclick={() => (isCreateModalOpen = true)}
            >
                <Plus size={16} />
                Create
            </button>
        </div>
    </div>

    <!-- Search -->
    <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
            type="text"
            placeholder="Search questions..."
            class="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            bind:value={searchQuery}
        />
        {#if searchQuery}
            <button
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                onclick={() => (searchQuery = "")}
            >
                <XCircle size={16} />
            </button>
        {/if}
    </div>

    <!-- Tree -->
    {#if loading}
        <div class="space-y-2">
            {#each Array(4) as _}
                <div class="bg-white border border-gray-100 rounded-lg p-4 animate-pulse">
                    <div class="flex gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gray-100"></div>
                        <div class="flex-1">
                            <div class="h-3 bg-gray-100 rounded w-1/3 mb-2"></div>
                            <div class="h-2 bg-gray-50 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else if tree.length === 0}
        <div class="bg-white rounded-lg border border-gray-100 p-12">
            <EmptyState
                icon={HelpCircle}
                title="No questions found"
                description={searchQuery ? "Try a different search term" : "Create your first question to get started"}
            />
        </div>
    {:else}
        <!-- Level 1: Question Type -->
        <div class="space-y-3">
            {#each tree as typeNode}
                {@const isTypeOpen = expandedTypes.has(typeNode.value)}
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        onclick={() => toggleType(typeNode.value)}
                    >
                        {#if isTypeOpen}
                            <ChevronDown size={16} class="text-gray-400 shrink-0" />
                        {:else}
                            <ChevronRight size={16} class="text-gray-400 shrink-0" />
                        {/if}
                        <span class="w-8 h-8 rounded-lg {typeNode.bg} flex items-center justify-center shrink-0">
                            <typeNode.icon size={16} class={typeNode.text} />
                        </span>
                        <span class="flex-1 font-semibold text-gray-800">{typeNode.label}</span>
                        <span class="text-xs font-semibold text-gray-400">{typeNode.count}</span>
                    </button>

                    {#if isTypeOpen}
                        <div class="border-t border-gray-100">
                            <!-- Level 2: Difficulty -->
                            <div class="space-y-1 p-2">
                                {#each typeNode.levels as levelNode}
                                    {@const levelKey = `${typeNode.value}:${levelNode.value}`}
                                    {@const isLevelOpen = expandedLevels.has(levelKey)}
                                    <div>
                                        <button
                                            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                            onclick={() => toggleLevel(levelKey)}
                                        >
                                            {#if isLevelOpen}
                                                <ChevronDown size={14} class="text-gray-400 shrink-0" />
                                            {:else}
                                                <ChevronRight size={14} class="text-gray-400 shrink-0" />
                                            {/if}
                                            <span class="w-2 h-2 rounded-full {levelNode.dot} shrink-0"></span>
                                            <span class="flex-1 text-sm font-medium text-gray-700">{levelNode.label}</span>
                                            <span class="text-xs font-medium text-gray-400">{levelNode.questions.length}</span>
                                        </button>

                                        {#if isLevelOpen}
                                            <!-- Level 3: Compact cards -->
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9 pr-2 pb-2">
                                                {#each levelNode.questions as q (q.id)}
                                                    <div class="group flex items-center gap-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-lg px-3 py-2.5 transition-colors">
                                                        <div class="flex-1 min-w-0">
                                                            <p class="text-sm font-medium text-gray-800 truncate">{q.question_text}</p>
                                                            <div class="flex items-center gap-2 mt-1">
                                                                {#each (q.tags || []).slice(0, 2) as tag}
                                                                    <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                                                                {/each}
                                                                <span class="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                                                    <Star size={11} class="fill-amber-400 text-amber-400" />
                                                                    {q.points || 0}
                                                                </span>
                                                                {#if q.warning}
                                                                    <span class="text-[10px] font-medium text-amber-600">{q.warning}</span>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center gap-1 shrink-0">
                                                            <button
                                                                class="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                title="View"
                                                                onclick={() => openDetailModal(q.id)}
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            <button
                                                                class="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                title="Delete"
                                                                onclick={() => openDeleteModal(q.id)}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<CreateQuestionModal
    isOpen={isCreateModalOpen}
    on:close={() => (isCreateModalOpen = false)}
    on:submit={handleCreateQuestion}
/>

<QuestionDetailModal
    isOpen={isDetailModalOpen}
    questionId={selectedQuestionId}
    on:close={() => { isDetailModalOpen = false; selectedQuestionId = null; }}
    on:updated={() => loadQuestions()}
/>

<DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    title={deleteTitle}
    message={deleteMessage}
    loading={deleteLoading}
    on:close={() => (isDeleteModalOpen = false)}
    on:confirm={handleConfirmDelete}
/>

<TestCodingModal
    isOpen={isTestCodingModalOpen}
    on:close={() => (isTestCodingModalOpen = false)}
/>
