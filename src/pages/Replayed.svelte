<script>
	import {fade, fly} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';
	import ReplayedCard2024 from '../components/Replayed/ReplayedCard2024.svelte';
	import ReplayedSummaryCard from '../components/Replayed/ReplayedSummaryCard.svelte';
	import {fetchJson} from '../network/fetch';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import SoundMotionController from '../components/Replayed/SoundMotionController.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import Button from '../components/Common/Button.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';

	export let replayedType = 'player';
	export let playerId = null;

	const account = createAccountStore();

	playerId = '76561198075923914'; // TEMP

	let cards;
	let replayedNotAvailable = false;
	let loggedInPlayer;

	let login;
	let password;

	let showBeatSaverLogin = false;

	function fetchReplayed(currentPlayerID) {
		replayedNotAvailable = false;
		fetchJson(BL_API_URL + 'replayed' + (playerId ? `?playerId=${playerId}` : ''), {
			credentials: 'include',
		})
			.then(async response => {
				if (replayedType === 'player' && response.body.player != null) {
					prepPlayerData(response.body.player);
				} else if (replayedType === 'mapper' && response.body.mapper != null) {
					prepMapperData(response.body.mapper);
				} else {
					replayedNotAvailable = true;
				}
			})
			.catch(err => {
				replayedNotAvailable = true;
			});
	}

	function prepPlayerData(data) {
		let _cards = [];

		_cards.push({
			component: ReplayedCard2024,
			props: {
				frontTitle: 'Top Mapper',
				title: 'Your Top Mappers',
				subText: '',
				contentSubText: 'The 5 mappers you played the most',
				frontStatTitle: 'Minutes Played',
				replayedType: 'player',
				frontCardId: '1',
				cardId: '0',
				stats: {
					type: 'playerList',
					entries: data.topMappers.slice(0, 5),
				},
			},
		});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Your Top Mappers %',
				subText: 'You were one of the top players for this mapper',
				contentSubText: 'You were one of the top players for these 5 mappers',
				replayedType: 'player',
				frontCardId: '1',
				cardId: '1',
				stats: {
					type: 'playerList',
					entries: data.topMappersPercentage.slice(0, 5),
				},
			},
		});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Your Most Played',
				subText: 'This map was your favourite',
				contentSubText: 'These are the 5 maps you played the most',
				replayedType: 'player',
				frontCardId: '1',
				cardId: '2',
				stats: {
					type: 'mapList',
					entries: data.topMaps.slice(0, 5),
				},
			},
		});
		if (data.topFailed)
			_cards.push({
				component: ReplayedCard2024,
				props: {
					title: 'Your Most Failed',
					subText: 'This map made you struggle the most',
					contentSubText: 'These are the top 5 maps you failed the most',
					replayedType: 'player',
					frontCardId: '1',
					cardId: '3',
					stats: {
						type: 'mapList',
						entries: data.topFailed.slice(0, 5),
					},
				},
			});
		if (data.topRestarted)
			_cards.push({
				component: ReplayedCard2024,
				props: {
					title: 'Your Most Restarted',
					subText: 'You grinded this map a lot',
					contentSubText: 'These are the top 5 maps you grinded the most times',
					replayedType: 'player',
					frontCardId: '1',
					cardId: '4',
					stats: {
						type: 'mapList',
						entries: data.topRestarted.slice(0, 5),
					},
				},
			});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Other Stats',
				subText: 'How much did you play this year?',
				contentSubText: 'Some other stats about your year',
				forcedColor: 'rgb(89, 111, 255)',
				replayedType: 'player',
				frontCardId: '1',
				cardId: '5',
				stats: {
					type: 'statList',
					entries: [
						{
							name: 'Hits',
							value: data.hits,
						},
						{
							name: 'Misses',
							value: data.misses,
						},
						{
							name: 'Plays',
							value: data.plays,
						},
						{
							name: 'Fails',
							value: data.fails,
						},
						{
							name: 'Restarts',
							value: data.restarts,
						},
						{
							name: 'Event participation',
							value:
								data?.eventsParticipation === null
									? null
									: `${data?.eventsParticipation?.count} events (avg rank: ${data?.eventsParticipation?.averageRank?.toFixed(0)})`,
						},
						{
							name: 'Minutes played',
							value: data.minutesPlayed.toFixed(2) + ' min',
						},
						{
							name: 'Top category',
							value: data.topCategory,
						},
						{
							name: 'Active days',
							value: data.activeDays,
						},
						{
							name: 'Days streak',
							value: data.daysStreak,
						},
					],
				},
			},
		});

		_cards[_cards.length - 1].props.stats.entries = _cards[_cards.length - 1].props.stats.entries.filter(
			e => e.value != null && e.value != undefined
		);

		_cards.push({
			component: ReplayedSummaryCard,
			props: {
				title: 'Your 2023 in Beat Saber',
				subText: 'A year summarized',
				summaryType: 'player',
				frontCardId: '2',
				cardId: '6',
				stats: {
					topMappers: data.topMappers.slice(0, 5),
					topMaps: data.topMaps.slice(0, 5),
					extraStats: [
						{
							name: 'Plays',
							value: data.plays,
						},
						{
							name: 'Active days',
							value: data.activeDays,
						},
						{
							name: 'Days streak',
							value: data.daysStreak,
						},
						{
							name: 'Minutes played',
							value: data.minutesPlayed.toFixed(2),
						},
						{
							name: 'Top category',
							value: data.topCategory,
						},
					],
				},
			},
		});

		cards = _cards;
	}

	function prepMapperData(data) {
		let _cards = [];

		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Most Played Maps',
				subText: 'This map was your most popular',
				contentSubText: 'These are your 5 top played maps',
				replayedType: 'mapper',
				frontCardId: '1',
				cardId: '7',
				stats: {
					type: 'mapList',
					entries: data.topMaps.slice(0, 5),
				},
			},
		});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Top x Mapper',
				subText: 'For how many players were you the top mapper?',
				contentSubText: 'For how many players were you in the top 1, 3, or 5 of most played mappers?',
				forcedColor: 'rgb(89, 111, 255)',
				replayedType: 'mapper',
				frontCardId: '1',
				cardId: '8',
				stats: {
					type: 'statList',
					entries: [
						{
							name: 'Top 1 mapper',
							value: `for ${data.tops.top1Count} players, ${data.tops.top1Percentage.toFixed(3)}% of all players`,
						},
						{
							name: 'Top 3 mapper',
							value: `for ${data.tops.top3Count} players, ${data.tops.top3Percentage.toFixed(3)}% of all players`,
						},
						{
							name: 'Top 5 mapper',
							value: `for ${data.tops.top5Count} players, ${data.tops.top5Percentage.toFixed(3)}% of all players`,
						},
					],
				},
			},
		});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Your Top Players',
				subText: 'This player played your maps the most',
				contentSubText: 'These players played your maps the most',
				replayedType: 'mapper',
				frontCardId: '1',
				cardId: '9',
				stats: {
					type: 'playerList',
					entries: data.topPlayers.slice(0, 5),
				},
			},
		});
		_cards.push({
			component: ReplayedCard2024,
			props: {
				title: 'Other Stats',
				subText: 'How much were your maps played this year?',
				contentSubText: 'Some other stats about your year',
				forcedColor: 'rgb(139, 52, 145)',
				replayedType: 'mapper',
				frontCardId: '1',
				cardId: '10',
				stats: {
					type: 'statList',
					entries: [
						{
							name: 'Total plays',
							value: data.playsCount,
						},
						{
							name: 'Total fails',
							value: data.failsCount,
						},
						{
							name: 'Total FCs',
							value: data.fCsCount,
						},
						{
							name: 'Total Minutes played',
							value: data.minutesPlayed.toFixed(2),
						},
						{
							name: 'Total unique players',
							value: data.playersCount,
						},
					],
				},
			},
		});

		_cards.push({
			component: ReplayedSummaryCard,
			props: {
				title: 'Your 2023 in Mapping',
				subText: 'A year summarized',
				summaryType: 'mapper',
				frontCardId: '1',
				cardId: '11',
				colorStartIndex: 4,
				stats: {
					topMaps: data.topMaps.slice(0, 5),
					extraStats: [
						{
							name: 'Plays',
							value: data.playsCount,
						},
						{
							name: 'Fails',
							value: data.failsCount,
						},
						{
							name: 'FCs',
							value: data.fCsCount,
						},
						{
							name: 'Total Minutes played',
							value: data.minutesPlayed.toFixed(2),
						},
						{
							name: 'Total unique players',
							value: data.playersCount,
						},
					],
				},
			},
		});

		cards = _cards;
	}

	$: loggedInPlayer = $account?.id;
	$: fetchReplayed($account?.id);
