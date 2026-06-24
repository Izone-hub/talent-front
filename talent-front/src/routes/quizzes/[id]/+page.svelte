<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { quizService } from "$lib/api/quizzes.service";
    import { showToast } from "$lib/stores/toast";

    // --- Svelte 5 Runes ---
    let currentQuestionIndex = $state(0);
    let questions = $state([]);
    let answers = $state({});
    let loading = $state(true);
    let submitted = $state(false);

    // 🔥 FIX 1: Ensure ID is always reactive by using $derived Rune
    let currentAttemptId = $derived($page.params.id);
    let debounceTimer;

    onMount(async () => {
        // Check if ID exists
        if (!currentAttemptId) {
            showToast("Missing runtime workspace parameter ID.", "error");
            loading = false;
            return;
        }
        await startAndFetchQuiz();
    });

    async function startAndFetchQuiz() {
        loading = true;
        try {
            await quizService.startQuiz(currentAttemptId);
            const res = await quizService.getQuizQuestions(currentAttemptId);

            // 🔥 FIX 2: Carefully check the format returned from backend (ensure it is an Array)
            if (res && res.data) {
                questions = res.data;
            } else if (Array.isArray(res)) {
                questions = res;
            } else {
                questions = [];
            }

            if (questions.length === 0) {
                showToast(
                    "No active questions parsed from the database pool.",
                    "warning",
                );
            }
        } catch (error) {
            console.error("Fetch Error details:", error);
            showToast(
                "Failed to compile matrix structure from endpoint",
                "error",
            );
        } finally {
            loading = false;
        }
    }

    function nextQuestion() {
        if (currentQuestionIndex < questions.length - 1) currentQuestionIndex++;
    }

    // Go back
    function prevQuestion() {
        if (currentQuestionIndex > 0) currentQuestionIndex--;
    }

    function handleAnswerSelection(questionId, value, isCode = false) {
        const stringValue = String(value);
        answers[questionId] = stringValue;

        if (isCode) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                await sendAnswerToBackend(questionId, stringValue);
            }, 500);
        } else {
            sendAnswerToBackend(questionId, stringValue);
        }
    }

    async function sendAnswerToBackend(questionId, stringValue) {
        try {
            const payload = {
                question_id: questionId,
                user_answer: stringValue,
                time_spent_seconds: 10,
                is_skipped: false,
            };
            await quizService.saveAnswer(currentAttemptId, payload);
        } catch (error) {
            console.error("Failed to stream answer payload:", error);
        }
    }

    async function handleSubmitQuiz() {
        loading = true;
        try {
            await quizService.submitQuiz(currentAttemptId);
            submitted = true;
            showToast(
                "Assessment finalized and submitted successfully!",
                "success",
            );
        } catch (error) {
            showToast("Error executing core submission compilation", "error");
        } finally {
            loading = false;
        }
    }

    function parseOptions(optionsRaw) {
        try {
            if (!optionsRaw) return [];
            if (typeof optionsRaw === "string") return JSON.parse(optionsRaw);
            return optionsRaw;
        } catch (e) {
            return [];
        }
    }
</script>

