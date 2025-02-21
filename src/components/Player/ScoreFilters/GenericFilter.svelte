<script>
	import {createEventDispatcher} from 'svelte';
	import editModel from '../../../stores/beatleader/profile-edit-model';
	import {debounce} from '../../../utils/debounce';

	export let filter;

	const dispatch = createEventDispatcher();

	let filterOpen = filter?.props?.open ?? false;

	function dispatchValue(value) {
		if (filter?.props?.id?.length) dispatch('change', {id: filter.props.id, value});
	}

	function onFilterChanged(event) {
		const value = event?.detail ?? null;

		dispatchValue(value);
	}

	function onButtonClick() {
		if ($editModel) {
			dispatch('click', {id: filter?.props?.id});
			return;
		}

		filterOpen = !filterOpen;

		if (!filterOpen) dispatchValue(null);
	}

	const debouncedOnFilterChanged = debounce(onFilterChanged, 500);

	$: if (!!$editModel) filterOpen = false;
</script>

{#if filter?.component && filter?.props}
	<div class="filter" class:hidden={filter?.props?.hidden} class:open={filterOpen} title={filter?.props?.title}>
		<span class="filter-component">
			<svelte:component
				this={filter.component}
				{...filter.props}
				open={filterOpen}
				on:change={filter.props.debounce ? debouncedOnFilterChanged : onFilterChanged} />
		</span>

		<i
			class={`fa filter-btn ${!filterOpen ? (filter?.props?.iconFa ?? '') : ''}`}
			class:fa-times={filterOpen}
			title={filterOpen ? 'Click to close and clear filter' : $editModel ? 'Click to toggle' : filter?.props?.title}
			on:click={onButtonClick} />
	</div>
{/if}

<style>
	.filter {
		display: inline-block;
		position: relative;
		width: 1.75em;
		min-height: calc(1em + 0.5em + 2px + 2px);
		overflow: hidden;
		transition: all 300ms ease-out;
		margin-right: 0.25em;
	}

	.filter:not(.open) > .filter-component {
		display: none;
	}

	.filter.open {
		width: 11em;
		overflow: visible;
	}

	.filter > .filter-component {
		position: relative;
		left: 0;
		bottom: 0;
		width: calc(100% - 1.4em);
		height: 100%;
		line-height: 1;
		color: var(--textColor);
		background-color: transparent;
		transition: all 300ms ease-out;
		outline: none;
	}

	.filter-btn {
		position: absolute;
		top: 0;
		right: 0;
		width: 1.75em;
		text-align: center;
		padding: 0.4em;
		transition: all 300ms ease-out;
		background-color: var(--dimmed);
		z-index: 1;
		cursor: pointer;
		border-radius: 0.2em;
	}

	.filter.open .filter-btn {
		width: auto;
		background-color: var(--error);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
</style>
