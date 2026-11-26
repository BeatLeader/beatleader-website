<script>
	import {onDestroy} from 'svelte';
	import {fade} from 'svelte/transition';
	import botsStore from '../../stores/beatleader/bots';
	import {BOT_CATEGORIES, botCategoryById} from '../../utils/beatleader/bots';
	import Avatar from '../Common/Avatar.svelte';
	import Badge from '../Common/Badge.svelte';
	import Button from '../Common/Button.svelte';
	import Pager from '../Common/Pager.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import Value from '../Common/Value.svelte';

	export let account;
	export let savedShownBots = null;

	const MAX_SHOWN_BOTS = 20;
	const SAVE_DELAY = 600;
	const BOTS_PER_PAGE = 10;

	let picked = null;
	let filter = 'all';
	let search = '';
	let page = 0;

	let pendingValue = null;
	let saveTimer = null;
	let saving = false;
	let saveError = null;
	let saved = false;
	let savedTimer = null;

	function sameIds(a, b) {
		return a.length === b.length && a.every(id => b.includes(id));
	}

	function toggle(botId) {
		if (current.includes(botId)) {
			setPicked(current.filter(id => id !== botId));
		} else if (current.length < MAX_SHOWN_BOTS) {
			setPicked([...current, botId]);
		}
	}

	function setPicked(ids, value = null) {
		picked = ids;
		scheduleSave(value ?? ids.join(','));
	}

	function resetToDefault() {
		setPicked([...defaultIds], 'default');
	}

	function scheduleSave(value) {
		pendingValue = value;
		saveError = null;
		saved = false;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, SAVE_DELAY);
	}

	async function save() {
		saveTimer = null;
		if (pendingValue === null) return;
		if (saving) {
			saveTimer = setTimeout(save, SAVE_DELAY);
			return;
		}

		const value = pendingValue;
		pendingValue = null;
		saving = true;
		try {
			await account.update({shownBots: value});
			if (pendingValue === null) {
				saved = true;
				clearTimeout(savedTimer);
				savedTimer = setTimeout(() => (saved = false), 2500);
			}
		} catch (error) {
			saveError = typeof error === 'string' && error.length && error.length < 200 ? error : 'Not saved, try again';
			if (pendingValue === null) picked = null;
		} finally {
			saving = false;
		}
	}

	onDestroy(() => {
		clearTimeout(savedTimer);
		// Leaving the settings mid-edit still saves
		if (saveTimer) {
			clearTimeout(saveTimer);
			save();
		}
	});

	function onFilterChanged(event) {
		filter = event?.detail?.id ?? 'all';
	}

	function resetPage() {
		page = 0;
	}

	const categoryOrder = id => BOT_CATEGORIES.findIndex(c => c.id === id);

	function compareBots(a, b) {
		return (
			categoryOrder(a.category) - categoryOrder(b.category) ||
			(a.rank > 0 ? a.rank : Infinity) - (b.rank > 0 ? b.rank : Infinity) ||
			a.name.localeCompare(b.name)
		);
	}

	function rankClass(rank) {
		return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'brown' : '';
	}

	function botTitle(bot, category) {
		return `${category.label} bot: ${category.description}${
			bot.verified ? `\nVerified${bot.verificationComment ? ': ' + bot.verificationComment : ''}` : ''
		}`;
	}

	$: bots = [...($botsStore?.bots ?? [])].sort(compareBots);
	$: byId = $botsStore?.byId ?? {};
	$: defaultIds = ($botsStore?.defaultShownBots ?? []).filter(id => byId[id]);
	$: current = (picked ?? savedShownBots ?? defaultIds).filter(id => byId[id]);
	$: isDefault = (picked == null && savedShownBots == null) || sameIds(current, defaultIds);
	$: full = current.length >= MAX_SHOWN_BOTS;

	$: filterOptions = [
		{id: 'all', label: 'All', iconFa: 'fas fa-list', title: 'All active bots'},
		{id: 'shown', label: 'Shown', iconFa: 'fas fa-eye', title: 'The bots you see on map leaderboards'},
		...BOT_CATEGORIES.filter(c => bots.some(b => b.category === c.id)).map(c => ({
			id: c.value,
			label: c.label,
			iconFa: c.iconFa,
			title: `${c.description}. Ranked between ${c.label.toLowerCase()} bots`,
		})),
	];
	$: if (!filterOptions.some(o => o.id === filter)) filter = 'all';
	$: filterValue = filterOptions.find(o => o.id === filter) ?? filterOptions[0];

	$: query = search.trim().toLowerCase();
	$: filterCategory = BOT_CATEGORIES.find(c => c.value === filter) ?? null;
	$: filteredBots = bots.filter(
		b =>
			(filter !== 'shown' || current.includes(b.id)) &&
			(!filterCategory || b.category === filterCategory.id) &&
			(!query || b.name.toLowerCase().includes(query))
	);

	$: resetPage(filter, query);
	$: pagesTotal = Math.max(1, Math.ceil(filteredBots.length / BOTS_PER_PAGE));
	$: if (page > pagesTotal - 1) page = pagesTotal - 1;
	$: pageBots = filteredBots.slice(page * BOTS_PER_PAGE, (page + 1) * BOTS_PER_PAGE);
</script>

