<script>
  import {formatNumber} from '../../utils/format'
  import {fade, slide} from 'svelte/transition'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'
  import config from '../../config'
  import Badge from '../Common/Badge.svelte'
  import Accuracy from '../Common/Accuracy.svelte'
  import SongInfo from './SongInfo.svelte'
  import ScoreRank from './ScoreRank.svelte'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Pp from '../Score/Pp.svelte'
  import Value from '../Common/Value.svelte'
  import SongScoreDetails from './SongScoreDetails.svelte'

  export let songScore = null;

  let showDetails = false;

  $: leaderboard = opt(songScore, 'leaderboard', null);
  $: score = opt(songScore, 'score', null);
  $: prevScore = opt(songScore, 'prevScore', null);
  $: beatSavior = opt(songScore, 'beatSavior', null)
</script>

{#if songScore}
  <div class="song-score" in:fade={{duration: 300, delay: 200}} out:slide={{duration: 200}} class:with-details={showDetails}>
    <span class="rank">
      <ScoreRank rank={score.rank}
                 countryRank={score.ssplCountryRank}
                 countryRankTotal={null}
                 country={score.country}
      />

      <div class="timeset tablet-and-up">
        <FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={prevScore ? prevScore.timeSet : null}/>
      </div>
    </span>

    <span class="timeset mobile-only">
      <FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={prevScore ? prevScore.timeSet : null}/>
    </span>

    <span class="song">
      <SongInfo {leaderboard} rank={score.rank}/>
    </span>

    <section class="stats">
      {#if !beatSavior || !beatSavior.stats}
        <span class="beat-savior-reveal clickable" on:click={() => showDetails = !showDetails} title="Show leaderboard">
          <i class={`fas ${showDetails ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </span>
      {:else}
        <span></span>
      {/if}

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
              (<Value value={score.ppWeighted} zero={formatNumber(0)} withZeroSuffix={true} suffix="pp" inline={true} title="Weighted PP"/>)
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
          <small title="Mods">{`${score.mods.join(', ')}`}&nbsp;</small>
        {/if}
      </span>
    {/if}

      {#if beatSavior && beatSavior.stats}
        <span class="beat-savior-reveal" class:opened={showDetails} on:click={() => showDetails = !showDetails} title="Show details">
          <i class="fas fa-chevron-down"></i>
        </span>

        {#if beatSavior.stats.accLeft}
        <span class="beatSavior with-badge">
          <Badge onlyLabel={true} color="white" bgColor={config.leftSaberColor}>
              <span slot="label">
                <Value
                  title={`Left accuracy: ${beatSavior.stats.leftAverageCut ? beatSavior.stats.leftAverageCut.map(v => formatNumber(v)).join('/') : ''}`}
                  value="{beatSavior.stats.accLeft}"
                  inline={false} digits={2}
                />
              </span>
          </Badge>
        </span>
        {/if}

        {#if beatSavior.stats.accRight}
        <span class="beatSavior with-badge">
          <Badge onlyLabel={true} color="white" bgColor={config.rightSaberColor}>
              <span slot="label">
                <Value
                  title={`Right accuracy: ${beatSavior.stats.rightAverageCut ? beatSavior.stats.rightAverageCut.map(v => formatNumber(v)).join('/') : ''}`}
                  value="{beatSavior.stats.accRight}" inline={false} digits={2}
                />
              </span>
          </Badge>
        </span>
        {/if}

        {#if beatSavior.stats.miss !== undefined}
        <span class="beatSavior with-badge">
          <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
              <span slot="label" title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}>
                {#if beatSavior.stats.miss || beatSavior.stats.bombHit || beatSavior.stats.wallHit}
                  <i class="fas fa-times"></i>
                  <Value
                    title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}
                    value="{beatSavior.stats.miss}" inline={false} digits={0}
                  />
                {:else if (!beatSavior.stats.wallHit && !beatSavior.stats.bombHit)}
                  FC
                {/if}
              </span>
          </Badge>
        </span>
        {/if}
      {/if}
    </section>

  </div>
  {#if showDetails}
    <div transition:slide>
      <SongScoreDetails {songScore} />
    </div>
  {/if}
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

    .song-score.with-details {
        border-bottom: none;
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

    .song-score :global(.inc), .song-score :global(.dec) {
        color: inherit;
    }

    section.stats, .beat-savior-data {
        display: grid;
        grid-template-columns: 1rem repeat(3, minmax(0, 1fr));
        grid-template-rows: min-content;
        grid-column-gap: .75em;
        grid-row-gap: .25em;
        min-width: 20rem;
    }

    .beat-savior-data {
        grid-template-columns: 1rem repeat(3, minmax(0, 1fr));
    }

    .beatSavior {
        font-size: .85em;
    }

    .rank {
        width: 5.5em;
        text-align: center;
    }

    .song {
        flex-grow: 1;
        min-width: 15.25em;
    }

    .timeset {
        width: 8.5em;
        text-align: center;
    }

    .timeset :global(small) {
        line-height: 1;
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

    .beatSavior.with-badge i {
        font-size: .875em;
    }

    .beatSavior.with-badge :global(.label) {
        font-size: .75em;
    }

    .beat-savior-data {
        grid-column: 1/-1;
    }

    .beat-savior-reveal {
        cursor: pointer;
        transition: transform 500ms;
    }
    .beat-savior-reveal.opened {
        transform: rotateZ(180deg);
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
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            margin-right: 0;
            padding-bottom: .75em;
        }
    }
</style>