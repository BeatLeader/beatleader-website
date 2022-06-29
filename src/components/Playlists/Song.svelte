<script>
    import {BS_CDN} from '../../network/queues/beatleader/page-queue'
    import Difficulty from '../Song/Difficulty.svelte'
    import Button from "../Common/Button.svelte";

    const DEFAULT_IMG = '/assets/song-default.png';

    export let song;
    export let songId;
    export let listId;
    export let store;

    function decapitalizeFirstLetter(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    let showDiffIcons;
    let diffs;

    // async function updateSongKey(hash) {
    //     const songInfoValue = await beatSaverService.byHash(hash);
    //     if (songInfoValue && songInfoValue.key) {
    //         songInfo = songInfoValue;
    //         showDiffIcons = songInfo.versions[0].diffs.some(el => el.characteristic != 'Standard');
    //         diffs = songInfo.versions[0].diffs
    //     }
    // }
    //
    // function toggleDifficulty(diff) {
    //     const index = difficulties.findIndex(el => decapitalizeFirstLetter(diff.difficulty) == el.name && diff.characteristic == el.characteristic);
    //     if (index == -1) {
    //         difficulties.push({
    //             name: decapitalizeFirstLetter(diff.difficulty),
    //             characteristic: diff.characteristic
    //         })
    //     } else {
    //         difficulties.splice(index, 1);
    //     }
    //
    //     difficulties = difficulties;
    //     store.set($store);
    // }

    $: hash = song?.hash;
    $: difficulties = song?.difficulties ?? [];
    $: diffs = song?.allDiffs ?? [];
    $: ssCoverUrl = song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash)}.jpg` : null);
    $: coverUrl = ssCoverUrl;

    $: console.log(song, diffs)
</script>

<div class="container">
    <img class="cover" src={coverUrl} alt=""/>
    <div style="display: grid; padding-left: 1em">
        <span class="name">{song?.songName}</span>
        <div class="author">{song.levelAuthorName} </div>
        {#if diffs?.length}
            <div style="display: inline;">
                {#each diffs as diff, songId}
                    <Difficulty diff={{type: diff.characteristic, diff: diff.difficulty, stars: diff.stars}} pointer={true} useShortName={true} reverseColors={true} {showDiffIcons} enabled={difficulties.some(el => el.name == decapitalizeFirstLetter(diff.difficulty) && el.characteristic == diff.characteristic)} on:click={() => toggleDifficulty(diff)} />
                {/each}
            </div>
        {/if}
    </div>
    <Button cls="delistSong" iconFa="fas fa-list-ul" title="Remove from the {$store[listId].playlistTitle}" noMargin={true} type="danger"
            on:click={() => store.remove(hash, listId)}/>
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