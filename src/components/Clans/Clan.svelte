<script>
    import {fade, fly, slide} from 'svelte/transition'
    import Button from "../Common/Button.svelte";

    export let clan;
    export let idx;

    let detailsOpened = false;
    function onDetailsButtonClick() {
        detailsOpened = !detailsOpened;
    }
</script>

{#if clan}
    <div class={`song-score row-${idx}`}
       in:fly={{x: 300, delay: idx * 30, duration:500}} out:fade={{duration:100}}
       class:with-details={detailsOpened}>
       
       <div class="playlistInfo">
        <td class="col--details-btn">
            <Button type="text" iconFa={detailsOpened ? "fas fa-chevron-down" : "fas fa-chevron-right"}
                on:click={() => onDetailsButtonClick()} />
       </td>
        <img class="playlistImage" src="{clan.icon}" alt="PlaylistImage"/>

        <div class="titleAndButtons">

            <div style="display: grid; width: 90%;">
                <span class="playlistTitle">{clan.name}</span>
                <span style={"color: " + clan.color} class="playlistTitle">[{clan.tag}]</span>
                
                <span class="songs">{clan.playersCount} players</span>
            </div>
        </div>
        </div>
        
    </div>
{/if}

<style>
    .song-score {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
        width: 100%;
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