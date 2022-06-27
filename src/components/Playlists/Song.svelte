<script>
    import {BS_CDN} from '../../network/queues/beatleader/page-queue'
    import Button from "../Common/Button.svelte";

    const DEFAULT_IMG = '/assets/song-default.png';

    export let song;
    export let songId;
    export let listId;
    export let store;

    $: hash = song?.hash;
    $: difficulties = song?.difficulties;
    $: ssCoverUrl = song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash)}.jpg` : null);
    $: coverUrl = ssCoverUrl;
</script>

<div class="container">
    <img class="cover" src={coverUrl} alt=""/>
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