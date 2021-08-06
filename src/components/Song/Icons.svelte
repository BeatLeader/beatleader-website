<script>
    import createBeatSaverService from '../../services/beatmaps'
    import {copyToClipboard} from '../../utils/clipboard';
    import beatSaverSvg from "../../resources/beatsaver.svg";
    import Button from "../Common/Button.svelte";

    export let hash;

    let songKey;
    let shownIcons = ["bsr", "bs", "preview", "oneclick"];

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
</script>

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
        <a href="https://skystudioapps.com/bs-viewer/?id={songKey}" target="_blank">
            <Button iconFa="fa fa-play-circle" title="Map preview"/>
        </a>
    {/if}
{/if}
