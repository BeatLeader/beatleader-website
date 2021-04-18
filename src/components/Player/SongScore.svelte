<script>
  import {formatNumber} from '../../utils/format'

  import Leaderboard from './Leaderboard.svelte'
  import ScoreRank from './ScoreRank.svelte'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Pp from '../Score/Pp.svelte'
  import Value from '../Common/Value.svelte'
  import {slide} from 'svelte/transition'
  import Badge from '../Common/Badge.svelte'
  import Accuracy from '../Common/Accuracy.svelte'

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

      <div class="timeset tablet-and-up">
        <FormattedDate date={score.timeSet}/>
      </div>
    </span>

    <span class="timeset mobile-only">
      <FormattedDate date={score.timeSet}/>
    </span>

    <span class="song">
      <Leaderboard {leaderboard}/>
    </span>

    {#if score.pp}
      <span class="pp with-badge">
          <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
            <span slot="label">
              <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
                  pp="{score.pp}" prevPp={score.prevPp}
                  zero={formatNumber(0)} withZeroSuffix={true} inline={true}
                  color="white"
              />
            </span>
          </Badge>

          <small>
            (<Value value={score.ppWeighted} zero={formatNumber(0)} withZeroSuffix={true} suffix="pp" inline={true}/>)
          </small>
        </span>
    {/if}

    {#if score.acc}
        <span class="acc with-badge">
          <Accuracy {score} />
        </span>
    {/if}

    {#if score.score}
      <span class="score with-badge">
        <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
            <span slot="label">
              <Value value="{score.score}" prevValue={score.prevScore}
                     inline={true} digits={0} prefix={score.scoreApproximate ? '~' : ''}
              />
            </span>
        </Badge>

        <small>Score</small>
      </span>
    {/if}

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

    .song-score :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
    }

    .rank {
        width: 5.5em;
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

    .rank .timeset {
        width: auto;
        font-size: .8em;
    }

    .pp {
        min-width: 5em;
    }

    .acc {
        min-width :4em;
    }

    .score {
        min-width: 5.25em;
    }

    .with-badge {
        text-align: center;
    }

    small {
        display: block;
        text-align: center;
    }

    @media screen and (max-width: 767px) {
        .rank, .timeset {
            padding-bottom: .5em !important;
        }

        .song {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-right: 0;
        }
    }
</style>