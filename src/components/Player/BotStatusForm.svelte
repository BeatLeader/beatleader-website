<script>
	import {createEventDispatcher} from 'svelte';
	import Dialog from '../Common/Dialog.svelte';
	import RadioGroup from '../Common/RadioGroup.svelte';
	import Switch from '../Common/Switch.svelte';
	import Error from '../Common/Error.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {BOT_CATEGORIES, botCategoryById} from '../../utils/beatleader/bots';

	export let playerId;
	export let botInfo = null;

	const dispatch = createEventDispatcher();

	const categoryOptions = BOT_CATEGORIES.map(c => ({value: c.value, label: c.label, iconFa: c.iconFa, title: c.description}));

	let category = botCategoryById(botInfo?.category ?? 0).value;
	let verified = !!botInfo?.verified;
	let comment = botInfo?.verificationComment ?? '';

	let saving = false;
	let error = null;

	async function save() {
		if (saving) return;

		saving = true;
		error = null;
		try {
			const url = new URL(BL_API_URL + `admin/bot/${playerId}/status`);
			url.searchParams.append('category', category);
			if (verified !== !!botInfo?.verified) url.searchParams.append('verified', verified);
			if (verified) url.searchParams.append('comment', comment.trim());

			const response = await fetch(url.toString(), {method: 'POST', credentials: 'include'});
			if (!response.ok) {
				throw (await response.text()) || `Error ${response.status}`;
			}

			const categoryId = BOT_CATEGORIES.find(c => c.value === category)?.id ?? 0;
			dispatch('finished', {
				botInfo: {
					category: categoryId,
					verified,
					verifiedAt: verified ? (botInfo?.verified ? botInfo.verifiedAt : Math.floor(Date.now() / 1000)) : 0,
					verificationComment: verified ? comment.trim() : null,
				},
			});
		} catch (err) {
			error = err?.message ?? err;
		} finally {
			saving = false;
		}
	}
</script>

<Dialog
	type="confirm"
	title="Bot status"
	okButton={saving ? 'Saving...' : 'Save'}
	cancelButton="Cancel"
	okButtonDisabled={saving || (verified && !comment.trim().length)}
	on:confirm={save}
	on:cancel={() => dispatch('finished', null)}>
	<div slot="content" class="bot-status-form">
		<div>
			<label>Category:</label>
			<RadioGroup options={categoryOptions} value={category} label="Bot category" on:change={e => (category = e.detail)} />
		</div>
		<div>
			<Switch value={verified} label="Verified" fontSize={12} design="slider" on:click={() => (verified = !verified)} />
		</div>
		{#if verified}
			<div>
				<label>Comment (shown publicly on the bot profile):</label>
				<textarea bind:value={comment} rows="3" maxlength="500" placeholder="What was checked"></textarea>
			</div>
		{/if}
		{#if error}
			<Error {error} />
		{/if}
	</div>
</Dialog>

<style>
	.bot-status-form {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		min-width: min(30em, 80vw);
	}

	textarea {
		width: 100%;
		background-color: transparent;
		border: 1px solid var(--faded);
		border-radius: 4px;
		padding: 0.4em 0.6em;
		color: var(--textColor);
		resize: vertical;
	}
</style>
