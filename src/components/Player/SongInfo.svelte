<script>
  import {navigate} from 'svelte-routing'
  import {SS_HOST} from '../../network/queues/scoresaber/page-queue'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import {opt} from '../../utils/js'
  import Difficulty from '../Song/Difficulty.svelte'
  import Icons from '../Song/Icons.svelte'

  export let leaderboard = null;
  export let rank = null;
  export let hash = null;

  $: song = opt(leaderboard, 'song', null);
  $: page = rank && Number.isFinite(rank) ? Math.floor((rank - 1) / LEADERBOARD_SCORES_PER_PAGE) + 1 : 1;
</script>

{#if song}
  <section>
  <div class="cover-difficulty">
    <a on:click={navigate(`/leaderboard/global/${opt(leaderboard, 'leaderboardId', '')}/${page}`)}>
      <img src={`${SS_HOST}/imports/images/songs/${encodeURIComponent(song.hash)}.png`} alt=""/>
    </a>

    <div class="difficulty">
      <Difficulty diff={leaderboard.diffInfo} useShortName={true} reverseColors={true} stars={leaderboard.stars}/>
    </div>
  </div>

  <div class="songinfo">
    <a on:click={navigate(`/leaderboard/global/${opt(leaderboard, 'leaderboardId', '')}/${page}`)}>
      <span class="name">{song.name} {song.subName}</span>
      <div class="author">{song.authorName} <small>{song.levelAuthorName}</small></div>
    </a>
  </div>

  {#if hash && hash.length}
    <div class="icons desktop-and-up">
      <Icons {hash}/>
    </div>
  {/if}
  </section>
{/if}

<style>
    section {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    section > * {
        margin-right: .75em;
    }

    .cover-difficulty {
        position: relative;
        min-width: 4em;
        width: 4em;
    }

    .difficulty {
        display: flex;
        align-items: center;
        position: absolute;
        bottom: 1em;
        right: 0em;
        font-size: .75em;
    }

    img {
        width: 3.5em;
        height: 3.5em;
        border-radius: 15%;
    }

    .songinfo {
        text-align: left;
        font-size: .95rem;
        font-weight: 500;
        flex-grow: 1;
    }

    .songinfo {
        color: var(--alternate);
    }

    .songinfo small {
        font-size: 0.75em;
        color: var(--ppColour);
    }

    .icons {
        font-size: .5em;
        min-width: 4.66em;
        width: 4.66em;
        margin-right: 0;
        align-self: flex-end;
    }

    .icons:empty {
        margin-bottom: 0;
    }
</style>