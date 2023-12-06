<script>
	import {fade} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';
	import ReplayedSummaryCard from '../components/Replayed/ReplayedSummaryCard.svelte';

	let cards = [
		{
			component: ReplayedCard,
			props: {
				title: 'Your most played',
				subText: 'You played this map the most',
				contentSubText: 'These are the top 5 maps you played the most',
				stats: {
					type: 'mapList',
					entries: [
						{
							index: 0,
							name: 'Utakata no Sekai de (feat. nayuta)',
							author: 'DJ Raisei vs Setca.',
							mapper: 'Light Ai',
							minutes: 3040.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
						},
						{
							index: 1,
							name: 'Utakata no Sekai de (feat. nayuta)',
							author: 'DJ Raisei vs Setca.',
							mapper: 'Light Ai',
							minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
						},
						{
							index: 2,
							name: 'Villain Virus',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 3,
							name: 'Following the Waving Wings -Last Plaudits-',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							minutes: 300.33,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 4,
							name: 'Villain Virus',
							author: 'Kobaryo',
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
				contentSubText: 'These are the top 5 maps you failed the most times',
				stats: {
					type: 'mapList',
					entries: [
						{
							index: 0,
							name: 'Villain Virus',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							count: 5,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 1,
							name: 'Villain Virus',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							count: 4,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 2,
							name: 'Villain Virus',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							count: 3,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 3,
							name: 'Following the Waving Wings -Last Plaudits-',
							author: 'Kobaryo',
							mapper: 'GalaxyMaster & GojiCrafter',
							count: 2,
							imageUrl: 'https://eu.cdn.beatsaver.com/46dae11677d6191ed03ad61286a09b9070be7800.jpg',
						},
						{
							index: 4,
							name: 'Villain Virus',
							author: 'Kobaryo',
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
				contentSubText: 'These are the top 5 mappers you played the most',
				stats: {
					type: 'mapperList',
					entries: [
						{
							index: 0,
							name: 'Light Ai',
							minutes: 100.33,
							percentPlayers: 0.01,
							imageUrl: '/cors/cdnbeatsaver/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
						{
							index: 1,
							name: 'Light Ai',
							minutes: 100.33,
							percentPlayers: 0.01,
							imageUrl: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
						{
							index: 2,
							name: 'Light Ai',
							minutes: 100.33,
							percentPlayers: 0.01,
							imageUrl: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
						{
							index: 3,
							name: 'Light Ai',
							minutes: 100.33,
							percentPlayers: 0.01,
							imageUrl: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
						{
							index: 4,
							name: 'Light Ai',
							minutes: 100.33,
							percentPlayers: 0.01,
							imageUrl: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
						},
					],
				},
			},
		},
		{
			component: ReplayedCard,
			props: {
				title: 'Other stats',
				subText: 'How many events did you participate in',
				contentSubText: 'Some other stats about your year',
        imageUrl: 'https://cdn.assets.beatleader.xyz/76561198051924392R17.png',
				stats: {
					type: 'statList',
					entries: [
						{
              name: 'hits',
              value: '217338',
            },
            {
              name: 'misses',
              value: '1447',
            },
            {
              name: 'plays',
              value: '918',
            },
            {
              name: 'fails',
              value: '17',
            },
            {
              name: 'restarts',
              value: '224',
            },
            {
              name: 'Event participation',
              value: '2 events (avg rank: 113.5)',
            },
            {
              name: 'Minutes played',
              value: '1149.07 min',
            },
            {
              name: 'Top categories',
              value: 'Ranked, Balanced',
            },
            {
              name: 'active days',
              value: '46',
            },
            {
              name: 'days streak',
              value: '0',
            }
					],
				},
			},
		},
		{
			component: ReplayedSummaryCard,
			props: {
				title: 'Your 2023 in Beat Saber',
				subText: 'A year summarized',
				imageUrl: 'https://media.discordapp.net/attachments/504380776624947212/1181640384858836992/2.5_2_pfp_4_final_choice.png',
				summaryType: 'player',
				stats: {
					topMappers: [
						{
							name: 'Light Ai',
							avatar: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
							minutesPlayed: 100.33,
							percentPlayers: 0.01,
						},
						{
							name: 'Light Ai',
							avatar: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
							minutesPlayed: 100.33,
							percentPlayers: 0.01,
						},
						{
							name: 'Light Ai',
							avatar: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
							minutesPlayed: 100.33,
							percentPlayers: 0.01,
						},
						{
							name: 'Light Ai',
							avatar: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
							minutesPlayed: 100.33,
							percentPlayers: 0.01,
						},
						{
							name: 'Light Ai',
							avatar: 'https://eu.cdn.beatsaver.com/avatar/4a1162e0d049531ef2affff298b459b3ac1644a6.png',
							minutesPlayed: 100.33,
							percentPlayers: 0.01,
						},
					],
					topMaps: [
						{
							name: 'Utakata no Sekai de (feat. nayuta)',
							mapper: 'Light Ai',
							author: 'DJ Raisei vs Setca.',
							cover: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
							previewLink: '',
							minutes: 3040.33,
						},
						{
							name: 'Utakata no Sekai de (feat. nayuta)',
							mapper: 'Light Ai',
							author: 'DJ Raisei vs Setca.',
							cover: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
							previewLink: '',
							minutes: 3040.33,
						},
						{
							name: 'Utakata no Sekai de (feat. nayuta)',
							mapper: 'Light Ai',
							author: 'DJ Raisei vs Setca.',
							cover: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
							previewLink: '',
							minutes: 3040.33,
						},
						{
							name: 'Utakata no Sekai de (feat. nayuta)',
							mapper: 'Light Ai',
							author: 'DJ Raisei vs Setca.',
							cover: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
							previewLink: '',
							minutes: 3040.33,
						},
						{
							name: 'Utakata no Sekai de (feat. nayuta)',
							mapper: 'Light Ai',
							author: 'DJ Raisei vs Setca.',
							cover: 'https://eu.cdn.beatsaver.com/f0f9a64303c5f4254a9a3624dd79bddb3e437682.jpg',
							previewLink: '',
							minutes: 3040.33,
						},
					],
          extraStats: [
            {
              name: 'Plays',
              value: '918',
            },
            {
              name: 'Active days',
              value: '46',
            },
            {
              name: 'Days streak',
              value: '0',
            },
            {
              name: 'Minutes played',
              value: '1149.07 min',
            },
            {
              name: 'Top categories',
              value: 'Ranked, Balanced',
            },
          ],
				},
			},
		},
	];
</script>

<svelte:head>
	<title>BeatLeader Replayed 2023</title>
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
		aspect-ratio: 9 / 14.5; /*results in ~9 / 16 for ReplayedCard*/
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
