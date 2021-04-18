<script>
  import {SS_HOST} from '../../network/scoresaber/page'
  import Difficulty from '../Song/Difficulty.svelte'

  export let leaderboard = null;

  $: song = leaderboard?.song ?? null;
</script>

{#if song}
  <a href="{`${SS_HOST}/leaderboard/${encodeURIComponent(leaderboard?.leaderboardId)}`}" target="_blank" rel="noopener">
    <span class="difficulty">
        <Difficulty diff={leaderboard.diffInfo} useShortName={true} reverseColors={true}/>
      </span>

    <img src={`${SS_HOST}/imports/images/songs/${encodeURIComponent(song.hash)}.png`}/>

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

    .difficulty {
        display: flex;
        align-items: center;
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