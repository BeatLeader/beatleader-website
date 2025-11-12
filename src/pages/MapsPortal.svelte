<script>
	import {onDestroy, onMount} from 'svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import CarouselCard from '../components/Maps/CarouselCard.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import MapsCategoryCard from '../components/Maps/MapsCategoryCard.svelte';
	import {fade} from 'svelte/transition';
	import HeaderCard from '../components/Maps/HeaderCard.svelte';
	import {fetchJson} from '../network/fetch';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BigButton from '../components/Maps/BigButton.svelte';
	import EventCard from '../components/Maps/EventCard.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';

	let cards = [
		{
			component: CarouselCard,
			props: {
				title: 'Extra Sensory 2 Mods and Maps are out!',
				body: '',
				imageUrl: '/assets/Discover/extra_sensory_thumbnail_2.webp',
				targetUrl: 'https://exsii.totalbs.dev/',
				linkName: 'Extra Sensory 2',
				forcedColor: 'rgb(23 27 46)',
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Cube Community Summer Highlights',
				body: '',
				imageUrl: '/assets/Discover/cc-summer-highlights-2025.jpg',
				targetUrl: 'https://youtu.be/EC0BpTOhTMI',
				linkName: 'YouTube',
				forcedColor: '#cf861f',
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Latest Map Of The Week',
				body: 'No map of the week found :( Check back later',
				imageUrl: '/assets/Main/landing.webp',
				targetUrl: undefined,
				linkName: 'Leaderboard',
				forcedColor: 'rgba(0, 0, 0, 0)',
			},
		},
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'Latest Noodle Map Monday',
		// 		body: 'No noodle map monday found :( Check back later',
		// 		imageUrl: '/assets/Main/landing.webp',
		// 		targetUrl: undefined,
		// 		linkName: 'Leaderboard',
		// 		forcedColor: 'rgba(0, 0, 0, 0)',
		// 	},
		// },
	];

	let tournamentCards = [
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'Beat Saber Elites!',
		// 		body: 'An exclusive, invite-only tournament, for the top 25 ScoreSaber players. \nSignups are open!',
		// 		imageUrl: '/assets/Discover/BSE_2025.webp',
		// 		targetUrl: 'https://beatkhana.com/tournaments/bse/general',
		// 		linkName: 'contest info page',
		// 		forcedColor: 'rgb(0 1 24)',
		// 		buttons: [
		// 			{
		// 				text: 'Sign up!',
		// 				type: 'primary',
		// 				url: 'https://beatkhana.com/tournaments/bse/general',
		// 			},
		// 		],
		// 	},
		// },
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'Building Blocks 2024',
		// 		body: 'Ongoing mapping contest with a prize pool and chance to get directly into ranked!',
		// 		imageUrl: '/assets/Discover/buildingblocks.png',
		// 		targetUrl: '/event/building-blocks-2024',
		// 		forcedColor: 'rgb(24 3 29 / 75%)',
		// 		linkName: 'contest info page',
		// 		buttons: [
		// 			{
		// 				text: 'More Info',
		// 				type: 'primary',
		// 				url: '/event/building-blocks-2024',
		// 			},
		// 		],
		// 	},
		// },
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'BSWC 2025',
		// 		body: '',
		// 		imageUrl: 'https://cdn.cube.community/1741990864961-Artboard_1111.png',
		// 		targetUrl: 'https://cube.community/tournaments/bswc-2025',
		// 		forcedColor: 'black',
		// 		linkName: 'Official Website',
		// 		buttons: [
		// 			{
		// 				text: 'Events',
		// 				type: 'primary',
		// 				url: '/events',
		// 			},
		// 		],
		// 	},
		// },
		{
			component: CarouselCard,
			props: {
				title: 'PokéSaber 2',
				body: 'A tourney with an unique Health & Stamina systems, team-based Adrenaline & Fatigue events. Signups are open!',
				imageUrl: '/assets/Discover/pokesaber2.jpg',
				targetUrl: 'https://beatkhana.com/tournaments/PokeSaber2/general',
				forcedColor: 'black',
				linkName: 'contest info page',
				buttons: [
					{
						text: 'Sign up!',
						type: 'primary',
						url: 'https://beatkhana.com/tournaments/PokeSaber2/general',
						iconFa: 'fa fa-sign-in-alt',
					},
				],
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Fishy Tourney 2025',
				body: 'Just a regular trios tournament',
				imageUrl: '/assets/Discover/fishytourney2025.jpg',
				targetUrl: 'https://challonge.com/sjbhqjbc',
				forcedColor: 'black',
				linkName: 'contest info page',
				buttons: [
					{
						text: 'Discord Server',
						type: 'primary',
						url: 'https://discord.gg/2rrtGpP2en',
						iconFa: 'fab fa-discord',
					},
				],
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'TriSync Tournament 2025',
				body: 'A tournament where 2 players control 1 saber each and play the map together at the same time!',
				imageUrl: '/assets/Discover/trisynctournament2025.jpg',
				targetUrl: 'https://challonge.com/trisync',
				forcedColor: 'black',
				linkName: 'contest info page',
				buttons: [
					{
						text: 'Watch translations!',
						type: 'twitch',
						url: 'https://www.twitch.tv/trisynctournament',
						iconFa: 'fab fa-twitch',
					},
				],
			},
		},
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'Liga Argentina 2025',
		// 		body: '¡La Liga 2025 de Beat Saber Argentina esta por comenzar!',
		// 		imageUrl: '/assets/Discover/ligaargentina2025.jpg',
		// 		targetUrl: 'https://www.youtube.com/watch?v=6fbhLRdgzNY',
		// 		forcedColor: 'black',
		// 		linkName: 'contest info page',
		// 		buttons: [
		// 			{
		// 				text: 'Discord Server',
		// 				type: 'primary',
		// 				url: 'https://discord.com/invite/vEmATnAj5z',
		// 				iconFa: 'fab fa-discord',
		// 			},
		// 		],
		// 	},
		// },
		{
			component: CarouselCard,
			props: {
				title: 'The Swedish Tournament!',
				body: '',
				imageUrl: '/assets/Discover/BSSEC.png',
				targetUrl: 'https://beatsabersweden.se/events/swedishChampionships25',
				forcedColor: 'black',
				linkName: 'contest info page',
				buttons: [
					{
						text: 'Join Discord Server',
						type: 'primary',
						url: 'https://discord.gg/WqczySs',
						iconFa: 'fab fa-discord',
					},
				],
			},
		},
		// {
		// 	component: CarouselCard,
		// 	props: {
		// 		title: 'Beat Saber Canadian Tournament 2025',
		// 		body: 'The Canadian Beat Saber Tournament is a CANADIAN ONLY double elimination tournament, featuring 2 divisions. Sign Ups are open!',
		// 		imageUrl: '/assets/Discover/beatsabercanada2025.png',
		// 		targetUrl: 'https://beatkhana.com/tournaments/CBST2025/general',
		// 		forcedColor: 'rgb(255, 99, 99)',
		// 		linkName: 'Official Website',
		// 		buttons: [
		// 			{
		// 				text: 'Sign Up',
		// 				type: 'primary',
		// 				url: 'https://beatkhana.com/tournaments/CBST2025/general',
		// 			},
		// 		],
		// 	},
		// },
		{
			component: CarouselCard,
			props: {
				title: 'Beat Saber Events Feed',
				body: 'BeatKhana has created a twitter account to keep you updated on all the latest Beat Saber events, Follow them now!',
				imageUrl: '/assets/Discover/BSEF_banner.webp',
				targetUrl: 'https://twitter.com/beatsaberevents',
				linkName: 'Twitter',
				forcedColor: undefined,
			},
		},
	];

	async function getLatestMapOfTheWeek() {
		let map;
		let image;
		let leaderboardLink;
		let description;

		await fetchJson(
			BL_API_URL +
				'leaderboards' +
				'?leaderboardContext=general&page=1&count=1&type=all&sortBy=timestamp&order=desc&allTypes=0&songStatus=4&allRequirements=0'
		).then(response => {
			map = response.body.data[0];
			image = map?.song?.fullCoverImage ?? map?.song?.coverImage;
			leaderboardLink = `/leaderboard/global/${map.id}`;
			let mapper = map?.song?.mapper;
			let songName = map?.song?.name + ' ' + map?.song?.subName;
			let author = map?.song?.author;
			description = `${author.trim()} - ${songName.trim()} \n Mapped by ${mapper.trim()}`;
		});

		let cardIndex = cards.findIndex(card => card.props.title === 'Latest Map Of The Week');
		let card = cards[cardIndex];
		card.props.imageUrl = image;
		card.props.targetUrl = leaderboardLink;
		card.props.body = description;
		card.props.forcedColor = undefined;
		cards[cardIndex] = card;
	}

	async function getLatestNoodleMapMonday() {
		let map;
		let image;
		let leaderboardLink;
		let description;

		await fetchJson(
			BL_API_URL +
				'leaderboards' +
				'?leaderboardContext=general&page=1&count=1&type=all&sortBy=timestamp&order=desc&allTypes=0&songStatus=8&allRequirements=0'
		).then(response => {
			map = response.body.data[0];
			image = map?.song?.fullCoverImage ?? map?.song?.coverImage;
			leaderboardLink = `/leaderboard/global/${map.id}`;
			let mapper = map?.song?.mapper;
			let songName = map?.song?.name + ' ' + map?.song?.subName;
			let author = map?.song?.author;
			description = `${author.trim()} - ${songName.trim()} \n Mapped by ${mapper.trim()}`;
		});

		let cardIndex = cards.findIndex(card => card.props.title === 'Latest Noodle Map Monday');
		let card = cards[cardIndex];
		card.props.imageUrl = image;
		card.props.targetUrl = leaderboardLink;
		card.props.body = description;
		card.props.forcedColor = undefined;
		cards[cardIndex] = card;
	}

	let cardWidthRatio = 0.5;
	let carouselHeight = '43em';

	function updateCardWidthRatio() {
		if (window.innerWidth < 950) {
			cardWidthRatio = 0.8;
		} else {
			cardWidthRatio = 0.6;
		}
	}

	onMount(() => {
		updateCardWidthRatio();
		window.addEventListener('resize', updateCardWidthRatio);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateCardWidthRatio);
	});

	$: getLatestMapOfTheWeek();
	$: getLatestNoodleMapMonday();
	$: metaDescription = 'Discover custom maps for Beat Saber: trending, ranked and featured by the community';
