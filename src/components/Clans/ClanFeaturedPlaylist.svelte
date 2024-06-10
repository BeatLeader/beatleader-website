<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import Button from '../../components/Common/Button.svelte';
	import Error from '../Common/Error.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {SsrHttpResponseError} from '../../network/errors';
	import {
		playersTitle,
		rankLabel,
		accLabel,
		ppLabel,
		capturesLabel,
		rankedPoolPercentLabel,
		rankValue,
		accValue,
		ppValue,
		capturesValue,
		rankedPoolPercentValue,
		ppIcon,
	} from '../../utils/clans';
	import createClanService from '../../services/beatleader/clan';
	import Confirmation from '../Common/Confirmation.svelte';
	import Badge from '../Common/Badge.svelte';

	export let clan;
	export let playlist;

	export let enableCreateMode = false;
	export let noButtons = false;

	const dispatch = createEventDispatcher();
	const account = createAccountStore();
	const clanService = createClanService();

	let editMode = enableCreateMode;

	let confirmedOperation = null;
	let pendingText = null;
	let error = null;

	let title = '';
	let link = '';
	let description = '';
	let iconUrl = null;
	let iconData = null;

	const changeImage = e => {
		let image = e.target.files[0];

		const dataArrayReader = new FileReader();
		dataArrayReader.onload = e => (iconData = e.target.result);
		dataArrayReader.readAsArrayBuffer(image);

		const dataUrlReader = new FileReader();
		dataUrlReader.onload = e => (iconUrl = e.target.result);
		dataUrlReader.readAsDataURL(image);
	};

	async function executeOperation(operation) {
		if (!operation) throw 'Internal error';

		try {
			error = null;

			return await operation();
		} catch (err) {
			console.error(err);

			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				error = htmlError?.length ? htmlError : err;
			} else {
				error = err;
			}
		} finally {
			pendingText = null;
		}
	}

	async function onSave() {
		if (title.length > 25) {
			error = 'Title should be no more than 25 characters long';
			return;
		}
		if (!title.length) {
			error = 'Title is required';
			return;
		}

		error = null;
		pendingText = 'Saving playlist...';

		await executeOperation(async () => {
			let updatedPlaylist = null;

			const playlistData = {
				...playlist,
				title,
				link,
				description,
				icon: iconData ?? iconUrl,
			};
			updatedPlaylist = await clanService.updatePlaylist(playlistData);

			editMode = false;

			dispatch('added', {...updatedPlaylist});
		});
	}

	async function onRemove() {
		if (!playlist?.id) return;

		error = null;
		pendingText = 'Removing playlist...';

		await executeOperation(async () => clanService.removePlaylist(playlist));

		dispatch('removed', {...playlist});
	}

	async function onConfirm() {
		if (!confirmedOperation) return;

		error = null;
		await confirmedOperation();

		confirmedOperation = null;
	}

	function onCancelPendingOperation() {
		confirmedOperation = null;
		error = null;
	}

	function updateFields(playlist) {
		title = playlist?.title ?? '';
		link = playlist?.playlistLink ?? '';
		iconUrl = playlist?.cover ?? 'https://cdn.assets.beatleader.xyz/NTG.png';
		description = playlist?.description ?? '';
	}

	$: updateFields(playlist);
	$: iconInput = null;

	$: isFounder = clan?.id && clan?.leaderID === $account?.player?.playerId;
</script>

