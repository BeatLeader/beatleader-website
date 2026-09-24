<script>
	import {createEventDispatcher} from 'svelte';
	import Select from '../Settings/Select.svelte';
	import Button from './Button.svelte';

	const dispatch = createEventDispatcher();

	export let filters;
	export let sortValues = [];
	export let sortKey = 'sort';
	export let defaultSort = sortValues[0]?.value;
	export let defaultThenSort = 'date';
	export let thenSortTitle = 'Items tied after sorting by the main criteria will be then sorted in groups by additional criteria';

	const RELEVANCE_VALUES = [
		{value: 'relevance', name: 'Relevance', title: 'Sort by search relevance first', icon: 'fa-magnifying-glass'},
		{value: 'ignore', name: 'Ignore Relevance', title: 'Skip relevance sorting, return all matches', icon: 'fa-list'},
	];

	let showThenSort = (filters?.thenSort ?? defaultThenSort) !== defaultThenSort || (filters?.thenOrder ?? 'desc') !== 'desc';

	const flipOrder = order => (order === 'asc' ? 'desc' : 'asc');
</script>

<div class="sorting-options">
	{#if filters?.search?.length}
		<Select
			value={filters.noSearchSort ? 'ignore' : 'relevance'}
			options={RELEVANCE_VALUES}
			fontSize={0.8}
			fontPadding={0.4}
			on:change={e => {
				if (!e?.detail?.value) return;
				dispatch('no-search-sort-changed', e.detail.value === 'ignore');
			}} />
		{#if !filters.noSearchSort}
			<span class="then-label" title={thenSortTitle}>then</span>
		{/if}
	{/if}

	<Select
		value={filters?.[sortKey] ?? defaultSort}
		options={sortValues}
		fontSize={0.8}
		fontPadding={0.4}
		on:change={e => dispatch('sort-changed', e?.detail?.value)} />
	<Button
		cls="order-toggle"
		type="text"
		iconFa="fas {filters?.order === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
		title={filters?.order === 'asc' ? 'Ascending' : 'Descending'}
		on:click={() => dispatch('order-changed', flipOrder(filters?.order))} />
	<Button
		cls="then-sort-toggle"
		type="text"
		iconFa="fas fa-chevron-{showThenSort ? 'left' : 'right'}"
		title="{showThenSort ? 'Hide' : 'Show'} secondary sorting"
		on:click={() => (showThenSort = !showThenSort)} />

	{#if showThenSort}
		<span class="then-label" title={thenSortTitle}>then</span>
		<Select
			value={filters?.thenSort ?? defaultThenSort}
			options={sortValues}
			fontSize={0.8}
			fontPadding={0.4}
			on:change={e => dispatch('then-sort-changed', e?.detail?.value)} />
		<Button
			cls="order-toggle"
			type="text"
			iconFa="fas {filters?.thenOrder === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
			title={filters?.thenOrder === 'asc' ? 'Ascending' : 'Descending'}
			on:click={() => dispatch('then-order-changed', flipOrder(filters?.thenOrder))} />
	{/if}
</div>

<style>
	.sorting-options {
		display: flex;
		flex-wrap: wrap;
		justify-content: left;
		align-items: center;
		gap: 0.3em;
	}

	.then-label {
		color: grey;
		font-size: 12px;
		cursor: help;
	}
</style>
