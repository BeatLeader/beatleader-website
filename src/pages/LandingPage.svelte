<script>
	import ssrConfig from '../ssr-config';
	import {fade} from 'svelte/transition';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BlueSkyTimeline from '../components/Dashboard/BlueSkyTimeline.svelte';
	import EventBanner from '../components/Event/EventBanner.svelte';

	$: metaDescription =
		ssrConfig.name +
		" is Beat Saber's leaderboard with open code and community. Start posting your scores to compete with others on more than 100,000 different maps.";
</script>

<svelte:head>
	<title>{ssrConfig.name} - Beat Saber leaderboard</title>
</svelte:head>

<article class="page-content" transition:fade|global>
	<div class="sspl-page-container">
		<div class="big-landing-box image-container">
			<div class="cinematics">
				<div class="cinematics-canvas">
					<div class="image-container" style="position: absolute; width: 100%; height: 100%;" />
				</div>
			</div>
			<div class="title-and-buttons">
				<h1 class="big-title audiowide">Hello, future BeatLeader!</h1>
				<h3 class="big-description">Welcome to the most extensive Beat Saber leaderboard!</h3>

				<div class="downloadButtons">
					<a class="pc-download-button" href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" type="green" label="Download PC mod" />
					</a>
					<a class="quest-download-button" href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" type="green" label="Download Quest mod" />
					</a>
				</div>
				<div class="mod-beatsaber">
					<span><strong>Never modded Beat Saber? <a href="https://bsmg.wiki/pc-modding.html">It's easy!</a></strong></span>
				</div>
			</div>
		</div>
		<ContentBox cls="landing-box">
			<div class="container-element darkened-background">
				<h3 class="description centered-title">
					<b>Start posting your scores to compete with others on more than 100,000 different maps.</b>
				</h3>

				<div class="features">
					<div class="feature">
						<img src="/assets/leaderboard-landing.webp" class="feature-image" style="transform: rotate3d(0, 1, 0, 22deg);" />
						<h3 class="feature-description">In-game leaderboards<br />for custom maps!</h3>
					</div>
					<div class="feature">
						<img src="/assets/webreplays-landing.webp" class="feature-image" style="transform: rotate3d(0, 1, 0, -22deg);" />
						<h3 class="feature-description">Gameplay replays!</h3>
					</div>
				</div>

				<div class="table-container">
					<ul>
						<li>Fully open-source project and community</li>
						<li>Complexity ratings for all maps</li>
						<li>Ranked maps to earn Performance Points</li>

						<li>Detailed statistics for every score</li>
						<li>Clans, events, and many more!</li>
					</ul>
				</div>
				<div class="global-ranking-call">
					<h3><strong>Check out <a href="/ranking/1">the global rankings</a> to find the best players</strong></h3>
				</div>
			</div>
		</ContentBox>
		<span class="event-promotion-title"
			>Latest event from Symphonic: massive mapper collaboration to map songs for every idol in Love Live!</span>
		<EventBanner wideScreen={true} />
		<div class="two-boxes">
			<ContentBox cls="landing-box">
				<span class="box-headline">We aggregate the data from other cool projects to help you play better.</span>
				<div class="container-element darkened-background">
					<div class="sources">
						<a class="source" href="https://beatsaver.com/" target="_blank" rel="noreferrer">
							<img src="/assets/beatsaver-icon.png" class="icon" alt="BeatSaver" title="BeatSaver" />
							<span>BeatSaver</span>
						</a>
						<a class="source" href="https://github.com/AllPoland/ArcViewer/" target="_blank" rel="noreferrer">
							<img src="/assets/ArcViewerIcon.webp" title="ArcViewer" class="icon" alt="ArcViewer Logo" />
							<span>ArcViewer</span>
						</a>
						<a class="source" href="https://accsaber.com/" target="_blank" rel="noreferrer">
							<img src="/assets/accsaber-logo.webp" title="AccSaber" class="icon" alt="AccSaber Logo" />
							<span>AccSaber</span>
						</a>
						<a class="source" href="https://bsaber.com/" target="_blank" rel="noreferrer">
							<img src="/assets/beastsabericonbig.webp" title="BeastSaber" class="icon" alt="BeastSaber Logo" />
							<span>BeastSaber</span>
						</a>
						<a class="source" href="https://cube.community/" target="_blank" rel="noreferrer">
							<img src="/assets/cubecommunitylogo.webp" title="CubeCommunity" class="icon" alt="CubeCommunity Logo" />
							<span>CubeCommunity</span>
						</a>
						<a class="source" href="https://beat-savior.herokuapp.com/" target="_blank" rel="noreferrer">
							<span class="icon beatsavior-icon" title="BeatSavior" />
							<span>BeatSavior</span>
						</a>
					</div>
				</div>
			</ContentBox>
			<BlueSkyTimeline cls="landing-box" title={true} />
		</div>
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
	.image-container {
		background: url('/assets/Main/landing.webp') !important;
		background-position-y: -2em !important;
		background-position-x: 0% !important;
		background-size: 100% !important;
	}

	.big-landing-box {
		display: flex;
		justify-content: flex-start;
		margin: 4px 10px 18px;
		border-radius: 12px;
		padding: 1rem;
		position: relative;
		z-index: var(--z-index);
	}

	.container-element {
		border-radius: 8px;
		padding: 1.5em;
		flex: 1;
	}

	:global(.landing-box) {
		border-radius: 12px !important;
		padding: 0.5em !important;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.landing-box .v-scrollbar) {
		margin-top: 4em !important;
		margin-right: 0.8em !important;
	}

	.mod-beatsaber {
		margin-left: 0.3em;
	}

	.two-boxes {
		display: grid;
		grid-template-columns: 50% 50%;
	}

	.box-headline {
		margin-left: 0.3em;
	}

	.box-headline {
		font-size: 1.2em;
		padding-bottom: 0.5em;
		padding-top: 0.5em;
		padding-left: 0.1em;
	}

	.big-title {
		font-size: 4em;
		line-height: 1.2em;
		font-family: 'Audiowide';
		text-shadow: 2px 2px 4px black;
	}

	.big-description {
		margin-left: 0.3em;
		text-shadow: 2px 2px 4px black;
	}

	.title-and-buttons {
		margin-top: 3.6em;
		margin-bottom: 2em;
		max-width: 48%;
		margin-left: 5em;
	}

	.table-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.sources {
		display: grid;
		grid-template-columns: repeat(auto-fit, 10em);
		gap: 2em 1em;
		padding: 1em 0;
		justify-content: center;
		align-content: center;
		height: 100%;
	}

	.source {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		transition: transform 0.2s ease-in-out;
	}

	.source:hover {
		transform: scale(1.05);
	}

	.features {
		display: flex;
		justify-content: space-evenly;
	}

	.feature-image {
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
		text-align: center;
	}

	.centered-title {
		text-align: center;
	}

	.event-promotion-title {
		padding: 0.25em 0;
		margin-bottom: 0.75em !important;
		font-size: 1.25em;
		width: 100%;
		display: block;
		margin-left: 0.5em;
		margin-right: 0.5em;
		text-align: center;
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

	.source .icon {
		width: 5em;
		height: 5em;
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
		.image-container {
			background-position-y: -3em !important;
			background-position-x: 0% !important;
			background-size: 100% !important;
		}
		.big-landing-box {
			justify-content: flex-end;
		}

		.title-and-buttons {
			margin-top: 4.6em;
			margin-bottom: 3em;
			max-width: 44%;
			margin-right: 40em;
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

		.image-container {
			background-position-y: -0.9em !important;
			background-position-x: 62.2% !important;
			background-size: 200% !important;
		}

		.big-title {
			font-size: 2em;
		}

		.pc-download-button {
			display: none;
		}

		.title-and-buttons {
			margin-top: 8em;
			margin-bottom: 0em;
			max-width: none;
			margin-left: 0.125em;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}

		.two-boxes {
			display: flex;
			flex-wrap: wrap;
		}
	}
</style>