<div class="container">
    <div class="header">
        <h1>Technical Assessment Board</h1>
        <p class="subtitle">
            Workspace Node Instance: <code>{currentAttemptId}</code>
        </p>
    </div>

    {#if loading}
        <div class="loading-box">
            <div class="spinner"></div>
            <p>Syncing active runtime configurations from database pool...</p>
        </div>
    {:else if questions.length === 0}
        <div class="card empty">
            <p>
                No compiled verification components linked to this workspace
                instance.
            </p>
        </div>
    {:else if !submitted}
        {@const activeQuestion = questions[currentQuestionIndex]}
        {@const optionsList = parseOptions(activeQuestion?.options)}

        <div class="progress-bar-container">
            <div
                class="progress-bar"
                style="width: {((currentQuestionIndex + 1) / questions.length) *
                    100}%"
            ></div>
        </div>

        {#if activeQuestion.question_type === "multiple_choice"}
            <div class="card animate-fade">
                <span class="badge">MULTIPLE CHOICE</span>
                <h2>{activeQuestion.question_text}</h2>
                <div class="options-grid">
                    {#if Array.isArray(optionsList)}
                        {#each optionsList as option}
                            <label
                                class="option-row"
                                class:selected={answers[activeQuestion.id] ===
                                    option}
                            >
                                <input
                                    type="radio"
                                    name="q{activeQuestion.id}"
                                    checked={answers[activeQuestion.id] ===
                                        option}
                                    onchange={() =>
                                        handleAnswerSelection(
                                            activeQuestion.id,
                                            option,
                                        )}
                                    value={option}
                                />
                                <span>{option}</span>
                            </label>
                        {/each}
                    {:else}
                        {#each Object.entries(optionsList) as [key, value]}
                            <label
                                class="option-row"
                                class:selected={answers[activeQuestion.id] ===
                                    key}
                            >
                                <input
                                    type="radio"
                                    name="q{activeQuestion.id}"
                                    checked={answers[activeQuestion.id] === key}
                                    onchange={() =>
                                        handleAnswerSelection(
                                            activeQuestion.id,
                                            key,
                                        )}
                                    value={key}
                                />
                                <span><strong>{key}:</strong> {value}</span>
                            </label>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}

        {#if activeQuestion.question_type === "true_false"}
            <div class="card animate-fade">
                <span class="badge">BOOLEAN VERIFICATION</span>
                <h2>{activeQuestion.question_text}</h2>
                <div class="options-grid">
                    <label
                        class="option-row"
                        class:selected={answers[activeQuestion.id] === "true"}
                    >
                        <input
                            type="radio"
                            name="q{activeQuestion.id}"
                            checked={answers[activeQuestion.id] === "true"}
                            onchange={() =>
                                handleAnswerSelection(
                                    activeQuestion.id,
                                    "true",
                                )}
                            value="true"
                        />
                        <span>True</span>
                    </label>
                    <label
                        class="option-row"
                        class:selected={answers[activeQuestion.id] === "false"}
                    >
                        <input
                            type="radio"
                            name="q{activeQuestion.id}"
                            checked={answers[activeQuestion.id] === "false"}
                            onchange={() =>
                                handleAnswerSelection(
                                    activeQuestion.id,
                                    "false",
                                )}
                            value="false"
                        />
                        <span>False</span>
                    </label>
                </div>
            </div>
        {/if}

        {#if activeQuestion.question_type === "coding" || activeQuestion.question_type === "coding_challenge"}
            <div class="card animate-fade">
                <span class="badge implementation"
                    >ALGORITHM IMPLEMENTATION</span
                >
                <h2>{activeQuestion.question_text}</h2>
                {#if activeQuestion.coding_details}
                    <p class="lang-tag">
                        Target Compilation: <code
                            >{activeQuestion.coding_details.language}</code
                        >
                    </p>
                {/if}
                <textarea
                    rows="14"
                    placeholder="// Implement your strict logical matrix structures here..."
                    value={answers[activeQuestion.id] ||
                        activeQuestion.coding_details?.code_template ||
                        ""}
                    oninput={(e) =>
                        handleAnswerSelection(
                            activeQuestion.id,
                            e.target.value,
                            true,
                        )}
                />
            </div>
        {/if}

        {#if activeQuestion.question_type === "multiple_select"}
            <div class="card animate-fade">
                <span class="badge">MULTIPLE SELECT</span>
                <h2>{activeQuestion.question_text}</h2>
                <div class="options-grid">
                    {#each optionsList as option}
                        {@const selectedOptions = answers[activeQuestion.id] ? answers[activeQuestion.id].split("|||") : []}
                        <label
                            class="option-row"
                            class:selected={selectedOptions.includes(option)}
                        >
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option)}
                                onchange={() => {
                                    const current = answers[activeQuestion.id] ? answers[activeQuestion.id].split("|||") : [];
                                    const idx = current.indexOf(option);
                                    if (idx >= 0) current.splice(idx, 1);
                                    else current.push(option);
                                    handleAnswerSelection(activeQuestion.id, current.join("|||"));
                                }}
                                value={option}
                            />
                            <span>{option}</span>
                        </label>
                    {/each}
                </div>
            </div>
        {/if}

        {#if activeQuestion.question_type === "text"}
            <div class="card animate-fade">
                <span class="badge">TEXT RESPONSE</span>
                <h2>{activeQuestion.question_text}</h2>
                <textarea
                    rows="6"
                    placeholder="Type your answer here..."
                    value={answers[activeQuestion.id] || ""}
                    oninput={(e) =>
                        handleAnswerSelection(
                            activeQuestion.id,
                            e.target.value,
                            true,
                        )}
                />
            </div>
        {/if}

        <div class="actions">
            <button
                class="btn-secondary"
                onclick={prevQuestion}
                disabled={currentQuestionIndex === 0}
            >
                Previous Component
            </button>
            {#if currentQuestionIndex < questions.length - 1}
                <button class="btn-primary" onclick={nextQuestion}
                    >Next Component</button
                >
            {:else}
                <button onclick={handleSubmitQuiz} class="btn-submit"
                    >Submit Assessment Block</button
                >
            {/if}
        </div>
        <p class="progress-txt">
            Component Framework {currentQuestionIndex + 1} of {questions.length}
        </p>
    {:else}
        <div class="card result animate-scale">
            <div class="success-icon">✓</div>
            <h2>Assessment Locked</h2>
            <p>
                All functional parameters have been securely committed to the
                central database stack.
            </p>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #f8fafc;
        color: #0f172a;
    }
    .container {
        max-width: 850px;
        margin: 3rem auto;
        padding: 0 1.5rem;
        font-family: system-ui, sans-serif;
    }
    .header {
        margin-bottom: 2.5rem;
    }
    h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
    }
    .subtitle {
        color: #64748b;
        font-size: 0.95rem;
    }
    .progress-bar-container {
        width: 100%;
        height: 6px;
        background: #e2e8f0;
        border-radius: 999px;
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    .progress-bar {
        height: 100%;
        background: #4f46e5;
        transition: width 0.3s ease;
    }
    .card {
        padding: 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    h2 {
        margin: 0.75rem 0 1.5rem 0;
        font-size: 1.35rem;
        line-height: 1.5;
    }
    .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.35rem 0.75rem;
        background: #f0fdf4;
        color: #16a34a;
        border-radius: 6px;
    }
    .badge.implementation {
        background: #eff6ff;
        color: #2563eb;
    }
    .options-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .option-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 1rem 1.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .option-row.selected {
        background: #e0e7ff;
        border-color: #6366f1;
        color: #312e81;
    }
    textarea {
        width: 100%;
        font-family: monospace;
        font-size: 0.9rem;
        padding: 1.25rem;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
    }
    .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
    }
    button {
        padding: 0.85rem 1.75rem;
        cursor: pointer;
        border-radius: 12px;
        font-weight: 600;
    }
    .btn-primary {
        border: 1px solid #cbd5e1;
        background: white;
    }
    .btn-secondary {
        border: 1px solid transparent;
        background: transparent;
        color: #64748b;
    }
    .btn-submit {
        background: #4f46e5;
        color: white;
        border: 1px solid #4f46e5;
    }
    .progress-txt {
        text-align: center;
        color: #94a3b8;
        margin-top: 1.5rem;
        font-size: 0.85rem;
    }
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #4f46e5;
        border-radius: 50%;
        margin: 0 auto 1.5rem auto;
        animation: spin 1s linear infinite;
    }
    .result {
        text-align: center;
        padding: 4rem 2rem;
    }
    .success-icon {
        width: 60px;
        height: 60px;
        background: #dcfce7;
        color: #15803d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem auto;
        font-size: 1.5rem;
    }

    /* 🔥 FIX 3: Global style to make the error popup stand out */
    :global(body .toast-error),
    :global(body [data-toast-type="error"]) {
        background-color: #ef4444 !important;
        color: #ffffff !important;
        font-weight: bold !important;
        box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4) !important;
        opacity: 1 !important;
        z-index: 99999 !important;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    .animate-fade {
        animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
