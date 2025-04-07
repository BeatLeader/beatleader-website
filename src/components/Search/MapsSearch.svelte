<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import leaderboardsApiClient from '../../network/clients/beatleader/leaderboard/api-leaderboards';
	import {MINUTE} from '../../utils/date';
	import GenericSearch from './GenericSearch.svelte';
	import MapsHeader from './MapsHeader.svelte';
	import MapsItem from './MapsItem.svelte';

	export let value = '';
	export let priority = 2;

	const dispatch = createEventDispatcher();

	const key = Symbol('maps');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
		type: 'ranked',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.source) {
			case 'header':
				switch (message?.type) {
					case 'filter-map-type':
						if (!message?.value?.value) return;
						filters.type = message.value.value;
						break;
				}

			case 'item':
				if (message?.type === 'select' && message?.value?.id) {
					navigate(`/leaderboard/global/${message.value.id}/1`);
					dispatch('close');
				}
				break;
		}
	}

	const fetchPage = async (filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) =>
		leaderboardsApiClient.getProcessed({page, filters: {...filters, sortBy: 'name', order: 'asc', count: itemsPerPage, cacheTtl: MINUTE}});

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={MapsHeader}
	item={MapsItem}
	noItems="No maps found."
	url={`/maps/${filters.type}?search=${filters.search}`}
	{priority}
	on:message={onMessage}
	on:close />
