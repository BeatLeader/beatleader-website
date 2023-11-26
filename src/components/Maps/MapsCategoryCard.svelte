<script>
  import rankedTimer from '../../stores/ranked-timer';
  import {fade} from 'svelte/transition';

  export let categoryName;
  export let showRankedCounter;
  export let cardHeight = 400;
  export let bgColor = "#292823";

</script>

<div class="card" style="height: {cardHeight}px; background: {bgColor} !important;">
  <h1>{categoryName}</h1>

  {#if showRankedCounter && $rankedTimer}
    <div class="rankedBatchCounter" transition:fade>
      <span class="counterHeader">Next batch in:</span>
      {#if $rankedTimer.days > 0}
        <span class="countdown">{$rankedTimer.days} Days</span>
      {:else if $rankedTimer.hours > 0}
        <span class="countdown">{$rankedTimer.hours} Hours</span>
      {:else if $rankedTimer.minutes > 0}
        <span class="countdown">{$rankedTimer.minutes} Minutes</span>
      {:else}
        <span class="countdown">{$rankedTimer.seconds} Seconds</span>
      {/if}
    </div>
  {/if}

  
</div>

<style>
  .card {
    width: 100%;
    border-radius: 12px;
    position: relative;
    box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
  }

  h1 {
    position: absolute;
    top: 1em;
    left: 50%;
    transform: translateX(-50%);
    justify-content: center;
    text-align: center;

    color: #fff;
    font-family: Noto Sans SC;
    font-size: 42px;
    
    font-style: normal;
    font-weight: 700;
    line-height: normal;
  }

  .rankedBatchCounter {
    position: absolute;
    bottom: 1.5em;
    left: 50%;
    transform: translateX(-50%);
    justify-content: center;
    text-align: center;
    display: flex;
    flex-direction: column;
  }

  .counterHeader {
    color: #fff;
    font-family: Noto Sans SC;
    font-size: 20px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
  }

  .countdown {
    color: #fff;
    font-family: Noto Sans SC;
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
  }

</style>