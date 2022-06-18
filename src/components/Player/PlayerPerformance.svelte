<script>
  import {formatDate} from '../../utils/date'
  import ssrConfig from '../../ssr-config'
  import {configStore} from '../../stores/config'
  import Badge from '../Common/Badge.svelte'
  import Value from "../Common/Value.svelte";
  import Accuracy from '../Common/Accuracy.svelte'
  import Pp from '../Score/Pp.svelte'
  import {formatNumber, padNumber} from '../../utils/format'
  import {opt} from "../../utils/js";
  import FormattedDate from "../Common/FormattedDate.svelte";

  function formatFailedAt(beatSavior) {
    const endTime = opt(beatSavior, 'trackers.winTracker.endTime');
    const won = opt(beatSavior, 'trackers.winTracker.won', false);
    if (!endTime || won) return null;

    let failedAt = null;
    if (endTime) {
      let minutes = padNumber(Math.floor(endTime / 60));
      let seconds = padNumber(Math.round(endTime - minutes * 60));
      if (seconds >= 60) {
        minutes = padNumber(minutes + 1)
        seconds = padNumber(0);
      }

      failedAt = `${minutes}:${seconds}`
    }

    return failedAt
  }

  export let service = null
  export let songScore = null
  export let showDetails = false
  export let modifiersStore = null
  export let unmodifiedScore = false

  $: leaderboard = opt(songScore, 'leaderboard', null);
  $: score = opt(songScore, 'score', null);
  $: prevScore = opt(songScore, 'prevScore', null);
  $: beatSavior = opt(songScore, 'beatSavior', null)
  $: failedAt = formatFailedAt(beatSavior)
  $: comparePlayers = opt(songScore, 'comparePlayers', null)
</script>

<div class="player-performance">
  <div class="player-performance-badges">
    {#if score.pp}
          <span class="pp with-badge">
            <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
              <span slot="label">
                <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
                    pp="{score.pp}" weighted={score.ppWeighted} attribution={score.ppAttribution}
                    whatIf={score.whatIfPp}
                    zero={(configStore, $configStore, formatNumber(0))} withZeroSuffix={true} inline={false}
                    color="white"
                />
              </span>
            </Badge>
          </span>
    {:else if service === 'beatsavior' && beatSavior && !opt(beatSavior, 'trackers.winTracker.won', false)}
          <span class="pp with-badge">
            <Badge onlyLabel={true} color="white" bgColor="var(--decrease)" label="FAIL"
                   title={failedAt ? `Failed at ${failedAt}` : null}/>
          </span>
    {:else if service === 'accsaber' && score.ap}
          <span class="pp with-badge">
            <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
              <span slot="label">
                <Pp playerId={score.playerId} leaderboardId={leaderboard.leaderboardId}
                    pp="{score.ap}" weighted={score.weightedAp}
                    zero={formatNumber(0)} withZeroSuffix={true} inline={false}
                    suffix="AP"
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
              <Accuracy {score} {prevScore} {modifiersStore} noSecondMetric={true}/>
            </span>
    {:else}
      <span class="acc with-badge"></span>
    {/if}

    {#if score.score}
        <span class="score with-badge">
          <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
              <span slot="label">
                <Value value="{unmodifiedScore ? score.unmodifiedScore : score.score}" prevValue={opt(prevScore, 'score')}
                       inline={false} digits={0} prefix={score.scoreApproximate ? '~' : ''}
                       prevTitle={"${value} on " + (configStore, $configStore, formatDate(opt(prevScore, 'timeSet'), 'short', 'short'))}
                />
              </span>
          </Badge>
        </span>
    {/if}

    {#if beatSavior && beatSavior.stats}
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
                <span slot="label"
                      title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}>
                  {#if beatSavior.stats.miss || beatSavior.stats.bombHit || beatSavior.stats.wallHit}
                    <i class="fas fa-times"></i>
                    <Value
                        title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}
                        value="{beatSavior.stats.miss + beatSavior.stats.wallHit + beatSavior.stats.bombHit}"
                        inline={false} digits={0}
                    />
                  {:else if (!beatSavior.stats.wallHit && !beatSavior.stats.bombHit)}
                  <span style="color: yellow">FC</span>
                  {/if}
                </span>
            </Badge>
          </span>
      {/if}
    {:else if score.badCuts !== undefined}
      <span></span>
      <span></span>
      <span class="beatSavior with-badge">
            <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
                <span slot="label" title={`Missed notes: ${score.missedNotes}, Bad cuts: ${score.badCuts}`}>
                  {#if !score.fullCombo}
                    <i class="fas fa-times"></i>
                    <Value
                        title={`Missed notes: ${score.missedNotes}, Bad cuts: ${score.badCuts}`}
                        value="{score.missedNotes + score.badCuts}"
                        inline={false} digits={0}
                    />
                  {:else}
                  <span style="color: yellow">FC</span>
                  {/if}
                </span>
            </Badge>
          </span>
    {/if}
  </div>

  {#if (showDetails || (configStore && opt($configStore, 'scoreComparison.method') === 'in-place')) && comparePlayers && Array.isArray(comparePlayers)}
    {#each comparePlayers as comparePlayer (comparePlayer.playerId)}
      <span class="compare-player-name">
        <span>
          vs {comparePlayer.playerName} (<FormattedDate date={opt(comparePlayer, 'score.timeSet')}/>)
        </span>
      </span>

      <div class="player-performance-badges">
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
                <Accuracy score={comparePlayer.score} noSecondMetric={true}/>
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
                        <span slot="label"
                              title={`Missed notes: ${comparePlayer.beatSavior.stats.missedNotes}, Bad cuts: ${comparePlayer.beatSavior.stats.badCuts}, Bomb hit: ${comparePlayer.beatSavior.stats.bombHit}, Wall hit: ${comparePlayer.beatSavior.stats.wallHit}`}>
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
      </div>
    {/each}
  {/if}
</div>

<style>
    .player-performance {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .player-performance-badges {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-column-gap: .4em;
        grid-row-gap: .25em;
        min-width: 20rem;
    }

    .beatSavior {
        font-size: .85em;
    }

    .beatSavior.with-badge i {
        font-size: .875em;
    }

    .beatSavior.with-badge :global(.label) {
        font-size: .75em;
    }

    .pp {
        min-width: 5em;
    }

    .pp.with-badge {
        position: relative;
    }

    .acc {
        min-width: 4em;
    }

    .score {
        min-width: 5.25em;
    }

    .with-badge {
        text-align: center;
    }

    .with-badge :global(.badge) {
        height: 100%;
    }

    .compare-player-name {
        color: var(--faded);
        text-align: center;
        font-size: .875em;
        border-bottom: 1px solid var(--faded);
        margin-bottom: .9em;
        line-height: 1;
    }

    .compare-player-name > span {
        display: inline-block;
        position: relative;
        top: .5em;
        background-color: var(--foreground);
        padding: 0 .5em;
    }

    .player-performance-badges .compare {
        opacity: .7;
    }
</style>