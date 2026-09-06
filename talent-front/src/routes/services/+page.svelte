<script>
	import {
		ArrowRight,
		Bot,
		Boxes,
		Cloud,
		Code2,
		Database,
		Gauge,
		Layers3,
		Monitor,
		Palette,
		ShieldCheck,
		Users
	} from '@lucide/svelte';

	const practices = [
		{ title: 'Software Development', text: 'End-to-end product engineering for SaaS, ERP, and custom platforms.', icon: Code2 },
		{ title: 'Frontend Services', text: 'High-performance interfaces with React, Next.js, and design-system discipline.', icon: Monitor },
		{ title: 'Backend Services', text: 'Secure APIs, data layers, auth, and payment infrastructure.', icon: Database },
		{ title: 'Design Services', text: 'Product design, UI/UX, and systems that elevate engineering output.', icon: Palette },
		{ title: 'AI & Automation', text: 'LLM integrations, agents, and workflow automation for modern products.', icon: Bot },
		{ title: 'DevOps & Cloud', text: 'AWS, GCP, Azure, CI/CD, and deployment pipelines that scale.', icon: Cloud },
		{ title: 'QA & Maintenance', text: 'Testing, stability, and continuous improvement for live systems.', icon: ShieldCheck },
		{ title: 'Team-Based Outsourcing', text: 'Dedicated squads and staff augmentation aligned to your roadmap.', icon: Users },
		{ title: 'Business Support', text: 'Consulting, product strategy, and delivery leadership.', icon: Gauge }
	];

	const offerings = [
		'Web application development', 'Mobile app development', 'Full-stack development', 'SaaS platform development',
		'MVP development', 'ERP/CRM systems', 'API development & integrations', 'AI-powered applications',
		'CMS development', 'E-commerce development'
	];

	const technologies = ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe', 'REST & GraphQL'];
	const outcomes = ['Faster time-to-market for MVPs', 'Scalable multi-tenant SaaS foundations', 'Integrated billing & third-party workflows', 'Maintainable codebases for growing teams'];
	const deepDives = [
		{ title: 'SaaS Development Services', text: 'We engineer production SaaS platforms for startups and enterprises - reservations, billing, fleet operations, analytics, and multi-role dashboards built for daily use.' },
		{ title: 'AI Software Development Services', text: 'We build AI-powered products and integrations - combining FastAPI services, Next.js experiences, and pragmatic LLM workflows for real production use.' },
		{ title: 'ERP Software Development', text: 'We build ERP and operations platforms - inventory, workforce, orders, and reference data - with role-based access and admin experiences teams rely on daily.' },
		{ title: 'Dedicated Offshore Engineering Teams', text: 'Extend your product team with senior full-stack, AI, and frontend engineers - aligned to your roadmap, timezone, and engineering standards.' },
		{ title: 'Product Engineering for SaaS & Enterprise', text: 'We partner from discovery through launch - architecture, UX implementation, APIs, and iterative releases that match product and business goals.' },
		{ title: 'Startup MVP Development', text: 'Ship a credible MVP quickly - focused scope, production-quality code, and architecture you can extend after fundraising or traction.' },
		{ title: 'Full-Stack Software Development', text: 'Senior full-stack engineers delivering cohesive frontends and backends - APIs, databases, auth, payments, and polished product UI.' },
		{ title: 'Frontend & Next.js Development', text: 'We build performant, accessible frontends - marketing sites, SaaS dashboards, and design-system-driven UI optimized for Core Web Vitals.' },
		{ title: 'Backend & API Development', text: 'Robust backend systems with clear domain modeling - REST APIs, webhooks, payment flows, and database design for production workloads.' }
	];
</script>

<svelte:head>
	<title>Software Development Services | Izone Technologies</title>
	<meta name="description" content="Izone Technologies provides senior software engineering, AI, cloud, product design, QA, and dedicated offshore team services from Addis Ababa, Ethiopia." />
	<meta property="og:title" content="Software Development Services | Izone Technologies" />
	<meta property="og:description" content="Nine practice areas for startups and enterprises that need senior talent, clear architecture, and production-ready delivery." />
	<meta property="og:type" content="website" />
</svelte:head>

