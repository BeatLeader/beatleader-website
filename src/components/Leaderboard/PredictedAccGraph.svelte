<script>
	import {fade, fly} from 'svelte/transition';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import ExmachinaCurve from './ExmachinaCurve.svelte';

	export let leaderboard;

	const starGeneratorStore = createStarGeneratorStore();

	let speed = 1.0;

	$: hash = leaderboard?.song?.hash;
	$: diffInfo = leaderboard?.diffInfo;
	$: exmachinadata = $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + speed];
	$: notes = exmachinadata?.notes;
	$: !exmachinadata && starGeneratorStore.fetchExMachina(hash, diffInfo?.diff, diffInfo?.type, speed);
</script>

<article transition:fade|global>
	<ExmachinaCurve {notes} {speed} on:speed-changed={e => (speed = e.detail)} />
</article>
