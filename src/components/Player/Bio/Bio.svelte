<script>
	import {createEventDispatcher} from 'svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	import Button from '../../Common/Button.svelte';
	import Dialog from '../../Common/Dialog.svelte';
	import {isAnySupporter} from '../Overlay/overlay';
	import PlayerCards from './PlayerCards.svelte';

	import PlayerRichBio from './PlayerRichBio.svelte';

	export let playerId = null;
	export let playerInfo = null;
	export let edit = false;
	export let onHorizontalChanged = () => {};

	const dispatch = createEventDispatcher();

	let richBioID = null;
	let horizontalRichBio = playerInfo?.horizontalRichBio;
	let richBioError = null;

	function getRichBioId(playerInfo) {
		richBioID = playerInfo?.richBioTimeset;
	}

	function toggleHorizontal() {
		horizontalRichBio = !horizontalRichBio;
		onHorizontalChanged(horizontalRichBio);
		setTimeout(() => {
			dispatch('height-changed');
		}, 1000);
	}

	async function onRichTextEdit(event) {
		try {
			fetch(`${BL_API_URL}user/richbio?id=${playerId}`, {body: event.detail.value, retries: 0, method: 'PUT', credentials: 'include'})
				.then(r => r.text())
				.then(timeset => {
					if (parseInt(timeset)) {
						richBioID = timeset;
					} else {
						richBioID = null;
						richBioError = timeset;
					}
				});
		} catch {
			richBioID = null;
		}
	}

	let showDelete = false;
	function onRichTextDelete(event) {
		showDelete = true;
	}
	function deleteBio() {
		fetch(`${BL_API_URL}user/richbio?id=${playerId}`, {retries: 0, method: 'DELETE', credentials: 'include'})
			.then(r => r.text())
			.then(_ => {
				richBioID = null;
				showDelete = false;
			});
	}

	$: playerInfo && getRichBioId(playerInfo);
</script>

{#if showDelete}
	<Dialog
		type="confirm"
		title="Are you sure?"
		okButton="Yeah!"
		cancelButton="Hell no!"
		on:confirm={() => deleteBio()}
		on:cancel={() => (showDelete = false)}>
		<div slot="content">
			<div>You will remove the bio</div>
		</div>
	</Dialog>
{/if}

<div class="bio-and-cards {!richBioID ? 'bio-only-cards' : ''}">
	{#if playerId}
		{#if richBioID || edit}
			<div class="bio-limiter {horizontalRichBio ? 'horizontal' : ''}">
				<PlayerRichBio
					{edit}
					{playerId}
					{richBioID}
					patron={isAnySupporter(playerInfo.role)}
					isFounder={true}
					on:height-changed
					on:edit={e => onRichTextEdit(e)}
					on:delete={e => onRichTextDelete(e)} />
				{#if edit}
					<div class="orientation-buttons">
						<div>
							<Button
								type={horizontalRichBio ? 'default' : 'primary'}
								title="Half width"
								iconFa="fas fa-table-columns"
								on:click={() => toggleHorizontal()} />
							<Button
								type={horizontalRichBio ? 'primary' : 'default'}
								title="Full width"
								iconFa="fas fa-square"
								on:click={() => toggleHorizontal()} />
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if !horizontalRichBio}
			<div class="cards-part {!richBioID ? 'cards-part-only' : ''}">
				<PlayerCards {playerInfo} {playerId} />
			</div>
		{/if}
	{/if}
</div>

<style>
	.bio-and-cards {
		display: flex;
		width: 100%;
		gap: 1em 0.5em;
	}

	.bio-limiter {
		width: 50%;
		flex-grow: 1;
	}

	.bio-limiter.horizontal {
		width: 100%;
	}

	.bio-only-cards {
		display: flex;
		gap: 1em;
	}

	.cards-part {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 0.5em;
		min-width: 50%;
		align-content: flex-start;
	}

	.push-next-row {
		width: 100%;
		flex-direction: row;
		align-content: flex-start;
	}

	.cards-part-only {
		flex-direction: row;
		gap: 0.5em;
		justify-content: center;
		width: 100%;
	}

	.player-data {
		display: flex;
		flex-direction: column;
	}

	.orientation-buttons {
		display: flex;
		justify-content: flex-end;
		margin-top: -2.6em;
	}

	:global(.bio-and-left .message-body) {
		border-left: none;
		border-radius: 0;
	}
</style>
