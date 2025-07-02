<script>
	import {createEventDispatcher} from 'svelte';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';

	import Status from './Status.svelte';
	import Error from '../Common/Error.svelte';
	import Button from '../Common/Button.svelte';
	import CountryPicker from '../Common/CountryPickerSingle.svelte';
	import ClanBadges from './ClanBadges.svelte';
	import BanForm from './BanForm.svelte';
	import ProfileChange from './ProfileChange.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Dialog from '../Common/Dialog.svelte';
	import {SsrHttpResponseError} from '../../network/errors';
	import createClanService from '../../services/beatleader/clan';
	import ContentBox from '../Common/ContentBox.svelte';
	import RolesBadge from './RolesBadge.svelte';

	export let name;
	export let playerInfo;
	export let playerId;
	export let error = null;
	export let editModel = null;
	export let roles = null;
	export let profileAppearance;
	export let zIndex = 0;
	export let mayEdit = true;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	function showRainbow(player) {
		var result = false;
		player.clans?.forEach(element => {
			if (element.tag == 'GAY') {
				result = true;
			}
		});

		return result;
	}

	function formatAliasRequestStatus(status) {
		switch (status) {
			case 1:
				return 'Open';
			case 2:
				return 'Accepted';
			case 3:
				return 'Rejected';
		}

		return 'Unknown';
	}

	function formatAliasRequestStatusColor(status) {
		switch (status) {
			case 1:
				return 'yellow';
			case 2:
				return 'green';
			case 3:
				return 'red';
		}

		return 'Unknown';
	}

	let showBanForm = false;
	let showChanges = false;

	$: changes = playerInfo?.changes;
	$: loggedInPlayer = $account?.id;
	$: isMain = playerId && $account?.id === playerId;
	$: isAdmin = $account?.player?.role?.includes('admin');
	$: canRedact = mayEdit && ((isMain && loggedInPlayer === playerId) || isAdmin);
	$: clanOrder = playerInfo?.clans?.map(c => c.tag).join(',');

	let alias = null;
	let aliasRequest = null;
	let aliasRequestError = null;

	function fetchAliasRequest(account) {
		aliasRequest = account.aliasRequest;
	}
	function sendAliasRequest() {
		aliasRequestError = null;
		fetch(`${BL_API_URL}alias/request?alias=${alias}`, {method: 'POST', credentials: 'include'})
			.then(r => {
				if (r.status == 200) {
					return r.json();
				} else {
					return r.text();
				}
			})
			.then(ar => {
				if (ar.status) {
					aliasRequest = ar;
				} else [(aliasRequestError = ar)];
			});
	}

	const clanService = createClanService();

	let invitationConfirmationType = null;
	let invitingError = null;
	async function onInvite(playerId) {
		if (!playerId?.length) return;

		try {
			invitingError = null;

			await clanService.invite(playerId);

			invitationConfirmationType = null;
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				invitingError = htmlError?.length ? htmlError : err;
			} else {
				invitingError = err;
			}
		}
	}

	async function onCancelInvite(playerId) {
		if (!playerId?.length) return;

		try {
			invitingError = null;

			await clanService.cancelInvite(playerId);

			invitationConfirmationType = null;
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				invitingError = htmlError?.length ? htmlError : err;
			} else {
				invitingError = err;
			}
		}
	}

	function updateZIndex(invitationConfirmationType) {
		zIndex = invitationConfirmationType ? 4 : 0;
	}

	$: isUserFounderOfTheClan = !!$account?.clan;
	$: isPlayerClanMember = isUserFounderOfTheClan && !!$account?.clan?.players?.find(pId => pId === playerId);
	$: hasPlayerPendingInvitation =
		isUserFounderOfTheClan && !isPlayerClanMember && !!$account?.clan?.pendingInvites?.find(pId => pId === playerId);
	$: fetchAliasRequest($account);
	$: updateZIndex(invitationConfirmationType || showBanForm);
</script>

