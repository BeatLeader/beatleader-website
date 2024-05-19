<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {globalHistory} from 'svelte-routing/src/history';
	import processPlayerData from './utils/profile';

	import createAccountStore from '../../stores/beatleader/account';
	import editModel from '../../stores/beatleader/profile-edit-model';

	import Avatar from './Avatar.svelte';
	import AvatarOverlayIcons from './AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from './ProfileHeaderInfo.svelte';

	import BeatLeaderSummary from './BeatLeaderSummary.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import Error from '../Common/Error.svelte';
	import RoleIcon from './RoleIcon.svelte';
	import Rain from '../Common/Rain.svelte';

	import AvatarOverlayEditor from './Overlay/AvatarOverlayEditor.svelte';
	import AvatarOverlay from './Overlay/AvatarOverlay.svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';

	import Spinner from '../Common/Spinner.svelte';
	import {GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let playerData;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let avatarHash = null;
	export let clanEffects = true;
	export let startEditing = false;

	const {addNotification} = getNotificationsContext();

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	let editError = null;

	let roles = null;
	function updateRoles(role) {
		roles =
			role
				?.split(',')
				?.reverse()
				?.filter(r => r?.length) ?? [];
	}

	function onEnableEditModel() {
		$editModel = {
			data: {
				name: playerData?.name ?? '',
				country: playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '',
				avatar: null,
				message: playerData?.profileSettings?.message ?? '',
				profileAppearance: playerData?.profileSettings?.profileAppearance ?? null,
				effectName: playerData?.profileSettings?.effectName ?? null,
				hue: playerData?.profileSettings?.hue ?? 0,
				saturation: playerData?.profileSettings?.saturation ?? 1,
				profileCover: playerData?.profileSettings?.profileCover ?? '/assets/defaultcover.jpg',
				profileCoverData: playerData?.profileSettings?.profileCover,
			},
			avatar: playerData?.playerInfo?.avatar
				? playerData.playerInfo.avatar + (playerData.playerInfo.avatar.includes('beatleader') ? `?${avatarHash}` : '')
				: null,
			avatarOverlayEdit: false,
			isSaving: false,
		};

		addNotification({
			text: 'You can click on each badge to turn it on or off. Click on an avatar to change it or set an overlay. Scroll down to set scores sorting and filtering visibility.',
			position: 'top-right',
			type: 'success',
			removeAfter: 4000,
		});
	}

	function onCancelEditModel() {
		$editModel = null;
	}

	globalHistory.listen(({location, action}) => {
		$editModel = null;
	});

	async function onSaveEditModel() {
		if (!$editModel) return;

		let {profileAppearance, country, avatar, message, ...data} = $editModel?.data ?? {};

		profileAppearance = profileAppearance?.length ? profileAppearance?.join(',') : '';
		country =
			country?.length && (country !== playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '') ? country.toUpperCase() : null;

		data = {...data, profileAppearance};
		if (country) data.country = country;
		if (message?.length) data.message = message;
		if (!data?.effectName?.length) data.effectName = '';

		try {
			$editModel.isSaving = true;
			if (isAdmin) {
				data.id = playerData?.playerId;
			}
			await account.update(data, avatar);

			setTimeout(() => {
				dispatch('player-data-updated');
			}, 1000);

			$editModel = null;
		} catch (err) {
			editError = err;
		} finally {
			if ($editModel) $editModel.isSaving = false;
		}
	}
	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}
	function copyUrl() {
		var dummy = document.createElement('input');
		var text = window.location.href;

		document.body.appendChild(dummy);
		dummy.value = text;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);

		successToast('Link Copied to Clipboard!');
	}

	let screenshoting = false;
	async function takeScreenshot() {
		try {
			screenshoting = true;
			const blob = await fetch(`${BL_API_URL}screenshot/800x600/myprofile/${GLOBAL_LEADERBOARD_TYPE}/u/${playerId}`).then(response =>
				response.blob()
			);
			try {
				await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
				successToast('Screenshot Copied to Clipboard');
			} catch {
				const anchor = document.createElement('a');
				const objURL = URL.createObjectURL(blob);
				anchor.href = objURL;
				anchor.style.display = 'none';
				anchor.download = name + '.png';
				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);
				URL.revokeObjectURL(objURL);
				successToast('Screenshot Saved');
			}
		} catch (e) {
			addNotification({
				text: 'Screenshot Failed',
				position: 'top-right',
				type: 'error',
				removeAfter: 4000,
			});
		} finally {
			screenshoting = false;
		}
	}
	function onKeyUp(event) {
		switch (event.key) {
			case 'Escape':
				onCancelEditModel();
		}
	}
	let modalShown;

	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: name = playerData && playerData.name ? playerData.name : null;
	$: ({playerInfo, scoresStats, accBadges, ssBadges} = processPlayerData(playerData));
	$: updateRoles(playerInfo?.role ?? null);

	$: isAdmin = $account?.player?.role?.includes('admin');
	$: profileAppearance = playerData?.profileSettings?.profileAppearance;
	$: cover = !$editModel?.avatarOverlayEdit && (playerData?.profileSettings?.profileCover ?? $editModel?.data?.profileCover);

	$: if (startEditing) onEnableEditModel();

	let fileinput;
	const readFile = async fileInput =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);

			reader.readAsArrayBuffer(fileInput);
		});
	const changeCover = async e => {
		$editModel.data.profileCover = URL.createObjectURL(e.target.files[0]);
		playerData.profileSettings.profileCover = $editModel.data.profileCover;
		$editModel.data.profileCoverData = await readFile(e.target.files[0])?.catch(_ => _);
	};
	const resetCover = async e => {
		$editModel.data.profileCover = '/assets/defaultcover.jpg';
		$editModel.data.profileCoverData = null;
		playerData.profileSettings.profileCover = null;
	};
