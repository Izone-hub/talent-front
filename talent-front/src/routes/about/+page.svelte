<script>
	import {
		ArrowRight,
		BrainCircuit,
		Cloud,
		Code2,
		Database,
		Globe2,
		Layers3,
		Rocket,
		ShieldCheck,
		Sparkles
	} from '@lucide/svelte';
	import IZoneLogo from '$lib/assets/icons/IZone-logo.png';

	const missionCards = [
		{
			title: 'Our Mission',
			text: 'Help international startups and enterprises ship dependable software: SaaS platforms, AI products, ERP systems, and dashboards that teams use every day.',
			icon: ShieldCheck
		},
		{
			title: 'Global Delivery',
			text: 'Remote collaboration with product teams across the USA, Israel, Norway, France, and the Netherlands. We align with your roadmap, timezone, and release cadence.',
			icon: Globe2
		},
		{
			title: 'Engineering Excellence',
			text: 'We ship maintainable, well-tested systems with clear architecture, focused on performance, security, and code quality that stands up in production.',
			icon: Sparkles
		}
	];

	const countries = ['USA', 'Israel', 'Norway', 'France', 'Netherlands'];

	const engagements = [
		{
			name: 'Fleet Finesse',
			country: 'USA',
			period: 'Mar 2025 - Present',
			text: 'Car rental SaaS: fleet management, reservations, billing, and scalable APIs.'
		},
		{
			name: 'Susoft',
			country: 'Norway',
			period: 'Feb 2024 - Mar 2025',
			text: 'Event management: calendars, ticketing, and payment integrations.'
		},
		{
			name: 'DANTE AI',
			country: 'USA',
			period: 'Mar 2023 - Apr 2024',
			text: 'High-performance React and Next.js experiences for an AI product company.'
		},
		{
			name: 'KOSA AI',
			country: 'Netherlands',
			period: 'Sep 2021 - Sep 2024',
			text: 'Flask APIs and Vue/Nuxt frontends for AI-oriented systems.'
		},
		{
			name: 'Onqoba',
			country: 'France',
			period: 'Dec 2020 - Mar 2024',
			text: 'Web and mobile systems, secure APIs, and legacy modernization.'
		}
	];

	const stack = [
		{ name: 'Languages', icon: Code2, items: ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'C#', 'C++'] },
		{ name: 'Frontend', icon: Layers3, items: ['React.js', 'Next.js', 'Vue.js', 'Nuxt.js', 'Tailwind CSS', 'Framer Motion', 'shadcn/ui'] },
		{ name: 'Backend', icon: Rocket, items: ['Django', 'FastAPI', 'Node.js', 'Laravel', 'Flask', 'Express.js'] },
		{ name: 'AI', icon: BrainCircuit, items: ['OpenAI APIs', 'LangChain', 'PyTorch', 'TensorFlow', 'scikit-learn'] },
		{ name: 'Databases', icon: Database, items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Redis'] },
		{ name: 'Cloud / DevOps', icon: Cloud, items: ['AWS', 'Docker', 'Vercel', 'CI/CD', 'Celery'] }
	];

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'About Izone Technologies',
		description: 'Izone Technologies provides dedicated engineering teams, SaaS development, AI engineering, and enterprise software for international startups and enterprises.',
		url: '/about',
		mainEntity: {
			'@type': 'Organization',
			name: 'Izone Technologies',
			logo: IZoneLogo,
			areaServed: countries
		}
	};
</script>

<svelte:head>
	<title>About Izone Technologies | Offshore Software Development Company</title>
	<meta name="description" content="Izone Technologies provides dedicated engineering teams, SaaS development, AI engineering, and enterprise software for international startups and enterprises." />
	<meta property="og:title" content="About Izone Technologies | Offshore Software Development Company" />
	<meta property="og:description" content="Izone Technologies provides dedicated engineering teams, SaaS development, AI engineering, and enterprise software for international startups and enterprises." />
	<meta property="og:type" content="website" />
	<script type="application/ld+json">{@html JSON.stringify(structuredData)}</script>
</svelte:head>

