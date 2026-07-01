<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { quizService } from "$lib/api/quizzes.service";
    import { showToast } from "$lib/stores/toast";

    // --- Svelte 5 Runes ---
    let currentAttemptId = $derived($page.params.id);
    let appId = $derived($page.url.searchParams.get("application_id") || sessionStorage.getItem("quiz_application_id"));
    let jobId = $derived($page.url.searchParams.get("job_id") || sessionStorage.getItem("quiz_job_id"));
    let currentQuestion = $state(null);
    let answers = $state({}); // keep tracking local answer string
    let loading = $state(true);
    let submitted = $state(false);
    let isFinished = $state(false);
    let debounceTimer;
    let codeRunning = $state(false);
    let codeResults = $state(null);
    let codeOutput = $state("");
    let selectedLanguage = $state("");
    let selectedCodeTemplate = $state("");

    const FUNCTION_LANGUAGES = [
        { id: "python", name: "Python" },
        { id: "javascript", name: "JavaScript" },
        { id: "typescript", name: "TypeScript" },
        { id: "go", name: "Go" },
    ];

    let questionLang = $derived(currentQuestion?.coding_details?.language || "");

    const DEFAULT_TEMPLATES = {
        python: `def solution(arr):\n    # write your code here\n    pass\n`,
        javascript: `function solution(arr) {\n    // write your code here\n    return arr;\n}\n`,
        typescript: `function solution(arr: number[]): number {\n    // write your code here\n    return 0;\n}\n`,
        go: `package main\n\nfunc solution(arr []int) int {\n    // write your code here\n    return 0\n}\n`,
    };

    onMount(async () => {
        if (!currentAttemptId) {
            showToast("Missing runtime workspace parameter ID.", "error");
            loading = false;
            return;
        }
        if ($page.url.searchParams.has("application_id") || $page.url.searchParams.has("job_id")) {
            history.replaceState({}, "", `/quizzes/${currentAttemptId}`);
        }
        await startAndFetchNextQuestion();
    });

    async function startAndFetchNextQuestion() {
        loading = true;
        try {
            await quizService.startQuiz(currentAttemptId, {
                application_id: appId || "",
                job_id: jobId || ""
            });
            await loadNextQuestion();
        } catch (error) {
            console.error("Start Error details:", error);
            showToast("Failed to compile matrix structure from endpoint", "error");
        } finally {
            loading = false;
        }
    }

    async function loadNextQuestion() {
        loading = true;
        try {
            const res = await quizService.getQuizQuestion(currentAttemptId);
            
            if (res && res.status === "finished") {
                currentQuestion = null;
                isFinished = true;
            } else if (res && res.data) {
                currentQuestion = res.data;
            } else if (res && Object.keys(res).length > 0) {
                currentQuestion = res;
                codeResults = null;
                codeOutput = "";
                const cd = res.coding_details;
                if (cd && cd.language) {
                    selectedLanguage = cd.language;
                    selectedCodeTemplate = cd.code_template || DEFAULT_TEMPLATES[cd.language] || "";
                } else {
                    selectedLanguage = "";
                    selectedCodeTemplate = "";
                }
            } else {
                currentQuestion = null;
                isFinished = true;
            }
        } catch (error) {
            // Treat error (like 404) as finished
            currentQuestion = null;
            isFinished = true;
        } finally {
            loading = false;
        }
    }

    function handleAnswerSelection(questionId, value, isCode = false) {
        const stringValue = String(value);
        answers[questionId] = stringValue;

        if (isCode) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                // local save debounce
            }, 500);
        }
    }

    async function saveAnswerAndNext() {
        if (!currentQuestion) return;
        const questionId = currentQuestion.id;
        const stringValue = answers[questionId] || "";

        try {
            const payload = {
                question_id: questionId,
                user_answer: stringValue,
                time_spent_seconds: 10,
                is_skipped: false,
            };
            loading = true;
            await quizService.saveAnswer(currentAttemptId, payload);
            
            // Clear input logic if needed, but answered are mapped by questionId.
            await loadNextQuestion();
        } catch (error) {
            console.error("Failed to stream answer payload:", error);
            showToast("Failed to save answer", "error");
            loading = false;
        }
    }

    async function skipQuestion() {
        if (!currentQuestion) return;
        const questionId = currentQuestion.id;
        try {
            const payload = {
                question_id: questionId,
                user_answer: answers[questionId] || "",
                time_spent_seconds: 0,
                is_skipped: true,
            };
            await quizService.saveAnswer(currentAttemptId, payload);
            await loadNextQuestion();
        } catch (error) {
            console.error("Failed to skip question:", error);
            showToast("Failed to skip question", "error");
        }
    }

    async function handleSubmitQuiz() {
        loading = true;
        try {
            await quizService.submitQuiz(currentAttemptId);
            submitted = true;
            showToast("Assessment finalized and submitted successfully!", "success");
            // window.location.href = "/dashboard";
        } catch (error) {
            showToast("Error executing core submission compilation", "error");
        } finally {
            loading = false;
        }
    }

    function onLanguageChange(lang) {
        selectedLanguage = lang;
        const qid = currentQuestion?.id;
        if (qid && (!answers[qid] || answers[qid] === selectedCodeTemplate)) {
            const tmpl = currentQuestion?.coding_details?.code_template || DEFAULT_TEMPLATES[lang] || "";
            answers[qid] = tmpl;
            selectedCodeTemplate = tmpl;
        }
    }

    async function runCode() {
        if (!currentQuestion || !answers[currentQuestion.id]) return;
        codeRunning = true;
        codeResults = null;
        codeOutput = "";
        try {
            const res = await quizService.runCode(currentAttemptId, {
                question_id: currentQuestion.id,
                language: selectedLanguage,
                code: answers[currentQuestion.id]
            });
            if (res && res.error) {
                codeOutput = "Error: " + res.error;
                return;
            }
            const stdout = res.stdout || "";
            const stderr = res.stderr || "";
            if (stderr) codeOutput = stderr;
            codeResults = parseTestResults(stdout);
        } catch (error) {
            console.error("Run code error:", error);
            codeOutput = "Execution error: " + (error.message || "Unknown error");
        } finally {
            codeRunning = false;
        }
    }

    function parseTestResults(stdout) {
        const lines = stdout.split("\n").filter(l => l.trim());
        const results = [];
        for (const line of lines) {
            const match = line.match(/Test\s+(\d+):\s*(PASS|FAIL)/i);
            if (match) {
                results.push({
                    index: parseInt(match[1]),
                    passed: match[2].toUpperCase() === "PASS",
                    output: line
                });
            }
        }
        return results.length > 0 ? results : null;
    }

    function getFuncSignature(template, lang) {
        if (!template) return "";
        const firstLine = template.trim().split("\n")[0];
        const sig = firstLine.replace(/^def |^function |^fn |^fun /, "").replace(/\s*:\s*$/, "").replace(/\{#.*$/, "").trim();
        if (sig && !sig.startsWith("//") && !sig.startsWith("#")) return sig;
        return "";
    }

    function formatTcInput(tc) {
        const val = tc.input ?? tc.args ?? "(no input)";
        if (typeof val === "string") return val;
        return JSON.stringify(val);
    }

    function formatTcOutput(tc) {
        const val = tc.expected_output ?? tc.output ?? tc.expected ?? "(?)";
        if (typeof val === "string") return val;
        return JSON.stringify(val);
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
    {:else if isFinished}
        <div class="card result animate-scale">
            <div class="success-icon">✓</div>
            <h2>Assessment Locked</h2>
            <p>
                All functional parameters have been securely committed to the
                central database stack.
            </p>
            <div class="actions" style="justify-content: center;">
                <button onclick={handleSubmitQuiz} class="btn-submit">
                    Submit Assessment Block
                </button>
            </div>
        </div>
    {:else if !currentQuestion}
        <div class="card empty">
            <p>
                No compiled verification components linked to this workspace
                instance.
            </p>
        </div>
    {:else if !submitted}
        {@const activeQuestion = currentQuestion}
        {@const optionsList = parseOptions(activeQuestion?.options)}

        <div class="progress-bar-container">
            <!-- Progress bar can be static or hidden if we don't know total count, or we can just show an infinite loading bar -->
            <div
                class="progress-bar"
                style="width: 50%"
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
                <div class="coding-toolbar">
                    <label class="lang-selector">
                        <span>Language:</span>
                        <select
                            value={selectedLanguage}
                            onchange={(e) => onLanguageChange(e.target.value)}
                        >
                            <option value="" disabled>Select language</option>
                            {#each FUNCTION_LANGUAGES as lang}
                                <option value={lang.id}>{lang.name}</option>
                            {/each}
                        </select>
                    </label>
                    {#if questionLang}
                        <span class="lang-badge">{questionLang}</span>
                    {/if}
                    {#if activeQuestion.coding_details?.test_cases?.length}
                        <span class="test-count"
                            >{activeQuestion.coding_details.test_cases.length} test(s)</span
                        >
                    {/if}
                </div>
                <textarea
                    class="code-editor"
                    rows="14"
                    placeholder="// Write your code here..."
                    value={answers[activeQuestion.id] ??
                        (selectedLanguage ? (activeQuestion.coding_details?.code_template || DEFAULT_TEMPLATES[selectedLanguage] || "") : "")}
                    oninput={(e) => {
                        handleAnswerSelection(
                            activeQuestion.id,
                            e.target.value,
                            true,
                        );
                        codeResults = null;
                        codeOutput = "";
                    }}
                />

                {#if activeQuestion.coding_details?.test_cases?.length}
                    <div class="test-cases">
                        <div class="test-header">
                            <span class="test-count">{activeQuestion.coding_details.test_cases.length} test case(s)</span>
                            <span class="func-signature">{getFuncSignature(activeQuestion.coding_details.code_template, selectedLanguage)}</span>
                        </div>
                        <div class="test-list">
                            {#each activeQuestion.coding_details.test_cases as tc, i}
                                <div class="test-case">
                                    <span class="test-num">#{i + 1}</span>
                                    <code class="test-input">→ {formatTcInput(tc)}</code>
                                    <code class="test-arrow">⇢</code>
                                    <code class="test-expected">{formatTcOutput(tc)}</code>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if codeResults}
                    <div class="code-results">
                        <h3>Execution Results</h3>
                        <div class="results-grid">
                            {#each codeResults as result, i}
                                <div class="result-row" class:pass={result.passed} class:fail={!result.passed}>
                                    <span class="result-indicator">{result.passed ? "✓" : "✗"}</span>
                                    <span class="result-label">Test {i + 1}</span>
                                    <span class="result-detail">{result.output || result.error || "passed"}</span>
                                </div>
                            {/each}
                        </div>
                        <div class="summary-row">
                            Passed {codeResults.filter(r => r.passed).length} / {codeResults.length}
                        </div>
                    </div>
                {/if}

                {#if codeOutput}
                    <pre class="code-output">{codeOutput}</pre>
                {/if}

                <div class="code-actions">
                    <button
                        class="btn-run"
                        onclick={runCode}
                        disabled={codeRunning || !answers[activeQuestion.id]}
                    >
                        {codeRunning ? "Running..." : "▶ Run Tests"}
                    </button>
                </div>
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
            <button class="btn-skip" onclick={skipQuestion}>
                skip
            </button>
            <button class="btn-primary" onclick={saveAnswerAndNext}>
                Save Answer & Next
            </button>
        </div>
        <p class="progress-txt">
            Active Component Instance
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
    .coding-toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }
    .lang-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #475569;
    }
    .lang-selector select {
        padding: 0.35rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.85rem;
        background: white;
        cursor: pointer;
        font-family: system-ui, sans-serif;
    }
    .lang-selector select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .test-count {
        color: #6366f1;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .lang-badge {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 0.2rem 0.55rem;
        background: #eef2ff;
        color: #4338ca;
        border-radius: 4px;
        letter-spacing: 0.03em;
    }
    .code-editor {
        width: 100%;
        font-family: "Fira Code", "JetBrains Mono", "Cascadia Code", "Consolas", monospace;
        font-size: 0.85rem;
        line-height: 1.6;
        padding: 1.25rem;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #1e293b;
        color: #e2e8f0;
        tab-size: 4;
        resize: vertical;
        min-height: 280px;
    }
    .code-editor:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .test-cases {
        margin-top: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        border: 1px solid #e2e8f0;
    }
    .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .func-signature {
        font-family: "Fira Code", "JetBrains Mono", monospace;
        font-size: 0.78rem;
        color: #6366f1;
        background: #eef2ff;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
    }
    .test-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .test-case {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        padding: 0.35rem 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        font-family: "Fira Code", "JetBrains Mono", monospace;
    }
    .test-num {
        color: #94a3b8;
        font-weight: 600;
        min-width: 1.5rem;
    }
    .test-input {
        color: #334155;
    }
    .test-arrow {
        color: #94a3b8;
    }
    .test-expected {
        color: #6366f1;
        font-weight: 600;
    }
    .code-actions {
        margin-top: 1rem;
    }
    .btn-run {
        background: #6366f1;
        color: white;
        border: none;
        padding: 0.7rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: background 0.2s;
    }
    .btn-run:hover:not(:disabled) {
        background: #4f46e5;
    }
    .btn-run:disabled {
        background: #94a3b8;
        cursor: not-allowed;
    }
    .btn-skip {
        background: transparent;
        color: #64748b;
        border: 1px solid #cbd5e1;
        padding: 0.7rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-skip:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        color: #334155;
    }
    .code-results {
        margin-top: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
    }
    .code-results h3 {
        font-size: 0.9rem;
        margin: 0 0 0.75rem 0;
        color: #334155;
    }
    .results-grid {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .result-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-size: 0.82rem;
        font-family: monospace;
    }
    .result-row.pass {
        background: #f0fdf4;
        color: #15803d;
    }
    .result-row.fail {
        background: #fef2f2;
        color: #dc2626;
    }
    .result-indicator {
        font-size: 1rem;
        font-weight: 700;
    }
    .result-label {
        font-weight: 600;
        min-width: 4rem;
    }
    .result-detail {
        color: #475569;
        word-break: break-all;
    }
    .summary-row {
        margin-top: 0.5rem;
        font-weight: 700;
        font-size: 0.9rem;
        color: #334155;
        text-align: right;
    }
    .code-output {
        margin-top: 0.75rem;
        padding: 1rem;
        background: #1e293b;
        color: #fbbf24;
        border-radius: 8px;
        font-size: 0.78rem;
        overflow-x: auto;
        white-space: pre-wrap;
        font-family: monospace;
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
