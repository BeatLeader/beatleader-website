<script>
	import {onMount} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import DialogContent from '../Common/DialogContent.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Select from '../Settings/Select.svelte';

	export let playlist;
	export let store;
	export let close;

	const {addNotification} = getNotificationsContext();

	const sortOptions = [
		{value: 'stars', name: 'Stars', icon: 'fa-star', order: 'asc'},
		{value: 'accRating', name: 'Acc rating', icon: 'fa-crosshairs', order: 'asc'},
		{value: 'passRating', name: 'Pass rating', icon: 'fa-person-running', order: 'asc'},
		{value: 'techRating', name: 'Tech rating', icon: 'fa-microchip', order: 'asc'},
		{value: 'name', name: 'Song name', icon: 'fa-font', order: 'asc'},
		{value: 'artist', name: 'Artist', icon: 'fa-microphone', order: 'asc'},
		{value: 'mapper', name: 'Mapper', icon: 'fa-user-pen', order: 'asc'},
		{value: 'uploaded', name: 'Upload date', icon: 'fa-upload', order: 'desc'},
		{value: 'added', name: 'Date added', icon: 'fa-clock', order: 'desc'},
	];
	const RATINGS = ['stars', 'accRating', 'passRating', 'techRating'];

	const KINDS = [
		{key: 'outdated', title: 'Update to the latest version', icon: 'fas fa-arrows-rotate'},
		{key: 'deleted', title: 'Remove maps deleted from BeatSaver', icon: 'fas fa-ban'},
		{key: 'played', title: "Unpick difficulties I've played", icon: 'fas fa-check-double'},
	];
	const DIFFICULTY_NAMES = {easy: 'Easy', normal: 'Normal', hard: 'Hard', expert: 'Expert', expertplus: 'Expert+'};

	let sort = 'stars';
	let order = 'asc';
	let sorting = false;

	let changes = null;
	let unchecked = 0;
	let loadError = null;
	let selected = {outdated: true, deleted: true, played: true};
	let expanded = {};
	let applying = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 3000});
	}

	function setSort(option) {
		if (!option?.value || option.value === sort) return;
		sort = option.value;
		order = option.order;
	}

	async function sortPlaylist() {
		sorting = true;
		try {
			await store.sortPlaylist(playlist.key, sort, order);
			notify(`Sorted by ${sortOptions.find(o => o.value === sort).name.toLowerCase()}`);
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Sorting failed', 'error');
		}
		sorting = false;
	}

	async function loadCleanup() {
		changes = null;
		loadError = null;
		try {
			const result = await store.getCleanup(playlist.id);
			changes = result.changes ?? [];
			unchecked = result.unchecked ?? 0;
		} catch (e) {
			loadError = 'Failed to check the maps';
		}
	}

	async function apply() {
		applying = true;
		try {
			const options = Object.fromEntries(KINDS.map(k => [k.key, selected[k.key] && hasChanges(k.key)]));
			const result = await store.applyCleanup(playlist.key, options);
			const parts = [
				result?.updated ? `${result.updated} updated` : null,
				result?.deleted ? `${result.deleted} deleted removed` : null,
				result?.played ? `${result.played} played cleaned up` : null,
			].filter(Boolean);
			notify(parts.length ? `Done: ${parts.join(', ')}` : 'Nothing to change');
			await loadCleanup();
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Clean-up failed', 'error');
		}
		applying = false;
	}

	const hasChanges = kind => changes.some(c => c.kind === kind);

	const difficultyLabel = d =>
		(DIFFICULTY_NAMES[d.name?.toLowerCase()] ?? d.name) + (d.characteristic && d.characteristic !== 'Standard' ? ` (${d.characteristic})` : '');
	const difficultiesLabel = list => (list ?? []).map(difficultyLabel).join(', ');

	function summary(kind, list) {
		if (!list.length) return kind === 'played' ? 'nothing played yet' : 'none';
		const maps = `${list.length} map${list.length === 1 ? '' : 's'}`;
		if (kind !== 'played') return maps;
		const removed = list.filter(c => c.remove).length;
		return removed ? `${maps}, ${removed} removed as fully played` : maps;
	}

	function describe(change) {
		const name = change.songName ?? change.hash;
		if (change.kind === 'deleted') return name;
		if (change.kind === 'played') return `${name}: ${difficultiesLabel(change.unselected)}${change.remove ? ' (removed)' : ''}`;
		const notes = [
			change.newSongName && change.newSongName !== change.songName ? `now "${change.newSongName}"` : null,
			change.unselected?.length ? `${difficultiesLabel(change.unselected)} no longer there` : null,
			change.mergeIntoItemId ? 'merged with the new version already in the playlist' : null,
		].filter(Boolean);
		return notes.length ? `${name} (${notes.join('; ')})` : name;
	}

	onMount(loadCleanup);

	$: anySelected = !!changes && KINDS.some(k => selected[k.key] && hasChanges(k.key));
