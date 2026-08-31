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
        if (onkeydown) onkeydown(e);
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (onrun) {
                e.preventDefault();
                onrun();
            }
        }
    }
</script>

<div class="codemirror-wrapper" onkeydown={handleKeydown}>
    <CodeMirror
        bind:value
        lang={langExtension}
        theme={oneDark}
        extensions={[customTheme]}
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
    }

    .codemirror-wrapper :global(.cm-editor) {
        border-radius: 0.75rem;
    }

    .codemirror-wrapper :global(.cm-editor.cm-focused) {
        outline: none;
    }
</style>
