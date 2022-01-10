<script>
    import {fade, fly, slide} from 'svelte/transition'
    import Button from "../Common/Button.svelte";
    import Song from "./Song.svelte";

    export let playlist;
    export let idx;
    export let store;

    let fileinput;
    const changeImage = (e) => {
        let image = e.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = e => {
            playlist.image = e.target.result;
            store.set($store);
        };
    }

    let detailsOpened = false;
    function onDetailsButtonClick() {
        detailsOpened = !detailsOpened;
    }

    let titleInput;
    let redactingTitle = false;
    function onRedactButtonClick() {
        if (redactingTitle && titleInput.value) {
            playlist.playlistTitle = titleInput.value;
            store.set($store);
        }
        redactingTitle = !redactingTitle;
    }

    $:songs = playlist.songs;
</script>

{#if playlist}
    <div class={`song-score row-${idx}`}
       in:fly={{x: 300, delay: idx * 30, duration:500}} out:fade={{duration:100}}
       class:with-details={detailsOpened}>
       
       <div class="playlistInfo">
        <td class="col--details-btn">
            <Button type="text" iconFa={detailsOpened ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                on:click={() => onDetailsButtonClick()} />
       </td>
        <div class="imageInput" on:click={() => fileinput.click()}>
            <img class="playlistImage" src="{playlist.image}" alt="PlaylistImage"/>
            <input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>changeImage(e)} bind:this={fileinput} >
            <span class="imageChange">
                <h3 class="changeLabel">Change</h3>
            </span>
        </div>

        <div class="titleAndButtons">

            <div style="display: grid; width: 90%;">
                <div style="display: flex;">
                    <span class="playlistTitle" style="display: {redactingTitle ? "none" : "block"};">{playlist.playlistTitle}</span>
                    <input type="text" style="display: {redactingTitle ? "block" : "none"};" value="{playlist.playlistTitle}" placeholder="Playlist name" class="input-reset" bind:this={titleInput}>
                    <Button type="text" cls="editTitleButton" iconFa={redactingTitle ? "fas fa-check" : "fas fa-edit"}
                        on:click={() => onRedactButtonClick()} />
                </div>
                
                <span class="songs">{playlist.songs.length} songs</span>
            </div>

            <div>
                <Button iconFa="fas fa-trash-alt" title="Delete playlist" noMargin={true} type="danger"
                    on:click={store.deleteList(idx)}/>
                <Button iconFa="fas fa-download" title="Download playlist" noMargin={true} type="primary"
                    on:click={store.download(idx)}/>
            </div>

        </div>
        
        </div>

        {#if detailsOpened}
        <div class="tab">
            {#each songs as song, songId}
            <Song {song} {songId} listId={idx} {store} />
            {/each}
        </div>
        {/if}
        
    </div>
{/if}

<style>
    .song-score {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
    }

    .playlistInfo {
        display: flex;
    }

    .playlistTitle {
        display: block;
        max-width: 80%;
        overflow: hidden;
        max-height: 80%;
    }

    .titleAndButtons {
        display: flex;
        justify-content: space-between;
        font-size: 1.1em;
        font-weight: 500;
        width: 90%;
        margin: 1em;
    }

    :global(.editTitleButton) {
        padding-bottom: 1.4em !important;
        padding-left: 0.6em !important;
    }

    .song-score .icons.up-to-tablet + .main {
      padding-top: 0;
    }

    .song-score .main {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-evenly;
        align-items: center;
    }

    .song-score.with-details .main {
        border-bottom: none;
    }

    .song-score .main > * {
        margin-right: 1em;
    }

    .song-score .main > *:last-child {
        margin-right: 0;
    }

    .song-score .main :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 100%;
    }

    .song-score .main :global(.badge small) {
        font-size: .7em;
        font-weight: normal;
        margin-top: -2px;
    }

    .song-score .main :global(.inc), .song-score :global(.dec) {
        color: inherit;
    }

    .imageInput {
        cursor: pointer;
        display: flex;
        position: relative;
    }

    .playlistImage {
        width: 10em;
    }

    .imageChange {
        transition: opacity .2s ease-in-out;
        background-color: rgba(32,33,36,0.6);
        bottom: 0;
        height: 33%;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        display: flex;
        justify-content: center;
    }

    .imageInput:hover .imageChange {
        opacity: 1;
    }

    .changeLabel {
        top: 30%;
        position: absolute;
    }
</style>