<script>
	import {fade, fly} from 'svelte/transition';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import ExmachinaCurve from './ExmachinaCurve.svelte';

	export let leaderboard;
	export let selectedModifiers;
	const starGeneratorStore = createStarGeneratorStore();

	$: hash = leaderboard?.song?.hash;
	$: downloadUrl = leaderboard?.song?.downloadUrl;
	$: diffInfo = leaderboard?.diffInfo;
	$: speed = selectedModifiers?.find(m => m.name == 'SS')
		? 0.8
		: selectedModifiers?.find(m => m.name == 'SF')
			? 1.5
			: selectedModifiers?.find(m => m.name == 'FS')
				? 1.2
				: 1.0;
	$: exmachinadata = $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + speed];
	$: notes = exmachinadata?.notes;
	$: !exmachinadata && starGeneratorStore.fetchExMachina(hash, downloadUrl, diffInfo?.diff, diffInfo?.type, speed);
</script>

<article transition:fade|global>
	<ExmachinaCurve {notes} {speed} {selectedModifiers} />
</article>
