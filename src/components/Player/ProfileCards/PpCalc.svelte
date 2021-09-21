<script>
  import {onMount} from 'svelte'
  import {debounce} from '../../../utils/debounce'
  import {formatNumber} from '../../../utils/format'
  import createRankedService from '../../../services/scoresaber/rankeds'
  import createPpService from '../../../services/scoresaber/pp'
  import Badge from '../../Common/Badge.svelte'
  import Value from '../../Common/Value.svelte'

  export let playerId = null;
  export let worker = null;

  const DEBOUNCE_THRESHOLD = 300;
  const ACC_THRESHOLDS = [90, 91, 92, 93, 94, 95, 96, 97];

  const rankedService = createRankedService();
  const ppService = createPpService();

  let maxStars = 15;
  let maxPp = 100;

  let ppValue = 1;
  let stars = 10;
  let accuracy = ACC_THRESHOLDS[0];
  let lastCalculatedPpValue = 0;
  let rawPp = null;
  let isCalculating = false;
  let rankeds = null;

  async function calcOnePpBoundary(playerId, ppValue) {
    if (!playerId || !Number.isFinite(ppValue)) {
      rawPp = null;
      return;
    }

    isCalculating = true;
    rawPp = await worker.calcPpBoundary(playerId, ppValue);
    isCalculating = false;

    lastCalculatedPpValue = ppValue;
  }

  async function calcPpFromStars(stars, acc) {
    const newRawPpFromStars = ppService.PP_PER_STAR * stars * ppService.ppFactorFromAcc(acc);
    const whatIf = (await ppService.getWhatIfScore(playerId, -1, newRawPpFromStars));

    if (!whatIf) return;

    ppValue = whatIf.diff;
  }

  function getStarsForAcc(rawPp, acc) {
    return rawPp / ppService.PP_PER_STAR / ppService.ppFactorFromAcc(acc);
  }

  function getAccForStars(rawPp, stars) {
    return ppService.accFromPpFactor(rawPp / ppService.PP_PER_STAR / stars);
  }

  function calcStarsAndAccFromRawPp(rawPp) {
    let newStars = getStarsForAcc(rawPp, accuracy);
    if (newStars > maxStars) {
      newStars = maxStars;
      accuracy = getAccForStars(rawPp, newStars);
    }

    stars = newStars;
  }

  const debouncedPpCalc = debounce((playerId, ppValue) => calcOnePpBoundary(playerId, ppValue), DEBOUNCE_THRESHOLD);
  const onStarsPercentChange = debounce(() => calcPpFromStars(stars, accuracy), DEBOUNCE_THRESHOLD)

  async function resetCalc(playerId) {
    if (!playerId || !maxStars) return;

    ppValue = 1;
    accuracy = ACC_THRESHOLDS[0];

    const whatIf = (await ppService.getWhatIfScore(playerId, -1, ppService.PP_PER_STAR * maxStars * ppService.ppFactorFromAcc(100)));
    if (whatIf) maxPp = whatIf.diff;
  }

  onMount(async () => {
    rankeds = await rankedService.get();
    maxStars = Math.ceil(Object.values(rankeds).reduce((max, r) => r.stars > max ? r.stars : max, 0) + 1);
  })

  $: resetCalc(playerId)
  $: debouncedPpCalc(playerId, ppValue);
  $: calcStarsAndAccFromRawPp(rawPp);
</script>

<div>
  <section>
    {#if Number.isFinite(rawPp)}
      <Badge
        label={`+ ${formatNumber(ppValue)}pp`}
        title={`Determines how many raw PPs in the new play you need to achieve to increase your total PP by ${formatNumber(ppValue)}pp`}
        value={isCalculating || lastCalculatedPpValue !== ppValue ? 'Calculating...' : rawPp}
        type={isCalculating || lastCalculatedPpValue !== ppValue ? 'text' : 'number'}
        digits={2}
        suffix=" raw pp new play"
        fluid={true}
        bgColor="var(--ppColour)"
      />

      <div class="columns is-desktop">
        <div class="column">
          <div>
            <label>Desired +PP</label>

            <div class="range">
              <input type="range" min="1" max={maxPp} step="0.5" bind:value={ppValue}/>
              <span><Value value={ppValue} suffix="pp" withZeroSuffix={true}/></span>
            </div>
          </div>

          <div>
            <label>Accuracy</label>

            <div class="range">
              <input type="range" min="70" max="100" step="0.1" bind:value={accuracy} on:input={onStarsPercentChange}/>
              <span><Value value={accuracy} suffix="%" withZeroSuffix={true}/></span>
            </div>
          </div>

          <div>
            <label>Stars</label>

            <div class="range">
              <input type="range" min="0.1" max={maxStars} step="0.01" bind:value={stars}
                     on:input={onStarsPercentChange}/>
              <span><Value value={stars} suffix="*" withZeroSuffix={true}/></span>
            </div>
          </div>
        </div>

        <div class="column">
          <table>
            <thead>
            <tr>
              {#each ACC_THRESHOLDS as threshold (threshold)}
                <th>{threshold}%</th>
              {/each}
            </tr>
            </thead>

            <tbody>
            <tr>
              {#each ACC_THRESHOLDS as threshold (threshold)}
                <td><Value value={ getStarsForAcc(rawPp, threshold) } suffix="*" /></td>
              {/each}
            </tr>
            </tbody>
          </table>
        </div>
      </div>

    {:else}
      <p>No PP data.</p>
    {/if}
  </section>
</div>

<style>
    .range {
        display: inline-flex;
    }

    .range > *:first-child {
        margin-right: .5em;
    }

    label {
        display: block;
        font-size: .875em;
        font-weight: normal;
        color: var(--faded) !important;
    }

    input {
        width: 20em;
        max-width: 23em;
    }

    table {
        width: 100%;
    }

    table thead {
        border-bottom: solid 2px var(--dimmed);
    }

    table th, table td {
        text-align: center;
    }

    div :global(section) {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    div :global(section > h3) {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    @media screen and (max-width: 767px) {
        section {
            text-align: center;
        }
    }

    @media screen and (max-width: 449px) {
        table tbody {
            font-size: .875em;
        }
    }
</style>