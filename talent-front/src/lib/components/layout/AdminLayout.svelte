<script>
    import AdminSidebar from "./AdminSidebar.svelte";
    import AdminNavbar from "./AdminNavbar.svelte";
    import { onMount } from "svelte";

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
</script>

<div class="flex h-screen overflow-hidden bg-gray-50 p-8">
    <AdminSidebar bind:isOpen={isSidebarOpen} />

    <div class="flex flex-1 flex-col overflow-y-auto">
        <!-- <AdminNavbar {toggleSidebar} /> -->

        <main class="relative p-6">
            <slot />
        </main>
    </div>
</div>
