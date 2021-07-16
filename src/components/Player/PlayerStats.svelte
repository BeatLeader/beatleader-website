<script>
  import {SS_HOST} from '../../network/scoresaber/page-queue'
  import {PLAYERS_PER_PAGE} from '../../utils/scoresaber/consts'
  import {opt} from '../../utils/js'

  import Value from '../Common/Value.svelte'
  import Status from './Status.svelte'
  import Skeleton from '../Common/Skeleton.svelte'

  export let name;
  export let playerInfo;
  export let prevInfo;
  export let skeleton = false;
  export let centered = false;

  $: rank = playerInfo ? (playerInfo.rankValue ? playerInfo.rankValue : playerInfo.rank) : null;
</script>

{#if skeleton}
  <h1 class="title is=4 has-text-centered-mobile" class:centered>
    <Skeleton width="50%"/>
  </h1>
  <h2 class="title is-5" class:centered>
    <Skeleton width="50%"/>
  </h2>
{:else if playerInfo}
  <h1 class="title is-4 has-text-centered-mobile" class:centered>
    {#if name}
      {#if playerInfo.externalProfileUrl}
        <a href={playerInfo.externalProfileUrl} target="_blank" rel="noopener">{name}</a>
      {:else}
        {name}
      {/if}
    {/if}

    <span class="pp">
      <Value value={opt(playerInfo, 'pp')} suffix="pp" prevValue={opt(prevInfo, 'pp')} prevLabel={opt(prevInfo, 'ppSince')}
             inline={true} zero="0pp"/>
    </span>

    <span class="status"><Status {playerInfo}/></span>
  </h1>

  <h2 class="title is-5" class:centered>
    <a href={rank ? `${SS_HOST}/global/${rank ? Math.floor((rank-1) / PLAYERS_PER_PAGE) + 1 : ''}` : '#'}>
      <i class="fas fa-globe-americas"></i>

      <Value value={opt(playerInfo, 'rank')} prevValue={opt(prevInfo, 'rank')} prevLabel={opt(prevInfo, 'rankSince')}
             prefix="#" digits={0} zero="#0" inline={true} reversePrevSign={true}
      />
    </a>

    {#each opt(playerInfo, 'countries', []) as country}
      <a href={country.rankValue || country.rank ? `${SS_HOST}/global/${Math.floor(((country.rankValue ? country.rankValue : country.rank)-1) / PLAYERS_PER_PAGE) + 1}?country=${country.country}` : '#'}>
        <img
          src={`${SS_HOST}/imports/images/flags/${country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''}.png`}
             alt={opt(country, 'country')}
        />

        <Value value={country.rank} prevValue={country.prevRank}
               prevLabel={country.prevRankSince} prefix="#" digits={0} zero="#0" inline={true}
               reversePrevSign={true}
        />

        {#if country.subRank && country.subRank !== country.rankValue}
          <small>(#{ country.subRank })</small>
        {/if}
      </a>
    {/each}
  </h2>
{/if}

<style>
    h1.centered, h2.centered {
        text-align: center;
        justify-content: center;
    }

    h1.title {
        margin-bottom: .25rem;
    }

    h1 .pp {
        color: var(--ppColour) !important;
        font-size: smaller;
        border-left: 1px solid var(--dimmed);
        padding-left: .75rem;
        margin-left: .5rem;
    }

    h1 .status {
        font-size: smaller;
    }

    h2.title {
        display: flex;
        margin-bottom: 1rem;
    }

    h2 a {
        border-right: 1px solid var(--dimmed);
        padding: 0 .5rem;
    }

    h2 a:first-of-type {
        padding-left: 0;
    }

    h2 a:last-of-type {
        border-right: none;
    }

    h2 a i {
        color: var(--textColor);
        font-size: smaller;
        position: relative;
        top: -1px;
    }

    h2 a img {
        margin-bottom: 2px;
    }

    @media (max-width: 768px) {
        h2 {
            justify-content: center;
        }
    }
</style>