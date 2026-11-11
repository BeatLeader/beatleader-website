<script>
	import {navigate} from 'svelte-routing';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import {formatNumber} from '../../utils/format';
	import {debounce} from '../../utils/debounce';
	import Pager from '../Common/Pager.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Select from '../Settings/Select.svelte';
	import {accountKind, joinedInfo} from './admin-player';

	const itemsPerPage = 20;
	const relatedShown = 6;

	const categories = [
		{
			value: 'proxy',
			name: 'Proxy sign-up',
			icon: 'fa-mask',
			related: null,
			title: 'Probably signed up with a proxy, VPN or from a data center',
		},
		{
			value: 'signupBurst',
			name: 'Sign-up burst',
			icon: 'fa-users-rays',
			related: 'In the same burst',
			title: 'Probably sign-up abuse',
		},
		{
			value: 'sharedIp',
			name: 'Shared IP',
			icon: 'fa-people-arrows',
			related: 'Scores from the same IP',
			title: 'Probably account sharing or smurfing',
		},
	];
	const categoryInfo = Object.fromEntries(categories.map(c => [c.value, c]));
	const statuses = [
		{name: 'Open', value: 'open', icon: 'fa-flag'},
		{name: 'Dismissed', value: 'dismissed', icon: 'fa-circle-check'},
		{name: 'All statuses', value: 'all', icon: 'fa-list'},
	];

	let flags = null;
	let groups = [];
	let total = 0;
	let page = 1;
	let category = 'all';
	let status = 'open';
	let search = '';
	let loading = false;
	let error = null;
	let lastRequest = null;
	let expanded = {};

	async function readError(response) {
		const text = await response.text();
		return text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`;
	}

	async function fetchFlags(page, category, status, search) {
		const params = new URLSearchParams({page, count: itemsPerPage, status});
		if (category != 'all') params.set('category', category);
		if (search.trim().length) params.set('search', search.trim());

		const request = (lastRequest = params.toString());
		loading = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/profileflags?${params}`, {credentials: 'include'});
			if (!response.ok) throw new Error(await readError(response));
			const result = await response.json();
			if (request != lastRequest) return;

			flags = result.data;
			groups = result.groups ?? [];
			total = result.metadata.total;
		} catch (e) {
			error = e.message;
		} finally {
			if (request == lastRequest) loading = false;
		}
	}

	async function setDismissed(flag, dismissed) {
		try {
			const response = await fetch(`${BL_API_URL}admin/profileflags/dismiss?id=${flag.id}&dismissed=${dismissed}`, {
				credentials: 'include',
				method: 'POST',
			});
			if (!response.ok) throw new Error(await readError(response));
		} catch (e) {
			error = e.message;
		}
		fetchFlags(page, category, status, search);
	}

	function setFilters(changes) {
		({category, status, search} = {category, status, search, ...changes});
		page = 1;
	}

	const onSearchInput = debounce(e => setFilters({search: e.target.value}), 500);

	function categoryOptions(groups) {
		const counts = Object.fromEntries(groups.map(g => [g.category, g.count]));
		const all = groups.reduce((sum, g) => sum + g.count, 0);

		return [
			{value: 'all', name: `All categories · ${formatNumber(all, 0)}`, icon: 'fa-layer-group'},
			...categories.map(c => ({value: c.value, name: `${c.name} · ${formatNumber(counts[c.value] ?? 0, 0)}`, icon: c.icon})),
		];
	}

	function asPlayer(p) {
		return {
			playerId: p.id,
			name: p.name ?? p.id,
			playerInfo: p.name ? {avatar: p.avatar, country: {country: p.country}, pp: p.pp, rank: p.rank, banned: p.banned} : null,
		};
	}

	function relative(timeset) {
		return formatDateRelative(dateFromUnix(timeset));
	}

	$: fetchFlags(page, category, status, search);
	$: options = categoryOptions(groups);
</script>

