<script>
	import {onDestroy, onMount} from 'svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import CarouselCard from '../components/Maps/CarouselCard.svelte';
	import DiscoverCard from '../components/Maps/DiscoverCard.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import MapsCategoryCard from '../components/Maps/MapsCategoryCard.svelte';
	import {fade} from 'svelte/transition';

	let categoryCardHeight = 400;

	let cards = [
		{
			component: CarouselCard,
			props: {
				title: 'Card 1',
				body: 'Card 1 description',
				imageUrl: '/assets/landing-big.jpg',
				targetUrl: undefined,
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 2',
				body: 'Card 2 description',
				imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
				targetUrl: '/leaderboard/global/345b9xx91/1',
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 3',
				body: 'Card 3 description',
				imageUrl: '/assets/landing-big.jpg',
				targetUrl: undefined,
				buttons: [
					{
						text: 'Button 1',
						type: 'primary',
					},
					{
						text: 'Button 2',
						url: '/leaderboard/global/345b9xx91/1',
					},
				],
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 4',
				body: 'Card 4 description',
				imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
				targetUrl: undefined,
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 5',
				body: 'Card 5 description',
				imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
				targetUrl: undefined,
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 6',
				body: 'Card 6 description',
				imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
				targetUrl: undefined,
			},
		},
		{
			component: CarouselCard,
			props: {
				title: 'Card 7',
				body: 'Card 7 description',
				imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
				targetUrl: undefined,
			},
		},
	];

	let cardWidthRatio = 0.5;

	function updateCardWidthRatio() {
		if (window.innerWidth < 950) {
			cardWidthRatio = 0.7;
		} else {
			cardWidthRatio = 0.5;
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
				<MapsCategoryCard categoryName="Ranked" showRankedCounter cardHeight={categoryCardHeight} bgColor="#2d0c1f" />
				<MapsCategoryCard categoryName="Trending" cardHeight={categoryCardHeight} bgColor="#292823" />
				<MapsCategoryCard categoryName="Curated" cardHeight={categoryCardHeight} bgColor="#15261D" />
			</div>

			<div class="items">
				<DiscoverCard />
				<FeaturedCarousel {cards} {cardWidthRatio} />
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
			display: flex;
			flex-direction: column;
			gap: 1.5em;
			margin: 1.5em;
			margin-top: 4.25em;
		}
		.items {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 1.5em;
			margin: 1.5em;
		}
	}
</style>
