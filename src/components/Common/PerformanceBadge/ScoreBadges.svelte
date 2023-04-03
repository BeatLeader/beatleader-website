<script>
	import {createEventDispatcher} from 'svelte';

	export let badges = null;
	export let additionalClass = null;
	export let selected = null;

	const dispatch = createEventDispatcher();

	let cols = 0;
	let filteredBadges = badges;

	$: if (Array.isArray(badges) && badges?.length) {
		const emptyColIndexes = badges[0]
			.map((_, idx) => (badges.every(row => !row?.[idx]?.component) ? idx : null))
			.filter(idx => idx !== null);

		cols = badges[0].length - emptyColIndexes.length;

		filteredBadges = badges.map(row => row.filter((_, idx) => !emptyColIndexes.includes(idx)));
	}
	$: minWidth = cols ? 6.4 * cols + (cols - 1) * 0.4 : 0;
</script>

<div class="player-performance-badges" style:--min-width={`${minWidth}em`} style:--cols={cols}>
	{#if filteredBadges?.length}
		{#each filteredBadges as row, rowIdx}
			{#each row as badge, colIdx}
				<span
					class={`with-badge ${badge?.className ?? ''} ${additionalClass ?? ''}`}
					class:selected={rowIdx === selected?.row && colIdx === selected?.col}
					title={badge.title}
					on:click={() => dispatch('badge-click', {row: rowIdx, col: colIdx})}>
					{#if badge}
						<svelte:component this={badge.component} {...badge.componentProps}>
							<span slot="label">
								{#if badge.icon}
									<i class={badge.icon} />
								{/if}
								<svelte:component this={badge.slotComponent} {...badge.slotComponentProps} />
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
	}

	.player-performance-badges :global(.compare) {
		opacity: 0.7;
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
