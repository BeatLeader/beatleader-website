<script>
  import {formatNumber} from '../../utils/format'
  import {fade, fly, slide} from 'svelte/transition'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'
  import ssrConfig from '../../ssr-config'
  import {configStore} from '../../stores/config'
  import Badge from '../Common/Badge.svelte'
  import Accuracy from '../Common/Accuracy.svelte'
  import SongInfo from './SongInfo.svelte'
  import ScoreRank from './ScoreRank.svelte'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Pp from '../Score/Pp.svelte'
  import Value from '../Common/Value.svelte'
  import SongScoreDetails from './SongScoreDetails.svelte'
  import Icons from '../Song/Icons.svelte'

  export let songScore = null;
  export let fixedBrowserTitle = null;
  export let idx = 0;

  let showDetails = false;

  $: leaderboard = opt(songScore, 'leaderboard', null);
  $: score = opt(songScore, 'score', null);
  $: prevScore = opt(songScore, 'prevScore', null);
  $: beatSavior = opt(songScore, 'beatSavior', null)
  $: comparePlayers = opt(songScore, 'comparePlayers', null)
  $: hash = opt(leaderboard, 'song.hash')
  $: twitchUrl = opt(songScore, 'twitchVideo.url', null)
  $: diffInfo = opt(leaderboard, 'diffInfo')
</script>

