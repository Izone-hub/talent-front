<script>
	import { page } from "$app/stores";
	import { intelligenceService } from "$lib/api/intelligence.service";
	import { quizService } from "$lib/api/quiz.service";
	import { goto } from "$app/navigation";
	import { ChevronLeft, XCircle, Target, BrainCircuit, Loader2, GitBranch, FileText, Brain, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-svelte";

	let userId = $derived($page.url.searchParams.get("user_id"));
	let quizId = $derived($page.params.id);

	let loading = $state(true);
	let data = $state(null);
	let error = $state("");
	let showRaw = $state(false);
	let candidateFeedback = $state(null);

	function formatDate(d) {
		if (!d) return "--";
		return new Date(d).toLocaleString();
	}

	function getVal(obj, ...keys) {
		if (!obj) return null;
		for (const key of keys) {
			const val = obj[key];
			if (val != null && val !== "") return val;
		}
		return null;
	}

	const feedbackRating = $derived(getVal(candidateFeedback, "rating", "Rating") || "");
	const feedbackComment = $derived(getVal(candidateFeedback, "comment", "Comment") || "");
	const feedbackDate = $derived(getVal(candidateFeedback, "created_at", "CreatedAt", "createdAt") || "");
	const hasFeedback = $derived(!!(candidateFeedback && (feedbackRating || feedbackComment)));

	$effect(() => {
		const id = userId;
		if (!id) {
			error = "Missing user_id query parameter";
			loading = false;
			return;
		}
		loading = true;
		error = "";
		data = null;
		intelligenceService.fetchGitHubIntelligence(id).then((r) => {
			data = r;
			loading = false;
		}).catch((e) => {
			error = e.message || "Failed to load intelligence data";
			loading = false;
		});

		if (quizId) {
			quizService.getQuizResultFeedback(quizId).then((fb) => {
				if (fb && (getVal(fb, "rating", "Rating") || getVal(fb, "comment", "Comment"))) {
					candidateFeedback = fb;
				}
			}).catch(() => {});
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-slate-100">
	<div class="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">

		{#if loading}
			<div class="flex items-center justify-center py-32">
				<div class="flex flex-col items-center gap-3">
					<Loader2 class="h-8 w-8 animate-spin text-indigo-400" />
					<p class="text-sm text-slate-400">Loading intelligence data...</p>
				</div>
			</div>

		{:else if error}
			<div class="mx-auto max-w-lg rounded-2xl border border-red-900/50 bg-red-950/30 p-8 text-center">
				<XCircle class="mx-auto h-12 w-12 text-red-400" />
				<h2 class="mt-4 text-lg font-semibold text-red-300">Failed to load</h2>
				<p class="mt-2 text-sm text-red-400">{error}</p>
				<button onclick={() => goto("/admin/applications")} class="btn mt-6 gap-2 border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700">
					<ChevronLeft class="h-4 w-4" />
					Back to Applications
				</button>
			</div>

		{:else if data}

			<div class="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/60 px-5 py-4 shadow-lg">
				<button onclick={() => goto("/admin/applications")} class="btn btn-ghost btn-sm gap-2 text-slate-400 hover:text-slate-100">
					<ChevronLeft size={18} />
					Back to Applications
				</button>
			</div>

			<div class="space-y-5">

				<div class="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-lg">
					<div class="flex items-center gap-3 mb-5">
						<GitBranch class="h-5 w-5 text-slate-400" />
						<h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">GitHub Intelligence</h2>
					</div>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
						<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Activity</span>
							<p class="mt-1 text-sm font-semibold text-slate-200">{data.github_intelligence?.activity_level || "—"}</p>
						</div>
						<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Focus</span>
							<p class="mt-1 text-sm font-semibold text-slate-200">{data.github_intelligence?.focus || "—"}</p>
						</div>
						<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Repos</span>
							<p class="mt-1 text-sm font-semibold text-slate-200">{data.github_intelligence?.public_repos ?? "—"}</p>
						</div>
						<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Followers</span>
							<p class="mt-1 text-sm font-semibold text-slate-200">{data.github_intelligence?.followers ?? "—"}</p>
						</div>
						<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Following</span>
							<p class="mt-1 text-sm font-semibold text-slate-200">{data.github_intelligence?.following ?? "—"}</p>
						</div>
					</div>
					{#if data.github_intelligence?.top_languages?.length}
						<div class="mt-4">
							<span class="text-xs text-slate-500 uppercase tracking-wider">Top Languages</span>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each data.github_intelligence.top_languages as lang}
									<span class="rounded-lg border border-indigo-800/50 bg-indigo-950/30 px-3 py-1 text-xs font-medium text-indigo-300">{lang}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if data.cv_signals}
					<div class="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-lg">
						<div class="flex items-center gap-3 mb-5">
							<FileText class="h-5 w-5 text-slate-400" />
							<h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">CV Signals</h2>
						</div>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
								<span class="text-xs text-slate-500 uppercase tracking-wider">Experience</span>
								<p class="mt-1 text-sm font-semibold text-slate-200">{data.cv_signals.experience_level || "—"}</p>
							</div>
							<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
								<span class="text-xs text-slate-500 uppercase tracking-wider">Projects</span>
								<p class="mt-1 text-sm font-semibold text-slate-200">{data.cv_signals.projects_listed ?? "—"}</p>
							</div>
							<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
								<span class="text-xs text-slate-500 uppercase tracking-wider">Credibility</span>
								<p class="mt-1 text-sm font-semibold capitalize text-slate-200">{data.cv_signals.credibility || "—"}</p>
							</div>
							<div class="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
								<span class="text-xs text-slate-500 uppercase tracking-wider">GitHub Alignment</span>
								<p class="mt-1 text-sm font-semibold capitalize text-slate-200">{(data.cv_signals.alignment_with_github || "—").replace(/_/g, " ")}</p>
							</div>
						</div>
						{#if data.cv_signals.claimed_skills?.length}
							<div class="mt-4">
								<span class="text-xs text-slate-500 uppercase tracking-wider">Claimed Skills</span>
								<div class="mt-2 flex flex-wrap gap-2">
									{#each data.cv_signals.claimed_skills as skill}
										<span class="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-300">{skill}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if data.ai_summary}
					<div class="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-lg">
						<div class="flex items-center gap-3 mb-5">
							<Brain class="h-5 w-5 text-slate-400" />
							<h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">AI Summary</h2>
							{#if data.ai_summary.model}
								<span class="ml-auto text-[10px] text-slate-500">{data.ai_summary.model}</span>
							{/if}
						</div>
						<div class="space-y-4">
							{#if data.ai_summary.summary}
								<div>
									<span class="text-xs text-slate-500 uppercase tracking-wider">Summary</span>
									<p class="mt-1 text-sm leading-6 text-slate-300">{data.ai_summary.summary}</p>
								</div>
							{/if}
							{#if data.ai_summary.strengths}
								<div>
									<span class="text-xs text-emerald-400 uppercase tracking-wider">Strengths</span>
									<p class="mt-1 text-sm leading-6 text-slate-300">{data.ai_summary.strengths}</p>
								</div>
							{/if}
							{#if data.ai_summary.weaknesses}
								<div>
									<span class="text-xs text-amber-400 uppercase tracking-wider">Weaknesses</span>
									<p class="mt-1 text-sm leading-6 text-slate-300">{data.ai_summary.weaknesses}</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if hasFeedback}
					<div class="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-lg">
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-900/50 text-indigo-400">
									<MessageSquare size={18} />
								</div>
								<div>
									<h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">Candidate Quiz Experience</h2>
									<p class="text-xs text-slate-500">Feedback submitted by applicant upon quiz completion</p>
								</div>
							</div>
							{#if feedbackRating}
								<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
									{feedbackRating === 'positive' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'}">
									{#if feedbackRating === 'positive'}
										<ThumbsUp size={12} />
										<span>Helpful Experience</span>
									{:else}
										<ThumbsDown size={12} />
										<span>Not Helpful</span>
									{/if}
								</span>
							{/if}
						</div>

						<div class="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
							{#if feedbackComment}
								<p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Candidate Written Comment:</p>
								<div class="rounded-lg bg-slate-950/60 p-3 border border-slate-800 text-sm text-slate-200 italic leading-relaxed">
									“{feedbackComment}”
								</div>
							{:else}
								<p class="text-xs text-slate-400 italic">No written comment provided.</p>
							{/if}
							<div class="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-2 text-[11px] text-slate-500">
								<span>Rating: <strong class="capitalize {feedbackRating === 'positive' ? 'text-emerald-400' : 'text-rose-400'}">{feedbackRating || 'N/A'}</strong></span>
								{#if feedbackDate}
									<span>Submitted: {new Date(feedbackDate).toLocaleString()}</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<div class="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-lg">
					<button
						onclick={() => showRaw = !showRaw}
						class="flex w-full items-center justify-between gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
					>
						<BrainCircuit class="h-3.5 w-3.5" />
						<span class="flex-1 text-left">Raw Response</span>
						<span class="text-[10px]">{showRaw ? 'Hide' : 'Show'}</span>
					</button>
					{#if showRaw}
						<pre class="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-400 whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
					{/if}
				</div>

			</div>

		{/if}
	</div>
</div>
