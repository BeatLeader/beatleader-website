<script>
	import {configStore} from '../../../stores/config';
	import {formatNumber, substituteVars} from '../../../utils/format';
	import {hoverable} from '../../../svelte-utils/actions/hoverable';
	import Value from '../Value.svelte';

	export let pp = 0;
	export let bonusPp = 0;
	export let accPp = 0;
	export let techPp = 0;
	export let passPp = 0;
	export let zero = '-';
	export let withZeroSuffix = false;
	export let weighted = null;
	export let improvements = null;
	export let fcPp = null;
	export let color = 'var(--ppColour)';
	export let whatIf = null;
	export let suffix = 'pp';

	let tooltipOpacity = 0;
	let tooltipX = null;
	let tooltipY = null;

	const onHover = event => {
		tooltipY = event.detail.rect.top + 24;
		tooltipX = event.detail.rect.left - 8;
		tooltipOpacity = 1;
	};
	const onUnhover = () => (tooltipOpacity = 0);

	let prevValue = null;
	let prevWithSign = false;
	let prevAbsolute = false;
	let forcePrev = false;
	let prevTemplate = '( ${formatted} )';
	let prevTitle = null;

	function onUpdate(type, pp, weighted, improvements) {
		switch (type) {
			case 'empty':
				prevValue = null;
				break;

			case 'improvement':
				prevValue = improvements?.pp ?? null;
				if (!prevValue) {
					onUpdate('weighted', pp, weighted, improvements);
					return;
				}

				prevWithSign = true;
				prevAbsolute = true;
				forcePrev = false;
				prevTemplate = prevValue ? '${formatted}' : '';
				break;

			case 'total-gain':
				prevValue = improvements?.totalPp ?? null;
				if (!prevValue) {
					onUpdate('weighted', pp, weighted, improvements);
					return;
				}

				prevWithSign = true;
				prevAbsolute = true;
				forcePrev = false;
				prevTemplate = prevValue ? '[ ${formatted} ]' : '';
				break;
			case 'full-combo':
				prevValue = fcPp;

				prevWithSign = false;
				prevAbsolute = true;
				forcePrev = true;
				prevTemplate = prevValue ? '{ ${formatted} }' : '';
				break;

			case 'weighted':
			default:
				prevValue = weighted ?? null;
				prevWithSign = false;
				prevAbsolute = true;
				forcePrev = true;
				prevTemplate = prevValue ? '( ${formatted} )' : '';
				break;
		}

		prevTitle =
			weighted || improvements
				? `${weighted ? `Weighted: ${formatNumber(weighted)}${suffix}\n` : ''}${
						improvements?.pp ? `PP improvement: ${formatNumber(improvements.pp, 2, true)}${suffix}\n` : ''
				  }${improvements?.totalPp ? `Total PP gain: ${formatNumber(improvements.totalPp, 2, true)}${suffix}\n` : ''}`
				: '';

		if (bonusPp) {
			prevTitle += `PP bonus: ${formatNumber(bonusPp)}${suffix}\n`;
		}
		if (accPp) {
			prevTitle += `Acc PP part: ${formatNumber(accPp)}${suffix}\n`;
		}
		if (passPp) {
			prevTitle += `Pass PP part: ${formatNumber(passPp)}${suffix}\n`;
		}
		if (techPp) {
			prevTitle += `Tech PP part: ${formatNumber(techPp)}${suffix}\n`;
		}
		if (fcPp && fcPp > pp) {
			prevTitle += `Full combo PP: ${formatNumber(fcPp)}${suffix}\n`;
		}
	}

	$: onUpdate($configStore?.preferences?.ppMetric ?? 'weighted', pp, weighted, improvements);
</script>

<span class="pp" style="--color: {color}">
	{#if whatIf}<span class="whatif-tooltip" style="--opacity: {tooltipOpacity}; --x: {tooltipX + 'px'}; --y: {tooltipY + 'px'}">
			If you play like this:
			<span class="whatif-value">
				{formatNumber(whatIf.currentTotalPp)} + <strong>{formatNumber(whatIf.diff)}</strong> =<strong class="total"
					>{formatNumber(whatIf.newTotalPp)}pp</strong>
			</span>
		</span>{/if}

	<span class="value" title={prevTitle}>
		<Value value={pp} {zero} {withZeroSuffix} {prevValue} {prevWithSign} {prevTitle} {prevAbsolute} {suffix} {...$$restProps} {forcePrev}>
			<span
				slot="value"
				let:formatted
				class="main-value"
				class:whatIfAvailable={whatIf}
				use:hoverable
				on:hover={onHover}
				on:unhover={onUnhover}>
				{formatted} <i class="fas fa-question" />
			</span>
			<svelte:fragment slot="prev" let:formatted let:value>
				{substituteVars(prevTemplate, {formatted})}
			</svelte:fragment>
		</Value>
	</span>
</span>

<style>
	.pp {
		color: var(--color) !important;
	}

	.value :global(.prev) {
		min-width: max-content;
	}

	.whatIfAvailable {
		cursor: help;
	}

	.main-value > i {
		display: none;
	}

	.whatIfAvailable > i {
		display: inline;
		position: absolute;
		top: 0.45em;
		right: 0.25em;
		font-size: 0.55em;
	}

	.whatif-tooltip {
		position: fixed;
		top: var(--y);
		left: var(--x);
		z-index: 10;
		width: 18em !important;
		padding: 0.25em;
		font-size: 0.875em;
		font-weight: normal;
		text-align: center;
		color: var(--textColor);
		background-color: var(--foreground);
		border: 1px solid var(--faded);
		opacity: var(--opacity);
		transition: opacity 300ms;
		pointer-events: none;
	}

	.whatif-tooltip .whatif-value {
		display: block;
	}

	.whatif-value .total {
		color: var(--increase) !important;
	}
</style>