{#if songScore}
  <div class={`song-score row-${idx}`}
       in:fly={{x: 300, delay: idx * 30, duration:500}} out:fade={{duration:100}}
       class:with-details={showDetails}
  >
      <div class="icons up-to-tablet">
        <Icons {hash} {twitchUrl} {diffInfo} />
      </div>

    <div class="main">
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
        <SongInfo {leaderboard} rank={score.rank} {hash} {twitchUrl}/>
      </span>

      <section class="stats">
        {#if !beatSavior || !beatSavior.stats}
          <span class="beat-savior-reveal clickable" class:opened={showDetails} on:click={() => showDetails = !showDetails} title="Show leaderboard">
            <i class="fas fa-chevron-down"></i>
          </span>
        {:else}
          <span></span>
        {/if}

        {#if score.pp}
          <span class="pp with-badge">
              <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
                <span slot="label">
                  <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
                      pp="{score.pp}" weighted={score.ppWeighted}
                      zero={(configStore, $configStore, formatNumber(0))} withZeroSuffix={true} inline={false}
                      color="white"
                  />
                </span>
              </Badge>
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
                       prevTitle={"${value} on " + (configStore, $configStore, formatDate(opt(prevScore, 'timeSet'), 'short', 'short'))}
                />
              </span>
          </Badge>

          {#if score.mods && score.mods.length}
            <small title="Mods">{`${score.mods.join(', ')}`}&nbsp;</small>
          {/if}
        </span>
        {/if}

        {#if beatSavior && beatSavior.stats}
          <span class="beat-savior-reveal clickable" class:opened={showDetails} on:click={() => showDetails = !showDetails} title="Show details">
            <i class="fas fa-chevron-down"></i>
          </span>

          {#if beatSavior.stats.accLeft}
          <span class="beatSavior with-badge">
            <Badge onlyLabel={true} color="white" bgColor={ssrConfig.leftSaberColor}>
                <span slot="label">
                  <Value
                    title={`Left accuracy: ${beatSavior.stats.leftAverageCut ? beatSavior.stats.leftAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/') : ''}`}
                    value="{beatSavior.stats.accLeft}"
                    inline={false} digits={2}
                  />
                </span>
            </Badge>
          </span>
          {/if}

          {#if beatSavior.stats.accRight}
          <span class="beatSavior with-badge">
            <Badge onlyLabel={true} color="white" bgColor={ssrConfig.rightSaberColor}>
                <span slot="label">
                  <Value
                    title={`Right accuracy: ${beatSavior.stats.rightAverageCut ? beatSavior.stats.rightAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/') : ''}`}
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
                      value="{beatSavior.stats.miss + beatSavior.stats.wallHit + beatSavior.stats.bombHit}"
                      inline={false} digits={0}
                    />
                  {:else if (!beatSavior.stats.wallHit && !beatSavior.stats.bombHit)}
                    FC
                  {/if}
                </span>
            </Badge>
          </span>
          {/if}
        {/if}

        {#if (showDetails || (configStore && opt($configStore, 'scoreComparison.method') === 'in-place') ) && comparePlayers && Array.isArray(comparePlayers)}
          {#each comparePlayers as comparePlayer (comparePlayer.playerId)}
            <span></span>
            <span class="compare-player-name"><span>vs {comparePlayer.playerName} (<FormattedDate date={opt(comparePlayer, 'score.timeSet')}/>)</span></span>

            <span></span>
            {#if comparePlayer.score && comparePlayer.score.pp}
              <span class="pp with-badge compare">
              <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
                <span slot="label">
                  <Pp playerId={comparePlayer.playerId} leaderboardId={leaderboard.leaderboardId}
                      pp="{comparePlayer.score.pp}" withZeroSuffix={true} inline={false}
                      color="white"
                  />
                </span>
              </Badge>
            </span>
            {:else}
              <span class="pp with-badge"></span>
            {/if}

            {#if comparePlayer.score.acc}
              <span class="acc with-badge compare">
                <Accuracy score={comparePlayer.score} noSecondMetric={true} />
              </span>
            {:else}
              <span class="acc with-badge"></span>
            {/if}

            {#if comparePlayer.score.score}
              <span class="score with-badge compare">
                <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
                    <span slot="label">
                      <Value value={comparePlayer.score.score}
                             inline={false} digits={0}
                             title={comparePlayer.score.mods && comparePlayer.score.mods.length ? `Mods: ${comparePlayer.score.mods.join(', ')}` : ''}
                      />
                    </span>
                </Badge>
              </span>
            {/if}

            {#if comparePlayer.beatSavior && comparePlayer.beatSavior.stats}
              <span></span>

              {#if comparePlayer.beatSavior.stats.accLeft}
                  <span class="beatSavior with-badge compare">
                    <Badge onlyLabel={true} color="white" bgColor={ssrConfig.leftSaberColor}>
                        <span slot="label">
                          <Value
                            title={`Left accuracy: ${comparePlayer.beatSavior.stats.leftAverageCut ? comparePlayer.beatSavior.stats.leftAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/') : ''}`}
                            value="{comparePlayer.beatSavior.stats.accLeft}"
                            inline={false} digits={2}
                          />
                        </span>
                    </Badge>
                  </span>
              {/if}

              {#if comparePlayer.beatSavior.stats.accRight}
                  <span class="beatSavior with-badge compare">
                    <Badge onlyLabel={true} color="white" bgColor={ssrConfig.rightSaberColor}>
                        <span slot="label">
                          <Value
                            title={`Right accuracy: ${comparePlayer.beatSavior.stats.rightAverageCut ? comparePlayer.beatSavior.stats.rightAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/') : ''}`}
                            value="{comparePlayer.beatSavior.stats.accRight}" inline={false} digits={2}
                          />
                        </span>
                    </Badge>
                  </span>
              {/if}

              {#if comparePlayer.beatSavior.stats.miss !== undefined}
                  <span class="beatSavior with-badge compare">
                    <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
                        <span slot="label" title={`Missed notes: ${comparePlayer.beatSavior.stats.missedNotes}, Bad cuts: ${comparePlayer.beatSavior.stats.badCuts}, Bomb hit: ${comparePlayer.beatSavior.stats.bombHit}, Wall hit: ${comparePlayer.beatSavior.stats.wallHit}`}>
                          {#if comparePlayer.beatSavior.stats.miss || comparePlayer.beatSavior.stats.bombHit || comparePlayer.beatSavior.stats.wallHit}
                            <i class="fas fa-times"></i>
                            <Value
                              title={`Missed notes: ${comparePlayer.beatSavior.stats.missedNotes}, Bad cuts: ${comparePlayer.beatSavior.stats.badCuts}, Bomb hit: ${comparePlayer.beatSavior.stats.bombHit}, Wall hit: ${comparePlayer.beatSavior.stats.wallHit}`}
                              value="{comparePlayer.beatSavior.stats.miss}" inline={false} digits={0}
                            />
                          {:else if (!comparePlayer.beatSavior.stats.wallHit && !comparePlayer.beatSavior.stats.bombHit)}
                            FC
                          {/if}
                        </span>
                    </Badge>
                  </span>
              {/if}
            {/if}
          {/each}
        {/if}
      </section>
    </div>

    {#if showDetails}
      <div transition:slide>
        <SongScoreDetails {songScore} {fixedBrowserTitle} />
      </div>
    {/if}
  </div>
{/if}

<style>
    .song-score {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
    }

    .song-score .icons.up-to-tablet + .main {
      padding-top: 0;
    }

    .song-score .main {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-evenly;
        align-items: center;
    }

    .song-score.with-details .main {
        border-bottom: none;
    }

    .song-score .main > * {
        margin-right: 1em;
    }

    .song-score .main > *:last-child {
        margin-right: 0;
    }

    .song-score .main :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 100%;
    }

    .song-score .main :global(.badge small) {
        font-size: .7em;
        font-weight: normal;
        margin-top: -2px;
    }

    .song-score .main :global(.inc), .song-score :global(.dec) {
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
        min-width: 7em;
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
        align-self: end;
        cursor: pointer;
        transition: transform 500ms;
        transform-origin: .5em .5em;
    }
    .beat-savior-reveal.opened {
        transform: rotateZ(180deg);
    }

    .compare-player-name {
        grid-column: 2 / span 3;
        color: var(--faded);
        text-align: center;
        font-size: .875em;
        line-height: 1;
        border-bottom: 1px solid var(--faded);
        margin-bottom: .75em;
    }

    .compare-player-name > span {
        display: inline-block;
        position: relative;
        top: .5em;
        background-color: var(--foreground);
        padding: 0 .5em;
    }

    .stats .compare {
        opacity: .7;
    }

    .icons {
        width: 100%;
        font-size: .75em;
        text-align: right;
        margin-right: 0;
        margin-bottom: .25em;
    }

    .icons:empty {
        margin-bottom: 0!important;
    }

    @media screen and (max-width: 767px) {
        .song-score {
            padding: .75em 0;
        }

        .song-score .main {
            flex-wrap: wrap;
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

        .icons {
            margin-bottom: .5em;
        }
    }
</style>