<div class="bots-picker">
	{#if !$botsStore}
		<div class="message"><Spinner /> Loading bots...</div>
	{:else if !bots.length}
		<div class="message">No active bots yet.</div>
	{:else}
		<div class="bots-header">
			<span class="bots-count" class:full>
				Shown on map leaderboards: <strong>{current.length}</strong> / {MAX_SHOWN_BOTS}
			</span>
			{#if saving}
				<span class="status"><Spinner width="0.9em" height="0.9em" /> Saving</span>
			{:else if saveError}
				<span class="status error" title={saveError}><i class="fas fa-triangle-exclamation"></i> {saveError}</span>
			{:else if saved}
				<span class="status saved" out:fade={{duration: 300}}><i class="fas fa-check"></i> Saved</span>
			{/if}
			<div class="bots-actions">
				<Button
					label="Default"
					iconFa="fas fa-rotate-left"
					title="The bots BeatLeader shows by default"
					disabled={isDefault}
					noMargin={true}
					on:click={resetToDefault} />
				<Button
					label="None"
					iconFa="fas fa-eye-slash"
					title="Show no bots"
					disabled={!current.length}
					noMargin={true}
					on:click={() => setPicked([])} />
			</div>
		</div>

		<div class="bots-filters">
			<Switcher values={filterOptions} value={filterValue} on:change={onFilterChanged} />
			{#if bots.length > BOTS_PER_PAGE}
				<input type="text" class="bots-search" placeholder="Search for a bot..." bind:value={search} />
			{/if}
		</div>

		{#if pageBots.length}
			<section class="bots-grid">
				{#each pageBots as bot (bot.id)}
					{@const category = botCategoryById(bot.category)}
					{@const shown = current.includes(bot.id)}
					<div class="bots-grid-row">
						<a class="bot-card" href="/u/{bot.id}" target="_blank" rel="noopener" title="Open {bot.name}'s profile">
							<span class="rank {rankClass(bot.rank)}" title="Rank between {category.label.toLowerCase()} bots">
								{#if bot.rank > 0}#<Value value={bot.rank} digits={0} />{:else}-{/if}
							</span>
							<span class="bot-avatar"><Avatar player={{playerInfo: {avatar: bot.avatar}}} /></span>
							<span class="bot-name">{bot.name}</span>
							<span class="bot-badge">
								<Badge
									label={category.label}
									onlyLabel={true}
									fluid={true}
									color="white"
									bgColor={category.color}
									title={botTitle(bot, category)} />
								{#if bot.verified}
									<i class="fas fa-circle-check bot-verified" title={botTitle(bot, category)}></i>
								{/if}
							</span>
							<span class="bot-pp"><Value value={bot.pp} suffix="pp" zero="-" digits={2} /></span>
						</a>
						<Button
							cls="bot-toggle-button"
							type={shown ? 'danger' : 'primary'}
							square={true}
							animated={true}
							disabled={!shown && full}
							title={shown ? `Hide ${bot.name}` : full ? `Up to ${MAX_SHOWN_BOTS} bots, hide one first` : `Show ${bot.name}`}
							iconFa={shown ? 'fas fa-eye-slash' : 'fas fa-eye'}
							on:click={() => toggle(bot.id)} />
					</div>
				{/each}
			</section>

			{#if filteredBots.length > BOTS_PER_PAGE}
				<Pager
					totalItems={filteredBots.length}
					itemsPerPage={BOTS_PER_PAGE}
					itemsPerPageValues={null}
					currentPage={page}
					on:page-changed={e => (page = e?.detail?.page ?? 0)} />
			{/if}
		{:else if query}
			<p class="message">No bots match "{search}".</p>
		{:else if filter === 'shown'}
			<p class="message">No bots are shown on map leaderboards.</p>
		{:else}
			<p class="message">No bots here.</p>
		{/if}
	{/if}
</div>

<style>
	.bots-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		width: 100%;
		padding: 0.5em;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--faded);
	}

	.bots-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em 1em;
	}
	.bots-count.full strong {
		color: orange;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		max-width: 20em;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 0.875em;
		color: var(--faded);
	}
	.status.saved {
		color: #4caf50;
	}
	.status.error {
		color: #f44336;
	}
	.bots-actions {
		display: flex;
		gap: 0.4em;
		margin-left: auto;
		font-size: 0.75rem;
	}

	.bots-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em 1em;
	}
	.bots-filters :global(.switch-types) {
		justify-content: flex-start;
	}
	.bots-search {
		flex: 1;
		min-width: 12em;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}
	.bots-search::placeholder {
		color: var(--faded) !important;
	}

	.bots-grid {
		display: grid;
		grid-gap: 0.5em;
	}
	.bots-grid-row {
		display: grid;
		grid-template-columns: 1fr 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.bot-card {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		min-width: 0;
		padding: 0.2em 0.4em;
		border: 2px solid var(--dimmed);
		border-radius: 8px;
		background-color: var(--background);
		color: unset;
		font-weight: 500;
	}
	.bot-card:hover {
		background-color: var(--faded);
	}

	.rank {
		flex: none;
		min-width: 2.2em;
		padding: 0 0.25em;
		border-radius: 3px;
		background-color: var(--dimmed);
		font-size: 0.8em;
		text-align: center;
	}
	.rank.gold {
		background-color: darkgoldenrod;
	}
	.rank.silver {
		background-color: #888;
	}
	.rank.brown {
		background-color: saddlebrown;
	}

	.bot-avatar {
		flex: none;
	}
	.bot-avatar :global(figure) {
		width: 2em;
		height: 2em;
	}

	.bot-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 1.1em;
	}

	.bot-badge {
		display: flex;
		flex: none;
		align-items: center;
		gap: 0.3em;
		font-size: 0.8em;
	}
	.bot-verified {
		color: #4caf50;
	}

	.bot-pp {
		flex: none;
		font-size: 0.8em;
	}

	:global(.bot-toggle-button) {
		width: 2em !important;
		height: 2em !important;
		border-radius: 100% !important;
		margin-bottom: -0.1em !important;
	}

	@media screen and (max-width: 600px) {
		.bots-actions {
			margin-left: 0;
		}
		.bot-badge :global(.badge) {
			display: none;
		}
	}
</style>
