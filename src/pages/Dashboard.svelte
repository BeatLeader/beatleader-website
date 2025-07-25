<script>
	import ssrConfig from '../ssr-config';
	import {fade} from 'svelte/transition';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import FollowedRanking from '../components/Dashboard/FollowedRanking.svelte';
	import FollowedScores from '../components/Dashboard/FollowedScores.svelte';
	import BlueSkyTimeline from '../components/Dashboard/BlueSkyTimeline.svelte';
	import EventBanner from '../components/Event/EventBanner.svelte';

	document.body.scrollIntoView({behavior: 'smooth'});

	$: browserTitle = `${ssrConfig.name} Dashboard`;
	$: metaDescription =
		ssrConfig.name +
		" is Beat Saber's leaderboard with open code and community. Start posting your scores to compete with others on more than 100,000 different maps.";
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<article class="page-content" transition:fade|global>
	<div class="columns is-multiline">
		<div class="content column is-full is-full-fullhd">
			<EventBanner />
		</div>
		<div class="content column is-full is-two-fifths-fullhd">
			<FollowedRanking />
			<div class="twitterEmbed">
				<BlueSkyTimeline />
			</div>
			<div class="downloadButtons">
				<a href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
					<Button iconFa="fas fa-download" label="Download PC mod" color="#2d4150" />
				</a>
				<a href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
					<Button iconFa="fas fa-download" label="Download Quest mod" color="#2d4150" />
				</a>
			</div>
		</div>
		<div class="scores content column is-full is-three-fifths-fullhd page-content">
			<FollowedScores {browserTitle} />
		</div>
		<div class="twitterEmbedMobile">
			<BlueSkyTimeline />
		</div>
	</div>
</article>

<MetaTags
	title={ssrConfig.name + ' - Website'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Website',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Website',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.columns {
		width: 94%;
	}

	.is-multiline {
		margin-left: 1.5em;
	}

	.downloadButtons {
		margin-top: 1.5em;
		margin-left: 0.6em;
		margin-bottom: 2em;
		float: center;
	}

	.twitterEmbedMobile {
		display: none;
	}

	@media screen and (max-width: 767px) {
		.twitterEmbed {
			display: none;
		}

		.twitterEmbedMobile {
			display: flex;
		}

		.columns {
			width: unset;
		}

		.is-multiline {
			margin-left: unset;
		}
	}
</style>
