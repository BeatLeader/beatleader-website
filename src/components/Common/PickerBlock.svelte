<script>
	export let icon = null;
	export let hasValue = false;
	export let open = false;
</script>

<div
	class="picker-block"
	class:has-value={hasValue}
	class:with-icon={!!icon}
	style="--height: 44px; --inputFontSize: 1em; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --inputColor: var(--textColor); --placeholderColor: white; --multiSelectPadding: 2px 4rem 2px 4px; --clearSelectRight: 2.2rem; --clearSelectTop: 14px; --clearSelectBottom: auto; --listBackground: var(--background); --listBorder: 1px solid var(--dimmed); --listBorderRadius: 0.25rem; --listMaxHeight: 20rem; --listShadow: none">
	{#if icon}
		<i class="{icon} picker-icon" />
	{/if}
	<slot />
	<i class="fas fa-chevron-{open ? 'up' : 'down'} picker-chevron" />
</div>

<style>
	.picker-block {
		position: relative;
		border: 1px solid var(--faded);
		border-radius: 4px;
		background-color: var(--dimmed);
		color: white;
	}

	.picker-block.has-value {
		border-color: rgba(255, 100, 150, 0.5);
	}

	.picker-icon {
		position: absolute;
		left: 1rem;
		top: 1rem;
		z-index: 1;
		pointer-events: none;
	}

	.picker-chevron {
		position: absolute;
		right: 1rem;
		top: 1rem;
		z-index: 1;
		pointer-events: none;
	}

	.picker-block.with-icon :global(.multiSelect) {
		padding-left: 2.5rem;
	}

	.picker-block :global(.selectContainer) {
		background: transparent;
		border: none;
		border-radius: 3px;
	}

	.picker-block :global(.selectContainer:hover) {
		background-color: var(--background);
	}

	:global(.picker-block:has(.picker-footer) .selectContainer) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.picker-block :global(.selectContainer input) {
		cursor: pointer;
	}

	.picker-block :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}

	.picker-block :global(.listContainer) {
		background-color: var(--background) !important;
		z-index: 8 !important;
		scrollbar-width: thin;
		scrollbar-color: var(--selected) transparent;
	}

	.picker-block :global(.listContainer::-webkit-scrollbar) {
		width: 0.25rem;
	}

	.picker-block :global(.listContainer::-webkit-scrollbar-track) {
		background: none;
	}

	.picker-block :global(.listContainer::-webkit-scrollbar-thumb) {
		background-color: var(--selected, #3273dc);
		border-radius: 6px;
		border: 3px solid var(--selected, #3273dc);
	}

	.picker-block :global(.listItem) {
		cursor: pointer;
		color: white;
		border-bottom: 1px solid gray;
	}

	.picker-block :global(.listItem:last-child) {
		border-bottom: none;
	}

	.picker-block :global(.listItem:hover) {
		background-color: var(--selected);
	}
</style>
