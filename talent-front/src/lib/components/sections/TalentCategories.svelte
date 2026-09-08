<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { apiClient } from "$lib/api/client";

	const categoryMeta = [
		{
			dbCategory: "full_stack_developer",
			name: "Full-Stack Developer",
			description: "End-to-end development handling both frontend and backend systems.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>`,
			color: "text-blue-600",
			bg: "bg-blue-100",
		},
		{
			dbCategory: "backend_developer",
			name: "Back-End Developer",
			description: "Server, database, and architecture experts keeping systems running properly.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>`,
			color: "text-emerald-600",
			bg: "bg-emerald-100",
		},
		{
			dbCategory: "frontend_developer",
			name: "Front-End Developer",
			description: "Creating engaging, responsive, and intuitive user interfaces.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`,
			color: "text-violet-600",
			bg: "bg-violet-100",
		},
		{
			dbCategory: "web_developer",
			name: "Web Developer",
			description: "Building modern websites optimized for performance and conversion.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0812 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>`,
			color: "text-orange-600",
			bg: "bg-orange-100",
		},
		{
			dbCategory: "mobile_developer",
			name: "Mobile Developer",
			description: "Crafting native and cross-platform mobile experiences.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>`,
			color: "text-rose-600",
			bg: "bg-rose-100",
		},
		{
			dbCategory: "system_architect",
			name: "System Architect",
			description: "Designing scalable systems, infrastructure, and technical architecture.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>`,
			color: "text-indigo-600",
			bg: "bg-indigo-100",
		},
	];

	let categoryCounts = $state({});

	onMount(async () => {
		try {
			const data = await apiClient.get("/stats/categories");
			if (Array.isArray(data)) {
				const map = {};
				for (const item of data) {
					map[item.category] = item.job_count;
				}
				categoryCounts = map;
			}
		} catch (err) {
			console.error("Failed to load category counts:", err);
		}
	});

	function formatCount(cat) {
		const count = categoryCounts[cat.dbCategory] || 0;
		return count > 0 ? `${count.toLocaleString()} Jobs` : "No Jobs";
	}
</script>

<section class="mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20">
	<div class="mb-12 flex flex-col gap-3 text-center sm:mb-16">
		<div class="mx-auto inline-block">
			<span
				class="mb-3 badge rounded-full badge-outline border-indigo-400 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 shadow-sm badge-primary"
				>Popular Categories</span
			>
		</div>
		<h2 class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
			Explore <span class="text-indigo-500">Top Skills</span>
		</h2>
		<p class="mx-auto mt-2 max-w-2xl text-base text-gray-500 sm:text-lg">
			Find the perfect match for your project. Browse through our most sought-after talent
			categories and hire specialized professionals.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
		{#each categoryMeta as category (category.dbCategory)}
			<div
				class="group card z-10 cursor-pointer overflow-hidden border border-slate-100 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
			>
				<div class="relative card-body p-6 sm:p-8">
					<div class="flex items-start justify-between">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl {category.bg} {category.color} relative mb-4 overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-110"
						>
							<div
								class="absolute inset-0 bg-white opacity-20 transition-opacity group-hover:opacity-0"
							></div>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html category.icon}
						</div>
						<div
							class="badge rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-500"
						>
							{formatCount(category)}
						</div>
					</div>

					<h3
						class="card-title text-xl font-bold text-slate-800 transition-colors duration-200 group-hover:text-indigo-600"
					>
						{category.name}
					</h3>
					<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
						{category.description}
					</p>

					<div class="mt-4 card-actions justify-end">
						<button
							class="btn gap-2 whitespace-nowrap rounded-lg font-medium text-indigo-600 btn-ghost btn-sm group-hover:bg-indigo-50"
							onclick={() => goto(`/jobs?category=${category.dbCategory}`)}
						>
							Browse Talent
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-14 flex justify-center text-center">
		<button
			class="btn h-auto min-h-0 gap-2 whitespace-nowrap rounded-full border-slate-300 bg-white px-8 py-3 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md"
		>
			View All Categories
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="h-4 w-4 shrink-0"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
				/>
			</svg>
		</button>
	</div>
</section>
