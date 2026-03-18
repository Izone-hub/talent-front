<script>
    import { page } from "$app/stores";
    import { ADMIN_NAVIGATION_LINKS } from "$lib/constants/navigation";
    import * as Icons from "lucide-svelte";
    import { ChevronRight, LogOut } from "lucide-svelte";
    import { auth } from "$lib/stores/authStore";

    export let isOpen = true;
</script>

<aside
    class="fixed inset-y-0 left-0 z-50 w-64 transform bg-[#000000] text-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 rounded-lg"
    class:-translate-x-full={!isOpen}
>
    <div class="flex h-full flex-col">
        <!-- Sidebar Header -->
        <div class="flex h-16 items-center border-b border-gray-800 px-6">
            <span class="text-xl font-bold tracking-tight">
                <span class="text-purple-400">iZone</span> Hub
            </span>
        </div>

        <!-- Navigation Links -->
        <nav class="mt-6 flex-1 px-4 space-y-1">
            {#each ADMIN_NAVIGATION_LINKS as link}
                {@const Icon = Icons[link.icon]}
                <a
                    href={link.path}
                    class="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200"
                    class:bg-purple-600={$page.url.pathname.startsWith(
                        link.path,
                    )}
                    class:text-white={$page.url.pathname.startsWith(link.path)}
                    class:bg-transparent={!$page.url.pathname.startsWith(
                        link.path,
                    )}
                    class:text-gray-400={!$page.url.pathname.startsWith(
                        link.path,
                    )}
                    class:hover:bg-gray-800={!$page.url.pathname.startsWith(
                        link.path,
                    )}
                    class:hover:text-white={!$page.url.pathname.startsWith(
                        link.path,
                    )}
                >
                    <div class="flex items-center gap-3">
                        {#if Icon}
                            <svelte:component this={Icon} size={20} />
                        {/if}
                        <span class="text-sm font-medium">{link.name}</span>
                    </div>
                    {#if $page.url.pathname.startsWith(link.path)}
                        <ChevronRight size={14} />
                    {/if}
                </a>
            {/each}
        </nav>

        <!-- Sidebar Footer -->
        <div class="border-t border-gray-800 p-4">
            <button
                on:click={() => auth.logout()}
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    </div>
</aside>

<!-- Mobile Overlay -->
{#if isOpen}
    <button
        class="fixed inset-0 z-40 bg-black/50 md:hidden"
        on:click={() => (isOpen = false)}
        aria-label="Close sidebar"
    ></button>
{/if}
