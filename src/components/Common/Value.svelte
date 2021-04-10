<script>
    import {formatNumber} from '../../utils/format'
    import {onMount} from 'svelte'

    export let value = 0;
    export let prevValue = null;
    export let reversePrevSign = false;
    export let digits = 2;
    export let zero = formatNumber(0, Number.isInteger(digits) ? digits : 2);
    export let withSign = false;
    export let prefix = "";
    export let withZeroPrefix = false;
    export let suffix = "";
    export let suffixPrev = null;
    export let withZeroSuffix = false;
    export let inline = false;
    export let useColorsForValue = false;
    export let prevLabel = "";
    export let title = '';
    export let prevTitle = null;


    let resolvedValue = value;
    let unsubscribe = null;
    function resolveValue(value) {
      if (value?.subscribe) {
        unsubscribe = value.subscribe(value => resolvedValue = value);
      } else {
        resolvedValue = value;
      }
    }

    onMount(() => {
      return () => {
        if (unsubscribe) unsubscribe();
      }
    })

    $: {
      resolveValue(value);
    }
    $: minValue = Math.pow(10, -digits-1)
    $: formatted = (Math.abs(resolvedValue) > minValue ? prefix + formatNumber(resolvedValue, digits, withSign)
      + suffix : (withZeroPrefix ? prefix : "") + zero + (withZeroSuffix ? suffix : ""));
    $: showPrevValue = prevValue && prevValue !== resolvedValue && resolvedValue !== null;
    $: prevFormatted = prevValue ? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits, withSign) + suffix : ""
    $: prevDiffFormatted = prevValue ? formatNumber((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1), digits, true) + (suffixPrev ? suffixPrev : suffix) : ""
    $: prevClass = (prevValue ? ((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) > minValue ? "inc" : ((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) < -minValue ? "dec" : "zero")): "") + (!inline ? " block" : " inline") + ' prev';
    $: mainClass = (useColorsForValue && resolvedValue ? (resolvedValue > minValue ? "inc" : (resolvedValue < -minValue ? "dec" : "zero")): "");
</script>

<span class={mainClass} {title}>{formatted}</span>{#if showPrevValue} <small class={prevClass} title={prevTitle ? prevTitle : prevFormatted}>{prevDiffFormatted}</small>{/if}

<style>
    small.block {display: block;}
    small.inline {margin-left: .5em;}
</style>
