<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import eventsApiClient from '../../network/clients/beatleader/events/api-events';
	import {MINUTE} from '../../utils/date';
	import GenericSearch from './GenericSearch.svelte';
	import EventsHeader from './EventsHeader.svelte';
	import EventsItem from './EventsItem.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	const key = Symbol('events');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.type) {
			case 'select':
				if (message?.value?.id) {
					navigate(`/event/${message.value.id}`);
					dispatch('close');
				}
				break;
		}
	}

	const fetchPage = async (filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) =>
		eventsApiClient.getProcessed({page, filters: {...filters, sortBy: 'name', order: 'desc', count: itemsPerPage, cacheTtl: MINUTE}});

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={EventsHeader}
	item={EventsItem}
	noItems="No events found."
	url={`/events?search=${filters.search}`}
	on:message={onMessage}
	on:close />
