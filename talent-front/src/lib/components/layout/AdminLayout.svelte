<script>
    import AdminSidebar from "./AdminSidebar.svelte";
    import { onMount, setContext } from "svelte";

    let isSidebarOpen = true;

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    // Close sidebar on mobile by default
    onMount(() => {
        if (window.innerWidth < 768) {
            isSidebarOpen = false;
        }
    });

    // Lets the per-page header render the mobile sidebar toggle button.
    setContext("toggleAdminSidebar", toggleSidebar);
</script>

<!--
    Admin app shell: the sidebar owns a fixed-width column on the left and the
    right side holds the page content. Each admin page starts with its own
    <AdminPageHeader /> (logo + title + actions) which acts as the single top
    header of this column — the layout adds no second header/logo bar on top.
    The header sticks to the top of the scrolling content area, so it always
    stays to the right of the sidebar and never overlaps it.
-->
<div class="flex h-screen overflow-hidden bg-gray-50 p-8">
    <AdminSidebar bind:isOpen={isSidebarOpen} />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main class="relative flex-1 overflow-y-auto px-6 pb-6">
            <slot />
        </main>
    </div>
</div>
