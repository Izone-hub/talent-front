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
		<div class="hero-inner">
			<div class="eyebrow"><span class="eyebrow-dot"></span>About Izone Technologies</div>
			<h1 id="about-title">Offshore Software Outsourcing <span>for Global Teams</span></h1>
			<p class="hero-copy">Izone Technologies is an offshore software outsourcing company providing dedicated engineering teams, SaaS development, AI engineering, and enterprise software for international startups and enterprises across the USA, Israel, Norway, France, and the Netherlands.</p>
			<div class="hero-actions">
				<a class="button button-primary" href="/contact">Start a conversation <ArrowRight size={17} /></a>
				<a class="button button-ghost" href="#experience">Explore our experience <ArrowRight size={17} /></a>
			</div>
			<div class="hero-note"><span></span> Built for ambitious teams, wherever they work.</div>
		</div>
	</section>

	<section class="section mission-section" aria-labelledby="mission-title">
		<div class="section-heading"><p class="section-kicker">How we work</p><h2 id="mission-title">A senior team for the<br /><em>hard parts</em> of shipping.</h2><p>We bring practical product thinking and rigorous engineering together, helping teams move from a strong idea to software people can rely on.</p></div>
		<div class="mission-grid">
			{#each missionCards as card, index}
				<article class="mission-card" style={`--delay: ${index * 90}ms`}>
					<div class="icon-wrap"><svelte:component this={card.icon} size={23} strokeWidth={1.8} /></div>
					<h3>{card.title}</h3><p>{card.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="presence-band" aria-labelledby="presence-title">
		<div class="presence-copy"><p class="section-kicker">One team, many timezones</p><h2 id="presence-title">Global reach.<br /><em>Close collaboration.</em></h2><p>Remote-first delivery that fits the way your product team already works.</p></div>
		<div class="country-list" aria-label="Countries served">
			{#each countries as country, index}<div class="country"><span>0{index + 1}</span><strong>{country}</strong><Globe2 size={16} /></div>{/each}
		</div>
	</section>

	<section class="section" id="experience" aria-labelledby="experience-title">
		<div class="section-heading split-heading"><div><p class="section-kicker">Selected work</p><h2 id="experience-title">International<br /><em>experience.</em></h2></div><p>Long-term partnerships and focused engagements have shaped an engineering practice built for production.</p></div>
		<div class="engagement-grid">
			{#each engagements as engagement, index}
				<article class="engagement-card"><div class="card-top"><span class="country-label">{engagement.country}</span><span class="period">{engagement.period}</span></div><div class="number">0{index + 1}</div><h3>{engagement.name}</h3><p>{engagement.text}</p></article>
			{/each}
		</div>
	</section>

	<section class="section stack-section" aria-labelledby="stack-title">
		<div class="section-heading"><p class="section-kicker">Our toolkit</p><h2 id="stack-title">Technology that<br /><em>moves with you.</em></h2><p>The tools and frameworks we use to build production-grade software, chosen for the problem rather than the trend.</p></div>
		<div class="stack-grid">
			{#each stack as category}
				<div class="stack-card"><div class="stack-title"><svelte:component this={category.icon} size={19} /><h3>{category.name}</h3></div><div class="tags">{#each category.items as item}<span>{item}</span>{/each}</div></div>
			{/each}
		</div>
	</section>

	<section class="cta-section" aria-labelledby="cta-title"><div class="cta-inner"><div><p class="section-kicker">Let's build what's next</p><h2 id="cta-title">Ready to work with a<br /><em>senior engineering partner?</em></h2><p>Tell us about your product roadmap. We respond within 24 hours.</p></div><div class="cta-actions"><a class="button button-light" href="/contact">Start a conversation <ArrowRight size={17} /></a><a class="button button-outline-light" href="/work">View our work <ArrowRight size={17} /></a></div></div></section>
</div>

<style>
	.about-page { --navy: #102b57; --ink: #14243b; --muted: #5f6e82; --gold: #e8b94f; --line: #dfe6ee; background: #f8fafc; color: var(--ink); font-family: 'Open Sans', sans-serif; overflow: hidden; }
	.about-page :global(h1), .about-page :global(h2), .about-page :global(h3) { font-family: 'Poppins', sans-serif; letter-spacing: -0.035em; }
	.hero { min-height: 430px; display: flex; align-items: center; position: relative; background: #f8fafc; color: var(--ink); border-bottom: 1px solid var(--line); }
	.hero::before, .hero-grid { display: none; }
	.hero-inner, .section, .presence-band, .cta-inner { width: min(1120px, calc(100% - 3rem)); margin: 0 auto; }
	.hero-inner { padding: 4.5rem 0 4rem; }
	.eyebrow, .section-kicker { color: var(--navy); text-transform: uppercase; font-size: .68rem; letter-spacing: .12em; font-weight: 700; }
	.eyebrow { display: inline-flex; align-items: center; gap: .55rem; padding: .55rem .85rem; border: 1px solid rgba(232,185,79,.35); border-radius: 999px; }
	.eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 0 5px rgba(232,185,79,.13); }
	h1 { max-width: 700px; margin: 1.1rem 0 1rem; font-size: clamp(2.25rem, 5vw, 4.2rem); line-height: 1.08; font-weight: 700; }
	h1 span, em { color: var(--gold); font-style: normal; }
	.hero-copy { max-width: 620px; color: var(--muted); font-size: .98rem; line-height: 1.7; }
	.hero-actions, .cta-actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
	.button { display: inline-flex; align-items: center; gap: .55rem; border-radius: 7px; padding: .86rem 1.2rem; text-decoration: none; font-weight: 700; font-size: .88rem; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
	.button:hover { transform: translateY(-2px); }
	.button-primary, .button-light { background: var(--gold); color: #152848; box-shadow: 0 9px 22px rgba(0,0,0,.15); }
	.button-primary:hover, .button-light:hover { background: #f3cb6b; }
	.button-ghost { border: 1px solid var(--line); color: var(--navy); }
	.button-ghost:hover { background: white; }
	.hero-note { display: flex; align-items: center; gap: .6rem; margin-top: 2rem; color: var(--muted); font-size: .75rem; }
	.hero-note span { width: 30px; height: 1px; background: var(--gold); }
	.section { padding: 6.5rem 0; }
	.section-heading { max-width: 620px; margin-bottom: 3rem; }
	.section-heading h2, .presence-copy h2, .cta-inner h2 { margin: .7rem 0 1rem; color: var(--ink); font-size: clamp(2rem, 4vw, 3.25rem); line-height: 1.14; }
	.section-heading > p:last-child, .presence-copy > p:last-child, .cta-inner > div > p:last-child { color: var(--muted); line-height: 1.75; font-size: .98rem; }
	.mission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.mission-card, .engagement-card, .stack-card { background: white; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 9px 26px rgba(18,43,82,.045); }
	.mission-card { padding: 2rem; transition: transform .25s ease, box-shadow .25s ease; }
	.mission-card:hover { transform: translateY(-5px); box-shadow: 0 18px 34px rgba(18,43,82,.1); }
	.icon-wrap { width: 47px; height: 47px; display: grid; place-items: center; color: var(--navy); background: #fff6dd; border-radius: 9px; margin-bottom: 1.7rem; }
	.mission-card h3, .engagement-card h3 { font-size: 1.1rem; margin-bottom: .7rem; }
	.mission-card p, .engagement-card p { color: var(--muted); font-size: .9rem; line-height: 1.75; }
	.presence-band { display: grid; grid-template-columns: .8fr 1.2fr; gap: 5rem; align-items: center; padding: 5rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
	.presence-band .presence-copy h2 { color: var(--ink); }
	.country-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: .7rem; }
	.country { display: flex; align-items: center; gap: .8rem; padding: 1rem 1.1rem; border-bottom: 1px solid var(--line); }
	.country span, .number { color: var(--gold); font-size: .72rem; font-weight: 700; letter-spacing: .1em; }
	.country strong { flex: 1; font-family: 'Poppins', sans-serif; font-size: 1rem; }
	.country svg { color: #aab5c2; }
	.split-heading { display: flex; justify-content: space-between; align-items: end; gap: 2rem; max-width: none; }
	.split-heading > p { max-width: 340px; margin-bottom: .4rem; }
	.engagement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.engagement-card { padding: 1.5rem; min-height: 220px; position: relative; }
	.card-top { display: flex; justify-content: space-between; gap: .5rem; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; }
	.country-label { color: var(--navy); font-weight: 700; } .period { color: #96a1af; text-align: right; }
	.number { margin: 2.2rem 0 .65rem; }
	.stack-section { padding-top: 1rem; }
	.stack-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	.stack-card { padding: 1.35rem 1.5rem; }
	.stack-title { display: flex; align-items: center; gap: .6rem; color: var(--navy); margin-bottom: 1rem; }
	.stack-title h3 { font-size: .98rem; letter-spacing: -.01em; }
	.tags { display: flex; flex-wrap: wrap; gap: .45rem; } .tags span { border: 1px solid var(--line); border-radius: 999px; color: var(--muted); padding: .35rem .65rem; font-size: .75rem; }
	.cta-section { margin-top: 1rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #eef3fa; color: var(--ink); }
	.cta-inner { display: flex; justify-content: space-between; align-items: center; gap: 3rem; padding: 3.5rem 0; }
	.cta-inner h2 { color: var(--ink); font-size: clamp(1.75rem, 3.5vw, 2.7rem); } .cta-inner > div > p:last-child { color: var(--muted); }
	.button-outline-light { border: 1px solid var(--line); color: var(--navy); } .button-outline-light:hover { background: white; }
	@media (max-width: 800px) { .mission-grid, .engagement-grid { grid-template-columns: 1fr 1fr; } .mission-card:last-child, .engagement-card:last-child { grid-column: span 2; } .presence-band, .cta-inner { grid-template-columns: 1fr; display: grid; gap: 2rem; } .cta-inner { padding: 3rem 0; } }
	@media (max-width: 560px) { .hero-inner, .section, .presence-band, .cta-inner { width: min(100% - 2rem, 1120px); } .hero-inner { padding: 5.5rem 0 4.5rem; } h1 { font-size: 2.55rem; } .section { padding: 4.5rem 0; } .mission-grid, .engagement-grid, .stack-grid, .country-list { grid-template-columns: 1fr; } .mission-card:last-child, .engagement-card:last-child { grid-column: auto; } .split-heading { display: block; } .split-heading > p { margin-top: 1.5rem; } .country-list { gap: 0; } }
	@media (prefers-reduced-motion: reduce) { .button, .mission-card { transition: none; } }
</style>