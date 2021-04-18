<script>
  import {SS_HOST} from '../../network/scoresaber/page'
  import {PLAYERS_PER_PAGE} from '../../scoresaber/consts'

  import Value from '../Common/Value.svelte'
  import Status from './Status.svelte'
  import Skeleton from '../Common/Skeleton.svelte'

  export let playerInfo;
  export let prevInfo;
  export let skeleton = false;
</script>

{#if playerInfo}
  <h1 class="title is-4 has-text-centered-mobile">
    {#if playerInfo?.playerName}
      {#if playerInfo.externalProfileUrl}
        <a href={playerInfo.externalProfileUrl} target="_blank" rel="noopener">{playerInfo.playerName}</a>
      {:else}
        {playerInfo.playerName}
      {/if}
    {/if}

    <span class="pp">
      <Value value={playerInfo?.pp} suffix="pp" prevValue={prevInfo?.pp} prevLabel={prevInfo?.ppSince} inline={true}/>
    </span>

    <span class="status"><Status {playerInfo}/></span>
  </h1>

  <h2 class="title is-5">
    <a href={playerInfo.rankValue ? `${SS_HOST}/global/${playerInfo.rankValue ? Math.floor((playerInfo.rankValue-1) /
    PLAYERS_PER_PAGE) + 1 : ''}` : '#'}>
      <i class="fas fa-globe-americas"></i>

      <Value value={playerInfo?.rank} prevValue={prevInfo?.rank} prevLabel={prevInfo?.rankSince} prefix="#"
             digits={0} zero="#0" inline={true} reversePrevSign={true}
      />
    </a>

    {#each playerInfo.countries ?? [] as country}
      <a
        href={country.rankValue ? `${SS_HOST}/global/${Math.floor((country.rankValue-1) / PLAYERS_PER_PAGE) + 1}?country=${country.country}` : '#'}>
        <img src={`${SS_HOST}/imports/images/flags/${country?.country?.toLowerCase()}.png`}
             alt={country?.country}
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
{:else if skeleton}
  <h1 class="title is=4 has-text-centered-mobile">
    <Skeleton width="50%"/>
  </h1>
  <h2 class="title is-5">
    <Skeleton width="50%"/>
  </h2>
{/if}

<style>
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