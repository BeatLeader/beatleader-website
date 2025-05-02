<script>
	import {fade, fly} from 'svelte/transition';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import ExmachinaCurve from './ExmachinaCurve.svelte';

	export let leaderboard;
	export let selectedModifiers;
	const starGeneratorStore = createStarGeneratorStore();

	let currentLeaderboard = null;

	let hash = null;
	let downloadUrl = null;
	let diffInfo = null;
	let speed = 1.0;

	let exmachinadata = null;
	let notes = null;

	function onLeaderboardChange(newLeaderboard) {
		if (currentLeaderboard?.leaderboardId === newLeaderboard?.leaderboardId) return;

		currentLeaderboard = newLeaderboard;

		hash = newLeaderboard?.song?.hash;
		downloadUrl = newLeaderboard?.song?.downloadUrl;
		diffInfo = newLeaderboard?.diffInfo;

		speed = selectedModifiers?.find(m => m.name == 'SS')
			? 0.8
			: selectedModifiers?.find(m => m.name == 'SF')
				? 1.5
				: selectedModifiers?.find(m => m.name == 'FS')
					? 1.2
					: 1.0;
	}

	$: onLeaderboardChange(leaderboard);
	$: exmachinadata = hash && $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + speed];
	$: notes = exmachinadata?.notes;
	$: !exmachinadata && hash && starGeneratorStore.fetchExMachina(hash, downloadUrl, diffInfo?.diff, diffInfo?.type, speed);
</script>

<article transition:fade|global>
	<ExmachinaCurve {notes} {speed} {selectedModifiers} />
</article>
