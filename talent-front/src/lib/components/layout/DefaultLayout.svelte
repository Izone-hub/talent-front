<script>
    import Navbar from "./Navbar.svelte";
    import Footer from "./Footer.svelte";
    import Toast from "$lib/components/ui/toast.svelte";
    import { setContext } from "svelte";

    let x = 0;
    let y = 0;
    let glowActive = false;

    /** @param {MouseEvent} e */
    function handleMouseMove(e) {
        if (!glowActive) return;
        x = e.clientX;
        y = e.clientY;
    }

    setContext(
        "setGlow",
        /** @param {boolean} value */ (value) => {
            glowActive = value;
        },
    );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="bgGrid bgGradient cursor-glow flex min-h-screen flex-col"
    class:glow-active={glowActive}
    on:mousemove={handleMouseMove}
    style="--x: {x}px; --y: {y}px;"
>
    <Navbar />

    <main class="relative z-10 grow">
        <slot />
        <Toast />
    </main>

    <Footer />
</div>

<style>
    /* You might need to move some styles here if they were in layout.css and you only want them here */
</style>
