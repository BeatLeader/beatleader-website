<script>
  import {SS_HOST} from '../../network/scoresaber/page-queue'
  import Difficulty from '../Song/Difficulty.svelte'
  import {opt} from '../../utils/js'
  import Value from '../Common/Value.svelte'
  import {fade} from 'svelte/transition'

  export let leaderboard = null;

  $: song = opt(leaderboard, 'song', null);
</script>

{#if song}
  <a href="{`${SS_HOST}/leaderboard/${encodeURIComponent(opt(leaderboard, 'leaderboardId', ''))}`}" target="_blank" rel="noopener">
    <div class="difficulty-stars">
      <div class="difficulty">
          <Difficulty diff={leaderboard.diffInfo} useShortName={true} reverseColors={true}/>
      </div>
      {#if leaderboard.stars}
        <div class="stars" transition:fade><Value value={leaderboard.stars} suffix="*" zero=""/></div>
      {/if}
    </div>

    <img src={`${SS_HOST}/imports/images/songs/${encodeURIComponent(song.hash)}.png`} alt=""/>

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

    .difficulty-stars {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 2.125em;
    }

    .difficulty {
        display: flex;
        align-items: center;
    }

    .stars {
        margin-top: .125em;
        font-size: .75em;
        color: var(--faded);
    }

    img {
        width: 3em;
        height: 3em;
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