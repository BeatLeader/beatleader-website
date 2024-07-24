<script>
	import {getContext} from 'svelte';
	import createBeatSaverService from '../../services/beatmaps';
	import createPlaylistStore from '../../stores/playlists';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import beatSaverSvg from '../../resources/beatsaver.svg';
	import Button from '../Common/Button.svelte';
	import Preview from '../Common/Preview.svelte';
	import {capitalize, opt} from '../../utils/js';
	import {BL_API_URL, BL_REPLAYS_URL} from '../../network/queues/beatleader/api-queue';
	import PinIcon from '../Player/PinIcon.svelte';
	import ScoreActionButtonsLayout from './ScoreActionButtonsLayout.svelte';
	import {getNotificationsContext} from 'svelte-notifications';

	export let layoutType = 'flat';
	export let song;
	export let diffInfo = null;
	export let twitchUrl = null;
	export let icons = false;
	export let scoreId = null;
	export let replayLink = null;
	export let mapCheck = false;
	export let serviceIcon = null;
	export let noPin = false;
	export let altReplay = false;

	export let battleRoyaleDraft = false;
	export let batleRoyale = false;

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800 || $configStore.preferences.linkOption == 'newtab') {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink: previewLink});
		}
	};
	const {addNotification} = getNotificationsContext();

	let hash;
	let songKey;
	let songName;
	let levelAuthorName;
	let shownIcons;

	function updateIcons(icons) {
		shownIcons = icons ? icons : ['playlist', 'bsr', 'bs', 'preview', 'replay', 'oneclick', 'twitch', 'delete', 'pin'];
		if (mapCheck) {
			shownIcons.push('mapcheck');
		}
		if (batleRoyale) {
			shownIcons.push('batleRoyale');
		}
	}

	let beatSaverService = createBeatSaverService();
	const account = createAccountStore();
	const playlists = createPlaylistStore();

	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	function updateSongKey(song) {
		if (!song) {
			songKey = null;
			return;
		}

		if (song.id) {
			hash = song.hash;
			songKey = song.id.replaceAll('x', '');
			songName = song.name;
			levelAuthorName = song.mapper;
		}
	}

	function getSongInfo() {
		return {
			hash,
			songName,
			difficulties: [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}],
			levelAuthorName,
		};
	}

	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}
	function copyBsr() {
		var dummy = document.createElement('input');
		var text = '!bsr ' + songKey;

		document.body.appendChild(dummy);
		dummy.value = text;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);

		successToast(text + ' Copied to Clipboard!');
	}

	function webPlayerLink(replayLink, scoreId, webPlayer) {
		if (webPlayer == 'arcviewer') {
			if (replayLink?.length) {
				return `https://allpoland.github.io/ArcViewer/?replayURL=${replayLink}`;
			} else if (scoreId) {
				return `https://allpoland.github.io/ArcViewer/?scoreID=${scoreId}`;
			}
		} else {
			if (replayLink?.length) {
				return `${BL_REPLAYS_URL}?link=${replayLink}`;
			} else if (scoreId) {
				return `${BL_REPLAYS_URL}?scoreId=${scoreId}`;
			}
		}
		return null;
	}

	$: updateIcons(icons);
	$: updateSongKey(song);
	$: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : '';
	$: charName = diffInfo && diffInfo.type ? diffInfo.type : '';

	$: selectedPlaylistIndex = opt($configStore, 'selectedPlaylist');
	$: selectedPlaylist = $playlists[selectedPlaylistIndex];
	$: playlistSongs = selectedPlaylist?.songs?.filter(el => el.hash == hash);
	$: playlistSong = playlistSongs?.length ? playlistSongs[0] : null;

	$: playlistEntries = playlistSong?.difficulties?.map(el => capitalize(el.name) + el.characteristic);
	$: playlistKey = diffName + charName;

	$: oneclickToPlaylist = $configStore?.preferences?.oneclick == 'playlist';
	$: ocPlaylistIndex = oneclickToPlaylist ? $playlists.findIndex(p => p.oneclick) : null;
	$: ocPlaylist = ocPlaylistIndex != null ? $playlists[ocPlaylistIndex] : null;
	$: ocplaylistSongs = ocPlaylist?.songs?.filter(el => el.hash == hash);
	$: ocplaylistSong = ocplaylistSongs?.length ? ocplaylistSongs[0] : null;
	$: ocdifficulties = ocplaylistSong?.difficulties?.map(el => capitalize(el.name) + el.characteristic);

	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: replayUrl = webPlayerLink(replayLink, scoreId, $configStore.preferences.webPlayer);
	$: previewUrl = `https://allpoland.github.io/ArcViewer/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${
		charName ? `&mode=${charName}` : ''
	}`;
</script>

