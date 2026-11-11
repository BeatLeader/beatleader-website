<script>
	import {navigate} from 'svelte-routing';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {formatNumber} from '../../utils/format';
	import Pager from '../Common/Pager.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Select from '../Settings/Select.svelte';
	import ProfileReviewZoom from './ProfileReviewZoom.svelte';

	const itemsPerPage = 20;
	const statuses = [
		{name: 'All statuses', value: 'all', icon: 'fa-list'},
		{name: 'Pending', value: 'pending', icon: 'fa-hourglass-half'},
		{name: 'Okay', value: 'okay', icon: 'fa-circle-check'},
		{name: 'Flagged', value: 'flagged', icon: 'fa-flag'},
		{name: 'Failed', value: 'failed', icon: 'fa-triangle-exclamation'},
	];
	const types = [
		{name: 'All changes', value: 'all', icon: 'fa-layer-group'},
		{name: 'Names', value: 'name', icon: 'fa-signature'},
		{name: 'Avatars', value: 'avatar', icon: 'fa-circle-user'},
		{name: 'Covers', value: 'cover', icon: 'fa-image'},
	];
	const typeLabels = {name: 'Name', avatar: 'Avatar', cover: 'Cover'};
	const statusIcons = Object.fromEntries(statuses.map(s => [s.value, s.icon]));

	let reviews = null;
	let total = 0;
	let page = 1;
	let status = 'all';
	let type = 'all';
	let loading = false;
	let error = null;
	let running = false;
	let runResult = null;
	let zoom = null;
	let missing = {};

	async function readError(response) {
		const text = await response.text();
		return text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`;
	}

	async function fetchReviews(page, status, type) {
		const params = new URLSearchParams({page, count: itemsPerPage});
		if (status != 'all') params.set('status', status);
		if (type != 'all') params.set('type', type);

		loading = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/profilereviews?${params}`, {credentials: 'include'});
			if (!response.ok) throw new Error(await readError(response));
			const result = await response.json();
			reviews = result.data;
			total = result.metadata.total;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function runReview() {
		running = true;
		runResult = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/profilereviews/run`, {credentials: 'include', method: 'POST'});
			runResult = response.ok ? await response.json() : {error: await readError(response)};
		} catch (e) {
			runResult = {error: e.message};
		} finally {
			running = false;
		}
		fetchReviews(page, status, type);
	}

	function reportText(report) {
		if (!report.reviewed) return report.error ? 'Review failed' : 'Nothing was pending';

		const tokens = (report.inputTokens ?? 0) + (report.outputTokens ?? 0);
		return (
			`${report.reviewed} reviewed, ${report.flagged} flagged, ${report.reverted} reverted, ${report.failed} failed` +
			(tokens ? `, ${formatNumber(tokens, 0)} tokens` : '')
		);
	}

	function reviewImages(review) {
		const restored = review.reverted && review.revertedTo && review.revertedTo == review.oldValue;
		return [
			review.oldValue
				? {id: 'before', label: restored ? 'Before, restored' : 'Before', url: review.oldValue, iconFa: 'fas fa-clock-rotate-left'}
				: null,
			{id: 'after', label: 'After', url: review.newValue, iconFa: 'fas fa-arrow-right'},
			review.reverted && review.revertedTo && !restored
				? {id: 'reverted', label: 'Reverted to', url: review.revertedTo, iconFa: 'fas fa-rotate-left'}
				: null,
		].filter(Boolean);
	}

	function openZoom(review, url) {
		const images = reviewImages(review);
		zoom = {
			title: `${review.playerName ?? review.playerId}: ${typeLabels[review.type].toLowerCase()} change`,
			images,
			selected: images.find(i => i.url == url)?.id,
			avatar: review.type == 'avatar',
		};
	}

	function setFilter(filter, value) {
		if (filter == 'status') status = value;
		else type = value;
		page = 1;
	}

	$: fetchReviews(page, status, type);
</script>

<div class="list-toolbar">
	<div class="filters">
		<Select value={status} options={statuses} fontSize={0.8} fontPadding={0.4} on:change={e => setFilter('status', e.detail.value)} />
		<Select value={type} options={types} fontSize={0.8} fontPadding={0.4} on:change={e => setFilter('type', e.detail.value)} />
		{#if reviews}
			<span class="total">{formatNumber(total, 0)} {total == 1 ? 'change' : 'changes'}</span>
		{/if}
	</div>
	<div class="run-button">
		<Button
			type="primary"
			iconFa="fas fa-robot"
			label={running ? 'Reviewing...' : 'Review pending now'}
			title="Send the pending changes to Claude right away instead of waiting for the background job (every 2 minutes)"
			loading={running}
			disabled={running}
			noMargin={true}
			on:click={runReview} />
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

{#if !reviews && loading}
	<Spinner />
{:else if reviews}
	<div class="reviews" class:loading>
		{#each reviews as review (review.id)}
			{@const flagged = review.status == 'flagged'}
			<div class="review {review.status}">
				<div class="review-player">
					<Avatar
						player={{playerInfo: {avatar: review.playerAvatar}}}
						cls="is-32x32 clickable"
						on:click={() => navigate(`/u/${review.playerId}`)} />
					<div class="player-info">
						<PlayerNameWithFlag
							player={{playerId: review.playerId, name: review.playerName ?? review.playerId}}
							hideFlag={true}
							disablePopover={true}
							on:click={() => navigate(`/u/${review.playerId}`)} />
						<div class="meta">
							<span class="chip">{review.initial ? 'Sign-up name' : typeLabels[review.type]}</span>
							<span class="time" style="color: {getTimeStringColor(review.timeset)}" title={dateFromUnix(review.timeset)?.toLocaleString()}>
								{formatDateRelative(dateFromUnix(review.timeset))}
							</span>
						</div>
					</div>
				</div>

				<div class="review-change">
					{#if review.type == 'name'}
						{#if review.oldValue != null}
							<span class="old-name">{review.oldValue}</span>
							<i class="fas fa-arrow-right arrow"></i>
						{/if}
						<span class="new-name" class:struck={flagged}>{review.newValue}</span>
					{:else}
						{#if review.oldValue}
							<button
								class="thumb {review.type}"
								class:missing={missing[review.oldValue]}
								title="Zoom in"
								on:click={() => openZoom(review, review.oldValue)}>
								<img src={review.oldValue} alt="Before" loading="lazy" on:error={() => (missing[review.oldValue] = true)} />
							</button>
						{:else}
							<span class="no-image {review.type}">None</span>
						{/if}
						<i class="fas fa-arrow-right arrow"></i>
						<button
							class="thumb {review.type}"
							class:blurred={flagged}
							class:missing={missing[review.newValue]}
							title={flagged ? 'Flagged, click to look closer' : 'Zoom in'}
							on:click={() => openZoom(review, review.newValue)}>
							<img src={review.newValue} alt="After" loading="lazy" on:error={() => (missing[review.newValue] = true)} />
							{#if flagged && !missing[review.newValue]}
								<i class="fas fa-eye-slash thumb-icon"></i>
							{/if}
						</button>
					{/if}
				</div>

				<div class="review-verdict">
					<span class="status {review.status}">
						<i class="fas {statusIcons[review.status]}"></i>
						{review.status}
					</span>
					{#if review.reason}
						<div class="reason">{review.reason}</div>
					{/if}
					{#if flagged}
						<div class="revert">
							{#if !review.reverted}
								Not reverted, it was changed again before the review
							{:else if review.type == 'name'}
								Reverted to <b>{review.revertedTo}</b>
							{:else if review.revertedTo}
								Reverted to
								<button class="thumb small {review.type}" title="Zoom in" on:click={() => openZoom(review, review.revertedTo)}>
									<img src={review.revertedTo} alt="Reverted to" loading="lazy" />
								</button>
							{:else}
								Reverted to no cover
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !reviews.length}
		<div class="empty">
			<i class="fas fa-user-shield"></i>
			<p>No changes match the filters</p>
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

{#if zoom}
	<ProfileReviewZoom {...zoom} on:close={() => (zoom = null)} />
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

	.run-button {
		font-size: 0.85rem;
	}

	.total {
		margin-left: 0.3em;
		color: var(--faded, #999);
		font-size: 0.9em;
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

	.reviews {
		transition: opacity 200ms;
	}

	.reviews.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.review {
		display: grid;
		grid-template-columns: minmax(12em, 16em) 1fr minmax(14em, 20em);
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.6em 0.4em 0.6em 0.6em;
		border-bottom: 1px solid var(--row-separator);
		border-left: 3px solid transparent;
	}

	.review.flagged {
		border-left-color: #ff6b6b;
		background-color: rgba(255, 60, 60, 0.04);
	}

	.review.failed {
		border-left-color: #e8c34a;
	}

	.review-player {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.review-player :global(figure) {
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		min-width: 0;
		font-weight: 600;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		font-size: 0.8em;
		font-weight: normal;
	}

	.chip,
	.status {
		padding: 0.1em 0.45em;
		border-radius: 4px;
		white-space: nowrap;
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.review-change {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6em;
		min-width: 0;
		word-break: break-word;
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
		color: #ff6b6b;
	}

	.thumb {
		position: relative;
		display: inline-flex;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--textColor, white) 15%, transparent);
		border-radius: 8px;
		background: none;
		overflow: hidden;
		cursor: zoom-in;
		transition:
			border-color 150ms,
			transform 150ms;
	}

	.thumb:hover {
		border-color: var(--beatleader-primary, #eb008c);
		transform: scale(1.04);
	}

	.thumb img {
		display: block;
		height: 5em;
		max-width: 16em;
		object-fit: cover;
	}

	.thumb.avatar,
	.thumb.avatar img {
		border-radius: 50%;
	}

	.thumb.avatar img {
		width: 5em;
	}

	.thumb.small img {
		height: 2em;
		max-width: 6em;
	}

	.thumb.small.avatar img {
		width: 2em;
	}

	.thumb.blurred img {
		filter: blur(10px);
	}

	.thumb.missing {
		border-style: dashed;
	}

	.thumb.missing img {
		width: 5em;
		visibility: hidden;
	}

	.thumb.missing::after {
		content: 'Missing';
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.thumb-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		text-shadow: 0 0 4px black;
	}

	.no-image {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 5em;
		padding: 0 1em;
		border: 1px dashed color-mix(in srgb, var(--textColor, white) 20%, transparent);
		border-radius: 8px;
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.no-image.avatar {
		width: 5em;
		padding: 0;
		border-radius: 50%;
	}

	.review-verdict {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3em;
		font-size: 0.9em;
	}

	.status {
		text-transform: capitalize;
		font-size: 0.9em;
	}

	.status.pending {
		color: var(--faded, #999);
	}

	.status.okay {
		color: #6fd36f;
	}

	.status.flagged {
		color: #ff6b6b;
	}

	.status.failed {
		color: #e8c34a;
	}

	.reason {
		opacity: 0.85;
	}

	.revert {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		color: var(--faded, #999);
	}

	.revert b {
		color: var(--textColor, white);
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
		.review {
			grid-template-columns: 1fr;
		}
	}
</style>
