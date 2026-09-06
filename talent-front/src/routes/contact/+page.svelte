<script>
	import {
		ArrowRight,
		CalendarDays,
		Check,
		Clock3,
		Globe2,
		Mail,
		MapPin,
		Send
	} from '@lucide/svelte';

	const process = [
		{ number: '01', title: 'Discovery', detail: 'Goals, scope & timeline' },
		{ number: '02', title: 'Proposal', detail: 'Team model & roadmap' },
		{ number: '03', title: 'Build', detail: 'Iterative production delivery' },
		{ number: '04', title: 'Scale', detail: 'Launch, support & growth' }
	];
</script>

<svelte:head>
	<title>Contact Izone Technologies | Start a Conversation</title>
	<meta
		name="description"
		content="Discuss SaaS development, AI engineering, dedicated offshore teams, or enterprise software with Izone Technologies."
	/>
	<meta property="og:title" content="Contact Izone Technologies" />
	<meta
		property="og:description"
		content="Discuss your product roadmap, team needs, or outsourcing goals with Izone Technologies."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<main class="contact-page">
	<section class="hero" aria-labelledby="contact-title">
		<div class="hero-grid"></div>
		<div class="container hero-content">
			<p class="eyebrow">Izone Technologies</p>
			<h1 id="contact-title">Let's build what your team needs next.</h1>
			<p class="hero-copy">
				Discuss SaaS development, AI engineering, dedicated offshore teams, or enterprise software
				with senior engineers.
			</p>
			<div class="hero-actions">
				<a class="button button-primary" href="/services">Explore services <ArrowRight size={17} /></a>
				<a class="button button-quiet" href="#contact-form">Contact <ArrowRight size={17} /></a>
			</div>
		</div>
	</section>

	<section class="section contact-section" aria-labelledby="discuss-title">
		<div class="container contact-grid">
			<div class="intro-column">
				<p class="section-kicker">Start a conversation</p>
				<h2 id="discuss-title">Let's Discuss Your Product</h2>
				<p class="section-lead">
					Tell us about your roadmap, team needs, or outsourcing goals. A senior engineer will
					respond within 24 hours with next steps for your discovery call.
				</p>

				<div class="info-list">
					<a class="info-item" href="mailto:support@izonehub.com">
						<span class="info-icon"><Mail size={20} /></span>
						<span><strong>Get in touch</strong><span>support@izonehub.com</span><small>Response within 24 hours</small></span>
					</a>
					<a class="info-item" href="#contact-form">
						<span class="info-icon"><CalendarDays size={20} /></span>
						<span><strong>Book a call</strong><span>Schedule a discovery session</span><small>Free 30-minute consultation</small></span>
					</a>
					<div class="info-item">
						<span class="info-icon"><MapPin size={20} /></span>
						<span><strong>Headquarters</strong><span>Addis Ababa, Ethiopia</span><small>Remote-first · Global delivery</small></span>
					</div>
				</div>

				<div class="availability"><Globe2 size={17} /> <span>Working with teams across time zones</span></div>
			</div>

			<div class="process-panel" aria-labelledby="process-title">
				<p class="section-kicker">A clear path forward</p>
				<h2 id="process-title">How we work</h2>
				<div class="process-list">
					{#each process as step}
						<div class="process-step">
							<span class="step-number">{step.number}</span>
							<div><h3>{step.title}</h3><p>{step.detail}</p></div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="section form-section" aria-labelledby="form-title">
		<div class="container form-layout">
			<div class="form-heading">
				<p class="section-kicker">Your next chapter</p>
				<h2 id="form-title">Tell us about your product</h2>
				<p>Fields marked * are required.</p>
			</div>

			<form id="contact-form" class="contact-form" action="mailto:support@izonehub.com" method="post" enctype="text/plain">
				<div class="field-row">
					<label>First name *<input name="first_name" type="text" placeholder="Jane" required /></label>
					<label>Last name *<input name="last_name" type="text" placeholder="Smith" required /></label>
				</div>
				<div class="field-row">
					<label>Work email *<input name="email" type="email" placeholder="you@company.com" required /></label>
					<label>Company<input name="company" type="text" placeholder="Your company" /></label>
				</div>
				<label>Budget range <span class="optional">(optional)</span>
					<select name="budget">
						<option value="">Select range</option>
						<option value="under-25k">Under $25k</option>
						<option value="25k-75k">$25k–$75k</option>
						<option value="75k-150k">$75k–$150k</option>
						<option value="150k-plus">$150k+</option>
					</select>
				</label>
				<label>Project details *
					<textarea name="project_details" rows="6" placeholder="What are you building? Timeline, stack, and team structure help us respond with the right plan." required></textarea>
				</label>
				<div class="form-footer">
					<button class="button button-primary submit-button" type="submit">Send message <Send size={17} /></button>
					<div class="form-notes"><span><Check size={15} /> Confidential · No spam</span><span><Clock3 size={15} /> Reply within 24 hours</span></div>
					<p>By submitting, you agree we may contact you about your inquiry.</p>
				</div>
			</form>
		</div>
	</section>
</main>

<style>
	:global(body) { background: #f8fafc; color: #172033; }
	:global(.bgGrid) { background: #f8fafc; }
	.contact-page { --navy: #173675; --navy-dark: #0e214d; --gold: #e9c25d; --ink: #172033; --muted: #667085; --line: #e3e8f0; overflow: hidden; }
	.container { width: min(1120px, calc(100% - 40px)); margin: 0 auto; }
	.hero { position: relative; padding: 72px 0 64px; background: #f8fafc; border-bottom: 1px solid var(--line); }
	.hero-grid { position: absolute; inset: 0; opacity: .48; background-image: linear-gradient(rgba(23,54,117,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(23,54,117,.06) 1px, transparent 1px); background-size: 72px 72px; mask-image: linear-gradient(to right, black, transparent 80%); }
	.hero-content { position: relative; display: block; width: min(100%, 760px); max-width: 760px; margin-left: max(20px, calc((100vw - 1120px) / 2)); writing-mode: horizontal-tb; }
	.eyebrow, .section-kicker { color: var(--navy); font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
	h1, h2, h3, p { margin: 0; writing-mode: horizontal-tb; }
	h1 { max-width: 700px; margin-top: 14px; color: var(--ink); font-size: clamp(2.2rem, 5vw, 4.15rem); line-height: 1.05; letter-spacing: -.04em; }
	.hero-copy { max-width: 620px; margin-top: 18px; color: var(--muted); font-size: 1rem; line-height: 1.65; }
	.hero-actions, .form-notes { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
	.hero-actions { flex-direction: row; margin-top: 34px; }
	.button { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 700; text-decoration: none; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
	.hero-actions .button { flex: 0 0 auto; white-space: nowrap; }
	.button:hover { transform: translateY(-2px); }
	.button-primary { border: 1px solid var(--navy); background: var(--navy); color: white; box-shadow: 0 8px 20px rgba(23,54,117,.16); }
	.button-primary:hover { background: #24509e; box-shadow: 0 12px 26px rgba(23,54,117,.24); }
	.button-quiet { border: 1px solid var(--line); color: var(--navy); background: rgba(255,255,255,.7); }
	.section { padding: 92px 0; }
	.contact-section { background: white; }
	.contact-grid, .form-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .9fr); gap: 72px; align-items: start; }
	h2 { margin-top: 12px; color: var(--ink); font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.08; letter-spacing: -.035em; }
	.section-lead { max-width: 560px; margin-top: 20px; color: var(--muted); font-size: 1.05rem; line-height: 1.75; }
	.info-list { display: grid; gap: 12px; margin-top: 38px; }
	.info-item { display: flex; gap: 15px; align-items: flex-start; padding: 18px 0; color: inherit; text-decoration: none; border-bottom: 1px solid var(--line); }
	.info-icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 12px; color: var(--navy); background: #edf2ff; }
	.info-item > span:last-child { display: grid; gap: 3px; }
	.info-item strong { color: var(--ink); font-size: 1rem; }
	.info-item span span { color: var(--navy); font-weight: 700; }
	.info-item small { color: var(--muted); }
	.availability { display: flex; align-items: center; gap: 8px; margin-top: 22px; color: var(--muted); font-size: .9rem; }
	.process-panel { padding: 34px; border: 1px solid var(--line); border-radius: 20px; background: #fbfcff; box-shadow: 0 18px 45px rgba(19,42,88,.07); }
	.process-list { display: grid; margin-top: 28px; }
	.process-step { display: flex; gap: 18px; padding: 20px 0; border-top: 1px solid var(--line); }
	.step-number { color: var(--gold); font-size: .82rem; font-weight: 900; letter-spacing: .06em; }
	.process-step h3 { color: var(--ink); font-size: 1.1rem; }
	.process-step p { margin-top: 4px; color: var(--muted); font-size: .95rem; }
	.form-section { background: #f2f5fb; }
	.form-heading > p:last-child { margin-top: 18px; color: var(--muted); }
	.contact-form { display: grid; gap: 18px; padding: 34px; border: 1px solid var(--line); border-radius: 20px; background: white; box-shadow: 0 18px 45px rgba(19,42,88,.08); }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	label { display: grid; gap: 8px; color: var(--ink); font-size: .87rem; font-weight: 700; }
	input, select, textarea { width: 100%; border: 1px solid #d6deea; border-radius: 9px; background: #fbfcfe; color: var(--ink); font: inherit; font-weight: 400; outline: none; padding: 12px 14px; transition: border-color .2s ease, box-shadow .2s ease; }
	input, select { height: 46px; }
	textarea { min-height: 140px; resize: vertical; }
	input:focus, select:focus, textarea:focus { border-color: var(--navy); box-shadow: 0 0 0 3px rgba(23,54,117,.12); }
	.optional { color: var(--muted); font-weight: 400; }
	.form-footer { display: grid; gap: 14px; margin-top: 2px; }
	.submit-button { width: fit-content; cursor: pointer; font: inherit; }
	.form-notes { color: var(--muted); font-size: .82rem; }
	.form-notes span { display: inline-flex; align-items: center; gap: 5px; }
	.form-footer > p { color: #8791a3; font-size: .78rem; line-height: 1.5; }
	@media (max-width: 800px) { .contact-grid, .form-layout { grid-template-columns: 1fr; gap: 44px; } .hero { padding: 88px 0 72px; } .hero-content { margin-left: auto; } }
	@media (max-width: 560px) { .container { width: min(100% - 28px, 1120px); } .section { padding: 64px 0; } .field-row { grid-template-columns: 1fr; gap: 18px; } .process-panel, .contact-form { padding: 24px 20px; } .hero-actions .button, .submit-button { width: 100%; } .hero-actions { align-items: stretch; } }
</style>