</script>

<svelte:head>
	<title>Maps</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<ContentBox class="main-content">
			<h1 class="header">MAPS</h1>

			<div class="categories">
				<MapsCategoryCard categoryName="Ranked" showRankedCounter bgColor="#2d0c1f" redirectUrl={'/maps/ranked'} />
				<MapsCategoryCard categoryName="Trending" bgColor="#292823" redirectUrl={'/maps/trending'} />
				<MapsCategoryCard categoryName="Curated" bgColor="#15261D" redirectUrl={'/maps/all/1?songStatus=6'} />
			</div>

			<div class="buttons-container">
				<div class="buttons">
					<BigButton label="All Maps" destination="/maps/all" />
					<BigButton label="Events" destination="/events" />
					<BigButton label="Playlists" destination="/playlists/featured/1" />
					<BigButton label="Beasties" destination="/beasties/nominations" />
				</div>
			</div>

			<div class="items">
				<HeaderCard text="Tournaments" />
				<FeaturedCarousel cards={tournamentCards} {cardWidthRatio} height={carouselHeight} autoMoveInterval="8000" showBigButtons />
				<div style="margin-bottom: -2.5em;" />
				<!--<EventCard
					text="Early 2024 Ranked event!"
					body="Check out what was ranked and compete for a badge."
					image="/assets/Main/landing.webp"
					button={{url: '/event/44', label: 'Event', icon: 'fas fa-rocket'}} />-->
				<div style="margin-bottom: 1em;" />
				<HeaderCard text="Discover" />
				<FeaturedCarousel {cards} {cardWidthRatio} height={carouselHeight} autoMoveInterval="8000" showBigButtons />
				<div style="margin-bottom: 0.5em;" />
				<EventCard
					text="Got something to share?"
					body="DM Light Ai on Discord to get your map packs, events, tournaments, or announcement featured here!"
					image="/assets/Main/landing.webp" />
			</div>
		</ContentBox>
	</article>
