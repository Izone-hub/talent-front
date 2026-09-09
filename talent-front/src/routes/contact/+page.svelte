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
	import { apiClient } from '$lib/api/client';

	let submitting = false;
	let successMessage = '';
	let errorMessage = '';

	const process = [
		{ number: '01', title: 'Discovery', detail: 'Goals, scope & timeline' },
		{ number: '02', title: 'Proposal', detail: 'Team model & roadmap' },
		{ number: '03', title: 'Build', detail: 'Iterative production delivery' },
		{ number: '04', title: 'Scale', detail: 'Launch, support & growth' }
	];

	async function handleSubmit(event) {
		const form = event.currentTarget;
		const formData = new FormData(form);

		submitting = true;
		successMessage = '';
		errorMessage = '';

		try {
			const response = await apiClient.post('/api/v1/contact', {
				first_name: formData.get('first_name'),
				last_name: formData.get('last_name'),
				email: formData.get('email'),
				company: formData.get('company') || '',
				budget_range: formData.get('budget_range') || '',
				project_details: formData.get('project_details')
			});
			if (!response) throw new Error('Contact request was not authorized');

			form.reset();
			successMessage = 'Thanks for reaching out. We will reply within 24 hours.';
		} catch (error) {
			errorMessage = 'We could not send your message. Please try again or email support@izonehub.com.';
		} finally {
			submitting = false;
		}
	}
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
		<div class="container hero-content mx-auto w-full max-w-7xl px-6 text-center md:px-12 lg:px-20">
			<p class="eyebrow">Izone Technologies</p>
			<h1 id="contact-title" class="mx-auto mb-8 max-w-5xl text-4xl font-bold text-slate-800 md:text-5xl">Let's build what your team needs next.</h1>
			<p class="hero-copy mx-auto mb-6 max-w-2xl text-center text-lg text-gray-600">
				Discuss SaaS development, AI engineering, dedicated offshore teams, or enterprise software
				with senior engineers.
			</p>
			<div class="hero-actions justify-center">
				<a class="btn inline-flex h-auto min-h-0 items-center gap-2 whitespace-nowrap rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl" href="/services">Explore services <ArrowRight size={17} class="shrink-0" /></a>
			</div>
		</div>
	</section>

	<section class="section contact-section mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" aria-labelledby="discuss-title">
		<div class="container contact-grid">
			<div class="intro-column">
				<p class="section-kicker">Start a conversation</p>
				<h2 id="discuss-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Let's Discuss Your Product</h2>
				<p class="section-lead text-base text-gray-500 sm:text-lg">
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

			<div class="process-panel card border border-slate-100 bg-white shadow-sm" aria-labelledby="process-title">
				<div class="card-body gap-4 p-6 sm:p-7">
				<p class="section-kicker">A clear path forward</p>
				<h2 id="process-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">How we work</h2>
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
		</div>
	</section>

	<section class="section form-section mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20" aria-labelledby="form-title">
		<div class="container form-layout">
			<div class="form-heading">
				<p class="section-kicker">Your next chapter</p>
				<h2 id="form-title" class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Tell us about your product</h2>
				<p>Fields marked * are required.</p>
			</div>

			<form id="contact-form" class="contact-form card border border-slate-100 bg-white shadow-sm" on:submit|preventDefault={handleSubmit}>
				<div class="card-body gap-4 p-6 sm:p-7">
				<div class="field-row">
					<label>First name *<input name="first_name" type="text" placeholder="Jane" required /></label>
					<label>Last name *<input name="last_name" type="text" placeholder="Smith" required /></label>
				</div>
				<div class="field-row">
					<label>Work email *<input name="email" type="email" placeholder="you@company.com" required /></label>
					<label>Company<input name="company" type="text" placeholder="Your company" /></label>
				</div>
				<label>Budget range <span class="optional">(optional)</span>
					<select name="budget_range">
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
					<button class="btn h-auto min-h-0 w-fit gap-2 rounded-xl border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl submit-button" type="submit" disabled={submitting}>
						{#if submitting}Sending...{:else}Send message <Send size={17} />{/if}
					</button>
					{#if successMessage}<p class="form-success" role="status">{successMessage}</p>{/if}
					{#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
					<div class="form-notes"><span><Check size={15} /> Confidential · No spam</span><span><Clock3 size={15} /> Reply within 24 hours</span></div>
					<p>By submitting, you agree we may contact you about your inquiry.</p>
				</div>
			</div>
			</form>
		</div>
	</section>
</main>

<style>
	:global(body) { background: #f8fafc; color: #172033; }
	:global(.bgGrid) { background: #f8fafc; }
	.contact-page { --navy: #6d28d9; --navy-dark: #4c1d95; --gold: #7c3aed; --ink: #111827; --muted: #4b5563; --line: #e5e7eb; overflow: hidden; }
	.container { width: 100%; }
	.hero { position: relative; padding: 72px 0 64px; background: transparent; border-bottom: 1px solid var(--line); }
	.hero-grid { position: absolute; inset: 0; opacity: .48; background-image: linear-gradient(rgba(23,54,117,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(23,54,117,.06) 1px, transparent 1px); background-size: 72px 72px; mask-image: linear-gradient(to right, black, transparent 80%); }
	.hero-content { position: relative; display: block; writing-mode: horizontal-tb; }
	.eyebrow, .section-kicker { color: var(--navy); font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
	h1, h2, h3, p { margin: 0; writing-mode: horizontal-tb; }
	.hero-copy { max-width: 42rem; margin: 20px auto 24px; text-align: center; color: var(--muted); }
	.hero-actions, .form-notes { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
	.hero-actions { flex-direction: row; margin-top: 34px; }
	.contact-section { background: white; }
	.contact-grid, .form-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .9fr); gap: 72px; align-items: start; }
	h2 { margin-top: 12px; color: var(--ink); }
	.section-lead { max-width: 560px; margin-top: 20px; }
	.info-list { display: grid; gap: 12px; margin-top: 38px; }
	.info-item { display: flex; gap: 15px; align-items: flex-start; padding: 18px 0; color: inherit; text-decoration: none; border-bottom: 1px solid var(--line); }
	.info-icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: .75rem; color: var(--navy); background: #ede9fe; }
	.info-item > span:last-child { display: grid; gap: 3px; }
	.info-item strong { color: var(--ink); font-size: 1rem; }
	.info-item span span { color: var(--navy); font-weight: 700; }
	.info-item small { color: var(--muted); }
	.availability { display: flex; align-items: center; gap: 8px; margin-top: 22px; color: var(--muted); font-size: .9rem; }
	.process-panel { padding: 0; }
	.process-list { display: grid; margin-top: 28px; }
	.process-step { display: flex; gap: 18px; padding: 20px 0; border-top: 1px solid var(--line); }
	.step-number { color: var(--gold); font-size: .82rem; font-weight: 900; letter-spacing: .06em; }
	.process-step h3 { color: var(--ink); }
	.process-step p { margin-top: 4px; color: var(--muted); }
	.form-section { background: #f5f3ff; }
	.form-heading > p:last-child { margin-top: 18px; color: var(--muted); }
	.contact-form { display: grid; gap: 18px; padding: 0; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	label { display: grid; gap: 8px; color: var(--ink); font-size: .87rem; font-weight: 700; }
	input, select, textarea { width: 100%; border: 1px solid #d6deea; border-radius: 9px; background: #fbfcfe; color: var(--ink); font: inherit; font-weight: 400; outline: none; padding: 12px 14px; transition: border-color .2s ease, box-shadow .2s ease; }
	input, select { height: 46px; }
	textarea { min-height: 140px; resize: vertical; }
	input:focus, select:focus, textarea:focus { border-color: var(--navy); box-shadow: 0 0 0 3px rgba(23,54,117,.12); }
	.optional { color: var(--muted); font-weight: 400; }
	.form-footer { display: grid; gap: 14px; margin-top: 2px; }
	.submit-button { cursor: pointer; font: inherit; }
	.submit-button:disabled { cursor: wait; opacity: .65; transform: none; }
	.form-success { color: #1d6b4f; font-size: .88rem; }
	.form-error { color: #a33d3d; font-size: .88rem; }
	.form-notes { color: var(--muted); font-size: .82rem; }
	.form-notes span { display: inline-flex; align-items: center; gap: 5px; }
	.form-footer > p { color: #8791a3; font-size: .78rem; line-height: 1.5; }
	@media (max-width: 800px) { .contact-grid, .form-layout { grid-template-columns: 1fr; gap: 44px; } .hero { padding: 88px 0 72px; } .hero-content { margin-left: auto; } }
	@media (max-width: 560px) { .container { width: min(100% - 2rem, 1280px); } .section { padding: 4rem 0; } .field-row { grid-template-columns: 1fr; gap: 18px; } .process-panel, .contact-form { padding: 24px 20px; } .hero-actions .button, .submit-button { width: 100%; } .hero-actions { align-items: stretch; } }
</style>