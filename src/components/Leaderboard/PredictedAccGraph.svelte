<script>
	import {fade, fly} from 'svelte/transition';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import ExmachinaCurve from './ExmachinaCurve.svelte';

	export let leaderboard;

	const starGeneratorStore = createStarGeneratorStore();

	$: hash = leaderboard?.song?.hash;
	$: diffInfo = leaderboard?.diffInfo;
	$: exmachinadata = $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type];
	$: notes = exmachinadata?.notes;
	$: !exmachinadata && starGeneratorStore.fetchExMachina(hash, diffInfo?.diff, diffInfo?.type);
</script>

<article transition:fade|global>
	{#if notes}
		<ExmachinaCurve {notes} on:speed-changed={e => starGeneratorStore.fetchExMachina(hash, diffInfo?.diff, diffInfo?.type, e.detail)} />
	{/if}
</article>
