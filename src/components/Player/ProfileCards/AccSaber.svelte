<script>
  import {createEventDispatcher} from 'svelte'
  import {fade} from 'svelte/transition'
  import {addToDate, DAY, formatDateRelative, toAccSaberMidnight} from '../../../utils/date'
  import createAccSaberService from '../../../services/accsaber'
  import Badge from '../../Common/Badge.svelte'
  import AccSaberChart from '../Charts/AccSaberChart.svelte'

  export let categories = null;
  export let playerInfo = null;

  const dispatch = createEventDispatcher();

  let gainDaysAgo = 1;

  const accSaberService = createAccSaberService();

  let playerHistory = null;
  let playerHistoryGain = null;

  function refreshHistoryGain(playerId, playerHistory, daysAgo = 1) {
    playerHistoryGain = null;

    if (!playerId || (!playerHistory?.length)) return;

    const todayAccSaberDate = toAccSaberMidnight(new Date());

    let playerHistoryItem = accSaberService.getPlayerGain(playerHistory, daysAgo, daysAgo + 7 - 1);
    if (!playerHistoryItem) return;

    const gainDaysAgo = Math.floor((todayAccSaberDate - playerHistoryItem.accSaberDate) / DAY);

    playerHistoryGain = {...playerHistoryItem, gainDaysAgo, gainType: 'accsaber'};

    dispatch('player-gain-changed', playerHistoryGain);
  }

  async function refreshPlayerHistory(playerId) {
    playerHistory = null;

    if (!playerId) return;

    playerHistory = await accSaberService.getPlayerHistory(playerId) ?? null;
  }

  function getPlayerInfoByCategory(categories, playerInfo, playerHistoryGain) {
    return categories && playerInfo && categories.length && playerInfo.length
      ? categories
        .map(c => ({
          ...c,
          playerInfo: playerInfo.find(p => p.category === c.name),
        }))
        .map(c => ({
          ...c,
          prevPlayerInfo: c.playerInfo && playerHistoryGain?.categories?.[c.name]
            ? {
              ...c.playerInfo,
              ...playerHistoryGain?.categories?.[c.name],
              gainDaysAgo: c.playerInfo && playerHistoryGain ? playerHistoryGain.gainDaysAgo : null,
            }
            : null,
        }))
        .filter(c => c.playerInfo)
      : null
  }

  $: playerInfoByCategory = getPlayerInfoByCategory(categories, playerInfo, playerHistoryGain);
  $: playerId = playerInfo?.[0]?.playerId ?? null;
  $: refreshPlayerHistory(playerId)
  $: refreshHistoryGain(playerId, playerHistory, gainDaysAgo)
</script>

{#if playerInfoByCategory}
  <section class="accsaber" transition:fade>
    <h3 class="title is-6">
      <a href={`https://accsaber.com/player-profile/${playerInfoByCategory?.[0]?.playerInfo?.playerId}`}
         target="_blank" rel="noreferrer">
        <img src="/assets/accsaber-logo.png" alt="AccSaberLogo"/> <span>AccSaber</span>
      </a>
    </h3>

    <div class="stats">
      <div>
        <div>
          {#if playerInfoByCategory?.[0]?.playerInfo?.hmd}
            <Badge label="HMD" value={playerInfoByCategory[0].playerInfo.hmd} fluid={true} bgColor="var(--alternate)"
                   type="text"
            />
          {/if}

          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.rank} prefix="#"
                   prevValue={category?.prevPlayerInfo?.rank}
                   prevLabel={category?.prevPlayerInfo?.rank && Number.isFinite(category?.prevPlayerInfo?.gainDaysAgo) ? formatDateRelative(addToDate(-category?.prevPlayerInfo?.gainDaysAgo * DAY)) : null}
                   reversePrevSign={true}
                   digits={0} fluid={true} inline={true} bgColor="var(--dimmed)"
            />
          {/each}
        </div>

        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.ap}
                   prevValue={category?.prevPlayerInfo?.ap}
                   prevLabel={category?.prevPlayerInfo?.ap && Number.isFinite(category?.prevPlayerInfo?.gainDaysAgo) ? formatDateRelative(addToDate(-category?.prevPlayerInfo?.gainDaysAgo * DAY)) : null}
                   suffix=" AP" fluid={true} inline={true} bgColor="var(--ppColour)"
            />
          {/each}
        </div>
      </div>

      <div>
        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.averageAcc * 100} suffix="%"
                   prevValue={category?.prevPlayerInfo?.averageAcc ? category?.prevPlayerInfo?.averageAcc * 100 : null}
                   prevLabel={category?.prevPlayerInfo?.averageAcc && Number.isFinite(category?.prevPlayerInfo?.gainDaysAgo) ? formatDateRelative(addToDate(-category?.prevPlayerInfo?.gainDaysAgo * DAY)) : null}
                   fluid={true} inline={true} bgColor="var(--selected)"
            />
          {/each}
        </div>

        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.rankedPlays}
                   suffix=" play(s)"
                   prevValue={category?.prevPlayerInfo?.rankedPlays}
                   prevLabel={category?.prevPlayerInfo?.rankedPlays && Number.isFinite(category?.prevPlayerInfo?.gainDaysAgo) ? formatDateRelative(addToDate(-category?.prevPlayerInfo?.gainDaysAgo * DAY)) : null}
                   prevSuffix=" "
                   digits={0} fluid={true} inline={true} bgColor="var(--faded)"
            />
          {/each}
        </div>
      </div>
    </div>

    <AccSaberChart {playerId} {playerHistory} on:height-changed/>
  </section>
{/if}

<style>
    section {
        width: 100%;
        padding: .5em 0;
    }

    h3 {
        padding: .25em 0;
        margin-bottom: .75em !important;
        font-size: 1.25em;
    }

    h3 a {
        display: inline-flex;
        align-items: center;
    }

    h3 a img {
        margin-right: .5em;
    }

    img {
        width: 2em;
        height: 2em;
    }

    .stats :global(.badge .value .prev.inc),
    .stats :global(.badge .value .prev.dec) {
        color: inherit!important;
    }

    @media screen and (min-width: 1200px) {
        .stats {
            display: grid;
            grid-template-columns: auto auto;
            grid-column-gap: 1em;
        }
    }

    @media screen and (max-width: 768px) {
        h3 {
            text-align: center;
        }
    }
</style>