<script>
    import { onMount } from "svelte";
    import { questionService } from "$lib/api/questions.service";
    import {
        Plus,
        Search,
        Filter,
        FileDown,
        Eye,
        Edit2,
        Trash2,
        Star,
        Clock,
        Users,
        ChevronLeft,
        ChevronRight,
        AlertCircle,
        HelpCircle,
        Code2,
        CheckSquare,
        ToggleLeft,
    } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";
    import SkeletonTable from "$lib/components/ui/SkeletonTable.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import CreateQuestionModal from "$lib/components/modals/admin/question/CreateQuestionModal.svelte";
    import QuestionDetailModal from "$lib/components/modals/admin/question/QuestionDetailModal.svelte";
    import DeleteConfirmationModal from "$lib/components/modals/admin/common/DeleteConfirmationModal.svelte";

    let questions = [];
    let loading = true;
    let isCreateModalOpen = false;
    let isDetailModalOpen = false;
    let selectedQuestionId = null;
    let searchQuery = "";
    let selectedIds = new Set();
    let filterType = "All Types";
    let filterDifficulty = "All Difficulties";
    let filterStatus = "Active";
    let isEditing = false;
    let editableData = null;
    let sortBy = "Newest first";

    // Delete confirmation state
    let isDeleteModalOpen = false;
    let deleteLoading = false;
    let deleteTarget = null; // { type: 'single' | 'bulk', id?: string }
    let deleteMessage = "";
    let deleteTitle = "";

    onMount(async () => {
        await loadQuestions();
    });

    async function loadQuestions() {
        loading = true;
        try {
            questions = await questionService.listQuestions();
        } catch (error) {
            showToast("Failed to load questions", "error");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleCreateQuestion(event) {
        const questionData = event.detail;
        try {
            await questionService.createQuestion(questionData);
            showToast("Question created successfully", "success");
            isCreateModalOpen = false;
            await loadQuestions();
        } catch (error) {
            showToast("Failed to create question", "error");
        }
    }

    function toggleSelectAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(questions.map((q) => q.id));
        } else {
            selectedIds = new Set();
        }
    }

    async function toggleSelect(id) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
        selectedIds = selectedIds; // Trigger reactivity
    }

    function openDeleteModal(id) {
        deleteTarget = { type: "single", id };
        deleteTitle = "Delete Question";
        deleteMessage =
            "Are you sure you want to delete this question? This will remove it permanently from the question bank.";
        isDeleteModalOpen = true;
    }

    function openBulkDeleteModal() {
        deleteTarget = { type: "bulk" };
        deleteTitle = "Bulk Delete Questions";
        deleteMessage = `Are you sure you want to delete ${selectedIds.size} questions? This action cannot be undone.`;
        isDeleteModalOpen = true;
    }

    async function handleConfirmDelete() {
        deleteLoading = true;
        try {
            if (deleteTarget.type === "single") {
                await questionService.deleteQuestion(deleteTarget.id);
                showToast("Question deleted successfully", "success");
            } else {
                let successCount = 0;
                let failCount = 0;

                for (const id of selectedIds) {
                    try {
                        await questionService.deleteQuestion(id);
                        successCount++;
                    } catch (error) {
                        failCount++;
                    }
                }

                if (successCount > 0) {
                    showToast(
                        `Successfully deleted ${successCount} questions`,
                        "success",
                    );
                    selectedIds = new Set();
                }
                if (failCount > 0) {
                    showToast(
                        `Failed to delete ${failCount} questions`,
                        "error",
                    );
                }
            }
            await loadQuestions();
            isDeleteModalOpen = false;
        } catch (error) {
            showToast("Failed to delete question", "error");
        } finally {
            deleteLoading = false;
        }
    }

    function openDetailModal(id) {
        selectedQuestionId = id;
        isDetailModalOpen = true;
    }

    function getTypeIcon(type) {
        switch (type?.toLowerCase()) {
            case "multiple_choice":
                return HelpCircle;
            case "true_false":
                return ToggleLeft;
            case "coding_challenge":
                return Code2;
            case "multiple_select":
                return CheckSquare;
            default:
                return HelpCircle;
        }
    }

    function getTypeColors(type) {
        switch (type?.toLowerCase()) {
            case "multiple_choice":
                return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case "true_false":
                return "bg-blue-50 text-blue-600 border-blue-100";
            case "coding_challenge":
                return "bg-slate-900 text-slate-100 border-slate-800";
            case "multiple_select":
                return "bg-purple-50 text-purple-600 border-purple-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    }

    function getDifficultyColors(diff) {
        switch (diff?.toLowerCase()) {
            case "easy":
                return "text-emerald-500";
            case "medium":
                return "text-amber-500";
            case "hard":
                return "text-rose-500";
            case "expert":
                return "text-purple-600";
            default:
                return "text-gray-500";
        }
    }

    $: filteredQuestions = questions.filter((q) => {
        const matchesSearch =
            q.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.id?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    $: allSelected =
        questions.length > 0 && selectedIds.size === questions.length;
</script>

<div class=" max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
                    Question Bank
                </h1>
                <span
                    class="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ring-indigo-700/10"
                >
                    {questions.length} Questions
                </span>
            </div>
            <p class="text-gray-500 mt-1 text-sm">
                Browse, filter, and manage all questions in your question bank.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <button
                class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-6 shadow-none"
                onclick={() => (isCreateModalOpen = true)}
            >
                <Plus size={18} />
                Create Question
            </button>
        </div>
    </div>

    <!-- Filters & Search -->
    <div
        class="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]"
    >
        <div class="relative flex-1 group">
            <Search
                class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                size={19}
            />
            <input
                type="text"
                placeholder="Search questions..."
                class="w-full pl-12 pr-4 py-3 bg-transparent text-[15px] font-medium focus:outline-none placeholder:text-gray-400 transition-all"
                bind:value={searchQuery}
            />
        </div>

        <div class="hidden lg:block h-8 w-px bg-gray-100 mx-2"></div>

        <div class="flex flex-wrap items-center gap-2 p-1">
            <button
                class="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all"
            >
                <HelpCircle size={17} class="text-gray-400" />
                {filterType}
                <ChevronLeft
                    size={16}
                    class="-rotate-90 text-gray-400 opacity-60"
                />
            </button>
            <button
                class="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all"
            >
                <Filter size={17} class="text-gray-400" />
                {filterDifficulty}
                <ChevronLeft
                    size={16}
                    class="-rotate-90 text-gray-400 opacity-60"
                />
            </button>
            <button
                class="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all"
            >
                <Users size={17} class="text-gray-400" />
                {filterStatus}
                <ChevronLeft
                    size={16}
                    class="-rotate-90 text-gray-400 opacity-60"
                />
            </button>

            <div class="h-6 w-px bg-gray-100 mx-1 hidden xl:block"></div>

            <button
                class="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all"
            >
                <Clock size={17} class="text-gray-400" />
                {sortBy}
                <ChevronLeft
                    size={16}
                    class="-rotate-90 text-gray-400 opacity-60"
                />
            </button>
        </div>
    </div>

    <!-- Table -->
    {#if loading}
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <SkeletonTable rows={5} cols={8} />
    </div>
    {:else if filteredQuestions.length === 0}
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <EmptyState
            icon={HelpCircle}
            title="No questions found"
            description={searchQuery
                ? "We couldn't find any questions matching your search criteria."
                : "Your question bank is empty. Start by creating your first question."}
        />
    </div>
    {:else}
    <div
        class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[calc(100vh-200px)] overflow-y-auto"
    >
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr
                        class="bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100"
                    >
                        <th class="pl-6 py-4 w-12">
                            <input
                                type="checkbox"
                                class="checkbox checkbox-xs border-gray-300 focus:ring-indigo-500 rounded text-indigo-600"
                                checked={allSelected}
                                onchange={toggleSelectAll}
                            />
                        </th>
                        <th class="px-4 py-4 min-w-[300px]">Question</th>
                        <th class="px-4 py-4">Type</th>
                        <th class="px-4 py-4">Difficulty</th>
                        <th class="px-4 py-4">Points</th>
                        <th class="px-4 py-4">Time Limit</th>
                        <th class="px-4 py-4">Usage</th>
                        <th class="px-4 py-4">Status</th>
                        <th class="pr-6 py-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    {#each filteredQuestions as q}
                            {@const TypeIcon = getTypeIcon(q.question_type)}
                            <tr
                                class="hover:bg-gray-50/30 transition-colors group"
                                class:bg-indigo-50={selectedIds.has(q.id)}
                            >
                                <td class="pl-6 py-5">
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-xs border-gray-300 focus:ring-indigo-500 rounded text-indigo-600"
                                        checked={selectedIds.has(q.id)}
                                        onchange={() => toggleSelect(q.id)}
                                    />
                                </td>
                                <td class="px-4 py-5">
                                    <div class="flex items-start gap-3">
                                        <div
                                            class="w-9 h-9 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"
                                        >
                                            <TypeIcon size={18} />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <span
                                                class="text-[13.5px] font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug"
                                            >
                                                {q.question_text}
                                            </span>
                                            <div
                                                class="flex items-center gap-2 flex-wrap"
                                            >
                                                <span
                                                    class="text-[10px] text-gray-400 font-mono"
                                                    ># {q.id?.substring(
                                                        0,
                                                        8,
                                                    )}</span
                                                >
                                                {#each q.tags || [] as tag}
                                                    <span
                                                        class="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] uppercase font-bold tracking-wider"
                                                        >{tag}</span
                                                    >
                                                {/each}
                                                {#if q.warning}
                                                    <span
                                                        class="flex items-center gap-1 text-[9px] text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider"
                                                    >
                                                        <AlertCircle
                                                            size={10}
                                                        />
                                                        {q.warning}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-5">
                                    <span
                                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border {getTypeColors(
                                            q.question_type,
                                        )}"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                                        ></span>
                                        {q.question_type?.replace("_", " ")}
                                    </span>
                                </td>
                                <td class="px-4 py-5">
                                    <div
                                        class="flex items-center gap-2 text-sm font-semibold {getDifficultyColors(
                                            q.difficulty,
                                        )}"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 rounded-full bg-current"
                                        ></span>
                                        {q.difficulty}
                                    </div>
                                </td>
                                <td
                                    class="px-4 py-5 font-bold text-gray-700 text-sm"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <Star
                                            size={16}
                                            class="text-amber-400 fill-amber-400"
                                        />
                                        {q.points || 0}
                                    </div>
                                </td>
                                <td
                                    class="px-4 py-5 text-gray-500 text-sm font-medium"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <Clock size={15} class="opacity-40" />
                                        {q.time_limit_seconds || 0}s
                                    </div>
                                </td>
                                <td
                                    class="px-4 py-5 text-gray-500 text-sm font-medium"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <Users size={15} class="opacity-40" />
                                        {q.usage_count || 0}
                                    </div>
                                </td>
                                <td class="px-4 py-5">
                                    <span
                                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                        ></span>
                                        Active
                                    </span>
                                </td>
                                <td class="pr-6 py-5">
                                    <div
                                        class="flex items-center justify-center gap-2"
                                    >
                                        <button
                                            class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="View details"
                                            onclick={() =>
                                                openDetailModal(q.id)}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete question"
                                            onclick={() =>
                                                openDeleteModal(q.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                </tbody>
            </table>
        </div>

        <!-- Pagination & Selected Items footer -->
        <div
            class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between"
        >
            <div class="flex items-center gap-4">
                <span class="text-xs font-medium text-gray-400">
                    Showing {filteredQuestions.length} of {questions.length} questions
                </span>

                {#if selectedIds.size > 0}
                    <div
                        class="flex items-center gap-2 pl-4 border-l border-gray-200"
                    >
                        <span
                            class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold"
                        >
                            {selectedIds.size} selected
                        </span>
                        <button
                            class="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 transition-colors uppercase tracking-wider"
                            onclick={openBulkDeleteModal}
                        >
                            Delete selected
                        </button>
                    </div>
                {/if}
            </div>

            <div class="flex items-center gap-2">
                <button
                    class="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-400 transition-colors"
                    disabled
                >
                    <ChevronLeft size={18} />
                </button>
                <div class="flex items-center gap-1">
                    <button
                        class="w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                    >
                        1
                    </button>
                </div>
                <button
                    class="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-400 transition-colors"
                    disabled
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
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
    on:close={() => {
        isDetailModalOpen = false;
        selectedQuestionId = null;
    }}
    on:updated={() => {
        loadQuestions();
    }}
/>

<DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    title={deleteTitle}
    message={deleteMessage}
    loading={deleteLoading}
    on:close={() => (isDeleteModalOpen = false)}
    on:confirm={handleConfirmDelete}
/>

<style>
    :global(.checkbox) {
        border-width: 2px;
    }
    :global(.btn) {
        text-transform: none;
        letter-spacing: normal;
    }
</style>
