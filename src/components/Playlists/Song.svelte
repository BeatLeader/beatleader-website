<script>
    import {BL_CDN} from '../../network/queues/scoresaber/page-queue'
    import createBeatSaverService from '../../services/beatmaps'
    import Button from "../Common/Button.svelte";
    import Difficulty from '../Song/Difficulty.svelte'

    const DEFAULT_IMG = '/assets/song-default.png';

    export let song;
    export let songId;
    export let listId;
    export let store;

    let beatSaverService = createBeatSaverService();

    let songInfo;
    let showDiffIcons;

    function decapitalizeFirstLetter(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    async function updateSongKey(hash) {
        const songInfoValue = await beatSaverService.byHash(hash);
        if (songInfoValue && songInfoValue.key) {
            songInfo = songInfoValue;
            showDiffIcons = songInfo.versions[0].diffs.some(el => el.characteristic != 'Standard');
        }
    }

    function toggleDifficulty(diff) {
        const index = difficulties.findIndex(el => decapitalizeFirstLetter(diff.difficulty) == el.name && diff.characteristic == el.characteristic);
        if (index == -1) {
            difficulties.push({
                name: decapitalizeFirstLetter(diff.difficulty), 
                characteristic: diff.characteristic
            })
        } else {
            difficulties.splice(index, 1);
        }

        difficulties = difficulties;
        store.set($store);
    }

    $: hash = song.hash;
    $: difficulties = song.difficulties;
    $: updateSongKey(hash);
    $: ssCoverUrl = hash ? `${BL_CDN}/covers/${encodeURIComponent(hash).toUpperCase()}.png` : null;
    $: coverUrl = ssCoverUrl;
</script>

<div class="container">
    <img class="cover" src={coverUrl} alt=""/>
    {#if songInfo}
    <div style="display: grid; padding-left: 1em">
        <span class="name">{songInfo.name}</span>
        <div class="author">{songInfo.uploader.name} </div>
        <div style="display: inline;">
            {#each songInfo.versions[0].diffs as diff, songId}
            <Difficulty diff={{type: diff.characteristic, diff: diff.difficulty, stars: diff.stars}} pointer={true} useShortName={true} reverseColors={true} {showDiffIcons} enabled={difficulties.some(el => el.name == decapitalizeFirstLetter(diff.difficulty) && el.characteristic == diff.characteristic)} on:click={() => toggleDifficulty(diff)} />
            {/each}
        </div>
    </div>
    {/if}
    <Button cls="delistSong" iconFa="fas fa-list-ul" title="Remove from the {$store[listId].playlistTitle}" noMargin={true} type="danger"
            on:click={store.remove(hash, listId)}/>
</div>

<style>
.container {
    display: flex;
    margin: 1.5em;
    border-radius: 1em;
    padding: 0.8em;
    background-color: rgba(87, 87, 87, 0.582);
}

.cover {
    width: 6em;
    height: 6em;
    border-radius: 0.5em;
}

:global(.delistSong) {
    position: absolute !important;
    right: 0.8em;
    border-radius: 0.5em !important;
}
</style>