<div class="list-toolbar">
	<div class="filters">
		<Select value={category} {options} fontSize={0.8} fontPadding={0.4} on:change={e => setFilters({category: e.detail.value})} />
		<Select value={status} options={statuses} fontSize={0.8} fontPadding={0.4} on:change={e => setFilters({status: e.detail.value})} />
		{#if flags}
			<span class="total">{formatNumber(total, 0)} {total == 1 ? 'profile' : 'profiles'}</span>
		{/if}
	</div>
	<label class="search" class:has-value={search.trim().length}>
		<i class="fas fa-search"></i>
		<input type="text" placeholder="Player name or id, details..." value={search} on:input={onSearchInput} />
	</label>
</div>

{#if error}
	<p class="notice has-error"><i class="fas fa-circle-xmark"></i><span class="problem">{error}</span></p>
{/if}

{#if !flags && loading}
	<Spinner />
{:else if flags}
	<div class="flags" class:loading>
		{#each flags as flag (flag.id)}
			{@const info = categoryInfo[flag.category] ?? {name: flag.category, icon: 'fa-flag'}}
			{@const player = flag.player ?? {id: flag.playerId}}
			{@const account = accountKind(flag.playerId)}
			{@const joined = joinedInfo(player.createdAt)}
			<div class="flag {flag.category}" class:dismissed={flag.dismissed}>
				<div class="flag-player">
					<Avatar player={asPlayer(player)} cls="is-32x32 clickable" on:click={() => navigate(`/u/${flag.playerId}`)} />
					<div class="player-info">
						<PlayerNameWithFlag player={asPlayer(player)} on:click={() => navigate(`/u/${flag.playerId}`)} />
						<div class="meta">
							{#if account}
								<span class="chip" title={account.title}><i class={account.icon}></i> {account.name}</span>
							{/if}
							{#if joined}
								<span class="chip" class:warning={joined.fresh} title="Joined {joined.date.toLocaleString()}"
									>joined {joined.relative}</span>
							{/if}
							{#if player.rank}
								<span class="chip" title="Global rank and pp">#{formatNumber(player.rank, 0)} · {formatNumber(player.pp ?? 0, 2)}pp</span>
							{/if}
							{#if player.name}
								<span class="chip" title="Scores on the leaderboards">{formatNumber(player.totalPlayCount ?? 0, 0)} scores</span>
							{/if}
							{#if player.failedScores}
								<span class="chip warning" title="Failed scores of the player">{formatNumber(player.failedScores, 0)} failed</span>
							{/if}
							{#if player.banned}
								<span class="chip danger">banned</span>
							{/if}
							{#if player.bot}
								<span class="chip">bot</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flag-reason">
					<div class="reason-head">
						<span class="category {flag.category}" title={info.title}><i class="fas {info.icon}"></i> {info.name}</span>
						{#each flag.otherCategories as other}
							<span class="chip also" title={categoryInfo[other]?.title}>also {categoryInfo[other]?.name ?? other}</span>
						{/each}
					</div>
					{#if flag.details}
						<div class="details">{flag.details}</div>
					{/if}
					<div class="when">
						<span title={dateFromUnix(flag.lastTimeset)?.toLocaleString()}>{relative(flag.lastTimeset)}</span>
						at {flag.source == 'signup' ? 'sign-up' : 'login'}
						{#if flag.hits > 1}
							· {formatNumber(flag.hits, 0)} hits since
							<span title={dateFromUnix(flag.timeset)?.toLocaleString()}>{relative(flag.timeset)}</span>
						{/if}
					</div>
				</div>

				<div class="flag-related">
					{#if flag.relatedPlayers.length}
						<div class="related-label">{info.related ?? 'Related'} · {formatNumber(flag.relatedPlayers.length, 0)}</div>
						<div class="related-list">
							{#each expanded[flag.id] ? flag.relatedPlayers : flag.relatedPlayers.slice(0, relatedShown) as related (related.id)}
								<div class="related">
									<Avatar player={asPlayer(related)} cls="is-24x24 clickable" on:click={() => navigate(`/u/${related.id}`)} />
									<PlayerNameWithFlag player={asPlayer(related)} hideFlag={true} on:click={() => navigate(`/u/${related.id}`)} />
									{#if related.banned}
										<span class="chip danger">banned</span>
									{/if}
								</div>
							{/each}
							{#if flag.relatedPlayers.length > relatedShown}
								<button class="more" on:click={() => (expanded[flag.id] = !expanded[flag.id])}>
									{expanded[flag.id] ? 'Less' : `+${formatNumber(flag.relatedPlayers.length - relatedShown, 0)} more`}
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<div class="flag-actions">
					{#if flag.dismissed}
						<Button label="Reopen" title="Back to the open flags" noMargin={true} on:click={() => setDismissed(flag, false)} />
					{:else}
						<Button
							label="Dismiss"
							title="Checked, nothing wrong. Later hits won't reopen it"
							type="green"
							noMargin={true}
							on:click={() => setDismissed(flag, true)} />
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !flags.length}
		<div class="empty">
			<i class="fas fa-user-check"></i>
			<p>{search.trim().length || category != 'all' ? 'No flags match the filters' : status == 'open' ? 'No open flags' : 'No flags'}</p>
		</div>
	{/if}

	{#if total > itemsPerPage}
		<Pager
			totalItems={total}
			{itemsPerPage}
			itemsPerPageValues={null}
			currentPage={page - 1}
			on:page-changed={e => (page = e.detail.page + 1)} />
	{/if}
{/if}

<style>
	.list-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0 0.1em 0.6em;
	}

	.filters {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		font-size: 0.95em;
	}

	.total {
		margin-left: 0.3em;
		color: var(--faded, #999);
		font-size: 0.9em;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: 0 1 22em;
		min-width: 12em;
		padding: 0.35em 0.7em;
		border: 1px solid var(--faded);
		border-radius: 4px;
		background-color: var(--dimmed);
		font-size: 0.85em;
		cursor: text;
	}

	.search:hover,
	.search:focus-within {
		background-color: var(--background);
	}

	.search.has-value {
		border-color: rgba(255, 100, 150, 0.5);
	}

	.search i {
		color: var(--faded, #999);
	}

	.search input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0 0 0.6em;
		padding: 0.5em 0.8em;
		border-radius: 8px;
		font-size: 0.9em;
		background-color: rgba(255, 60, 60, 0.08);
	}

	.problem,
	.notice i {
		color: #ff6b6b;
	}

	.flags {
		transition: opacity 200ms;
	}

	.flags.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.flag {
		display: grid;
		grid-template-columns: minmax(14em, 20em) minmax(14em, 1fr) minmax(12em, 22em) auto;
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.6em 0.4em 0.6em 0.6em;
		border-bottom: 1px solid var(--row-separator);
		border-left: 3px solid transparent;
	}

	.flag.proxy {
		border-left-color: #ff6b6b;
	}

	.flag.signupBurst {
		border-left-color: #e8c34a;
	}

	.flag.sharedIp {
		border-left-color: #5fa8ff;
	}

	.flag.dismissed {
		opacity: 0.6;
		border-left-color: transparent;
	}

	.flag-player {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.flag-player :global(figure),
	.related :global(figure) {
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 0;
		font-weight: 600;
	}

	.meta,
	.reason-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3em;
	}

	.meta {
		font-size: 0.75em;
		font-weight: normal;
	}

	.chip,
	.category {
		padding: 0.1em 0.45em;
		border-radius: 4px;
		white-space: nowrap;
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.chip.warning {
		color: #e8c34a;
	}

	.chip.danger {
		color: #ff6b6b;
	}

	.flag-reason {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		min-width: 0;
		font-size: 0.9em;
	}

	.category {
		font-size: 0.9em;
	}

	.category.proxy {
		color: #ff6b6b;
	}

	.category.signupBurst {
		color: #e8c34a;
	}

	.category.sharedIp {
		color: #5fa8ff;
	}

	.chip.also {
		font-size: 0.8em;
		color: var(--faded, #999);
	}

	.details {
		opacity: 0.85;
		word-break: break-word;
	}

	.when {
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.flag-related {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		min-width: 0;
		font-size: 0.85em;
	}

	.related-label {
		color: var(--faded, #999);
		font-size: 0.9em;
	}

	.related-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em 0.8em;
	}

	.related {
		display: flex;
		align-items: center;
		gap: 0.35em;
		min-width: 0;
		max-width: 12em;
	}

	.related .chip {
		font-size: 0.8em;
	}

	.more {
		padding: 0;
		border: none;
		background: none;
		color: var(--faded, #999);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	.flag-actions {
		display: flex;
		gap: 0.5em;
		font-size: 0.85rem;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6em;
		padding: 3em 1em;
		text-align: center;
	}

	.empty i {
		font-size: 2.5em;
		opacity: 0.3;
	}

	.empty p {
		margin: 0;
		font-size: 1.1em;
	}

	@media screen and (max-width: 1100px) {
		.flag {
			grid-template-columns: minmax(14em, 20em) 1fr auto;
		}

		.flag-actions {
			grid-column: 3;
			grid-row: 1;
		}

		.flag-related {
			grid-column: 1 / -1;
			grid-row: 2;
		}
	}

	@media screen and (max-width: 767px) {
		.flag {
			grid-template-columns: 1fr;
		}

		.flag-actions,
		.flag-related {
			grid-column: auto;
			grid-row: auto;
		}

		.search {
			flex: 1 1 100%;
		}
	}
</style>
