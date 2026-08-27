<script>
    import { onMount } from "svelte";
    import { Play, Terminal, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, Clock, FunctionSquare } from "lucide-svelte";
    import { sandboxService } from "$lib/api/sandbox.service";
    import { showToast } from "$lib/stores/toast";

    let languages = [];
    let selectedLanguage = "python";
    let code = "";
    let stdin = "";
    let output = null;
    let running = false;
    let showStdin = false;
    let detectedFunctions = [];
    let selectedFunction = null;
    let testCases = "[]";
    let parsing = false;

    // Framework mode state
    let frameworkFiles = {};
    let activeFile = "";

    const standardTemplates = {
        python: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
        javascript: `function main() {\n    console.log("Hello, World!");\n}\n\nmain();\n`,
        typescript: `function main(): void {\n    console.log("Hello, World!");\n}\n\nmain();\n`,
        go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
        java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
        cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
        c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
        rust: `fn main() {\n    println!("Hello, World!");\n}\n`,
        ruby: `puts "Hello, World!"\n`,
        dart: `void main() {\n  print('Hello, World!');\n}\n`,
        sql: `-- Runs against an in-memory SQLite database\nCREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO users (name) VALUES ('Ada'), ('Linus');\n\nSELECT * FROM users;\n`,
    };

    const frameworkStarters = {
        react: [
            {
                path: "src/App.jsx",
                content: `import { useState } from 'react'\n\nexport default function App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <div>\n      <h1>Hello, Sandbox!</h1>\n      <button data-testid="inc" onClick={() => setCount(count + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  )\n}\n`,
            },
            {
                path: "src/App.test.jsx",
                content: `import { describe, expect, it } from 'vitest'\nimport { fireEvent, render, screen } from '@testing-library/react'\nimport App from './App'\n\ndescribe('App', () => {\n  it('increments the counter', async () => {\n    render(<App />)\n    expect(screen.getByTestId('count').textContent).toBe('Count: 0')\n    await fireEvent.click(screen.getByTestId('inc'))\n    expect(screen.getByTestId('count').textContent).toBe('Count: 1')\n  })\n})\n`,
            },
        ],
        vue: [
            {
                path: "src/HelloWorld.vue",
                content: `<script setup>\nimport { ref } from 'vue'\n\nconst count = ref(0)\n<\/script>\n\n<template>\n  <div>\n    <h1>Hello, Sandbox!</h1>\n    <p data-testid="count">Count: {{ count }}</p>\n    <button data-testid="inc" @click="count++">Increment</button>\n  </div>\n</template>\n`,
            },
            {
                path: "tests/HelloWorld.test.js",
                content: `import { describe, expect, it } from 'vitest'\nimport { mount } from '@vue/test-utils'\nimport HelloWorld from '../src/HelloWorld.vue'\n\ndescribe('HelloWorld', () => {\n  it('increments the counter', async () => {\n    const wrapper = mount(HelloWorld)\n    await wrapper.find('[data-testid="inc"]').trigger('click')\n    expect(wrapper.find('[data-testid="count"]').text()).toContain('Count: 1')\n  })\n})\n`,
            },
        ],
        svelte: [
            {
                path: "src/App.svelte",
                content: `<script>\n  let count = 0\n<\/script>\n\n<main>\n  <h1>Hello, Sandbox!</h1>\n  <p data-testid="count">Count: {count}</p>\n  <button data-testid="inc" on:click={() => count++}>Increment</button>\n</main>\n`,
            },
            {
                path: "src/App.test.js",
                content: `import { describe, expect, it } from 'vitest'\nimport { fireEvent, render, screen } from '@testing-library/svelte'\nimport App from './App.svelte'\n\ndescribe('App', () => {\n  it('increments the counter', async () => {\n    render(App)\n    expect(screen.getByTestId('count').textContent).toBe('Count: 0')\n    await fireEvent.click(screen.getByTestId('inc'))\n    expect(screen.getByTestId('count').textContent).toBe('Count: 1')\n  })\n})\n`,
            },
        ],
        express: [
            {
                path: "src/app.js",
                content: `const express = require('express')\n\nconst app = express()\napp.use(express.json())\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'ok' })\n})\n\napp.post('/api/sum', (req, res) => {\n  const { a, b } = req.body || {}\n  if (typeof a !== 'number' || typeof b !== 'number') {\n    return res.status(400).json({ error: 'a and b must be numbers' })\n  }\n  res.json({ result: a + b })\n})\n\nmodule.exports = app\n`,
            },
            {
                path: "tests/app.test.js",
                content: `import { describe, expect, it } from 'vitest'\nimport request from 'supertest'\nimport app from '../src/app.js'\n\ndescribe('API', () => {\n  it('GET /health returns ok', async () => {\n    const res = await request(app).get('/health')\n    expect(res.status).toBe(200)\n    expect(res.body.status).toBe('ok')\n  })\n\n  it('POST /api/sum adds two numbers', async () => {\n    const res = await request(app).post('/api/sum').send({ a: 2, b: 3 })\n    expect(res.body.result).toBe(5)\n  })\n})\n`,
            },
        ],
        nextjs: [
            {
                path: "components/Greeting.jsx",
                content: `'use client'\n\nimport { useState } from 'react'\n\nexport default function Greeting({ name = 'World' }) {\n  const [visited, setVisited] = useState(false)\n\n  return (
    <div>\n      <p data-testid="greeting">Hello, {name}!</p>\n      <button data-testid="visit" onClick={() => setVisited(!visited)}>\n        {visited ? 'Visited' : 'Not visited'}\n      </button>\n    </div>\n  )\n}\n`,
            },
            {
                path: "__tests__/Greeting.test.jsx",
                content: `import { describe, expect, it } from 'vitest'\nimport { fireEvent, render, screen } from '@testing-library/react'\nimport Greeting from '../components/Greeting'\n\ndescribe('Greeting', () => {\n  it('greets the given name', () => {\n    render(<Greeting name="Ada" />)\n    expect(screen.getByText('Hello, Ada!')).toBeTruthy()\n  })\n\n  it('toggles visited state', async () => {\n    render(<Greeting />)\n    await fireEvent.click(screen.getByTestId('visit'))\n    expect(screen.getByText('Visited')).toBeTruthy()\n  })\n})\n`,
            },
        ],
        flutter: [
            {
                path: "lib/main.dart",
                content: `import 'package:flutter/material.dart';\n\nvoid main() => runApp(const CounterApp());\n\nclass CounterApp extends StatelessWidget {\n  const CounterApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return const MaterialApp(home: CounterPage());\n  }\n}\n\nclass CounterPage extends StatefulWidget {\n  const CounterPage({super.key});\n\n  @override\n  State<CounterPage> createState() => _CounterPageState();\n}\n\nclass _CounterPageState extends State<CounterPage> {\n  int _count = 0;\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      body: Center(\n        child: Text('$_count', key: const Key('counter')),\n      ),\n      floatingActionButton: FloatingActionButton(\n        key: const Key('increment'),\n        onPressed: () => setState(() => _count++),\n        child: const Icon(Icons.add),\n      ),\n    );\n  }\n}\n`,
            },
            {
                path: "test/widget_test.dart",
                content: `import 'package:flutter/material.dart';\nimport 'package:flutter_test/flutter_test.dart';\n\nimport 'package:sandbox_flutter/main.dart';\n\nvoid main() {\n  testWidgets('counter increments', (WidgetTester tester) async {\n    await tester.pumpWidget(const CounterApp());\n\n    expect(tester.widget<Text>(find.byKey(const Key('counter'))).data, '0');\n\n    await tester.tap(find.byKey(const Key('increment')));\n    await tester.pump();\n\n    expect(tester.widget<Text>(find.byKey(const Key('counter'))).data, '1');\n  });\n}\n`,
            },
        ],
    };

    // Languages whose AST parsing is supported by the backend
    const parsableLanguages = new Set(["python", "javascript", "typescript"]);

    onMount(async () => {
        try {
            languages = await sandboxService.getLanguages();
        } catch (error) {
            showToast("Failed to load languages", "error");
        }
        code = standardTemplates.python;
    });

    $: selectedLang = languages.find((l) => l.id === selectedLanguage);
    $: isFrameworkMode = selectedLang?.type === "framework";
    $: isParsable = parsableLanguages.has(selectedLanguage);
    $: standardLangs = languages.filter((l) => l.type !== "framework");
    $: frameworkLangs = languages.filter((l) => l.type === "framework");
    $: lineCount = ((isFrameworkMode ? frameworkFiles[activeFile] : code) || "").split("\n").length;
    $: exitCode = output?.exitCode;
    $: hasOutput = output && (output.stdout || output.stderr || output.error);

    function handleLanguageChange() {
        // Derive mode from the freshly selected value rather than the
        // reactive flag, which may not have recalculated yet.
        const lang = languages.find((l) => l.id === selectedLanguage);
        const fwMode = lang?.type === "framework";
        output = null;
        detectedFunctions = [];
        selectedFunction = null;
        showStdin = false;
        if (fwMode) {
            const starter = frameworkStarters[selectedLanguage] || [];
            frameworkFiles = Object.fromEntries(starter.map((f) => [f.path, f.content]));
            activeFile = starter.length > 0 ? starter[0].path : "";
        } else {
            code = standardTemplates[selectedLanguage] || "";
            frameworkFiles = {};
            activeFile = "";
        }
    }

    async function parseCode() {
        if (!code.trim()) return;
        parsing = true;
        try {
            const result = await sandboxService.parse(selectedLanguage, code);
            detectedFunctions = result?.functions || [];
            if (detectedFunctions.length > 0) {
                selectedFunction = detectedFunctions[0];
                showToast(`Found ${detectedFunctions.length} function(s)`, "success");
            } else {
                showToast("No functions found", "info");
            }
        } catch (error) {
            showToast("Failed to parse code", "error");
        } finally {
            parsing = false;
        }
    }

    async function runCode() {
        if (isFrameworkMode) {
            return runFramework();
        }
        if (!code.trim()) {
            showToast("Please enter some code", "error");
            return;
        }
        running = true;
        output = null;
        try {
            output = await sandboxService.execute(selectedLanguage, code, stdin);
        } catch (error) {
            output = {
                stderr: "",
                stdout: "",
                exitCode: -1,
                timeMs: 0,
                error: error.message || "Failed to execute code",
            };
        } finally {
            running = false;
        }
    }

    async function runFramework() {
        running = true;
        output = null;
        try {
            output = await sandboxService.executeFramework(selectedLanguage, frameworkFiles);
        } catch (error) {
            output = {
                stderr: "",
                stdout: "",
                exitCode: -1,
                timeMs: 0,
                error: error.message || "Failed to execute framework tests",
            };
        } finally {
            running = false;
        }
    }

    async function runTest() {
        if (!code.trim() || !selectedFunction) {
            showToast("Please parse code and select a function", "error");
            return;
        }
        running = true;
        output = null;
        try {
            const cases = JSON.parse(testCases);
            output = await sandboxService.executeFunction(selectedLanguage, code, cases);
        } catch (error) {
            output = {
                stderr: "",
                stdout: "",
                exitCode: -1,
                timeMs: 0,
                error: error.message || "Failed to execute test",
            };
        } finally {
            running = false;
        }
    }

    function handleKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            runCode();
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const inserted = textarea.value.substring(0, start) + "    " + textarea.value.substring(end);
            if (isFrameworkMode) {
                frameworkFiles[activeFile] = inserted;
                frameworkFiles = frameworkFiles;
            } else {
                code = inserted;
            }
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            });
        }
    }
