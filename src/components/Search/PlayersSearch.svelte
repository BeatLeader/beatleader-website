<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import playerFindApiClient from '../../network/clients/beatleader/players/api-player-find';
	import {MINUTE} from '../../utils/date';
	import PlayersHeader from './PlayersHeader.svelte';
	import PlayersItem from './PlayersItem.svelte';
	import GenericSearch from './GenericSearch.svelte';

	export let value = '';
	export let priority = 1;

	const dispatch = createEventDispatcher();

	const key = Symbol('players');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.type) {
			case 'select':
				if (message?.value?.playerId) {
					navigate(`/u/${message.value.playerId}`);
					dispatch('close');
				}
				break;
		}
	}

	const fetchPage = async (filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) =>
		playerFindApiClient.getProcessed({
			query: filters?.search ?? '',
			cacheTtl: MINUTE,
			page,
			count: itemsPerPage,
			sortBy: 'name',
			order: 'asc',
		});

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={PlayersHeader}
	item={PlayersItem}
	noItems="No players found."
	url={`ranking?search=${filters.search}`}
	{priority}
	on:message={onMessage}
	on:close />
