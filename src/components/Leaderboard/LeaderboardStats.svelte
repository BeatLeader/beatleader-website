<script>
	import Value from '../Common/Value.svelte';
	import Duration from '../Song/Duration.svelte';

	export let leaderboard;

	$: diff = leaderboard?.difficultyBl;
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

			{#if diff.chains}
				<div>
					<i class="fas fa-link" /> Chain links:
					<strong>
						<Value value={diff.chains} digits={0} />
					</strong>
				</div>
			{/if}

			{#if diff.sliders}
				<div>
					<i class="fas fa-arrows-turn-to-dots" /> Arcs:
					<strong>
						<Value value={diff.sliders} digits={0} />
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

			{#if diff.walls}
				<div>
					<i class="fas fa-skull" /> Obstacles:
					<strong>
						<Value value={diff.walls} digits={0} zero="0" />
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
		justify-content: space-between;
		column-gap: 1em;
		padding: 0.5em;
	}
</style>
