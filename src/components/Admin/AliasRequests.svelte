<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Pager from '../Common/Pager.svelte';
	import AliasRequest from './AliasRequest.svelte';

	let requests;
	let page = 1;
	let total = 0;

	function fetchAliasRequest(page) {
		fetch(`${BL_API_URL}alias/requests?page=${page}`, {credentials: 'include'})
			.then(r => r.json())
			.then(array => {
				requests = array.data;
				total = array.metadata.total;
			});
	}

	function onPageChange(event) {
		page = (event?.detail?.page ?? 0) + 1;

		fetchAliasRequest(page);
	}

	$: fetchAliasRequest(page);
</script>

{#if requests}
	{#each requests as request}
		<AliasRequest
			{request}
			on:modified={() => {
				fetchAliasRequest(page);
			}} />
	{/each}

	{#if Number.isFinite(page) && (!Number.isFinite(total) || total > 0)}
		<Pager totalItems={total} itemsPerPage={10} itemsPerPageValues={null} currentPage={page - 1} on:page-changed={onPageChange} />
	{/if}
{/if}
