<script context="module">
	// Bot changes may take a moment to show up in the bots list
	export const BOTS_REFRESH_DELAY_MS = 2000;

	export const waitForBotsRefresh = () => new Promise(resolve => setTimeout(resolve, BOTS_REFRESH_DELAY_MS));
</script>

<script>
	import {createEventDispatcher} from 'svelte';
	import {fade} from 'svelte/transition';
	import Button from '../../components/Common/Button.svelte';
	import Error from '../Common/Error.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {substituteVarsUrl} from '../../utils/format';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDate} from '../../utils/date';
	import {getNotificationsContext} from 'svelte-notifications';
	import RadioGroup from '../Common/RadioGroup.svelte';
	import {BOT_CATEGORIES, DEFAULT_BOT_CATEGORY, botCategoryById} from '../../utils/beatleader/bots';

	export let bot = null;
	export let enableCreateMode = false;

	const dispatch = createEventDispatcher();
	const {addNotification} = getNotificationsContext();

	const categoryOptions = BOT_CATEGORIES.map(c => ({value: c.value, label: c.label, iconFa: c.iconFa, title: c.description}));

	let pendingText = null;
	let error = null;

	let name = '';
	let login = '';
	let password = '';
	let category = DEFAULT_BOT_CATEGORY;

	let changingCategory = false;
	let newCategory = null;

	$: botCategory = bot ? botCategoryById(bot.category ?? 0) : null;

	let oneTimePassword = null;
	let createdBot = null;

	let confirmingSuspend = false;
	let confirmingReset = false;

	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}

	function copyValue(value, message) {
		var dummy = document.createElement('input');

		document.body.appendChild(dummy);
		dummy.value = value;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);

		successToast(message);
	}

	async function apiFetch(url, options = {}) {
		const response = await fetch(url, {...options, credentials: 'include'});
		if (!response.ok) {
			throw (await response.text()) || `Error ${response.status}`;
		}
		return response;
	}

	async function executeOperation(operation) {
		try {
			error = null;

			return await operation();
		} catch (err) {
			console.error(err);
			error = err?.message ?? err;
		} finally {
			pendingText = null;
		}
	}

	async function onCreate() {
		if (name.length < 2 || name.length > 25) {
			error = 'Bot name should be between 2 and 25 characters long';
			return;
		}
		if (login.trim().length < 2) {
			error = 'Use two or more characters for the login';
			return;
		}
		if (password.length && password.trim().length < 8) {
			error = 'Type at least 8 character password or leave it empty to generate one';
			return;
		}

		pendingText = 'Creating a bot account...';
		await executeOperation(async () => {
			const url = substituteVarsUrl(
				BL_API_URL + 'developer/bot?name=${name}&login=${login}&password=${password}&category=${category}',
				{name, login, password, category},
				true,
				true
			);
			const response = await apiFetch(url, {method: 'POST'});
			createdBot = await response.json();
			oneTimePassword = createdBot.password;
		});
	}

	function onCredentialsSaved() {
		dispatch('added', {...createdBot, password: null});
	}

	async function onResetPassword() {
		confirmingReset = false;
		pendingText = 'Resetting the password...';
		await executeOperation(async () => {
			const response = await apiFetch(BL_API_URL + `developer/bot/${bot.playerId}/resetPassword`, {method: 'POST'});
			oneTimePassword = await response.text();
		});
	}

	async function onSuspend() {
		confirmingSuspend = false;
		pendingText = 'Suspending the bot...';
		await executeOperation(async () => {
			await apiFetch(BL_API_URL + `developer/bot/${bot.playerId}/suspend`, {method: 'POST'});
			await waitForBotsRefresh();
			dispatch('changed');
		});
	}

	function startCategoryChange() {
		newCategory = botCategory?.value ?? DEFAULT_BOT_CATEGORY;
		changingCategory = true;
	}

	async function onChangeCategory() {
		changingCategory = false;
		if (newCategory === botCategory?.value) return;

		pendingText = 'Changing the category...';
		await executeOperation(async () => {
			await apiFetch(BL_API_URL + `developer/bot/${bot.playerId}/category?category=${newCategory}`, {method: 'POST'});
			await waitForBotsRefresh();
			dispatch('changed');
		});
	}

	async function onActivate() {
		pendingText = 'Activating the bot...';
		await executeOperation(async () => {
			await apiFetch(BL_API_URL + `developer/bot/${bot.playerId}/activate`, {method: 'POST'});
			await waitForBotsRefresh();
			dispatch('changed');
		});
	}
