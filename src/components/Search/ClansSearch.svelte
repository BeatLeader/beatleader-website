<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import clansApiClient from '../../network/clients/beatleader/clans/api-clans';
	import {MINUTE} from '../../utils/date';
	import GenericSearch from './GenericSearch.svelte';
	import ClansHeader from './ClansHeader.svelte';
	import ClansItem from './ClansItem.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	const key = Symbol('clans');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.type) {
			case 'select':
				if (message?.value?.tag) {
					navigate(`/clans/${message.value.tag}`);
					dispatch('close');
				}
				break;
		}
	}

	const fetchPage = async (filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) =>
		clansApiClient.getProcessed({page, filters: {...filters, sort: 'name', order: 'asc', count: itemsPerPage, cacheTtl: MINUTE}});

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={ClansHeader}
	item={ClansItem}
	noItems="No clans found."
	on:message={onMessage} />
