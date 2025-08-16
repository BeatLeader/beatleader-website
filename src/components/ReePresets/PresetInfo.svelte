<script>
	import {createEventDispatcher} from 'svelte';
	import Select from 'svelte-select';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createPlayerService from '../../services/beatleader/player';
	import Button from '../Common/Button.svelte';
	import Error from '../Common/Error.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {SsrHttpResponseError} from '../../network/errors';
	import createPresetService from '../../services/beatleader/reepresets';
	import Confirmation from '../Common/Confirmation.svelte';
	import Badge from '../Common/Badge.svelte';
	import DescriptionEditor from './DescriptionEditor.svelte';
	import {presetTypeFromMask, presetTypes} from '../../utils/beatleader/format';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import LikeButton from './LikeButton.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import PresetTag from './PresetTag.svelte';
	import Switch from '../Common/Switch.svelte';

	export let preset;
	export let enableCreateMode = false;
	export let noButtons = false;
	export let noBio = false;

	document.body.classList.remove('slim');

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const presetService = createPresetService();
	const playerService = createPlayerService();

	let editMode = enableCreateMode;

	let boxEl = null;

	let confirmedOperation = null;
	let pendingText = null;
	let error = null;

	let name = '';
	let selectedTypes = [];
	let description = '';
	let filesToDelete = '';
	let commentsDisabled = false;
	let iconUrl = null;
	let iconFile = null;

	let jsonUrls = null;
	let textureUrls = null;

	const changeImage = e => {
		iconFile = e.target.files[0];

		const dataUrlReader = new FileReader();
		dataUrlReader.onload = e => (iconUrl = e.target.result);
		dataUrlReader.readAsDataURL(iconFile);
	};

	let jsonFiles;
	let textureFiles;

	const selectJsons = e => {
		jsonFiles = e.target.files;
	};

	const selectTextures = e => {
		textureFiles = e.target.files;
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
		if (name.length > 25) {
			error = 'Preset name should be no more than 25 characters long';
			return;
		}
		if (!name.length) {
			error = 'Preset name is required';
			return;
		}

		if (!jsonFiles?.length && !jsonUrls.length) {
			error = 'Provide at least some JSON file';
			return;
		}

		error = null;
		pendingText = 'Saving a preset...';

		await executeOperation(async () => {
			let updatedPreset = null;

			const presetData = {
				...preset,
				preset,
				name,
				tags: selectedTypes,
				description,
				commentsDisabled,
				filesToDelete,
				iconFile,
				jsonFiles,
				textureFiles,
			};
			if (preset?.id) updatedPreset = await presetService.update(presetData);
			else updatedPreset = await presetService.create(presetData);

			preset = updatedPreset;
			editMode = false;

			dispatch('added', {...updatedPreset});
		});
	}

	async function onRemove() {
		if (!preset?.id) return;

		error = null;
		pendingText = 'Removing a preset...';

		await executeOperation(async () => presetService.remove(preset.id));

		dispatch('removed', {...preset});
	}

	function updateFields(preset) {
		name = preset?.name ?? '';
		selectedTypes = preset?.tags ? presetTypeFromMask(preset?.tags).split(',') : [];
		iconUrl = preset?.coverLink ?? '/assets/reepresetsamplecover.gif';
		description = preset?.description ?? '';
		commentsDisabled = preset?.commentsDisabled ?? false;

		jsonUrls = preset?.jsonLinks?.split(',') ?? [];
		textureUrls = preset?.textureLinks?.split(',') ?? [];
	}

	function editComment(event) {
		description = event.detail;
	}

	const allMapTypes = presetTypes;
	let mapTypes = presetTypes;
	let selectedType = '+';

	function selectType(type) {
		if (type != '+') {
			selectedTypes.push(type);
			selectedTypes = selectedTypes;

			selectedType = '+';
			mapTypes = allMapTypes.filter(m => !selectedTypes.includes(m));
		}
	}

	function remove(type) {
		selectedTypes = selectedTypes.filter(m => m != type);
		mapTypes.push(type);
		mapTypes = mapTypes;
	}

	function deleteJsonFile(url) {
		jsonUrls = jsonUrls.filter(m => m != url);
		filesToDelete += ',' + url;
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	let player;

	async function retrievePlayer(preset) {
		if (!preset) return;

		player = await playerService.fetchPlayerOrGetFromCache(preset.ownerId);
	}

	function likeToggled() {
		presetService.react(preset, 1);
	}

	$: retrievePlayer(preset);

	$: updateFields(preset);
	$: iconUrl && drawCinematics(cinematicsCanvas, iconUrl);
	$: iconInput = null;
	$: downloadsCount = preset?.downloadsCount ?? 0;

	$: isFounder = preset?.id && preset?.ownerId === $account?.player?.playerId;
</script>

{#if enableCreateMode || preset?.id}
	<section class="preset-info" transition:fade|global>
		<div class="presetData">
			<div
				class="big-landing-box"
				style={`background: url("${iconUrl}"); background-repeat: no-repeat; background-size: cover; background-position: center;`}>
				<div class="cinematics">
					<div class="cinematics-canvas">
						<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
					</div>
				</div>

				<div class="title-and-buttons">
					{#if editMode}
						<input
							style="display:none"
							type="file"
							accept=".jpg, .jpeg, .png, .gif"
							on:change={e => changeImage(e)}
							bind:this={iconInput} />
						<Button
							iconFa="fas fa-file-code"
							label="Change"
							on:click={() => {
								if (editMode) iconInput.click();
							}} />
					{/if}
					<div class="title-and-author">
						{#if editMode}
							<input class="big-description" type="text" placeholder="Preset Name" bind:value={name} disabled={!!pendingText} />
						{:else}
							<span class="big-description">{name}</span>
							{#if player}
								<div class="player-info">
									<Avatar {player} />
									<PlayerNameWithFlag hideFlag={true} {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
								</div>

								<div class="upload-time">
									<div class="timeset">
										<span style="color: {getTimeStringColor(preset?.timeposted)}; ">
											{formatDateRelative(dateFromUnix(preset.timeposted))}
										</span>
									</div>
								</div>
							{/if}
						{/if}
					</div>
					<div class="downloadButtons">
						{#if !editMode}
							<Button
								iconFa="fas fa-download"
								title={'Download preset as a zip'}
								label="Download for PC"
								url={BL_API_URL + `reepresets/${preset.id}/download/pc`}
								on:click={() => downloadsCount++}
								onlyurl={true}
								type="green" />
							<Button
								iconFa="fas fa-download"
								title={'Download preset as a qmod'}
								label="Download for Quest"
								on:click={() => downloadsCount++}
								url={BL_API_URL + `reepresets/${preset.id}/download/quest`}
								onlyurl={true}
								type="green" />
						{/if}
					</div>

					<div class="like-button-container">
						<LikeButton
							likeCount={preset?.reactionsCount ?? 0}
							liked={preset?.reactions?.find(r => r.authorId == $account?.id)}
							on:toggled={() => likeToggled()} />
					</div>
				</div>
			</div>

			<section class="form">
				<section class="title is-6">
					{#if editMode}
						<div class="file-picker">
							<span>JSON files</span>
							<input type="file" id="fileInput" name="files" accept=".json" multiple on:change={e => selectJsons(e)} />
							{#if jsonFiles?.length > 1}
								{#each jsonFiles as jsonFile}
									<span>{jsonFile.name}</span>
								{/each}
							{/if}
							{#if jsonUrls?.length > 0}
								{#each jsonUrls as jsonFile}
									<div>
										<a href={jsonFile}>{jsonFile.split('_').slice(2)[1]}</a>
										<button class="remove-type" title="Remove" on:click={() => deleteJsonFile(jsonFile)}><i class="fas fa-xmark" /></button>
									</div>
								{/each}
							{/if}
						</div>
						<div class="file-picker">
							<span>Textures (optional)</span>
							<input type="file" id="fileInput" name="files" accept=".jpg, .jpeg, .png" multiple on:change={e => selectTextures(e)} />
							{#if textureFiles?.length > 1}
								{#each textureFiles as jsonFile}
									<span>{jsonFile.name}</span>
								{/each}
							{/if}
						</div>
					{/if}
				</section>

				<section class="title is-6">
					{#if editMode}
						<label>Tags</label>
						{#each selectedTypes as type, idx}
							<div>
								{type}
								<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
							</div>
						{/each}
						<Select bind:value={selectedType} items={mapTypes} isSearchable={true} on:select={e => selectType(e.detail.value)} />
					{:else}
						<div class="tags-top-container">
							{#each selectedTypes as type, idx}
								<PresetTag tag={type} />
							{/each}
						</div>
					{/if}
				</section>

				{#if !editMode}
					<section class="title is-5">
						<section class="title is-7">
							{downloadsCount} downloads
						</section>
					</section>

					<section class="info">
						<div class="message-body sun-editor-editable">
							{@html description}
						</div>
					</section>
				{:else}
					<section class="info">
						<DescriptionEditor initialValue={description} buttonName="Accept" cancel={false} on:post={editComment} />
					</section>
				{/if}

				{#if !editMode}
					<section class="title is-6">
						{#if jsonUrls?.length}
							<div class="file-picker">
								<span>JSON files</span>

								{#each jsonUrls as jsonFile}
									<a href={jsonFile}>{jsonFile.split('_').slice(2)[1]}</a>
								{/each}
							</div>
						{/if}
						{#if textureUrls?.length}
							<div class="file-picker">
								<span>Textures</span>

								{#each textureUrls as jsonFile}
									<a href={jsonFile}>{jsonFile.split('_').slice(2)[1]}</a>
								{/each}
							</div>
						{/if}
					</section>
				{/if}

				{#if editMode}
					<section>
						<Switch
							value={commentsDisabled}
							label="Disable comments"
							fontSize={12}
							design="slider"
							on:click={() => (commentsDisabled = !commentsDisabled)} />
					</section>
					<section>
						{#if !pendingText}
							<Button label="Save preset" type="primary" on:click={onSave} />
							<Button
								label="Cancel"
								on:click={() => {
									dispatch('cancel');
									confirmedOperation = null;
									if (preset?.id) {
										editMode = false;
									}
								}} />
						{:else}
							<Spinner />
							{pendingText}
						{/if}
					</section>
				{/if}

				{#if isFounder && !noButtons && !editMode}
					<section>
						<Confirmation {pendingText} {confirmedOperation}>
							<Button label="Edit preset" iconFa="fas fa-edit" type="primary" on:click={() => (editMode = true)} />
							<Button label="Delete preset" iconFa="fas fa-trash-alt" type="danger" on:click={() => (confirmedOperation = onRemove)} />
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
	.preset-info {
		width: 100%;
	}

	.presetData {
		display: flex;
		flex-direction: column;
	}

	.title-and-author {
		display: flex;
		flex-direction: column;
		align-items: baseline;
	}

	.like-button-container {
		position: absolute;
		right: 0.6em;
		top: 1.2em;
	}

	.player-info {
		top: 1.2em;
		left: 0.6em;
		display: flex;
		gap: 0.3em;
		background-color: #000000b8;
		padding: 0.3em;
		border-radius: 10px;
	}

	.upload-time {
		padding-left: 0.3em;
		padding-top: 0.2em;
	}

	.presetData .form {
		flex-grow: 1;
		padding: 1rem;
	}

	.file-picker {
		display: flex;
		flex-direction: column;
		margin-top: 0.5em;
	}

	.presetData .form > section:not(:last-child) {
		margin-bottom: 1rem;
	}

	input[type='text'] {
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

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		position: relative;
	}

	.presetImage {
		width: 10em;
	}

	.presetTag {
		color: var(--preset-color, 'red');
	}

	.presetName.rainbow {
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

	.preset-stats :global(> *) {
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

	.big-landing-box {
		display: flex;
		margin: 4px 10px 0px;
		border-radius: 6px;
		padding: 0.4rem 1rem 1rem 1rem;
		position: relative;
		z-index: 5;
	}

	.big-description {
		font-size: 3.5em !important;
		margin-top: -0.2em;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}

	.features {
		display: flex;
		justify-content: space-evenly;
	}

	.feature-image {
		width: 25em;
		height: 25em;
	}

	.feature {
		perspective: 50em;
	}

	.feature-description {
		text-align: center;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
	}

	.tags-top-container {
		display: flex;
	}

	.title.is-4 {
		margin-top: 1.2em;
	}

	.global-ranking-call {
		margin-top: 2em;
	}

	h3 {
		padding: 0.25em 0;
		margin-bottom: 0.75em !important;
		font-size: 1.25em;
	}

	h3 > a {
		display: inline-flex;
		align-items: center;
	}

	h3 .icon {
		display: inline-block;
		width: 4em;
		height: 4em;
		margin-right: 0.5em;
	}

	.imageLink {
		width: 4em;
		height: 4em;
	}

	.downloadButtons {
		margin-top: 1.5em;
		margin-left: 0.3em;
		display: flex;
		gap: 0.6em;
		float: center;
		flex-wrap: wrap;
	}
	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}

	@media screen and (max-width: 767px) {
		.features {
			flex-direction: column;
		}

		.feature-image {
			transform: none !important;
		}

		.big-title {
			font-size: 3em;
		}

		.pc-download-button {
			display: none;
		}
	}

	@media screen and (max-width: 500px) {
		.presetData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.preset-stats {
			display: flex;
			flex-direction: column;
		}
	}
</style>
