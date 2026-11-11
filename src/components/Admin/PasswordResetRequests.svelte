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
	import {PLATFORM_NAMES} from '../ResetPassword/api';

	const itemsPerPage = 10;
	const statuses = [
		{name: 'Open', value: 'open', icon: 'fa-hourglass-half'},
		{name: 'All requests', value: 'all', icon: 'fa-list'},
		{name: 'Approved', value: 'approved', icon: 'fa-circle-check'},
		{name: 'Rejected', value: 'rejected', icon: 'fa-circle-xmark'},
		{name: 'Closed', value: 'closed', icon: 'fa-box-archive'},
	];
	const statusIcons = Object.fromEntries(statuses.map(s => [s.value, s.icon]));

	let requests = null;
	let total = 0;
	let page = 1;
	let status = 'open';
	let loading = false;
	let error = null;
	let notes = {};
	let profileIds = {};
	let expanded = {};
	let saving = null;
	let copied = null;

	async function api(path, method = 'GET') {
		const response = await fetch(BL_API_URL + path, {credentials: 'include', method});
		const text = await response.text();
		if (!response.ok) throw new Error(text.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`);
		return JSON.parse(text);
	}

	async function fetchRequests(page, status) {
		const params = new URLSearchParams({page, count: itemsPerPage});
		if (status != 'all') params.set('status', status);

		loading = true;
		error = null;
		try {
			const result = await api(`admin/passwordreset/requests?${params}`);
			requests = result.data;
			total = result.metadata.total;
		} catch (e) {
			error = e.message;
		}
		loading = false;
	}

	async function resolve(request, newStatus) {
		const params = new URLSearchParams({status: newStatus});
		if (notes[request.id]?.trim()) params.set('note', notes[request.id].trim());
		if (newStatus == 'approved' && profileIds[request.id]?.trim()) params.set('playerId', profileIds[request.id].trim());

		saving = request.id;
		error = null;
		try {
			const updated = await api(`admin/passwordreset/request/${request.id}?${params}`, 'POST');
			requests = requests.map(r => (r.id == updated.id ? updated : r));
		} catch (e) {
			error = e.message;
		}
		saving = null;
	}

	async function copyLink(request) {
		try {
			await navigator.clipboard.writeText(`${location.origin}/reset-password?token=${request.token}`);
			copied = request.id;
			setTimeout(() => (copied = null), 2000);
		} catch {}
	}

	function toggle(request, part) {
		expanded[request.id] = expanded[request.id] == part ? null : part;
	}

	function identityJson(text) {
		try {
			const value = JSON.parse(text);
			return JSON.stringify(value.Info ?? value, null, 2);
		} catch {
			return text;
		}
	}

	$: fetchRequests(page, status);
</script>

<div class="toolbar">
	<Select
		value={status}
		options={statuses}
		fontSize={0.8}
		fontPadding={0.4}
		on:change={e => {
			status = e.detail.value;
			page = 1;
		}} />
	{#if requests}
		<span class="faded">{formatNumber(total, 0)} {total == 1 ? 'request' : 'requests'}</span>
	{/if}
</div>

{#if error}
	<p class="bad">{error}</p>
{/if}

{#if !requests && loading}
	<Spinner />
{:else if requests}
	<div class="requests" class:loading>
		{#each requests as request (request.id)}
			<div class="request {request.status}">
				<div class="header">
					{#if request.playerId}
						<Avatar
							player={{playerInfo: {avatar: request.playerAvatar}}}
							cls="is-32x32 clickable"
							on:click={() => navigate(`/u/${request.playerId}`)} />
						<PlayerNameWithFlag
							player={{playerId: request.playerId, name: request.playerName ?? request.playerId}}
							hideFlag={true}
							disablePopover={true}
							on:click={() => navigate(`/u/${request.playerId}`)} />
					{:else}
						<span class="faded">No profile picked{request.profile ? `, typed "${request.profile}"` : ''}</span>
					{/if}
					<span class="chip {request.status}"><i class="fas {statusIcons[request.status]}"></i> {request.status}</span>
					<span class="time" style="color: {getTimeStringColor(request.timeset)}" title={dateFromUnix(request.timeset)?.toLocaleString()}>
						#{request.id} · {formatDateRelative(dateFromUnix(request.timeset))}
					</span>
				</div>

				<p class="request-message">{request.message}</p>

				<div class="facts">
					<span>
						<span class="faded">Platform</span>
						{request.platform ?? '?'}
						{#if request.accountPlatform}
							<span class="faded"
								>(profile: {PLATFORM_NAMES[request.accountPlatform] ?? request.accountPlatform}{request.hasPassword
									? ''
									: ', no password'})</span>
						{/if}
					</span>
					<span>
						<span class="faded">Login they try</span>
						{request.login || '—'}
						{#if request.accountLogin != null}
							{#if request.login?.trim().toLowerCase() == request.accountLogin.trim().toLowerCase()}
								<span class="good">correct</span>
							{:else}
								<span class="bad">actual: {request.accountLogin}</span>
							{/if}
						{/if}
					</span>
					<span><span class="faded">Contact</span> {request.contact || '—'}</span>
					{#if request.linkedAccounts.length}
						<span><span class="faded">Linked</span> {request.linkedAccounts.join(', ')}</span>
					{/if}
					<span><span class="faded">IP</span> {request.ip}</span>
				</div>

				{#if request.identityProvider}
					<p class="check">
						<i class="fas fa-robot" class:good={request.check == 'granted'} class:bad={request.check == 'denied'}></i>
						<b>{request.identityProvider} {request.identityName}:</b>
						{request.check}{request.checkReason ? `. ${request.checkReason}` : ''}
					</p>
				{/if}

				<div class="folds">
					{#if request.steps.length}
						<button on:click={() => toggle(request, 'steps')}
							><i class="fas fa-list-check"></i> What they tried ({request.steps.length})</button>
					{/if}
					{#if request.identityInfo}
						<button on:click={() => toggle(request, 'identity')}><i class="fas fa-id-card"></i> {request.identityProvider} account</button>
					{/if}
				</div>
				{#if expanded[request.id] == 'steps'}
					<ol class="steps">
						{#each request.steps as step}
							<li><span class="faded">{dateFromUnix(step.time)?.toLocaleTimeString()}</span> {step.text}</li>
						{/each}
					</ol>
				{:else if expanded[request.id] == 'identity'}
					<pre>{identityJson(request.identityInfo)}</pre>
				{/if}

				{#if request.completed}
					<p class="good"><i class="fas fa-key"></i> The password was reset{request.verifiedBy ? ` (${request.verifiedBy})` : ''}</p>
				{:else if request.status == 'open' || request.status == 'approved'}
					{#if request.status == 'approved'}
						<div class="actions">
							<span>
								Approved by {request.adminName ?? request.adminId}{request.adminNote ? `: ${request.adminNote}` : ''}. The player sets the
								new password on the page they sent the request from, or with the reset link.
							</span>
							<Button
								iconFa="fas fa-copy"
								label={copied == request.id ? 'Copied!' : 'Copy the reset link'}
								title="Opens the reset page ready for the new password, send it only to the owner of the profile"
								noMargin={true}
								on:click={() => copyLink(request)} />
						</div>
					{/if}

					<div class="actions">
						{#if request.status == 'open' && !request.hasPassword}
							<input
								class="profile-id"
								type="text"
								placeholder="Profile ID to reset"
								title="The request has no profile with a password, set the one to reset to approve it"
								bind:value={profileIds[request.id]} />
						{/if}
						<input type="text" placeholder="Note for the player (optional)" maxlength="500" bind:value={notes[request.id]} />
						{#if request.status == 'open'}
							<Button
								type="green"
								iconFa="fas fa-check"
								label="Approve the reset"
								title="Lets this player set a new password"
								loading={saving == request.id}
								disabled={saving != null || !(request.hasPassword || profileIds[request.id]?.trim())}
								noMargin={true}
								on:click={() => resolve(request, 'approved')} />
						{/if}
						<Button
							type="danger"
							iconFa="fas fa-xmark"
							label={request.status == 'approved' ? 'Take back' : 'Reject'}
							disabled={saving != null}
							noMargin={true}
							on:click={() => resolve(request, 'rejected')} />
						{#if request.status == 'open'}
							<Button
								iconFa="fas fa-box-archive"
								label="Close"
								title="Answered elsewhere or not about a reset, the note is shown to the player"
								disabled={saving != null}
								noMargin={true}
								on:click={() => resolve(request, 'closed')} />
						{/if}
					</div>
				{:else}
					<p class="faded">
						<i class="fas {statusIcons[request.status]}"></i>
						{request.status == 'rejected' ? 'Rejected' : 'Closed'}{request.adminId
							? ` by ${request.adminName ?? request.adminId}`
							: ''}{request.adminNote ? `: ${request.adminNote}` : ''}
					</p>
				{/if}
			</div>
		{:else}
			<p class="empty faded">No requests here</p>
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

	.good {
		color: var(--increase);
	}

	.bad {
		color: var(--decrease);
	}

	.requests {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		transition: opacity 200ms;
	}

	.requests.loading {
		opacity: 0.5;
		pointer-events: none;
	}

	.request {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		padding: 0.75em 1em;
		border-left: 3px solid var(--selected);
		border-radius: 6px;
		background-color: color-mix(in srgb, var(--textColor) 4%, transparent);
	}

	.request.approved {
		border-left-color: var(--increase);
	}

	.request.rejected {
		border-left-color: var(--decrease);
	}

	.request.closed {
		border-left-color: var(--faded);
	}

	.header,
	.actions,
	.folds {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.header {
		font-weight: 600;
	}

	.chip {
		padding: 0.1em 0.5em;
		border-radius: 4px;
		background-color: var(--dimmed);
		font-size: 0.8em;
		font-weight: normal;
		text-transform: capitalize;
	}

	.chip.approved {
		color: var(--increase);
	}

	.chip.rejected {
		color: var(--decrease);
	}

	.time {
		margin-left: auto;
		font-size: 0.8em;
		font-weight: normal;
	}

	.request-message {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em 1.4em;
		font-size: 0.9em;
	}

	.check {
		font-size: 0.9em;
	}

	.folds button {
		padding: 0;
		border: none;
		background: none;
		color: var(--faded);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
	}

	.folds button:hover {
		color: var(--textColor);
	}

	.steps {
		margin-left: 1.4em;
		font-size: 0.85em;
		word-break: break-word;
	}

	pre {
		max-height: 24em;
		padding: 0.6em 0.8em;
		overflow: auto;
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.3);
		color: inherit;
		font-size: 0.8em;
	}

	.actions {
		font-size: 0.85rem;
	}

	input {
		flex: 1;
		min-width: 12em;
		padding: 0.4em 0.6em;
		border: 1px solid var(--faded);
		border-radius: 4px;
		background-color: transparent;
		color: var(--textColor);
		font: inherit;
	}

	input::placeholder {
		color: var(--faded);
	}

	input.profile-id {
		flex: none;
	}

	.empty {
		padding: 3em 1em;
		text-align: center;
	}
</style>
