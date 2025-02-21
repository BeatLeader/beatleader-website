<script>
	import {fade} from 'svelte/transition';
	import {playersTitle} from '../../../utils/clans';

	export let clan;

	let tag = null;
	let name = '';
	let color = '';
	let description = '';
	let iconUrl = null;
	let playersCount = 0;
	let rankedPoolPercent = 0;

	function updateFields(clan) {
		tag = clan?.tag;
		name = clan?.name ?? '';
		tag = clan?.tag;
		color = clan?.color ?? '#ff0000';
		iconUrl = clan?.icon ?? 'https://cdn.assets.beatleader.com/NTG.png';
		description = clan?.description ?? '';
		playersCount = clan?.playersCount ?? 0;

		rankedPoolPercent = clan?.rankedPoolPercentCaptured ? clan.rankedPoolPercentCaptured * 100 : 0;
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: drawCinematics(cinematicsCanvas, iconUrl);

	$: updateFields(clan);
</script>

{#if tag}
	<div class="edit-container">
		<h3 class="title is-6" style="    margin: 0.2em;">
			<i class="fa-solid fa-crown"></i>
			<span class="clans-title"> Clan Leader </span>
		</h3>
		<a href="/clan/{tag}" class="leader-container" style="--image: {iconUrl};">
			<div class="cinematics">
				<div class="cinematics-canvas">
					<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<img class="clanImage" src={iconUrl} alt="ClanIcon" />

			<div class="clan-info-container {tag == 'GAY' ? 'rainbow' : ''}" transition:fade|global>
				<div class="clans-title-container">
					<span style="--clan-color: {color}" class="clanTag">{tag}</span>
				</div>
				<div class="map-name">
					<span class="clanName">{name}</span>
				</div>
				<section class="title is-7">
					{#if rankedPoolPercent}
						Captured
						{rankedPoolPercent.toFixed(2)}% of ranked pool with
						{playersCount}
						{playersTitle(tag, playersCount)}
					{:else}
						{playersCount}
						{playersTitle(tag, playersCount)}
					{/if}
				</section>
			</div>
		</a>
	</div>
{/if}

<style>
	.align-content {
		display: flex;
		align-items: flex-start !important;
		justify-content: center !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.players {
		margin-top: 1rem;
		grid-gap: 0.5em;
	}

	.players:not(.with-icons) .ranking-grid-row {
		grid-template-columns: 1fr;
	}

	.players :global(> *:last-child) {
		border-bottom: none !important;
	}

	.switchers {
		display: flex;
		gap: 1em;
		justify-content: center;
	}

	:global(.primary-clan-button) {
		width: auto !important;
		margin-top: 0.3em !important;
	}

	aside {
		width: 35em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	.clan-info {
		width: 100%;
		border-radius: 15%;
	}

	.clan-info.rainbow:hover {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.clanData {
		display: flex;
		gap: 0.8rem;
	}

	.clanData .form {
		flex-grow: 1;
		padding: 0.8rem;
	}

	.clanData .form > section:not(:last-child) {
		margin-bottom: 0.5rem;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		align-items: center;
		position: relative;
	}

	.edit-container {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.leader-container {
		position: relative;
		display: flex;
		padding: 0.5em;
		border-radius: 8px;
		color: white !important;
		flex: 1;
		max-width: 28em;
		min-width: 20em;
		z-index: 0;
		overflow: hidden;
		box-shadow: 0 2px 10px rgb(0 0 0 / 33%);
	}

	.leader-container:hover {
		box-shadow: 0 2px 10px rgb(0 0 0 / 66%);
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(4em) opacity(0.5) saturate(350%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1) translateZ(0);
		width: 100%;
		z-index: 0;
		height: 100%;
	}

	.leader-container:hover .cinematics-canvas {
		filter: blur(3em) opacity(0.6) saturate(500%);
	}

	.clanImage {
		width: 5em;
		height: 5em;
		border-radius: 6px;
		z-index: 1;
	}

	.clan-info-container {
		display: flex;
		flex-direction: column;
		margin-left: 0.5em;
		justify-content: space-between;
		z-index: 1;
		margin-top: -0.2em;
	}

	.clans-title-container {
		display: flex;
		gap: 0.4em;
		align-items: center;
	}

	.map-info-container {
		display: flex;
		flex-direction: column;
		margin-left: 0.5em;
	}

	.map-name {
		font-size: 1.4em;
		margin-top: -0.5em;
	}

	.clans-title {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.125;
		margin-left: 0.2em;
	}

	.clanTag {
		color: var(--clan-color, 'red');
	}

	.clan-stats :global(> *) {
		margin-bottom: 0 !important;
	}

	.info {
		max-width: 92%;
		overflow: hidden;
		word-break: break-word;
	}

	.up-to-tablet {
		display: none;
	}

	.desktop {
		display: block;
	}

	@media screen and (max-width: 500px) {
		.clanData {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.clan-stats {
			display: flex;
			flex-direction: column;
		}

		.imageInput {
			margin: 0.7em;
		}

		.up-to-tablet {
			display: block;
		}

		.desktop {
			display: none;
		}
	}
	@media (hover: none) {
		.clan-info.rainbow {
			color: #00ffbc;
			-webkit-background-clip: text;
			background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
			-webkit-animation: rainbow 0.9s infinite linear;
			animation: rainbow 0.9s infinite linear;
		}
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