</script>

<svelte:window on:keyup={onKeyUp} />
{#if clanEffects && playerInfo?.clans?.filter(cl => cl.tag == 'BB').length}
	<Rain />
{/if}

<AvatarOverlayEditor bind:editModel={$editModel} {roles} />
<ContentBox cls="{cover ? 'profile-container' : ''} {modalShown ? 'inner-modal' : ''}" zIndex="4">
	{#if cover}
		<div class="cover-image" style="background-image: url({cover})">
			{#if $editModel}
				{#if $editModel.data.profileCoverData}
					<Button type="danger" cls="remove-cover-button" iconFa="far fa-xmark" label="Remove cover" on:click={() => resetCover()} />
				{/if}
				<Button
					type="primary"
					cls="edit-cover-button"
					iconFa="far fa-image"
					label={$editModel.data.profileCoverData ? 'Change cover' : 'Set cover'}
					on:click={() => fileinput.click()}>
					<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={changeCover} bind:this={fileinput} />
				</Button>
			{/if}
		</div>
	{/if}
	<AvatarOverlay withCover={cover} data={$editModel?.data ?? playerData?.profileSettings} />
	<div style="margin: 0; padding: 0;">
		<Button type="text" title="Share profile link" iconFa="fas fa-share-from-square" cls="shareButton" on:click={copyUrl} />
	</div>
	<div style="margin: 0; padding: 0;">
		{#if screenshoting}
			<div class="screenshotSpinner"><Spinner /></div>
		{:else}
			<Button type="text" title="Screenshot profile" iconFa="fas fa-camera" cls="screenshotButton" on:click={takeScreenshot} />
		{/if}
	</div>

	<div class="player-general-info" class:edit-enabled={!!$editModel}>
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar
					{isLoading}
					{playerInfo}
					hash={avatarHash}
					editModel={$editModel}
					on:click={() => {
						if ($editModel) $editModel.avatarOverlayEdit = true;
					}} />

				{#if playerInfo && !isLoading}
					<div style="margin: 0; padding: 0;">
						<AvatarOverlayIcons
							{playerData}
							bind:editModel={$editModel}
							on:modal-shown={() => (modalShown = true)}
							on:modal-hidden={() => (modalShown = false)} />
					</div>
				{/if}
			</div>

			{#if playerInfo?.clans?.filter(cl => cl.tag == 'BTM').length}
				<div style="position: relative; width: 100%; height: 100%; display: flex; justify-content: center;">
					<img src="/assets/collar.webp" style="position: absolute; bottom: -16px; z-index: 100;" alt="" />
				</div>
			{/if}

			{#if roles}
				<div class="role-icons {$editModel ? 'editing' : ''}">
					{#each roles as role, idx}
						<RoleIcon
							{role}
							index={idx}
							allRoles={roles}
							mapperId={playerInfo?.mapperId}
							profileAppearance={playerData?.profileSettings?.profileAppearance ?? null}
							bind:editModel={$editModel} />
					{/each}
				</div>
			{/if}
		</div>

		<div class="rank-and-stats-cell">
			{#if editError}
				<Error error={editError} />
			{/if}

			<ProfileHeaderInfo
				{error}
				{name}
				{playerInfo}
				{playerId}
				bind:editModel={$editModel}
				on:edit-model-enable={onEnableEditModel}
				on:modal-shown={() => (modalShown = true)}
				on:modal-hidden={() => (modalShown = false)} />
			<BeatLeaderSummary {playerId} {scoresStats} {accBadges} {skeleton} {profileAppearance} bind:editModel={$editModel} />

			{#if $editModel}
				<div class="edit-buttons">
					<Button
						loading={$editModel.isSaving}
						color="white"
						bgColor="var(--beatleader-primary)"
						label="Save"
						iconFa="fas fa-check"
						noMargin={true}
						on:click={onSaveEditModel} />
					<Button
						disabled={$editModel.isSaving}
						type="default"
						label="Cancel"
						iconFa="fas fa-times"
						noMargin={true}
						on:click={onCancelEditModel} />
				</div>
			{/if}

			{#if $account.error}
				<Error error={$account.error} />
			{/if}
		</div>
	</div>
</ContentBox>

<style>
	.player-general-info {
		display: flex;
		flex-wrap: nowrap;
		grid-gap: 1.5em;
		align-items: flex-start;
	}

	.avatar-cell {
		position: relative;
		width: 150px;
		min-width: 150px;
		height: 150px;
	}

	.rank-and-stats-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		grid-gap: 0.4em;
		flex-grow: 1;
	}

	.role-icons {
		display: flex;
		position: relative;
		z-index: 5;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		width: 100%;
		min-height: 1.5rem;
	}

	.role-icons.editing {
	}

	.avatar-and-roles {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cover-image {
		position: absolute;
		display: flex;
		background-size: cover;
		background-position: 50%;
		top: 0;
		left: 0;
		height: 12.5em;
		z-index: -1;
		width: 100%;
		flex-direction: column-reverse;
		border-radius: 6px 6px 0 0;
		mask-type: alpha;
		-webkit-mask-image: linear-gradient(180deg, white, white 40%, transparent);
		mask-image: linear-gradient(180deg, white, white 40%, transparent);
	}

	:global(.shareButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 2em;
		top: 0em;
		z-index: 5;
	}
	:global(.screenshotButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 0.4em;
		top: 0em;
		z-index: 5;
	}
	:global(.screenshotSpinner) {
		position: absolute !important;
		right: 1.2em;
		top: 1em;
		z-index: 5;
	}
	:global(.inner-modal) {
		z-index: 10 !important;
		position: relative !important;
	}
	:global(.profile-container) {
		padding-top: 8em !important;
	}
	:global(.edit-cover-button) {
		width: 10em;
		margin-left: 1em !important;
		margin-bottom: 9em !important;
	}

	:global(.remove-cover-button) {
		width: 10em;
		position: absolute !important;
		left: 1em;
		top: 4em;
	}

	@media screen and (max-width: 767px) {
		.player-general-info {
			flex-direction: column;
			align-items: center;
			grid-gap: 0.4em;
		}

		.rank-and-stats-cell {
			align-items: center;
		}
	}
</style>
