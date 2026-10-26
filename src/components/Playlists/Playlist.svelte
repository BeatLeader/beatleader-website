<script>
	import {getContext, onMount, setContext} from 'svelte';
	import {writable} from 'svelte/store';
	import {getNotificationsContext} from 'svelte-notifications';
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import Badge from '../Common/Badge.svelte';
	import PlaylistCoverBadge from './PlaylistCoverBadge.svelte';
	import ActivePlaylistIcon from './ActivePlaylistIcon.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import PlaylistInstallButton from './PlaylistInstallButton.svelte';
	import {activePlaylistIcon, playlistTypeIcon} from './icons';
	import {BL_REPLAYS_URL} from '../../network/queues/beatleader/api-queue';
	import PlaylistSongs from './PlaylistSongs.svelte';
	import ReplayPlaylistItems from './ReplayPlaylistItems.svelte';
	import PlaylistShareDialog from './PlaylistShareDialog.svelte';
	import PlaylistEditDialog from './PlaylistEditDialog.svelte';
	import PlaylistDeleteConfirm from './PlaylistDeleteConfirm.svelte';
	import PlaylistToolsDialog from './PlaylistToolsDialog.svelte';
	import PlaylistPinDialog from './PlaylistPinDialog.svelte';
	import PlaylistVoteDialog from './PlaylistVoteDialog.svelte';
	import PlaylistVotePanel from './PlaylistVotePanel.svelte';
	import PlaylistVoteHistory from './PlaylistVoteHistory.svelte';
	import {VOTE_CONTEXT, timeLeft} from './votes';
	import {configStore} from '../../stores/config';
	import {
		canEditDetails,
		isReplayPlaylist,
		playlistAccessId,
		playlistCover,
		playlistItemCount,
		playlistItemsLabel,
		playlistPageUrl,
		searchPageUrl,
		voteRunning,
	} from '../../stores/playlists';

	export let playlist;
	export let playlistKey = null;
	export let store;
	export let currentPlayerId = null;
	export let sharedPlaylistId = null;

	const {addNotification} = getNotificationsContext();
	const {open, close} = getContext('simple-modal');

	const SUBMISSIONS_PLAYLIST = 87503;
	const SUBMISSIONS = [8, 26, 37, 43, 47, 49, 50, 53, 54, 57, 25, 31, 42, 48, 55];
	const VISIBILITY_ICONS = {
		Local: 'fas fa-hard-drive',
		'One-click': 'fas fa-wand-magic-sparkles',
		Public: 'fas fa-globe',
		Unlisted: 'fas fa-link',
		Private: 'fas fa-lock',
	};

	let coverInput;

	const voteState = writable(null);
	setContext(VOTE_CONTEXT, voteState);
	let tab = 'items';
	let nowTick = Date.now();
	let endedVoteId = null;
	onMount(() => {
		const timer = setInterval(() => (nowTick = Date.now()), 5000);
		return () => clearInterval(timer);
	});

	function notify(text, type = 'success', removeAfter = type === 'error' ? 4000 : 2000) {
		addNotification({text, position: 'top-right', type, removeAfter});
	}

	function notifyError(e) {
		notify(e?.message?.length && e.message.length < 200 ? e.message : 'Something went wrong, the playlist was reloaded', 'error');
	}

	function changeCover(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		store.updateIcon(playlistKey, file).catch(notifyError);
		e.target.value = '';
	}

	function toggleActive() {
		const activate = !isActive;
		store.select(activate ? playlist : null);
		if (activate) notify(replays ? 'Playlist buttons on scores now add replays here' : 'Playlist buttons on maps now add them here');
	}

	function openEdit() {
		open(PlaylistEditDialog, {mode: 'edit', playlist, close: () => close()});
	}

	let refreshing = false;
	async function refreshNow() {
		refreshing = true;
		try {
			await store.refreshSource(playlistKey, true);
			notify('Search ran again');
		} catch (e) {
			notifyError(e);
		}
		refreshing = false;
	}

	function stopFollowing() {
		store
			.stopFollowing(playlistKey)
			.then(() => notify('Stopped following the search: the maps are yours to edit now'))
			.catch(notifyError);
	}

	let refreshedKey = null;
	$: if (playlist?.source && playlistKey != null && refreshedKey !== playlistKey) {
		refreshedKey = playlistKey;
		store.refreshSource(playlistKey).catch(() => {});
	}

	function openPin() {
		open(PlaylistPinDialog, {
			playlist,
			close: () => close(),
			onChange: (pinned, description) => {
				playlist.pinned = pinned;
				playlist.pinDescription = description;
				playlist = playlist;
				notify(pinned ? 'Pinned to your profile' : 'Unpinned from your profile');
			},
		});
	}

	function openStartVote() {
		open(PlaylistVoteDialog, {
			playlist,
			store,
			close: () => close(),
			onStarted: () => {
				tab = 'items';
				notify('Vote started');
			},
		});
	}

	function onVoteEnded(e) {
		endedVoteId = e.detail;
		if (playlistKey != null) store.reload(playlistKey).catch(() => {});
	}

	function openTools() {
		open(PlaylistToolsDialog, {playlist, store, close: () => close()});
	}

	function openShare() {
		open(PlaylistShareDialog, {playlist, store, close: () => close()});
	}

	let copying = false;
	async function copyPlaylist() {
		copying = true;
		try {
			const created = await store.copy(playlist);
			const skipped = created.skipped
				? ` ${created.skipped} ${created.skipped === 1 ? "replay you can't watch was" : "replays you can't watch were"} left out.`
				: '';
			notify(`Copied to your playlists and made active.${skipped}`, 'success', 4000);
			navigate(playlistPageUrl(created));
		} catch (e) {
			notify(e?.message || 'Failed to copy the playlist', 'error');
		} finally {
			copying = false;
		}
	}

	function openDelete() {
		open(PlaylistDeleteConfirm, {
			playlistName: playlist.playlistTitle,
			leave: !isOwner,
			pinCount: isOwner ? (playlist.pinCount ?? 0) : 0,
			confirm: () => {
				close();
				store
					.deleteList(playlistKey)
					.then(() => navigate('/playlists'))
					.catch(notifyError);
			},
			cancel: () => close(),
		});
	}

	function visibilityOf(playlist) {
		if (playlist?.role === 'local') return 'Local';
		if (playlist?.oneclick) return 'One-click';
		if (playlist?.isPublic) return 'Public';
		if (playlist?.linkGuid || playlist?.accessGuid) return 'Unlisted';
		return playlist?.id ? 'Private' : null;
	}

	$: replays = isReplayPlaylist(playlist);
	$: playlistId = playlist?.id ?? sharedPlaylistId ?? playlist?.customData?.id;
	$: voting = voteRunning(playlist, nowTick) && playlist.vote.id !== endedVoteId;
	$: canEditInfo = playlistKey != null && canEditDetails(playlist);
	$: canModify = canEditInfo && !playlist.source && !voting;
	$: isServerPlaylist = !!playlist?.id && !playlist.oneclick && playlist.role !== 'local';
	$: searchUrl = playlist?.source ? searchPageUrl(playlist.source) : null;
	$: isOwner = playlist?.role === 'owner' || playlist?.role === 'local';
	$: isActive = playlistKey != null && $configStore?.selectedPlaylistId === playlistKey;
	$: canShare = playlist?.role === 'owner' && playlist?.id;
	$: canCopy = !!currentPlayerId && isServerPlaylist;
	$: canPin = !!currentPlayerId && !!playlist?.id && (playlist.isPublic || playlist.pinned);
	$: canStartVote = playlist?.role === 'owner' && isServerPlaylist && !playlist.source && !voting && playlistItemCount(playlist) > 0;
	$: showVotesTab = !!playlist?.id && (voting || playlist.voteCount > 0);
	$: if (!showVotesTab && tab === 'votes') tab = 'items';
	$: watchAllUrl = isServerPlaylist && playlistItemCount(playlist) ? `${BL_REPLAYS_URL}?playlist=${playlistAccessId(playlist)}` : null;
	$: canTidy = canModify && !replays && isServerPlaylist;
	$: showOwner = playlist?.owner && playlist.owner.id != currentPlayerId;
	$: visibility = visibilityOf(playlist);
	$: submissions = playlistId == SUBMISSIONS_PLAYLIST ? SUBMISSIONS : null;
	$: cover = playlistCover(playlist);
	$: title = playlist?.playlistTitle ?? '';
