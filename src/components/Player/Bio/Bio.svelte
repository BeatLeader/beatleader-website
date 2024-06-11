<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import ContentBox from '../../Common/ContentBox.svelte';
	import Dialog from '../../Common/Dialog.svelte';
	import {isAnySupporter} from '../Overlay/overlay';
	import ClanFounder from './ClanFounder.svelte';
	import PlayerRichBio from './PlayerRichBio.svelte';
	import RankedMapper from './RankedMapper.svelte';

	export let playerId = null;
	export let playerInfo = null;
	export let edit = false;

	let richBioID = null;
	let richBioError = null;

	function getRichBioId(playerInfo) {
		richBioID = playerInfo?.richBioTimeset;
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
{#if playerId}
	<ContentBox cls="bio-box">
		<div class="bio-and-left {!richBioID ? 'bio-only-left' : ''}">
			{#if richBioID || edit}
				<PlayerRichBio
					{edit}
					{playerId}
					{richBioID}
					patron={isAnySupporter(playerInfo.role)}
					isFounder={true}
					on:edit={e => onRichTextEdit(e)}
					on:delete={e => onRichTextDelete(e)} />
			{/if}

			<div class="left-part {!richBioID ? 'left-part-only' : ''}">
				<div>
					{#if playerInfo.mapperId}
						<RankedMapper mapperId={playerInfo.mapperId} />
					{/if}
					<ClanFounder {playerId} />
				</div>
			</div>
		</div>
	</ContentBox>
{/if}

<style>
	.bio-and-left {
		display: grid;
		grid-template-columns: 50% 50%;
		width: 100%;
	}

	.bio-only-left {
		display: flex;
		gap: 1em;
	}

	.left-part {
		display: flex;
		flex-direction: column;
		padding: 1em 0.6em;
		gap: 0.5em;
	}

	.left-part-only {
		flex-direction: row;
		gap: 0.5em;
	}

	.player-data {
		display: flex;
		flex-direction: column;
	}

	.socials-list {
		display: flex;
		justify-content: center;
		gap: 0.6em;
		margin-bottom: -1em;
	}

	:global(.bio-and-left .message-body) {
		border-left: none;
		border-radius: 0;
	}

	:global(.bio-box) {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5em !important;
		border-radius: 12px !important;
	}
</style>
