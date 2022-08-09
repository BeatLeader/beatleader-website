<script>
	import ssrConfig from '../../ssr-config';
	import {formatNumber} from '../../utils/format';
	import {configStore} from '../../stores/config';
	import Donut from '../Common/Donut.svelte';

	const MAX_BLOCK_VALUE = 115;

	export let value;
	export let cut;
	export let color;
	export let hand = 'left';
	export let name = null;
	export let compareToValue = null;
	export let compareToCut = null;
	export let compareToName = null;

	function getRgba(color) {
		const keys = ['r', 'g', 'b', 'a'];

		const isOk = color && keys.reduce((ok, key) => ok && Number.isFinite(color[key]) && color[key] >= 0 && color[key] <= 1, true);
		if (!isOk) return hand === 'left' ? ssrConfig.leftSaberColor : ssrConfig.rightSaberColor;

		return 'rgba(' + keys.reduce((prev, key) => prev.concat(key !== 'a' ? Math.round(color[key] * 255) : color[key]), []) + ')';
	}

	$: accValue = Number.isFinite(value) && value >= 0 && value <= 115 ? value : 0;
	$: percentage = accValue / MAX_BLOCK_VALUE;
	$: cutsRounded = (configStore, $configStore, cut && Array.isArray(cut) ? cut.map(c => (Number.isFinite(c) ? formatNumber(c) : 0)) : null);
	$: rgba = getRgba(color);

	$: compareToAccValue = Number.isFinite(compareToValue) && compareToValue >= 0 && compareToValue <= 115 ? compareToValue : 0;
	$: compareToPercentage = compareToAccValue / MAX_BLOCK_VALUE;
	$: compareToCutsRounded =
		(configStore,
		$configStore,
		compareToCut && Array.isArray(compareToCut) ? compareToCut.map(c => (Number.isFinite(c) ? formatNumber(c) : 0)) : null);
</script>

{#if cutsRounded}
	<section class="donut-and-cuts">
		{#if cutsRounded && hand === 'left'}
			<div class="cuts">
				{#each cutsRounded as c, idx}
					<span title={idx === 0 ? 'Preswing' : idx === 1 ? 'Accuracy' : 'Postswing'}>
						{#if compareToCutsRounded && compareToCutsRounded[idx]}
							<small>{compareToCutsRounded[idx]}</small>
						{/if}
						{c}
					</span>
				{/each}
			</div>
		{/if}

		<div>
			<Donut {value} {percentage} color={rgba} {compareToValue} {compareToPercentage} {name} {compareToName} />
		</div>

		{#if cutsRounded && hand === 'right'}
			<div class="cuts">
				{#each cutsRounded as c, idx}
					<span title={idx === 0 ? 'Preswing' : idx === 1 ? 'Accuracy' : 'Postswing'}>
						{c}
						{#if compareToCutsRounded && compareToCutsRounded[idx]}
							<small>{compareToCutsRounded[idx]}</small>
						{/if}
					</span>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.donut-and-cuts {
		display: flex;
		flex-direction: row;
		grid-column-gap: 0.4em;
		justify-content: space-evenly;
	}

	.cuts {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-size: 0.875em;
		text-align: center;
	}

	small {
		color: var(--faded);
	}
</style>
