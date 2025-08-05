<script>
	import {navigate} from 'svelte-routing';
	import processPlayer from '../../network/clients/beatleader/player/process';
	import PlayerName from '../Scores/PlayerName.svelte';

	const atroposImport = () => import('atropos/svelte').then(m => m.default);

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	export let badge;
</script>

<div class="badge-details">
	{#await atroposImport()}
		<Spinner />
	{:then Atropos}
		<svelte:component this={Atropos} rotateXMax={14} rotateYMax={14}>
			<img src={badge.image} alt={badge.description} class="badge-image-large" />
		</svelte:component>
	{/await}
	<p class="description">{badge.description}</p>
	<a href={badge.link} target="_blank" rel="noopener noreferrer">Link for more details</a>
	<h5 class="subtitle-text">Players who received this badge:</h5>
	<div class="player-list">
		{#each badge.players as player (player.id)}
			{@const processedPlayer = processPlayer(player)}
			<div class="player-item">
				<PlayerName
					player={processedPlayer}
					showRank={false}
					on:click={() => navigateToPlayer(processedPlayer.alias ?? processedPlayer.playerId)} />
			</div>
		{/each}
	</div>
</div>

<style>
	.badge-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1em;
	}

	:global(.content:has(.badge-details)) {
		overflow: visible;
	}

	:global(.badge-details .atropos-highlight) {
		top: -150% !important;
		height: 400% !important;
	}

	.description {
		color: white;
		max-width: 24em;
		text-align: center;
	}

	.subtitle-text {
		color: white;
	}

	.badge-image-large {
		width: 20em;
	}

	.player-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-height: calc(min(24em, 41vh));
		overflow: auto;
		padding: 0.5em;
	}

	.player-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--linkColor);
		font-size: 1.2em;
	}
</style>