</script>

<div class="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col">
    <!-- Header -->
    <div class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-500/10 rounded-lg">
                <Terminal size={20} class="text-indigo-400" />
            </div>
            <div>
                <h1 class="text-white font-bold text-lg tracking-tight">Code Compiler</h1>
                <p class="text-slate-500 text-xs font-medium">Write, compile, and run code instantly</p>
            </div>
            {#if isFrameworkMode}
                <span class="hidden md:inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Framework Mode
                </span>
            {/if}
        </div>
        <div class="flex items-center gap-3">
            <div class="relative">
                <select
                    bind:value={selectedLanguage}
                    onchange={handleLanguageChange}
                    class="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                    {#if standardLangs.length > 0}
                        <optgroup label="Languages">
                            {#each standardLangs as lang}
                                <option value={lang.id}>{lang.name}</option>
                            {/each}
                        </optgroup>
                    {/if}
                    {#if frameworkLangs.length > 0}
                        <optgroup label="Frameworks">
                            {#each frameworkLangs as lang}
                                <option value={lang.id}>{lang.name}</option>
                            {/each}
                        </optgroup>
                    {/if}
                </select>
                <ChevronDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
                onclick={runCode}
                disabled={running || !code.trim()}
                class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
                {#if running}
                    <Loader2 size={16} class="animate-spin" />
                    {isFrameworkMode ? "Testing..." : "Running..."}
                {:else}
                    <Play size={16} fill="currentColor" />
                    {isFrameworkMode ? "Run Tests" : "Run"}
                {/if}
            </button>
            <span class="text-slate-600 text-xs font-medium hidden sm:block">Ctrl+Enter</span>
        </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col lg:flex-row min-h-0">
        <!-- Code Editor -->
        <div class="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div class="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex-shrink-0">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isFrameworkMode ? "Project Files" : "Editor"}
                </span>
                <div class="flex items-center gap-2">
                    {#if isParsable && !isFrameworkMode}
                        <button
                            onclick={parseCode}
                            disabled={parsing || !code.trim()}
                            class="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                        >
                            {#if parsing}
                                <Loader2 size={12} class="animate-spin" />
                            {:else}
                                <FunctionSquare size={12} />
                            {/if}
                            Parse Functions
                        </button>
                    {/if}
                    <span class="text-xs text-slate-600 font-mono">{lineCount} lines</span>
                </div>
            </div>
            {#if isFrameworkMode}
                <!-- Framework: file tabs -->
                <div class="flex items-stretch overflow-x-auto bg-slate-900/50 border-b border-slate-800 flex-shrink-0">
                    {#each Object.keys(frameworkFiles) as path}
                        <button
                            onclick={() => (activeFile = path)}
                            class="px-4 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors {activeFile === path
                                ? 'border-indigo-500 text-indigo-300 bg-slate-800/50'
                                : 'border-transparent text-slate-500 hover:text-slate-300'}"
                        >
                            {path}
                        </button>
                    {/each}
                </div>
                <div class="flex-1 flex min-h-0 relative">
                    <textarea
                        bind:value={frameworkFiles[activeFile]}
                        onkeydown={handleKeydown}
                        spellcheck="false"
                        autocomplete="off"
                        class="flex-1 bg-slate-950 text-slate-200 font-mono text-sm leading-5 p-4 resize-none focus:outline-none placeholder:text-slate-700"
                        placeholder="Edit project files..."
                    ></textarea>
                </div>
            {:else}
                <div class="flex-1 flex min-h-0 relative">
                    <div class="flex-shrink-0 bg-slate-900 border-r border-slate-800 px-3 py-4 text-right select-none overflow-hidden">
                        {#each Array(lineCount) as _, i}
                            <div class="text-slate-600 text-xs font-mono leading-5">{i + 1}</div>
                        {/each}
                    </div>
                    <textarea
                        bind:value={code}
                        onkeydown={handleKeydown}
                        spellcheck="false"
                        autocomplete="off"
                        class="flex-1 bg-slate-950 text-slate-200 font-mono text-sm leading-5 p-4 resize-none focus:outline-none placeholder:text-slate-700"
                        placeholder="Write your code here..."
                    ></textarea>
                </div>
            {/if}
        </div>

        <!-- Right Panel -->
        <div class="lg:w-[420px] flex flex-col min-h-0 flex-shrink-0">
            <!-- Function Selector (shown when functions are detected) -->
            {#if detectedFunctions.length > 0}
                <div class="border-b border-slate-800 flex-shrink-0">
                    <div class="flex items-center justify-between px-4 py-2 bg-slate-900/50">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Detected Functions</span>
                        <span class="text-xs text-slate-600">{detectedFunctions.length} found</span>
                    </div>
                    <div class="p-3 bg-slate-900/30">
                        <div class="flex flex-wrap gap-2">
                            {#each detectedFunctions as fn}
                                <button
                                    onclick={() => selectedFunction = fn}
                                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors {selectedFunction?.name === fn.name
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}"
                                >
                                    {fn.name}({fn.args.join(", ")})
                                </button>
                            {/each}
                        </div>
                        {#if selectedFunction}
                            <div class="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div class="text-xs text-slate-400 mb-2">
                                    <span class="text-slate-500">Selected:</span>
                                    <span class="text-indigo-300 font-mono">{selectedFunction.name}</span>
                                </div>
                                <div class="text-xs text-slate-500 mb-2">
                                    Arguments: {selectedFunction.args.length > 0 ? selectedFunction.args.join(", ") : "none"}
                                </div>
                                <div class="text-xs text-slate-500 mb-3">
                                    Lines: {selectedFunction.startLine} - {selectedFunction.endLine}
                                </div>
                                <div class="mb-2">
                                    <label class="text-xs text-slate-500 block mb-1">Test Cases (JSON)</label>
                                    <textarea
                                        bind:value={testCases}
                                        spellcheck="false"
                                        class="w-full bg-slate-900 text-slate-300 font-mono text-xs leading-5 p-2 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                                        placeholder={'[{"args": [1, 2], "expected": 3}]'}
                                    ></textarea>
                                </div>
                                <button
                                    onclick={runTest}
                                    disabled={running}
                                    class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                                >
                                    {#if running}
                                        <Loader2 size={14} class="animate-spin" />
                                        Testing...
                                    {:else}
                                        Run Tests
                                    {/if}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Standard Input -->
            {#if !isFrameworkMode}
                <button
                    onclick={() => (showStdin = !showStdin)}
                    class="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors flex-shrink-0"
                >
                    <span>Standard Input</span>
                    {#if showStdin}
                        <ChevronUp size={14} />
                    {:else}
                        <ChevronDown size={14} />
                    {/if}
                </button>
                {#if showStdin}
                    <div class="border-b border-slate-800 flex-shrink-0">
                        <textarea
                            bind:value={stdin}
                            spellcheck="false"
                            class="w-full bg-slate-900 text-slate-300 font-mono text-xs leading-5 p-4 resize-none focus:outline-none h-24 placeholder:text-slate-700"
                            placeholder="Input data (optional)..."
                        ></textarea>
                    </div>
                {/if}
            {/if}

            <!-- Output -->
            <div class="flex items-center px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex-shrink-0">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Output</span>
                {#if hasOutput}
                    <div class="ml-auto flex items-center gap-3">
                        {#if output?.passed === true}
                            <span class="flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 size={12} />
                                All tests passed
                            </span>
                        {:else if output?.passed === false}
                            <span class="flex items-center gap-1 text-xs font-bold text-rose-400">
                                <AlertCircle size={12} />
                                Tests failed
                            </span>
                        {/if}
                        {#if exitCode !== undefined && exitCode !== null}
                            <span class="flex items-center gap-1 text-xs font-bold {exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                {#if exitCode === 0}
                                    <CheckCircle2 size={12} />
                                {:else}
                                    <AlertCircle size={12} />
                                {/if}
                                Exit: {exitCode}
                            </span>
                        {/if}
                        {#if output?.timeMs}
                            <span class="flex items-center gap-1 text-xs text-slate-500 font-mono">
                                <Clock size={11} />
                                {output.timeMs}ms
                            </span>
                        {/if}
                    </div>
                {/if}
            </div>
            <div class="flex-1 overflow-auto bg-slate-950 min-h-0">
                {#if running}
                    <div class="flex items-center justify-center h-full">
                        <div class="flex flex-col items-center gap-3">
                            <Loader2 size={24} class="animate-spin text-indigo-400" />
                            <span class="text-slate-500 text-sm font-medium">Executing code...</span>
                        </div>
                    </div>
                {:else if hasOutput}
                    <div class="p-4 space-y-3">
                        {#if output.error}
                            <div class="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                                <div class="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                                    <AlertCircle size={12} />
                                    Error
                                </div>
                                <pre class="text-rose-300 text-xs font-mono whitespace-pre-wrap break-words">{output.error}</pre>
                            </div>
                        {/if}
                        {#if output.stderr}
                            <div class="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                                <div class="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                                    <AlertCircle size={12} />
                                    stderr
                                </div>
                                <pre class="text-rose-300 text-xs font-mono whitespace-pre-wrap break-words">{output.stderr}</pre>
                            </div>
                        {/if}
                        {#if output.stdout}
                            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                                    <CheckCircle2 size={12} />
                                    stdout
                                </div>
                                <pre class="text-emerald-300 text-xs font-mono whitespace-pre-wrap break-words">{output.stdout}</pre>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center">
                            <Terminal size={32} class="mx-auto text-slate-700 mb-2" />
                            <p class="text-slate-600 text-sm font-medium">
                                {isFrameworkMode ? "Run tests to see output" : "Run your code to see output"}
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    textarea::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    textarea::-webkit-scrollbar-track {
        background: transparent;
    }
    textarea::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 4px;
    }
    textarea::-webkit-scrollbar-thumb:hover {
        background: #475569;
    }
</style>