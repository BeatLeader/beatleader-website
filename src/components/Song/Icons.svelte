<script>
    import createBeatSaverService from '../../services/beatmaps'
    import {copyToClipboard} from '../../utils/clipboard';
    import beatSaverSvg from "../../resources/beatsaver.svg";
    import Button from "../Common/Button.svelte";
    import {capitalize} from '../../utils/js'

    export let hash;
    export let diffInfo = null;
    export let twitchUrl = null;

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
    <a class="video" href="{twitchUrl}" target="_blank">
        <Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview"/>
    </a>
{/if}

{#if songKey && songKey.length}
    {#if shownIcons.includes('bsr')}
        <Button iconFa="fas fa-exclamation" title="Copy !bsr"
                on:click={copyToClipboard('!bsr ' + songKey)}/>
    {/if}

    {#if shownIcons.includes('bs')}
        <a href="https://beatsaver.com/beatmap/{songKey}" target="_blank">
            <Button icon={beatSaverSvg} title="Go to Beat Saver"/>
        </a>
    {/if}

    {#if shownIcons.includes('oneclick')}
        <a href="beatsaver://{songKey}">
            <Button iconFa="far fa-hand-pointer" title="One click install"/>
        </a>
    {/if}

    {#if shownIcons.includes('preview')}
        <a href={`https://skystudioapps.com/bs-viewer/?id=${songKey}${diffName ? `&diffName=${diffName}` : ''}${charName ? `&charName=${charName}` : ''}`} target="_blank">
            <Button iconFa="fa fa-play-circle" title="Map preview"/>
        </a>
    {/if}
{/if}
