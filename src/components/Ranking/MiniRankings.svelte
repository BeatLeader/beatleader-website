<script>
	import createRankingService from '../../services/beatleader/ranking';
	import Mini from './Mini.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import {configStore} from '../../stores/config';

	export let rank = null;
	export let country = null;
	export let countryRank = null;
	export let box = false;

	let rankingService = createRankingService();
	let globalRanking = null;
	let countryRanking = null;
	let friendsRanking = null;
	let isLoading = true;

	async function onParamsChanged(rank, country, countryRank, friends) {
		if (!rank) return;

		try {
			isLoading = true;

			const ranking = await rankingService.getMiniRanking(rank, country, countryRank, friends);
			if (!ranking) return;

			globalRanking = ranking.global;
			countryRanking = ranking.country;
			friendsRanking = ranking.friends;
		} finally {
			isLoading = false;
		}
	}

	$: onParamsChanged(rank, country, countryRank, $configStore.profileParts.friendsMiniRanking);
</script>

{#if !box}
	{#if $configStore.profileParts.globalMiniRanking}
		<div>
			<Mini {isLoading} players={globalRanking} {rank} on:height-changed />
		</div>
	{/if}

	{#if $configStore.profileParts.countryMiniRanking}
		<div>
			<Mini {isLoading} players={countryRanking} rank={countryRank} country={true} on:height-changed />
		</div>
	{/if}
	{#if $configStore.profileParts.friendsMiniRanking}
		<div>
			<Mini {isLoading} players={friendsRanking} {rank} friends={true} on:height-changed />
		</div>
	{/if}
{:else}
	{#if $configStore.profileParts.globalMiniRanking}
		<ContentBox cls="mini-rainking-box frosted">
			<Mini {isLoading} players={globalRanking} {rank} frosted={true} on:height-changed />
		</ContentBox>
	{/if}
	{#if $configStore.profileParts.countryMiniRanking}
		<ContentBox cls="mini-rainking-box frosted">
			<Mini {isLoading} players={countryRanking} rank={countryRank} country={true} frosted={true} on:height-changed />
		</ContentBox>
	{/if}
	{#if $configStore.profileParts.friendsMiniRanking}
		<ContentBox cls="mini-rainking-box frosted">
			<Mini {isLoading} players={friendsRanking} {rank} friends={true} frosted={true} on:height-changed />
		</ContentBox>
	{/if}
{/if}

<style>
</style>
