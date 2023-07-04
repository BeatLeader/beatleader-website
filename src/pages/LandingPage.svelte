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
</script>

<svelte:head>
	<title>{ssrConfig.name} - Beat Saber leaderboard</title>
</svelte:head>

<article class="page-content" transition:fade>
	<div class="sspl-page-container">
		<ContentBox>
			<div class="is-multiline">
				<h1 class="title is-4">Hello, future BeatLeader!</h1>
				<h3 class="description">This is an open source Beat Saber leaderboard!</h3>
				<h3 class="description"><b>Start posting your scores to compete with others on more than 100,000 different maps.</b></h3>
				<h3 class="description">It aggregates data from other cool projects to help you play better:</h3>
				<div class="sources">
					<div>
						<h3 class="title is-6">
							<a class="imageLink" href="https://beat-savior.herokuapp.com/" target="_blank" rel="noreferrer">
								<span class="icon beatsavior-icon" title="BeatSavior" />
							</a>
						</h3>
						<a class="imageLink" href="https://beat-savior.herokuapp.com/" target="_blank" rel="noreferrer"> BeatSavior </a>
					</div>
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
							<a class="imageLink" href={`https://accsaber.com/`} target="_blank" rel="noreferrer">
								<img src="/assets/accsaber-logo.png" title="AccSaber" class="icon" alt="AccSaberLogo" />
							</a>
						</h3>
						<a class="imageLink" href="https://accsaber.com/" target="_blank" rel="noreferrer"> AccSaber </a>
					</div>
					<div>
						<h3 class="title is-6">
							<a class="imageLink replays" href="https://replay.beatleader.xyz/" target="_blank" rel="noreferrer">
								<img src="/assets/replays.svg" title="Replays" class="icon" alt="Replays" />
							</a>
						</h3>
						<a class="imageLink" href="https://replay.beatleader.xyz/" target="_blank" rel="noreferrer"> Replays </a>
					</div>
				</div>
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest mod" />
					</a>
				</div>
				<div class="global-ranking-call">
					<h3><strong>Check out <a href="/ranking/1">the global rankings</a> to find the best players</strong></h3>
				</div>
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
		site_name: ssrConfig.name,
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
	.is-multiline {
		margin-left: 1.5em;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
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
		margin-left: 0.6em;
		margin-bottom: 2em;
		float: center;
	}
</style>
