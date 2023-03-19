<script>
	import {createEventDispatcher} from 'svelte';
	import GenericSearch from './GenericSearch.svelte';
	import ClansHeader from './ClansHeader.svelte';
	import ClansItem from './ClansItem.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	const key = Symbol('players');

	const ITEMS_PER_PAGE = 5;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.type) {
			case 'select':
				if (message?.value) {
					// TODO: navigate
					console.warn('ClansSearch/onMessage(SELECT):', message.value);
					dispatch('close');
				}
				break;
		}
	}

	// TEST ONLY: replace it with actual fetching from the API
	let total = 50;
	const allItems = () =>
		Array(total)
			.fill(null)
			.map((_, idx) => ({
				clanId: idx + 1,
				name: `Clan ${idx + 1} (${value})`,
			}));

	async function fetchPage(filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) {
		console.log(`players/fetchPage(), page=${page}, itemsPerPage=${itemsPerPage}, filters=`, filters);
		return new Promise((resolve, reject) => {
			if (Math.random() < 0.2) {
				reject('Test error ');
				return;
			}

			setTimeout(() => {
				resolve({data: allItems().slice(itemsPerPage * (page - 1), itemsPerPage * page), metadata: {page, itemsPerPage, total}});
			}, Math.random() * 1000 + 500);
		});
	}

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
