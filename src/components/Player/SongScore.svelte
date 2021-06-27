<script>
  import {formatNumber} from '../../utils/format'

  import Leaderboard from './Leaderboard.svelte'
  import ScoreRank from './ScoreRank.svelte'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Pp from '../Score/Pp.svelte'
  import Value from '../Common/Value.svelte'
  import {fade, slide} from 'svelte/transition'
  import Badge from '../Common/Badge.svelte'
  import Accuracy from '../Common/Accuracy.svelte'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'

  export let songScore = null;

  $: leaderboard = opt(songScore, 'leaderboard', null);
  $: score = opt(songScore, 'score', null);
  $: prevScore = opt(songScore, 'prevScore', null);
</script>

{#if songScore}
  <div class="song-score" in:fade={{duration: 300, delay: 200}} out:slide={{duration: 200}}>
    <span class="rank">
      <ScoreRank rank={score.rank}
                 countryRank={score.ssplCountryRank}
                 countryRankTotal={null}
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

    <section class="stats">
    {#if score.pp}
      <span class="pp with-badge">
          <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
            <span slot="label">
              <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
                  pp="{score.pp}" prevPp={opt(prevScore, 'pp')}
                  zero={formatNumber(0)} withZeroSuffix={true} inline={false}
                  prevTitle={"${value} on " + formatDate(opt(prevScore, 'timeSet'), 'short', 'short')}
                  color="white"
              />
            </span>
          </Badge>

          <small>
            (<Value value={score.ppWeighted} zero={formatNumber(0)} withZeroSuffix={true} suffix="pp" inline={true}/>)
          </small>
        </span>
    {:else}
      <span class="pp with-badge"></span>
    {/if}

    {#if score.acc}
        <span class="acc with-badge">
          <Accuracy {score} {prevScore} />
        </span>
    {:else}
      <span class="acc with-badge"></span>
    {/if}

    {#if score.score}
      <span class="score with-badge">
        <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
            <span slot="label">
              <Value value="{score.score}" prevValue={opt(prevScore, 'score')}
                     inline={false} digits={0} prefix={score.scoreApproximate ? '~' : ''}
                     prevTitle={"${value} on " + formatDate(opt(prevScore, 'timeSet'), 'short', 'short')}
              />
            </span>
        </Badge>

        {#if score.mods && score.mods.length}
          <small>{`${score.mods.join(', ')}`}&nbsp;</small>
        {/if}
      </span>
    {/if}
    </section>

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
        padding-bottom: .5em;
    }

    .song-score > * {
        width: min-content;
        margin-right: 1em;
    }

    .song-score > *:last-child {
        margin-right: 0;
    }

    .song-score :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 100%;
    }

    .song-score :global(.badge small) {
        font-size: .7em;
        font-weight: normal;
        margin-top: -2px;
    }

    section.stats {
        display: grid;
        grid-template-columns: repeat(3, min-content);
        grid-template-rows: min-content;
        grid-column-gap: 1em;
        grid-row-gap: .25em;
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
        white-space: nowrap;
        font-size: .75em;
    }

    @media screen and (max-width: 767px) {
        .song-score {
            padding: 1em 0;
        }

        .rank, .timeset {
            padding-bottom: .5em !important;
        }

        .song {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-right: 0;
            padding-bottom: .75em;
        }
    }
</style>