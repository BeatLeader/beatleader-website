<script>
  import Badge from '../../Common/Badge.svelte'
  import {fade} from 'svelte/transition'
  import AccSaberChart from '../Charts/AccSaberChart.svelte'

  export let categories = null;
  export let playerInfo = null;

  $: playerInfoByCategory = categories && playerInfo && categories.length && playerInfo.length
    ? categories
      .map(c => ({
        ...c,
        playerInfo: playerInfo.find(p => p.category === c.name),
      }))
      .filter(c => c.playerInfo)
    : null;
  $: playerId = playerInfo?.[0]?.playerId ?? null;
</script>

{#if playerInfoByCategory}
  <section class="accsaber" transition:fade>
    <h3 class="title is-6">
      <a href={`https://accsaber.com/player-profile/${playerInfoByCategory?.[0]?.playerInfo?.playerId}`}
         target="_blank">
        <img src="/assets/accsaber-logo.png" alt="AccSaberLogo"/> <span>AccSaber</span>
      </a>
    </h3>

    <div class="stats">
      <div>
        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.rank} prefix="#"
                   digits={0} fluid={true} bgColor="var(--dimmed)"
            />
          {/each}
        </div>

        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.ap} suffix=" AP"
                   fluid={true} bgColor="var(--ppColour)"
            />
          {/each}
        </div>

        {#if playerInfoByCategory?.[0]?.playerInfo?.hmd}
          <div class="hmd-full">
            <Badge label="HMD" value={playerInfoByCategory[0].playerInfo.hmd} fluid={true} bgColor="var(--alternate)"
                   type="text"/>
          </div>
        {/if}
      </div>

      <div>
        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.averageAcc * 100} suffix="%"
                   fluid={true} bgColor="var(--selected)"
            />
          {/each}
        </div>

        <div>
          {#each playerInfoByCategory as category (category.name)}
            <Badge label={category.displayName ?? category.name} value={category.playerInfo.rankedPlays}
                   suffix=" play(s)"
                   digits={0} fluid={true} bgColor="var(--faded)"
            />
          {/each}
        </div>
      </div>

      {#if playerInfoByCategory?.[0]?.playerInfo?.hmd}
        <div class="hmd-small">
          <Badge label="HMD" value={playerInfoByCategory[0].playerInfo.hmd} fluid={true} bgColor="var(--alternate)"
                 type="text"/>
        </div>
      {/if}
    </div>

    <AccSaberChart {playerId} on:height-changed/>
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

    .stats .hmd-full {
        display: none;
    }

    .stats .hmd-small {
        display: block;
    }

    @media screen and (min-width: 1200px) {
        .stats {
            display: grid;
            grid-template-columns: auto auto;
            grid-column-gap: 1em;
        }

        .stats .hmd-full {
            display: block;
        }

        .stats .hmd-small {
            display: none;
        }
    }

    @media screen and (max-width: 768px) {
        h3 {
            text-align: center;
        }
    }
</style>