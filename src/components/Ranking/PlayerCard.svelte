<script>
    import {navigate} from "svelte-routing";
    import {opt} from '../../utils/js'
    import Value from '../Common/Value.svelte'
    import Avatar from '../Common/Avatar.svelte'
    import Change from '../Common/Change.svelte'
    import Flag from '../Common/Flag.svelte'
    import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte'
    import SteamStats from '../Common/SteamStats.svelte'
    import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'
    import { HSVtoRGB } from '../../utils/color';
    import ClanBadges from '../Player/ClanBadges.svelte'
    import {rankValue, accValue, ppValue, changingValuesClan} from '../../utils/clans'
    import {buildSearchFromFilters} from '../../utils/filters'
  
    export let player;
    export let currentFilters = null;
    export let playerId = null;
    export let withCrown = false;
    export let selectedClanTag = null;
  
    function navigateToPlayer(playerId) {
      if (!playerId) return;
  
      navigate(`/u/${playerId}/beatleader/date/1`)
    }
  
    function onPlayerClick(event, player) {
      const target = event.target;
      if (target && (target.classList.contains('rank') || target.classList.contains('country') || target.classList.contains('sharp') || target.classList.contains('value'))) return;
  
      if (!player) return;
  
      navigateToPlayer(player.playerId)
    }
  
    function onCountryClick(player) {
      if (!player) return;
  
      navigate(`/ranking/${player.playerInfo.countries[0].country}/${Math.floor((player.playerInfo.countries[0].rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
    }
  
    function onGlobalClick(player) {
      if (!player) return;
  
      navigate(`/ranking/global/${Math.floor((player.playerInfo.rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
    }
  
    function showRainbow(player) {
      var result = false;
      player.clans?.forEach(element => {
        if (element.tag == "GAY") {
          result = true;
        }
      });
  
      return result;
    }

    var pp = player?.playerInfo?.pp;
    var rank = player?.playerInfo?.rank;
    var countryRank = player?.playerInfo?.countries[0].rank;
  
    function hoverStats() {
      if (player && player.playerInfo) {
        const firstSpecialClanTag = selectedClanTag ?? changingValuesClan(player.clans);
        pp = ppValue(firstSpecialClanTag, player.playerInfo.pp);
        rank = rankValue(firstSpecialClanTag, rank);
        countryRank = rankValue(firstSpecialClanTag, countryRank);
      }
    }
</script>

<div class={`player-card ${playerId == player.playerId ? "current" : ""} ${showRainbow(player) ? "rainbow" : ""}`} on:click={e => onPlayerClick(e, player)} on:pointerover={() => hoverStats(player)}>
    <div class="player-rank">
      <div class={`rank ${rank === 1 ? 'gold' : (rank === 2 ? 'silver' : (rank === 3 ? 'brown' : (rank >= 10000 ? 'small' : '')))}`} title="Go to global ranking" on:click={e => onGlobalClick(player)}>
        #<Value value={rank} digits={0} zero="?"/>
      </div>
      <div class={`rank ${countryRank === 1 ? 'gold' : (countryRank === 2 ? 'silver' : (countryRank === 3 ? 'brown' : (countryRank >= 10000 ? 'small' : '')))}`} title="Go to country ranking" on:click={e => onCountryClick(player)}>
        #<Value value={countryRank} digits={0} zero="?"/>
        <Flag country={opt(player, 'playerInfo.countries.0.country')} />
      </div>
    </div>
    <div class="player-avatar">
      <Avatar {player}/>
    </div>
    <div class="player-name-and-rank">
      <PlayerNameWithFlag {player} hideFlag={true} withCrown={withCrown}/>
      <span class="change">
        {#if opt(player, 'others.difference') > 900000}
          <span style="margin-left: 0.5em" class="inc" title="This player appeared after a long break.">resurrected</span>
        {:else}
          <Change value={opt(player, 'others.difference')} digits={0}/>
        {/if}
      </span>
      <ClanBadges {player} />
    </div>
    <div class="steam-and-pp">
      {#if player.playerId > 70000000000000000}
        <SteamStats {player}/>
      {/if}
      {#if currentFilters?.sortBy == "dailyImprovements"}<div style="color: {HSVtoRGB(player.others.improvement / 85, 1.0, 1.0)}">
        <Value value={opt(player, 'others.improvement')} zero="Carbon positive" suffix={opt(player, 'others.improvement') == 1 ? " score" : " scores"} digits=0/>
      </div>
      {:else}
      <div style="color: {HSVtoRGB(Math.max(0, pp - 1000) / 18000, 1.0, 1.0)}">
        <Value value={pp} zero="" suffix="pp"/>
      </div>
      {/if}
    </div>
  </div>
  
  <style>
    .player-card {
        display: inline-grid;
        grid-template-columns: 7.5em 4em auto 1fr;
        grid-template-rows: 1fr;
        padding: .2em;
        border: 2px solid var(--dimmed);
        border-radius: 8px;
        background-color: var(--background);
        cursor: pointer;
        font-size: 1.12em;
        align-items: center;
        width: 100%;
    }

    .current {
      border-color: yellow;
    }

    .player-card:hover {
        background-color: var(--faded);
    }

    .player-card.rainbow:hover {
      color: #00ffbc;
      -webkit-background-clip: text;
      background-image: -webkit-linear-gradient(180deg,#f35626,#feab3a);
      -webkit-animation: rainbow .90s infinite linear;
      animation: rainbow .90s infinite linear;
    }

    .player-card .player-avatar {
        position: relative;
        overflow: hidden;
    }

    .player-card .player-avatar :global(figure) {
        width: 2em;
        height: 2em;
        margin-left: 1em;
    }

    .player-card :global(.rank) {
        padding: 0 .25em;
        font-size: 0.8em;
        font-weight: 500;
        background-color: var(--dimmed);
        border-radius: 3px;
        margin-left: .25em;
        cursor: pointer;
        flex: none;
    }

    .player-card .player-name-and-rank {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
    }

    .player-card .steam-and-pp {
        display: flex;
        justify-self: end;
        align-items: center;
        font-size: 0.8em;
        font-weight: 500;
        margin-right: .25em;
    }

    .player-card .player-countryglobal-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .player-card :global(.rank.small) {
        font-size: .875em;
    }

    .player-card :global(.rank.gold) {
        background-color: darkgoldenrod;
    }

    .player-card :global(.rank.silver) {
        background-color: #888;
    }

    .player-card :global(.rank.brown) {
        background-color: saddlebrown;
    }

    .player-card .player-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
    }

    .player-card .change {
        font-size: .875em;
    }

    .banner {
      display: flex;
      justify-content: center;
      margin-bottom: 1em;
    }

    .show-details {
      display: flex;
      justify-content: center;
      margin-bottom: 1em;
    }

    .details {
      margin: 1em;
    }

    .clickable {
      cursor: pointer;
    }

    .reveal-title {
      margin-right: 0.5em;
      margin-bottom: -0.2em;
    }

    .details-reveal.opened {
        transform: rotateZ(180deg);
    }

    @media screen and (max-width: 768px) {
        .player-card {
          grid-template-columns: 50% 50%;
          grid-template-rows: 1fr 1fr;
        }

        .player-card .player-avatar {
          grid-column: 1 / 2;
          grid-row: 1;
          margin-left: -0.8em;
        }

        .player-card .player-name-and-rank {
          grid-column: 1 / 3;
          margin-left: 2.5em;
          grid-row: 1;
        }

        .player-card .player-name-and-rank :global(a) {
          white-space: unset;
          overflow-wrap: break-word;
        }

        .player-card .player-rank {
          grid-column: 1;
          grid-row: 2;
          justify-content: flex-start;
          font-size: 0.8em;
        }

        .player-card .steam-and-pp {
          grid-column: 2;
          grid-row: 2;
        }

        .player-card :global(.rank) {
          font-size: 1em;
        }
    }

    @media (hover: none) {
      .player-card.rainbow {
          color: #00ffbc;
          -webkit-background-clip: text;
          background-image: -webkit-linear-gradient(180deg,#f35626,#feab3a);
          -webkit-animation: rainbow .90s infinite linear;
          animation: rainbow .90s infinite linear;
        }
    }
  </style>