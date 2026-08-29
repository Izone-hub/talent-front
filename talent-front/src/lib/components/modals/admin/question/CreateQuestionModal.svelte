<script>
    import { createEventDispatcher } from "svelte";
    import {
        X,
        Plus,
        Trash2,
        HelpCircle,
        Code2,
        CheckSquare,
        ToggleLeft,
        Star,
        Clock,
        Tag,
        Lightbulb,
        AlertCircle,
        Search,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { tagService } from "$lib/api/tag.service";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let questionData = {
        question_text: "",
        question_type: "multiple_choice",
        difficulty: "Easy",
        options: [""],
        correct_answer: "",
        explanation: "",
        time_limit_seconds: 60,
        points: 5,
        tags: [],
        coding_details: {
            language: "javascript",
            code_template: "",
            test_cases: [
                { input: "", expected_output: "", is_hidden: false, weight: 1 },
            ],
            execution_time_limit: 2000,
            memory_limit: 128,
        },
    };

    let newTag = "";
    let availableTags = [];
    let showTagDropdown = false;
    let tagSearchQuery = "";

    onMount(async () => {
        try {
            availableTags = await tagService.listTags();
        } catch (error) {
            console.error("Failed to load tags:", error);
        }
    });

    $: filteredAvailableTags = availableTags.filter((tag) => {
        const name = (tag.Name || tag.name || "").toLowerCase();
        return (
            name.includes(tagSearchQuery.toLowerCase()) &&
            !questionData.tags.includes(name)
        );
    });

    function close() {
        dispatch("close");
    }

    function handleSubmit() {
        // Validation logic
        if (!questionData.question_text) return;

        // Prepare data based on type
        let submitData = { ...questionData };

        if (questionData.question_type !== "coding_challenge") {
            delete submitData.coding_details;
        }

        if (questionData.question_type === "true_false") {
            submitData.options = ["True", "False"];
        }

        dispatch("submit", submitData);
    }

    function addOption() {
        questionData.options = [...questionData.options, ""];
    }

    function removeOption(index) {
        questionData.options = questionData.options.filter(
            (_, i) => i !== index,
        );
    }

    function addTestCase() {
        questionData.coding_details.test_cases = [
            ...questionData.coding_details.test_cases,
            { input: "", expected_output: "", is_hidden: false, weight: 1 },
        ];
    }

    function removeTestCase(index) {
        questionData.coding_details.test_cases =
            questionData.coding_details.test_cases.filter(
                (_, i) => i !== index,
            );
    }

    function toggleTag(tagName) {
        const name = tagName.toLowerCase();
        if (questionData.tags.includes(name)) {
            questionData.tags = questionData.tags.filter((t) => t !== name);
        } else {
            questionData.tags = [...questionData.tags, name];
        }
        tagSearchQuery = "";
        showTagDropdown = false;
    }

    function removeTag(tag) {
        questionData.tags = questionData.tags.filter((t) => t !== tag);
    }

    // Reset when changing type
    $: if (questionData.question_type) {
        if (questionData.question_type === "true_false") {
            questionData.correct_answer = "True";
        }
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onclick={close}
        ></div>

        <!-- Modal -->
        <div
            class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 border border-slate-200"
        >
            <!-- Header -->
            <div
                class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20"
            >
                <div>
                    <h2 class="text-xl font-bold text-slate-900 tracking-tight">
                        Create New Question
                    </h2>
                    <p class="text-slate-500 text-sm mt-0.5 font-medium">
                        Add a new challenge to your question bank
                    </p>
                </div>
                <button
                    onclick={close}
                    class="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div
                class="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar"
            >
                <div class="space-y-8">
                    <!-- Base Info -->
                    <section class="space-y-4">
                        <div class="flex items-center gap-2 mb-2">
                            <div
                                class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"
                            >
                                <HelpCircle size={18} />
                            </div>
                            <h3
                                class="text-sm font-bold text-slate-700 uppercase tracking-wider"
                            >
                                Basic Information
                            </h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label
                                    for="question_text"
                                    class="block text-sm font-semibold text-slate-700 mb-2"
                                    >Question Text</label
                                >
                                <textarea
                                    id="question_text"
                                    bind:value={questionData.question_text}
                                    class="textarea textarea-bordered w-full h-24 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl resize-none font-medium leading-relaxed"
                                    placeholder="e.g., What is the time complexity of binary search?"
                                ></textarea>
                            </div>

                            <div>
                                <label
                                    for="type"
                                    class="block text-sm font-semibold text-slate-700 mb-2"
                                    >Question Type</label
                                >
                                <select
                                    id="type"
                                    bind:value={questionData.question_type}
                                    class="select select-bordered w-full bg-white border-slate-200 focus:border-indigo-500 rounded-xl font-medium"
                                >
                                    <option value="multiple_choice"
                                        >Multiple Choice</option
                                    >
                                    <option value="multiple_select"
                                        >Multiple Select</option
                                    >
                                    <option value="true_false"
                                        >True / False</option
                                    >
                                    <option value="coding_challenge"
                                        >Coding Challenge</option
                                    >
                                </select>
                            </div>

                            <div>
                                <label
                                    for="difficulty"
                                    class="block text-sm font-semibold text-slate-700 mb-2"
                                    >Difficulty</label
                                >
                                <select
                                    id="difficulty"
                                    bind:value={questionData.difficulty}
                                    class="select select-bordered w-full bg-white border-slate-200 focus:border-indigo-500 rounded-xl font-medium"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    for="points"
                                    class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"
                                >
                                    <Star size={14} class="text-amber-400" />
                                    Points
                                </label>
                                <input
                                    type="number"
                                    id="points"
                                    bind:value={questionData.points}
                                    class="input input-bordered w-full bg-white border-slate-200 focus:border-indigo-500 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label
                                    for="time"
                                    class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"
                                >
                                    <Clock size={14} class="text-indigo-400" />
                                    Time Limit (seconds)
                                </label>
                                <input
                                    type="number"
                                    id="time"
                                    bind:value={questionData.time_limit_seconds}
                                    class="input input-bordered w-full bg-white border-slate-200 focus:border-indigo-500 rounded-xl font-medium"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Answer Configuration -->
                    <section class="space-y-4">
                        <div class="flex items-center gap-2 mb-2">
                            <div
                                class="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"
                            >
                                <CheckSquare size={18} />
                            </div>
                            <h3
                                class="text-sm font-bold text-slate-700 uppercase tracking-wider"
                            >
                                Answer Configuration
                            </h3>
                        </div>

                        {#if questionData.question_type === "true_false"}
                            <div
                                class="bg-white p-6 rounded-2xl border border-slate-100 space-y-4"
                            >
                                <span
                                    class="text-sm font-semibold text-slate-700"
                                    >Correct Answer</span
                                >
                                <div class="flex gap-4">
                                    <label
                                        class="flex-1 flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all"
                                        class:bg-emerald-50={questionData.correct_answer ===
                                            "True"}
                                        class:border-emerald-200={questionData.correct_answer ===
                                            "True"}
                                        class:border-slate-100={questionData.correct_answer !==
                                            "True"}
                                    >
                                        <input
                                            type="radio"
                                            name="tf"
                                            value="True"
                                            bind:group={
                                                questionData.correct_answer
                                            }
                                            class="radio radio-emerald"
                                        />
                                        <span class="font-bold text-slate-700"
                                            >True</span
                                        >
                                    </label>
                                    <label
                                        class="flex-1 flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all"
                                        class:bg-emerald-50={questionData.correct_answer ===
                                            "False"}
                                        class:border-emerald-200={questionData.correct_answer ===
                                            "False"}
                                        class:border-slate-100={questionData.correct_answer !==
                                            "False"}
                                    >
                                        <input
                                            type="radio"
                                            name="tf"
                                            value="False"
                                            bind:group={
                                                questionData.correct_answer
                                            }
                                            class="radio radio-emerald"
                                        />
                                        <span class="font-bold text-slate-700"
                                            >False</span
                                        >
                                    </label>
                                </div>
                            </div>
                        {:else if questionData.question_type === "multiple_choice" || questionData.question_type === "multiple_select"}
                            <div
                                class="bg-white p-6 rounded-2xl border border-slate-100 space-y-4"
                            >
                                <div class="flex items-center justify-between">
                                    <span
                                        class="text-sm font-semibold text-slate-700"
                                        >Options</span
                                    >
                                    <button
                                        onclick={addOption}
                                        class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Option
                                    </button>
                                </div>
                                <div class="space-y-3">
                                    {#each questionData.options as option, i}
                                        <div class="flex items-center gap-3">
                                            {#if questionData.question_type === "multiple_choice"}
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    value={option}
                                                    bind:group={
                                                        questionData.correct_answer
                                                    }
                                                    class="radio radio-sm radio-primary"
                                                />
                                            {:else}
                                                <!-- Multiple Select logic would need a different correct_answer structure (array) -->
                                                <!-- For simplicity in this version, assuming comma-separated or similar -->
                                                <input
                                                    type="checkbox"
                                                    class="checkbox checkbox-sm checkbox-primary rounded"
                                                />
                                            {/if}
                                            <input
                                                type="text"
                                                bind:value={
                                                    questionData.options[i]
                                                }
                                                class="input input-bordered input-sm flex-1 bg-slate-50/50 border-slate-100 focus:bg-white rounded-xl font-medium"
                                                placeholder="Option {i + 1}"
                                            />
                                            {#if questionData.options.length > 1}
                                                <button
                                                    onclick={() =>
                                                        removeOption(i)}
                                                    class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                                <p
                                    class="text-[10px] text-slate-400 font-medium"
                                >
                                    Click the radio button next to the correct
                                    answer.
                                </p>
                            </div>
                        {:else if questionData.question_type === "coding_challenge"}
                            <div
                                class="bg-white p-6 rounded-2xl border border-slate-100 space-y-6"
                            >
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <div>
                                        <label
                                            for="coding_language"
                                            class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                                            >Language</label
                                        >
                                        <select
                                            id="coding_language"
                                            bind:value={
                                                questionData.coding_details
                                                    .language
                                            }
                                            class="select select-bordered select-sm w-full rounded-xl"
                                        >
                                            <option value="javascript"
                                                >JavaScript</option
                                            >
                                            <option value="python"
                                                >Python</option
                                            >
                                            <option value="golang">Go</option>
                                            <option value="java">Java</option>
                                        </select>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                for="exec_limit"
                                                class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                                                >Exec Limit (ms)</label
                                            >
                                            <input
                                                id="exec_limit"
                                                type="number"
                                                bind:value={
                                                    questionData.coding_details
                                                        .execution_time_limit
                                                }
                                                class="input input-bordered input-sm w-full rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                for="mem_limit"
                                                class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                                                >Mem Limit (MB)</label
                                            >
                                            <input
                                                id="mem_limit"
                                                type="number"
                                                bind:value={
                                                    questionData.coding_details
                                                        .memory_limit
                                                }
                                                class="input input-bordered input-sm w-full rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        for="code_template"
                                        class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                                        >Code Template</label
                                    >
                                    <textarea
                                        id="code_template"
                                        bind:value={
                                            questionData.coding_details
                                                .code_template
                                        }
                                        class="textarea textarea-bordered w-full h-48 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed rounded-2xl"
                                        placeholder="func solution(n int) int ..."
                                    ></textarea>
                                </div>

                                <div class="space-y-4">
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div
                                            class="text-xs font-bold text-slate-500 uppercase tracking-wider"
                                        >
                                            Test Cases
                                        </div>
                                        <button
                                            onclick={addTestCase}
                                            class="btn btn-xs btn-ghost text-indigo-600 font-bold hover:bg-indigo-50"
                                        >
                                            <Plus size={14} /> Add Test Case
                                        </button>
                                    </div>
                                    <div class="space-y-4">
                                        {#each questionData.coding_details.test_cases as testCase, i}
                                            <div
                                                class="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group"
                                            >
                                                <div
                                                    class="grid grid-cols-2 gap-4"
                                                >
                                                    <div>
                                                        <label
                                                            for="test_input_{i}"
                                                            class="text-[10px] font-bold text-slate-400 uppercase"
                                                            >Input</label
                                                        >
                                                        <input
                                                            id="test_input_{i}"
                                                            type="text"
                                                            bind:value={
                                                                testCase.input
                                                            }
                                                            class="input input-bordered input-xs w-full rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            for="test_output_{i}"
                                                            class="text-[10px] font-bold text-slate-400 uppercase"
                                                            >Expected Output</label
                                                        >
                                                        <input
                                                            id="test_output_{i}"
                                                            type="text"
                                                            bind:value={
                                                                testCase.expected_output
                                                            }
                                                            class="input input-bordered input-xs w-full rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div
                                                    class="flex items-center gap-4"
                                                >
                                                    <label
                                                        class="flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            bind:checked={
                                                                testCase.is_hidden
                                                            }
                                                            class="checkbox checkbox-xs rounded"
                                                        />
                                                        <span
                                                            class="text-[11px] font-bold text-slate-500"
                                                            >Hidden Case</span
                                                        >
                                                    </label>
                                                    <div
                                                        class="flex items-center gap-2 flex-1"
                                                    >
                                                        <span
                                                            class="text-[11px] font-bold text-slate-500 whitespace-nowrap"
                                                            >Weight:</span
                                                        >
                                                        <input
                                                            type="number"
                                                            bind:value={
                                                                testCase.weight
                                                            }
                                                            class="input input-bordered input-xs w-20 rounded-lg"
                                                        />
                                                    </div>
                                                    {#if questionData.coding_details.test_cases.length > 1}
                                                        <button
                                                            onclick={() =>
                                                                removeTestCase(
                                                                    i,
                                                                )}
                                                            class="text-slate-400 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </section>

                    <!-- Tags & Explanation -->
                    <section class="space-y-4">
                        <div class="flex items-center gap-2 mb-2">
                            <div
                                class="p-1.5 bg-amber-50 text-amber-600 rounded-lg"
                            >
                                <Tag size={18} />
                            </div>
                            <h3
                                class="text-sm font-bold text-slate-700 uppercase tracking-wider"
                            >
                                Metadata & Explanation
                            </h3>
                        </div>

                        <div
                            class="bg-white p-6 rounded-2xl border border-slate-100 space-y-6"
                        >
                            <div>
                                <label
                                    for="tag_input"
                                    class="block text-sm font-semibold text-slate-700 mb-2"
                                    >Tags</label
                                >
                                <div class="flex flex-wrap gap-2 mb-3">
                                    {#each questionData.tags as tag}
                                        <span
                                            class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                                        >
                                            {tag}
                                            <button
                                                onclick={() => removeTag(tag)}
                                                class="hover:text-rose-500"
                                                ><X size={12} /></button
                                            >
                                        </span>
                                    {/each}
                                </div>
                                <div class="relative">
                                    <div
                                        class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all"
                                    >
                                        <Search
                                            size={16}
                                            class="text-slate-400 ml-2"
                                        />
                                        <input
                                            type="text"
                                            bind:value={tagSearchQuery}
                                            onfocus={() =>
                                                (showTagDropdown = true)}
                                            placeholder="Search and select tags..."
                                            class="bg-transparent border-none focus:ring-0 text-sm w-full py-1 h-8"
                                        />
                                    </div>

                                    {#if showTagDropdown}
                                        <!-- Backdrop to close dropdown -->
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <div
                                            class="fixed inset-0 z-20"
                                            onclick={() =>
                                                (showTagDropdown = false)}
                                        ></div>

                                        <div
                                            class="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                                        >
                                            {#if filteredAvailableTags.length === 0}
                                                <div
                                                    class="p-4 text-center text-sm text-slate-500"
                                                >
                                                    No matching tags found
                                                </div>
                                            {:else}
                                                <div class="p-2 space-y-1">
                                                    {#each filteredAvailableTags as tag}
                                                        <button
                                                            type="button"
                                                            onclick={() =>
                                                                toggleTag(
                                                                    tag.Name ||
                                                                        tag.name,
                                                                )}
                                                            class="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 flex items-center justify-between group"
                                                        >
                                                            <span
                                                                >{tag.Name ||
                                                                    tag.name}</span
                                                            >
                                                            <Plus
                                                                size={14}
                                                                class="text-slate-300 group-hover:text-indigo-500 transition-colors"
                                                            />
                                                        </button>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            <div>
                                <label
                                    for="explanation"
                                    class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"
                                >
                                    <Lightbulb
                                        size={14}
                                        class="text-amber-400"
                                    />
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    id="explanation"
                                    bind:value={questionData.explanation}
                                    class="textarea textarea-bordered w-full h-32 bg-slate-50/50 border-slate-100 focus:bg-white rounded-2xl resize-none font-medium leading-relaxed"
                                    placeholder="Explain the solution to the user..."
                                ></textarea>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-20"
            >
                <div class="flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} />
                    <span class="text-xs font-bold uppercase tracking-wider"
                        >All fields auto-save as drafts</span
                    >
                </div>
                <div class="flex gap-3">
                    <button
                        onclick={close}
                        class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={handleSubmit}
                        class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        Create Question
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

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
</style>
