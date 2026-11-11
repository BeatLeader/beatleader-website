<script>
	import {navigate} from 'svelte-routing';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {formatNumber} from '../../utils/format';
	import Pager from '../Common/Pager.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Select from '../Settings/Select.svelte';

	const itemsPerPage = 20;
	const methods = [
		{name: 'All ways', value: 'all', icon: 'fa-list'},
		{name: 'Steam', value: 'steam', icon: 'fa-gamepad'},
		{name: 'Linked account', value: 'linkedAccount', icon: 'fa-link'},
		{name: 'Played a map', value: 'play', icon: 'fa-vr-cardboard'},
		{name: 'Password ending', value: 'hint', icon: 'fa-user-check'},
		{name: 'Replay from the headset', value: 'localReplay', icon: 'fa-file-arrow-up'},
		{name: 'Staff', value: 'staff', icon: 'fa-user-shield'},
		{name: 'Settings', value: 'settings', icon: 'fa-gear'},
	];
	const methodInfo = Object.fromEntries(methods.map(m => [m.value, m]));

	let records = null;
	let total = 0;
	let page = 1;
	let method = 'all';
	let loading = false;
	let error = null;

	async function fetchRecords(page, method) {
		const params = new URLSearchParams({page, count: itemsPerPage});
		if (method != 'all') params.set('method', method);

		loading = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}admin/passwordreset/records?${params}`, {credentials: 'include'});
			if (!response.ok) throw new Error(`Request failed (${response.status})`);
			const result = await response.json();
			records = result.data;
			total = result.metadata.total;
		} catch (e) {
			error = e.message;
		}
		loading = false;
	}

	$: fetchRecords(page, method);
</script>

<div class="toolbar">
	<Select
		value={method}
		options={methods}
		fontSize={0.8}
		fontPadding={0.4}
		on:change={e => {
			method = e.detail.value;
			page = 1;
		}} />
	{#if records}
		<span class="faded">{formatNumber(total, 0)} {total == 1 ? 'reset' : 'resets'}</span>
	{/if}
</div>

{#if error}
	<p class="error">{error}</p>
{/if}

{#if !records && loading}
	<Spinner />
{:else if records}
	<div class="records" class:loading>
		{#each records as record (record.id)}
			<div class="record">
				<div class="player">
					<Avatar
						player={{playerInfo: {avatar: record.playerAvatar}}}
						cls="is-32x32 clickable"
						on:click={() => navigate(`/u/${record.playerId}`)} />
					<div>
						<PlayerNameWithFlag
							player={{playerId: record.playerId, name: record.playerName ?? record.playerId}}
							hideFlag={true}
							disablePopover={true}
							on:click={() => navigate(`/u/${record.playerId}`)} />
						<span class="time" style="color: {getTimeStringColor(record.timeset)}" title={dateFromUnix(record.timeset)?.toLocaleString()}>
							{formatDateRelative(dateFromUnix(record.timeset))}
						</span>
					</div>
				</div>

				<div class="method-info">
					<span class="chip"
						><i class="fas {methodInfo[record.method]?.icon ?? 'fa-key'}"></i> {methodInfo[record.method]?.name ?? record.method}</span>
					{#if record.details}<span>{record.details}</span>{/if}
				</div>

				<div class="meta faded">
					{#if record.adminId}
						<span>by <a href="/u/{record.adminId}">{record.adminName ?? record.adminId}</a></span>
					{/if}
					{#if record.ip}<span title="IP the password was set from">{record.ip}</span>{/if}
				</div>
			</div>
		{:else}
			<p class="empty faded">No password resets yet</p>
		{/each}
	</div>

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
	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding-bottom: 0.6em;
		font-size: 0.95em;
	}

	.faded {
		color: var(--faded);
	}

	.error {
		color: var(--decrease);
	}

	.records {
		transition: opacity 200ms;
	}

	.records.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.record {
		display: grid;
		grid-template-columns: minmax(12em, 16em) 1fr minmax(8em, 12em);
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.6em 0.4em;
		border-bottom: 1px solid var(--row-separator);
	}

	.player {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
		font-weight: 600;
	}

	.player > div,
	.method-info,
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		min-width: 0;
	}

	.time {
		font-size: 0.8em;
		font-weight: normal;
	}

	.method-info {
		align-items: flex-start;
		font-size: 0.9em;
		word-break: break-word;
	}

	.chip {
		padding: 0.1em 0.5em;
		border-radius: 4px;
		background-color: var(--dimmed);
		white-space: nowrap;
	}

	.meta {
		align-items: flex-end;
		font-size: 0.8em;
	}

	.empty {
		padding: 3em 1em;
		text-align: center;
	}

	@media screen and (max-width: 767px) {
		.record {
			grid-template-columns: 1fr;
		}

		.meta {
			align-items: flex-start;
		}
	}
</style>
