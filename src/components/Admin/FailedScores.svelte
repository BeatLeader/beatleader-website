<script>
	import createFailedScoresStore, {FAILED_SCORES_PER_PAGE} from '../../stores/beatleader/failed-scores';
	import {debounce} from '../../utils/debounce';
	import {formatNumber} from '../../utils/format';
	import Pager from '../Common/Pager.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Select from '../Settings/Select.svelte';
	import FailedScore from './FailedScore.svelte';
	import {FAILED_SCORE_TYPES} from './failed-score-types';

	const sortValues = [
		{value: 'date', name: 'Date', icon: 'fa-clock'},
		{value: 'pp', name: 'PP', icon: 'fa-cubes'},
		{value: 'acc', name: 'Accuracy', icon: 'fa-crosshairs'},
		{value: 'rank', name: 'Rank', icon: 'fa-list-ol'},
		{value: 'score', name: 'Score', icon: 'fa-hashtag'},
	];

	const failedScores = createFailedScoresStore();

	let page = 1;
	let type = 'all';
	let search = '';
	let sortBy = 'date';
	let order = 'desc';

	function setFilters(changes) {
		({type, search, sortBy, order} = {type, search, sortBy, order, ...changes});
		page = 1;
	}

	const onSearchInput = debounce(e => setFilters({search: e.target.value}), 500);

	function typeOptions(groups) {
		const counts = Object.fromEntries((groups ?? []).map(g => [g.type, g.count]));
		const all = Object.values(counts).reduce((sum, count) => sum + count, 0);

		return [
			{value: 'all', name: `All types · ${formatNumber(all, 0)}`, icon: 'fa-layer-group'},
			...FAILED_SCORE_TYPES.filter(t => counts[t.value] || t.value == type).map(t => ({
				value: t.value,
				name: `${t.name} · ${formatNumber(counts[t.value] ?? 0, 0)}`,
				icon: t.icon,
			})),
		];
	}

	$: failedScores.fetchScores(page, {type, search, sortBy, order});

	$: scores = $failedScores?.scores;
	$: total = $failedScores?.metadata?.total ?? 0;
	$: types = typeOptions($failedScores?.groups);
	$: notice = $failedScores?.notice;
</script>

<div class="list-toolbar">
	<div class="filters">
		<Select value={type} options={types} fontSize={0.8} fontPadding={0.4} on:change={e => setFilters({type: e.detail.value})} />
		<Select value={sortBy} options={sortValues} fontSize={0.8} fontPadding={0.4} on:change={e => setFilters({sortBy: e.detail.value})} />
		<Button
			cls="order-toggle"
			type="text"
			iconFa="fas {order === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
			title={order === 'asc' ? 'Ascending' : 'Descending'}
			noMargin={true}
			on:click={() => setFilters({order: order === 'asc' ? 'desc' : 'asc'})} />
		{#if scores}
			<span class="total">{formatNumber(total, 0)} {total == 1 ? 'score' : 'scores'}</span>
		{/if}
	</div>
	<label class="search" class:has-value={search.length}>
		<i class="fas fa-search"></i>
		<input type="text" placeholder="Player, song, leaderboard id or error..." value={search} on:input={onSearchInput} />
	</label>
</div>

{#if notice}
	<p class="notice" class:has-error={!notice.ok}>
		<i class="fas {notice.ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
		<span class:problem={!notice.ok}>{notice.text}</span>
		<button class="close" title="Hide" aria-label="Hide" on:click={() => failedScores.clearNotice()}><i class="fas fa-xmark"></i></button>
	</p>
{/if}

{#if $failedScores?.error}
	<p class="notice has-error"><i class="fas fa-circle-xmark"></i><span class="problem">{$failedScores.error}</span></p>
{/if}

{#if !scores && $failedScores?.loading}
	<Spinner />
{:else if scores}
	<div class="song-scores failed-score-list" class:loading={$failedScores.loading}>
		{#each scores as songScore, idx (songScore?.score?.id)}
			<FailedScore
				store={failedScores}
				{songScore}
				{idx}
				playerFailedCount={$failedScores.playerCounts?.[songScore?.score?.playerId] ?? 0}
				on:search={e => setFilters({search: e.detail})} />
		{/each}
	</div>

	{#if !scores.length}
		<div class="empty">
			<i class="fas fa-file-circle-check"></i>
			<p>{search.trim().length || type != 'all' ? 'No failed scores match the filters' : 'No failed scores'}</p>
		</div>
	{/if}

	{#if total > FAILED_SCORES_PER_PAGE}
		<Pager
			totalItems={total}
			itemsPerPage={FAILED_SCORES_PER_PAGE}
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

	.filters {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		font-size: 0.95em;
	}

	.filters :global(.order-toggle) {
		font-size: 0.85rem;
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
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
	}

	.notice.has-error {
		background-color: rgba(255, 60, 60, 0.08);
	}

	.notice > i {
		color: #6fd36f;
	}

	.notice.has-error > i,
	.problem {
		color: #ff6b6b;
	}

	.notice .close {
		margin-left: auto;
		padding: 0 0.2em;
		border: none;
		background: none;
		color: var(--faded, #999);
		cursor: pointer;
	}

	.failed-score-list {
		transition: opacity 200ms;
	}

	.failed-score-list.loading {
		opacity: 0.5;
		pointer-events: none;
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

	@media screen and (max-width: 767px) {
		.search {
			flex: 1 1 100%;
		}
	}
</style>
