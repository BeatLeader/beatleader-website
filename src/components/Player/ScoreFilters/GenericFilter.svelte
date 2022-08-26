<script>
	import {createEventDispatcher} from 'svelte';

	export let filter;

	const dispatch = createEventDispatcher();

	let filterOpen = false;

	function dispatchValue(value) {
		if (filter?.props?.id?.length) dispatch('change', {id: filter.props.id, value});
	}

	function onFilterChanged(event) {
		const value = event?.detail ?? null;

		dispatchValue(value);
	}

	function onButtonClick() {
		filterOpen = !filterOpen;

		if (!filterOpen) dispatchValue(null);
	}
</script>

{#if filter?.component && filter?.props}
	<div class="filter" class:open={filterOpen} title={filter?.props?.title}>
		<span class="filter-component" style="opacity:{filterOpen?1:0};">
			<svelte:component this={filter.component} {...filter.props} open={filterOpen} on:change={onFilterChanged} />
		</span>

		<i
			class={`fa filter-btn ${!filterOpen ? filter?.props?.iconFa ?? '' : ''}`}
			class:fa-times={filterOpen}
			title={filterOpen ? 'Click to close and clear filter' : filter?.props?.title}
			on:click={onButtonClick} />
	</div>
{/if}

<style>
	.filter {
		display: inline-block;
		position: relative;
		width: 1.75em;
		height: calc(1em + 0.5em + 2px + 2px);
		overflow: hidden;
		transition: all 300ms ease-out;
		margin-right: 0.25em;
		border-radius: .2em;
	}


	.filter.open {
		width: 11em;
	}

	.filter > .filter-component {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: calc(100% - 1.4em);
		line-height: 1;
		color: var(--textColor);
		background-color: transparent;
		transition: all 300ms ease-out;
		outline: none;
		border-radius: .2em;
	}

	.filter-btn {
		position: absolute;
		top: 0;
		right: 0;
		width: 1.75em;
		text-align: center;
		padding: 0.4em;
		transition: all 300ms ease-out;
		z-index: 1;
		cursor: pointer;
		border-radius: 0.2em;
	}

	.filter.open .filter-btn {
		width: auto;
	}
</style>