<ScoreActionButtonsLayout type={layoutType}>
	<span slot="special_buttons">
		{#if shownIcons.includes('delete') && isAdmin && scoreId}
			<Button
				iconFa="fas fa-trash-alt"
				title="Delete score"
				noMargin={true}
				type="danger"
				animated={true}
				on:click={() =>
					fetch(BL_API_URL + `score/${scoreId}`, {
						method: 'DELETE',
						credentials: 'include',
					})} />
		{/if}
		{#if !noPin && shownIcons.includes('pin')}
			<PinIcon {scoreId} on:score-pinned />
		{/if}
	</span>

	<span slot="default_buttons">
		{#if shownIcons.includes('pin-service') && serviceIcon?.link?.length && serviceIcon?.linkServiceIcon?.length}
			<Button
				icon={`<i class="service-icon" style="width: 1.2em;height: 1.2em;"><img src="${serviceIcon.linkServiceIcon}" /></i>`}
				url={serviceIcon.link}
				urltarget="_blank"
				onlyurl={true}
				animated={true}
				noMargin={true} />
		{/if}

		{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
			<a class="video" href={twitchUrl} target="_blank" rel="noreferrer">
				<Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" animated={true} noMargin={true} />
			</a>
		{/if}

		{#if songKey && songKey.length}
			{#if shownIcons.includes('playlist')}
				{#if selectedPlaylist != null}
					{#if playlistSong}
						{#if playlistEntries.length == 1 && playlistEntries[0] == playlistKey}
							<Button
								iconFa="fas fa-list-ul"
								title="Remove from the {selectedPlaylist.playlistTitle}"
								animated={true}
								noMargin={true}
								type="danger"
								on:click={() => playlists.remove(hash)} />
						{:else if playlistEntries.length == 1 || !playlistEntries.includes(playlistKey)}
							<Button
								iconFa="fas fa-list-ul"
								title="Add this diff to the {selectedPlaylist.playlistTitle}"
								animated={true}
								noMargin={true}
								on:click={() => playlists.addDiff(hash, diffInfo)} />
						{:else}
							<Button
								iconFa="fas fa-list-ul"
								title="Remove this diff from the {selectedPlaylist.playlistTitle}"
								animated={true}
								noMargin={true}
								type="lessdanger"
								on:click={() => playlists.removeDiff(hash, diffInfo)} />
						{/if}
					{:else}
						<Button
							iconFa="fas fa-list-ul"
							title="Add to the {selectedPlaylist.playlistTitle}"
							animated={true}
							noMargin={true}
							on:click={() => {
								playlists.add(getSongInfo());
							}} />
					{/if}
				{:else}
					<Button
						iconFa="fas fa-list-ul"
						title="Create new playlist with this song"
						animated={true}
						noMargin={true}
						on:click={() => playlists.create(getSongInfo())} />
				{/if}
			{/if}

			{#if shownIcons.includes('bsr')}
				<Button iconFa="fas fa-exclamation" title="Copy !bsr" animated={true} noMargin={true} on:click={() => copyBsr()} />
			{/if}

			{#if shownIcons.includes('bs')}
				<Button
					url="https://beatsaver.com/maps/{songKey}"
					urltarget="_blank"
					onlyurl={true}
					icon={beatSaverSvg}
					title="Go to Beat Saver"
					animated={true}
					noMargin={true} />
			{/if}

			{#if shownIcons.includes('mapcheck')}
				<Button
					url="https://kivalevan.me/BeatSaber-MapCheck/?id={songKey}"
					urltarget="_blank"
					onlyurl={true}
					iconFa="fas fa-magnifying-glass-location"
					title="Check the map"
					animated={true}
					noMargin={true} />
			{/if}

			{#if shownIcons.includes('oneclick')}
				{#if oneclickToPlaylist && ocPlaylist != null}
					{#if ocplaylistSong}
						{#if ocdifficulties.length == 1 && ocdifficulties[0] == playlistKey}
							<Button
								iconFa="fas fa-hand-pointer"
								title="Remove from the One-Click playlist"
								animated={true}
								noMargin={true}
								type="danger"
								on:click={() => playlists.remove(hash, ocPlaylistIndex)} />
						{:else if ocdifficulties.length == 1 || !ocdifficulties.includes(playlistKey)}
							<Button
								iconFa="fas fa-hand-pointer"
								title="Add this diff to the One-Click playlist"
								animated={true}
								noMargin={true}
								on:click={() => playlists.addDiff(hash, diffInfo, ocPlaylistIndex)} />
						{:else}
							<Button
								iconFa="fas fa-hand-pointer"
								title="Remove this diff from the One-Click playlist"
								animated={true}
								noMargin={true}
								type="lessdanger"
								on:click={() => playlists.removeDiff(hash, diffInfo, ocPlaylistIndex)} />
						{/if}
					{:else}
						<Button
							iconFa="fas fa-hand-pointer"
							title="Add to the One-Click playlist"
							type="purple"
							animated={true}
							noMargin={true}
							on:click={() => playlists.add(getSongInfo(), ocPlaylistIndex)} />
					{/if}
				{:else}
					<a href="beatsaver://{songKey}">
						<Button iconFa="far fa-hand-pointer" title="One click install" animated={true} noMargin={true} />
					</a>
				{/if}
			{/if}

			{#if shownIcons.includes('preview')}
				<Button
					url={previewUrl}
					on:click={() => showPreview(previewUrl)}
					iconFa="fa fa-play-circle"
					title="Map preview"
					animated={true}
					noMargin={true} />
			{/if}
		{/if}

		{#if shownIcons.includes('replay') && replayUrl?.length}
			<Button
				url={replayUrl}
				on:click={() => showPreview(replayUrl)}
				cls={altReplay ? 'replay-button-alt' : 'replay-button'}
				icon="<img src='/assets/{altReplay ? `replays.svg` : `bs-pepe.gif`}'>"
				title="Replay"
				animated={true}
				noMargin={true} />
		{/if}

		{#if shownIcons.includes('batleRoyale')}
			<Button
				icon="<div class='battleroyale{battleRoyaleDraft ? 'stop' : ''}-icon'></div>"
				title="{battleRoyaleDraft ? 'Stop' : 'Start'} drafting battle royal"
				noMargin={true}
				animated={true}
				on:click={() => (battleRoyaleDraft = !battleRoyaleDraft)} />
		{/if}
	</span>
</ScoreActionButtonsLayout>

<style>
	:global(i.rotate) {
		transform: rotateZ(45deg);
	}

	:global(.replay-button-alt) {
		--btn-bg-color: transparent !important;
		margin-left: 0.3em !important;
	}
</style>
