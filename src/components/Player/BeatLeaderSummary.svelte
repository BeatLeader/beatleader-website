<script>
	import ScoresStats from './ScoresStats.svelte';

	export let playerId = null;
	export let scoresStats = null;
	export let accBadges = null;
	export let skeleton = false;
	export let profileAppearance;
	export let editEnabled = false;

	let showHidden = false;

	function processStats(stats, profileAppearance, editEnabled) {
		const visible =
			stats?.length && editEnabled
				? stats.map(s => ({...s, disabled: profileAppearance && !profileAppearance.includes(s.key)}))
				: (stats ?? []).filter(s => !profileAppearance || profileAppearance.includes(s?.key));

		const hidden = (stats ?? []).filter(s => !visible.some(v => v.key === s.key));

		return {
			visible,
			hidden,
		};
	}

	$: ({visible: visibleScoresStats, hidden: hiddenScoresStats} = processStats(scoresStats, profileAppearance, editEnabled));
	$: ({visible: visibleAccStats, hidden: hiddenAccStats} = processStats(accBadges, profileAppearance, editEnabled));
</script>

<div class="wrapper">
	<div class="beatleader-summary" class:edit-enabled={editEnabled}>
		{#if scoresStats || skeleton}
			{#if scoresStats}
				<ScoresStats stats={showHidden ? scoresStats : visibleScoresStats} {skeleton} />
			{/if}
			<div>
				{#if accBadges}
					<ScoresStats stats={showHidden ? accBadges : visibleAccStats} />
				{/if}
			</div>
		{/if}
	</div>
	{#if hiddenScoresStats?.length || hiddenAccStats?.length}
		<span
			class="reveal clickable"
			class:opened={showHidden}
			on:click={() => (showHidden = !showHidden)}
			title={showHidden ? 'Hide all stats' : 'Show rest of the stats'}>
			<i class={showHidden ? 'fas fa-eye-slash' : 'far fa-eye'} />
		</span>
	{/if}
</div>

<style>
	.wrapper {
		display: flex;
		align-items: flex-start;
	}

	.beatleader-summary {
		flex-grow: 1;
	}

	.reveal {
		align-self: flex-start;
		cursor: pointer;
	}

	.edit-enabled :global(.badge.disabled) {
		filter: grayscale(1);
		opacity: 0.25;
	}
</style>
