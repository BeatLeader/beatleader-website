<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {writable} from 'svelte/store';

	export let badges = null;
	export let additionalClass = null;
	export let selected = null;
	export let forceNotDemo = false;

	const isDemo = getContext('isDemo') ?? writable(false);

	const dispatch = createEventDispatcher();

	let cols = 0;
	let indexes = [];

	let indexesRefreshed = null;

	function rotateBadge(rowIdx, colIdx) {
		if (!Number.isFinite(indexes?.[rowIdx]?.[colIdx]?.idx)) return;

		indexes[rowIdx][colIdx].idx += 1;
		if (indexes[rowIdx][colIdx].idx > indexes[rowIdx][colIdx].length - 1) indexes[rowIdx][colIdx].idx = 0;

		indexesRefreshed = Math.random();
	}

	$: if (Array.isArray(badges) && badges?.length) {
		const emptyColIndexes = badges[0].map((_, idx) => (badges.every(row => !row?.[idx]?.length) ? idx : null)).filter(idx => idx !== null);

		cols = badges[0].length - emptyColIndexes.length;

		indexes = badges.map(row => row.filter((_, idx) => !emptyColIndexes.includes(idx)).map(col => ({idx: 0, length: col?.length ?? 0})));
	}
	$: minWidth = cols ? 6.4 * cols + (cols - 1) * 0.4 : 0;

	$: currentBadges = indexes.map((row, rowIdx) => row.map((col, colIdx) => badges?.[rowIdx]?.[colIdx]?.[col?.idx ?? 0] ?? null));
</script>

<div class="player-performance-badges" class:not-demo={forceNotDemo} style:--min-width={`${minWidth}em`} style:--cols={cols}>
	{#if currentBadges?.length}
		{#key indexesRefreshed}
			{#each currentBadges as row, rowIdx}
				{#each row as badge, colIdx}
					<span
						class={`with-badge ${badge?.className ?? ''} ${additionalClass ?? ''}`}
						class:multi={!forceNotDemo && !$isDemo && indexes?.[rowIdx]?.[colIdx]?.length > 1}
						class:selected={rowIdx === selected?.row && colIdx === selected?.col}
						title={badge?.title}
						on:click={() => {
							if (!$isDemo && indexes?.[rowIdx]?.[colIdx]?.length > 1) rotateBadge(rowIdx, colIdx);
							dispatch('badge-click', {row: rowIdx, col: colIdx});
						}}>
						{#if indexes?.[rowIdx]?.[colIdx]?.length}
							<svelte:component this={badge?.component} {...badge?.componentProps}>
								<span slot="label">
									{#if badge?.icon}
										<i class={badge?.icon} />
									{/if}
									<svelte:component this={badge?.slotComponent} {...badge?.slotComponentProps} />
								</span>
							</svelte:component>
						{/if}
					</span>
				{/each}
			{/each}
		{/key}
	{/if}
</div>

<style>
	.player-performance-badges {
		display: grid;
		grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
		grid-column-gap: 0.4em;
		grid-row-gap: 0.25em;
		min-width: var(--min-width, 20rem);
		height: 100%;
	}

	.player-performance-badges :global(.compare) {
		opacity: 0.7;
	}

	.with-badge.multi,
	.with-badge.multi :global(*[title]) {
		cursor: pointer !important;
	}

	.beatSavior {
		font-size: 0.85em;
	}

	.beatSavior.with-badge i {
		font-size: 0.875em;
	}

	.beatSavior.with-badge :global(.label) {
		font-size: 0.75em;
	}

	.pp {
		min-width: 5em;
	}

	.pp.with-badge {
		position: relative;
	}

	.acc {
		min-width: 4em;
	}

	.acc :global(.badge .label) {
		min-width: fit-content;
	}

	.score {
		min-width: 5.25em;
	}

	.with-badge {
		text-align: center;
	}

	.with-badge :global(.badge) {
		height: 100%;
	}

	.beatSavior.with-badge :global(.badge > .label) {
		width: 100%;
	}
	.beatSavior.with-badge :global(.badge > .label small) {
		margin-left: 0.35em;
	}

	.with-badge :global(.badge > .label small) {
		font-size: 0.875em !important;
	}

	.with-badge.selected {
		outline: 2px dashed var(--textColor);
	}

	:global(*:not(.compare) > .badge.nominated-pp) {
		border: 2px dashed #ffffffb3;
		--badge-color: transparent !important;
	}
</style>