{#if enableCreateMode || playlist?.id}
	<section class="clan-info" transition:fade|global>
		<div class="clanData">
			{#if editMode}
				<div class="image-and-disclaimer">
					<div
						class="imageInput"
						on:click={() => {
							if (editMode) iconInput.click();
						}}>
						<input
							style="display:none"
							type="file"
							accept=".jpg, .jpeg, .png, .gif"
							on:change={e => changeImage(e)}
							bind:this={iconInput} />
						<span class="imageChange">Change</span>
					</div>
					<span>Custom image is optional, will use playlist image by default.</span>
				</div>
			{:else}
				<a href={link}>
					<img class="clanImage" src={iconUrl} alt="ClanIcon" />
				</a>
			{/if}

			<section class="form">
				<section class="title is-5">
					{#if editMode}
						<input type="text" placeholder="Playlist title" bind:value={title} disabled={!!pendingText} />
					{:else}
						<a href={link} class="clanName">{title}</a>
					{/if}
				</section>

				{#if editMode}
					<section class="info">
						<textarea
							type="text"
							placeholder="BeatLeader, BeatSaver or HitBloq playlist page link. Example: https://beatleader.xyz/playlist/72345"
							bind:value={link}
							disabled={!!pendingText} />
					</section>
				{/if}

				{#if !editMode}
					<section class="info">
						<small>{description}</small>
					</section>
				{:else}
					<section class="info">
						<textarea type="text" placeholder="Description (optional)" bind:value={description} disabled={!!pendingText} />
					</section>
				{/if}

				{#if editMode}
					<section>
						{#if !pendingText}
							<Button label="Save" type="primary" on:click={onSave} />
							<Button
								label="Cancel"
								on:click={() => {
									editMode = false;
									confirmedOperation = null;
									dispatch('cancel');
								}} />
						{:else}
							<Spinner />
							{pendingText}
						{/if}
					</section>
				{/if}

				{#if playlist.owner}
					<div class="playlist-owner-container">
						<div
							class="featured-playlist-owner"
							style="border: solid 2px white; background: linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%)), center / cover no-repeat url({playlist.ownerCover})">
							{#if playlist.ownerLink}
								<a class="status-label" href={playlist.ownerLink} style="color: aliceblue !important;">{playlist.owner}</a>
							{:else}
								<span class="status-label">{playlist.owner}</span>
							{/if}
						</div>
					</div>
				{/if}

				{#if isFounder && !noButtons && !editMode}
					<section>
						<Confirmation {pendingText} {confirmedOperation}>
							<Button label="Edit" iconFa="fas fa-edit" type="primary" on:click={() => (editMode = true)} />
							<Button label="Delete" iconFa="fas fa-trash-alt" type="danger" on:click={() => (confirmedOperation = onRemove)} />
						</Confirmation>
					</section>
				{/if}

				{#if error}
					<Error {error} />
				{/if}
			</section>
		</div>
	</section>
{/if}

<style>
	.clan-info {
		width: 100%;
	}

	.clanData {
		display: flex;
		gap: 1rem;
	}

	.clanData .form {
		flex-grow: 1;
		padding: 1rem;
		max-width: 80%;
	}

	.clanData .form > section:not(:last-child) {
		margin-bottom: 1rem;
	}

	input[type='text'] {
		width: 70%;
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
	}

	input[type='color'] {
		margin-left: 0.5rem;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.image-and-disclaimer {
		display: flex;
		flex-direction: column;
		max-width: 10em;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		position: relative;
		min-height: 8em;
	}

	.clanImage {
		width: 10em;
		border-radius: 0.25em;
	}

	.clanTag {
		color: var(--clan-color, 'red');
	}

	.clanName.rainbow {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		bottom: 0;
		height: 33%;
		left: 0;
		opacity: 0;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
	}

	.imageInput:hover .imageChange {
		opacity: 1;
	}

	.clan-stats :global(> *) {
		margin-bottom: 0 !important;
	}

	.info {
		overflow: hidden;
		word-break: break-word;
	}

	.bio {
		overflow: hidden;
		word-break: break-word;
	}

	.discordHooks {
		display: flex;
		flex-direction: column;
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
		margin-top: -0.5em;
		margin-bottom: 0.8em;
	}

	.featured-playlist-owner {
		padding: 0.2em;
		border-radius: 6px;
	}

	.playlist-owner-container {
		display: flex;
	}

	.song-status {
		background-color: #00000061;
		border-radius: 10px;
		padding: 0.3em;
		color: aliceblue;
		font-size: small;
		margin-bottom: 0.2em;
		display: flex;
		align-items: center;
	}

	.status-label {
		margin-left: 0.2em;
		margin-right: 0.2em;
	}

	@media screen and (max-width: 500px) {
		.clanData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.clan-stats {
			display: flex;
			flex-direction: column;
		}
	}
</style>
