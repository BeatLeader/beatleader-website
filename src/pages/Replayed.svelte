<script>
	import {fade} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';

	let cards = [
		{
			component: ReplayedCard,
			props: {
				title: 'Your most fails',
				subText: 'This map made you struggle the most',
        contentSubText: "These are the top 10 maps you failed the most times",
				stats: {
					type: 'mapList',
					entries: [
						{
							index: 0,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
            {
							index: 1,
							name: 'Villain Virus',
              author: "Kobaryo",
							mapper: 'GalaxyMaster & GojiCrafter',
              minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
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
				title: 'Your top mappers',
				subText: 'This mapper was your favourite',
        contentSubText: "These are the top 10 mappers you played the most",
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
            {
							index: 5,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 6,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 7,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 8,
							name: 'Light Ai',
              minutes: 100.33,
							imageUrl: 'https://cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
            {
							index: 9,
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
