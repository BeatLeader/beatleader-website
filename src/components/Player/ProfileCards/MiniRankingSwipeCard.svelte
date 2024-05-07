<script>
	import createAccSaberService from '../../../services/accsaber';
	import MiniRankings from '../../Ranking/MiniRankings.svelte';
	import AccSaberMiniRanking from '../../Ranking/AccSaberMini.svelte';

	export let player = null;
	export let selected = false;

	const accSaberService = createAccSaberService();

	$: accSaberAvailable = accSaberService.isDataForPlayerAvailable(player.playerId);

	$: rank = player?.playerInfo.rank;
	$: country = player?.playerInfo.countries[0].country;
	$: countryRank = player?.playerInfo.countries[0].rank;
</script>

{#if selected}
	<div class="mini-ranking">
		<MiniRankings {rank} {country} {countryRank} on:height-changed />

		{#await accSaberAvailable}
			Loading...
		{:then accSaberAvailable}
			{#if accSaberAvailable}
				<div>
					<AccSaberMiniRanking playerId={player.playerId} category="overall" numOfPlayers={5} />
				</div>
			{/if}
		{/await}
	</div>
{/if}

<style>
	.mini-ranking {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-gap: 1rem;
	}

	.mini-ranking :global(section) {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}

	.mini-ranking :global(section > h3) {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}

	@media (max-width: 1023px) {
		.mini-ranking {
			grid-template-columns: 1fr;
		}
	}
</style>
