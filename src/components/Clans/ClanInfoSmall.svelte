<script>
  import {fade} from 'svelte/transition'
  import Badge from '../Common/Badge.svelte'

  export let clan;

  document.body.classList.remove('slim');

  let name = '';
  let tag = '';
  let color = '';
  let description = '';
  let iconUrl = null;
  let iconData = null;

  function updateFields(clan) {
    name = clan?.name ?? '';
    tag = clan?.tag ?? '';
    color = clan?.color ?? '#ff0000';
    iconUrl = clan?.icon ?? 'https://cdn.beatleader.xyz/assets/NTG.png';
    iconData = clan?.icon ?? null;
    description = clan?.description ?? '';
  }

  $: updateFields(clan)
  $: playersCount = clan?.playersCount ?? 0;

  $: clanAverageAccuracy = clan?.averageAccuracy ? clan.averageAccuracy * 100 : null;
  $: clanAverageRank = clan?.averageRank ?? null;
  $: clanPp = clan?.pp ?? null;
</script>

{#if clan?.id}
<section class="clan-info {tag == "GAY" ? "rainbow" : ""}" transition:fade>
  <div class="clanData">
    <div class="imageInput">
      <img class="clanImage" src="{iconUrl}" alt="ClanIcon"/>
    </div>

    <section class="form">
      <section>
        <section class="title is-5">
            <span style="--clan-color: {color}" class="clanTag">[{tag}]</span>
            <span class="clanName">{name}</span>
        </section>
        <section class="title is-7">
          {#if clan?.tag == "DUH"}
            {playersCount} {playersCount == 1 ? "prayer" : "prayers"}
          {:else}
            {playersCount} {playersCount == 1 ? "player" : "players"}
          {/if}
        </section>

        {#if clan}
          <section class="clan-stats">
            <Badge label="Average Rank" value={clanAverageRank} prefix="#" digits={0} fluid={true} bgColor="var(--decrease)"/>
            <Badge label="Average Acc" value={clanAverageAccuracy} suffix="%" fluid={true} bgColor="var(--selected)"/>
            <Badge label="Total PP" value={clanPp} suffix="pp" fluid={true} bgColor="var(--ppColour)"/>
          </section>
        {/if}
      </section>
      <section class="info desktop">
        <small>{description}</small>
      </section>
      
    </section>

    <section class="info up-to-tablet">
      <small>{description}</small>
    </section>
    
  </div>
</section>
{/if}

<style>
    .clan-info {
        width: 100%;
        border-radius: 15%;
    }

    .clan-info.rainbow:hover {
      color: red;
      -webkit-background-clip: text;
      background-image: -webkit-linear-gradient(180deg,#f35626,#feab3a);
      -webkit-animation: rainbow .60s infinite linear;
    }

    .clanData {
        display: flex;
        gap: 0.8rem;
    }

    .clanData .form {
        flex-grow: 1;
        padding: 0.8rem;
    }

    .clanData .form > section:not(:last-child) {
        margin-bottom: 0.5rem;
    }

    .imageInput {
        cursor: pointer;
        display: flex;
        align-items: center;
        margin-left: 1.5em;
        position: relative;
    }

    .clanImage {
        width: 7em;
        border-radius: 20%;
    }

    .clanTag {
        color: var(--clan-color, 'red');
    }

    .clan-stats :global(>*) {
        margin-bottom: 0!important;
    }

    .info {
      max-width: 92%;
      overflow: hidden;
      word-break: break-all;
    }

    .up-to-tablet {
      display: none;
    }

    .desktop {
          display: block;
        }

    @media screen and (max-width: 500px) {
        .clanData {
            flex-direction: column;
            align-items: center;
            gap: 0;
        }

        .clan-stats {
            display: flex;
            flex-direction: column;
        }

        .imageInput {
          margin: 0.7em;
        }

        .up-to-tablet {
          display: block;
        }

        .desktop {
          display: none;
        }
    }
</style>