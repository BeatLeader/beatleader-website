<script>
  import {fade} from 'svelte/transition'
  import createBeatSaviorService from '../../../services/beatsavior'
  import Switcher from '../../Common/Switcher.svelte'
  import Hands from '../../BeatSavior/Stats/Hands.svelte'
  import OtherStats from '../../BeatSavior/Stats/OtherStats.svelte'
  import Grid from '../../BeatSavior/Stats/Grid.svelte'
  import {capitalize} from '../../../utils/js'

  export let playerId = null;

  const allFilters = [
    {key: 'passed', label: 'All passed'},
    {key: 'best', label: 'Only the best'},
  ];

  let filters = allFilters;
  let selectedType = filters[0];

  const beatSaviorService = createBeatSaviorService();

  let beatSaviorData = null;
  let playerScoresAreAvailable = false;

  function refreshAvailableFilters() {
    const currentType = selectedType?.key ?? 'passed';

    filters = allFilters.filter(f => playerScoresAreAvailable || f.key === 'passed')
    selectedType = filters.find(f => f.key === currentType) ?? filters?.[0]
  }

  async function refreshBeatSaviorScores(playerId) {
    if (!playerId) return;

    beatSaviorData = (await beatSaviorService.getPlayerScoresWithScoreSaber(playerId))
      ?.filter(bsData => bsData?.trackers?.winTracker?.won ?? false);

    playerScoresAreAvailable = beatSaviorData?.some(s => !!s.ssScore)
  }

  function calculateStats(scores) {
    if (!scores?.length) return null;

    const stats = scores
      .reduce((stats, s) => {
          stats.total++;

          ['left', 'right'].forEach(key => {
            const keyCapitalized = capitalize(key);

            const totalVar = `total${keyCapitalized}`;
            const accVar = `acc${keyCapitalized}`;
            const cutVar = `${key}AverageCut`;
            const missVar = `${key}Miss`;
            const badCutsVar = `${key}BadCuts`;
            const timeDependenceVar = `${key}TimeDependence`;
            const preSwing = `${key}Preswing`;
            const postSwing = `${key}Postswing`;

            if (Number.isFinite(s?.trackers?.accuracyTracker?.[accVar])) {
              stats[totalVar]++;

              stats[accVar] += s?.trackers?.accuracyTracker?.[accVar];
              stats[timeDependenceVar] += Number.isFinite(s?.trackers?.accuracyTracker?.[timeDependenceVar]) ? s?.trackers?.accuracyTracker?.[timeDependenceVar] : 0;
              stats[preSwing] += Number.isFinite(s?.trackers?.accuracyTracker?.[preSwing]) ? s?.trackers?.accuracyTracker?.[preSwing] : 0;
              stats[postSwing] += Number.isFinite(s?.trackers?.accuracyTracker?.[postSwing]) ? s?.trackers?.accuracyTracker?.[postSwing] : 0;

              stats[missVar] += Number.isFinite(s?.trackers?.hitTracker?.[missVar]) ? s?.trackers?.hitTracker?.[missVar] : 0;
              stats[badCutsVar] += Number.isFinite(s?.trackers?.hitTracker?.[badCutsVar]) ? s?.trackers?.hitTracker?.[badCutsVar] : 0;

              const cutData = s?.trackers?.accuracyTracker?.[cutVar];
              if (cutData && Array.isArray(cutData) && cutData?.length === 3)
                cutData.forEach((v, idx) => stats[cutVar][idx] += Number.isFinite(v) ? v : 0);
            }
          });

          let gridAcc = s?.trackers?.accuracyTracker?.gridAcc;
          if (Array.isArray(gridAcc) && gridAcc.length === 12) {
            gridAcc = gridAcc.slice(-4).concat(gridAcc.slice(4, 8)).concat(gridAcc.slice(0, 4))

            gridAcc.forEach((v, idx) => {
              if (Number.isFinite(v)) {
                stats.gridAcc[idx] += v;
                stats.totalGridAcc[idx]++;
              }
            });
          }

          const miss = Number.isFinite(s?.trackers?.hitTracker?.miss) ? s?.trackers?.hitTracker?.miss : 0;
          const wallHit = Number.isFinite(s?.trackers?.hitTracker?.nbOfWallHit) ? s?.trackers?.hitTracker?.nbOfWallHit : 0;
          const bombHit = Number.isFinite(s?.trackers?.hitTracker?.bombHit) ? s?.trackers?.hitTracker?.bombHit : 0;

          stats.fc += !miss && !wallHit && !bombHit ? 1 : 0;
          stats.miss += miss;
          stats.bombHit += bombHit;
          stats.wallHit += wallHit;

          stats.acc += Number.isFinite(s?.trackers?.scoreTracker?.rawRatio) ? s?.trackers?.scoreTracker?.rawRatio * 100 : 0;

          stats.pauses += Number.isFinite(s?.trackers?.winTracker?.nbOfPause) ? s?.trackers?.winTracker?.nbOfPause : 0;

          stats.badCuts += Number.isFinite(s?.trackers?.hitTracker?.badCuts) ? s?.trackers?.hitTracker?.badCuts : 0;
          stats.missedNotes += Number.isFinite(s?.trackers?.hitTracker?.missedNotes) ? s?.trackers?.hitTracker?.missedNotes : 0;

          stats.maxCombo += Number.isFinite(s?.trackers?.hitTracker?.maxCombo) ? s?.trackers?.hitTracker?.maxCombo : 0;

          return stats;
        },
        {
          total: 0,
          totalLeft: 0,
          totalRight: 0,
          totalGridAcc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          acc: 0,
          fc: 0,
          miss: 0,
          badCuts: 0,
          missedNotes: 0,
          leftMiss: 0,
          leftBadCuts: 0,
          rightMiss: 0,
          rightBadCuts: 0,
          maxCombo: 0,
          pauses: 0,
          bombHit: 0,
          wallHit: 0,
          accLeft: 0,
          accRight: 0,
          leftTimeDependence: 0,
          rightTimeDependence: 0,
          leftPreswing: 0,
          leftPostswing: 0,
          rightPreswing: 0,
          rightPostswing: 0,
          leftAverageCut: [0, 0, 0],
          rightAverageCut: [0, 0, 0],
          gridAcc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          won: true,
        },
      )
    ;

    if (!stats.total) return null;

    if (stats.total) {
      ['acc', 'fc', 'miss', 'pauses', 'bombHit', 'wallHit', 'badCuts', 'missedNotes', 'maxCombo'].forEach(key => {
        stats[key] = stats[key] / stats.total;
      });

      stats.gridAcc.forEach((v, idx) => stats.gridAcc[idx] = stats.totalGridAcc[idx] ? v / stats.totalGridAcc[idx] : 0);

      ['left', 'right'].forEach(key => {
        const keyCapitalized = capitalize(key);

        const totalVar = `total${keyCapitalized}`;
        const cutVar = `${key}AverageCut`;

        if (!stats[totalVar]) return;

        [`acc${keyCapitalized}`, `${key}Miss`, `${key}BadCuts`, `${key}TimeDependence`, `${key}Preswing`, `${key}Postswing`].forEach(keyVar => {
          if (Number.isFinite(stats[keyVar])) {
            stats[keyVar] = stats[keyVar] / stats[totalVar];
          }
        })

        if (stats[cutVar] && Array.isArray(stats[cutVar]))
          stats[cutVar].forEach((v, idx) => stats[cutVar][idx] = v / stats[totalVar]);
      });

      return stats;
    }

    return null;
  }

  $: refreshBeatSaviorScores(playerId)
  $: refreshAvailableFilters(playerScoresAreAvailable)
  $: filteredScores = beatSaviorData?.filter(bsData => selectedType?.key !== 'best' || !!bsData?.ssScore) ?? null
  $: stats = calculateStats(filteredScores);
