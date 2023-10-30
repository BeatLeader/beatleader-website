<script>
	import {fade, fly} from 'svelte/transition';
	import Value from '../Common/Value.svelte';
	import Duration from '../Song/Duration.svelte';
	import createBeatSaverService from '../../services/beatmaps';

	export let leaderboard;

	let diff;
	let beatSaverService;

	async function findDiff(leaderboard) {
		var diffFinder = map => {
			return map?.versions[0].diffs.find(
				el =>
					el.difficulty.toLowerCase() === leaderboard.diffInfo.diff.toLowerCase() &&
					el.characteristic.toLowerCase() === leaderboard.diffInfo.type.toLowerCase()
			);
		};

		if (leaderboard?.beatMaps) {
			diff = diffFinder(leaderboard?.beatMaps);
		} else if (leaderboard?.song) {
			if (!beatSaverService) {
				beatSaverService = createBeatSaverService();
			}

			const songInfoValue = await beatSaverService.byHash(leaderboard.song.hash);
			diff = diffFinder(songInfoValue);
		}
	}

	$: findDiff(leaderboard);
</script>

{#if diff}
	<div>
		<div class="stats">
			{#if leaderboard?.song?.duration}
				<div>
					<i class="fas fa-clock" /> Duration:
					<strong>
						<Duration value={leaderboard.song.duration} />
					</strong>
				</div>
			{/if}

			{#if diff.notes}
				<div>
					<i class="fas fa-music" /> Notes:
					<strong>
						<Value value={diff.notes} digits={0} />
					</strong>
				</div>
			{/if}

			{#if leaderboard?.song?.bpm}
				<div>
					<i class="fas fa-drum" /> BPM:
					<strong>
						<Value value={leaderboard.song.bpm} digits={0} />
					</strong>
				</div>
			{/if}

			{#if diff.njs}
				<div>
					<i class="fas fa-tachometer-alt" /> NJS:
					<strong>
						<Value value={diff.njs} digits={0} />
					</strong>
				</div>
			{/if}

			{#if Number.isFinite(diff.offset)}
				<div>
					<i class="fas fa-ruler-horizontal" /> Offset:
					<strong>
						<Value value={diff.offset} digits={2} />
					</strong>
				</div>
			{/if}

			{#if diff.nps}
				<div>
					<i class="fas fa-fire" /> NPS:
					<strong>
						<Value value={diff.nps} digits={2} />
					</strong>
				</div>
			{/if}

			{#if diff.bombs}
				<div>
					<i class="fas fa-bomb" /> Bombs:
					<strong>
						<Value value={diff.bombs} digits={0} zero="0" />
					</strong>
				</div>
			{/if}

			{#if diff.obstacles}
				<div>
					<i class="fas fa-skull" /> Obstacles:
					<strong>
						<Value value={diff.obstacles} digits={0} zero="0" />
					</strong>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.stats {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		column-gap: 1em;
	}
</style>
