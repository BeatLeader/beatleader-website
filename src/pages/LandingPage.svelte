<script>
	import ssrConfig from '../ssr-config';
	import {fade} from 'svelte/transition';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: metaDescription =
		ssrConfig.name +
		" is Beat Saber's leaderboard with open code and community. Start posting your scores to compete with others on more than 100,000 different maps.";

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

	$: drawCinematics(cinematicsCanvas, '/assets/landing-big.jpg');
</script>

<svelte:head>
	<title>{ssrConfig.name} - Beat Saber leaderboard</title>
</svelte:head>

<article class="page-content" transition:fade|global>
	<div class="sspl-page-container">
		<div class="big-landing-box">
			<div class="cinematics">
				<div class="cinematics-canvas">
					<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<div class="title-and-buttons">
				<h1 class="big-title audiowide">Hello, future BeatLeader!</h1>
				<h3 class="big-description">This is Beat Saber leaderboard!</h3>

				<div class="downloadButtons">
					<a class="pc-download-button" href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" />
					</a>
					<a class="quest-download-button" href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest mod" />
					</a>
				</div>
			</div>
		</div>
		<ContentBox>
			<h3 class="description"><b>Start posting your scores to compete with others on more than 100,000 different maps.</b></h3>

			<div class="features">
				<div class="feature">
					<img src="/assets/leaderboard-landing.png" class="feature-image" style="transform: rotate3d(0, 1, 0, 22deg);" />
					<h3 class="feature-description">In-game leaderboards<br />for custom maps!</h3>
				</div>
				<div class="feature">
					<img src="/assets/webreplays-landing.png" class="feature-image" style="transform: rotate3d(0, 1, 0, -22deg);" />
					<h3 class="feature-description">Gameplay replays!</h3>
				</div>
			</div>

			<ul>
				<li>Fully open-source project and community</li>
				<li>Complexity ratings for all maps</li>
				<li>Ranked maps to earn Performance Points</li>

				<li>Detailed statistics for every score</li>
				<li>Clans, events, and many more!</li>
			</ul>
			<div class="global-ranking-call">
				<h3><strong>Check out <a href="/ranking/1">the global rankings</a> to find the best players</strong></h3>
			</div>
		</ContentBox>
		<ContentBox>
			<h3 class="description">We aggregate the data from other cool projects to help you play better:</h3>
			<div class="sources">
				<div>
					<h3 class="title is-6">
						<a class="imageLink" href={`https://beatsaver.com/`} target="_blank" rel="noreferrer">
							<img src="https://beatsaver.com/static/favicon/apple-touch-icon.png" class="icon" alt="BeatSaver" title="BeatSaver" />
						</a>
					</h3>
					<a class="imageLink" href="https://beatsaver.com/" target="_blank" rel="noreferrer"> BeatSaver </a>
				</div>
				<div>
					<h3 class="title is-6">
						<a class="imageLink" href={`https://github.com/AllPoland/ArcViewer/`} target="_blank" rel="noreferrer">
							<img src="/assets/ArcViewerIcon.png" title="ArcViewer" class="icon" alt="ArcViewer Logo" />
						</a>
					</h3>
					<a class="imageLink" href="https://github.com/AllPoland/ArcViewer/" target="_blank" rel="noreferrer"> ArcViewer </a>
				</div>
				<div>
					<h3 class="title is-6">
						<a class="imageLink" href={`https://accsaber.com/`} target="_blank" rel="noreferrer">
							<img src="/assets/accsaber-logo.png" title="AccSaber" class="icon" alt="AccSaber Logo" />
						</a>
					</h3>
					<a class="imageLink" href="https://accsaber.com/" target="_blank" rel="noreferrer"> AccSaber </a>
				</div>
				<div>
					<h3 class="title is-6">
						<a class="imageLink" href="https://beat-savior.herokuapp.com/" target="_blank" rel="noreferrer">
							<span class="icon beatsavior-icon" title="BeatSavior" />
						</a>
					</h3>
					<a class="imageLink" href="https://beat-savior.herokuapp.com/" target="_blank" rel="noreferrer"> BeatSavior </a>
				</div>
			</div>
			<div class="global-ranking-call">
				<h3><strong>Never modded Beat Saber? <a href="https://bsmg.wiki/pc-modding.html">It's easy!</a></strong></h3>
			</div>
		</ContentBox>
	</div>
</article>

<MetaTags
	title={ssrConfig.name + ' - Beat Saber leaderboard'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Beat Saber leaderboard',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Beat Saber leaderboard',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.big-landing-box {
		background: url('/assets/landing-big.jpg') !important;
		background-position-y: 50em !important;
		background-position-x: 80% !important;
		display: flex;
		justify-content: flex-end;
		margin: 4px 10px 18px;
		border-radius: 6px;
		padding: 1rem;
		position: relative;
		z-index: var(--z-index);
	}

	.big-title {
		font-size: 4em;
		line-height: 1.2em;
		font-family: 'Audiowide';
	}

	.big-description {
		margin-left: 0.3em;
	}

	.title-and-buttons {
		margin-top: 3.6em;
		margin-bottom: 2em;
		max-width: 48%;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}

	.features {
		display: flex;
		justify-content: space-evenly;
	}

	.feature-image {
		width: 25em;
		height: 25em;
	}

	.feature {
		perspective: 50em;
	}

	.feature-description {
		text-align: center;
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
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
	}

	.title.is-4 {
		margin-top: 1.2em;
	}

	.global-ranking-call {
		margin-top: 2em;
	}

	h3 {
		padding: 0.25em 0;
		margin-bottom: 0.75em !important;
		font-size: 1.25em;
	}

	h3 > a {
		display: inline-flex;
		align-items: center;
	}

	h3 .icon {
		display: inline-block;
		width: 4em;
		height: 4em;
		margin-right: 0.5em;
	}

	.imageLink {
		width: 4em;
		height: 4em;
	}

	.downloadButtons {
		margin-top: 1.5em;
		margin-left: 0.3em;
		margin-bottom: 2em;
		display: flex;
		gap: 0.6em;
		float: center;
	}
	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}

	@media screen and (min-width: 1250px) {
		.big-landing-box {
			background-position-y: 52% !important;
			background-position-x: 80% !important;
			background-size: 100% !important;
		}

		.title-and-buttons {
			margin-top: 4.6em;
			margin-bottom: 3em;
			max-width: 44%;
		}
	}

	@media screen and (max-width: 1024px) {
		.title-and-buttons {
			max-width: 60%;
		}
	}

	@media screen and (max-width: 767px) {
		.features {
			flex-direction: column;
		}

		.feature-image {
			transform: none !important;
		}

		.big-landing-box {
			background-position-y: 48.5em !important;
			background-position-x: -21em !important;
		}

		.big-title {
			font-size: 3em;
		}

		.pc-download-button {
			display: none;
		}

		.title-and-buttons {
			margin-top: 18em;
			margin-bottom: -2em;
			max-width: none;
		}
	}
</style>
