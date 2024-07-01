<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Button from '../Common/Button.svelte';

	let requests;

	function fetchAliasRequest() {
		fetch(`${BL_API_URL}alias/requests`, {credentials: 'include'})
			.then(r => r.json())
			.then(array => {
				requests = array.data;
			});
	}

	function approveRequest(id) {
		fetch(`${BL_API_URL}alias/request/${id}/resolve?status=2`, {credentials: 'include', method: 'POST'})
			.then(r => r.json())
			.then(array => {
				fetchAliasRequest();
			});
	}

	function declineRequest(id) {
		fetch(`${BL_API_URL}alias/request/${id}/resolve?status=3`, {credentials: 'include', method: 'POST'})
			.then(r => r.json())
			.then(array => {
				fetchAliasRequest();
			});
	}

	$: fetchAliasRequest();
</script>

{#if requests}
	{#each requests as request}
		<div class="request-container">
			<div class="id-and-alias">
				<span>{request.playerId}</span>
				<span>/u/{request.value}</span>
			</div>
			<div>
				<Button
					type="green"
					label="Approve"
					on:click={() => {
						approveRequest(request.id);
					}} />
				<Button
					type="yellow"
					label="Decline"
					on:click={() => {
						declineRequest(request.id);
					}} />
			</div>
		</div>
	{/each}
{/if}

<style>
	.id-and-alias {
		display: flex;
		gap: 0.5em;
		margin-bottom: 0.5em;
	}
</style>
