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
    import {getHeadsetForHMD} from '../../utils/scoresaber/format'

    export let hash;
    export let diffInfo = null;
    export let twitchUrl = null;
    export let playerId = null;
    export let hasReplay = false;
    export let icons = false;
    export let jumpDistance = 0;
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
    $: selectedPlaylist = opt($configStore, 'selectedPlaylist');
</script>

{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
    <a class="video" href="{twitchUrl}" target="_blank" rel="noreferrer">
        <Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" noMargin={true}/>
    </a>
{/if}

{#if songKey && songKey.length}
    {#if shownIcons.includes('playlist')}
        {#if selectedPlaylist != null && $playlists[selectedPlaylist]}
            {#if $playlists[selectedPlaylist].songs.filter(el => el.hash == hash).length}
            <Button iconFa="fas fa-list-ul" title="Remove from the {$playlists[selectedPlaylist].playlistTitle}" noMargin={true} type="danger"
            on:click={playlists.remove(hash)}/>
            {:else}
            <Button iconFa="fas fa-list-ul" title="Add to the {$playlists[selectedPlaylist].playlistTitle}" noMargin={true}
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

    {#if shownIcons.includes('replay') && playerId && hasReplay}
        <a href={`https://www.replay.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${playerId ? `&playerID=${playerId}` : ''}${jumpDistance ? `&jd=${jumpDistance}` : ''}`} target="_blank" rel="noreferrer" on:click={(e) => {e.preventDefault();}}>
            <Button cls="{shownIcons.length == 1 ? 'replay-button-alt' : 'replay-button'}" on:click={showPreview(`https://www.replay.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${playerId ? `&playerID=${playerId}` : ''}${jumpDistance ? `&jd=${jumpDistance}` : ''}`)} icon="<div class='{"replay-icon-alt"}'></div>" title="Replay" noMargin={true}/>
        </a>
    {/if}
{/if}

<style>
    :global(.replay-button-alt) {
        --bg-color: transparent !important;
    }

    :global(.replay-button .icon .replay-icon-alt) {
        width: 120%;
        height: 120%;
        margin-left: -0.125em;
        margin-bottom: 0;
    }
</style>