</script>

<div class="dialog-container">
	<DialogContent type="alert" title="Sort & clean up" okButton="Close" okButtonType="default" on:confirm={close}>
		<div slot="content" class="tools">
			<section>
				<h3><i class="fas fa-arrow-down-wide-short" /> Sort</h3>
				<div class="sort-row">
					<Select value={sort} options={sortOptions} fontSize="0.9" on:change={e => setSort(e.detail)} />
					<Button
						cls="order-toggle"
						type="text"
						iconFa="fas {order === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
						title={order === 'asc' ? 'Ascending' : 'Descending'}
						on:click={() => (order = order === 'asc' ? 'desc' : 'asc')} />
					<Button label="Sort playlist" type="primary" loading={sorting} disabled={sorting} noMargin={true} on:click={sortPlaylist} />
				</div>
				<p class="hint">
					{#if RATINGS.includes(sort)}
						Uses the picked difficulty, or the highest one when several are picked. Unranked ratings count only if you can see
						them. Maps without a rating go last.
					{:else}
						Maps without this information go last.
					{/if}
					The new order replaces the current one for everyone who uses this playlist.
				</p>
			</section>

			<section>
				<h3><i class="fas fa-broom" /> Clean up</h3>
				{#if loadError}
					<p class="error">{loadError} <button class="link" on:click={loadCleanup}>Try again</button></p>
				{:else if !changes}
					<p class="loading"><Spinner /> Checking the maps...</p>
				{:else}
					{#each KINDS as kind}
						{@const list = changes.filter(c => c.kind === kind.key)}
						<div class="kind" class:empty={!list.length}>
							<label>
								<input type="checkbox" bind:checked={selected[kind.key]} disabled={!list.length} />
								<i class={kind.icon} />
								<span class="kind-title">{kind.title}</span>
								<span class="kind-count">{summary(kind.key, list)}</span>
							</label>
							{#if list.length}
								<button class="link" on:click={() => (expanded[kind.key] = !expanded[kind.key])}>
									{expanded[kind.key] ? 'Hide' : 'Show'} maps
								</button>
								{#if expanded[kind.key]}
									<ul class="change-list">
										{#each list as change (change.itemId)}
											<li>{describe(change)}</li>
										{/each}
									</ul>
								{/if}
							{/if}
						</div>
					{/each}
					{#if unchecked}
						<p class="hint">{unchecked} maps BeatLeader doesn't know couldn't be checked on BeatSaver.</p>
					{/if}
					<div class="apply-row">
						<Button label="Apply" type="primary" loading={applying} disabled={!anySelected || applying} noMargin={true} on:click={apply} />
					</div>
				{/if}
			</section>
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		max-width: 38em;
	}

	.tools {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}

	h3 {
		margin: 0 0 0.6em;
		font-size: 1.05em;
		font-weight: 600;
		text-transform: none;
		letter-spacing: normal;
	}

	h3 i {
		margin-right: 0.3em;
		opacity: 0.7;
	}

	.sort-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em;
	}

	.sort-row :global(.order-toggle) {
		margin-bottom: 0 !important;
	}

	.sort-row :global(.order-toggle i) {
		line-height: 1.3em;
	}

	.hint {
		margin: 0.5em 0 0;
		font-size: 0.85em;
		opacity: 0.65;
	}

	.loading {
		display: flex;
		align-items: center;
		gap: 0.5em;
		opacity: 0.8;
	}

	.error {
		color: #ff6b6b;
	}

	.kind {
		padding: 0.5em 0.6em;
		margin-bottom: 0.4em;
		border-radius: 8px;
		background-color: color-mix(in srgb, var(--textColor, white) 4%, transparent);
	}

	.kind.empty {
		opacity: 0.55;
	}

	.kind label {
		display: flex;
		align-items: center;
		gap: 0.5em;
		cursor: pointer;
	}

	.kind.empty label {
		cursor: default;
	}

	.kind i {
		width: 1.1em;
		text-align: center;
		opacity: 0.75;
	}

	.kind-title {
		flex: 1;
		min-width: 0;
		font-weight: 600;
	}

	.kind-count {
		flex: none;
		max-width: 40%;
		text-align: right;
		font-size: 0.85em;
		opacity: 0.75;
	}

	.link {
		padding: 0;
		margin: 0.3em 0 0 1.9em;
		border: none;
		background: none;
		color: var(--beatleader-primary);
		font-size: 0.85em;
		cursor: pointer;
	}

	.change-list {
		margin: 0.4em 0 0 1.9em;
		padding: 0;
		max-height: 12em;
		overflow-y: auto;
		list-style: none;
		font-size: 0.85em;
	}

	.change-list li {
		padding: 0.15em 0;
		border-bottom: 1px solid color-mix(in srgb, var(--textColor, white) 6%, transparent);
	}

	.apply-row {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.4em;
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
