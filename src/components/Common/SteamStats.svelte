<script>
    import playerSteamStatsClient from '../../network/clients/scoresaber/players/api-steam-stats'
    import Flag from './Flag.svelte'
  
    export let playerId;

    let promise = Promise.resolve([]);
  
    function fetchSteamStats() {
        promise = playerSteamStatsClient.getProcessed({playerId, fullResponse: false, priority: 3, options: {}})
    }
    fetchSteamStats();
    
  </script>
  
  {#await promise}
    <p>...</p>
  {:then stats}
  {#if stats}
    <p>Playtime 2w: <span style="color: #8992e8">{stats.lastTwoWeeks}</span>h ∞: <span style="color: #8992e8">{stats.allTime}</span>h   </p>
  {/if}
    {:catch error}
    <p style="color: red">{error.message}</p>
    {/await}
  
  <style>
      p {
          margin-right: 8px;
      }
  </style>