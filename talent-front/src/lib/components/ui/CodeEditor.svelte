<script>
    import { onMount } from "svelte";
    import CodeMirror from "svelte-codemirror-editor";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { EditorView } from "@codemirror/view";
    import { javascript } from "@codemirror/lang-javascript";
    import { python } from "@codemirror/lang-python";
    import { go } from "@codemirror/lang-go";
    import { java } from "@codemirror/lang-java";
    import { cpp } from "@codemirror/lang-cpp";
    import { rust } from "@codemirror/lang-rust";
    import { sql } from "@codemirror/lang-sql";

    let {
        value = $bindable(""),
        language = "python",
        placeholder = "Write your code here...",
        height = "16rem",
        disabled = false,
        disableClipboard = false,
        onkeydown = null,
        onrun = null,
    } = $props();

    const LANG_MAP = {
        python: () => python(),
        javascript: () => javascript(),
        typescript: () => javascript({ typescript: true }),
        jsx: () => javascript({ jsx: true }),
        tsx: () => javascript({ jsx: true, typescript: true }),
        go: () => go(),
        java: () => java(),
        cpp: () => cpp(),
        c: () => cpp(),
        cplusplus: () => cpp(),
        rust: () => rust(),
        ruby: null, // no CodeMirror package; falls back to no highlighting
        dart: null,
        sql: () => sql(),
    };

    let langExtension = $derived.by(() => {
        const factory = LANG_MAP[language] ?? LANG_MAP["python"];
        return factory ? factory() : [];
    });

    let clipboardExtension = $derived.by(() => {
        if (!disableClipboard) return [];
        return EditorView.domEventHandlers({
            paste(event) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            },
            copy(event) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            },
            cut(event) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            },
            drop(event) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            },
            keydown(event) {
                const mod = event.ctrlKey || event.metaKey;
                const key = (event.key || "").toLowerCase();
                if (mod && (key === "c" || key === "x" || key === "v")) {
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                }
                if ((event.ctrlKey && key === "insert") || (event.shiftKey && key === "insert")) {
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                }
                return false;
            },
        });
    });

    const customTheme = EditorView.theme({
        "&": {
            height: height,
            fontSize: "14px",
        },
        ".cm-scroller": {
            fontFamily:
                "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            overflow: "auto",
        },
        ".cm-gutters": {
            backgroundColor: "#0d1117",
            borderRight: "1px solid #21262d",
            color: "#484f58",
        },
        ".cm-activeLineGutter": {
            backgroundColor: "#161b22",
        },
        ".cm-activeLine": {
            backgroundColor: "#161b2244",
        },
        ".cm-cursor": {
            borderLeftColor: "#e6edf3",
            borderLeftWidth: "2px",
        },
        ".cm-selectionBackground": {
            backgroundColor: "#264f78 !important",
        },
        "&.cm-focused .cm-selectionBackground": {
            backgroundColor: "#264f78 !important",
        },
    });

    function handleKeydown(e) {
        if (disableClipboard) {
            const mod = e.ctrlKey || e.metaKey;
            const key = (e.key || "").toLowerCase();
            if (mod && (key === "c" || key === "x" || key === "v")) {
                e.preventDefault();
                e.stopPropagation();
            }
            if ((e.ctrlKey && key === "insert") || (e.shiftKey && key === "insert")) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        if (onkeydown) onkeydown(e);
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (onrun) {
                e.preventDefault();
                onrun();
            }
        }
    }
</script>

<div
    class="codemirror-wrapper"
    onkeydown={handleKeydown}
    oncopy={(e) => { if (disableClipboard) { e.preventDefault(); e.stopPropagation(); } }}
    oncut={(e) => { if (disableClipboard) { e.preventDefault(); e.stopPropagation(); } }}
    onpaste={(e) => { if (disableClipboard) { e.preventDefault(); e.stopPropagation(); } }}
    ondrop={(e) => { if (disableClipboard) { e.preventDefault(); e.stopPropagation(); } }}
>
    <CodeMirror
        bind:value
        lang={langExtension}
        theme={oneDark}
        extensions={[customTheme, clipboardExtension]}
        {placeholder}
        editable={!disabled}
        readonly={disabled}
        lineNumbers={true}
        tabSize={4}
        useTab={true}
        indentOnInput={true}
        bracketMatching={true}
        closeBrackets={true}
        autocompletion={false}
        highlightSelectionMatches={false}
        foldGutter={false}
    />
</div>

<style>
    .codemirror-wrapper {
        border-radius: 0.75rem;
        overflow: hidden;
        border: 1px solid #30363d;
        user-select: text;
    }

    .codemirror-wrapper :global(.cm-editor) {
        border-radius: 0.75rem;
    }

    .codemirror-wrapper :global(.cm-editor.cm-focused) {
        outline: none;
    }
</style>
