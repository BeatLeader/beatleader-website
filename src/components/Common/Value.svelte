<script>
    import {onMount} from 'svelte'
    import {configStore} from '../../stores/config'
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
    export let title = null;
    export let prevTitle = null;
    export let prevAbsolute = false;
    export let forcePrev = false;
    export let prevWithSign = true;

    let resolvedValue = value;
    let unsubscribe = null;
    function resolveValue(value) {
      if (value && value.subscribe) {
        unsubscribe = value.subscribe(value => resolvedValue = value);
      } else {
        resolvedValue = value;
      }
    }

    function getFormattedValue(value, digits, withSign, minValue, prefix, suffix, withZeroPrefix, withZeroSuffix) {
      return Number.isFinite(value) && Math.abs(value) > minValue
        ? prefix + formatNumber(value, digits, withSign) + suffix
        : (withZeroPrefix ? prefix : "") + zero + (withZeroSuffix ? suffix : "")
    }

    onMount(() => {
      return () => {
        if (unsubscribe) unsubscribe();
      }
    })

    $: resolveValue(value);
    $: minValue = Math.pow(10, -digits-1)
    $: formatted = getFormattedValue(resolvedValue, digits, withSign, minValue, prefix, suffix, withZeroPrefix, withZeroSuffix, configStore && $configStore);
    $: showPrevValue = Number.isFinite(prevValue) && prevValue !== resolvedValue && resolvedValue !== null || forcePrev;
    $: prevFormatted = (configStore, $configStore, prevValue && Number.isFinite(prevValue) ? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits, prevWithSign) + suffix : "")
    $: prevDiff = Number.isFinite(prevValue) ? (prevAbsolute ? prevValue : resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) : null;
    $: prevDiffFormatted = Number.isFinite(prevDiff) ? (configStore, $configStore, resolvedValue, Number.isFinite(prevDiff) ? formatNumber(prevDiff, digits, !prevAbsolute) + (suffixPrev ? suffixPrev : suffix) : "") : null
    $: prevClass = (prevDiff !== null ? (prevDiff > minValue ? "inc" : (prevDiff < -minValue ? "dec" : "zero")): "") + (!inline ? " block" : " inline") + ' prev';
    $: mainClass = (useColorsForValue && resolvedValue ? (resolvedValue > minValue ? "inc" : (resolvedValue < -minValue ? "dec" : "zero")): "");
    $: prevTitleFormatted = substituteVars(prevTitle ? prevTitle : "${value}", {value: prevFormatted})
</script>

<span class={mainClass} {title}><slot name="value" value={resolvedValue} {formatted}>{formatted}</slot></span>{#if showPrevValue} <small class={prevClass} title={prevTitleFormatted}><slot name="prev" value={prevValue} formatted={prevFormatted} diff={prevDiff} diffFormatted={prevDiffFormatted}>{prevDiffFormatted}</slot></small>{/if}

<style>
    small.block {display: block;}
    small.inline {margin-left: .5em;}
</style>
