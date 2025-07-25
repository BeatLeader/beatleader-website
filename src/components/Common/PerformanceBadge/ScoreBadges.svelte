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
	let filteredBadges = badges;

	function rotateBadge(col, rowIdx, colIdx) {
		if (!filteredBadges?.[rowIdx]?.[colIdx]?.badges) return false;

		filteredBadges[rowIdx][colIdx].idx += 1;
		if (filteredBadges[rowIdx][colIdx].idx > col.badges.length - 1) filteredBadges[rowIdx][colIdx].idx = 0;

		filteredBadges[rowIdx][colIdx].id = `bdg-${rowIdx}-${colIdx}-${col?.badges?.[filteredBadges[rowIdx][colIdx].idx]?.metric}`;
		return true;
	}

	$: if (Array.isArray(badges) && badges?.length) {
		const emptyColIndexes = badges[0].map((_, idx) => (badges.every(row => !row?.[idx]?.length) ? idx : null)).filter(idx => idx !== null);

		cols = badges[0].length - emptyColIndexes.length;

		filteredBadges = badges.map((row, rowIdx) =>
			row
				.filter((_, idx) => !emptyColIndexes.includes(idx))
				.map((col, colIdx) => ({id: `bdg-${rowIdx}-${colIdx}-${col?.[0]?.metric}`, idx: 0, badges: col}))
		);
	}
	$: minWidth = cols ? 6.4 * cols + (cols - 1) * 0.4 : 0;
</script>

<div class="player-performance-badges" class:not-demo={forceNotDemo} style:--min-width={`${minWidth}em`} style:--cols={cols}>
	{#if filteredBadges?.length}
		{#each filteredBadges as row, rowIdx (row
			?.map(r => r?.id)
			?.filter(id => id)
			?.join('-') ?? Math.random())}
			{#each row as col, colIdx (col?.id ?? Math.random())}
				<span
					class={`with-badge ${col?.badges?.[col?.idx ?? 0]?.className ?? ''} ${additionalClass ?? ''}`}
					class:multi={!forceNotDemo && !$isDemo && col?.badges?.length > 1}
					class:selected={rowIdx === selected?.row && colIdx === selected?.col}
					title={col.title}
					on:click={e => {
						var rotated = false;
						if (!$isDemo && col?.badges?.length > 1) {
							rotated = rotateBadge(col, rowIdx, colIdx);
						}
						dispatch('badge-click', {row: rowIdx, col: colIdx});
						if ($isDemo || rotated) {
							e.stopPropagation();
							e.preventDefault();
						}
					}}>
					{#if col?.badges?.length}
						<svelte:component this={col?.badges?.[col?.idx ?? 0]?.component} {...col?.badges?.[col?.idx ?? 0]?.componentProps}>
							<span slot="label">
								{#if col?.badges?.[col?.idx ?? 0]?.icon}
									<i class={col.badges[col?.idx ?? 0]?.icon} />
								{/if}
								<svelte:component
									this={col?.badges?.[col?.idx ?? 0]?.slotComponent}
									{...col?.badges?.[col?.idx ?? 0]?.slotComponentProps} />
							</span>
						</svelte:component>
					{/if}
				</span>
			{/each}
		{/each}
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
