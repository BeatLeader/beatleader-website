<script>
    export let song;
</script>

{#if song}
    <a href="">
        <slot song={song}>
            {song.songAuthor} - {song.name}
        </slot>
    </a>
{/if}