<script>
	import {fade, fly} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';
	import ReplayedSummaryCard from '../components/Replayed/ReplayedSummaryCard.svelte';
	import { fetchJson } from '../network/fetch';
	import { BL_API_URL } from '../network/queues/beatleader/api-queue';

  export let replayedType = 'player';
  export let playerId = "76561198051924392";

	let cards;

  function fetchReplayed() {
		fetchJson(BL_API_URL + 'replayed' + (playerId ? `?playerId=${playerId}` : ''), {
			credentials: 'include',
		}).then(async response => {
      if (replayedType === 'player' && response.body.player != null) {
        prepPlayerData(response.body.player);
      } else if (replayedType === 'mapper' && response.body.mapper != null) {
        prepMapperData(response.body.mapper);
      } else {
        return;
      }


		});
	}

  function prepPlayerData(data) {
    let _cards = [];

    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your top mappers',
          subText: 'This mapper was your favourite',
          contentSubText: 'These are the top 5 mappers you played the most',
          stats: {
            type: 'playerList',
            entries: data.topMappers.slice(0, 5),
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your top mappers %',
          subText: 'You were one of the top players for this mapper',
          contentSubText: 'You were one of the top players for these 3 mappers',
          stats: {
            type: 'playerList',
            entries: data.topMappersPercentage.slice(0, 3),
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your top maps',
          subText: 'This map was your favourite',
          contentSubText: 'These are the top 5 maps you played the most',
          stats: {
            type: 'mapList',
            entries: data.topMaps.slice(0, 5),
          },
        },
      },
    )
    if (data.topFailed) _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your most failed',
          subText: 'This map made you struggle the most',
          contentSubText: 'These are the top 5 maps you failed the most times',
          stats: {
            type: 'mapList',
            entries: data.topFailed.slice(0, 5),
          },
        },
      },
    )
    if (data.topRestarted) _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your most restarted',
          subText: 'You grinded this map a lot',
          contentSubText: 'These are the top 5 maps you grinded the most times',
          stats: {
            type: 'mapList',
            entries: data.topRestarted.slice(0, 5),
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Other stats',
          subText: 'How much did you play this year?',
          contentSubText: 'Some other stats about your year',
          forcedColor: 'rgb(89, 111, 255)',
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
                value: `${data.eventsParticipation.count} events (avg rank: ${data.eventsParticipation.averageRank.toFixed(0)})`,
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
                name: 'active days',
                value: data.activeDays,
              },
              {
                name: 'days streak',
                value: data.daysStreak,
              }
            ]
          },
        },
      },
    )

    _cards.push(
      {
        component: ReplayedSummaryCard,
        props: {
          title: 'Your 2023 in Beat Saber',
          subText: 'A year summarized',
          summaryType: 'player',
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
      },
    )

    cards = _cards;
  }

  function prepMapperData(data) {
    let _cards = [];

    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your top maps',
          subText: 'This map was the most popular',
          contentSubText: 'These are the top 5 maps that were played the most',
          stats: {
            type: 'mapList',
            entries: data.topMaps.slice(0, 5),
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Top x mapper',
          subText: 'For how many players were you the top mapper?',
          contentSubText: 'For how many players were you in the top 1, 3, or 5 mappers?',
          forcedColor: 'rgb(89, 111, 255)',
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
              }
            ]
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Your top players',
          subText: 'This players played your maps the most',
          contentSubText: 'These players played your maps the most',
          stats: {
            type: 'playerList',
            entries: data.topPlayers.slice(0, 5),
          },
        },
      },
    )
    _cards.push(
      {
        component: ReplayedCard,
        props: {
          title: 'Other stats',
          subText: 'How much were your maps played this year?',
          contentSubText: 'Some other stats about your year',
          forcedColor: 'rgb(139, 52, 145)',
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
            ]
          },
        },
      },
    )

    _cards.push(
      {
        component: ReplayedSummaryCard,
        props: {
          title: 'Your 2023 in Mapping',
          subText: 'A year summarized',
          summaryType: 'mapper',
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
      },
    )

    cards = _cards;
  }



  $: fetchReplayed();
</script>

<svelte:head>
	<title>BeatLeader Replayed 2023</title>
</svelte:head>

<section class="align-content">
	<article class="page-content align-content" transition:fade|global>
		<ContentBox cls="main-content-replayed">
			<div class="items">
        {#if cards}
				<FeaturedCarousel {cards} showFillerCards={false} height={'1000%'} cardWidthRatio={1} showButtons />
        {/if}
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
