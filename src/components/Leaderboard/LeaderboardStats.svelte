<script>
	import {fade, fly} from 'svelte/transition';
	import Value from '../Common/Value.svelte';
	import Duration from '../Song/Duration.svelte';
	import createBeatSaverService from '../../services/beatmaps';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import ExmachinaCurve from './ExmachinaCurve.svelte';

	export let leaderboard;

	let diff;
	let beatSaverService;

	const starGeneratorStore = createStarGeneratorStore();

	async function findDiff(leaderboard) {
		if (leaderboard?.beatMaps) {
			diff = leaderboard?.beatMaps?.versions[0].diffs.find(el => el.difficulty.toLowerCase() === leaderboard.diffInfo.diff.toLowerCase());
		} else if (leaderboard?.song) {
			if (!beatSaverService) {
				beatSaverService = createBeatSaverService();
			}

			const songInfoValue = await beatSaverService.byHash(leaderboard.song.hash);
			diff = songInfoValue.versions[0].diffs.find(el => el.difficulty.toLowerCase() === leaderboard.diffInfo.diff.toLowerCase());
		}
	}

	$: metadata = leaderboard?.beatMaps?.metadata;
	$: findDiff(leaderboard);

	$: hash = leaderboard.song.hash;
	$: diffInfo = leaderboard.diffInfo;
	$: exmachinadata = $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type];
	$: exmachinastats = exmachinadata?.stats;
	$: notes = exmachinadata?.notes;
	$: !exmachinadata && starGeneratorStore.fetchExMachina(hash, diffInfo?.diff, diffInfo?.type);
</script>

<article transition:fade>
	{#if diff}
		<div class="stats">
			{#if exmachinastats}
				<div transition:fade>
					<i class="fas fa-robot" /> EX MACHINA:
					<strong>
						<Value value={exmachinastats.balanced} digits={2} />
					</strong>
				</div>
				<div transition:fade>
					<i class="fas fa-face-dizzy" /> Techiness:
					<strong>
						<Value value={exmachinastats.tech} digits={2} />
					</strong>
				</div>
			{/if}
			{#if leaderboard?.song?.duration}
				<div transition:fade>
					<span class="time" transition:fade={{duration: 500}}>
						<i class="fas fa-clock" /> Duration:
						<strong>
							<Duration value={leaderboard.song.duration} />
						</strong></span>
				</div>
			{/if}

			{#if diff.notes}
				<div transition:fade>
					<i class="fas fa-music" /> Notes:
					<strong>
						<Value value={diff.notes} digits={0} />
					</strong>
				</div>
			{/if}

			{#if leaderboard?.song?.bpm}
				<div transition:fade>
					<i class="fas fa-drum" /> BPM:
					<strong>
						<Value value={leaderboard.song.bpm} digits={0} />
					</strong>
				</div>
			{/if}

			{#if diff.njs}
				<div transition:fade>
					<i class="fas fa-tachometer-alt" /> NJS:
					<strong>
						<Value value={diff.njs} digits={0} />
					</strong>
				</div>
			{/if}

			{#if Number.isFinite(diff.offset)}
				<div transition:fade>
					<i class="fas fa-ruler-horizontal" /> Offset:
					<strong>
						<Value value={diff.offset} digits={2} />
					</strong>
				</div>
			{/if}

			{#if diff.nps}
				<div transition:fade>
					<i class="fas fa-fire" /> NPS:
					<strong>
						<Value value={diff.nps} digits={2} />
					</strong>
				</div>
			{/if}

			{#if diff.bombs}
				<div transition:fade>
					<i class="fas fa-bomb" /> Bombs:
					<strong>
						<Value value={diff.bombs} digits={0} zero="0" />
					</strong>
				</div>
			{/if}

			{#if diff.obstacles}
				<div transition:fade>
					<i class="fas fa-skull" /> Obstacles:
					<strong>
						<Value value={diff.obstacles} digits={0} zero="0" />
					</strong>
				</div>
			{/if}
		</div>
	{/if}

	{#if notes}
		<ExmachinaCurve {notes} on:speed-changed={e => starGeneratorStore.fetchExMachina(hash, diffInfo?.diff, diffInfo?.type, e.detail)} />
	{/if}
</article>

<style>
	.stats {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		column-gap: 1em;
	}
</style>