<main class="services-page">
	<section class="hero">
		<div class="hero-glow"></div>
		<div class="wrap hero-inner">
			<p class="eyebrow">Addis Ababa, Ethiopia</p>
			<h1>Engineering that turns ambitious products into <em>working software.</em></h1>
			<p class="hero-copy">Nine practice areas - from full-stack product engineering to dedicated teams - structured for startups and enterprises that need senior talent, clear architecture, and production-ready delivery.</p>
			<div class="hero-actions"><a class="button button-gold" href="/contact">Start your project <ArrowRight size={17} /></a><a class="button button-outline" href="#capabilities">Explore our capabilities <ArrowRight size={17} /></a></div>
		</div>
	</section>

	<section class="section" id="capabilities" aria-labelledby="capabilities-title">
		<div class="wrap">
			<div class="section-heading"><p class="kicker">What We Offer</p><h2 id="capabilities-title">Capabilities built around<br /><em>your product roadmap.</em></h2><p>Select a practice area to see offerings, technologies, and outcomes.</p></div>
			<div class="practice-grid">
				{#each practices as practice}
					<a class="practice-card" href="#software-development"><span class="practice-icon"><svelte:component this={practice.icon} size={21} /></span><h3>{practice.title}</h3><p>{practice.text}</p><ArrowRight class="card-arrow" size={17} /></a>
				{/each}
			</div>
		</div>
	</section>

	<section class="feature-section" id="software-development" aria-labelledby="software-title">
		<div class="wrap feature-grid">
			<div class="feature-copy"><div class="feature-label"><span>01</span> Popular</div><h2 id="software-title">Software<br /><em>Development</em></h2><p>We design and ship production-grade applications - from MVPs to enterprise systems - with clear architecture, integrated payments, and APIs built for long-term scale.</p><div class="feature-points"><span>Product-minded senior engineers</span><span>Production-ready delivery</span><span>International collaboration</span></div><a class="button button-navy" href="/contact">Discuss this service <ArrowRight size={17} /></a></div>
			<div class="detail-card"><p class="kicker">Key offerings</p><div class="tag-list">{#each offerings as item}<span>{item}</span>{/each}</div><p class="kicker detail-kicker">Technologies</p><div class="tech-list">{#each technologies as tech}<span><Code2 size={14} />{tech}</span>{/each}</div><p class="kicker detail-kicker">Business outcomes</p><ul>{#each outcomes as outcome}<li>{outcome}</li>{/each}</ul></div>
		</div>
	</section>

	<section class="section architecture-section" aria-labelledby="architecture-title">
		<div class="wrap">
			<div class="section-heading"><p class="kicker">Service details</p><h2 id="architecture-title">Architecture preview</h2></div>
			<div class="architecture-card"><div class="architecture-layer client"><span>Client layer</span><strong>Next.js</strong><strong>React</strong><strong>Node.js</strong></div><div class="architecture-layer application"><span>Application</span><strong>Node.js</strong><strong>PostgreSQL</strong></div><div class="architecture-layer data"><span>Data & integrations</span><strong>Stripe</strong><strong>REST & GraphQL</strong></div></div>
			<div class="use-case"><span class="kicker">Use cases</span><strong><Boxes size={19} /> Fleet & mobility SaaS platforms</strong></div>
		</div>
	</section>

	<section class="section deep-section" aria-labelledby="deep-title">
		<div class="wrap"><div class="section-heading"><p class="kicker">Dedicated service pages</p><h2 id="deep-title">Deep dives into how Izone Technologies delivers.</h2><p>SaaS, AI, ERP, and dedicated offshore engineering teams, shaped around the way your organization works.</p></div><div class="deep-grid">{#each deepDives as service}<article class="deep-card"><p class="deep-number">0{deepDives.indexOf(service) + 1}</p><h3>{service.title}</h3><p>{service.text}</p><a href="/contact">Learn more <ArrowRight size={16} /></a></article>{/each}</div></div>
	</section>

	<section class="cta-section"><div class="wrap cta-inner"><div><p class="kicker">Ready to move?</p><h2>Bring us the hard<br /><em>part of your roadmap.</em></h2></div><a class="button button-gold" href="/contact">Start a conversation <ArrowRight size={17} /></a></div></section>
</main>

<style>
	.services-page { --navy: #102b57; --ink: #14243b; --muted: #5f6e82; --gold: #e8b94f; --line: #dfe6ee; background: #f8fafc; color: var(--ink); overflow: hidden; }
	.services-page :global(h1), .services-page :global(h2), .services-page :global(h3) { font-family: 'Poppins', sans-serif; letter-spacing: -.035em; }
	.wrap { width: min(1120px, calc(100% - 3rem)); margin: 0 auto; }
	.hero { position: relative; border-bottom: 1px solid var(--line); background: #f8fafc; color: var(--ink); }
	.hero-inner { padding: 4.5rem 0 4.25rem; }
	.eyebrow, .kicker { color: var(--navy); text-transform: uppercase; font-size: .68rem; letter-spacing: .12em; font-weight: 800; }
	h1 { max-width: 760px; margin: 1.1rem 0 1rem; font-size: clamp(2.15rem, 5vw, 4rem); line-height: 1.08; }
	em { color: var(--gold); font-style: normal; }
	.hero-copy { max-width: 640px; color: var(--muted); font-size: .98rem; line-height: 1.7; }
	.hero-actions { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.5rem; }
	.button { display: inline-flex; align-items: center; gap: .5rem; border: 0; border-radius: 7px; padding: .72rem 1rem; text-decoration: none; font-weight: 800; font-size: .8rem; transition: transform .2s ease, background .2s ease; }
	.button:hover { transform: translateY(-2px); }
	.button-gold { background: var(--gold); color: #152848; box-shadow: 0 9px 22px rgba(0,0,0,.15); }
	.button-gold:hover { background: #f3cb6b; }
	.button-outline { border: 1px solid var(--line); color: var(--navy); }
	.button-outline:hover { background: white; }
	.button-navy { background: var(--navy); color: white; }
	.section { padding: 6rem 0; }
	.section-heading { max-width: 650px; margin-bottom: 3rem; }
	.section-heading h2 { margin: .7rem 0 1rem; font-size: clamp(2rem, 4vw, 3.3rem); line-height: 1.12; }
	.section-heading > p:last-child { color: var(--muted); line-height: 1.75; }
	.practice-grid, .deep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.practice-card, .deep-card, .detail-card { border: 1px solid var(--line); background: white; box-shadow: 0 9px 26px rgba(18,43,82,.045); }
	.practice-card { position: relative; min-height: 205px; padding: 1.5rem; color: inherit; text-decoration: none; border-radius: 12px; transition: transform .2s ease, box-shadow .2s ease; }
	.practice-card:hover, .deep-card:hover { transform: translateY(-4px); box-shadow: 0 17px 32px rgba(18,43,82,.1); }
	.practice-icon { display: grid; width: 43px; height: 43px; place-items: center; margin-bottom: 1.3rem; border-radius: 9px; color: var(--navy); background: #fff6dd; }
	.practice-card h3, .deep-card h3 { margin-bottom: .6rem; font-size: 1.05rem; }
	.practice-card p, .deep-card > p:not(.deep-number) { color: var(--muted); font-size: .87rem; line-height: 1.7; }
	.card-arrow { position: absolute; right: 1.5rem; bottom: 1.5rem; color: var(--gold); }
	.feature-section { padding: 6.5rem 0; background: #eef3fa; }
	.feature-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 5rem; align-items: start; }
	.feature-label { display: inline-flex; gap: .7rem; align-items: center; color: var(--navy); font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
	.feature-label span, .deep-number { color: var(--gold); }
	.feature-copy h2 { margin: 1.1rem 0 1rem; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1; }
	.feature-copy > p { color: var(--muted); line-height: 1.8; }
	.feature-points { display: grid; gap: .65rem; margin: 1.7rem 0 2rem; }
	.feature-points span { color: var(--navy); font-weight: 700; font-size: .87rem; }
	.feature-points span::before { content: '++'; margin-right: .6rem; color: var(--gold); font-weight: 900; }
	.detail-card { padding: 2rem; border-radius: 12px; }
	.tag-list, .tech-list { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: 1rem; }
	.tag-list span, .tech-list span { display: inline-flex; align-items: center; gap: .35rem; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); padding: .4rem .7rem; font-size: .77rem; }
	.tech-list span { color: var(--navy); }
	.detail-kicker { margin-top: 2rem; }
	.detail-card ul { display: grid; gap: .65rem; margin: 1rem 0 0; padding: 0; list-style: none; color: var(--muted); font-size: .88rem; }
	.detail-card li::before { content: '->'; margin-right: .55rem; color: var(--gold); font-weight: 800; }
	.architecture-section { background: white; }
	.architecture-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.architecture-layer { display: grid; gap: .7rem; min-height: 160px; padding: 1.5rem; border-radius: 12px; background: var(--navy); color: white; }
	.architecture-layer:nth-child(2) { background: #1e477f; }
	.architecture-layer:nth-child(3) { background: #e8b94f; color: #152848; }
	.architecture-layer span { font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; opacity: .72; }
	.architecture-layer strong { font-size: 1rem; }
	.use-case { display: flex; align-items: center; gap: 1.5rem; margin-top: 1rem; padding: 1.2rem 1.5rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
	.use-case strong { display: inline-flex; align-items: center; gap: .6rem; color: var(--navy); }
	.deep-section { background: #f8fafc; }
	.deep-card { position: relative; min-height: 255px; padding: 1.5rem; border-radius: 12px; }
	.deep-number { margin-bottom: 2rem; font-size: .75rem; font-weight: 800; letter-spacing: .12em; }
	.deep-card a { display: inline-flex; align-items: center; gap: .5rem; margin-top: 1.2rem; color: var(--navy); font-size: .82rem; font-weight: 800; text-decoration: none; }
	.cta-section { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #eef3fa; color: var(--ink); }
	.cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding: 3.25rem 0; }
	.cta-inner h2 { margin-top: .7rem; color: var(--ink); font-size: clamp(1.75rem, 3.5vw, 2.7rem); line-height: 1.08; }
	@media (max-width: 800px) { .practice-grid, .deep-grid { grid-template-columns: repeat(2, 1fr); } .feature-grid { grid-template-columns: 1fr; gap: 3rem; } .cta-inner { align-items: flex-start; flex-direction: column; } }
	@media (max-width: 560px) { .wrap { width: min(100% - 2rem, 1120px); } .hero-inner { padding: 5.5rem 0 4.5rem; } .section { padding: 4.5rem 0; } .practice-grid, .deep-grid, .architecture-card { grid-template-columns: 1fr; } .hero-actions .button, .cta-inner .button { width: 100%; justify-content: center; } .use-case { align-items: flex-start; flex-direction: column; gap: .7rem; } }
</style>
