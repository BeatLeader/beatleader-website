<script>
	import {getContext} from 'svelte';
	import {writable} from 'svelte/store';
	import {diffColors, describeModifiersAndMultipliers} from '../../../utils/beatleader/format';
	import {formatNumber} from '../../../utils/format';
	import Badge from '../Badge.svelte';
	import Value from '../Value.svelte';

	export let score = null;
	export let accuracyOverride = null;
	export let prevScore = null;
	export let showPercentageInstead = false;
	export let showMods = true;
	export let modifiers = null;
	export let secondary = 'improvement';

	const isDemo = getContext('isDemo') ?? writable(false);

	const badgesDef = [
		{name: 'SS+', min: 95, max: null, color: diffColors.expertPlus},
		{name: 'SS', min: 90, max: 95, color: diffColors.expert},
		{name: 'S+', min: 85, max: 90, color: diffColors.hard},
		{name: 'S', min: 80, max: 85, color: diffColors.normal},
		{name: 'A', min: 70, max: 80, color: diffColors.easy},
		{name: '-', min: null, max: 70, color: 'var(--dimmed)'},
	];

	badgesDef.forEach(badge => {
		badge.desc = `${showPercentageInstead ? 'Percentage' : 'Accuracy'} ${badge.name} (${
			!badge.min ? `< ${badge.max}%` : !badge.max ? `> ${badge.min}%` : `${badge.min}% - ${badge.max}%`
		})`;
	});

	function getBadge(acc) {
		if (!acc) return null;
		return badgesDef.reduce(
			(cum, badge) => ((!badge.min || badge.min <= acc) && (!badge.max || badge.max > acc) ? badge : cum),
			badgesDef[badgesDef.length - 1]
		);
	}

	$: badge = getBadge(accuracyOverride ?? score?.acc);
	$: fcacc =
		score?.fcAccuracy && score?.acc && Math.abs(score?.fcAccuracy * 100 - score?.acc) > 0.01
			? '\nFC acc: ' + formatNumber(score?.fcAccuracy * 100) + '%'
			: '';
	$: mods = score?.mods;

	$: value = accuracyOverride ?? score?.acc ?? 0;
	$: prevValue =
		secondary === 'improvement'
			? value - (score?.scoreImprovement?.accuracy ?? 0)
			: secondary === 'fcAccuracy' && score?.fcAccuracy
				? score.fcAccuracy * 100
				: null;
	$: prevMods = score?.scoreImprovement?.mods;

	$: prevAbsolute = secondary === 'fcAccuracy';
	$: prevPrefix = secondary === 'fcAccuracy' ? '{ ' : null;
	$: prevSuffix = secondary === 'fcAccuracy' ? '% }' : '%';
</script>

<Badge
	onlyLabel={true}
	color="white"
	bgColor={badge ? badge.color : 'var(--dimmed)'}
	title={$isDemo ? 'Click to setup' : badge ? badge.desc + fcacc : badge}
	label=""
	on:click>
	<span slot="label">
		<slot name="label-before" />
		<Value
			{value}
			{prevValue}
			{prevAbsolute}
			prefixPrev={prevPrefix}
			title={badge ? badge.desc + fcacc : null}
			inline={false}
			suffix="%"
			suffixPrev={prevSuffix}
			zero="-"
			withZeroSuffix={false} />
		{#if secondary === 'mods'}
			<small title={$isDemo ? 'Click to setup' : mods ? describeModifiersAndMultipliers(mods, modifiers) : null}>
				{#if mods && mods.length}
					{`${mods.join(' ')}`}
				{/if}{#if prevMods && prevMods.length}
					{`${prevMods.join(' ')}`}
				{/if}
			</small>
		{/if}
		<slot name="label-after" />
	</span>
	<small
		class="mods"
		slot="additional"
		title={$isDemo ? 'Click to setup' : showMods && mods ? describeModifiersAndMultipliers(mods, modifiers) : null}>
		{#if showMods && mods && mods.length}
			{#each mods as mod}
				<span>{mod}</span>
			{/each}
		{/if}{#if showMods && prevMods && prevMods.length}
			<small
				class="compare-mods {prevMods.length > 1 && mods?.length > 1 ? 'double' : ''}"
				title={$isDemo
					? 'Click to setup'
					: showMods && prevMods
						? describeModifiersAndMultipliers(prevMods, modifiers, 'Previous mods:')
						: null}>
				{#if !mods || !mods.length}<div class="mods-spacer"></div>{/if}
				{#each prevMods as mod}<span>{mod}</span>{/each}
			</small>
		{/if}
	</small>
</Badge>

<style>
	small {
		display: block;
		text-align: center;
		white-space: nowrap;
	}

	.mods {
		max-width: 2.5em;
		line-height: 1;
		flex-wrap: wrap;
		gap: 0.3em;
		display: flex;
		justify-content: center;
	}

	.mods:empty {
		display: none !important;
	}

	.compare-mods {
		max-width: 3em;
		min-width: 2em;
		margin-bottom: -0.6em !important;
		margin-top: 0.8em !important;
		line-height: 1;
		flex-wrap: wrap;
		gap: 0.3em;
		display: flex;
		justify-content: center;
	}

	.compare-mods.double {
		max-width: unset;
		margin-top: unset !important;
	}

	.compare-mods:empty {
		display: none !important;
	}

	.mods-spacer {
		width: 3em;
		height: 1.4em;
	}

	:global(*:not(.compare) > .badge.nominated-pp) {
		border: 2px dashed #ffffffb3;
		--badge-color: transparent !important;
	}
</style>
