<script>
    import { getContext } from 'svelte';
    import createBeatSaverService from '../../services/beatmaps'
    import {copyToClipboard} from '../../utils/clipboard';
    import beatSaverSvg from "../../resources/beatsaver.svg";
    import Button from "../Common/Button.svelte";
    import Preview from "../Common/Preview.svelte";
    import {capitalize} from '../../utils/js'

    export let hash;
    export let diffInfo = null;
    export let twitchUrl = null;
    export let playerId = null;
    export let hasReplay = false;
    const { open } = getContext('simple-modal');
    const showPreview = (previewLink) => {
        open(Preview, { previewLink: previewLink });
    };

    let songKey;
    let shownIcons = ["bsr", "bs", "preview", "oneclick", "twitch"];

    let beatSaverService = createBeatSaverService();

    async function updateSongKey(hash) {
        if (!hash) {
            songKey = null;
            return;
        }

        const songInfo = await beatSaverService.byHash(hash);
        if (songInfo && songInfo.key) {
            songKey = songInfo.key;
        }
    }

    $: updateSongKey(hash)
    $: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : null
    $: charName = diffInfo && diffInfo.type ? diffInfo.type : null
</script>

{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
    <a class="video" href="{twitchUrl}" target="_blank" rel="noreferrer">
        <Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" noMargin={true}/>
    </a>
{/if}

{#if songKey && songKey.length}
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
        {#if playerId && hasReplay}
        <a href={`https://www.replay.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${charName ? `&playerID=${playerId}` : ''}`} target="_blank" rel="noreferrer" on:click={(e) => {e.preventDefault();}}>
            <Button on:click={showPreview(`https://www.replay.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${charName ? `&playerID=${playerId}` : ''}`)} icon="<div class='replay-icon'></div>" title="Replay" noMargin={true}/>
        </a>
        {/if}
        {#if !playerId || !hasReplay}
        <a href={`https://www.preview.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`} target="_blank" rel="noreferrer" on:click={(e) => {e.preventDefault();}}>
            <Button on:click={showPreview(`https://www.preview.beatleader.xyz/?id=${songKey}${diffName ? `&difficulty=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`)} iconFa="fa fa-play-circle" title="Map preview" noMargin={true}/>
        </a>
        {/if}
    {/if}
{/if}
