<script>
  import {navigate} from 'svelte-routing'
  import {SS_HOST} from '../../network/queues/scoresaber/page-queue'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import Difficulty from '../Song/Difficulty.svelte'
  import {opt} from '../../utils/js'

  export let leaderboard = null;
  export let rank = null;

  $: song = opt(leaderboard, 'song', null);
  $: page = rank && Number.isFinite(rank) ? Math.floor((rank - 1) / LEADERBOARD_SCORES_PER_PAGE) + 1 : 1;
</script>

{#if song}
  <a on:click={navigate(`/leaderboard/global/${opt(leaderboard, 'leaderboardId', '')}/${page}`)}>
    <div class="cover-difficulty">
      <img src={`${SS_HOST}/imports/images/songs/${encodeURIComponent(song.hash)}.png`} alt=""/>

      <div class="difficulty">
          <Difficulty diff={leaderboard.diffInfo} useShortName={true} reverseColors={true} stars={leaderboard.stars}/>
      </div>
    </div>

    <div class="songinfo">
      <span class="name">{song.name} {song.subName}</span>
      <div class="author">{song.authorName} <small>{song.levelAuthorName}</small>
      </div>
    </div>
  </a>
{/if}

<style>
    a {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    a > * {
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
    }

    .songinfo {
        color: var(--alternate);
    }

    .songinfo small {
        font-size: 0.75em;
        color: var(--ppColour);
    }
</style>