<div class="about-page">
	<section class="hero" aria-labelledby="about-title">
		<div class="hero-grid"></div>
		<div class="hero-inner mx-auto w-full max-w-7xl px-6 text-center md:px-12 lg:px-20">
			<div class="eyebrow mx-auto"><span class="eyebrow-dot"></span>About Izone Technologies</div>
			<h1 id="about-title" class="mx-auto mb-8 max-w-5xl text-4xl font-bold text-slate-800 md:text-5xl">Offshore Software Outsourcing <span>for Global Teams</span></h1>
			<p class="hero-copy mx-auto mb-6 max-w-2xl text-lg text-gray-300">Izone Technologies is an offshore software outsourcing company providing dedicated engineering teams, SaaS development, AI engineering, and enterprise software for international startups and enterprises across the USA, Israel, Norway, France, and the Netherlands.</p>
			<div class="hero-actions justify-center">
						<a class="btn inline-flex h-auto min-h-0 items-center gap-2 whitespace-nowrap rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl" href="/contact">Start a conversation <ArrowRight size={17} class="shrink-0" /></a>
						<a class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gray-300 px-6 py-3 text-base" href="#experience">Explore our experience <ArrowRight size={17} class="shrink-0" /></a>
			</div>
			<div class="hero-note justify-center"><span></span> Built for ambitious teams, wherever they work.</div>
		</div>
	</section>

	<section class="section mission-section mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" aria-labelledby="mission-title">
		<div class="section-heading"><p class="section-kicker">How we work</p><h2 id="mission-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">A senior team for the<br /><em>hard parts</em> of shipping.</h2><p class="text-base text-gray-500 sm:text-lg">We bring practical product thinking and rigorous engineering together, helping teams move from a strong idea to software people can rely on.</p></div>
		<div class="mission-grid">
			{#each missionCards as card, index}
				<article class="mission-card group card border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={`--delay: ${index * 90}ms`}>
					<div class="card-body gap-4 p-6 sm:p-7">
						<div class="icon-wrap flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm"><svelte:component this={card.icon} size={23} strokeWidth={1.8} /></div>
						<h3 class="text-lg leading-tight font-bold text-slate-800">{card.title}</h3><p class="text-sm leading-relaxed text-slate-500">{card.text}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="presence-band mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" aria-labelledby="presence-title">
		<div class="presence-copy"><p class="section-kicker">One team, many timezones</p><h2 id="presence-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Global reach.<br /><em>Close collaboration.</em></h2><p class="text-base text-gray-500 sm:text-lg">Remote-first delivery that fits the way your product team already works.</p></div>
		<div class="country-list" aria-label="Countries served">
			{#each countries as country, index}<div class="country"><span>0{index + 1}</span><strong>{country}</strong><Globe2 size={16} /></div>{/each}
		</div>
	</section>

	<section class="section mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" id="experience" aria-labelledby="experience-title">
		<div class="section-heading split-heading"><div><p class="section-kicker">Selected work</p><h2 id="experience-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">International<br /><em>experience.</em></h2></div><p class="text-base text-gray-500 sm:text-lg">Long-term partnerships and focused engagements have shaped an engineering practice built for production.</p></div>
		<div class="engagement-grid">
			{#each engagements as engagement, index}
				<article class="engagement-card card border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><div class="card-body p-6 sm:p-7"><div class="card-top"><span class="country-label">{engagement.country}</span><span class="period">{engagement.period}</span></div><div class="number">0{index + 1}</div><h3 class="text-lg leading-tight font-bold text-slate-800">{engagement.name}</h3><p class="text-sm leading-relaxed text-slate-500">{engagement.text}</p></div></article>
			{/each}
		</div>
	</section>

	<section class="section stack-section mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" aria-labelledby="stack-title">
		<div class="section-heading"><p class="section-kicker">Our toolkit</p><h2 id="stack-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Technology that<br /><em>moves with you.</em></h2><p class="text-base text-gray-500 sm:text-lg">The tools and frameworks we use to build production-grade software, chosen for the problem rather than the trend.</p></div>
		<div class="stack-grid">
			{#each stack as category}
				<div class="stack-card card border border-slate-100 bg-white shadow-sm"><div class="card-body gap-4 p-6 sm:p-7"><div class="stack-title"><svelte:component this={category.icon} size={19} /><h3 class="text-lg leading-tight font-bold text-slate-800">{category.name}</h3></div><div class="tags">{#each category.items as item}<span>{item}</span>{/each}</div></div></div>
			{/each}
		</div>
	</section>

	<section class="cta-section" aria-labelledby="cta-title"><div class="cta-inner mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20"><div><p class="section-kicker">Let's build what's next</p><h2 id="cta-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Ready to work with a<br /><em>senior engineering partner?</em></h2><p class="text-base text-gray-500 sm:text-lg">Tell us about your product roadmap. We respond within 24 hours.</p></div><div class="cta-actions"><a class="btn inline-flex h-auto min-h-0 items-center gap-2 whitespace-nowrap rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl" href="/contact">Start a conversation <ArrowRight size={17} class="shrink-0" /></a><a class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gray-300 px-6 py-3 text-base" href="/work">View our work <ArrowRight size={17} class="shrink-0" /></a></div></div></section>
</div>

<style>
	.about-page { --navy: #6d28d9; --ink: #111827; --muted: #4b5563; --gold: #7c3aed; --line: #e5e7eb; background: transparent; color: var(--ink); overflow: hidden; }
	.hero { min-height: 60vh; display: flex; align-items: center; position: relative; background: transparent; color: var(--ink); border-bottom: 1px solid var(--line); }
	.hero::before, .hero-grid { display: none; }
	.hero-inner { padding: 4.5rem 0 4rem; }
	.eyebrow, .section-kicker { color: var(--navy); text-transform: uppercase; font-size: .68rem; letter-spacing: .12em; font-weight: 700; }
	.eyebrow { display: inline-flex; align-items: center; gap: .55rem; padding: .55rem .85rem; border: 1px solid rgba(232,185,79,.35); border-radius: 999px; }
	.eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 0 5px rgba(232,185,79,.13); }
	h1 span, em { color: var(--gold); font-style: normal; }
	.hero-copy { color: var(--muted); }
	.hero-actions, .cta-actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
	.hero-note { display: flex; align-items: center; gap: .6rem; margin-top: 2rem; color: var(--muted); font-size: .75rem; }
	.hero-note span { width: 30px; height: 1px; background: var(--gold); }
	.section-heading { max-width: 620px; margin-bottom: 3rem; }
	.section-heading h2, .presence-copy h2, .cta-inner h2 { margin: .7rem 0 1rem; color: var(--ink); }
	.section-heading > p:last-child, .presence-copy > p:last-child, .cta-inner > div > p:last-child { color: var(--muted); }
	.mission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.icon-wrap { margin-bottom: 0; }
	.presence-band { display: grid; grid-template-columns: .8fr 1.2fr; gap: 5rem; align-items: center; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
	.presence-band .presence-copy h2 { color: var(--ink); }
	.country-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: .7rem; }
	.country { display: flex; align-items: center; gap: .8rem; padding: 1rem 1.1rem; border-bottom: 1px solid var(--line); }
	.country span, .number { color: var(--gold); font-size: .72rem; font-weight: 700; letter-spacing: .1em; }
	.country strong { flex: 1; font-family: 'Poppins', sans-serif; font-size: 1rem; }
	.country svg { color: #aab5c2; }
	.split-heading { display: flex; justify-content: space-between; align-items: end; gap: 2rem; max-width: none; }
	.split-heading > p { max-width: 340px; margin-bottom: .4rem; }
	.engagement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.engagement-card { min-height: 220px; position: relative; }
	.card-top { display: flex; justify-content: space-between; gap: .5rem; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; }
	.country-label { color: var(--navy); font-weight: 700; } .period { color: #96a1af; text-align: right; }
	.number { margin: 2.2rem 0 .65rem; }
	.stack-section { padding-top: 1rem; }
	.stack-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	.stack-title { display: flex; align-items: center; gap: .6rem; color: var(--navy); margin-bottom: 1rem; }
	.tags { display: flex; flex-wrap: wrap; gap: .45rem; } .tags span { border: 1px solid var(--line); border-radius: 999px; color: var(--muted); padding: .35rem .65rem; font-size: .75rem; }
	.cta-section { margin-top: 1rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #f5f3ff; color: var(--ink); }
	.cta-inner { display: flex; justify-content: space-between; align-items: center; gap: 3rem; padding-top: 3.5rem; padding-bottom: 3.5rem; }
	.cta-inner h2 { color: var(--ink); } .cta-inner > div > p:last-child { color: var(--muted); }
	@media (max-width: 800px) { .mission-grid, .engagement-grid { grid-template-columns: 1fr 1fr; } .mission-card:last-child, .engagement-card:last-child { grid-column: span 2; } .presence-band, .cta-inner { grid-template-columns: 1fr; display: grid; gap: 2rem; } .cta-inner { padding-top: 3rem; padding-bottom: 3rem; } }
	@media (max-width: 560px) { .hero-inner { padding: 5.5rem 0 4.5rem; } .mission-grid, .engagement-grid, .stack-grid, .country-list { grid-template-columns: 1fr; } .mission-card:last-child, .engagement-card:last-child { grid-column: auto; } .split-heading { display: block; } .split-heading > p { margin-top: 1.5rem; } .country-list { gap: 0; } }
	@media (prefers-reduced-motion: reduce) { .button, .mission-card { transition: none; } }
</style>