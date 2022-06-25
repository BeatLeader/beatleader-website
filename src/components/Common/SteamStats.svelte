<script>
    export let player;

    $: lastTwoWeeksTime = player && player.playerInfo && player.playerInfo.lastTwoWeeksTime ? player.playerInfo.lastTwoWeeksTime.toFixed(2) : null;
    $: allTime = player && player.playerInfo && player.playerInfo.allTime ? player.playerInfo.allTime.toFixed(2) : null;
  </script>
  
  {#if lastTwoWeeksTime}
    <div title="{lastTwoWeeksTime} hours played last 2 weeks. And {allTime} hours played all time."><span style="color: #8992e8">{lastTwoWeeksTime}</span>|<span style="color: #8992e8">{allTime}</span>h </div>
  {/if}
  
  <style>
      div {
          margin-right: .5rem;
      }
  </style>