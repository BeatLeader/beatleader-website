<script>
	import {formatNumber} from '../../../utils/format';
	import Badge from '../Badge.svelte';
	import Value from '../Value.svelte';
	export let beatSavior = null;
	export let improvements = null;

	$: prevMissedNotes = (beatSavior?.stats?.missedNotes ?? 0) - (improvements?.missedNotes ?? 0);
	$: prevBadCuts = (beatSavior?.stats?.badCuts ?? 0) - (improvements?.badCuts ?? 0);
	$: prevWallsHit = (beatSavior?.stats?.wallHit ?? 0) - (improvements?.wallHit ?? 0);
	$: prevBombHit = (beatSavior?.stats?.bombHit ?? 0) - (improvements?.bombCuts ?? 0);
	$: prevMistakes =
		improvements && beatSavior?.stats && improvements.timeset?.length && improvements.score
			? prevMissedNotes + prevBadCuts + prevWallsHit + prevBombHit
			: null;
</script>

{#if beatSavior}
	<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
		<span
			slot="label"
			title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}>
			{#if beatSavior.stats.miss || beatSavior.stats.bombHit || beatSavior.stats.wallHit}
				<i class="fas fa-times" />
				<Value
					title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}
					value={beatSavior.stats.miss + beatSavior.stats.wallHit + beatSavior.stats.bombHit}
					prevTitle={`Missed notes: ${prevMissedNotes}, Bad cuts: ${prevBadCuts}, Bomb hit: ${prevBombHit}, Wall hit: ${prevWallsHit}`}
					prevValue={prevMistakes}
					forcePrev={Number.isFinite(prevMistakes)}
					inline={true}
					digits={0}>
					<small slot="prev">
						{#if Number.isFinite(prevMistakes)}
							(vs
							{#if prevMistakes}
								<i class="fas fa-times" /> {formatNumber(prevMistakes, 0)}
							{:else}
								FC
							{/if}
							)
						{/if}
					</small>
				</Value>
			{:else}
				<span class="fc">
					FC
					{#if Number.isFinite(prevMistakes)}
						<small
							title={`Missed notes: ${prevMissedNotes}, Bad cuts: ${prevBadCuts}, Bomb hit: ${prevBombHit}, Wall hit: ${prevWallsHit}`}>
							(vs
							{#if prevMistakes}
								<i class="fas fa-times" /> {formatNumber(prevMistakes, 0)}
							{:else}
								FC
							{/if}
							)
						</small>
					{/if}
				</span>
			{/if}
		</span>
	</Badge>
{/if}

<style>
	.fc {
		color: yellow;
	}
	.fc small {
		color: white;
	}
</style>
