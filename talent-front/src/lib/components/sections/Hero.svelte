<script>
	export let title = 'Find Jobs. Showcase Your Skills. Get Hired.'
	export let subtitle =
		'iZone is a talent and job platform where professionals apply for real opportunities by presenting their experience, skills, and portfolio — all in one place.'

	import { getContext } from 'svelte'
	const setGlow = getContext('setGlow')
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- flex flex-col gap-10 sm:gap-14 md:gap-24 flex-1 items-center justify-center pb-10 md:pb-14 px-20 -->
<section
	class="px-auto flex min-h-[60vh] flex-col items-center justify-center text-center"
	on:mouseenter={() => setGlow(true)}
	on:mouseleave={() => setGlow(false)}
>
	<h1 class="mb-8 max-w-5xl text-4xl font-bold md:text-5xl">
		{title}
	</h1>

	<p class="mb-6 max-w-2xl text-lg text-gray-600">
		{subtitle}
	</p>

	<div class="flex gap-4">
		<button
			class="btn h-auto min-h-0 gap-2 rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl"
		>
			Explore Jobs
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="h-5 w-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
				/>
			</svg>
		</button>
		<button class="rounded-xl border border-gray-300 px-6 py-3"> Learn More </button>
	</div>
</section>
