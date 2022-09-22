<script>
	import ScoresStats from './ScoresStats.svelte';
	import {createEventDispatcher} from 'svelte';

	export let playerId = null;
	export let scoresStats = null;
	export let accBadges = null;
	export let skeleton = false;
	export let profileAppearance;
	export let editModel = null;

	const dispatch = createEventDispatcher();

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

	function onToggleStat(key) {
		if (!key?.length || !editModel) return;

		if (!editModel.profileAppearance) editModel.profileAppearance = [];

		if (editModel.profileAppearance.includes(key)) {
			editModel.profileAppearance = editModel.profileAppearance.filter(s => s !== key);
			if (!editModel.profileAppearance.length) editModel.profileAppearance = null;
		} else editModel.profileAppearance = [...editModel.profileAppearance, key];
	}

	$: ({visible: visibleScoresStats, hidden: hiddenScoresStats} = processStats(
		scoresStats,
		editModel?.profileAppearance ?? profileAppearance,
		!!editModel
	));
	$: ({visible: visibleAccStats, hidden: hiddenAccStats} = processStats(
		accBadges,
		editModel?.profileAppearance ?? profileAppearance,
		!!editModel
	));
</script>

<div class="wrapper">
	<div class="beatleader-summary">
		{#if scoresStats || skeleton}
			{#if scoresStats}
				<ScoresStats stats={showHidden ? scoresStats : visibleScoresStats} {skeleton} on:click={e => onToggleStat(e?.detail?.key)} />
			{/if}
			<div>
				{#if accBadges}
					<ScoresStats stats={showHidden ? accBadges : visibleAccStats} on:click={e => onToggleStat(e?.detail?.key)} />
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

	:global(.edit-enabled) * :global(.badge) {
		cursor: cell;
	}

	:global(.edit-enabled) * :global(.badge.disabled) {
		filter: grayscale(1);
		opacity: 0.25;
		transition: all 200ms;
	}

	:global(.edit-enabled) * :global(.badge.disabled:hover) {
		filter: none;
		opacity: 0.5;
	}
</style>
