<script>
    import { getContext } from 'svelte';
    import createPlaylistStore from '../../stores/playlists'
    import createAccountStore from '../../stores/beatleader/account'
    import {configStore} from '../../stores/config'
    import {copyToClipboard} from '../../utils/clipboard';
    import beatSaverSvg from "../../resources/beatsaver.svg";
    import Button from "../Common/Button.svelte";
    import Preview from "../Common/Preview.svelte";
    import {capitalize} from '../../utils/js';
    import {BL_API_URL} from '../../network/queues/beatleader/api-queue'

    export let leaderboard = null;
    export let twitchUrl = null;
    export let icons = false;
    export let scoreId = null;
    export let replayLink = null;
    const { open } = getContext('simple-modal');
    const showPreview = (previewLink) => {
        if (document.body.clientWidth < 800) {
            window.open(previewLink, '_blank');
        } else {
            open(Preview, { previewLink: previewLink });
        }
    };

    let songInfo;
    let shownIcons = icons ? icons : ["playlist", "bsr", "bs", "preview", "replay", "oneclick", "twitch", "delete"];

    const account = createAccountStore();
    const playlists = createPlaylistStore();

    $: key = leaderboard?.song?.id
    $: hash = leaderboard?.song.hash
    $: allDiffs = (leaderboard?.song?.difficulties ?? []).map(d => ({name: d?.difficultyName, characteristic: d?.modeName, id: d?.id}))
    $: diffInfo = leaderboard ? {diff: leaderboard?.difficulty?.difficultyName ?? '', type: leaderboard?.difficulty?.modeName ?? 'Standard'} : null
    $: songInfo = {hash, diffInfo, songName: leaderboard?.song?.name ?? '', levelAuthorName: leaderboard?.song?.levelAuthorName ?? leaderboard?.song?.mapper ?? '', allDiffs}

    $: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : null
    $: charName = diffInfo && diffInfo.type ? diffInfo.type : null
    $: selectedPlaylistIndex = $configStore?.selectedPlaylist;
    $: selectedPlaylist = $playlists[selectedPlaylistIndex];
    $: playlistSongs = selectedPlaylist?.songs?.filter(el => el?.hash && el.hash === hash);
    $: playlistSong = playlistSongs?.length ? playlistSongs[0] : null;
    $: difficulties = playlistSong?.difficulties?.map(el => capitalize(el.name));
    $: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes("admin")
    $: replayUrl = replayLink?.length
        ? `https://www.replay.beatleader.xyz/?link=${replayLink}`
        : (scoreId ? `https://www.replay.beatleader.xyz/?scoreId=${scoreId}` : null)
    $: previewUrl = `https://skystudioapps.com/bs-viewer/?id=${key}${diffName ? `&diffName=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`;
</script>

{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
    <a class="video" href="{twitchUrl}" target="_blank" rel="noreferrer">
        <Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" noMargin={true}/>
    </a>
{/if}

{#if key?.length}
    {#if shownIcons.includes('playlist')}
        {#if selectedPlaylist != null}
            {#if playlistSong}
                {#if difficulties?.length === 1 && difficulties?.[0] === diffName}
                <Button iconFa="fas fa-list-ul" title="Remove from the {selectedPlaylist.playlistTitle}" noMargin={true} type="danger"
                on:click={() => playlists.remove(hash)}/>
                {:else}
                {#if difficulties?.length === 1 || !difficulties?.includes(diffName)}
                <Button iconFa="fas fa-list-ul" title="Add this diff to the {selectedPlaylist.playlistTitle}" noMargin={true}
                on:click={() => playlists.addDiff(hash, diffInfo)}/>
                {:else}
                <Button iconFa="fas fa-list-ul" title="Remove this diff from the {selectedPlaylist.playlistTitle}" noMargin={true} type="lessdanger"
                on:click={() => playlists.removeDiff(hash, diffInfo)}/>
                {/if}
                {/if}
            {:else}
            <Button iconFa="fas fa-list-ul" title="Add to the {selectedPlaylist.playlistTitle}" noMargin={true}
            on:click={() => playlists.add(songInfo)}/>
            {/if}
        {:else}
        <Button iconFa="fas fa-list-ul" title="Create new playlist with this song" noMargin={true}
        on:click={() => playlists.create(songInfo)}/>
        {/if}

    {/if}
    {#if shownIcons.includes('bsr')}
        <Button iconFa="fas fa-exclamation" title="Copy !bsr" noMargin={true}
                on:click={() => copyToClipboard('!bsr ' + key)}/>
    {/if}

    {#if shownIcons.includes('bs')}
        <a href="https://beatsaver.com/maps/{key}" target="_blank" rel="noreferrer">
            <Button icon={beatSaverSvg} title="Go to Beat Saver" noMargin={true}/>
        </a>
    {/if}

    {#if shownIcons.includes('oneclick')}
        <a href="beatsaver://{key}">
            <Button iconFa="far fa-hand-pointer" title="One click install" noMargin={true}/>
        </a>
    {/if}

    {#if shownIcons.includes('preview')}
        <Button url={previewUrl} 
                on:click={() => showPreview(previewUrl)}
                iconFa="fa fa-play-circle" 
                title="Map preview" 
                noMargin={true}/>
    {/if}

    {#if shownIcons.includes('replay') && replayUrl?.length}
        <Button url={replayUrl} 
                on:click={() => showPreview(replayUrl)}
                cls="{shownIcons.length == 1 ? 'replay-button-alt' : 'replay-button'}"
                icon="<div class='{shownIcons.length == 1 ? `replay-icon-alt` : `replay-icon`}'></div>"
                title="Replay"
                noMargin={true}
        />
    {/if}

    {#if shownIcons.includes('delete') && isAdmin && scoreId}
        <Button iconFa="fas fa-trash-alt" title="Delete score" noMargin={true} type="danger"
        on:click={() => fetch(BL_API_URL + `score/${scoreId}`, {
        method: 'DELETE', 
        credentials: 'include'
      })}/>
    {/if} 
{/if}

<style>
    :global(.replay-button-alt) {
        --bg-color: transparent !important;
    }
</style>