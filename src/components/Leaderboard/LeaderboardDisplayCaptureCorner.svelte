<script>
	import {navigate} from 'svelte-routing';
	import {invertColor} from '../Common/utils/badge';

	export let clan = null;
	export let clanRankingContested = null;
	export let leaderboardId = null;
</script>

<div class="status-and-type">
	{#if clanRankingContested}
		<div
			style=" --clan-color: #000000; color: {invertColor('#000000')}; background-color: 'var(--dimmed)'"
			class="captor-clan captor-clan-outline">
			<span title="Set a score on this map to break the tie and capture it for your clan!">&#9876 CONTESTED &#9876</span>
		</div>
	{:else if (clan ?? null) === null}
		<div
			style=" --clan-color: #000000; color: {invertColor('#000000')}; background-color: 'var(--dimmed)'"
			class="captor-clan captor-clan-outline">
			<span title="Set a score on this map to capture it for your clan!">UNCAPTURED</span>
		</div>
	{:else}
		<div
			style=" --clan-color: {clan ?? '#000000'}; background-color: {clan?.color ?? 'var(--dimmed)'}"
			class="captor-clan captor-clan-outline">
			<a
				style="color: {invertColor(clan?.color ?? '#000000')};"
				href={`/clansmap/leaderboard/${leaderboardId}`}
				on:click|preventDefault|stopPropagation={() => navigate(`/clansmap/leaderboard/${leaderboardId}`)}>
				<span title="Set a score on this map to help capture it for your clan!">{clan?.tag ?? '???'}</span>
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
		justify-content: center;
		gap: 0.5em;
		transform: rotateZ(314deg) translate(-2.8em, -1em);
		min-width: 9em;
		font-weight: 800;
	}

	.captured-by {
		text-align: center;
	}

	:global(.clan-badges span.label) {
		font-weight: bold;
	}
</style>
