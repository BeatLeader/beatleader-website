<script>
  import processPlayerData from './utils/profile';
  import Error from '../Common/Error.svelte'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import SsBadges from './SsBadges.svelte'
  import ScoresStats from './ScoresStats.svelte'
  import Icons from './Icons.svelte'
  import eventBus from '../../utils/broadcast-channel-pubsub'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => playerStats = stats)

  let finalScoresStats = null;
  let accStats = null;
  let accBadges = null;

  function clearPlayerStatsOnChange() {
    playerStats = null;
  }

  function updateStats(ssStats, playerStats) {
    if (!ssStats && !playerStats) return null;

    finalScoresStats = (ssStats ? ssStats : [])
      .filter(stat => stat.label !== 'Average' || !playerStats)
      .concat(
        (playerStats && playerStats.topPp && Number.isFinite(playerStats.topPp) ? [{
          label: 'Best PP',
          title: null,
          value: playerStats.topPp,
          digits: 2,
          suffix: 'pp',
          fluid: true,
          bgColor: 'var(--ppColour)'
        }] : [])
      )

    accStats = (playerStats ? ['topAcc', 'avgAcc', 'medianAcc', 'stdDeviation'] : [])
          .reduce((cum, key) => {
            switch(key) {
              case 'avgAcc':
                cum.push({
                  label: 'Average',
                  title: 'Average ranked accuracy',
                  value: playerStats[key],
                  digits: 2,
                  suffix: '%',
                  fluid: true,
                  bgColor: 'var(--selected)'
                });
                break;

              case 'medianAcc':
                cum.push({
                  label: 'Median',
                  title: 'Median ranked accuracy',
                  value: playerStats[key],
                  digits: 2,
                  suffix: '%',
                  fluid: true,
                  bgColor: 'var(--ppColour)'
                });
                break;

              case 'stdDeviation':
                cum.push({
                  label: 'Std deviation',
                  title: 'Standard deviation ranked accuracy',
                  value: playerStats[key],
                  digits: 2,
                  suffix: '%',
                  fluid: true,
                  bgColor: 'var(--decrease)'
                });
                break;

              case 'topAcc':
                cum.push({
                  label: 'Best',
                  title: 'Best ranked accuracy',
                  value: playerStats[key],
                  digits: 2,
                  suffix: '%',
                  fluid: true,
                  bgColor: 'var(--selected)'
                });
                break;
            }

            return cum;
          }, [])

    accBadges = !playerStats
      ? []
      : playerStats.badges
        .map(badge => ({
          ...badge,
          title: !badge.min ? `< ${badge.max}%` : (!badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`),
          fluid: true,
          digits: 0,
        }))
  }

  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, prevInfo, scoresStats, ssBadges} = processPlayerData(playerData))

  $: clearPlayerStatsOnChange(playerId)
  $: updateStats(scoresStats, playerStats)
</script>

<div class="box has-shadow" class:loading={isLoading}>
  <div class="columns">
    <div class="column is-narrow avatar">
      <Avatar {playerInfo} {isLoading}/>

      {#if playerId && !isLoading}
        <Icons {playerId} />
      {/if}
    </div>

    <div class="column">
      {#if error}
        <div>
          <Error {error}/>
        </div>
      {/if}

      <PlayerStats {name} {playerInfo} {prevInfo} {skeleton}/>

      {#if finalScoresStats || ssBadges || skeleton}
        <div class="columns">
          <div class="column stats">
            <ScoresStats stats={finalScoresStats} {skeleton}/>
            {#if accStats}<ScoresStats stats={accStats}/>{/if}
            {#if accBadges}<ScoresStats stats={accBadges}/>{/if}
            <SsBadges badges={ssBadges}/>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
    .column.avatar {
        position: relative;
        text-align: center;
        margin-right: 1rem;
        min-width: calc(150px + 1.5rem + 1rem);
        min-height: 190px;
    }

    @media (max-width: 768px) {
        .column.avatar {
            margin-right: 0;
            min-width: calc(150px + 1.5rem);
            padding-bottom: 0;
            min-height: 150px;
        }
    }

    @media (max-width: 599px) {
        .stats {
            text-align: center;
        }

        .stats :global(.badges) {
            display: contents;
        }
    }
</style>