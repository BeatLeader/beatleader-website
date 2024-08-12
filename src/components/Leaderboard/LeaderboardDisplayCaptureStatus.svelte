<script>
	import {navigate} from 'svelte-routing';
	import Badge from '../Common/Badge.svelte';
	import {invertColor} from '../Common/utils/badge';

	export let clan = null;
	export let clanRankingContested = null;
	export let withTitle = true;
	export let leaderboardId = null;
</script>

<div class="status-and-type">
	{#if clanRankingContested}
		<div style=" --clan-color: #000000" class="captor-clan captor-clan-outline">
			{#if withTitle}
				<p class="captured-by">Captured by:</p>
			{/if}
			<Badge
				label="&#9876 CONTESTED &#9876"
				onlyLabel={true}
				fluid={true}
				color={invertColor('#000000')}
				bgColor={'var(--dimmed)'}
				title="Set a score on this map to break the tie and capture it for your clan!" />
		</div>
	{:else if (clan ?? null) === null}
		<div style=" --clan-color: #000000" class="captor-clan captor-clan-outline">
			{#if withTitle}
				<p class="captured-by">Captured by:</p>
			{/if}
			<Badge
				label="UNCAPTURED"
				onlyLabel={true}
				fluid={true}
				color={invertColor('#000000')}
				bgColor={'var(--dimmed)'}
				title="Set a score on this map to capture it for your clan!" />
		</div>
	{:else}
		<div style=" --clan-color: {clan ?? '#000000'}" class="captor-clan captor-clan-outline">
			{#if withTitle}
				<p class="captured-by">Captured by:</p>
			{/if}
			<a
				href={`/clansmap/leaderboard/${leaderboardId}`}
				on:click|preventDefault|stopPropagation={() => navigate(`/clansmap/leaderboard/${leaderboardId}`)}>
				<Badge
					label={clan?.tag ?? '???'}
					onlyLabel={true}
					fluid={true}
					color={invertColor(clan?.color ?? '#000000')}
					bgColor={clan?.color ?? 'var(--dimmed)'}
					title="Set a score on this map to help capture it for your clan!" />
			</a>
		</div>
	{/if}
</div>

<style>
	.status-and-type {
		display: flex;
		gap: 0.6em;
	}

	.captor-clan {
		text-align: center;
		display: flex;
		gap: 0.5em;
	}

	.captured-by {
		text-align: center;
	}

	:global(.clan-badges span.label) {
		font-weight: bold;
	}
</style>
