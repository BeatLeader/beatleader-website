<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import Button from '../../components/Common/Button.svelte';
	import Error from '../Common/Error.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {SsrHttpResponseError} from '../../network/errors';
	import Confirmation from '../Common/Confirmation.svelte';
	import Select from 'svelte-select';
	import Badge from '../Common/Badge.svelte';
	import {substituteVars} from '../../utils/format';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import SecretResetDialog from './SecretResetDialog.svelte';
	import {getNotificationsContext} from 'svelte-notifications';

	export let app;
	export let enableCreateMode = false;

	document.body.classList.remove('slim');

	const dispatch = createEventDispatcher();
	const account = createAccountStore();

	const {open, close} = getContext('simple-modal');
	const {addNotification} = getNotificationsContext();

	let editMode = enableCreateMode;

	let boxEl = null;

	let confirmedOperation = null;
	let pendingText = null;
	let error = null;

	let name = '';
	let clientId = '';
	let scopes = '';
	let redirectUrls = '';
	let iconUrl = null;
	let iconData = null;
	let clientSecret = null;

	const changeImage = e => {
		let image = e.target.files[0];

		const dataArrayReader = new FileReader();
		dataArrayReader.onload = e => (iconData = e.target.result);
		dataArrayReader.readAsArrayBuffer(image);

		const dataUrlReader = new FileReader();
		dataUrlReader.onload = e => (iconUrl = e.target.result);
		dataUrlReader.readAsDataURL(image);
	};

	const availableScopes = ['scp:profile', 'scp:clan', 'scp:offline_access'];
	let selectedScopes = scopes ? scopes.split(',') : [];

	let unselectedScopes = availableScopes;
	const allScopes = availableScopes;
	let selectedType = '+';

	function selectType(type) {
		if (type != '+') {
			selectedScopes.push(type);
			selectedScopes = selectedScopes;

			selectedType = '+';
			unselectedScopes = allScopes.filter(m => !selectedScopes.includes(m));
		}
	}

	function remove(type) {
		selectedScopes = selectedScopes.filter(m => m != type);
		unselectedScopes.push(type);
		unselectedScopes = unselectedScopes;
	}

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

	const createApp = async (name, clientId, selectedScopes, redirectUrls, iconData) => {
		let url = substituteVars(
			BL_API_URL + 'developer/app?name=${name}&clientId=${clientId}&scopes=${scopes}&redirectUrls=${redirectUrls}',
			{name, clientId, scopes: selectedScopes.join(','), redirectUrls},
			true,
			true
		);

		return await fetch(url, {
			method: 'POST',
			credentials: 'include',
			body: iconData,
		})
			.then(response => response.json())
			.then(app => {
				return app;
			});
	};

	const updateApp = async (name, clientId, selectedScopes, redirectUrls, iconData) => {
		let url = substituteVars(
			BL_API_URL + 'developer/app/${clientId}?name=${name}&scopes=${scopes}&redirectUrls=${redirectUrls}',
			{name, clientId, scopes: selectedScopes.join(','), redirectUrls},
			true,
			true
		);

		return await fetch(url, {
			method: 'PUT',
			credentials: 'include',
			body: iconData ?? null,
		})
			.then(response => response.json())
			.then(app => {
				return app;
			});
	};

	let loadingSecret = false;
	const resetClientSecret = async clientId => {
		open(SecretResetDialog, {
			confirm: () => {
				close();
				loadingSecret = true;
				fetch(BL_API_URL + `developer/appsecretreset/${clientId}`, {
					credentials: 'include',
					method: 'POST',
					body: iconData ?? null,
				})
					.then(response => response.text())
					.then(secret => {
						loadingSecret = false;
						clientSecret = secret;
					});
			},
			cancel: () => {
				close();
			},
		});
	};

	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}

	const copySecret = () => {
		var dummy = document.createElement('input');

		document.body.appendChild(dummy);
		dummy.value = clientSecret;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);

		successToast('Secret Copied to Clipboard!');
	};

	async function onSave() {
		if (!name.length) {
			error = 'app name is required';
			return;
		}

		if (name.length > 25 || name.length < 2) {
			error = 'app name should be between 2 and 25 characters long';
			return;
		}

		if (!clientId.length) {
			error = 'app clientId is required';
			return;
		}

		if (clientId.length < 4) {
			error = 'app clientId should be at least 4 characters long';
			return;
		}

		if (!iconData && !app?.clientId) {
			error = 'Icon is required';
			return;
		}

		error = null;
		pendingText = 'Saving an app...';

		await executeOperation(async () => {
			let updatedapp = null;

			if (app?.clientId) updatedapp = await updateApp(name, clientId, selectedScopes, redirectUrls, iconData);
			else updatedapp = await createApp(name, clientId, selectedScopes, redirectUrls, iconData);

			editMode = false;

			dispatch('added', {...updatedapp});
		});
	}

	async function onRemove() {
		if (!app?.clientId) return;

		error = null;
		pendingText = 'Removing a app...';

		await executeOperation(async () => {
			await fetch(BL_API_URL + `developer/app/${clientId}`, {
				credentials: 'include',
				method: 'DELETE',
			});

			editMode = false;

			dispatch('deleted', {...app});
		});
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

	function updateFields(app) {
		name = app?.name ?? '';
		clientId = app?.clientId ?? '';
		clientSecret = app?.clientSecret;
		redirectUrls = app?.redirectUrls ? app?.redirectUrls : [];
		iconUrl = app?.coverImageUrl ?? '/assets/default-oauth-icon.webp';
		selectedScopes = app?.scopes ? app?.scopes : [];
	}

	$: updateFields(app);
	$: iconInput = null;
</script>

{#if enableCreateMode || app?.clientId}
	<section class="app-info" transition:fade|global>
		<div class="appData">
			<div
				class="imageInput"
				on:click={() => {
					if (editMode) iconInput.click();
				}}>
				<img class="appImage" src={iconUrl} alt="appIcon" />

				{#if editMode}
					<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={e => changeImage(e)} bind:this={iconInput} />
					<span class="imageChange">Change</span>
				{/if}
			</div>

			<section class="form">
				<section class="title is-5">
					{#if editMode}
						<input type="text" placeholder="App Name" bind:value={name} disabled={!!pendingText} />
					{:else}
						<div class="name-section">
							<span class="appName">{name}</span>
							<div class="secret-buttons">
								{#if loadingSecret}
									<Spinner />
								{:else if clientSecret}
									<span>ClientSecret: {clientSecret}</span>
									<span class="reveal clickable" style="margin-left: 0.5em" on:click={() => copySecret()} title="Copy client secret">
										<i class="fas fa-copy" style="color: green;" />
									</span>
									<span class="clientSecretDisclaimer">Attention: this value is shown to you only once. Please copy it somewhere</span>
								{:else}
									<div style="margin: 0; padding: 0;">
										<span class="reveal clickable" on:click={() => resetClientSecret(clientId)} title="Reset client secret">
											<i class="fas fa-land-mine-on" style="color: red;" />
										</span>
									</div>
									<span>ClientSecret</span>
								{/if}
							</div>
						</div>
					{/if}
				</section>

				<section class="title is-5">
					{#if enableCreateMode}
						<div class="redirectUrls">
							<input type="text" placeholder="App ClientId" bind:value={clientId} disabled={!!pendingText} />
							<span class="clientIdDisclaimer">Note: it will be impossible to change after creation</span>
						</div>
					{:else}
						<label>ClientId: {clientId}</label>
					{/if}
				</section>

				<section class="title is-5">
					{#if editMode}
						<label>Scopes</label>
						{#each selectedScopes as type, idx}
							<div>
								{type}
								<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
							</div>
						{/each}
						<Select bind:value={selectedType} items={unselectedScopes} isSearchable={true} on:select={e => selectType(e.detail.value)} />
					{:else}
						<div class="scopes">
							<label>Scopes:</label>
							{#each selectedScopes as type, idx}
								<span class="scope">{type}</span>
							{/each}
						</div>
					{/if}
				</section>

				<section class="title is-5">
					<label>Redirect URLs:</label>
					{#if editMode}
						<div class="redirectUrls">
							{#each redirectUrls as redirectUrl, idx}
								<div>
									<input type="text" placeholder="Redirect url" bind:value={redirectUrls[idx]} disabled={!!pendingText} />
									<button
										class="remove-type"
										title="Remove"
										on:click={() => (redirectUrls = redirectUrls.filter((_, index) => index !== idx))}><i class="fas fa-xmark" /></button>
								</div>
							{/each}
						</div>
						<Button
							label="New url"
							on:click={() => {
								redirectUrls.push('');
								redirectUrls = redirectUrls;
							}} />
					{:else}
						<div class="redirectUrls">
							{#each redirectUrls as redirectUrl, idx}
								<a href={redirectUrl}>{redirectUrl}</a>
							{/each}
						</div>
					{/if}
				</section>

				{#if editMode}
					<section>
						{#if !pendingText}
							<Button label="Save app" type="primary" on:click={onSave} />
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

				{#if !editMode}
					<section>
						<div class="buttons">
							<div>
								<Confirmation {pendingText} {confirmedOperation}>
									<Button label="Edit app" iconFa="fas fa-edit" type="primary" on:click={() => (editMode = true)} />
									<Button label="Delete app" iconFa="fas fa-trash-alt" type="danger" on:click={() => (confirmedOperation = onRemove)} />
								</Confirmation>
							</div>
							<Button
								label="Try"
								iconFa="fas fa-square-up-right"
								type="green"
								url={`${BL_API_URL}oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(
									selectedScopes.map(s => s.replace('scp:', '')).join(' ')
								)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrls[0])}`}
								onlyurl={true} />
						</div>
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
	.app-info {
		width: 100%;
	}

	.appData {
		display: flex;
		gap: 1rem;
	}

	.appData .form {
		flex-grow: 1;
		padding: 1rem;
		max-width: 80%;
	}

	.appData .form > section:not(:last-child) {
		margin-bottom: 1rem;
	}

	.scopes {
		display: flex;
		gap: 0.4em;
	}

	.scope {
		background-color: darkslategray;
		font-size: 0.6em;
		height: 1.4em;
		margin-top: 0.5em;
	}

	.name-section {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.secret-buttons {
		display: flex;
		flex-wrap: wrap;
	}

	.redirectUrls {
		display: flex;
		flex-direction: column;
	}

	.reveal {
		align-self: flex-start;
		cursor: pointer;
	}

	.clientIdDisclaimer {
		font-size: 0.6em;
		color: grey;
	}

	.clientSecretDisclaimer {
		font-size: 0.6em;
		color: red;
	}

	.buttons {
		display: flex;
		justify-content: space-between;
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

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: flex-start;
		position: relative;
	}

	.appImage {
		width: 10em;
	}

	.appTag {
		color: var(--app-color, 'red');
	}

	.appName {
		font-size: 1.6em;
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

	.app-stats :global(> *) {
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

	@media screen and (max-width: 500px) {
		.appData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.app-stats {
			display: flex;
			flex-direction: column;
		}
	}
</style>
