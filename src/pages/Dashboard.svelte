<script>
	import ssrConfig from '../ssr-config';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import Scores from '../components/Player/Scores.svelte';
	import Timeline from '../components/Twitter/Timeline.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';

	const SPECIAL_PLAYER_ID = 'user-friends';

	let page = 1;
	let filters = {sortBy: 'pp'};

	let isLoading = false;
	let pending = null;

	const account = createAccountStore();

	const serviceParamsManager = createServiceParamsManager(SPECIAL_PLAYER_ID);

	let serviceParams = {sort: 'date', order: 'desc', page: 1, filters: {count: 5}};
	serviceParamsManager.update(serviceParams, 'beatleader', true);

	function onRankingPageChanged(e) {
		if (e.detail.initial || !Number.isFinite(e.detail.page)) return;

		page = e.detail.page + 1;
	}

	function onScoresPageChanged(e) {
		let newPage = e?.detail ?? null;
		if (!newPage) return;

		if (!Number.isFinite(newPage)) newPage = 1;

		serviceParamsManager.update({page: newPage});

		serviceParams = serviceParamsManager.getParams();
	}

	function onScoresParamsChanged(e) {
		const newServiceParams = e?.detail ?? null;
		if (!newServiceParams) return;

		serviceParamsManager.update(newServiceParams);
		serviceParams = serviceParamsManager.getParams();
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: followed = $account?.followed ?? null;
	$: browserTitle = followed?.length ? $account?.player?.name : `Dashboard - ${ssrConfig.name}`;
	$: metaDescription =
		ssrConfig.name +
		" is Beat Saber's leaderboard with open code and community. Start posting your scores to compete with others on more than 100,000 different maps.";
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<article class="page-content" transition:fade>
	{#if !followed?.length}
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
	{:else}
		<div class="columns is-multiline">
			<div class="leaderboard content column is-full is-two-fifths-fullhd">
				<ContentBox>
					<div class="ranking">
						<header>
							<h2 class="title is-5">
								Ranking of Followed
								{#if isLoading}
									<Spinner />
								{/if}
							</h2>
						</header>

						<RankingTable
							type="followed"
							{page}
							{filters}
							noIcons={true}
							useInternalFilters={true}
							on:page-changed={onRankingPageChanged}
							on:loading={e => (isLoading = !!e?.detail)}
							on:pending={e => (pending = e?.detail)} />
					</div>
				</ContentBox>
				<div class="twitterEmbed">
					<ContentBox>
						<Timeline href="https://twitter.com/beatleader_" />
					</ContentBox>
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
				<ContentBox>
					<header>
						<h2>
							<div class="title is-5">Scores of Followed</div>
						</h2>
					</header>

					<Scores
						playerId={SPECIAL_PLAYER_ID}
						initialService="beatleader"
						initialServiceParams={serviceParams}
						on:page-changed={onScoresPageChanged}
						on:service-params-changed={onScoresParamsChanged}
						fixedBrowserTitle={browserTitle}
						withPlayers={true}
						noIcons={true} />
				</ContentBox>
			</div>
			<div class="twitterEmbedMobile">
				<ContentBox cls="twitterBox">
					<Timeline href="https://twitter.com/beatleader_" />
				</ContentBox>
			</div>
		</div>
	{/if}
</article>

<MetaTags
	title={ssrConfig.name + ' - Website'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Website',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		site_name: ssrConfig.name,
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

	.box h2 {
		margin-bottom: 0;
	}

	.box h2 {
		display: flex;
		align-items: center;
	}

	.box h2 .title {
		margin-bottom: 0;
	}

	.box h2 .refresh {
		margin-left: 1rem;
		margin-top: -0.25em;
		font-size: 1rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	header nav {
		max-width: 15rem;
	}

	.ranking {
		overflow: hidden;
		font-size: 0.85rem;
	}

	.ranking header nav {
		font-size: 0.8em !important;
	}

	.ranking :global(.ranking-grid-row) {
		grid-template-columns: auto;
	}

	.ranking :global(.clan-badges) {
		font-size: 0.8rem;
	}

	.ranking :global(.steam-stats) {
		display: none;
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

	.twitterEmbedMobile {
		display: none;
		width: 100%;
	}

	:global(.twitterBox) {
		width: 100%;
	}

	@media screen and (max-width: 767px) {
		.twitterEmbed {
			display: none;
		}

		.twitterEmbedMobile {
			display: flex;
		}
	}
</style>
