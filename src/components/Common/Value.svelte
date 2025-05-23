<script>
	import {getContext, onMount} from 'svelte';
	import {configStore} from '../../stores/config';
	import {round, formatNumber, substituteVars} from '../../utils/format';
	import {writable} from 'svelte/store';

	export let value = 0;
	export let prevValue = null;
	export let reversePrevSign = false;
	export let digits = 2;
	export let zero = formatNumber(0, Number.isInteger(digits) ? digits : 2);
	export let withSign = false;
	export let prefix = '';
	export let withZeroPrefix = false;
	export let suffix = '';
	export let suffixPrev = null;
	export let prefixPrev = null;
	export let withZeroSuffix = false;
	export let inline = false;
	export let useColorsForValue = false;
	export let prevLabel = '';
	export let title = null;
	export let prevTitle = null;
	export let prevAbsolute = false;
	export let forcePrev = false;
	export let prevWithSign = true;
	export let canBeSetup = true;

	const isDemo = getContext('isDemo') ?? writable(false);

	let resolvedValue = value;
	let unsubscribe = null;
	function resolveValue(value) {
		if (value && value.subscribe) {
			unsubscribe = value.subscribe(value => (resolvedValue = value));
		} else {
			resolvedValue = value;
		}
	}

	function getFormattedValue(value, digits, withSign, minValue, prefix, suffix, withZeroPrefix, withZeroSuffix) {
		return Number.isFinite(value) && Math.abs(value) > minValue
			? (prefix ?? '') + formatNumber(value, digits, withSign) + (suffix ?? '')
			: (withZeroPrefix ? prefix ?? '' : '') + zero + (withZeroSuffix ? suffix ?? '' : '');
	}

	onMount(() => {
		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	$: resolveValue(value);
	$: minValue = Math.pow(10, -digits - 1);
	$: minDiff = Math.pow(10, -digits);
	$: formatted = getFormattedValue(
		resolvedValue,
		digits,
		withSign,
		minValue,
		prefix,
		suffix,
		withZeroPrefix,
		withZeroSuffix,
		configStore && $configStore
	);
	$: showPrevValue =
		(Number.isFinite(prevValue) && resolvedValue !== null && Math.abs(round(prevValue - resolvedValue, digits)) >= minDiff) || forcePrev;
	$: prevFormatted =
		(configStore,
		$configStore,
		prevValue && Number.isFinite(prevValue)
			? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits, prevWithSign) + (suffix ?? '')
			: '');
	$: prevLabelFormatted =
		(configStore,
		$configStore,
		prevValue && Number.isFinite(prevValue) ? (prevLabel ? prevLabel + ': ' : '') + formatNumber(prevValue, digits) + (suffix ?? '') : '');
	$: prevDiff = Number.isFinite(prevValue) ? (prevAbsolute ? prevValue : resolvedValue - prevValue) * (reversePrevSign ? -1 : 1) : null;
	$: prevDiffFormatted = Number.isFinite(prevDiff)
		? (configStore,
		  $configStore,
		  resolvedValue,
		  Number.isFinite(prevDiff)
				? (prefixPrev ?? '') + formatNumber(prevDiff, digits, !prevAbsolute) + (suffixPrev ? suffixPrev : suffix ?? '')
				: '')
		: null;
	$: prevClass =
		(prevDiff !== null ? (prevDiff > minValue ? 'inc' : prevDiff < -minValue ? 'dec' : 'zero') : '') +
		(!inline ? ' block' : ' inline') +
		' prev';
	$: mainClass =
		useColorsForValue && resolvedValue ? (resolvedValue > minValue ? 'inc' : resolvedValue < -minValue ? 'dec' : 'zero') : 'value';
	$: prevTitleFormatted = substituteVars(prevTitle ? prevTitle : '${value}', {value: prevLabelFormatted});
</script>

<span class={mainClass} title={$isDemo && canBeSetup ? 'Click to setup' : title}
	><slot name="value" value={resolvedValue} {formatted}>{formatted}</slot></span
>{#if showPrevValue}
	<small class={`has-pointer-events ${prevClass}`} title={$isDemo && canBeSetup ? 'Click to setup' : prevTitleFormatted}
		><slot name="prev" value={prevValue} formatted={prevFormatted} diff={prevDiff} diffFormatted={prevDiffFormatted}
			>{prevDiffFormatted}</slot
		></small
	>{/if}

<style>
	small.block {
		display: block;
	}
	small.inline {
		margin-left: 0.2em;
	}
</style>