</section>

<MetaTags
	title={ssrConfig.name + ' - Maps'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Maps',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Maps',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		max-width: 75em;
		width: 100%;
		overflow: hidden;
		font-size: 1em;
	}

	article {
		width: 100%;
		overflow-x: hidden;
	}

	.header {
		position: absolute;
		left: 50%;
		top: -0.375em;
		transform: translateX(-50%);
		font-family: Audiowide;
		font-size: 150px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
	}

	.categories {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 3.25em;
		margin: 3.25em;
		margin-top: 4.25em;
		font-size: 1em;
	}

	.items {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1.5em;
		margin: 3.25em;
	}

	.buttons-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1.25em;
		margin: 3.25em;
		align-items: center;
	}

	.buttons {
		display: flex;
		width: fit-content;
		flex-direction: row;
		justify-content: center;
		gap: 0.6em;
		padding: 0.6em;
		background: #111111;
		backdrop-filter: blur(10px) opacity(0.5);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px) opacity(0.5);
		border-radius: 0.5em;
	}

	@media screen and (max-width: 1920px) {
		.page-content {
			font-size: 0.9em;
		}
	}

	@media screen and (max-width: 950px) {
		.page-content {
			font-size: 0.8em;
		}

		.categories {
			flex-direction: column;
			gap: 1.5em;
			margin-top: 6.25em;
			font-size: 0.75em;
		}

		.items {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 1.5em;
			margin: 0.25em;
		}

		.buttons-container {
			margin: 3.25em 0.25em;
		}
	}
</style>
