<script>
    import { getContext } from 'svelte';
    import createBeatSaverService from '../../services/beatmaps'
    import createPlaylistStore from '../../stores/playlists'
    import {configStore} from '../../stores/config'
    import {copyToClipboard} from '../../utils/clipboard';
    import beatSaverSvg from "../../resources/beatsaver.svg";
    import Button from "../Common/Button.svelte";
    import Preview from "../Common/Preview.svelte";
    import {capitalize, opt} from '../../utils/js';

    export let hash;
    export let diffInfo = null;
    export let twitchUrl = null;
    export let replayLink = null;
    export let icons = false;
    const { open } = getContext('simple-modal');
    const showPreview = (previewLink) => {
        open(Preview, { previewLink: previewLink });
    };

    let songKey;
    let songInfo;
    let shownIcons = icons ? icons : ["playlist", "bsr", "bs", "preview", "replay", "oneclick", "twitch"];

    let beatSaverService = createBeatSaverService();
    const playlists = createPlaylistStore();

    function decapitalizeFirstLetter(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    async function updateSongKey(hash) {
        if (!hash) {
            songKey = null;
            return;
        }

        const songInfoValue = await beatSaverService.byHash(hash);
        if (songInfoValue && songInfoValue.key) {
            songKey = songInfoValue.key;
            songInfo = {
                hash,
                songName: songInfoValue.name,
                difficulties: [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}],
                levelAuthorName: songInfoValue.uploader.name
            }
        }
    }

    $: updateSongKey(hash)
    $: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : null
    $: charName = diffInfo && diffInfo.type ? diffInfo.type : null
    $: selectedPlaylistIndex = opt($configStore, 'selectedPlaylist');
    $: selectedPlaylist = $playlists[selectedPlaylistIndex];
    $: playlistSongs = selectedPlaylist?.songs?.filter(el => el.hash == hash);
    $: playlistSong = playlistSongs?.length ? playlistSongs[0] : null;
    $: difficulties = playlistSong?.difficulties?.map(el => capitalize(el.name));
</script>

{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
    <a class="video" href="{twitchUrl}" target="_blank" rel="noreferrer">
        <Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" noMargin={true}/>
    </a>
{/if}

{#if songKey && songKey.length}
    {#if shownIcons.includes('playlist')}
        {#if selectedPlaylist != null}
            {#if playlistSong}
                {#if difficulties.length == 1 && difficulties[0] == diffName}
                <Button iconFa="fas fa-list-ul" title="Remove from the {selectedPlaylist.playlistTitle}" noMargin={true} type="danger"
                on:click={playlists.remove(hash)}/>
                {:else}
                {#if difficulties.length == 1 || !difficulties.includes(diffName)}
                <Button iconFa="fas fa-list-ul" title="Add this diff to the {selectedPlaylist.playlistTitle}" noMargin={true}
                on:click={playlists.addDiff(hash, diffInfo)}/>
                {:else}
                <Button iconFa="fas fa-list-ul" title="Remove this diff from the {selectedPlaylist.playlistTitle}" noMargin={true} type="lessdanger"
                on:click={playlists.removeDiff(hash, diffInfo)}/>
                {/if}
                {/if}
            {:else}
            <Button iconFa="fas fa-list-ul" title="Add to the {selectedPlaylist.playlistTitle}" noMargin={true}
            on:click={playlists.add(songInfo)}/>
            {/if}
        {:else}
        <Button iconFa="fas fa-list-ul" title="Create new playlist with this song" noMargin={true}
        on:click={playlists.create(songInfo)}/>
        {/if}

    {/if}
    {#if shownIcons.includes('bsr')}
        <Button iconFa="fas fa-exclamation" title="Copy !bsr" noMargin={true}
                on:click={copyToClipboard('!bsr ' + songKey)}/>
    {/if}

    {#if shownIcons.includes('bs')}
        <a href="https://beatsaver.com/maps/{songKey}" target="_blank" rel="noreferrer">
            <Button icon={beatSaverSvg} title="Go to Beat Saver" noMargin={true}/>
        </a>
    {/if}

    {#if shownIcons.includes('oneclick')}
        <a href="beatsaver://{songKey}">
            <Button iconFa="far fa-hand-pointer" title="One click install" noMargin={true}/>
        </a>
    {/if}

    {#if shownIcons.includes('preview')}
        <a href={`https://skystudioapps.com/bs-viewer/?id=${songKey}${diffName ? `&diffName=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`} target="_blank" rel="noreferrer" on:click={(e) => {e.preventDefault();}}>
            <Button on:click={showPreview(`https://skystudioapps.com/bs-viewer/?id=${songKey}${diffName ? `&diffName=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`)} iconFa="fa fa-play-circle" title="Map preview" noMargin={true}/>
        </a>
    {/if}

    {#if shownIcons.includes('replay') && replayLink}
        <a href={`https://www.replay.beatleader.xyz?link=${replayLink}`} target="_blank" rel="noreferrer" on:click={(e) => {e.preventDefault();}}>
            <Button cls="{shownIcons.length == 1 ? 'replay-button-alt' : 'replay-button'}" on:click={showPreview(`https://www.replay.beatleader.xyz?link=${replayLink}`)} icon="<div class='{shownIcons.length == 1 ? "replay-icon-alt" : "replay-icon"}'></div>" title="Replay" noMargin={true}/>
        </a>
    {/if}
{/if}

<style>
    :global(.replay-button-alt) {
        --bg-color: transparent !important;
    }
</style>