<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDate, formatDateCustom} from '../../../utils/date';
	import Value from '../../Common/Value.svelte';
	import {createEventDispatcher} from 'svelte';
	import {tweened} from 'svelte/motion';
	import {cubicOut} from 'svelte/easing';
	import {onMount} from 'svelte';

	export let playerId = null;
	export let width = '10em';
	export let height = '10em';
	export let showRatings = true;

	const dispatch = createEventDispatcher();

	const multiplier = 1100;
	const DEFAULT_MAX_TECH_PP = 2 * multiplier;
	const DEFAULT_MAX_ACC_PP = 24 * multiplier;
	const DEFAULT_MAX_PASS_PP = 10 * multiplier;

	const gypL = 57.74;

	const techPpTween = tweened(0, {duration: 400, easing: cubicOut});
	const accPpTween = tweened(0, {duration: 400, easing: cubicOut});
	const passPpTween = tweened(0, {duration: 400, easing: cubicOut});

	let history = [];
	let selectedTimestamp;
	let previousTimestamp;
	let maxNewScores = 0;
	let hoveredTimestamp = null;
	let animationTimeout;

	function updatePPFromInfo(playerInfo) {
		if (!playerInfo) return;
		techPpTween.set(playerInfo.techPp);
		accPpTween.set(playerInfo.accPp);
		passPpTween.set(playerInfo.passPp);
	}

	function handleMouseEnter(timestamp) {
		hoveredTimestamp = timestamp;
	}

	function handleMouseLeave() {
		hoveredTimestamp = null;
	}

	function animateTimestamps(index = 0) {
		if (!history?.length || index >= history.length) return;

		selectTimestamp(history[index].timestamp);

		if (index < history.length - 1) {
			animationTimeout = setTimeout(() => {
				animateTimestamps(index + 1);
			}, 400);
		}
	}

	onMount(() => {
		return () => {
			if (animationTimeout) clearTimeout(animationTimeout);
		};
	});

	$: history?.length && selectedTimestamp != 0 && updatePPFromInfo(history.find(h => h.timestamp == selectedTimestamp));
	$: techScale = $techPpTween > DEFAULT_MAX_TECH_PP ? $techPpTween / DEFAULT_MAX_TECH_PP : 1;
	$: accScale = $accPpTween > DEFAULT_MAX_ACC_PP ? $accPpTween / DEFAULT_MAX_ACC_PP : 1;
	$: passScale = $passPpTween > DEFAULT_MAX_PASS_PP ? $passPpTween / DEFAULT_MAX_PASS_PP : 1;

	$: triangleScale = Math.max(techScale, Math.max(accScale, passScale));

	$: maxTechPp = DEFAULT_MAX_TECH_PP * triangleScale;
	$: maxAccPp = DEFAULT_MAX_ACC_PP * triangleScale;
	$: maxPassPp = DEFAULT_MAX_PASS_PP * triangleScale;

	$: totalNormalizedPp = $techPpTween * (maxAccPp / maxTechPp) + $accPpTween + $passPpTween * (maxAccPp / maxPassPp);
	$: normalizedTechPp = $techPpTween / maxTechPp;
	$: normalizedAccPp = $accPpTween / maxAccPp;
	$: normalizedPassPp = $passPpTween / maxPassPp;

	$: techPpPart = ($techPpTween * (maxAccPp / maxTechPp)) / totalNormalizedPp;
	$: accPpPart = $accPpTween / totalNormalizedPp;
	$: passPpPart = ($passPpTween * (maxAccPp / maxPassPp)) / totalNormalizedPp;

	$: corner1 = {
		x: (gypL - normalizedTechPp * gypL) * 0.866,
		y: 86.6 - (gypL - normalizedTechPp * gypL) / 2,
	};
	$: corner2 = {
		x: 100 - (gypL - normalizedAccPp * gypL) * 0.866,
		y: 86.6 - (gypL - normalizedAccPp * gypL) / 2,
	};
	$: corner3 = {x: 50, y: (86.6 - gypL / 2) * (1 - normalizedPassPp)};

	const formatter = new Intl.DateTimeFormat('en', {year: 'numeric', month: 'long'});

	function fetchHistory(playerId) {
		fetch(`${BL_API_URL}player/${playerId}/history/triangle`, {credentials: 'include'})
			.then(d => d.json())
			.then(h => {
				history = h.sort((a, b) => a.timestamp - b.timestamp);
				selectedTimestamp = history[0].timestamp;
				maxNewScores = Math.max(...history.map(d => Math.max(d.newScores, d.improvements)));
				setTimeout(() => {
					dispatch('height-changed');
					animateTimestamps();
				}, 200);
			});
	}

	function selectTimestamp(timestamp) {
		previousTimestamp = selectedTimestamp;
		selectedTimestamp = timestamp;
	}

	function handleTimelineChange(event) {
		const newIndex = parseInt(event.target.value);
		selectTimestamp(history[newIndex].timestamp);
	}

	$: playerId && fetchHistory(playerId);