{#if showBanForm}
	<BanForm {playerId} accountStore={account} on:finished={() => (showBanForm = false)} />
{/if}
{#if invitationConfirmationType}
	<Dialog
		type="confirm"
		title="Are you sure?"
		okButton="Yeah!"
		cancelButton="Hell no!"
		on:confirm={() => (invitationConfirmationType === 'invite' ? onInvite(playerId) : onCancelInvite(playerId))}
		on:cancel={() => (invitationConfirmationType = false)}>
		<div slot="content">
			{#if invitationConfirmationType === 'invite'}
				<div>An invitation will be sent to the player to join the clan.</div>
			{:else}
				<div>The player's invitation to the clan will be cancelled.</div>
			{/if}

			{#if invitingError}
				<Error error={invitingError} />
			{/if}
		</div>
	</Dialog>
{/if}
<div class="profile-header-info">
	{#if playerInfo}
		<div class="player-nickname {showRainbow(playerInfo) ? 'rainbow' : ''}">
			{#if name}
				<div style="display: flex;">
					{#if editModel?.data}
						<input type="text" bind:value={editModel.data.name} placeholder="Your name" class="input-reset" />
					{:else}
						<span class="nickname">{name}</span>
					{/if}
					{#if !editModel && changes && changes.length}
						<div class="score-options-section">
							<span
								class="beat-savior-reveal clickable"
								class:opened={showChanges}
								on:click={() => (showChanges = !showChanges)}
								title={showChanges ? 'Hide profile changelog' : 'Show profile changelog'}>
								<i class="fas fa-chevron-down" />
							</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if playerInfo.inactive || playerInfo.banned}
			<span class="status">
				<Status {playerInfo} />
			</span>
		{/if}

		{#if showChanges}
			<ContentBox>
				{#each changes as change, idx}
					<ProfileChange {change} />
				{/each}
			</ContentBox>
		{/if}

		{#if playerInfo.sponsor}
			{#if editModel?.data}
				<div class="sponsor-message">
					<span
						>This message will be shown in-game for your scores.<br />
						You can use <a class="inlineLink" href="http://digitalnativestudios.com/textmeshpro/docs/rich-text">Unity tags</a> here.</span>
					<input type="text" bind:value={editModel.data.message} placeholder="Promotion message" class="sponsor-input" />
				</div>
			{/if}
		{/if}

		<div class="player-ranking">
			{#if canRedact && editModel?.data}
				<div class="pickerContainer">
					<CountryPicker selected={editModel.data.country} on:select={e => (editModel.data.country = e.detail.value)} />
				</div>
			{/if}

			<div class="clan-badges">
				{#if $configStore.profileParts.clans && playerInfo?.clans?.length}
					<ClanBadges player={playerInfo} highlightMain={true} bind:editModel />
					<!-- Condition in one line on purpose, otherwise Svelte preserves space and prevents :empty from working -->
				{/if}{#if isUserFounderOfTheClan}
					{#if !isPlayerClanMember && !hasPlayerPendingInvitation}
						<Button
							animated={true}
							type="primary"
							iconFa="fas fa-users"
							title="Invite player to the clan"
							cls="invite-to-clan"
							on:click={() => (invitationConfirmationType = 'invite')} />
					{:else if hasPlayerPendingInvitation}
						<Button
							animated={true}
							type="danger"
							iconFa="fas fa-users-slash"
							title="Cancel invitation to the clan"
							cls="invite-to-clan"
							on:click={() => (invitationConfirmationType = 'cancel')} />
					{/if}
				{/if}
			</div>

			{#if isAdmin && loggedInPlayer != playerId}
				{#if playerInfo?.banned}
					<Button
						cls="banButton"
						title="Unban player"
						label="Unban player"
						type="danger"
						on:click={async () => await account.unbanPlayer(playerId)} />
				{:else}
					<Button cls="banButton" title="Ban player" label="Ban player" type="danger" on:click={async () => (showBanForm = !showBanForm)} />
				{/if}
			{/if}
		</div>

		{#if editModel?.data && editModel?.data?.country?.toUpperCase() !== playerInfo?.country?.country}
			<span class="warning">Make sure you selected right country. You can change it only every 30 days.</span>
		{/if}

		{#if editModel?.data?.clanOrder && editModel?.data?.clanOrder !== clanOrder}
			<span class="warning"
				>Your contribution in the Clan Wars will only apply to your main(first) clan. You can change order only once a week.</span>
		{/if}

		{#if editModel}
			{#if aliasRequest}
				<div class="alias-status">
					<span
						>Alias request sent! Current status is <span style="color: {formatAliasRequestStatusColor(aliasRequest.status)}"
							>{formatAliasRequestStatus(aliasRequest.status)}</span
						></span>
				</div>
			{:else}
				<ContentBox>
					<div class="alias-editor">
						<div class="prefix-and-alias-input">
							<span class="alias-prefix">/u/</span>
							<input type="text" class="alias-input" bind:value={alias} placeholder={$account?.player.alias ?? playerId} />
						</div>

						<span>You can change your profile link.</span>
						<span>Submit a change request and admin will review it in 1-4 days.</span>

						{#if $account?.player?.ids?.length || ($account?.player.alias && $account?.player.alias != playerId)}
							<div class="ids-shortcuts">
								<span>Old ID(s):</span>
								{#each $account?.ids?.length ? $account?.ids : [playerId] as id}
									{#if id != $account?.player.alias}
										<div class="id-shortcut" on:click={() => (alias = id)}>{id}</div>
									{/if}
								{/each}
							</div>
						{/if}

						{#if aliasRequestError}
							<span style="color: red;display: block;width: 100%;">{aliasRequestError}</span>
						{/if}
						<Button
							disabled={!((alias?.length > 2 && alias?.length < 15) || $account?.ids?.includes(alias))}
							label="Submit"
							on:click={() => sendAliasRequest()} />
					</div>
				</ContentBox>
			{/if}
		{/if}

		<RolesBadge {profileAppearance} {roles} bind:editModel />

		{#if error}
			<div>
				<Error {error} />
			</div>
		{/if}
	{:else if error}
		<div>
			<Error {error} />
		</div>
	{/if}

	{#if canRedact && !editModel?.data}
		<div class="edit-button">
			<Button type="text" title="Edit profile" cls="editNameButton" iconFa="fas fa-edit" on:click={() => dispatch('edit-model-enable')} />
		</div>
	{/if}
</div>

<style>
	.profile-header-info {
		display: contents;
	}

	.player-nickname {
		display: flex;
		flex-direction: column;
		font-size: 3.4em;
		font-weight: bold;
		align-items: baseline;
		text-shadow: 1px 1px 5px #00000069;
	}

	.player-ranking {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.7em;
		font-size: 1.25em;
		font-weight: 500;
		align-items: center;
	}

	.player-ranking:empty {
		display: none;
	}

	.clan-badges {
		margin-bottom: 0.5em;
	}

	.clan-badges:empty {
		display: none;
	}

	:global(.clan-badges .clan-badges) {
		margin-left: -0.3em;
	}

	.alias-input {
		background-color: transparent;
		color: white;
		font-size: larger;
		border-right: none;
		margin-left: -0.2em;
	}

	.alias-prefix {
		font-size: larger;
		font-weight: bold;
	}

	.player-nickname.rainbow {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.status {
		font-size: smaller;
	}

	.nickname {
		overflow-wrap: anywhere;
	}

	.edit-button {
		position: absolute;
		right: 0.2em;
		bottom: 1.6em;
		font-size: 2em;
	}

	.edit-button:hover {
		scale: 1.1;
	}

	:global(.edit-enabled) .player-ranking {
		margin: 1rem 0;
	}

	:global(.invite-to-clan) {
		width: 2em;
		height: 2em;
		font-size: 12px !important;
		border-radius: 1em !important;
		margin-bottom: -1em !important;
	}

	.sponsor-message {
		padding-top: 1em;
		padding-bottom: 1em;
		display: grid;
	}

	.sponsor-input {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
	}

	.input-reset {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
		max-width: 80vw;
	}

	.input-reset::placeholder {
		color: var(--faded) !important;
	}

	.inlineLink {
		display: contents;
	}

	.pickerContainer {
		font-size: 1rem;
	}

	:global(.editNameButton) {
		margin-bottom: -1em !important;
		font-size: 0.75em !important;
		text-shadow: 1px 1px 5px #00000069;
	}
	:global(.banButton) {
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		display: none;
	}

	.player-nickname:hover .score-options-section {
		display: block;
	}

	.warning {
		color: yellow;
	}

	.ids-shortcuts {
		display: flex;
		gap: 0.5em;
	}

	.id-shortcut {
		text-decoration: underline;
		cursor: pointer;
		color: lightblue;
	}

	@media screen and (max-width: 767px) {
		.input-reset {
			flex: 1;
		}

		.player-ranking {
			justify-content: center;
		}

		.player-nickname {
			flex-wrap: wrap !important;
			justify-content: center;
			margin-right: inherit;
		}

		.nickname {
			text-align: center;
		}

		.edit-button {
			top: 0;
			left: 0.2em;
			bottom: unset;
			right: unset;
		}
	}
</style>
