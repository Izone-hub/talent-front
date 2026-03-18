<script>
    import { auth } from "$lib/stores/authStore";
    import IZoneLogo from "$lib/assets/icons/IZone-logo.png";
    import { Bell, Search, User, LogOut, Settings } from "lucide-svelte";

    export let toggleSidebar = () => {};
</script>

<nav
    class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4"
>
    <div class="flex items-center gap-4">
        <!-- Mobile Toggle -->
        <button
            class="btn btn-ghost btn-circle md:hidden"
            on:click={toggleSidebar}
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

        <div class="hidden items-center gap-2 md:flex">
            <img src={IZoneLogo} alt="Talent izone" class="h-7 w-auto" />
            <div class="flex flex-col leading-tight">
                <span class="text-sm font-bold text-purple-700"
                    >Admin Panel</span
                >
                <span class="text-[10px] text-gray-500 uppercase tracking-wider"
                    >iZone Hub</span
                >
            </div>
        </div>
    </div>

    <div class="flex items-center gap-2 md:gap-4">
        <!-- Profile Dropdown -->
        <div class="dropdown dropdown-end">
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
                tabindex="0"
                role="button"
                class="avatar btn btn-circle btn-ghost btn-sm"
            >
                <div class="w-8 rounded-full border border-purple-200">
                    {#if $auth.user?.avatar_url}
                        <img alt="User Avatar" src={$auth.user.avatar_url} />
                    {:else}
                        <div
                            class="flex h-full w-full items-center justify-center bg-purple-100 text-purple-700 font-bold text-xs"
                        >
                            {$auth.user?.name
                                ? $auth.user.name.charAt(0).toUpperCase()
                                : "A"}
                        </div>
                    {/if}
                </div>
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <ul
                tabindex="0"
                class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow-lg ring-1 ring-black/5"
            >
                <li
                    class="menu-title px-4 py-2 text-xs font-semibold uppercase text-gray-400"
                >
                    Account
                </li>
                <li>
                    <a href="/profile" class="flex items-center gap-2">
                        <User size={16} /> Profile
                    </a>
                </li>
                <li>
                    <a href="/admin/settings" class="flex items-center gap-2">
                        <Settings size={16} /> Settings
                    </a>
                </li>
                <div class="my-1 border-t border-gray-100"></div>
                <li>
                    <button
                        on:click={() => auth.logout()}
                        class="flex items-center gap-2 text-error"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </li>
            </ul>
        </div>
    </div>
</nav>
