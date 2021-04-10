<script>
    import {formatNumber} from '../../utils/format'

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

    $: minValue = Math.pow(10, -digits-1)
    $: formatted = (Math.abs(value) > minValue ? prefix + formatNumber(value, digits, withSign) + suffix : (withZeroPrefix ? prefix : "") + zero + (withZeroSuffix ? suffix : ""));
    $: showPrevValue = prevValue && prevValue !== value && value !== null;
    $: prevFormatted = prevValue ? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits, withSign) + suffix : ""
    $: prevDiffFormatted = prevValue ? formatNumber((value - prevValue) * (reversePrevSign ? -1 : 1), digits, true) + (suffixPrev ? suffixPrev : suffix) : ""
    $: prevClass = (prevValue ? ((value - prevValue) * (reversePrevSign ? -1 : 1) > minValue ? "inc" : ((value - prevValue) * (reversePrevSign ? -1 : 1) < -minValue ? "dec" : "zero")): "") + (!inline ? " block" : " inline") + ' prev';
    $: mainClass = (useColorsForValue && value ? (value > minValue ? "inc" : (value < -minValue ? "dec" : "zero")): "");
</script>

<span class={mainClass} {title}>{formatted}</span>{#if showPrevValue} <small class={prevClass} title={prevTitle ? prevTitle : prevFormatted}>{prevDiffFormatted}</small>{/if}

<style>
    small.block {display: block;}
    small.inline {margin-left: .5em;}
</style>
