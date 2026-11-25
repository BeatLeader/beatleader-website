<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Pager from '../Common/Pager.svelte';
	import {debounce} from '../../utils/debounce';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import ScoreDeletionScore from './ScoreDeletionScore.svelte';
	import {
		DELETION_REASONS,
		reasonLabel,
		reasonIcon,
		fetchMarks,
		fetchHistory,
		markScores,
		unmarkScores,
		deleteMarked,
		restoreScore,
		parseScoreIds,
	} from '../../stores/beatleader/score-deletions';

	const PAGE_SIZE = 50;
	const views = [
		{id: 'queue', label: 'Queue', iconFa: 'fas fa-hourglass-half'},
		{id: 'history', label: 'Deleted', iconFa: 'fas fa-clock-rotate-left'},
	];

	const {addNotification} = getNotificationsContext();

	let view = 'queue';
	let search = '';
	let reason = null;
	let page = 1;

	let queue = null;
	let history = null;
	let loading = false;
	let error = null;

	let selected = new Set();
	let deleting = false;
	let progress = null;

	let showAdd = false;
	let addText = '';
	let addReason = 'Cheating';
	let addComment = '';
	let adding = false;

	let restoring = null;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 5000 : 2500});
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const params = {page, count: PAGE_SIZE, reason, search: search.trim()};
			if (view === 'queue') {
				queue = await fetchMarks(params);
				const visible = new Set(queue.data.map(m => m.scoreId));
				selected = new Set([...selected].filter(id => visible.has(id)));
			} else {
				history = await fetchHistory(params);
			}
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	const searchChanged = debounce(() => {
		page = 1;
		load();
	}, 400);

	function changeView(id) {
		if (view === id) return;
		view = id;
		page = 1;
		reason = null;
		selected = new Set();
		load();
	}

	function changeReason(id) {
		reason = reason === id ? null : id;
		page = 1;
		load();
	}

	function onPageChange(event) {
		if (event?.detail?.initial) return;
		page = (event?.detail?.page ?? 0) + 1;
		load();
	}

	function toggle(scoreId) {
		selected.has(scoreId) ? selected.delete(scoreId) : selected.add(scoreId);
		selected = selected;
	}

	function toggleAll() {
		selected = allSelected ? new Set() : new Set(queue.data.map(m => m.scoreId));
	}

	function describe(result) {
		const parts = [`Deleted ${result.deleted} ${result.deleted === 1 ? 'score' : 'scores'}`];
		if (result.missing) parts.push(`${result.missing} were already gone`);
		return parts.join(', ');
	}

	async function deleteSelected() {
		const ids = [...selected];
		if (!ids.length) return;
		if (!confirm(`Delete ${ids.length} selected ${ids.length === 1 ? 'score' : 'scores'}? Each one gets a record you can restore from.`)) return;

		deleting = true;
		try {
			const result = await deleteMarked({scoreIds: ids});
			notify(describe(result));
			selected = new Set();
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			deleting = false;
			load();
		}
	}

	// The server deletes up to 2000 per call
	async function deleteAll() {
		const total = queue?.metadata?.total ?? 0;
		if (!total) return;
		const what = reason ? `all ${total} "${reasonLabel(reason)}" scores` : `all ${total} scores in the queue`;
		if (!confirm(`Delete ${what}? Each one gets a record you can restore from.`)) return;

		deleting = true;
		progress = {deleted: 0, missing: 0, total};
		try {
			while (true) {
				const result = await deleteMarked({all: true, reason});
				progress = {deleted: progress.deleted + result.deleted, missing: progress.missing + result.missing, total};
				if (!result.remaining || result.deleted + result.missing === 0) break;
			}
			notify(describe(progress));
			selected = new Set();
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			deleting = false;
			progress = null;
			load();
		}
	}

	async function unmark(scoreIds) {
		try {
			await unmarkScores(scoreIds);
			scoreIds.forEach(id => selected.delete(id));
			selected = selected;
			notify(scoreIds.length === 1 ? 'Removed from the queue' : `Removed ${scoreIds.length} scores from the queue`);
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			load();
		}
	}

	async function addToQueue() {
		const ids = parseScoreIds(addText);
		if (!ids.length) {
			notify('Paste score ids or score page links', 'error');
			return;
		}
		adding = true;
		try {
			const result = await markScores(ids, addReason, addComment);
			let text = `Marked ${result.marked}`;
			if (result.updated) text += `, updated ${result.updated}`;
			if (result.missing.length) text += `, ${result.missing.length} not found (${result.missing.slice(0, 5).join(', ')}${result.missing.length > 5 ? '...' : ''})`;
			notify(text, result.missing.length ? 'warning' : 'success');
			addText = '';
			addComment = '';
			showAdd = false;
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			adding = false;
			load();
		}
	}

	async function restore(record) {
		if (!confirm('Upload this replay again? It goes through the usual upload except the anticheat checks.')) return;
		restoring = record.id;
		try {
			await restoreScore(record.id);
			notify('Score restored');
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			restoring = null;
			load();
		}
	}

	function historyScore(record) {
		return {...record, id: record.scoreId};
	}

	$: groups = queue?.groups ?? [];
	$: groupTotal = groups.reduce((sum, g) => sum + g.count, 0);
	$: allSelected = queue?.data?.length > 0 && queue.data.every(m => selected.has(m.scoreId));
	$: refreshing = (queue?.refreshPlayers ?? 0) + (queue?.refreshLeaderboards ?? 0) > 0;
	$: current = view === 'queue' ? queue : history;
	$: addIds = parseScoreIds(addText);

	load();
