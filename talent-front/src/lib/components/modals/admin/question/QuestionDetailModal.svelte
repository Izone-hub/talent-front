<script>
    import { createEventDispatcher, onMount } from "svelte";
    import {
        X,
        HelpCircle,
        Code2,
        CheckSquare,
        Star,
        Clock,
        Tag,
        Lightbulb,
        AlertCircle,
        Edit2,
        Languages,
        Cpu,
        Database,
        Calendar,
        User,
        Save,
        Undo2,
        Check,
        Plus,
        Trash2,
        Search,
    } from "lucide-svelte";
    import DeleteConfirmationModal from "../common/DeleteConfirmationModal.svelte";
    import { questionService } from "$lib/api/questions.service";
    import { tagService } from "$lib/api/tag.service";
    import { showToast } from "$lib/stores/toast";

    export let isOpen = false;
    export let questionId = null;

    const dispatch = createEventDispatcher();

    let question = null;
    let loading = false;
    let isSaving = false;
    let error = null;
    let isEditing = false;
    let editableData = null;

    // Delete state
    let isDeleteModalOpen = false;
    let isDeleting = false;

    // Tag selector state
    let availableTags = [];
    let showTagDropdown = false;
    let tagSearchQuery = "";

    async function loadQuestion() {
        if (!questionId) return;
        loading = true;
        error = null;
        isEditing = false;
        try {
            question = await questionService.getQuestion(questionId);
            editableData = JSON.parse(JSON.stringify(question)); // Deep clone for editing
            loadAvailableTags();
        } catch (err) {
            console.error("Failed to load question details:", err);
            error = "Failed to load question details. Please try again.";
        } finally {
            loading = false;
        }
    }

    async function loadAvailableTags() {
        try {
            availableTags = await tagService.listTags();
        } catch (err) {
            console.error("Failed to load tags:", err);
        }
    }

    $: filteredAvailableTags = availableTags.filter((tag) => {
        const name = (tag.Name || tag.name || "").toLowerCase();
        const existingTags = (editableData?.tags || []).map((t) =>
            t.toLowerCase(),
        );
        return (
            name.includes(tagSearchQuery.toLowerCase()) &&
            !existingTags.includes(name)
        );
    });

    $: if (isOpen && questionId) {
        loadQuestion();
    }

    function close() {
        dispatch("close");
        question = null;
    }

    function handleEdit() {
        isEditing = true;
    }

    function cancelEdit() {
        isEditing = false;
        editableData = JSON.parse(JSON.stringify(question));
    }

    async function saveChanges() {
        if (!editableData.question_text) {
            showToast("Question text is required", "error");
            return;
        }

        isSaving = true;
        try {
            // Prepare data based on type
            let submitData = { ...editableData };
            if (submitData.question_type !== "coding_challenge") {
                delete submitData.coding_details;
            }

            await questionService.updateQuestion(questionId, submitData);
            showToast("Question updated successfully", "success");

            dispatch("updated");
            close();
        } catch (err) {
            console.error("Failed to update question:", err);
            showToast("Failed to update question", "error");
        } finally {
            isSaving = false;
        }
    }

    async function handleDelete() {
        isDeleting = true;
        try {
            await questionService.deleteQuestion(questionId);
            showToast("Question deleted successfully", "success");
            dispatch("updated");
            close();
        } catch (err) {
            showToast("Failed to delete question", "error");
        } finally {
            isDeleting = false;
            isDeleteModalOpen = false;
        }
    }

    // Helper functions for editing
    function addOption() {
        editableData.options = [...(editableData.options || []), ""];
    }

    function removeOption(index) {
        editableData.options = editableData.options.filter(
            (_, i) => i !== index,
        );
    }

    function addTestCase() {
        if (!editableData.coding_details) {
            editableData.coding_details = { test_cases: [] };
        }
        editableData.coding_details.test_cases = [
            ...(editableData.coding_details.test_cases || []),
            { input: "", expected_output: "", is_hidden: false, weight: 1 },
        ];
    }

    function removeTestCase(index) {
        editableData.coding_details.test_cases =
            editableData.coding_details.test_cases.filter(
                (_, i) => i !== index,
            );
    }

    function toggleTagEdit(tagName) {
        const name = tagName.toLowerCase();
        if (!editableData.tags) editableData.tags = [];

        if (editableData.tags.includes(name)) {
            editableData.tags = editableData.tags.filter((t) => t !== name);
        } else {
            editableData.tags = [...editableData.tags, name];
        }
        tagSearchQuery = "";
        showTagDropdown = false;
    }

    function removeTagEdit(tag) {
        editableData.tags = editableData.tags.filter((t) => t !== tag);
    }

    function getDifficultyColor(diff) {
        switch (diff?.toLowerCase()) {
            case "easy":
                return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "medium":
                return "bg-amber-50 text-amber-600 border-amber-100";
            case "hard":
                return "bg-rose-50 text-rose-600 border-rose-100";
            case "expert":
                return "bg-purple-50 text-purple-600 border-purple-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onclick={close}
        ></div>

        <!-- Modal -->
        <div
            class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-20 border border-slate-200/50 transition-all duration-300 scale-100"
        >
            <!-- Header -->
            <div
                class="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30"
            >
                <div class="flex items-center gap-5">
                    <div
                        class="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner shadow-indigo-100/50"
                    >
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h2
                            class="text-2xl font-black text-slate-900 tracking-tight"
                        >
                            Question Details
                        </h2>
                        <div class="flex items-center gap-3 mt-1.5">
                            <span
                                class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"
                            >
                                <Database size={12} />
                                ID:
                                <span
                                    class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono lowercase"
                                    >{questionId?.split("-")[0] || "..."}</span
                                >
                            </span>
                            <span class="w-1 h-1 bg-slate-200 rounded-full"
                            ></span>
                            <span
                                class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"
                            >
                                <Calendar size={12} />
                                Created: {question
                                    ? formatDate(question.created_at)
                                    : "..."}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    {#if isEditing}
                        <button
                            onclick={cancelEdit}
                            class="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2 px-4 shadow-sm"
                            disabled={isSaving}
                        >
                            <Undo2 size={18} />
                            <span class="text-sm font-bold">Cancel</span>
                        </button>
                        <button
                            onclick={saveChanges}
                            class="p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-2 px-6 shadow-lg shadow-emerald-100"
                            disabled={isSaving}
                        >
                            {#if isSaving}
                                <span class="loading loading-spinner loading-xs"
                                ></span>
                            {:else}
                                <Save size={18} />
                            {/if}
                            <span class="text-sm font-bold"
                                >{isSaving ? "Saving..." : "Save Changes"}</span
                            >
                        </button>
                    {:else}
                        <button
                            onclick={handleEdit}
                            class="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-2 px-4"
                        >
                            <Edit2 size={18} />
                            <span class="text-sm font-bold">Edit</span>
                        </button>
                        <button
                            onclick={() => (isDeleteModalOpen = true)}
                            class="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onclick={close}
                            class="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    {/if}
                </div>
            </div>

            <!-- Body -->
            <div
                class="flex-1 overflow-y-auto p-10 bg-slate-50/20 custom-scrollbar"
            >
                {#if loading}
                    <div
                        class="flex flex-col items-center justify-center py-32 gap-6"
                    >
                        <div class="relative w-16 h-16">
                            <div
                                class="absolute inset-0 border-4 border-indigo-100 rounded-full"
                            ></div>
                            <div
                                class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
                            ></div>
                        </div>
                        <p
                            class="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse"
                        >
                            Loading intelligence...
                        </p>
                    </div>
                {:else if error}
                    <div
                        class="flex flex-col items-center justify-center py-32 text-center space-y-6"
                    >
                        <div class="p-6 bg-rose-50 text-rose-500 rounded-3xl">
                            <AlertCircle size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-slate-900">
                                Oops! Something went wrong
                            </h3>
                            <p
                                class="text-slate-500 mt-2 max-w-sm mx-auto font-medium"
                            >
                                {error}
                            </p>
                        </div>
                        <button
                            onclick={loadQuestion}
                            class="btn btn-primary bg-indigo-600 border-none rounded-xl px-10 font-bold"
                            >Try Again</button
                        >
                    </div>
                {:else if question}
                    <div class="space-y-12">
                        <!-- Main Content -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <!-- Left: Question & Meta -->
                            <div class="lg:col-span-2 space-y-10">
                                <!-- Question Text -->
                                <section class="space-y-4">
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <h3
                                            class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"
                                        >
                                            The Challenge
                                        </h3>
                                        {#if isEditing}
                                            <select
                                                bind:value={
                                                    editableData.difficulty
                                                }
                                                class="select select-bordered select-xs rounded-lg font-bold uppercase tracking-wider {getDifficultyColor(
                                                    editableData.difficulty,
                                                )} border"
                                            >
                                                <option value="easy"
                                                    >Easy</option
                                                >
                                                <option value="medium"
                                                    >Medium</option
                                                >
                                                <option value="hard"
                                                    >Hard</option
                                                >
                                                <option value="expert"
                                                    >Expert</option
                                                >
                                            </select>
                                        {:else}
                                            <span
                                                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider {getDifficultyColor(
                                                    question.difficulty,
                                                )} border"
                                            >
                                                {question.difficulty}
                                            </span>
                                        {/if}
                                    </div>
                                    <div
                                        class="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative"
                                    >
                                        {#if isEditing}
                                            <textarea
                                                bind:value={
                                                    editableData.question_text
                                                }
                                                class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-2xl p-4 text-xl font-bold text-slate-900 leading-relaxed resize-none min-h-[120px]"
                                                placeholder="Enter question text..."
                                            ></textarea>
                                        {:else}
                                            <p
                                                class="text-xl font-bold text-slate-900 leading-relaxed italic"
                                            >
                                                "{question.question_text}"
                                            </p>
                                        {/if}
                                    </div>
                                </section>

                                <!-- Answer Content -->
                                <section class="space-y-4">
                                    <h3
                                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"
                                    >
                                        Logic & Structure
                                    </h3>
                                    <div
                                        class="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm"
                                    >
                                        <!-- Question Type Header -->
                                        <div
                                            class="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"
                                                >
                                                    {#if (isEditing ? editableData : question).question_type === "coding_challenge"}
                                                        <Code2 size={16} />
                                                    {:else}
                                                        <CheckSquare
                                                            size={16}
                                                        />
                                                    {/if}
                                                </div>
                                                {#if isEditing}
                                                    <select
                                                        bind:value={
                                                            editableData.question_type
                                                        }
                                                        class="select select-ghost select-sm font-black text-slate-700 capitalize p-0 focus:bg-transparent"
                                                    >
                                                        <option
                                                            value="multiple_choice"
                                                            >Multiple Choice</option
                                                        >
                                                        <option
                                                            value="multiple_select"
                                                            >Multiple Select</option
                                                        >
                                                        <option
                                                            value="true_false"
                                                            >True / False</option
                                                        >
                                                        <option
                                                            value="coding_challenge"
                                                            >Coding Challenge</option
                                                        >
                                                    </select>
                                                {:else}
                                                    <span
                                                        class="text-sm font-black text-slate-700 capitalize"
                                                    >
                                                        {question.question_type?.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                {/if}
                                            </div>
                                            <div
                                                class="flex items-center gap-4 text-xs font-bold text-slate-400"
                                            >
                                                <span
                                                    class="flex items-center gap-1.5"
                                                >
                                                    <Star
                                                        size={14}
                                                        class="text-amber-400"
                                                    />
                                                    {#if isEditing}
                                                        <input
                                                            type="number"
                                                            bind:value={
                                                                editableData.points
                                                            }
                                                            class="w-12 bg-transparent border-b border-slate-200 focus:border-indigo-500 font-black text-slate-700 outline-none text-center"
                                                        />
                                                    {:else}
                                                        {question.points || 0}
                                                    {/if}
                                                    Points
                                                </span>
                                                <span
                                                    class="w-1 h-1 bg-slate-300 rounded-full"
                                                ></span>
                                                <span
                                                    class="flex items-center gap-1.5"
                                                >
                                                    <Clock
                                                        size={14}
                                                        class="text-indigo-400"
                                                    />
                                                    {#if isEditing}
                                                        <input
                                                            type="number"
                                                            bind:value={
                                                                editableData.time_limit_seconds
                                                            }
                                                            class="w-12 bg-transparent border-b border-slate-200 focus:border-indigo-500 font-black text-slate-700 outline-none text-center"
                                                        />
                                                    {:else}
                                                        {question.time_limit_seconds ||
                                                            0}
                                                    {/if}
                                                    s
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Options / Details -->
                                        <div class="p-8 space-y-6">
                                            {#if (isEditing ? editableData : question).question_type === "coding_challenge"}
                                                <div class="space-y-4">
                                                    <div
                                                        class="flex items-center justify-between px-2"
                                                    >
                                                        <span
                                                            class="text-sm font-bold text-slate-900 flex items-center gap-2"
                                                        >
                                                            <Languages
                                                                size={18}
                                                                class="text-indigo-500"
                                                            />
                                                            Base Template
                                                        </span>
                                                        {#if isEditing}
                                                            <select
                                                                bind:value={
                                                                    editableData
                                                                        .coding_details
                                                                        .language
                                                                }
                                                                class="select select-bordered select-xs rounded font-black uppercase"
                                                            >
                                                                <option
                                                                    value="javascript"
                                                                    >JavaScript</option
                                                                >
                                                                <option
                                                                    value="python"
                                                                    >Python</option
                                                                >
                                                                <option
                                                                    value="golang"
                                                                    >Go</option
                                                                >
                                                                <option
                                                                    value="java"
                                                                    >Java</option
                                                                >
                                                            </select>
                                                        {:else}
                                                            <span
                                                                class="badge badge-sm font-black bg-slate-900 text-white border-none uppercase tracking-widest px-3 py-2.5"
                                                            >
                                                                {question
                                                                    .coding_details
                                                                    ?.language ||
                                                                    "N/A"}
                                                            </span>
                                                        {/if}
                                                    </div>
                                                    <div
                                                        class="bg-slate-900 rounded-2xl p-6 font-mono text-sm border border-slate-800 shadow-inner"
                                                    >
                                                        {#if isEditing}
                                                            <textarea
                                                                bind:value={
                                                                    editableData
                                                                        .coding_details
                                                                        .code_template
                                                                }
                                                                class="w-full bg-transparent border-none focus:ring-0 text-indigo-200 outline-none min-h-[200px]"
                                                                placeholder="// Enter code template..."
                                                            ></textarea>
                                                        {:else}
                                                            <pre
                                                                class="text-indigo-200"><code
                                                                    >{question
                                                                        .coding_details
                                                                        ?.code_template ||
                                                                        "// No template defined"}</code
                                                                ></pre>
                                                        {/if}
                                                    </div>
                                                    <div
                                                        class="grid grid-cols-2 gap-4"
                                                    >
                                                        <div
                                                            class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                                                        >
                                                            <span
                                                                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                                                >Timeout</span
                                                            >
                                                            {#if isEditing}
                                                                <input
                                                                    type="number"
                                                                    bind:value={
                                                                        editableData
                                                                            .coding_details
                                                                            .execution_time_limit
                                                                    }
                                                                    class="w-20 bg-white border border-slate-200 rounded px-2 font-black text-xs h-7 outline-none focus:border-indigo-500"
                                                                />
                                                            {:else}
                                                                <span
                                                                    class="text-xs font-black text-slate-700"
                                                                    >{question
                                                                        .coding_details
                                                                        ?.execution_time_limit}ms</span
                                                                >
                                                            {/if}
                                                        </div>
                                                        <div
                                                            class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                                                        >
                                                            <span
                                                                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                                                >Memory</span
                                                            >
                                                            {#if isEditing}
                                                                <input
                                                                    type="number"
                                                                    bind:value={
                                                                        editableData
                                                                            .coding_details
                                                                            .memory_limit
                                                                    }
                                                                    class="w-20 bg-white border border-slate-200 rounded px-2 font-black text-xs h-7 outline-none focus:border-indigo-500"
                                                                />
                                                            {:else}
                                                                <span
                                                                    class="text-xs font-black text-slate-700"
                                                                    >{question
                                                                        .coding_details
                                                                        ?.memory_limit}MB</span
                                                                >
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            {:else}
                                                <div
                                                    class="grid grid-cols-1 gap-3"
                                                >
                                                    {#if isEditing}
                                                        <div
                                                            class="flex items-center justify-between mb-2"
                                                        >
                                                            <span
                                                                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                                                >Configure
                                                                Options</span
                                                            >
                                                            <button
                                                                onclick={addOption}
                                                                class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                            >
                                                                <Plus
                                                                    size={14}
                                                                /> Add Option
                                                            </button>
                                                        </div>
                                                    {/if}

                                                    {#each isEditing ? editableData.options || [] : question.options || [] as option, i}
                                                        <div
                                                            class="flex items-center gap-4 p-5 rounded-2xl border transition-all {(isEditing
                                                                ? editableData
                                                                : question
                                                            ).correct_answer ===
                                                            option
                                                                ? 'bg-emerald-50 border-emerald-100 shadow-sm'
                                                                : 'bg-white border-slate-100'}"
                                                            class:opacity-60={!isEditing &&
                                                                question.correct_answer !==
                                                                    option}
                                                        >
                                                            {#if isEditing}
                                                                <input
                                                                    type="radio"
                                                                    name="correct"
                                                                    value={option}
                                                                    bind:group={
                                                                        editableData.correct_answer
                                                                    }
                                                                    class="radio radio-primary radio-sm"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    bind:value={
                                                                        editableData
                                                                            .options[
                                                                            i
                                                                        ]
                                                                    }
                                                                    class="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1"
                                                                    placeholder="Option {i +
                                                                        1}"
                                                                />
                                                                {#if editableData.options.length > 1}
                                                                    <button
                                                                        onclick={() =>
                                                                            removeOption(
                                                                                i,
                                                                            )}
                                                                        class="text-slate-300 hover:text-rose-500 transition-colors"
                                                                    >
                                                                        <Trash2
                                                                            size={16}
                                                                        />
                                                                    </button>
                                                                {/if}
                                                            {:else}
                                                                <div
                                                                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black {question.correct_answer ===
                                                                    option
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : 'bg-slate-100 text-slate-400'}"
                                                                >
                                                                    {String.fromCharCode(
                                                                        65 + i,
                                                                    )}
                                                                </div>
                                                                <span
                                                                    class="text-sm font-bold {question.correct_answer ===
                                                                    option
                                                                        ? 'text-emerald-900'
                                                                        : 'text-slate-600'} flex-1"
                                                                >
                                                                    {option}
                                                                </span>
                                                                {#if question.correct_answer === option}
                                                                    <span
                                                                        class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-white px-2 py-1 rounded-md border border-emerald-100"
                                                                        >Correct
                                                                        solution</span
                                                                    >
                                                                {/if}
                                                            {/if}
                                                        </div>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </section>

                                <!-- Explanation -->
                                <section class="space-y-4">
                                    <h3
                                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"
                                    >
                                        Solution Insight
                                    </h3>
                                    <div
                                        class="p-8 bg-amber-50/30 rounded-[2rem] border border-amber-100/50 relative overflow-hidden"
                                    >
                                        <div
                                            class="absolute -right-4 -bottom-4 opacity-5 text-amber-900"
                                        >
                                            <Lightbulb size={120} />
                                        </div>
                                        <div class="flex gap-5 relative z-10">
                                            <div
                                                class="p-3 bg-amber-400/20 text-amber-600 rounded-2xl h-fit"
                                            >
                                                <Lightbulb size={24} />
                                            </div>
                                            <div class="space-y-2 flex-1">
                                                {#if isEditing}
                                                    <textarea
                                                        bind:value={
                                                            editableData.explanation
                                                        }
                                                        class="w-full bg-white/50 border-none focus:ring-2 focus:ring-amber-500 rounded-xl p-4 text-sm font-medium text-amber-900/80 leading-relaxed resize-none min-h-[100px]"
                                                        placeholder="Explain the solution..."
                                                    ></textarea>
                                                {:else}
                                                    <p
                                                        class="text-sm font-medium text-amber-900/80 leading-relaxed"
                                                    >
                                                        {question.explanation ||
                                                            "No explanation provided."}
                                                    </p>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <!-- Right: Metadata & Stats -->
                            <div class="space-y-10">
                                <!-- Tags -->
                                <section class="space-y-5">
                                    <h3
                                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2"
                                    >
                                        Classification
                                    </h3>
                                    <div
                                        class="p-6 bg-slate-100/50 rounded-[2rem] space-y-4"
                                    >
                                        <div class="flex flex-wrap gap-2.5">
                                            {#each isEditing ? editableData.tags || [] : question.tags || [] as tag}
                                                <span
                                                    class="px-4 py-2 bg-white/70 backdrop-blur-md rounded-xl text-xs font-black text-slate-600 border border-slate-200/50 shadow-sm flex items-center gap-2"
                                                >
                                                    #{tag}
                                                    {#if isEditing}
                                                        <button
                                                            onclick={() =>
                                                                removeTagEdit(
                                                                    tag,
                                                                )}
                                                            class="hover:text-rose-500"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    {/if}
                                                </span>
                                            {/each}
                                        </div>

                                        {#if isEditing}
                                            <div class="relative">
                                                <div
                                                    class="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 focus-within:border-indigo-500 transition-all"
                                                >
                                                    <Search
                                                        size={14}
                                                        class="text-slate-400 ml-1"
                                                    />
                                                    <input
                                                        type="text"
                                                        bind:value={
                                                            tagSearchQuery
                                                        }
                                                        onfocus={() =>
                                                            (showTagDropdown = true)}
                                                        placeholder="Add tags..."
                                                        class="bg-transparent border-none focus:ring-0 text-xs w-full py-1"
                                                    />
                                                </div>

                                                {#if showTagDropdown}
                                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                    <div
                                                        class="fixed inset-0 z-20"
                                                        onclick={() =>
                                                            (showTagDropdown = false)}
                                                    ></div>
                                                    <div
                                                        class="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto custom-scrollbar"
                                                    >
                                                        {#each filteredAvailableTags as tag}
                                                            <button
                                                                type="button"
                                                                onclick={() =>
                                                                    toggleTagEdit(
                                                                        tag.Name ||
                                                                            tag.name,
                                                                    )}
                                                                class="w-full text-left px-3 py-2 hover:bg-slate-50 text-[11px] font-bold text-slate-600 flex items-center justify-between"
                                                            >
                                                                <span
                                                                    >{tag.Name ||
                                                                        tag.name}</span
                                                                >
                                                                <Plus
                                                                    size={12}
                                                                />
                                                            </button>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                </section>

                                <!-- Audit Trail -->
                                <section class="space-y-5">
                                    <h3
                                        class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2"
                                    >
                                        Intelligence Meta
                                    </h3>
                                    <div
                                        class="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm"
                                    >
                                        <div
                                            class="p-6 flex items-center justify-between"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100"
                                                >
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p
                                                        class="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                                                    >
                                                        Created By
                                                    </p>
                                                    <p
                                                        class="text-xs font-bold text-slate-700"
                                                    >
                                                        Admin User
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            class="p-6 flex items-center justify-between"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100"
                                                >
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p
                                                        class="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                                                    >
                                                        Modified
                                                    </p>
                                                    <p
                                                        class="text-xs font-bold text-slate-700"
                                                    >
                                                        {formatDate(
                                                            question.updated_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer Action -->
            <div
                class="px-10 py-8 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-end gap-4 sticky bottom-0 z-30"
            >
                <button
                    onclick={close}
                    class="px-10 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                    Close Portal
                </button>
            </div>
        </div>
    </div>
{/if}

<DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    title="Delete Question"
    message="Are you sure you want to delete this question? This action cannot be undone."
    loading={isDeleting}
    on:close={() => (isDeleteModalOpen = false)}
    on:confirm={handleDelete}
/>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .shadow-glow {
        box-shadow: 0 0 10px currentColor;
    }
</style>