</script>

{#if playlist}
	<div class="playlist-view" class:replays>
		<div class="leaderboard-header-box">
			<div class="pl-header">
				<div class="cinematics">
					<div class="cinematics-canvas">
						<div class="cinematics-image" style="background-image: url({cover})" />
					</div>
				</div>

				<div class="cover-container">
					<PlaylistCoverBadge {replays} />
					{#if canEditInfo && !playlist.oneclick}
						<button class="cover-button" title="Change the cover" on:click={() => coverInput.click()}>
							<img class="pl-cover" src={cover} alt="Playlist cover" />
							<span class="cover-overlay"><i class="fas fa-image" /> Change cover</span>
						</button>
						<input class="hidden" type="file" accept=".jpg, .jpeg, .png, .gif" bind:this={coverInput} on:change={changeCover} />
					{:else}
						<img class="pl-cover" src={cover} alt="Playlist cover" />
					{/if}
				</div>

				<div class="main-container">
					<div class="header-container">
						<div class="header-top-part">
							<h1 class="pl-title-line">
								<span class="pl-name {title.length > 40 ? 'name-long' : 'name-short'}">{title}</span>
							</h1>
							<div class="title-container">
								{#if showOwner}
									{@const ownerUrl = `/u/${playlist.owner.alias ?? playlist.owner.id}`}
									<a class="owner-pill" href={ownerUrl} on:click|preventDefault={() => navigate(ownerUrl)} title="Owner">
										{#if playlist.owner.avatar}<img src={playlist.owner.avatar} alt="" />{/if}
										{playlist.owner.name}
									</a>
								{/if}
								<div class="status-and-type">
									{#if visibility}
										<Badge
											onlyLabel={true}
											color="white"
											bgColor={visibility === 'Public'
												? '#2e7d32'
												: visibility === 'Unlisted'
													? '#1f6fb2'
													: 'var(--dimmed)'}
											title={visibility === 'Unlisted' ? 'Anyone with the link can open it' : null}
											fluid={true}>
											<span slot="label"><i class={VISIBILITY_ICONS[visibility]} /> {visibility}</span>
										</Badge>
									{/if}
									{#if playlist.role === 'editor'}
										<Badge
											onlyLabel={true}
											color="white"
											bgColor="#1f6fb2"
											fluid={true}
											title="The owner shared this playlist with you, you can edit it">
											<span slot="label"><i class="fas fa-user-pen" /> You can edit</span>
										</Badge>
									{:else if playlist.role === 'viewer' && playlistKey != null}
										<Badge
											onlyLabel={true}
											color="white"
											bgColor="#1f6fb2"
											fluid={true}
											title="The owner shared this playlist with you">
											<span slot="label"><i class="fas fa-user-group" /> Shared with you</span>
										</Badge>
									{/if}
									{#if voting}
										<Badge
											onlyLabel={true}
											color="white"
											bgColor="#7a4fd6"
											fluid={true}
											title="A vote runs on this playlist">
											<span slot="label">
												<i class="fas fa-square-poll-vertical" /> Vote{playlist.vote.endsAt
													? ` · ${timeLeft(playlist.vote.endsAt, nowTick)} left`
													: ''}
											</span>
										</Badge>
									{/if}
									{#if isActive}
										<Badge
											onlyLabel={true}
											color="#222"
											bgColor="#ffd24d"
											fluid={true}
											title="Playlist buttons on maps and scores add here">
											<span slot="label"><ActivePlaylistIcon /> Active</span>
										</Badge>
									{/if}
								</div>
								{#if playlist.createdAt || playlist.updatedAt}
									<span class="pl-dates">
										{#if playlist.createdAt}<span>Created <FormattedDate date={playlist.createdAt} /></span>{/if}
										{#if playlist.updatedAt && playlist.updatedAt !== playlist.createdAt}
											<span>Updated <FormattedDate date={playlist.updatedAt} /></span>
										{/if}
									</span>
								{/if}
								{#if playlist.source}
									<div class="pl-follow">
										<span
											class="follow-pill"
											title="Its maps are the results of a search, run again when the playlist syncs in game or opens here, at most hourly">
											<i class="fas fa-satellite-dish" /> Follows a search
											{#if playlist.sourceRefreshedAt}<span class="follow-time"
													>· ran <FormattedDate date={playlist.sourceRefreshedAt} /></span
												>{/if}
										</span>
										{#if searchUrl}
											<a class="follow-action" href={searchUrl} on:click|preventDefault={() => navigate(searchUrl)}
												>Open search</a>
										{/if}
										{#if canEditInfo}
											<button class="follow-action" disabled={refreshing} on:click={refreshNow}
												>{refreshing ? 'Running...' : 'Refresh now'}</button>
										{/if}
										{#if isOwner}
											<button
												class="follow-action"
												title="Keep the current maps and make them editable; the search won't run again"
												on:click={stopFollowing}>
												Stop following
											</button>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<div class="header-middle-part">
							{#if playlist.playlistDescription?.length}
								<p class="pl-description">{playlist.playlistDescription}</p>
							{/if}
							{#if playlist.oneclick}
								<p class="oneclick-note">This is the magic playlist the Quest mod syncs automatically (v0.4+).</p>
							{/if}
						</div>

						<div class="header-bottom-part">
							<div class="icons-container buttons-container">
								<span>
									{#if canModify && !playlist.oneclick}
										<Button
											icon={activePlaylistIcon('1.5em')}
											title={isActive
												? 'Active: playlist buttons add here. Click to stop'
												: 'Make active: playlist buttons on maps and scores add here'}
											bgColor={isActive ? '#ffd24d' : null}
											color={isActive ? '#222' : null}
											animated={!isActive}
											noMargin={true}
											on:click={toggleActive} />
									{/if}
									{#if watchAllUrl}
										<Button
											url={watchAllUrl}
											urltarget="_blank"
											onlyurl={true}
											icon={playlistTypeIcon(true, '1.2em')}
											title={replays
												? 'Watch in the web player, one replay after another'
												: 'Watch in the web player: the top score without modifiers on each map'}
											animated={true}
											noMargin={true} />
									{/if}
									<PlaylistInstallButton {playlist} playlistId={playlist.accessGuid ?? playlistId} />
									<Button
										iconFa="fas fa-download"
										title="Download the {replays ? '.bsorlist' : '.bplist'} file"
										animated={true}
										noMargin={true}
										on:click={() => store.download(playlist)} />
									{#if canCopy}
										<Button
											iconFa="fas fa-copy"
											title="Copy to your playlists to change it. The copy becomes your active playlist"
											loading={copying}
											disabled={copying}
											animated={true}
											noMargin={true}
											on:click={copyPlaylist} />
									{/if}
									{#if canEditInfo && !playlist.oneclick}
										<Button
											iconFa="fas fa-pen"
											title="Edit title, description and cover"
											animated={true}
											noMargin={true}
											on:click={openEdit} />
									{/if}
									{#if canShare}
										<Button
											iconFa="fas fa-share-nodes"
											title="Make public or share with players"
											animated={true}
											noMargin={true}
											on:click={openShare} />
									{/if}
									{#if canStartVote}
										<Button
											iconFa="fas fa-square-poll-vertical"
											title="Start a vote on its {replays ? 'replays' : 'maps'}"
											animated={true}
											noMargin={true}
											on:click={openStartVote} />
									{/if}
									{#if canPin}
										<Button
											iconFa="fas fa-thumbtack"
											title={playlist.pinned
												? 'Pinned to your profile: edit the comment or unpin'
												: 'Pin to your profile'}
											bgColor={playlist.pinned ? 'var(--beatleader-primary)' : null}
											color={playlist.pinned ? 'white' : null}
											animated={!playlist.pinned}
											noMargin={true}
											on:click={openPin} />
									{/if}
									{#if playlistKey != null && !playlist.oneclick}
										<Button
											iconFa={isOwner ? 'fas fa-trash-alt' : 'fas fa-right-from-bracket'}
											title={isOwner ? 'Delete the playlist' : 'Remove it from your playlists'}
											type="danger"
											animated={true}
											noMargin={true}
											on:click={openDelete} />
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		{#if submissions}
			<a class="vote-link" href="https://forms.gle/dDSfZgwJBU6AGvpy7" target="_blank" rel="noreferrer">Vote for your favorite map!</a>
		{/if}

		<div class="items-tab-container" class:votes-active={tab === 'votes'}>
			<button class="items-tab" class:inactive={tab !== 'items'} on:click={() => (tab = 'items')}
				>{playlistItemsLabel(playlist)}</button>
			{#if showVotesTab}
				<button class="items-tab votes-tab" class:inactive={tab !== 'votes'} on:click={() => (tab = 'votes')}>
					<i class="fas fa-square-poll-vertical" /> Votes
					{#if playlist.voteCount}<span class="tab-count">{playlist.voteCount}</span>{/if}
				</button>
			{/if}
			<span class="items-tab-spacer" />
		</div>
		<div class="leaderboard items-box" class:votes-box={tab === 'votes'}>
			{#if tab === 'votes'}
				<div class="items-container darkened-background">
					<PlaylistVoteHistory {playlist} {store} isOwner={playlist.role === 'owner'} on:show-running={() => (tab = 'items')} />
				</div>
			{:else}
				{#if voting}
					<PlaylistVotePanel
						{playlist}
						{store}
						{voteState}
						isOwner={playlist.role === 'owner'}
						loggedIn={!!currentPlayerId}
						editor={playlist.role === 'owner' || playlist.role === 'editor'}
						on:ended={onVoteEnded} />
				{/if}
				{#if canModify}
					<nav class="items-nav">
						{#if canTidy}
							<button
								class="tools-button"
								title="Sort the whole playlist, update maps, remove deleted or played ones"
								on:click={openTools}>
								<i class="fas fa-wand-magic-sparkles" /> Sort & clean up
							</button>
						{/if}
						<span class="items-hint">Drag to reorder, or to another playlist on the Playlists page to copy.</span>
					</nav>
				{/if}
				<div class="items-container darkened-background">
					{#if replays}
						<ReplayPlaylistItems {playlist} {playlistKey} {store} {canModify} on:error={e => notifyError(e.detail)} />
					{:else}
						<PlaylistSongs {playlist} {playlistKey} {store} {canModify} {submissions} on:error={e => notifyError(e.detail)} />
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.playlist-view {
		--pl-accent: var(--beatleader-primary);
	}

	.playlist-view.replays {
		--pl-accent: #2f8fe0;
	}

	.hidden {
		display: none;
	}

	/* The backdrop filter makes a stacking context that keeps the cinematics' z-index -1 above the black background */
	.leaderboard-header-box {
		padding: 0;
		border-radius: 12px;
		background-color: black;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		margin: 0 10px 16px;
		z-index: 0;
	}

	.pl-header {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 1em;
		padding: 0.6em;
		border-radius: 12px;
		margin-bottom: 1.2em;
		color: var(--alternate);
	}

	.cinematics {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 110%;
		height: 110%;
		z-index: -1;
		filter: blur(5em) opacity(0.5) saturate(250%);
		transform: scale(1.1) translateZ(0);
	}

	.cinematics-image {
		position: absolute;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
	}

	.cover-container {
		--cover-badge-size: 3.6em;
		position: relative;
		flex: none;
		width: 14em;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		z-index: 1;
	}

	.pl-cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background-color: #222;
	}

	.cover-button {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		cursor: pointer;
	}

	.cover-overlay {
		position: absolute;
		inset: auto 0 0 0;
		padding: 0.4em;
		font-size: 0.85em;
		color: white;
		background-color: rgba(0, 0, 0, 0.6);
		opacity: 0;
		transition: opacity 0.15s;
	}

	.cover-button:hover .cover-overlay {
		opacity: 1;
	}

	.main-container {
		display: flex;
		flex: 1;
		min-width: 0;
		min-height: 14em;
	}

	.header-container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		flex: 1;
		min-width: 0;
	}

	.header-top-part,
	.header-bottom-part {
		z-index: 1;
	}

	.header-middle-part {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		flex: 1;
		z-index: 1;
		padding: 0.5em 0 0.7em;
	}

	.pl-title-line {
		margin: 0 0 0.2em -0.05em;
		color: inherit !important;
		text-transform: none;
		letter-spacing: normal;
		line-height: 1.2;
		word-break: break-word;
	}

	.pl-name {
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent) !important;
		font-weight: 600;
	}

	.name-long {
		font-size: 1.2em;
	}

	.name-short {
		font-size: 1.8em;
	}

	.title-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35em;
	}

	.owner-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.3em 0.5em 0.3em 0.3em;
		border-radius: 0.6em;
		color: white !important;
		background-color: #20202073;
	}

	.owner-pill:hover {
		background-color: #474747a1;
	}

	.owner-pill img {
		width: 1.45em;
		aspect-ratio: 1;
		border-radius: 100%;
	}

	.status-and-type {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.status-and-type :global(.badge) {
		margin: 0 !important;
	}

	.pl-follow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em 0.8em;
		font-size: 0.85em;
	}

	.follow-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.25em 0.6em;
		border-radius: 0.6em;
		color: #9fd3ff;
		background-color: #1f6fb233;
	}

	.follow-time {
		color: color-mix(in srgb, var(--textColor, white) 55%, transparent);
	}

	.follow-action {
		padding: 0;
		border: none;
		background: none;
		color: var(--beatleader-primary) !important;
		font-family: inherit;
		font-size: 1em;
		cursor: pointer;
	}

	.follow-action:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.pl-dates {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.9em;
		font-size: 0.85em;
		color: color-mix(in srgb, var(--textColor, white) 55%, transparent);
	}

	.pl-description {
		margin: 0;
		color: color-mix(in srgb, var(--textColor, white) 67%, transparent);
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 6em;
		overflow-y: auto;
	}

	.oneclick-note {
		margin: 0;
		font-size: 0.85em;
		color: #b388ff;
	}

	.icons-container {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		width: fit-content;
		transform: scale(1.15);
		transform-origin: left bottom;
	}

	.vote-link {
		display: block;
		text-align: center;
		margin-bottom: 0.5em;
	}

	.items-tab-container {
		--tab-line: var(--pl-accent);
		margin: 0 10px;
		display: flex;
	}

	.items-tab-container.votes-active {
		--tab-line: #7a4fd6;
	}

	.items-tab-spacer {
		flex: 1;
	}

	.items-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		padding: 0.5em 1.1em 0.6em;
		border: none;
		border-radius: 12px 12px 0 0;
		font-family: inherit;
		font-weight: 900;
		font-size: 0.85em;
		color: white;
		background-color: var(--pl-accent);
		cursor: pointer;
	}

	/* Centers the icons in the 1.3em box the global `button i` style from Button.svelte gives them */
	.items-tab i {
		line-height: 1.3em;
		text-align: center;
	}

	.items-tab + .items-tab {
		margin-left: 0.3em;
	}

	.votes-tab {
		background-color: #7a4fd6;
	}

	.items-tab.inactive {
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
		color: color-mix(in srgb, var(--textColor, white) 69%, transparent);
	}

	.items-tab.inactive:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 16%, transparent);
	}

	.tab-count {
		padding: 0 0.45em;
		border-radius: 1em;
		background-color: #00000040;
		font-weight: 600;
	}

	.items-box.votes-box {
		border-color: #7a4fd6;
	}

	.items-box {
		padding: 0.5em;
		margin: 0 10px 16px;
		border: 2px solid var(--pl-accent);
		border-radius: 0 12px 12px 12px;
		box-shadow: 0 2px 10px rgb(0 0 0 / 33%);
		background: rgb(26 26 26);
	}

	.items-nav {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0.1em 0.3em 0.4em;
		font-size: 0.8em;
	}

	.items-hint {
		margin-left: auto;
		opacity: 0.6;
	}

	.tools-button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.35em 0.8em;
		border: 1px solid color-mix(in srgb, var(--textColor, white) 15%, transparent);
		border-radius: 0.5em;
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
		color: color-mix(in srgb, var(--textColor, white) 87%, transparent);
		font-family: inherit;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}

	.tools-button:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 13%, transparent);
		border-color: color-mix(in srgb, var(--textColor, white) 25%, transparent);
	}

	.items-container {
		padding: 0.5em 0.6em 0.4em;
		border-radius: 8px;
	}

	@media screen and (max-width: 767px) {
		.leaderboard-header-box,
		.items-tab-container,
		.items-box {
			margin-inline: 0;
		}

		.pl-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.cinematics-canvas {
			width: 100%;
			transform: scaleY(1.2) translateZ(0);
		}

		.cover-container {
			--cover-badge-size: 2.8em;
			width: 10em;
		}

		.main-container {
			min-height: 0;
			width: 100%;
		}

		.title-container {
			align-items: center;
		}

		.status-and-type,
		.pl-dates {
			justify-content: center;
		}

		.icons-container {
			margin: 0 auto;
			transform: none;
		}
	}
</style>
