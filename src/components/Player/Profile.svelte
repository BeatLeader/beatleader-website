<script>
  import {SS_HOST} from '../../network/scoresaber/page'
  import {PLAYERS_PER_PAGE} from '../../scoresaber/consts';
  import Value from '../Common/Value.svelte'
  import Spinner from '../Common/Spinner.svelte'
  import Error from '../Common/Error.svelte'
  import Badge from '../Common/Badge.svelte'
  import {fade} from 'svelte/transition'
  import processPlayerData from './utils/profile';
  import Name from './Name.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;

  $: ({playerInfo, prevInfo, basicStats, ssBadges} = processPlayerData(playerData))
</script>

<section class="player-profile" class:loading={isLoading}>
  <div class="box has-shadow">
    <div class="columns">
      <div class="column is-narrow avatar enlarge">
        {#if playerInfo}<img src={playerInfo.avatar} class="avatar" alt="Avatar"/>{/if}
        <span class="spinner">
            <Spinner width="100%" height="100%"/>
          </span>
      </div>

      <div class="column">
        <div class="columns player-name">
          <div class="column">
            {#if error}
              <div>
                <Error {error}/>
              </div>
            {/if}

            {#if playerInfo}
              <h1 class="title is-4">
                <Name {playerInfo} />

                <span class="pp"><Value value={playerInfo?.pp} suffix="pp" prevValue={prevInfo?.pp}
                                        prevLabel={prevInfo?.ppSince} inline={true}/></span>

                {#if playerInfo.banned}<span class="status banned">Banned</span>{/if}
                {#if playerInfo.inactive}<span class="status inactive">Inactive</span>{/if}
              </h1>
              <h2 class="title is-5 ranks">
                <a
                  href={playerInfo.rank ? `${SS_HOST}/global/${playerInfo.rank ? Math.floor((playerInfo.rank-1) / PLAYERS_PER_PAGE) + 1 : ''}` : '#'}
                  data-type="global" data-rank={playerInfo.rank}>
                  <i class="fas fa-globe-americas"></i>
                  <Value value={playerInfo?.rank} prevValue={prevInfo?.rank} prevLabel={prevInfo?.rankSince} prefix="#"
                         digits={0} zero="#0" inline={true} reversePrevSign={true}/>
                </a>

                {#each playerInfo.countries ?? [] as country}
                  <a
                    href={country.rank ? `${SS_HOST}/global/${Math.floor((country.rank-1) / PLAYERS_PER_PAGE) + 1}?country=${country.country}` : '#'}>
                    <img src={`${SS_HOST}/imports/images/flags/${country?.country?.toLowerCase()}.png`}
                         alt={country?.country}>
                    <Value value={country.rank} prevValue={country.prevRank}
                           prevLabel={country.prevRankSince} prefix="#" digits={0} zero="#0" inline={true}
                           reversePrevSign={true}/>
                    {#if country.subRank && country.subRank !== country.rank}
                      <small>(#{ country.subRank })</small>
                    {/if}
                  </a>
                {/each}
              </h2>
            {/if}
          </div>
        </div>

        {#if basicStats || ssBadges}
        <div class="columns">
          <div class="column">
            {#if basicStats}
              <div class="badges">
                {#each basicStats as stat}
                  <Badge {...stat}/>
                {/each}
              </div>
            {/if}

            {#if ssBadges}
            <div class="badges ss-badges" transition:fade={{ duration: 500 }}>
              {#each ssBadges as ssBadge (ssBadge.src)}
                <img src={ssBadge.src} alt={ssBadge.title} title={ssBadge.title}/>
              {/each}
            </div>
            {/if}
          </div>
        </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
    .column.avatar {
        position: relative;
        text-align: center;
        margin-right: 1rem;
    }

    .column.avatar.enlarge img {
        border-radius: 50%;
        width: 150px;
        height: 150px;
        transition: transform 300ms;
    }

    .player-profile.loading .column.avatar img {
        transform: scale(.7);
    }

    .column.avatar.main img {
        border: 2px solid var(--increase, '#42b129');
    }

    .spinner {
        display: none;
        position: absolute;
        width: 150px;
        height: 150px;
        top: .75rem;
        left: .75rem;
        color: var(--faded);
    }

    .player-profile.loading .spinner {
        display: inline-block;
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

    .ss-badges {
        max-width: 90%;
        display: flex;
        flex-wrap: wrap;
    }
    .ss-badges img {
        margin-right: .5rem;
        margin-bottom: .25rem;
    }

    h1 .status {
        font-size: smaller;
        border-left: 1px solid var(--dimmed);
        padding-left: .75rem;
        margin-left: .5rem;
    }

    .banned {
        color: var(--decrease);
    }

    .inactive {
        color: var(--faded);
    }
</style>