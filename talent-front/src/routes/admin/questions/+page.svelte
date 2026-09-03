<script>
    import { onMount } from "svelte";
    import { questionService } from "$lib/api/questions.service";
    import {
        Plus,
        Search,
        Star,
        ArrowLeft,
        X,
        HelpCircle,
        Check,
        ListChecks,
        Terminal,
        // [TEMP difficulty-fill cards] icons — remove with the difficulty fill blocks
        Zap,
        Flame,
        Trophy,
        Award,
    } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import AdminPageHeader from "$lib/components/ui/AdminPageHeader.svelte";
    import AdminQuestionsSkeleton from "$lib/components/ui/skeletons/AdminQuestionsSkeleton.svelte";
    import CreateQuestionModal from "$lib/components/modals/admin/question/CreateQuestionModal.svelte";
    import QuestionDetailModal from "$lib/components/modals/admin/question/QuestionDetailModal.svelte";
    import DeleteConfirmationModal from "$lib/components/modals/admin/common/DeleteConfirmationModal.svelte";


    let allQuestions = $state([]);
    let loading = $state(true);
    let searchQuery = $state("");
    let selectedType = $state(null);
    let selectedDifficulty = $state("all");
    // [TEMP difficulty-fill cards] — delete together with the difficulty-fill
    // blocks below once real browse-by-difficulty is implemented.
    let selectedDifficultyBrowse = $state(null);

    let isCreateModalOpen = $state(false);
    let isDetailModalOpen = $state(false);
    let selectedQuestionId = $state(null);
    let isDeleteModalOpen = $state(false);
    let deleteLoading = $state(false);
    let deleteTarget = $state(null);
    let deleteMessage = $state("");
    let deleteTitle = $state("");

    const typeConfig = {
        multiple_choice: { label: "Multiple Choice", icon: ListChecks, color: "#6366f1" },
        true_false: { label: "True / False", icon: Check, color: "#3b82f6" },
        coding_challenge: { label: "Coding Challenge", icon: Terminal, color: "#6b7280" },
    };

    const difficultyConfig = {
        all: { label: "All", color: "#6b7280", badge: "bg-gray-100 text-gray-600" },
        easy: { label: "Easy", color: "#10b981", badge: "bg-emerald-50 text-emerald-600" },
        medium: { label: "Medium", color: "#f59e0b", badge: "bg-amber-50 text-amber-600" },
        hard: { label: "Hard", color: "#ef4444", badge: "bg-rose-50 text-rose-600" },
        expert: { label: "Expert", color: "#8b5cf6", badge: "bg-purple-50 text-purple-600" },
    };

    const difficultyTabs = ["all", "easy", "medium", "hard", "expert"];

    // ================================================================
    // [TEMP] Difficulty fill cards — UI fill only, so the landing page
    // still looks balanced when the backend only returns a couple of
    // question types. Real browse-by-difficulty filtering replaces the
    // placeholder workspace below. Delete all [TEMP] blocks to remove.
    // ================================================================
    const difficultyCardConfig = {
        easy: { label: "Easy", icon: Zap, color: "#10b981" },
        medium: { label: "Medium", icon: Flame, color: "#f59e0b" },
        hard: { label: "Hard", icon: Trophy, color: "#ef4444" },
        expert: { label: "Expert", icon: Award, color: "#8b5cf6" },
    };
    const DIFFICULTY_CARDS = ["easy", "medium", "hard", "expert"];

    // Question count per difficulty across the current (searched) list.
    const difficultyBrowseCounts = $derived(() => {
        const counts = { easy: 0, medium: 0, hard: 0, expert: 0 };
        for (const q of filteredQuestions) {
            const d = (q.difficulty || "").toLowerCase();
            if (d in counts) counts[d] += 1;
        }
        return counts;
    });

    const filteredQuestions = $derived(
        searchQuery.trim()
            ? allQuestions.filter((q) =>
                  q.question_text?.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : allQuestions
    );

    // Level 1: group by question_type
    const typeGroups = $derived(() => {
        const groups = new Map();
        for (const q of filteredQuestions) {
            const t = q.question_type || "other";
            if (!groups.has(t)) groups.set(t, []);
            groups.get(t).push(q);
        }
        const ordered = [];
        for (const t of ["multiple_choice", "true_false", "coding_challenge"]) {
            if (groups.has(t)) {
                ordered.push({ type: t, questions: groups.get(t) });
            }
        }
        for (const [t, qs] of groups) {
            if (!["multiple_choice", "true_false", "coding_challenge"].includes(t)) {
                ordered.push({ type: t, questions: qs });
            }
        }
        return ordered;
    });

    // Level 2: questions in selected type, filtered by difficulty tab
    const typeQuestions = $derived(() => {
        if (!selectedType) return [];
        const typeQs = filteredQuestions.filter((q) => (q.question_type || "other") === selectedType);
        if (selectedDifficulty === "all") return typeQs;
        return typeQs.filter((q) => (q.difficulty || "other").toLowerCase() === selectedDifficulty);
    });

    // Difficulty counts for the current type
    const difficultyCounts = $derived(() => {
        if (!selectedType) return {};
        const typeQs = filteredQuestions.filter((q) => (q.question_type || "other") === selectedType);
        const counts = { all: typeQs.length };
        for (const q of typeQs) {
            const d = (q.difficulty || "other").toLowerCase();
            counts[d] = (counts[d] || 0) + 1;
        }
        return counts;
    });

    function getTypeConfig(type) {
        return typeConfig[type] || { label: type?.replace(/_/g, " ") || "Other", icon: HelpCircle, color: "#9ca3af" };
    }

    function getDifficultyConfig(diff) {
        return difficultyConfig[diff] || { label: diff || "Other", color: "#6b7280", badge: "bg-gray-100 text-gray-500" };
    }

    function selectType(type) {
        selectedType = type;
        selectedDifficulty = "all";
        selectedDifficultyBrowse = null;
    }

    // [TEMP difficulty-fill cards] — remove with the difficulty-fill blocks
    function selectDifficultyBrowse(difficulty) {
        selectedDifficultyBrowse = difficulty;
        selectedType = null;
    }

    function goBack() {
        selectedType = null;
        selectedDifficulty = "all";
        selectedDifficultyBrowse = null;
    }

    function openDetailModal(id) {
        selectedQuestionId = id;
        isDetailModalOpen = true;
    }

    function openDeleteModal(e, id) {
        e.stopPropagation();
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
</script>

<div class="space-y-6 max-w-full mx-auto">
    <AdminPageHeader
        title="Questions"
        subtitle={
            loading
                ? null
                : selectedDifficultyBrowse
                  ? `${allQuestions.length} questions — ${difficultyCardConfig[selectedDifficultyBrowse].label} questions`
                  : `${allQuestions.length} questions — ${selectedType ? getTypeConfig(selectedType).label : "click a type to explore"}`
        }
    >
        <button
            class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-6 shadow-none"
            onclick={() => (isCreateModalOpen = true)}
        >
            <Plus size={16} />
            Create
        </button>
    </AdminPageHeader>

    {#if loading}
        <AdminQuestionsSkeleton />
    {:else if allQuestions.length === 0}
        <EmptyState
            icon={HelpCircle}
            title="No questions yet"
            description="Create your first question to get started"
        />
    {:else}
        <!-- Search -->
        <div class="relative">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
                type="text"
                placeholder={selectedType ? `Search ${getTypeConfig(selectedType).label} questions...` : "Search questions..."}
                class="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                bind:value={searchQuery}
            />
            {#if searchQuery}
                <button
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                    onclick={() => (searchQuery = "")}
                >
                    <X size={16} />
                </button>
            {/if}
        </div>

        {#if selectedType === null && selectedDifficultyBrowse === null}
            <!-- ============================================================ -->
            <!-- LEVEL 1: Question Type Cards (Tags-style grid)                -->
            <!-- ============================================================ -->
            <!-- Same large 3-per-row cards as the Job Management category grid -->
            <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {#each typeGroups() as group}
                    {@const cfg = getTypeConfig(group.type)}
                    <button
                        class="group flex min-h-[8.5rem] w-full items-center text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                        onclick={() => selectType(group.type)}
                    >
                        <div class="flex w-full items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                                style="background-color: {cfg.color}"
                            >
                                <cfg.icon size={22} />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-base font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {cfg.label}
                                </h3>
                                <p class="mt-1 text-xs text-gray-400 font-medium">
                                    {group.questions.length} question{group.questions.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </button>
                {/each}

                <!-- [TEMP] Difficulty fill cards (same grid, UI fill only) -->
                {#each DIFFICULTY_CARDS as difficulty}
                    {@const dcfg = difficultyCardConfig[difficulty]}
                    {@const dcount = difficultyBrowseCounts()[difficulty]}
                    <button
                        class="group flex min-h-[8.5rem] w-full items-center text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                        onclick={() => selectDifficultyBrowse(difficulty)}
                    >
                        <div class="flex w-full items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                                style="background-color: {dcfg.color}"
                            >
                                <dcfg.icon size={22} />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-base font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {dcfg.label} Questions
                                </h3>
                                <p class="mt-1 text-xs text-gray-400 font-medium">
                                    {dcount} question{dcount !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>

        {:else if selectedDifficultyBrowse !== null}
            <!-- ============================================================ -->
            <!-- [TEMP] Difficulty workspace placeholder — real browse-by-      -->
            <!-- difficulty filtering replaces this when implemented.           -->
            <!-- ============================================================ -->
            {@const dcfg = difficultyCardConfig[selectedDifficultyBrowse]}
            {@const dcount = difficultyBrowseCounts()[selectedDifficultyBrowse]}

            <div class="space-y-4">
                <!-- Back button + Difficulty header -->
                <div class="flex items-center gap-3">
                    <button
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onclick={goBack}
                    >
                        <ArrowLeft size={20} class="text-gray-500" />
                    </button>
                    <div
                        class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                        style="background-color: {dcfg.color}"
                    >
                        <dcfg.icon size={22} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-lg font-bold text-gray-900">{dcfg.label} Questions</h2>
                        <p class="text-xs text-gray-400">{dcount} question{dcount !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-xl px-6 py-14 text-center">
                    <HelpCircle size={32} class="mx-auto mb-2 opacity-40" />
                    <p class="text-sm text-gray-400">
                        Browse-by-difficulty is coming soon — for now questions are grouped by type.
                    </p>
                    <button
                        class="btn btn-sm bg-purple-600 hover:bg-purple-700 border-none text-white mt-4 shadow-none"
                        onclick={goBack}
                    >
                        Browse all types
                    </button>
                </div>
            </div>

        {:else}
            <!-- ============================================================ -->
            <!-- LEVEL 2: Type Workspace (Back + Tabs + Question Cards)        -->
            <!-- ============================================================ -->
            {@const cfg = getTypeConfig(selectedType)}
            {@const counts = difficultyCounts()}

            <div class="space-y-4">
                <!-- Back button + Type header -->
                <div class="flex items-center gap-3">
                    <button
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onclick={goBack}
                    >
                        <ArrowLeft size={20} class="text-gray-500" />
                    </button>
                    <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style="background-color: {cfg.color}"
                    >
                        <cfg.icon size={18} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-lg font-bold text-gray-900">{cfg.label}</h2>
                        <p class="text-xs text-gray-400">{counts.all || 0} questions</p>
                    </div>
                </div>

                <!-- Difficulty Tabs -->
                <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {#each difficultyTabs as tab}
                        {@const tabCfg = difficultyConfig[tab]}
                        {@const count = counts[tab] || 0}
                        <button
                            class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all
                                {selectedDifficulty === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}"
                            onclick={() => (selectedDifficulty = tab)}
                        >
                            {tabCfg.label}
                            {#if count > 0}
                                <span class="ml-1 text-[10px] opacity-60">({count})</span>
                            {/if}
                        </button>
                    {/each}
                </div>

                <!-- Question Cards Grid -->
                {#if typeQuestions().length === 0}
                    <div class="text-center py-12 text-gray-400">
                        <HelpCircle size={32} class="mx-auto mb-2 opacity-40" />
                        <p class="text-sm">
                            {searchQuery ? `No questions match "${searchQuery}"` : `No ${selectedDifficulty === "all" ? "" : selectedDifficulty} questions in this type`}
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {#each typeQuestions() as q (q.id)}
                            <button
                                class="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                                onclick={() => openDetailModal(q.id)}
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                                        style="background-color: {cfg.color}"
                                    >
                                        <cfg.icon size={18} />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h3 class="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors line-clamp-2">
                                            {q.question_text}
                                        </h3>
                                        <p class="text-[11px] text-gray-400 font-medium">{cfg.label}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                        <Star size={11} class="fill-amber-400 text-amber-400" />
                                        {q.points || 0} pts
                                    </span>
                                    {#if (q.tags || []).length > 0}
                                        {#each q.tags.slice(0, 2) as tag}
                                            <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                                        {/each}
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
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


