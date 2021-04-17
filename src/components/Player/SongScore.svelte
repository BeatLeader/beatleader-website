<script>
  import {formatNumber} from '../../utils/format'

  import Leaderboard from './Leaderboard.svelte'
  import ScoreRank from './ScoreRank.svelte'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Pp from '../Score/Pp.svelte'
  import Value from '../Common/Value.svelte'
  import {slide} from 'svelte/transition'

  export let songScore = null;

  $: leaderboard = songScore?.leaderboard ?? null;
  $: score = songScore?.score ?? null;
</script>

{#if songScore}
  <div class="song-score" transition:slide={{duration: 200}}>
    <span class="rank">
      <ScoreRank rank={score.rank}
                 countryRank={score.ssplCountryRank}
                 country={score.country}
      />
    </span>

    <span class="song">
      <Leaderboard {leaderboard}/>
    </span>

    <span class="timeset">
      <FormattedDate date={score.timeSet}/>
    </span>

    <div class="score">
      {#if score.pp}
        <div class="val">
          <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
              pp="{score.pp}" prevPp={score.prevPp}
              zero={formatNumber(0)} withZeroSuffix={true} weighted={score.ppWeighted} inline={true}
          />
        </div>
      {/if}

      {#if score.acc}
        <div class="val">
          <label>Accuracy:</label>
          <Value value={score.acc} withZeroSuffix={true} prevValue={score.prevAcc} inline={true}
                 suffix={'%' + (score.mods && score.mods.length ? ` (${score.mods})` : '')} suffixPrev="%"
          />
        </div>
      {/if}

      {#if score.score}
        <div class="val">
          <label>Score:</label>
          <Value value="{score.score}" prevValue={score.prevScore}
                 inline={true} digits={0} prefix={score.scoreApproximate ? '~' : ''}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
    .song-score {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        align-items: center;
        border-bottom: 1px solid var(--dimmed);
        padding-top: 1em;
    }

    .song-score > * {
        width: min-content;
        margin-right: 1em;
        padding-bottom: 1em;
    }

    .song-score > *:last-child {
        margin-right: 0;
    }

    .rank {
        width: 5em;
        text-align: center;
    }

    .song {
        flex-grow: 1;
        min-width: 18em;
    }

    .timeset {
        width: 8.5em;
        text-align: center;
    }

    .score {
        min-width: 8.5em;
    }

    .val {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .val + .val {
        font-size: .875em;
    }

    .val label {
        font-style: italic;
        margin-right: .5em;
    }
</style>