<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Select from '../Settings/Select.svelte';
	import Button from '../Common/Button.svelte';
	import {RANKING_SORT_BY_VALUES, RANKING_TYPE_VALUES, RANKING_PP_TYPE_VALUES, RANKING_SORT_STAT_KEYS} from './rankingSortConstants';

	const dispatch = createEventDispatcher();

	export let filters;

	let allTypeValues = RANKING_TYPE_VALUES;
	let currentTypeValue = filters.mapsType ?? 'ranked';

	let allPpTypeValues = RANKING_PP_TYPE_VALUES;
	let currentPpTypeValue = filters.ppType ?? 'general';

	let allSortValues = RANKING_SORT_BY_VALUES;
	let currentSortValue = filters.sortBy ?? 'pp';
	let currentOrderValue = filters.order ?? 'desc';

	function onSwitcherChanged(e) {
		dispatch('sort-changed', currentSortValue);
	}

	function onTypeChanged(e) {
		dispatch('maps-type-changed', currentTypeValue);
	}

	function onPPTypeChanged(e) {
		dispatch('pp-type-changed', currentPpTypeValue);
	}

	function onOrderChanged(e) {
		dispatch('order-changed', currentOrderValue);
	}
</script>

<div class="search-and-orders">
	<div class="sorting-options">
		{#if RANKING_SORT_STAT_KEYS[currentSortValue].general}
			<Select bind:value={currentPpTypeValue} options={allPpTypeValues} fontSize={0.8} fontPadding={0.4} on:change={onPPTypeChanged} />
		{/if}
		<Select bind:value={currentSortValue} options={allSortValues} fontSize={0.8} fontPadding={0.4} on:change={onSwitcherChanged} />
		{#if RANKING_SORT_STAT_KEYS[currentSortValue].ranked}
			<Select bind:value={currentTypeValue} options={allTypeValues} fontSize={0.8} fontPadding={0.4} on:change={onTypeChanged} />
		{/if}
		<Button
			cls="order-toggle"
			iconFa="fas {currentOrderValue === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'}"
			label={currentOrderValue === 'asc' ? 'Ascending' : 'Descending'}
			title={currentOrderValue === 'asc' ? 'Ascending' : 'Descending'}
			on:click={() => dispatch('order-changed', currentOrderValue === 'asc' ? 'desc' : 'asc')} />
	</div>
</div>

<style>
	.search-and-orders {
		display: flex;
		flex-direction: column;
		margin-bottom: 1em;
		gap: 0.5em;
	}

	.sorting-options {
		display: flex;
		justify-content: left;
		align-items: center;
		gap: 0.3em;
	}
</style>
