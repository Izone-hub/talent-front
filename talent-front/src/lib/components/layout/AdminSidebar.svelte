<script>
    import { page } from "$app/stores";
    import { ADMIN_NAVIGATION_LINKS } from "$lib/constants/navigation";
    import * as Icons from "lucide-svelte";
    import { ChevronRight, LogOut, ShieldCheck } from "lucide-svelte";
    import { auth } from "$lib/stores/authStore";

    export let isOpen = true;

    const user = $auth.user || {};

    // Track the current route in a reactive statement. The template reads
    // currentPath directly (never behind a function call) so Svelte re-renders
    // the highlight when the user navigates between admin tabs.
    let currentPath = $page.url.pathname;
    $: currentPath = $page.url.pathname;

    function getInitials(name) {
        if (!name) return "A";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function handleNavClick() {
        // On phones the drawer should collapse after picking a destination.
        if (window.innerWidth < 768) isOpen = false;
    }
</script>

<!--
    Dark gradient admin sidebar. Sits in its own column on desktop (the shared
    AdminLayout puts it to the left of the scrollable content area) and slides
    in as a drawer on small screens with the overlay below it.
-->
<aside
    class="fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col overflow-hidden text-white shadow-2xl shadow-purple-950/40 transition-transform duration-300 ease-in-out rounded-r-2xl md:static md:translate-x-0 md:rounded-2xl"
    class:-translate-x-full={!isOpen}
>
    <div
        class="relative flex h-full min-h-0 flex-col"
        style="background:
            radial-gradient(1100px 520px at -10% -20%, rgba(168, 85, 247, 0.22), transparent 60%),
            radial-gradient(900px 480px at 120% 110%, rgba(79, 70, 229, 0.16), transparent 55%),
            linear-gradient(180deg, #161030 0%, #0b0720 55%, #050310 100%);"
    >
        <!-- Decorative glows -->
        <div class="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-purple-600/15 blur-3xl"></div>
        <div class="pointer-events-none absolute -left-14 bottom-24 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <!-- ===================== Sidebar Header ===================== -->
        <div class="relative z-10 flex items-center gap-3 px-5 pt-6 pb-5">
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-900/50 ring-1 ring-white/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-white">
                    <path d="M12 2v4" />
                    <path d="M6.3 5.3l2.1 2.1" />
                    <path d="M2 12h4" />
                    <path d="M5.3 18.7l2.1-2.1" />
                    <path d="M12 18v4" />
                    <path d="M16.6 16.6l2.1 2.1" />
                    <path d="M18 12h4" />
                    <path d="M16.6 7.4l2.1-2.1" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </div>
            <div class="min-w-0">
                <p class="text-lg font-extrabold tracking-tight leading-none">
                    <span class="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">iZone</span>
                    <span class="text-white"> Hub</span>
                </p>
                <p class="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-300/70">
                    Admin Panel
                </p>
            </div>
        </div>

        <div class="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

        <!-- ===================== Navigation ===================== -->
        <div class="relative z-10 mt-5 flex-1 overflow-y-auto px-4 pb-4">
            <p class="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Menu</p>
            <nav class="space-y-1" aria-label="Admin navigation">
                {#each ADMIN_NAVIGATION_LINKS as link}
                    {@const active = currentPath.startsWith(link.path)}
                    {@const Icon = Icons[link.icon]}
                    <a
                        href={link.path}
                        onclick={handleNavClick}
                        class="group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-200
                            {active ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}"
                        aria-current={active ? 'page' : undefined}
                    >
                        {#if active}
                            <span class="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-950/50 ring-1 ring-white/10"></span>
                        {/if}
                        {#if Icon}
                            <span
                                class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200
                                {active
                                    ? 'bg-white/15 text-white shadow-inner'
                                    : 'bg-white/[0.04] text-gray-500 ring-1 ring-white/5 group-hover:bg-white/10 group-hover:text-purple-300'}"
                            >
                                <svelte:component this={Icon} size={16} />
                            </span>
                        {/if}
                        <span class="relative z-10 flex-1 truncate text-sm font-medium">{link.name}</span>
                        {#if active}
                            <span class="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                                <ChevronRight size={12} class="text-white" />
                            </span>
                        {/if}
                    </a>
                {/each}
            </nav>

            <div class="mt-6 px-2">
                <div class="rounded-xl bg-gradient-to-r from-purple-500/10 to-fuchsia-500/5 p-3 ring-1 ring-white/10">
                    <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        <ShieldCheck size={11} />
                        Admin Access
                    </p>
                    <p class="mt-1 text-[10px] leading-relaxed text-gray-500">
                        You have full control over jobs, quizzes and applicants.
                    </p>
                </div>
            </div>
        </div>

        <!-- ===================== Sidebar Footer ===================== -->
        <div class="relative z-10 border-t border-white/10 p-3.5">
            <div class="flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
                {#if user.avatar_url}
                    <img
                        src={user.avatar_url}
                        alt=""
                        class="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-purple-400/40"
                    />
                {:else}
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-xs font-bold text-white ring-2 ring-purple-400/40">
                        {getInitials(user.name || user.email)}
                    </div>
                {/if}
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-white">{user.name || "Admin User"}</p>
                    <p class="truncate text-[11px] text-gray-500">{user.email || "admin@izone.local"}</p>
                </div>
                <button
                    onclick={() => auth.logout()}
                    title="Logout"
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-all duration-200 hover:bg-red-500/15 hover:text-red-400"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    </div>
</aside>

<!-- Mobile Overlay -->
{#if isOpen}
    <button
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
        onclick={() => (isOpen = false)}
        aria-label="Close sidebar"
    ></button>
{/if}
