<script>
	import { ArrowRight, BrainCircuit, Code2, Layers3, Rocket } from 'lucide-svelte';

	const services = [
		{
			title: 'SaaS Development',
			description: 'Build dependable, scalable products that teams can use every day.',
			icon: Layers3,
			color: 'text-blue-600',
			background: 'bg-blue-100'
		},
		{
			title: 'AI Engineering',
			description: 'Turn practical AI ideas into useful, production-ready experiences.',
			icon: BrainCircuit,
			color: 'text-violet-600',
			background: 'bg-violet-100'
		},
		{
			title: 'Dedicated Teams',
			description: 'Extend your product team with experienced engineers aligned to your roadmap.',
			icon: Code2,
			color: 'text-emerald-600',
			background: 'bg-emerald-100'
		},
		{
			title: 'Enterprise Software',
			description: 'Modernize complex systems with secure architecture and thoughtful delivery.',
			icon: Rocket,
			color: 'text-orange-600',
			background: 'bg-orange-100'
		}
	];
</script>

<svelte:head>
	<title>Services | Izone Technologies</title>
	<meta name="description" content="SaaS development, AI engineering, dedicated teams, and enterprise software from Izone Technologies." />
</svelte:head>

<main class="mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20">
	<section class="flex min-h-[45vh] flex-col items-center justify-center text-center" aria-labelledby="services-title">
		<p class="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">Izone Technologies</p>
		<h1 id="services-title" class="mb-8 max-w-5xl text-4xl font-bold text-slate-800 md:text-5xl">
			Software expertise for ambitious teams
		</h1>
		<p class="mb-6 max-w-2xl text-lg text-gray-600">
			SaaS development, AI engineering, dedicated offshore teams, and enterprise software with senior engineers.
		</p>
		<a
			class="btn inline-flex h-auto min-h-0 items-center gap-2 whitespace-nowrap rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl"
			href="/contact"
		>
			Let's talk
			<ArrowRight size={17} class="shrink-0" />
		</a>
	</section>

	<section aria-labelledby="services-list-title">
		<div class="mb-12 flex flex-col gap-3 text-center sm:mb-16">
			<span class="mx-auto inline-block rounded-full border border-indigo-400 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 shadow-sm">
				What we do
			</span>
			<h2 id="services-list-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
				Build what moves your business forward
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
			{#each services as service}
				<article class="group card overflow-hidden border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
					<div class="card-body gap-4 p-6 sm:p-8">
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl {service.background} {service.color} shadow-sm">
							<svelte:component this={service.icon} size={28} strokeWidth={1.7} />
						</div>
						<h3 class="text-xl font-bold text-slate-800 transition-colors duration-200 group-hover:text-indigo-600">{service.title}</h3>
						<p class="text-sm leading-relaxed text-gray-500">{service.description}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>
</main>
