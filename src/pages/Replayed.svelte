<script>
	import {fade} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';

	let cards = [
    {
			component: ReplayedCard,
			props: {
				title: 'Your most played',
				subText: 'You played this map the most minutes of any',
        contentSubText: "These are the top 5 maps you played the most",
				stats: {
					type: 'mapList',
					entries: [
						{
							index: 0,
							name: 'Utakata no Sekai de (feat. nayuta)',
              author: "DJ Raisei vs Setca.",
							mapper: 'Light Ai',
              minutes: 3040.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
						},
            {
							index: 1,
							name: 'Utakata no Sekai de (feat. nayuta)',
              author: "DJ Raisei vs Setca.",
							mapper: 'Light Ai',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
						},
            {
							index: 2,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 3,
							name: 'Following the Waving Wings -Last Plaudits-',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 4,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
					],
				},
				buttons: [
					{
						text: 'More Info',
						type: 'secondary',
					},
				],
			},
		},
		{
			component: ReplayedCard,
			props: {
				title: 'Your most failed',
				subText: 'This map made you struggle the most',
        contentSubText: "These are the top 5 maps you failed the most times",
				stats: {
					type: 'mapList',
					entries: [
						{
							index: 0,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              count: 5,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 1,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              count: 4,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 2,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              count: 3,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 3,
							name: 'Following the Waving Wings -Last Plaudits-',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              count: 2,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 4,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              count: 1,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
					],
				},
				buttons: [
					{
						text: 'More Info',
						type: 'secondary',
					},
				],
			},
		},
		{
			component: ReplayedCard,
			props: {
				title: 'Your top mappers',
				subText: 'This mapper was your favourite',
        contentSubText: "These are the top 5 mappers you played the most",
				stats: {
					type: 'mapperList',
					entries: [
						{
							index: 0,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 1,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 2,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 3,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 4,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
					],
				},
			},
		},
	];
</script>

<svelte:head>
	<title>BeatLeader re:played 2023</title>
</svelte:head>

<section class="align-content">
	<article class="page-content align-content" transition:fade|global>
		<ContentBox cls="main-content-replayed">
			<div class="items">
				<FeaturedCarousel {cards} showFillerCards={false} height={'1000%'} cardWidthRatio={1} showButtons />
			</div>
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	:global(.main-content-replayed) {
		aspect-ratio: 9 / 16;
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
	}
</style>
