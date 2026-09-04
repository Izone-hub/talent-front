<script>
    import IZoneLogo from "$lib/assets/icons/IZone-logo.png";
    import { getContext } from "svelte";

    let { title = "", subtitle = "" } = $props();

    // Provided by AdminLayout so the mobile sidebar drawer can still be opened
    // now that the separate top navbar is gone. Only rendered below md.
    const toggleSidebar = getContext("toggleAdminSidebar");
</script>

<!--
    Single top header for the admin content area. It is sticky at the very top
    of the scrollable content column (which the shared AdminLayout places to
    the right of the sidebar), so it never covers the sidebar and pages don't
    need a separate header bar above it.
-->
<div class="sticky top-0 z-30 bg-gray-50 border-b border-gray-100">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[56px] px-4 sm:px-6 lg:px-8 py-4">
        <div class="min-h-[48px] flex items-center gap-3">
            {#if toggleSidebar}
                <button
                    class="btn btn-ghost btn-circle btn-sm md:hidden"
                    onclick={() => toggleSidebar()}
                    aria-label="Toggle Sidebar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h7"
                        />
                    </svg>
                </button>
            {/if}
            <img src={IZoneLogo} alt="IZone Logo" class="h-8 w-auto shrink-0" />
            <div class="flex flex-col justify-center">
                <h1 class="text-xl font-semibold text-gray-900 tracking-tight truncate">{title}</h1>
                {#if subtitle}
                    <p class="text-gray-500 mt-0.5 text-sm truncate">{subtitle}</p>
                {:else}
                    <div class="h-5"></div>
                {/if}
            </div>
        </div>
        <div class="shrink-0 flex items-center gap-2">
            <slot />
        </div>
    </div>
</div>