</script>

<svelte:head>
	<title>BeatLeader rePlayed 2024</title>
</svelte:head>

<section class="align-content">
	<article class="page-content align-content" transition:fade|global>
		<ContentBox cls="main-content-replayed">
			<div class="items">
				{#if cards}
					<FeaturedCarousel {cards} showFillerCards={false} height={'1000%'} cardWidthRatio={1} showButtons />
					<SoundMotionController />
				{:else if replayedNotAvailable}
					{#if !loggedInPlayer}
						<div class="login-form">
							<div class="title">Please log in to view your<b>rePlayed 2024</b></div>
							<form action={BL_API_URL + 'signin'} method="post">
								<input type="hidden" name="Provider" value="Steam" />
								<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/replayed'} />

								<Button icon={steamSvg} label="Log In with Steam" type="green" />
							</form>
							<br />
							<span>Quest Log In</span>
							<div class="input-container">
								<div class="cat">Login</div>
								<input bind:value={login} placeholder="Login" />
							</div>
							<div class="input-container">
								<div class="cat">Password</div>
								<input type="password" bind:value={password} placeholder="Password" />
							</div>

							<Button iconFa="fas fa-right-to-bracket" label="Log In" on:click={() => account.logIn(login, password)} />

							<div class="sorting-options">
								<span
									class="beat-savior-reveal clickable"
									class:opened={showBeatSaverLogin}
									on:click={() => (showBeatSaverLogin = !showBeatSaverLogin)}
									on:keydown={() => (showBeatSaverLogin = !showBeatSaverLogin)}
									title="Show login with BeatSaver">
									{#if showBeatSaverLogin}
										I play the game too
									{:else}
										Don't play the game but still map?
									{/if}

									<i class="fas fa-chevron-down" />
								</span>
							</div>

							{#if showBeatSaverLogin}
								<form action={BL_API_URL + 'signin'} method="post">
									<input type="hidden" name="Provider" value="BeatSaver" />
									<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/replayed/mapper'} />

									<Button icon={beatSaverSvg} label="Log In with BeatSaver" type="submit" />
								</form>
							{/if}
						</div>
					{:else if replayedType === 'player'}
						<div class="centering-container">
							<h3>
								Looks like you didn't play much this year.<br /><br />Why not play something from the ranked batch,<br />and we'll see you
								next year!
							</h3>
						</div>
					{:else if replayedType === 'mapper'}
						<div class="centering-container">
							{#if $account?.player?.playerInfo?.mapperId}
								<h3>
									Looks like your mapping year was quiet.<br /><br />But it's always a good time to<br />map something for rePlayed 2024!
								</h3>
							{:else}
								<h3>Please link your BeatSaver account to view<br /><b>your Mapper rePlayed 2023</b></h3>

								<form action={BL_API_URL + 'signin'} method="post">
									<input type="hidden" name="Provider" value="BeatSaver" />
									<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/replayed/mapper'} />

									<Button icon={beatSaverSvg} label="Link BeatSaver" type="submit" />
								</form>
							{/if}
						</div>
					{/if}
				{:else}
					<div class="centering-container">
						<Spinner />
					</div>
				{/if}
			</div>
		</ContentBox>
	</article>
</section>

<MetaTags
	title="BeatLeader rePlayed 2023"
	description="View your BeatLeader rePlayed 2023"
	openGraph={{
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader rePlayed 2023',
		images: CURRENT_URL + '/assets/logo-small.png',
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader rePlayed 2023',
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: 'BeatLeader rePlayed 2023',
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	:global(.main-content-replayed) {
		aspect-ratio: 9 / 14.5; /*results in ~9 / 16 for ReplayedCard*/
		padding: 0rem !important;
		max-width: 100% !important;
		min-width: 18em;
	}

	.page-content {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	article {
		width: 100%;
		height: 100%;
		overflow-x: visible;
	}

	.items {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
		text-align: center;
	}

	.items h2 {
		margin-top: 40%;
		font-size: 2vh;
		font-weight: 700;
	}

	.items h3 {
		font-size: 1.5vh;
		font-weight: 600;
	}

	.centering-container {
		display: flex;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-self: center;
		align-items: center;
		flex-direction: column;
		gap: 1em;
	}

	.error {
		color: red;
	}
	.messagep {
		color: green;
	}

	.input-container {
		display: grid;
		width: 20em;
		margin-bottom: 0.5em;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		flex: none;
		align-items: center;
	}

	.button-container {
		display: flex;
		justify-content: center;
		margin: 1em;
	}

	.inlineLink {
		display: contents;
	}
	.title {
		margin-top: 1em;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
	}
	.twitch :global(.button) {
		font-size: 0.875em;
		width: max-content;
	}

	.confetti {
		position: fixed;
		top: -50px;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
	}
	h1 {
		font-size: 2em;
	}
	h2 {
		font-size: larger;
	}

	p {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}

	.sorting-options {
		display: grid;
		justify-items: center;
		margin: 0.4em;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.beat-saver-description {
		margin-bottom: 1em;
	}

	@media screen and (max-width: 760px) {
		:global(.benefits-box) {
			width: auto;
			align-items: center;
		}

		:global(.second-box) {
			left: auto;
		}

		.benefits-gif {
			max-width: 100%;
		}
	}
</style>
