<script>
  import {formatNumber} from '../../utils/format'
  import {configStore} from '../../stores/config'
  import Value from '../Common/Value.svelte'

  export let name = null;
  export let value = 0;
  export let percentage = 0;
  export let color = '#6fdb6f';
  export let background = 'transparent';
  export let digits = 2;
  export let valueProps = {};
  export let animDuration = 1000;

  export let compareToValue = null;
  export let compareToPercentage = null;
  export let compareToName = null;

  $: percentageValue = (1 - percentage) * 440;
  $: percentageValueFormatted = (configStore, $configStore, formatNumber(percentage * 100, digits));

  $: compareToPercentageValueFormatted = (configStore, $configStore, compareToPercentage ? formatNumber(compareToPercentage * 100, digits) : null);
</script>

<div class="donut" style="--percentage:{percentageValue ? percentageValue : 0};--duration: {animDuration}; --backgroundColor: {background}">
  <span>
    <Value {value} {...valueProps} title={percentageValueFormatted + '%'} prevTitle={compareToPercentageValueFormatted + '%'} prevValue={compareToValue} prevAbsolute={true} prevWithSign={false}>
      <svelte:fragment slot="prev" let:formatted let:value>
        {#if value}<small>{formatted}</small>{/if}
      </svelte:fragment>
    </Value>
  </span>
  <svg width="100%" height="100%" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
    <g>
      <circle id="circle" class="circle_animation" r="69.85699" cy="81" cx="81" stroke-width="12" stroke="{color}" fill="none"/>
    </g>
  </svg>
</div>

<style>
    .donut {
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 4.5em;
        height: 4.5em;
        font-size: .875em;
        background-color: var(--backgroundColor);
        border-radius: 50%;
    }

    .donut > span {
        z-index: 1;
    }

    svg {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        transform: rotate(-90deg);
    }

    .circle_animation {
        stroke-dasharray: 440;
        stroke-dashoffset: var(--percentage, 0)!important;

        -webkit-animation: donut var(--duration)ms ease-out forwards;
        animation: donut var(--duration)ms ease-out forwards;
    }

    .donut > span :global(small) {
        line-height: 1;
        text-align: center;
        color: var(--faded);
    }
</style>