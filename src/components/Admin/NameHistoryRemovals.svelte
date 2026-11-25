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

	const itemsPerPage = 20;

	const statuses = [
		{value: 'manual', name: 'Needs admin', icon: 'fa-user-clock'},
		{value: 'pending', name: 'Auto review', icon: 'fa-hourglass-half'},
		{value: 'removed', name: 'Removed', icon: 'fa-eraser'},
		{value: 'rejected', name: 'Declined', icon: 'fa-ban'},
	];
	const statusInfo = Object.fromEntries(statuses.map(s => [s.value, s]));
	const sortValues = [
		{value: 'date', name: 'Requested', icon: 'fa-clock'},
		{value: 'change', name: 'Name changed', icon: 'fa-signature'},
		{value: 'resolved', name: 'Resolved', icon: 'fa-gavel'},
	];

	let requests = null;
	let groups = [];
	let total = 0;
	let page = 1;
	let status = 'manual';
	let search = '';
	let sortBy = 'date';
	let order = 'desc';
	let loading = false;
	let error = null;
	let lastRequest = null;
	let resolving = null;
	let running = false;
	let runResult = null;

	async function readError(response) {
		const text = await response.text();
		return text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`;
	}

	async function fetchRequests(page, status, search, sortBy, order) {
		const params = new URLSearchParams({page, count: itemsPerPage, sortBy, order});
		if (status != 'all') params.set('status', status);
		if (search.trim().length) params.set('search', search.trim());

		const request = (lastRequest = params.toString());
		loading = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/namehistoryremovals?${params}`, {credentials: 'include'});
			if (!response.ok) throw new Error(await readError(response));
			const result = await response.json();
			if (request != lastRequest) return;

			requests = result.data;
			groups = result.groups ?? [];
			total = result.metadata.total;
		} catch (e) {
			error = e.message;
		} finally {
			if (request == lastRequest) loading = false;
		}
	}

	function refresh() {
		fetchRequests(page, status, search, sortBy, order);
	}

	async function resolve(request, approve) {
		if (!approve && !confirm(`Decline removing "${request.oldName} → ${request.newName}"? The player can't ask for this change again.`))
			return;

		resolving = request.id;
		try {
			const response = await fetch(`${BL_API_URL}admin/namehistoryremovals/${request.id}/resolve?approve=${approve}`, {
				credentials: 'include',
				method: 'POST',
			});
			if (!response.ok) throw new Error(await readError(response));
		} catch (e) {
			error = e.message;
		} finally {
			resolving = null;
		}
		refresh();
	}

	async function runReview() {
		running = true;
		runResult = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/namehistoryremovals/run`, {credentials: 'include', method: 'POST'});
			runResult = response.ok ? await response.json() : {error: await readError(response)};
		} catch (e) {
			runResult = {error: e.message};
		} finally {
			running = false;
		}
		refresh();
	}

	function reportText(report) {
		if (!report.reviewed) return report.error ? 'Review failed' : 'Nothing was pending';

		const tokens = (report.inputTokens ?? 0) + (report.outputTokens ?? 0);
		return (
			`${report.reviewed} reviewed, ${report.removed} removed, ${report.manual} sent to admins` +
			(tokens ? `, ${formatNumber(tokens, 0)} tokens` : '')
		);
	}

	function setFilters(changes) {
		({status, search, sortBy, order} = {status, search, sortBy, order, ...changes});
		page = 1;
	}

	const onSearchInput = debounce(e => setFilters({search: e.target.value}), 500);

	function statusOptions(groups) {
		const counts = Object.fromEntries(groups.map(g => [g.status, g.count]));
		const all = groups.reduce((sum, g) => sum + g.count, 0);

		return [
			...statuses.map(s => ({value: s.value, name: `${s.name} · ${formatNumber(counts[s.value] ?? 0, 0)}`, icon: s.icon})),
			{value: 'all', name: `All statuses · ${formatNumber(all, 0)}`, icon: 'fa-layer-group'},
		];
	}

	function asPlayer(request) {
		const p = request.player;
		return {
			playerId: request.playerId,
			name: p?.name ?? request.playerId,
			playerInfo: p ? {avatar: p.avatar, country: {country: p.country}, pp: p.pp, rank: p.rank, banned: p.banned} : null,
		};
	}

	function relative(timeset) {
		return formatDateRelative(dateFromUnix(timeset));
	}

	function exact(timeset) {
		return dateFromUnix(timeset)?.toLocaleString();
	}

	$: fetchRequests(page, status, search, sortBy, order);
	$: options = statusOptions(groups);
</script>

<div class="list-toolbar">
	<div class="filters">
		<Select value={status} {options} fontSize={0.8} fontPadding={0.4} on:change={e => setFilters({status: e.detail.value})} />
		<Select
			value={sortBy}
			options={sortValues}
			fontSize={0.8}
			fontPadding={0.4}
			on:change={e => setFilters({sortBy: e.detail.value})} />
		<Button
			cls="order-toggle"
			type="text"
			iconFa="fas {order === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
			title={order === 'asc' ? 'Oldest first' : 'Newest first'}
			noMargin={true}
			on:click={() => setFilters({order: order === 'asc' ? 'desc' : 'asc'})} />
		{#if requests}
			<span class="total">{formatNumber(total, 0)} {total == 1 ? 'request' : 'requests'}</span>
		{/if}
	</div>
	<div class="toolbar-right">
		<label class="search" class:has-value={search.trim().length}>
			<i class="fas fa-search"></i>
			<input type="text" placeholder="Player, name, reason..." value={search} on:input={onSearchInput} />
		</label>
		<div class="run-button">
			<Button
				type="primary"
				iconFa="fas fa-robot"
				label={running ? 'Reviewing...' : 'Review pending now'}
				title="Send the pending requests to Claude right away. New requests are picked up within seconds, the rest every 10 minutes"
				loading={running}
				disabled={running}
				noMargin={true}
				on:click={runReview} />
		</div>
	</div>
</div>

{#if runResult}
	<p class="notice" class:has-error={runResult.error}>
		<i class="fas fa-robot"></i>
		<span>
			{reportText(runResult)}
			{#if runResult.error}<span class="problem">{runResult.error}</span>{/if}
		</span>
	</p>
{/if}

{#if error}
	<p class="notice has-error"><i class="fas fa-circle-xmark"></i><span class="problem">{error}</span></p>
{/if}

{#if !requests && loading}
	<Spinner />
{:else if requests}
	<div class="requests" class:loading>
		{#each requests as request (request.id)}
			{@const info = statusInfo[request.status] ?? {name: request.status, icon: 'fa-question'}}
			<div class="request {request.status}">
				<div class="request-player">
					<Avatar player={asPlayer(request)} cls="is-32x32 clickable" on:click={() => navigate(`/u/${request.playerId}`)} />
					<div class="player-info">
						<PlayerNameWithFlag player={asPlayer(request)} on:click={() => navigate(`/u/${request.playerId}`)} />
						<div class="meta">
							{#if request.player?.rank}
								<span class="chip"
									>#{formatNumber(request.player.rank, 0)} · {formatNumber(request.player.pp ?? 0, 2)}pp</span>
							{/if}
							{#if request.player?.banned}
								<span class="chip danger">banned</span>
							{/if}
							<span class="time" title={exact(request.timeset)}>asked {relative(request.timeset)}</span>
						</div>
					</div>
				</div>

				<div class="request-change">
					<div class="names">
						<span class="old-name">{request.oldName}</span>
						<i class="fas fa-arrow-right arrow"></i>
						<span class="new-name" class:struck={request.status == 'removed'}>{request.newName}</span>
					</div>
					<div class="time" title={exact(request.changeTimestamp)}>renamed {relative(request.changeTimestamp)}</div>
					<div class="reason">{request.reason}</div>
				</div>

				<div class="request-verdict">
					<span class="status {request.status}"><i class="fas {info.icon}"></i> {info.name}</span>
					{#if request.aiReason}
						<div class="ai-reason" title="Auto review, {exact(request.aiReviewTimeset)}">
							<i class="fas fa-robot"></i>
							{request.aiReason}
						</div>
					{/if}
					{#if request.resolvedTimeset}
						<div class="time" title={exact(request.resolvedTimeset)}>
							{request.resolvedBy ? `by ${request.resolvedByName ?? request.resolvedBy}` : 'by the auto review'}, {relative(
								request.resolvedTimeset
							)}
						</div>
					{/if}
				</div>

				<div class="request-actions">
					{#if request.status != 'removed'}
						<Button
							label="Remove"
							title="Remove this change from the player's name history"
							type="green"
							noMargin={true}
							loading={resolving == request.id}
							disabled={resolving != null}
							on:click={() => resolve(request, true)} />
					{/if}
					{#if request.status == 'manual' || request.status == 'pending'}
						<Button
							label="Decline"
							title="Keep the change, the player can't ask for it again"
							type="danger"
							noMargin={true}
							disabled={resolving != null}
							on:click={() => resolve(request, false)} />
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !requests.length}
		<div class="empty">
			<i class="fas fa-eraser"></i>
			<p>
				{search.trim().length ? 'No requests match the filters' : status == 'manual' ? 'Nothing waits for an admin' : 'No requests'}
			</p>
		</div>
	{/if}

	{#if total > itemsPerPage}
		<Pager
			totalItems={total}
			{itemsPerPage}
			itemsPerPageValues={null}
			currentPage={page - 1}
			on:page-changed={e => (page = (e?.detail?.page ?? 0) + 1)} />
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

	.filters,
	.toolbar-right {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		font-size: 0.95em;
	}

	.toolbar-right {
		flex: 0 1 34em;
		justify-content: flex-end;
	}

	.filters :global(.order-toggle) {
		font-size: 0.9em;
	}

	.total {
		margin-left: 0.3em;
		color: var(--faded, #999);
		font-size: 0.9em;
	}

	.run-button {
		font-size: 0.85rem;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: 1 1 16em;
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
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
	}

	.notice.has-error {
		background-color: rgba(255, 60, 60, 0.08);
	}

	.problem {
		color: #ff6b6b;
	}

	.notice .problem {
		margin-left: 0.4em;
	}

	.requests {
		transition: opacity 200ms;
	}

	.requests.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.request {
		display: grid;
		grid-template-columns: minmax(12em, 16em) minmax(14em, 1fr) minmax(12em, 18em) auto;
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.6em 0.4em 0.6em 0.6em;
		border-bottom: 1px solid var(--row-separator);
		border-left: 3px solid transparent;
	}

	.request.manual {
		border-left-color: #e8c34a;
	}

	.request.pending {
		border-left-color: #5fa8ff;
	}

	.request.removed,
	.request.rejected {
		opacity: 0.75;
	}

	.request-player {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.request-player :global(figure) {
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 0;
		font-weight: 600;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3em;
		font-size: 0.75em;
		font-weight: normal;
	}

	.chip,
	.status {
		padding: 0.1em 0.45em;
		border-radius: 4px;
		white-space: nowrap;
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.chip.danger {
		color: #ff6b6b;
	}

	.request-change {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 0;
		word-break: break-word;
	}

	.names {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.arrow {
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.old-name {
		color: var(--faded, #999);
	}

	.new-name {
		font-weight: 600;
	}

	.new-name.struck {
		text-decoration: line-through;
	}

	.reason {
		padding: 0.3em 0.5em;
		border-radius: 4px;
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
		font-size: 0.9em;
		white-space: pre-wrap;
	}

	.time {
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.request-verdict {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3em;
		font-size: 0.9em;
	}

	.status {
		font-size: 0.9em;
	}

	.status.manual {
		color: #e8c34a;
	}

	.status.pending {
		color: #5fa8ff;
	}

	.status.removed {
		color: #6fd36f;
	}

	.status.rejected {
		color: #ff6b6b;
	}

	.ai-reason {
		opacity: 0.85;
	}

	.ai-reason i {
		color: var(--faded, #999);
	}

	.request-actions {
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
		.request {
			grid-template-columns: minmax(12em, 16em) 1fr auto;
		}

		.request-actions {
			grid-column: 3;
			grid-row: 1;
		}

		.request-verdict {
			grid-column: 1 / -1;
			grid-row: 2;
		}
	}

	@media screen and (max-width: 767px) {
		.request {
			grid-template-columns: 1fr;
		}

		.request-actions,
		.request-verdict {
			grid-column: auto;
			grid-row: auto;
		}

		.search {
			flex: 1 1 100%;
		}
	}
</style>
