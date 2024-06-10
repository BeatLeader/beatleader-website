<script>
	import ScoresStats from './ScoresStats.svelte';
	import {createEventDispatcher} from 'svelte';

	export let playerId = null;
	export let scoresStats = null;
	export let accBadges = null;
	export let skeleton = false;
	export let profileAppearance;
	export let editModel = null;
	export let overrideVisibleStats = null;

	const dispatch = createEventDispatcher();

	let showHidden = false;

	function processStats(stats, profileAppearance, editEnabled, overrideVisibleStats) {
		var visible;

		if (!overrideVisibleStats) {
			visible =
				stats?.length && editEnabled
					? stats.map(s => ({...s, title: 'Click to toggle', disabled: profileAppearance && !profileAppearance.includes(s.key)}))
					: (stats ?? []).filter(s => !profileAppearance || profileAppearance.includes(s?.key));
		} else {
			visible = (stats ?? []).filter(s => overrideVisibleStats.includes(s?.key));
		}

		const hidden = (stats ?? []).filter(s => !visible.some(v => v.key === s.key));

		return {
			visible,
			hidden,
		};
	}

	function onToggleStat(key) {
		if (!key?.length || !editModel?.data) return;

		if (!editModel.data?.profileAppearance) editModel.data.profileAppearance = [];

		if (editModel.data?.profileAppearance.includes(key)) {
			editModel.data.profileAppearance = editModel.data?.profileAppearance.filter(s => s !== key);
			if (!editModel.data.profileAppearance.length) editModel.data.profileAppearance = null;
		} else editModel.data.profileAppearance = [...editModel.data?.profileAppearance, key];
	}

	$: ({visible: visibleScoresStats, hidden: hiddenScoresStats} = processStats(
		scoresStats,
		editModel?.data?.profileAppearance ?? profileAppearance,
		!!editModel,
		overrideVisibleStats
	));
	$: ({visible: visibleAccStats, hidden: hiddenAccStats} = processStats(
		accBadges,
		editModel?.data?.profileAppearance ?? profileAppearance,
		!!editModel,
		overrideVisibleStats
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
		<div style="margin: 0; padding: 0; margin-top: 0.2em; margin-left: 0.3em;">
			<span
				class="reveal clickable"
				class:opened={showHidden}
				on:click={() => (showHidden = !showHidden)}
				title={showHidden ? 'Hide all stats' : 'Show rest of the stats'}>
				<i class={showHidden ? 'fas fa-eye-slash' : 'far fa-eye'} />
			</span>
		</div>
	{/if}
</div>

<style>
	.wrapper {
		display: flex;
		align-items: flex-start;
	}

	.reveal {
		align-self: flex-start;
		cursor: pointer;
	}

	:global(.edit-enabled) * :global(.badge) {
		cursor: cell;
	}

	:global(.edit-enabled) * :global(.badge:not(.disabled)) {
		background: transparent !important;
		border-style: dotted;
		border-width: 0.15em;
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