</script>

<div class="beat-savior" transition:fade>
  <h3 class="title is-6">
    <a href={`https://www.beatsavior.io/#/profile/${playerId}`} target="_blank" rel="noreferrer">
      <span class="beatsavior-icon"></span>
      <span>Beat Savior average</span>
    </a>
  </h3>

  {#if beatSaviorData?.length}
    {#if filteredScores?.length}
      {#if stats}
        <div class="stats">
          <OtherStats beatSavior={{stats}} isAverage={true}/>
          <Hands {stats}/>
          <Grid accGrid={stats?.gridAcc}/>
        </div>

        <p class="note">Average calculated from {stats.total} run(s).</p>
        <div class="switcher">
          <Switcher values={filters} value={selectedType} on:change={e => selectedType = e?.detail ?? filters[0]}/>
        </div>
      {:else}
        <p>Calculating...</p>
      {/if}
    {:else}
      No matching scores.
    {/if}
  {:else}
    <p>No data.</p>
  {/if}
</div>


<style>
    h3 {
        padding: .25em 0;
        margin-bottom: .75em !important;
        font-size: 1.25em;
    }

    h3 > a {
        display: inline-flex;
        align-items: center;
    }

    h3 .beatsavior-icon {
        display: inline-block;
        width: 1.25em;
        height: 1.25em;
        margin-right: .5em;
    }

    .stats {
        max-width: 100%;
        overflow-x: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1.5em;
        align-items: center;
        justify-items: center;
    }

    .stats :global(>*:first-child) {
        grid-column: 1 / span 2;
    }

    p.note {
        margin-top: 1rem;
        font-size: .875em;
        color: var(--faded);
        text-align: center;
    }

    .switcher {
        margin-top: 1rem;
    }

    @media screen and (max-width: 768px) {
        h3 {
            text-align: center;
        }
    }

    @media screen and (max-width: 767px) {
        .stats {
            grid-template-columns: 1fr;
            grid-gap: 1.5em;
        }

        .stats :global(>*:first-child) {
            grid-column: 1 / 1;
        }
    }
</style>