<script>
	import Value from './Value.svelte';

	export let width = '6em';
	export let height = '6em';
	export let mapRating = {};
	export let showRatings = false;

	const DEFAULT_MAX_RATING = 15;
	const gypL = 57.74;

	$: maxRatingValue = Math.max(mapRating?.passRating ?? 0, Math.max(mapRating?.techRating ?? 0, mapRating?.accRating ?? 0));
	$: maxRating = Number.isFinite(maxRatingValue) && maxRatingValue > DEFAULT_MAX_RATING ? Math.ceil(maxRatingValue) : DEFAULT_MAX_RATING;
	$: corner1 = {
		x: (gypL - (mapRating.techRating / maxRating) * gypL) * 0.866,
		y: 86.6 - (gypL - (mapRating.techRating / maxRating) * gypL) / 2,
	};
	$: corner2 = {
		x: 100 - (gypL - (mapRating.accRating / maxRating) * gypL) * 0.866,
		y: 86.6 - (gypL - (mapRating.accRating / maxRating) * gypL) / 2,
	};
	$: corner3 = {x: 50, y: (86.6 - gypL / 2) * (1 - mapRating.passRating / maxRating)};
</script>

{#if mapRating}
	<a
		href="/maps/ranked?accrating_from={mapRating.accRating - 0.3}&accrating_to={mapRating.accRating +
			0.3}&passrating_from={mapRating.passRating - 0.7}&passrating_to={mapRating.passRating + 0.7}&techrating_from={mapRating.techRating -
			1.5}&techrating_to={mapRating.techRating + 1.5}"
		title={showRatings ? 'Show similar maps' : null}
		class="triangle-container">
		{#if showRatings}
			<div class="tech-and-acc">
				{#if mapRating.techRating}
					<Value value={mapRating.techRating} digits={2} zero="" prefix="Tech: " suffix="★" />
				{/if}
				{#if mapRating.accRating}
					<Value value={mapRating.accRating} digits={2} zero="" prefix="Acc: " suffix="★" />
				{/if}
			</div>
			<div class="stars">
				{#if mapRating.stars}
					<Value value={mapRating.stars} digits={1} zero="" prefix="" suffix="★" />
				{/if}
			</div>
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
						<stop offset="0%" stop-color="rgb(255 0 0 / {(mapRating.techRating / maxRating) * 100}%)" />
						<stop offset="100%" stop-color="rgb(255 0 0 / {(mapRating.techRating / maxRating) * 25}%)" />
					</linearGradient>
					<linearGradient
						id="fadeB-1"
						gradientUnits="userSpaceOnUse"
						x1={corner3.x}
						y1={corner3.y}
						x2={(corner1.x + corner2.x) / 2}
						y2={(corner1.y + corner2.y) / 2}>
						<stop offset="0%" stop-color="rgb(0 255 0 / {(mapRating.passRating / maxRating) * 100}%)" />
						<stop offset="100%" stop-color="rgb(0 255 0 / {(mapRating.passRating / maxRating) * 25}%)" />
					</linearGradient>
					<linearGradient
						id="fadeC-1"
						gradientUnits="userSpaceOnUse"
						x1={corner2.x}
						y1={corner2.y}
						x2={(corner3.x + corner1.x) / 2}
						y2={(corner1.y + corner3.y) / 2}>
						<stop offset="0%" stop-color="rgb(128 0 128 / {(mapRating.accRating / maxRating) * 100}%)" />
						<stop offset="100%" stop-color="rgb(128 0 128 / {(mapRating.accRating / maxRating) * 25}%)" />
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
				<g stroke="#FFF" stroke-width={showRatings ? 0.5 : 1.5}>
					{#if showRatings}
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeA-1)" />
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeB-1)" />
						<path d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z" fill="url(#fadeC-1)" />
					{:else}
						<path
							d="M {corner3.x},{corner3.y} L {corner1.x},{corner1.y} {corner2.x},{corner2.y} Z"
							fill="rgb({(mapRating.techRating / maxRating) * 255}, {(mapRating.passRating / maxRating) * 255}, {(mapRating.accRating /
								maxRating) *
								255})" />
					{/if}
				</g>
				<g stroke="#FFF" fill="none" stroke-width={showRatings ? 2 : 5} stroke-dasharray={showRatings ? 4 : 14}>
					<path d="M 50.000000,0.00000 L 0.000000,86.600000 100.000000,86.600000 Z" />
				</g>
			</g>
		</svg>
		{#if showRatings}
			{#if mapRating.passRating}
				<div class="pass">
					<Value value={mapRating.passRating} digits={2} zero="" prefix="Pass: " suffix="★" />
				</div>
			{/if}
		{/if}
	</a>
{/if}

<style>
	.triangle-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	svg {
		width: var(--width);
		height: var(--height);
	}
	.tech-and-acc {
		color: white;
		display: flex;
		grid-gap: 4em;
		font-size: 0.8em;
	}
	.pass {
		color: white;
		font-size: 0.8em;
	}
	.stars {
		position: absolute;
		top: 33%;
		color: yellow;
		font-size: small;
	}
</style>