</script>

<div class="outer-container">
	<div class="big-header">
		<i class="skilltriangle-icon" />
		<span class="big-title"> Skill Triangle </span>
	</div>

	<div class="triangle-and-slider">
		{#if history?.length > 1}
			<div class="timeline-container" style="height: {history.length * 1.2}em;">
				{#if maxNewScores}
					<div class="timeline-labels">
						{#each history as data, index}
							<div
								class="activity-bar {data.timestamp === selectedTimestamp ? 'selected' : ''} {data.timestamp === hoveredTimestamp
									? 'hovered'
									: ''}"
								title="New scores: {data.newScores}
Improvements: {data.improvements}"
								on:click={() => selectTimestamp(data.timestamp)}
								on:mouseenter={() => handleMouseEnter(data.timestamp)}
								on:mouseleave={handleMouseLeave}>
								<div class="bar new-scores" style="width: {(data.newScores / maxNewScores) * 100}%" />
								<div class="bar improvements" style="width: {(data.improvements / maxNewScores) * 100}%" />
							</div>
						{/each}
					</div>
				{/if}
				<input
					type="range"
					min="0"
					max={history.length - 1}
					value={history.findIndex(d => d.timestamp === selectedTimestamp)}
					on:input={handleTimelineChange} />
				<div class="timeline-labels">
					{#each history as data, index}
						<span
							class="timeline-label {data.timestamp === selectedTimestamp ? 'selected' : ''} {data.timestamp === hoveredTimestamp
								? 'hovered'
								: ''}"
							style="left: {(index / (history.length - 1)) * 100}%"
							on:click={() => selectTimestamp(data.timestamp)}
							on:mouseenter={() => handleMouseEnter(data.timestamp)}
							on:mouseleave={handleMouseLeave}>
							{index == history.length - 1 ? 'Today' : formatter.format(dateFromUnix(data.timestamp))}
						</span>
					{/each}
				</div>
			</div>
		{/if}
		<div class="triangle-container">
			{#if showRatings}
				{#if $passPpTween}
					<div class="pass">
						<Value value={$passPpTween} digits={2} zero="" prefix="Pass: " suffix="pp" />
						<div class="pp-part">
							<Value value={passPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
						</div>
					</div>
				{/if}
				{#if $accPpTween}
					<div class="acc">
						<Value value={$accPpTween} digits={2} zero="" prefix="Acc: " suffix="pp" />
						<div class="pp-part">
							<Value value={accPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
						</div>
					</div>
				{/if}
				{#if $techPpTween}
					<div class="tech">
						<Value value={$techPpTween} digits={2} zero="" prefix="Tech: " suffix="pp" />
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
	</div>
</div>

<style>
	.outer-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: -2em;
		background-color: #131313;
		width: 100%;
	}
	.big-title {
		color: white;
		font-size: 1.4em;
	}
	svg {
		width: var(--width);
		height: var(--height);
	}
	.skilltriangle-icon {
		width: 2em;
		height: 2em;
		display: inline-block;
		margin-bottom: -0.4em;
	}
	.big-header {
		margin-top: 2em;
	}
	.triangle-container {
		position: relative;
		margin: 2em;
		display: grid;
		align-items: center;
		justify-items: center;
		height: fit-content;
		min-width: min(80%, 20em);
	}
	.triangle-and-slider {
		display: flex;

		justify-content: center;
		padding: 2em;

		width: 100%;
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

	.timeline-container {
		display: flex;
		gap: 1em;
		min-width: 18em;
	}

	.timeline-labels {
		display: flex;
		flex-direction: column-reverse;
		font-size: 0.8em;
	}

	.timeline-label {
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.timeline-label.hovered,
	.activity-bar.hovered .bar {
		color: rgb(187, 135, 237);
		opacity: 0.8;
	}

	.timeline-label.selected {
		color: blueviolet;
	}

	input {
		writing-mode: vertical-lr;
		direction: rtl;
		appearance: slider-vertical;
		width: 16px;
		vertical-align: bottom;
	}

	.activity-bar {
		height: 1.5em;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.1em;
		width: 10em;
	}

	.bar {
		height: 0.4em;
		opacity: 0.6;
		background: #666;
		margin-left: auto;
	}

	.bar.new-scores {
		background: #eb008c;
		transition: all 0.2s ease-in-out;
	}

	.bar.improvements {
		background: #2196f3;
		transition: all 0.2s ease-in-out;
	}

	.activity-bar.selected .bar {
		opacity: 1;
	}

	@media screen and (max-width: 500px) {
		.triangle-and-slider {
			gap: 1em;
			flex-direction: column-reverse;
		}
	}
</style>
