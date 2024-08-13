<script>
	import MapTriangle from '../Common/MapTriangle.svelte';
	import MapRequirementDescription from './MapRequirementDescription.svelte';
	import MapTypeDescription from './MapTypeDescription.svelte';

	export let leaderboard;
	export let ratings;
</script>

<div class="triangle-container darkened-background">
	<h2 class="title is-6" style="display: contents;">
		{#if leaderboard.stats && leaderboard.stats.passRating}
			<MapTriangle width="10em" height="10em" mapRating={ratings ?? leaderboard.stats} showRatings={true} />
		{/if}
	</h2>
	{#if leaderboard?.stats?.requirements || leaderboard?.stats?.type}
		<div class="requirements">
			{#if leaderboard?.stats?.type}
				<MapTypeDescription type={leaderboard?.stats.type} />
			{/if}
			{#if leaderboard?.stats?.requirements}
				<MapRequirementDescription type={leaderboard?.stats.requirements} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.triangle-container {
		padding: 1em;
		margin: 0.5em;
		margin-bottom: 1em;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.requirements {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.2em;
		row-gap: 0.5em;
		padding-top: 0.7em;
		padding-bottom: 0.7em;
	}
</style>
