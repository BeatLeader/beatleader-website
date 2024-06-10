<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import ContentBox from '../../Common/ContentBox.svelte';
	import Dialog from '../../Common/Dialog.svelte';
	import {isAnySupporter} from '../Overlay/overlay';
	import BlBadges from './BlBadges.svelte';
	import ClanFounder from './ClanFounder.svelte';
	import Followers from './Followers.svelte';
	import HeadsetAndPlatform from './HeadsetAndPlatform.svelte';
	import PlayerRichBio from './PlayerRichBio.svelte';
	import RankedMapper from './RankedMapper.svelte';
	import Socials from './Socials.svelte';

	export let playerId = null;
	export let scoresStats = null;
	export let ssBadges = null;
	export let playerInfo = null;
	export let edit = false;
	export let playerData = null;

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
		{#if ssBadges?.length}
			<BlBadges badges={ssBadges} />
		{/if}

		<div class="bio-only {richBioID ? 'bottom-divider' : ''} {ssBadges?.length ? 'top-divider' : ''}">
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
		</div>

		<div class="cards-list">
			{#if playerData}
				<HeadsetAndPlatform {playerData} />
			{/if}
			{#if playerInfo.mapperId}
				<RankedMapper mapperId={playerInfo.mapperId} />
			{/if}
			<ClanFounder {playerId} />
		</div>

		<div class="social-list">
			<Followers {playerId} />

			{#if playerInfo}
				<Socials {playerInfo} />
			{/if}
		</div>
	</ContentBox>
{/if}

<style>
	.bio-only {
		display: flex;
		gap: 1em;
		margin-top: 0.75em;
		border-width: 0;
		width: 100%;
		margin-bottom: 1em;
	}

	.top-divider {
		border-top: 1px solid var(--row-separator);
	}
	.bottom-divider {
		border-bottom: 1px solid var(--row-separator);
	}

	.left-part {
		display: flex;
		flex-direction: column;
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

	.cards-list {
		display: flex;
		flex-direction: row;
		gap: 0.75em;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.social-list {
		display: flex;
		flex-direction: row;
		gap: 0.5em 1em;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		margin-top: 1em;
	}

	:global(.bio-only .message-body) {
		border-left: none;
		border-radius: 0;
		border-width: 0;
	}

	:global(.bio-box) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	:global(.badges-box) {
		padding: 0.5em !important;
	}
</style>
