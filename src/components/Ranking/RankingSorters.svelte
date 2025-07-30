<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Select from '../Settings/Select.svelte';
	import {RANKING_SORT_BY_VALUES, RANKING_TYPE_VALUES, RANKING_PP_TYPE_VALUES, RANKING_SORT_STAT_KEYS} from './rankingSortConstants';

	const dispatch = createEventDispatcher();

	export let filters;

	let allTypeValues = RANKING_TYPE_VALUES;
	let currentTypeValue = filters.mapsType ?? 'ranked';

	let allPpTypeValues = RANKING_PP_TYPE_VALUES;
	let currentPpTypeValue = filters.ppType ?? 'general';

	let allSortValues = RANKING_SORT_BY_VALUES;
	let currentSortValue = filters.sortBy ?? 'pp';

	let orderValues = [
		{value: 'asc', name: 'Ascending', icon: 'fa-arrow-up'},
		{value: 'desc', name: 'Descending', icon: 'fa-arrow-down'},
	];
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

<nav class="switcher-nav">
	{#if RANKING_SORT_STAT_KEYS[currentSortValue].general}
		<Select bind:value={currentPpTypeValue} options={allPpTypeValues} fontSize={0.8} fontPadding={0.2} on:change={onPPTypeChanged} />
	{/if}
	<Select bind:value={currentSortValue} options={allSortValues} fontSize={0.8} fontPadding={0.2} on:change={onSwitcherChanged} />
	{#if RANKING_SORT_STAT_KEYS[currentSortValue].ranked}
		<Select bind:value={currentTypeValue} options={allTypeValues} fontSize={0.8} fontPadding={0.2} on:change={onTypeChanged} />
	{/if}
	<Select bind:value={currentOrderValue} options={orderValues} fontSize={0.8} fontPadding={0.2} on:change={onOrderChanged} />
</nav>

<style>
	.switcher-nav {
		display: flex;
		gap: 0.4em;
		margin-bottom: 1em;
	}
</style>
