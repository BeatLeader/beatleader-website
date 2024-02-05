<script>
	import {onDestroy, onMount} from 'svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import CarouselCard from '../components/Maps/CarouselCard.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import MapsCategoryCard from '../components/Maps/MapsCategoryCard.svelte';
	import {fade} from 'svelte/transition';
	import HeaderCard from '../components/Maps/HeaderCard.svelte';

	let cards = [
		{
			component: CarouselCard,
			props: {
				title: 'BS Rewind 2023',
				body: 'Watch the best of 2023, compiled by Cube Community!',
				imageUrl: '/assets/Discover/cc_rewind_23.jpg',
				targetUrl: 'https://youtu.be/bbwJkCF4xp0',
				forcedColor: 'rgb(180 95 114)',
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'BS Rewind Map',
				body: 'Check out the new Rewind Map!',
				imageUrl: '/assets/Discover/cc_rewind_23_map.png',
				targetUrl: 'https://youtu.be/4-2GWGCJTmM?si=gCRDnNBepJw5BTOd',
				forcedColor: 'rgb(66 87 104)',
				buttons: [
					{
						text: 'Download',
						type: 'primary',
						url: 'https://beatsaver.com/maps/39736',
					},
					{
						text: 'View Leaderboard',
						url: '/leaderboard/global/3973691',
					},
				],
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Got something to share?',
				body: 'DM Light Ai on Discord to get your map pack, event or announcement featured here!',
				imageUrl: '/assets/Discover/lightai.png',
				targetUrl: 'https://discordapp.com/users/138596754592497664',
				forcedColor: 'rgb(111 191 226)',
			},
		},
	];

	let tournamentCards = [
		{
			component: CarouselCard,
			props: {
				title: 'Beat Saber Events Feed',
				body: 'BeatKhana has created a twitter account to keep you updated on all the latest Beat Saber events, Follow them now!',
				imageUrl: '/assets/Discover/BSEF_banner.png',
				targetUrl: 'https://twitter.com/beatsaberevents',
				forcedColor: undefined,
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'CC site update',
				body: 'Cube Community has updated their site, and added a new tournament calendar. Check it out!',
				imageUrl: '/assets/Discover/cc_site_update.png',
				targetUrl: 'https://cube.community/calendar',
				forcedColor: 'rgb(8 37 52)',
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Got something to share?',
				body: 'DM Light Ai on Discord to get your tournament, gameplay event or announcement featured here!',
				imageUrl: '/assets/Discover/lightai.png',
				targetUrl: 'https://discordapp.com/users/138596754592497664',
				forcedColor: 'rgb(111 191 226)',
			},
		},
	];

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
</script>

<svelte:head>
	<title>Maps</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<ContentBox class="main-content">
			<h1 class="header">MAPS</h1>

			<div class="categories">
				<MapsCategoryCard categoryName="Ranked" showRankedCounter bgColor="#2d0c1f" redirectUrl={'/leaderboards'} />
				<MapsCategoryCard categoryName="Trending" showComingSoon bgColor="#292823" />
				<MapsCategoryCard categoryName="Curated" bgColor="#15261D" redirectUrl={'/leaderboards/1?type=all&songStatus=6'} />
			</div>

			<div class="items">
				<HeaderCard text="Discover" />
				<FeaturedCarousel {cards} {cardWidthRatio} height={carouselHeight} autoMoveInterval="8000" />
				<HeaderCard text="Tournaments" />
				<FeaturedCarousel cards={tournamentCards} {cardWidthRatio} height={carouselHeight} autoMoveInterval="8000" />
			</div>
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		max-width: 75em;
		width: 100%;
		overflow: hidden;
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

		color: rgba(255, 255, 255, 0.5) !important;
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

	@media screen and (max-width: 950px) {
		.categories {
			flex-direction: column;
			gap: 1.5em;
			margin-top: 4.25em;
			font-size: 0.75em;
		}

		.items {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 1.5em;
			margin: 0.25em;
		}
	}
</style>
