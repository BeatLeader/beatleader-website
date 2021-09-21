<script>
  import {fade} from 'svelte/transition'
  import {dateFromString} from '../../utils/date'
  import FormattedDate from '../Common/FormattedDate.svelte'

  export let videos = null;
</script>

{#if videos && videos.length}
<section transition:fade>
  <h3 class="title is-6"><i class="fab fa-twitch"></i> Twitch VODs</h3>

    <div class="videos">
      <span>Date</span>
      <span>Video</span>
      <span>Duration</span>

      {#each videos as video}
        <span><FormattedDate date={dateFromString(video.created_at)} /></span>

        <a href={video.url} target="_blank" rel="noopener">{video.title}</a>

        <span>{video.duration}</span>
      {/each}
    </div>
</section>
{/if}

<style>
    section {
        width: 100%;
        padding: .5em;
        font-size: .875em;
    }

    h3 {
        padding: .25em;
        margin-bottom: .75em !important;
    }

    h3 i {
        margin-right: .25em;
        padding: .25em;
        color: white;
        background-color: #9146ff;
    }

    .videos {
        display: inline-grid;
        grid-template-columns: auto 1fr auto;
        grid-row-gap: .25em;
    }

    .videos :global(> *) {
        border-bottom: 1px solid var(--dimmed);
        padding: .125em .25em;
    }
</style>