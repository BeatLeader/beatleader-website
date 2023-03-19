<script>
	import {createEventDispatcher} from 'svelte';
	import playerFindApiClient from '../../network/clients/beatleader/players/api-player-find';
	import {MINUTE} from '../../utils/date';
	import PlayersHeader from './PlayersHeader.svelte';
	import PlayersItem from './PlayersItem.svelte';
	import GenericSearch from './GenericSearch.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	const key = Symbol('players');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		// TODO: remove it
		// console.log('players/onMessage()', message);
		switch (message?.type) {
			case 'select':
				if (message?.value) {
					// TODO: navigate
					console.warn('PlayersSearch/onMessage(SELECT):', message.value);
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
	on:message={onMessage} />
