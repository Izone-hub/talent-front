<script>
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { quizService } from "$lib/api/quiz.service";
    import { showToast } from "$lib/stores/toast";
    import {
        Play,
        CheckCircle2,
        XCircle,
        ChevronRight,
        Loader2,
        Code2,
        Terminal,
        Clock,
        BarChart3,
        ArrowLeft,
        Send,
        Timer,
        TimerOff,
    } from "@lucide/svelte";
    import SkeletonQuiz from "$lib/components/ui/SkeletonQuiz.svelte";
    import CodeEditor from "$lib/components/ui/CodeEditor.svelte";

    const quizId = $page.params.id;
    const applicationId = $page.url.searchParams.get("application_id");
    const jobId = $page.url.searchParams.get("job_id");

    // Quiz anti-cheat state is scoped to this page instance and toggled only
    // while the quiz is actually active. Frontend protections are deterrence,
    // not security boundaries.
    let antiCheat = $state({
        enabled: false,
        reason: "",
    });
    let tabLockTriggered = false;

    let phase = $state("loading");
    let quiz = $state(null);
    let question = $state(null);
    let questionNumber = $state(0);
    let selectedOption = $state("");
    let code = $state("");
    let isSaving = $state(false);
    let isSubmitting = $state(false);
    let submitted = $state(false);
    let resultMessage = $state("");
    let questionHistory = $state([]);
    let historyIndex = $state(-1);
    let timeRemaining = $state(0);
    let timerInterval = null;
    let userAnswers = $state([]);

    function getQuizQuestionCount() {
        return quiz?.questions_per_quiz || quiz?.total_questions || 10;
    }

    function isLastQuestion() {
        return questionNumber >= getQuizQuestionCount();
    }

    function snapshotCurrentQuestion() {
        if (!question) return null;

        return {
            question,
            selectedOption,
            code,
            timeRemaining,
        };
    }

    function persistCurrentQuestionState() {
        if (historyIndex < 0 || !questionHistory[historyIndex]) return;

        const updatedHistory = [...questionHistory];
        updatedHistory[historyIndex] = snapshotCurrentQuestion();
        questionHistory = updatedHistory;
    }

    function restoreQuestionState(entry) {
        question = entry.question;
        selectedOption = entry.selectedOption || "";
        code = entry.code || "";
        timeRemaining = entry.timeRemaining ?? entry.question?.time_limit_seconds ?? 0;
    }

    function optionsList(q) {
        if (!q?.options) return [];
        let opts = q.options;
        if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch { return []; }
        }
        return Array.isArray(opts) ? opts : [];
    }

    function isCoding(q) {
        return q?.question_type === "coding_challenge";
    }

    function isMcq(q) {
        return q?.question_type === "multiple_choice" || q?.question_type === "multiple_select" || q?.question_type === "true_false";
    }

    function codingDetails(q) {
        return q?.coding_details || null;
    }

    function optionValue(opt) {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) return opt.option || opt.text || opt.value || JSON.stringify(opt);
        return String(opt);
    }

    function optionText(opt) {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) return opt.text || opt.label || opt.option || JSON.stringify(opt);
        return String(opt);
    }

    function optionLetter(opt) {
        if (typeof opt === "object" && opt !== null && opt.option) return opt.option;
        return null;
    }

    function difficultyColor(d) {
        const map = { easy: "badge-success", medium: "badge-warning", hard: "badge-error", expert: "badge-neutral" };
        return map[d] || "badge-ghost";
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // --- Quiz anti-cheat (deterrence only) ---

    function isDevToolsShortcut(e) {
        const key = (e.key || "").toLowerCase();
        const mod = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        if (mod && shift && (key === "i" || key === "j" || key === "c")) {
            return true;
        }
        if (mod && key === "u") {
            return true;
        }
        if (!mod && key === "f12") {
            return true;
        }

        return false;
    }

    function enableAntiCheat(reason) {
        if (!antiCheat.enabled) {
            antiCheat.enabled = true;
            antiCheat.reason = reason || "quiz-active";
            tabLockTriggered = false;
            attachAntiCheatListeners();
            attachDevToolsHeuristic();
        }
    }

    function disableAntiCheat() {
        if (!antiCheat.enabled) return;
        antiCheat.enabled = false;
        antiCheat.reason = "";
        detachAntiCheatListeners();
        detachDevToolsHeuristic();
    }

    function attachAntiCheatListeners() {
        if (typeof window === "undefined") return;

        window.addEventListener("contextmenu", onContextMenu, true);
        window.addEventListener("copy", onCopy, true);
        window.addEventListener("cut", onCut, true);
        window.addEventListener("paste", onPaste, true);
        window.addEventListener("dragstart", onDragStart, true);
        window.addEventListener("keydown", onKeydown, true);
        window.addEventListener("keyup", onKeyup, true);
        window.addEventListener("beforeunload", onBeforeUnload, true);

        document.addEventListener("selectionchange", onSelectionChange, true);

        window.addEventListener("blur", onWindowBlur, true);
        window.addEventListener("focus", onWindowFocus, true);

        if (typeof document !== "undefined" && document.addEventListener) {
            document.addEventListener("visibilitychange", onVisibilityChange, true);
        }
    }

    function detachAntiCheatListeners() {
        if (typeof window === "undefined") return;

        window.removeEventListener("contextmenu", onContextMenu, true);
        window.removeEventListener("copy", onCopy, true);
        window.removeEventListener("cut", onCut, true);
        window.removeEventListener("paste", onPaste, true);
        window.removeEventListener("dragstart", onDragStart, true);
        window.removeEventListener("keydown", onKeydown, true);
        window.removeEventListener("keyup", onKeyup, true);
        window.removeEventListener("beforeunload", onBeforeUnload, true);

        document.removeEventListener("selectionchange", onSelectionChange, true);

        window.removeEventListener("blur", onWindowBlur, true);
        window.removeEventListener("focus", onWindowFocus, true);

        if (typeof document !== "undefined" && document.removeEventListener) {
            document.removeEventListener("visibilitychange", onVisibilityChange, true);
        }
    }

    // Allow-list of interactive elements where text entry must still work.
    function isInteractiveInputTarget(node) {
        if (!node) return false;

        const tag = node.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

        if (node.isContentEditable) return true;

        // The quiz's code editor is the one place where rich code editing must
        // remain fully usable. Treat its root wrapper as interactive.
        if (node.classList && node.classList.contains("codemirror-wrapper")) return true;

        if (node.getAttribute && node.getAttribute("contenteditable") === "true") return true;

        return false;
    }

    function closestInteractiveInput(node) {
        let cur = node;
        while (cur && cur !== document && cur !== window) {
            if (isInteractiveInputTarget(cur)) return cur;
            cur = cur.parentElement || cur.parentNode;
        }
        return null;
    }

    function isQuizContentNode(node) {
        if (!node) return false;

        // Walk up the DOM tree looking for the quiz question card or its
        // container. This is more reliable than checking a single class.
        let cur = node;
        while (cur && cur !== document && cur !== window) {
            if (cur.classList) {
                // The question card and the main active-quiz container both
                // carry 'space-y-4'. The question text <h2> is a direct child
                // of the card, so checking the card and its ancestors is enough.
                if (
                    cur.classList.contains("space-y-4") ||
                    cur.classList.contains("rounded-2xl")
                ) {
                    return true;
                }
            }
            cur = cur.parentElement || cur.parentNode;
        }

        return false;
    }

    function blockDefault(e) {
        if (e.cancelable) {
            e.preventDefault();
        }
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    function onContextMenu(e) {
        if (!antiCheat.enabled) return;

        // Block context menu globally while the quiz is active.
        blockDefault(e);
    }

    function onCopy(e) {
        if (!antiCheat.enabled) return;
        // Prevent quiz questions and answers from being copied to external tools.
        blockDefault(e);
    }

    function onCut(e) {
        if (!antiCheat.enabled) return;
        // Prevent quiz content from being moved out of the active attempt.
        blockDefault(e);
    }

    function onPaste(e) {
        if (!antiCheat.enabled) return;
        // Do not allow externally prepared answers to enter quiz controls.
        blockDefault(e);
    }

    function onDragStart(e) {
        if (!antiCheat.enabled) return;

        const target = e.target || e.srcElement;
        if (!closestInteractiveInput(target) && isQuizContentNode(target)) {
            blockDefault(e);
        }
    }

    function onBeforeUnload(e) {
        if (!antiCheat.enabled) return;
        e.preventDefault();
        e.returnValue = "";
    }

    function onKeydown(e) {
        if (!antiCheat.enabled) return;

        // DevTools shortcuts: interrupt the quiz immediately.
        if (isDevToolsShortcut(e)) {
            blockDefault(e);
            triggerAntiCheatViolation("DevTools shortcut detected");
            return;
        }

        const mod = e.ctrlKey || e.metaKey;
        const key = (e.key || "").toLowerCase();

        // Ctrl/Cmd + C/X: block copying or cutting quiz content and answers.
        if (mod && (key === "c" || key === "x")) {
            blockDefault(e);
            triggerAntiCheatViolation(
                key === "c" ? "Copy blocked" : "Cut blocked"
            );
            return;
        }

        // Ctrl/Cmd + V: block prepared answers from entering answer fields.
        if (mod && key === "v") {
            blockDefault(e);
            triggerAntiCheatViolation("Paste blocked");
            return;
        }

        // Ctrl/Cmd + A : block outside interactive inputs to prevent selecting
        // the entire quiz page content.
        if (mod && key === "a") {
            const target = e.target || e.srcElement;
            if (closestInteractiveInput(target)) return;
            blockDefault(e);
            triggerAntiCheatViolation("Select-all blocked");
            return;
        }
    }

    function onKeyup(e) {
        // Keep key-up handlers minimal; mainly used to reset any transient
        // per-key state if needed in future.
    }

    function onSelectionChange() {
        if (!antiCheat.enabled) return;

        const sel = window.getSelection ? window.getSelection() : null;
        if (!sel) return;

        // If the selection is entirely within interactive inputs, allow it.
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (range) {
                const container = range.commonAncestorContainer || range.startContainer;
                if (closestInteractiveInput(container)) return;
            }
        }

        // If the selection is effectively inside the quiz content area, nudge it
        // back to an empty selection without disrupting typing.
        if (sel.toString().length > 0) {
            const target = sel.anchorNode || sel.focusNode;
            if (target && !closestInteractiveInput(target) && isQuizContentNode(target)) {
                try {
                    const newSel = window.getSelection();
                    if (newSel) {
                        newSel.removeAllRanges();
                    }
                } catch {
                    // ignore selection errors
                }
            }
        }
    }

    let lastVisibleAt = 0;
    let visibilityViolationCooldownUntil = 0;

    function onVisibilityChange() {
        if (!antiCheat.enabled) return;

        const now = Date.now();
        if (now < visibilityViolationCooldownUntil) return;

        if (document.visibilityState === "hidden") {
            terminateQuizForTabLoss("Switched away from quiz tab");
            visibilityViolationCooldownUntil = now + 4000;
        } else {
            // Returned to the tab: give a small grace window before any further
            // detection so navigation/click noise does not re-trigger immediately.
            visibilityViolationCooldownUntil = now + 1500;
        }
    }

    function onWindowBlur() {
        if (!antiCheat.enabled) return;

        const now = Date.now();
        if (now < visibilityViolationCooldownUntil) return;

        // Window blur can fire on modal dialogs or popup windows. Cooldown it.
        terminateQuizForTabLoss("Quiz window lost focus");
        visibilityViolationCooldownUntil = now + 4000;
    }

    function onWindowFocus() {
        if (!antiCheat.enabled) return;
        const now = Date.now();
        visibilityViolationCooldownUntil = now + 1500;
    }

    function triggerAntiCheatViolation(reason) {
        antiCheat.reason = reason;

        showToast(
            `Quiz warning: ${reason}. Please stay on this page and try again.`,
            "warning",
            6000
        );
    }

    async function terminateQuizForTabLoss(reason) {
        if (!antiCheat.enabled || tabLockTriggered || isSubmitting) return;
        tabLockTriggered = true;
        triggerAntiCheatViolation(`${reason}; quiz terminated`);
        resultMessage = `Quiz terminated: ${reason}.`;
        stopTimer();
        await submitQuiz();
    }

    // DevTools heuristics: browsers differ a lot, so we only treat a growing
    // outer-window size as a weak secondary signal and never as the sole cause.
    let lastOuterSize = 0;
    let devtoolsCheckInterval = null;

    function attachDevToolsHeuristic() {
        if (typeof window === "undefined") return;
        lastOuterSize = window.outerWidth * window.outerHeight;
        devtoolsCheckInterval = setInterval(() => {
            if (!antiCheat.enabled) return;
            const current = window.outerWidth * window.outerHeight;
            if (current > lastOuterSize + 50000) {
                lastOuterSize = current;
                triggerAntiCheatViolation("Window size change detected");
            } else {
                lastOuterSize = current;
            }
        }, 600);
    }

    function detachDevToolsHeuristic() {
        if (devtoolsCheckInterval) {
            clearInterval(devtoolsCheckInterval);
            devtoolsCheckInterval = null;
        }
    }

    function startTimer() {
        stopTimer();
        if (!question || phase !== "active") return;

        const limit = question.time_limit_seconds;
        if (!limit || limit <= 0) return;

        if (timeRemaining <= 0) {
            timeRemaining = limit;
        }

        timerInterval = setInterval(() => {
            timeRemaining--;

            if (timeRemaining <= 0) {
                stopTimer();
                handleTimeUp();
            }
        }, 1000);
    }

    async function handleTimeUp() {
        if (isSaving || isSubmitting) return;

        showToast("Time's up! Moving to next question.", "warning");
        if (isLastQuestion()) {
            const saved = await saveCurrentAnswer();
            if (saved) {
                await submitQuiz();
            }
        } else {
            await saveAndNext();
        }
    }

    async function startQuiz() {
        if (typeof window !== "undefined" && !window.confirm(
            "Before starting, close other tabs and windows. Leaving this quiz during the attempt will automatically terminate the quiz."
        )) {
            return;
        }

        phase = "starting";
        try {
            await quizService.startQuiz(quizId, applicationId, jobId);
            showToast("Quiz started!", "success");
            enableAntiCheat("quiz-active");
            await loadNextQuestion();
        } catch (e) {
            showToast("Failed to start quiz", "error");
            phase = "ready";
        }
    }

    async function loadNextQuestion() {
        try {
            const q = await quizService.getQuestion(quizId);
            if (q && q.status === "finished") {
                stopTimer();
                disableAntiCheat();
                question = null;
                resultMessage = q.message || "Quiz complete!";
                phase = "finished";
                return;
            }
            if (!q || !q.id) {
                phase = "ready";
                return;
            }

            if (question) {
                persistCurrentQuestionState();
            }

            const nextHistory = questionHistory.slice(0, historyIndex + 1);
            nextHistory.push({
                question: q,
                selectedOption: "",
                code: "",
                timeRemaining: q.time_limit_seconds || 0,
            });

            questionHistory = nextHistory;
            historyIndex = nextHistory.length - 1;
            question = q;
            questionNumber = historyIndex + 1;
            selectedOption = "";
            code = "";
            timeRemaining = q.time_limit_seconds || 0;
            const details = codingDetails(q);
            if (details?.code_template) {
                code = details.code_template;
            }
            startTimer();
        } catch (e) {
            showToast("Failed to load question", "error");
            if (questionNumber === 0) {
                phase = "ready";
            }
        }
    }

    function computeIsCorrect(q, answer) {
        // Coding challenges are graded on the backend; treat as pending.
        if (isCoding(q)) return false;
        if (!q.correct_answer) return false;
        return answer === q.correct_answer;
    }

    async function saveCurrentAnswer() {
        if (!question || isSaving) return;
        isSaving = true;
        try {
            const timeSpent = question.time_limit_seconds > 0
                ? question.time_limit_seconds - timeRemaining
                : 0;
            persistCurrentQuestionState();
            const answer = isCoding(question) ? code : (selectedOption || "");
            const isSkipped = !selectedOption && !isCoding(question);
            await quizService.saveAnswer(quizId, question.id, answer, timeSpent, isSkipped);

            const isCorrect = computeIsCorrect(question, answer);
            userAnswers = [...userAnswers.filter(a => a.question_id !== question.id), {
                question_id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
                difficulty: question.difficulty,
                options: question.options,
                correct_answer: question.correct_answer,
                user_answer: answer,
                is_correct: isCorrect,
                is_skipped: isSkipped,
                time_spent_seconds: timeSpent,
            }];
            return true;
        } catch (e) {
            showToast("Failed to save answer", "error");
            return false;
        } finally {
            isSaving = false;
        }
    }

    async function saveAndNext() {
        const saved = await saveCurrentAnswer();
        if (!saved) return;

        try {
            await loadNextQuestion();
        } catch (e) {
            showToast("Failed to save answer", "error");
        }
    }

    async function handlePrimaryAction() {
        if (!question || isSaving) return;

        stopTimer();

        // For coding challenges, run code in the background (fire-and-forget)
        // The result is saved on the backend; the applicant doesn't see it.
        if (isCoding(question) && code.trim()) {
            const details = codingDetails(question);
            const lang = details?.language || "python";
            quizService.runCode(quizId, question.id, lang, code).catch(() => {});
        }

        const saved = await saveCurrentAnswer();
        if (!saved) {
            startTimer();
            return;
        }

        if (isLastQuestion()) {
            await submitQuiz();
            return;
        }

        await loadNextQuestion();
    }


    async function submitQuiz() {
        if (isSubmitting) return;
        isSubmitting = true;
        try {
            await quizService.submitQuiz(quizId);
            resultMessage = "Quiz submitted successfully!";
            showToast("Quiz submitted!", "success");
            submitted = true;

            const correct = userAnswers.filter(a => a.is_correct).length;
            const wrong = userAnswers.filter(a => !a.is_correct && !a.is_skipped).length;
            const skipped = userAnswers.filter(a => a.is_skipped).length;
            const timeSpent = userAnswers.reduce((s, a) => s + (a.time_spent_seconds || 0), 0);
            // Use the quiz's real question count as the denominator, not just the
            // answers saved in THIS session. When a quiz is resumed (reload, new
            // tab, timeout), earlier answers exist only in the backend, so counting
            // only session answers would inflate the score.
            const totalQuestions = Math.max(userAnswers.length, getQuizQuestionCount());
            const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
            quizService.saveQuizResult(quizId, {
                title: quiz?.title || 'Technical Assessment',
                completed_at: new Date().toISOString(),
                score,
                correct_answers: correct,
                total_questions: totalQuestions,
                wrong_answers: wrong,
                skipped,
                time_spent_seconds: timeSpent,
                passing_score: 70,
                passed: score >= 70,
                answers: userAnswers,
            });
        } catch (e) {
            if (e.message && e.message.includes("already completed")) {
                resultMessage = "Quiz was already completed.";
                submitted = true;
            } else {
                showToast("Failed to submit quiz: " + e.message, "error");
            }
        } finally {
            isSubmitting = false;
            disableAntiCheat();
            phase = "finished";
        }
    }

    function goToApplications() {
        stopTimer();
        disableAntiCheat();
        goto("/applications");
    }

    function goToResults() {
        stopTimer();
        disableAntiCheat();
        goto(`/quizzes/${quizId}/result`);
    }

    function selectOption(val) {
        selectedOption = selectedOption === val ? "" : val;
    }

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
    }

    function timerClass() {
        if (!question?.time_limit_seconds || question.time_limit_seconds <= 0) return "";
        if (timeRemaining <= 10) return "border-red-300 bg-red-50 text-red-700";
        if (timeRemaining <= 30) return "border-amber-300 bg-amber-50 text-amber-700";
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    function timerIconClass() {
        if (!question?.time_limit_seconds || question.time_limit_seconds <= 0) return "";
        if (timeRemaining <= 10) return "text-red-500";
        if (timeRemaining <= 30) return "text-amber-600";
        return "text-amber-500";
    }

    onDestroy(() => {
        stopTimer();
        disableAntiCheat();
    });

    onMount(() => {
        waitForAuth();
    });

    async function waitForAuth() {
        if ($auth.loading) {
            const unsub = auth.subscribe(s => {
                if (!s.loading) {
                    unsub();
                    handleAuthResult(s.isAuthenticated);
                }
            });
            return;
        }
        handleAuthResult($auth.isAuthenticated);
    }

    function handleAuthResult(ok) {
        if (!ok) {
            goto("/auth");
            return;
        }
        loadQuiz();
    }

    async function loadQuiz() {
        try {
            quiz = await quizService.getQuiz(quizId);
        } catch {
            // quiz may not exist yet
        }

        try {
            const q = await quizService.getQuestion(quizId);
            if (q && q.status === "finished") {
                const msg = (q.message || "").toLowerCase();
                if (msg.includes("no more questions")) {
                    phase = "ready";
                } else {
                    phase = "finished";
                    resultMessage = q.message || "You've completed this quiz!";
                }
            } else if (q && q.id) {
                question = q;
                questionNumber = 1;
                timeRemaining = q.time_limit_seconds || 0;
                questionHistory = [{ question: q, selectedOption: "", code: "", timeRemaining: q.time_limit_seconds || 0 }];
                historyIndex = 0;
                const details = codingDetails(q);
                if (details?.code_template) {
                    code = details.code_template;
                }
                phase = "active";
                enableAntiCheat("quiz-active");
                startTimer();
                await handleQuizStartAttempt();
            } else {
                phase = "ready";
            }
        } catch {
            phase = "ready";
        }
    }

    async function handleQuizStartAttempt() {
        // Best-effort notify the backend that the client protected front end is
        // active. It does not change scoring or submission behavior.
        try {
            await quizService.markQuizSecurityState(quizId, {
                anti_cheat_active: true,
            });
        } catch (e) {
            const msg = (e && e.message) || "";
            if (!(msg && msg.toLowerCase().includes("not implemented"))) {
                console.warn("Quiz anti-cheat state notification failed:", e);
            }
        }
    }
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        <!-- Loading -->
        {#if phase === "loading"}
            <div class="py-8">
                <SkeletonQuiz />
            </div>

        <!-- Ready / Start Screen -->
        {:else if phase === "ready"}
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
                    <Code2 class="h-10 w-10 text-indigo-600" />
                </div>
                <h1 class="text-2xl font-bold text-slate-800">
                    {quiz?.title || "Technical Assessment"}
                </h1>
                <p class="mx-auto mt-3 max-w-md text-slate-500">
                    You'll be presented with a series of questions to assess your skills.
                    Take your time and answer each question carefully.
                </p>
                <div class="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                    <span class="flex items-center gap-1.5">
                        <BarChart3 class="h-4 w-4" />
                        Mixed difficulty
                    </span>
                    <span class="flex items-center gap-1.5">
                        <Clock class="h-4 w-4" />
                        Per-question timer
                    </span>
                </div>
                <button
                    onclick={startQuiz}
                    class="btn mt-8 gap-2 border-indigo-600 bg-indigo-600 px-8 text-white hover:bg-indigo-700"
                >
                    {#if phase === "starting"}
                        <Loader2 class="h-4 w-4 animate-spin" />
                        Starting...
                    {:else}
                        <Play class="h-4 w-4" />
                        Start Quiz
                    {/if}
                </button>
            </div>

        <!-- Active Question -->
        {:else if phase === "active" && question}
            <div class="space-y-4">
                <!-- Progress -->
                <div class="flex items-center justify-between text-sm text-slate-500">
                    <div class="flex items-center gap-3">
                        <span>Question {questionNumber}</span>
                        {#if question.time_limit_seconds > 0}
                            <span class="badge badge-outline gap-1.5 px-3 py-2 text-xs font-bold {timerClass()}">
                                {#if timeRemaining <= 10}
                                    <Timer class="h-3.5 w-3.5 animate-pulse {timerIconClass()}" />
                                {:else}
                                    <Timer class="h-3.5 w-3.5 {timerIconClass()}" />
                                {/if}
                                {formatTime(timeRemaining)}
                            </span>
                        {:else}
                            <span class="badge badge-outline gap-1 border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-500">
                                <TimerOff class="h-3 w-3" />
                                No limit
                            </span>
                        {/if}
                    </div>
                    <span class="badge {difficultyColor(question.difficulty)} badge-sm">
                        {question.difficulty || "mixed"}
                    </span>
                </div>

                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                        class="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style="width: {Math.min(questionNumber * 10, 100)}%"
                    ></div>
                </div>

                <!-- Question Card -->
                <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
                    <h2 class="text-lg font-semibold leading-relaxed text-slate-800">
                        {question.question_text}
                    </h2>

                    <!-- MCQ Options -->
                    {#if isMcq(question)}
                        <div class="mt-6 space-y-3">
                            {#each optionsList(question) as opt, i}
                                <button
                                    onclick={() => selectOption(optionValue(opt))}
                                    class="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all {selectedOption === optionValue(opt)
                                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}"
                                >
                                    <span
                                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold {selectedOption === optionValue(opt)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600'}"
                                    >
                                        {optionLetter(opt) || String.fromCharCode(65 + i)}
                                    </span>
                                    <span class="text-sm text-slate-700">{optionText(opt)}</span>
                                </button>
                            {/each}
                        </div>

                    <!-- Coding Challenge -->
                    {:else if isCoding(question)}
                        {@const details = codingDetails(question)}
                        {#if details?.language}
                            <div class="mt-4">
                                <span class="badge badge-outline gap-1 border-slate-300 bg-slate-100 text-xs text-slate-600">
                                    <Terminal class="h-3 w-3" />
                                    {details.language}
                                </span>
                                {#if details.execution_time_limit}
                                    <span class="badge badge-outline ml-2 border-slate-300 bg-slate-100 text-xs text-slate-600">
                                        <Clock class="h-3 w-3" />
                                        {details.execution_time_limit}ms
                                    </span>
                                {/if}
                            </div>
                        {/if}

                        <div class="mt-4">
                            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Your Solution
                            </label>
                            <div class="mt-2 rounded-xl border border-slate-200 overflow-hidden">
                                <CodeEditor
                                    bind:value={code}
                                    language={codingDetails(question)?.language || 'python'}
                                    height="18rem"
                                    placeholder="Write your solution here..."
                                    onrun={handlePrimaryAction}
                                />
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400">Next saves your answer. Blank answers are treated as skipped.</span>
                    <div class="flex gap-2">
                        <button
                            onclick={handlePrimaryAction}
                            disabled={isSaving}
                            class="btn btn-sm gap-1.5 border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {#if isSaving}
                                <Loader2 class="h-3.5 w-3.5 animate-spin" />
                                Saving...
                            {:else if isLastQuestion()}
                                <Send class="h-3.5 w-3.5" />
                                Submit Quiz
                            {:else}
                                Next
                                <ChevronRight class="h-3.5 w-3.5" />
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

        <!-- Finished / Submit Screen -->
        {:else if phase === "finished"}
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
                    <CheckCircle2 class="h-10 w-10 text-emerald-600" />
                </div>
                <h1 class="text-2xl font-bold text-slate-800">Quiz Complete!</h1>
                <p class="mt-3 text-slate-500">
                    {resultMessage || "Your answers have been submitted for review."}
                </p>
                <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    {#if !submitted}
                        <button
                            onclick={submitQuiz}
                            disabled={isSubmitting}
                            class="btn gap-2 border-indigo-600 bg-indigo-600 px-8 text-white hover:bg-indigo-700"
                        >
                            {#if isSubmitting}
                                <Loader2 class="h-4 w-4 animate-spin" />
                                Submitting...
                            {:else}
                                <Send class="h-4 w-4" />
                                Submit Quiz
                            {/if}
                        </button>
                    {/if}
                    {#if submitted}
                        <button
                            onclick={goToResults}
                            class="btn gap-2 border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            <BarChart3 class="h-4 w-4" />
                            View Results
                        </button>
                    {/if}
                    <button
                        onclick={goToApplications}
                        class="btn gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft class="h-4 w-4" />
                        Back to Applications
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