</script>

<div class="score-deletions">
	<div class="toolbar">
		<Switcher values={views} value={views.find(v => v.id === view)} on:change={e => changeView(e.detail.id)} />
		<label class="search-field">
			<i class="fas fa-search" />
			<input
				type="text"
				placeholder={view === 'queue' ? 'Player, map, score id or comment' : 'Player, map, score id, admin or comment'}
				bind:value={search}
				on:input={searchChanged} />
		</label>
		<Button type="default" iconFa="fas fa-arrows-rotate" title="Refresh" {loading} on:click={load} />
	</div>

	<div class="reasons">
		{#if view === 'queue'}
			<button class="reason-chip" class:on={!reason} on:click={() => changeReason(null)}>All <span class="count">{groupTotal}</span></button>
			{#each DELETION_REASONS as option (option.id)}
				{@const group = groups.find(g => g.reason === option.id)}
				{#if group}
					<button class="reason-chip" class:on={reason === option.id} on:click={() => changeReason(option.id)}>
						<i class={option.iconFa} />
						{option.label} <span class="count">{group.count}</span>
					</button>
				{/if}
			{/each}
		{:else}
			<button class="reason-chip" class:on={!reason} on:click={() => changeReason(null)}>All</button>
			{#each DELETION_REASONS as option (option.id)}
				<button class="reason-chip" class:on={reason === option.id} on:click={() => changeReason(option.id)}>
					<i class={option.iconFa} />
					{option.label}
				</button>
			{/each}
		{/if}
	</div>

	{#if view === 'queue'}
		<div class="sd-section add-section">
			<span
				class="add-toggle clickable"
				role="button"
				tabindex="0"
				on:click={() => (showAdd = !showAdd)}
				on:keydown={e => e.key === 'Enter' && (showAdd = !showAdd)}>
				<i class="fas fa-plus" /> Add scores by id <i class="fas fa-chevron-{showAdd ? 'up' : 'down'}" />
			</span>
			{#if showAdd}
				<div class="add-form">
					<textarea class="sd-field" rows="3" placeholder="Score ids or links to score pages, one per line or comma separated" bind:value={addText}></textarea>
					<div class="reasons">
						{#each DELETION_REASONS as option (option.id)}
							<button class="reason-chip small" class:on={addReason === option.id} on:click={() => (addReason = option.id)}>
								<i class={option.iconFa} />
								{option.label}
							</button>
						{/each}
					</div>
					<input class="sd-field" type="text" maxlength="500" placeholder="Comment" bind:value={addComment} />
					<div class="add-actions">
						<span class="muted">{addIds.length} {addIds.length === 1 ? 'score' : 'scores'}</span>
						<Button type="danger" iconFa="fas fa-hourglass-half" label="Mark for deletion" disabled={!addIds.length || adding} loading={adding} on:click={addToQueue} />
					</div>
				</div>
			{/if}
		</div>

		{#if refreshing}
			<div class="notice">
				<Spinner />
				Refreshing after the last deletion: {queue.refreshPlayers} players, {queue.refreshLeaderboards} leaderboards
			</div>
		{/if}
	{/if}

	{#if error}
		<div class="problem">{error}</div>
	{:else if !current && loading}
		<Spinner />
	{:else if current && !current.data.length}
		<div class="empty muted">
			{#if view === 'queue'}
				Nothing is marked for deletion{#if reason || search.trim()}&nbsp;with these filters{/if}.
				Mark scores with the trash button on any score.
			{:else}
				No deleted scores{#if reason || search.trim()}&nbsp;with these filters{/if}.
			{/if}
		</div>
	{:else if current && view === 'queue'}
		<div class="queue-actions">
			<label class="select-all">
				<input type="checkbox" checked={allSelected} on:change={toggleAll} />
				Select page
			</label>
			<div class="spacer"></div>
			{#if progress}
				<span class="muted">Deleted {progress.deleted + progress.missing} of {progress.total}...</span>
			{/if}
			{#if selected.size}
				<Button type="default" iconFa="fas fa-rotate-left" label="Unmark {selected.size}" disabled={deleting} on:click={() => unmark([...selected])} />
				<Button type="danger" iconFa="fas fa-trash-alt" label="Delete {selected.size} selected" disabled={deleting} loading={deleting && !progress} on:click={deleteSelected} />
			{/if}
			<Button
				type="danger"
				iconFa="fas fa-dumpster-fire"
				label={reason ? `Delete all ${queue.metadata.total} ${reasonLabel(reason)}` : `Delete all ${queue.metadata.total}`}
				disabled={deleting || !queue.metadata.total}
				loading={!!progress}
				on:click={deleteAll} />
		</div>

		<div class="rows">
			{#each queue.data as mark (mark.id)}
				<div class="row" class:selected={selected.has(mark.scoreId)} class:gone={!mark.score}>
					<input type="checkbox" checked={selected.has(mark.scoreId)} on:change={() => toggle(mark.scoreId)} />
					<div class="row-main">
						{#if mark.score}
							<ScoreDeletionScore score={mark.score} />
						{:else}
							<div class="muted">Score {mark.scoreId} is already gone, deleting clears the mark</div>
						{/if}
						<div class="mark-info">
							<span class="reason-tag"><i class={reasonIcon(mark.reason)} /> {reasonLabel(mark.reason)}</span>
							{#if mark.comment}<span class="comment">{mark.comment}</span>{/if}
							<span class="muted by">
								{mark.markedBy?.name ?? 'Unknown'}, {formatDateRelative(dateFromUnix(mark.timestamp))}
							</span>
						</div>
					</div>
					<button class="small-btn" title="Remove from the queue" aria-label="Remove from the queue" on:click={() => unmark([mark.scoreId])}><i class="fas fa-xmark" /></button>
				</div>
			{/each}
		</div>
	{:else if current}
		<div class="rows">
			{#each history.data as record (record.id)}
				<div class="row" class:restored={record.restoredTimestamp}>
					<div class="row-main">
						{#if record.playerId || record.leaderboardId}
							<ScoreDeletionScore score={historyScore(record)} live={false} />
						{:else}
							<div class="legacy">
								<span class="muted">Deleted before the queue, only the replay is recorded</span>
								{#if record.replay}<a href={record.replay} class="replay-link">{record.replay.split('/').pop()}</a>{/if}
							</div>
						{/if}
						<div class="mark-info">
							{#if record.reason}
								<span class="reason-tag"><i class={reasonIcon(record.reason)} /> {reasonLabel(record.reason)}</span>
							{/if}
							{#if record.comment}<span class="comment">{record.comment}</span>{/if}
							<span class="muted by">
								deleted by {record.admin?.name ?? 'Unknown'}, {formatDateRelative(dateFromUnix(record.timestamp))}
								{#if record.markedBy && record.markedTimestamp !== record.timestamp}
									(marked by {record.markedBy.name}, {formatDateRelative(dateFromUnix(record.markedTimestamp))})
								{/if}
							</span>
							{#if record.restoredTimestamp}
								<span class="restored-tag">
									<i class="fas fa-circle-check" /> restored by {record.restoredBy?.name ?? 'Unknown'}, {formatDateRelative(dateFromUnix(record.restoredTimestamp))}
								</span>
							{/if}
						</div>
					</div>
					{#if record.playerId && !record.restoredTimestamp && record.replay}
						<Button
							type="default"
							iconFa="fas fa-trash-arrow-up"
							title="Upload the replay again"
							loading={restoring === record.id}
							disabled={restoring !== null}
							on:click={() => restore(record)} />
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if current?.metadata?.total > PAGE_SIZE}
		<Pager
			totalItems={current.metadata.total}
			itemsPerPage={PAGE_SIZE}
			itemsPerPageValues={null}
			currentPage={page - 1}
			loadingPage={loading ? page - 1 : null}
			on:page-changed={onPageChange} />
	{/if}
</div>

<style>
	.score-deletions {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.6em;
		flex-wrap: wrap;
	}

	.search-field {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: 1;
		min-width: 12em;
		padding: 0.35em 0.6em;
		border: 1px solid var(--faded, #555);
		border-radius: 0.4em;
		background-color: var(--background, #222);
	}

	.search-field input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: none;
		color: var(--textColor, white);
		font-family: inherit;
	}

	.reasons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.reason-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.3em 0.7em;
		border: 1px solid var(--faded, #555);
		border-radius: 1em;
		background: none;
		color: var(--textColor, white);
		font-family: inherit;
		font-size: 0.9em;
		cursor: pointer;
	}

	.reason-chip.small {
		font-size: 0.82em;
	}

	.reason-chip.on {
		border-color: #ff6b6b;
		background-color: #ff6b6b22;
		color: #ff8f8f;
	}

	.count {
		padding: 0 0.4em;
		border-radius: 0.6em;
		background-color: #ffffff1a;
		font-size: 0.85em;
	}

	.sd-section {
		padding: 0.6em 0.75em;
		border-radius: 8px;
		background-color: #121212;
	}

	.add-toggle {
		color: var(--faded);
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-top: 0.6em;
	}

	.add-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6em;
	}

	.sd-field {
		width: 100%;
		box-sizing: border-box;
		padding: 0.45em 0.6em;
		border: 1px solid var(--faded, #555);
		border-radius: 0.4em;
		background-color: var(--background, #222);
		color: var(--textColor, white);
		font-family: inherit;
	}

	textarea.sd-field {
		resize: vertical;
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.5em 0.8em;
		border-radius: 0.5em;
		background-color: #ffffff0d;
		color: var(--faded);
	}

	.notice :global(.spinner) {
		width: 1.2em;
		height: 1.2em;
	}

	.queue-actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex-wrap: wrap;
	}

	.select-all {
		display: flex;
		align-items: center;
		gap: 0.4em;
		cursor: pointer;
	}

	.spacer {
		flex: 1;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.row {
		display: flex;
		align-items: flex-start;
		gap: 0.7em;
		padding: 0.6em 0.75em;
		border-radius: 8px;
		background-color: #121212;
		border: 1px solid transparent;
	}

	.row.selected {
		border-color: #ff6b6b66;
		background-color: #ff6b6b0d;
	}

	.row.gone,
	.row.restored {
		opacity: 0.65;
	}

	.row > input[type='checkbox'] {
		margin-top: 1.2em;
		cursor: pointer;
	}

	.row-main {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		flex: 1;
		min-width: 0;
	}

	.mark-info {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.3em 0.7em;
		font-size: 0.9em;
	}

	.reason-tag {
		padding: 0.05em 0.5em;
		border-radius: 0.4em;
		background-color: #ff6b6b22;
		color: #ff8f8f;
		white-space: nowrap;
	}

	.restored-tag {
		color: #6fd36f;
	}

	.comment {
		overflow-wrap: anywhere;
	}

	.by {
		font-size: 0.95em;
	}

	.legacy {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		min-width: 0;
	}

	.replay-link {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.small-btn {
		width: 2em;
		height: 2em;
		flex-shrink: 0;
		border: none;
		border-radius: 0.4em;
		background-color: #ffffff12;
		color: var(--faded);
		cursor: pointer;
	}

	.small-btn:hover {
		color: var(--textColor, white);
	}

	.small-btn i {
		line-height: 2em;
	}

	.muted {
		color: var(--faded, #999);
	}

	.problem {
		color: #ff6b6b;
	}

	.empty {
		padding: 1.5em;
		text-align: center;
	}
</style>
