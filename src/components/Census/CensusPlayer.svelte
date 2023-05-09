<script>
	import {onMount, afterUpdate} from 'svelte';
	import Select from '../Settings/Select.svelte';

	export let censusData;

	let ipdData = censusData.find(x => x.name == 'Health').categories.find(x => x.name == 'IPD').values;
	let ipd = ipdData[0];

	let basePp = 10000;
	let modelPp = basePp;

	function recalculatePp(ipd) {
		var multiplier = 1;
		multiplier += ipd.effect / 100;
		modelPp = basePp * multiplier;
	}

	$: recalculatePp(ipd);
</script>

<div class="top-container">
	<span>Model player: {modelPp.toFixed(2)}PP</span>
	<div class="body-container">
		<div
			class="eye"
			style="
                top: 1.6em; 
                left: {9.4 - (ipdData.indexOf(ipd) + 2) * 0.2}em" />
		<div
			class="eye"
			style="
                top: 1.6em; 
                left: {9.4 + (ipdData.indexOf(ipd) + 2) * 0.2}em" />
		<div
			style="
            top: 0.6em;
            right: -1em;
            position: absolute;">
			<Select bind:value={ipd} options={ipdData} valueSelector={x => x} />
		</div>

		<img
			class="body-part"
			style="
                width: 4em;
                left: 7.8em;"
			src="/assets/body/head.svg"
			alt="" />
		<img
			class="body-part"
			style="width: 
                10em;
                left: 5em;
                top: 4em;"
			src="/assets/body/torso.svg"
			alt="" />
		<img
			class="body-part"
			style="
                top: 0.7em;
                width: 3em;
                right: 4em;
                transform: rotate(90deg) rotateX(180deg);"
			src="/assets/body/hand.svg"
			alt="" />
		<img
			class="body-part"
			style="
                top: 0.7em;
                width: 3em;
                left: -1em;
                transform: rotate(90deg);"
			src="/assets/body/hand.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: 2em;
                top: 3.2em;
                right: -3.2em;
                transform: rotateZ(270deg);"
			src="/assets/body/wrist.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: 2em;
                top: 3.2em;
                left: -8.2em;
                transform: rotateZ(90deg) rotateY(180deg);"
			src="/assets/body/wrist.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: 8em;
                top: 17em;
                left: 5.7em;"
			src="/assets/body/legs.svg"
			alt="" />
	</div>
</div>

<style>
	.top-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.body-container {
		width: 25em;
		height: 30em;
		position: relative;
	}

	.eye {
		background-color: black;
		position: absolute;
		width: 0.5em;
		height: 0.5em;
		border-radius: 0.25em;
		z-index: 1;
	}

	.body-part {
		position: absolute;
		filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg);
	}
</style>