</script>

{#if enableCreateMode}
	<section class="bot-info" transition:fade|global>
		{#if oneTimePassword}
			<div class="credentials">
				<b>Bot account created!</b>
				<div class="credential-line">
					<span>Login: <b>{createdBot?.login}</b></span>
					<span
						class="reveal clickable"
						on:click={() => copyValue(createdBot?.login, 'Login copied to Clipboard!')}
						title="Copy login">
						<i class="fas fa-copy" style="color: green;" />
					</span>
				</div>
				<div class="credential-line">
					<span>Password: <b>{oneTimePassword}</b></span>
					<span
						class="reveal clickable"
						on:click={() => copyValue(oneTimePassword, 'Password copied to Clipboard!')}
						title="Copy password">
						<i class="fas fa-copy" style="color: green;" />
					</span>
				</div>
				<span class="oneTimeDisclaimer">Attention: the password is shown to you only once. Please copy it somewhere</span>
				<Button iconFa="fas fa-check" label="I saved the credentials" type="primary" on:click={onCredentialsSaved} />
			</div>
		{:else}
			<section class="form">
				<input type="text" placeholder="Bot name" bind:value={name} disabled={!!pendingText} />
				<input type="text" placeholder="Login" bind:value={login} disabled={!!pendingText} />
				<input type="text" placeholder="Password (leave empty to generate)" bind:value={password} disabled={!!pendingText} />
				<div class="category-picker">
					<span>Category:</span>
					<RadioGroup options={categoryOptions} value={category} label="Bot category" on:change={e => (category = e.detail)} />
					<span class="category-description">{BOT_CATEGORIES.find(c => c.value === category)?.description ?? ''}</span>
				</div>

				{#if pendingText}
					<Spinner />
				{:else}
					<div class="buttons">
						<Button iconFa="fas fa-robot" label="Create" type="primary" on:click={onCreate} />
						<Button label="Cancel" on:click={() => dispatch('cancel')} />
					</div>
				{/if}
			</section>
		{/if}

		{#if error}
			<Error {error} />
		{/if}
	</section>
{:else if bot}
	<section class="bot-info" transition:fade|global>
		<div class="bot-data">
			<img class="bot-avatar" src={bot.avatar} alt="botAvatar" />

			<div class="bot-description">
				<a href={`/u/${bot.playerId}`} class="bot-name">{bot.name}</a>
				<span class="bot-login">Login: {bot.login}</span>
				<span class="bot-created">Created: {formatDate(dateFromUnix(bot.createdAt), 'short', null)}</span>
				{#if botCategory}
					<span class="bot-category" style="color: {botCategory.color}" title={botCategory.description}>
						<i class={botCategory.iconFa}></i>
						{botCategory.label}
					</span>
				{/if}
				{#if bot.verified}
					<span class="bot-verified">
						<i class="fas fa-circle-check"></i>
						Verified{bot.verifiedAt ? ' ' + formatDate(dateFromUnix(bot.verifiedAt), 'short', null) : ''}{bot.verificationComment
							? ': ' + bot.verificationComment
							: ''}
					</span>
				{/if}
				{#if bot.suspendedAt}
					<span class="bot-status suspended">
						Suspended, will be deleted {formatDate(dateFromUnix(bot.deletionDate), 'short', null)} if not activated
					</span>
				{:else}
					<span class="bot-status active">Active</span>
				{/if}
			</div>
		</div>

		{#if oneTimePassword}
			<div class="credentials">
				<div class="credential-line">
					<span>New password: <b>{oneTimePassword}</b></span>
					<span
						class="reveal clickable"
						on:click={() => copyValue(oneTimePassword, 'Password copied to Clipboard!')}
						title="Copy password">
						<i class="fas fa-copy" style="color: green;" />
					</span>
				</div>
				<span class="oneTimeDisclaimer">Attention: this value is shown to you only once. Please copy it somewhere</span>
			</div>
		{/if}

		{#if pendingText}
			<Spinner />
		{:else if confirmingSuspend}
			<div class="buttons">
				<span>Scores will be hidden and uploads disabled. Bot will be deleted in 6 months if not activated back.</span>
				<Button iconFa="fas fa-pause" label="Confirm suspend" type="danger" on:click={onSuspend} />
				<Button label="Cancel" on:click={() => (confirmingSuspend = false)} />
			</div>
		{:else if confirmingReset}
			<div class="buttons">
				<Button iconFa="fas fa-key" label="Confirm password reset" type="danger" on:click={onResetPassword} />
				<Button label="Cancel" on:click={() => (confirmingReset = false)} />
			</div>
		{:else if changingCategory}
			<div class="category-picker">
				<RadioGroup options={categoryOptions} value={newCategory} label="Bot category" on:change={e => (newCategory = e.detail)} />
				<span class="category-description">{BOT_CATEGORIES.find(c => c.value === newCategory)?.description ?? ''}</span>
				{#if bot.verified && newCategory !== botCategory?.value}
					<span class="category-warning">Changing the category removes the Verified status.</span>
				{/if}
				<div class="buttons">
					<Button iconFa="fas fa-check" label="Save category" type="primary" on:click={onChangeCategory} />
					<Button label="Cancel" on:click={() => (changingCategory = false)} />
				</div>
			</div>
		{:else}
			<div class="buttons">
				{#if bot.suspendedAt}
					<Button iconFa="fas fa-play" label="Activate" type="primary" on:click={onActivate} />
				{:else}
					<Button iconFa="fas fa-tags" label="Change category" on:click={startCategoryChange} />
					<Button iconFa="fas fa-key" label="Reset password" on:click={() => (confirmingReset = true)} />
					<Button iconFa="fas fa-pause" label="Suspend" type="danger" on:click={() => (confirmingSuspend = true)} />
				{/if}
			</div>
		{/if}

		{#if error}
			<Error {error} />
		{/if}
	</section>
{/if}

<style>
	.bot-info {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		width: 100%;
	}

	.bot-data {
		display: flex;
		align-items: center;
		gap: 0.75em;
	}

	.bot-avatar {
		width: 4em;
		height: 4em;
		border-radius: 50%;
	}

	.bot-description {
		display: flex;
		flex-direction: column;
	}

	.bot-name {
		font-size: 1.1em;
		font-weight: bold;
	}

	.bot-status.active {
		color: #4caf50;
	}

	.bot-status.suspended {
		color: #ff6666;
	}

	.bot-category,
	.bot-verified {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.bot-verified {
		color: #4caf50;
	}

	.category-picker {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.category-description {
		color: var(--faded);
		font-size: 0.85em;
	}

	.category-warning {
		color: #ff6666;
		font-size: 0.85em;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		max-width: 30em;
	}

	.buttons {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.credentials {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.credential-line {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.oneTimeDisclaimer {
		color: #ff6666;
		font-size: 0.85em;
	}

	.clickable {
		cursor: pointer;
	}

	input {
		background-color: transparent;
		border: 1px solid var(--faded);
		border-radius: 4px;
		padding: 0.4em 0.6em;
		color: var(--textColor);
	}

	input::placeholder {
		color: var(--faded) !important;
	}
</style>
