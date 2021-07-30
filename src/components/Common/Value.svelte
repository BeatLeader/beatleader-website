<script>
    import {onMount} from 'svelte'
    import createConfigStore from '../../stores/config'
    import {formatNumber, substituteVars} from '../../utils/format'
    import {fade} from 'svelte/transition'

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

    let configStore = null;
    (async () => configStore = await createConfigStore())();

    let resolvedValue = value;
    let unsubscribe = null;
    function resolveValue(value) {
      if (value && value.subscribe) {
        unsubscribe = value.subscribe(value => resolvedValue = value);
      } else {
        resolvedValue = value;
      }
    }

    function getFormattedValue(value, minValue) {
      return Math.abs(resolvedValue) > minValue
        ? prefix + formatNumber(resolvedValue, digits, withSign) + suffix
        : (withZeroPrefix ? prefix : "") + zero + (withZeroSuffix ? suffix : "")
    }

    onMount(() => {
      return () => {
        if (unsubscribe) unsubscribe();
      }
    })

    $: resolveValue(value);
    $: minValue = Math.pow(10, -digits-1)
    $: formatted = getFormattedValue(value, minValue, configStore && $configStore);
    $: showPrevValue = prevValue && prevValue !== resolvedValue && resolvedValue !== null;
    $: prevFormatted = prevValue ? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits, withSign) + suffix : ""
    $: prevDiffFormatted = prevValue ? formatNumber((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1), digits, true) + (suffixPrev ? suffixPrev : suffix) : ""
    $: prevClass = (prevValue ? ((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) > minValue ? "inc" : ((resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) < -minValue ? "dec" : "zero")): "") + (!inline ? " block" : " inline") + ' prev';
    $: mainClass = (useColorsForValue && resolvedValue ? (resolvedValue > minValue ? "inc" : (resolvedValue < -minValue ? "dec" : "zero")): "");

    $: prevTitleFormatted = substituteVars(prevTitle ? prevTitle : "${value}", {value: prevFormatted})
</script>

<span class={mainClass} {title}>{formatted}</span>{#if showPrevValue} <small class={prevClass} title={prevTitleFormatted} transition:fade>{prevDiffFormatted}</small>{/if}

<style>
    small.block {display: block;}
    small.inline {margin-left: .5em;}
</style>
