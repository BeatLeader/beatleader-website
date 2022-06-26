<script>
	import createRankingService from '../../services/beatleader/ranking';
	import Mini from './Mini.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	export let rank = null;
	export let country = null;
	export let countryRank = null;
	export let box = false;

	let rankingService = createRankingService();
	let globalRanking = null;
	let countryRanking = null;
	let isLoading = true;

	async function onParamsChanged(rank, country, countryRank) {
		if (!rank) return;

		try {
			isLoading = true;

			const ranking = await rankingService.getMiniRanking(rank, country, countryRank);
			if (!ranking) return;

			globalRanking = ranking.global;
			countryRanking = ranking.country;
		} finally {
			isLoading = false;
		}
	}

	$: onParamsChanged(rank, country, countryRank);
</script>

{#if !isLoading}
	{#if !box}
		<div>
			<Mini players={globalRanking} {rank} on:height-changed />
		</div>

		<div>
			<Mini players={countryRanking} rank={countryRank} country={true} on:height-changed />
		</div>
	{:else}
		<ContentBox>
			<Mini players={globalRanking} {rank} on:height-changed />
		</ContentBox>

		<ContentBox>
			<Mini players={countryRanking} rank={countryRank} country={true} on:height-changed />
		</ContentBox>
	{/if}
{/if}

<style>
</style>
