<script>
	import Value from '../../Common/Value.svelte';

	export let playerInfo = null;
	export let width = '10em';
	export let height = '10em';
	export let showRatings = true;

	const DEFAULT_MAX_TECH_PP = 1300;
	const DEFAULT_MAX_ACC_PP = 15000;
	const DEFAULT_MAX_PASS_PP = 6000;

	const gypL = 57.74;

	$: techPp = playerInfo.techPp;
	$: accPp = playerInfo.accPp;
	$: passPp = playerInfo.passPp;

	$: techScale = techPp > DEFAULT_MAX_TECH_PP ? techPp / DEFAULT_MAX_TECH_PP : 1;
	$: accScale = accPp > DEFAULT_MAX_ACC_PP ? accPp / DEFAULT_MAX_ACC_PP : 1;
	$: passScale = passPp > DEFAULT_MAX_PASS_PP ? passPp / DEFAULT_MAX_PASS_PP : 1;

	$: triangleScale = Math.max(techScale, Math.max(accScale, passScale));

	$: maxTechPp = DEFAULT_MAX_TECH_PP * triangleScale;
	$: maxAccPp = DEFAULT_MAX_ACC_PP * triangleScale;
	$: maxPassPp = DEFAULT_MAX_PASS_PP * triangleScale;

	$: totalNormalizedPp = techPp * (maxAccPp / maxTechPp) + accPp + passPp * (maxAccPp / maxPassPp);
	$: normalizedTechPp = techPp / maxTechPp;
	$: normalizedAccPp = accPp / maxAccPp;
	$: normalizedPassPp = passPp / maxPassPp;

	$: techPpPart = (techPp * (maxAccPp / maxTechPp)) / totalNormalizedPp;
	$: accPpPart = accPp / totalNormalizedPp;
	$: passPpPart = (passPp * (maxAccPp / maxPassPp)) / totalNormalizedPp;

	$: corner1 = {
		x: (gypL - normalizedTechPp * gypL) * 0.866,
		y: 86.6 - (gypL - normalizedTechPp * gypL) / 2,
	};
	$: corner2 = {
		x: 100 - (gypL - normalizedAccPp * gypL) * 0.866,
		y: 86.6 - (gypL - normalizedAccPp * gypL) / 2,
	};
	$: corner3 = {x: 50, y: (86.6 - gypL / 2) * (1 - normalizedPassPp)};
</script>

{#if playerInfo}
	<div class="triangle-container">
		{#if showRatings}
			{#if passPp}
				<div class="pass">
					<Value value={passPp} digits={2} zero="" prefix="Pass: " suffix="pp" />
					<div class="pp-part">
						<Value value={passPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
					</div>
				</div>
			{/if}
			{#if accPp}
				<div class="acc">
					<Value value={accPp} digits={2} zero="" prefix="Acc: " suffix="pp" />
					<div class="pp-part">
						<Value value={accPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
					</div>
				</div>
			{/if}
			{#if techPp}
				<div class="tech">
					<Value value={techPp} digits={2} zero="" prefix="Tech: " suffix="pp" />
					<div class="pp-part">
						<Value value={techPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
					</div>
				</div>
			{/if}
		{/if}

		<svg
			style="--width: {width}; --height: {height}"
			xmlns="http://www.w3.org/2000/svg"
			version="1.200000"
			width="100%"
			height="100%"
			viewBox="0 0 100.000000 86.600000"
			xmlns:xlink="http://www.w3.org/1999/xlink">
			<g transform="matrix(1 0 0 -1 0 86.600000)">
				<defs>
					<linearGradient
						id="fadeA-1"
						gradientUnits="userSpaceOnUse"
						x1={corner1.x}
						y1={corner1.y}
						x2={(corner2.x + corner3.x) / 2}
						y2={(corner2.y + corner3.y) / 2}>
						<stop offset="0%" stop-color="rgb(255 0 0 / {normalizedTechPp * 100}%)" />
						<stop offset="100%" stop-color="rgb(255 0 0 / {normalizedTechPp * 25}%)" />
					</linearGradient>
					<linearGradient
						id="fadeB-1"
						gradientUnits="userSpaceOnUse"
						x1={corner3.x}
						y1={corner3.y}
						x2={(corner1.x + corner2.x) / 2}
						y2={(corner1.y + corner2.y) / 2}>
						<stop offset="0%" stop-color="rgb(0 255 0 / {normalizedPassPp * 100}%)" />
						<stop offset="100%" stop-color="rgb(0 255 0 / {normalizedPassPp * 25}%)" />
					</linearGradient>
					<linearGradient
						id="fadeC-1"
						gradientUnits="userSpaceOnUse"
						x1={corner2.x}
						y1={corner2.y}
						x2={(corner3.x + corner1.x) / 2}
						y2={(corner1.y + corner3.y) / 2}>
						<stop offset="0%" stop-color="rgb(0 0 255 / {normalizedAccPp * 100}%)" />
						<stop offset="100%" stop-color="rgb(0 0 255 / {normalizedAccPp * 25}%)" />
					</linearGradient>

					<!-- <path id="pathA-1" d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeA-1)" />
					<path id="pathB-1" d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeB-1)" />
					<filter id="Default">
						<feImage xlink:href="#pathA-1" result="layerA" x="0" y="0" />
						<feImage xlink:href="#pathB-1" result="layerB" x="0" y="0" />
						<feComposite in="layerA" in2="layerB" operator="arithmetic" k1="0" k2="1.0" k3="1.0" k4="0" result="temp" />
						<feComposite in="temp" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1.0" k3="1.0" k4="0" />
					</filter> -->
				</defs>
				<g stroke="#FFF" stroke-width="0.5">
					{#if showRatings}
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeA-1)" />
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeB-1)" />
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeC-1)" />
					{:else}
						<path
							d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z"
							fill="rgb({normalizedTechPp * 255}, {normalizedPassPp * 255}, {normalizedAccPp * 255})" />
					{/if}
				</g>
				<g stroke="#FFF" fill="none" stroke-width={showRatings ? 2 : 5} stroke-dasharray={showRatings ? 4 : 14}>
					<path d="M 50.000000,0.00000 L 0.000000,86.600000 100.000000,86.600000 Z" />
				</g>
			</g>
		</svg>
	</div>
{/if}

<style>
	svg {
		width: var(--width);
		height: var(--height);
	}
	.triangle-container {
		position: relative;
		margin: 2em;
		display: grid;
		align-items: center;
		justify-items: center;
	}
	.pass {
		display: flex;
		grid-gap: 0.4em;
		position: absolute;
		color: white;
		bottom: -2em;
	}
	.acc {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.4em;
		position: absolute;
		color: white;

		top: -2.5em;
		margin-left: 16em;
	}
	.tech {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.4em;
		position: absolute;
		color: white;
		top: -2.5em;
		margin-right: 16em;
	}
	.pp-part {
		color: yellow;
	}
</style>
