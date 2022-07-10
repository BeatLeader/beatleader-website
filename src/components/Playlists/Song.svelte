<script>
    import {BS_CDN} from '../../network/queues/beatleader/page-queue'
    import Difficulty from '../Song/Difficulty.svelte'
    import Button from "../Common/Button.svelte";
    import {capitalize, decapitalize} from '../../utils/js'

    export let song;
    export let songId;
    export let listId;
    export let store;

    let showDiffIcons;
    let diffs;

    function toggleDifficulty(diff) {
        if (!diff || !$store?.[listId]?.songs?.[songId]?.difficulties) return;

        const existingDiff = difficulties.find(el => capitalize(el.name) === diff.name && el.characteristic === diff.characteristic);

        if (existingDiff) {
            $store[listId].songs[songId].difficulties = $store[listId].songs[songId].difficulties.filter(d => d !== existingDiff);
        } else {
            $store[listId].songs[songId].difficulties = [...$store[listId].songs[songId].difficulties, {name: decapitalize(diff.name), characteristic: diff.characteristic}];
        }
    }

    $: hash = song?.hash;
    $: difficulties = song?.difficulties ?? [];
    $: diffs = song?.allDiffs ?? [];
    $: ssCoverUrl = song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash)}.jpg` : null);
    $: coverUrl = ssCoverUrl;
</script>

<div class="container">
    <img class="cover" src={coverUrl} alt=""/>
    <div style="display: grid; padding-left: 1em">
        <span class="name">{song?.songName}</span>
        <div class="author">{song.levelAuthorName} </div>
        {#if diffs?.length}
            <div style="display: inline;">
                {#each diffs as diff}
                    <Difficulty diff={{type: diff.characteristic, diff: diff.name}} pointer={true}
                                useShortName={true} reverseColors={true} {showDiffIcons}
                                enabled={difficulties.some(el => capitalize(el.name) === diff.name && el.characteristic === diff.characteristic)}
                                on:click={() => toggleDifficulty(diff)}/>
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