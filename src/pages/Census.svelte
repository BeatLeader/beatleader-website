<script>
	import CensusGroup from '../components/Census/CensusGroup.svelte';
	import CensusPlayer from '../components/Census/CensusPlayer.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {censusData} from '../others/census';

	export let results = censusData;
</script>

<ContentBox>
	<div class="title-container">
		<span class="main-title">Beat Saber in Data</span>
	</div>

	{#each results as result}
		<CensusGroup group={result} />
	{/each}
	<CensusPlayer {censusData} />
</ContentBox>

<style>
	.title-container {
		display: flex;
		justify-content: center;
	}
	.main-title {
		font-size: xx-large;
		font-weight: bold;
	}
</style>
