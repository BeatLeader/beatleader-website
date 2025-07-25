<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {createBuildFiltersFromLocation, buildSearchFromFilters, processStringFilter, processStringArrayFilter} from '../utils/filters';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../utils/date';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';
	import Event from '../components/Event/Event.svelte';
	import {Confetti} from 'svelte-confetti';
	import EventMeta from '../components/Event/EventMeta.svelte';
	import PlayerMention from '../components/Scores/PlayerMention.svelte';

	export let page = 1;
	export let location;
	export let eventId;

	const account = createAccountStore();

	const FILTERS_DEBOUNCE_MS = 500;

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
	};

	var params = [
		{
			key: 'search',
			label: 'Player Name',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a player',
			onChange: e => {
				const length = e?.target?.value?.length;
				if (length > 0 && length < 3) return;

				onInputChange(e, 'search');
			},
		},
		{
			key: 'countries',
			label: 'Countries',
			default: [],
			process: processStringArrayFilter,
			type: 'countries',
			value: [],
			values: [],
			onChange: e => {
				const param = findParam('countries');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.key === 'countries') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : (p?.default ?? []);
				filters[p.key] = filters[p.key] ?? [];
			} else {
				filters[p.key] = p.multi
					? ((p?.values ?? [])?.map(v => v?.id)?.filter(v => filters?.[p.key]?.includes(v)) ?? p?.default ?? [])
					: filters?.[p.key]?.length
						? filters[p.key]
						: (p?.default ?? '');

				p.value = p.multi
					? (p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? p?.default ?? [])
					: (filters?.[p.key] ?? p?.default ?? '');
			}
		});

		return filters;
	});

	document.body.classList.add('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let currentEventId = eventId;
	let currentEvent;
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			if (p.key === 'countries') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : (p?.value ?? '');
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : (p?.value ?? '');
			}
		});

		params = params;

		currentPage = 1;
		preventScroll = noScroll;

		navigateToCurrentPageAndFilters();
	}

	function changeParams(newPage, eventId, newLocation, replace) {
		currentEventId = eventId;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentFilters = buildFiltersFromLocation(newLocation);
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
		}

		currentPage = newPage;

		if (!currentEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					currentEvent = ev;
				});
		}
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/event/${currentEventId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/event/${currentEventId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {replace, preserveScroll: true});
	}

	let topPlayerId;
	let tenthPlayerId;
	let fifteethPlayerId;
	function onPlayersFetched(event) {
		if (event.detail && event.detail.length && currentFilters.countries.length == 0 && currentFilters.search.length == 0) {
			topPlayerId = event.detail[0].playerId;
			tenthPlayerId = event.detail.length > 10 ? event.detail[9].playerId : null;
			fifteethPlayerId = event.detail.length > 50 ? event.detail[49].playerId : null;
		}
	}

	let modalShown;

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: changeParams(page, eventId, location, true);
	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>Event / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<aside>
		<ContentBox cls={eventId == 23 ? 'festive' : ''}>
			<Event event={currentEvent} withLeader={false} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
		</ContentBox>
	</aside>

	<article class="page-content" transition:fade|global>
		{#if eventId == 23}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Have you ever wondered how Beat Saber would feel with timing based scoring instead of accuracy based? Wonder no more!<br />
					Limited time offer from BeatLeader. Install the mods and play custom mode to try our attempt at reimagining the game.<br />
					No preswing, postswing or accuracy, only you and cubes. <br /><br />
				</span>
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-modifiers-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" color="#2d4150" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-modifiers-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest mod" color="#2d4150" />
					</a>
				</div>
				<span>
					<br />
					Event consists of 10 Christmas themed songs and 10 most voted ranked maps.<br />
					Thank you mappers and ranking team for the productive year<br />
					<b>Happy holidays and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 31}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<b
					>This event used completely separate leaderboards to allow players to set new scores. These leaderboards are gone now. Players
					ranking kept for historical purpose here.<br /></b>
			</ContentBox>
		{/if}
		{#if eventId == 32 || eventId == 48}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<b>Score Recycling Initiative<br /></b>
				<span>
					Players were improving their scores to cut down wasted space and make PP growth sustainable<br />
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 34}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					<b>Beat Saber turned 5! Happy Birthday and thank you for megaton of Dopamine generated!</b><br />
					Check out and compete on maps made by awesome mappers for
					<a href="https://beatsaver.com/playlists/84243" target="_blank" rel="noreferrer">[2018 THROWBACK]</a>
					and <a href="https://beatsaver.com/playlists/89418" target="_blank" rel="noreferrer">BSMG anniversary</a>. <br />
					Top 5 will receive merch from BSMG store as a prize!. <br />
					Skill issue? Don't worry, you can buy it yourself <a href="https://bsmgstore.com/" target="_blank" rel="noreferrer">here</a>
					<br />
					Support modders who are providing you with an exceptional experience for 5 years <br /><br />
				</span>
				Check out also festive sabers and mod in the mod assistant
				<div class="downloadButtons">
					<a href="https://modelsaber.com/Sabers/?id=1682920308" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC sabers" color="red" />
					</a>
					<a href="https://bsmg.dev/5thAnniWhacker" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest sabers" color="blue" />
					</a>
				</div>
				<span>
					Or try our small "festive" theme <a href="/settings#theme" target="_blank" rel="noreferrer"> in settings</a>. <br />
				</span>
				<span>
					<br />
					<b>Happy weekends and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 38}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					<b>Bats? Ghosts? Pumpkins? It's Halloween again? 😱 </b><br />
					Have you ever competed with Ghost Notes modifier? It's time to try! We picked several maps from the awesome
					<a href="https://bsaber.com/scaretastic-pack/" target="_blank" rel="noreferrer">Scaretastic Pack</a>
					and from the <a href="https://beatsaver.com/playlists/203171">BSMG Halloween contest</a>. <br /><br />
					<b>Try your best with Ghost Notes on separate leaderboards to receive merch from BSMG store as a prize for top 5!.</b> <br />
					Skill issue? Don't worry, you can buy it yourself <a href="https://bsmgstore.com/" target="_blank" rel="noreferrer">here</a>
					<br />
					Huge thanks to modders and mappers who always provide us with festive content 🙏 <br /><br />
				</span>
				<span>
					<br />
					<b>Have a scary weekend and holiday, many sweets and fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 46}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Compete on 50 original maps for Beat Saber spanned across 8 packs and almost 6 years!<br />

					Let's remember what journey the game had and how your and mappers skill improved with time. <br />

					<b>Top 10 will receive badges and top 5 various merch presents.</b><br />
					All free difficulties and modes are included except "No Arrows" mode.<br /><br />
				</span>
				For the best OST support - update to the latest mod versions if you haven't yet:
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.8" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download for PC" color="red" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.7.1" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download for Quest" color="blue" />
					</a>
				</div>
				<span>
					<br />
					<b>Good luck and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 50}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span> This event had 3 champions: first, 10th and 50th player! </span>
			</ContentBox>
		{/if}

		{#if eventId == 52}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" />
				<div class="bswcbgblur" />
				<div class="bswc-container">
					<span>
						<b>Beat Saber World Cup 2024 has started!</b> Make a reminder for a match of your favorite team and while waiting try your own
						skill on the maps for champions.<br /><br />
					</span>
					<span style="margin-bottom: 0.5em;">
						On the first week of the tournament 16 teams from different countries will fight for the place in the next round.
					</span>

					<div class="downloadButtons">
						<a href="https://www.twitch.tv/CubeCommunity" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span>
						<br />
						<b>Good luck to the teams! Let the strongest win and everyone have fun! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 53}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" />
				<div class="bswcbgblur" />
				<div class="bswc-container">
					<span>
						<b>Week 2 of BSWC 2024 is here!</b> It features quarter finals for those in the winners bracket, and the first round for those
						in the losers bracket.<br />
						Try your skill on the maps, make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings
						from the last week on the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Good luck to the teams! And good luck in our fan event! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 54}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" />
				<div class="bswcbgblur" />
				<div class="bswc-container">
					<span>
						<b>Week 3 of BSWC 2024 is here!*</b> US vs Denmark and UK vs Canada in a semi-final! I hope you saved some points to bet on
						matches this week, because it's going to be close.<br />
						No need to spend points in our events, only your kilocalories in exchange for fun and a badge for the champion.<br />
						Make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings from the last week on
						the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Good luck to the teams! And good luck in our fan event! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 55}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" />
				<div class="bswcbgblur" />
				<div class="bswc-container">
					<span>
						<b>Week 4 of BSWC 2024 is here!</b> First Final - <b>US vs UK</b>: at {formatDate(dateFromUnix(1723399200))}🍿<br />
						Team members from previous weeks are elegible for this fan event. Have fun!<br />
						Make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings from the last week on
						the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2024/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Let the best win! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 56}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" />
				<div class="bswcbgblur" />
				<div class="bswc-container">
					<span>
						<b>Grand Finals!</b> This week decides - <b>US, UK or Canada</b> will become the champion of 2024.<br />

						Team members from previous weeks are elegible for this fan event. Have fun!<br />
						Make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings from the last week on
						the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>

						<a href="https://cube.community/tournaments/bswc-2024/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>

						<a href="https://cube.community/tournaments/bswc-2024/donate" target="_blank">
							<Button iconFa="fas fa-money-bill-trend-up" type="patreon" label="Add to the prize!" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Meeting in chat at the Final!🍿</b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 59}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Play in our Halloween "Inverted" event, install the Chirality mod, and try the newly generated "Inverted" characteristic.<br />
					It inverts all notes in a map vertically and horizontally in direction. This makes maps more interesting and techy.<br />
					The top 10 players will receive badges and the top 1 will also receive a sweatshirt!<br />
				</span>
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/Chirality/releases/tag/v4.0.900" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Chirality PC" color="#2d4150" />
					</a>
					<a
						href="https://github.com/BeatLeader/Chirality/releases/download/v4.0.900/Chirality-Quest-1.37.0.qmod"
						target="_blank"
						rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Chirality Quest (1.37)" color="#2d4150" />
					</a>
				</div>
				<span>
					<br />
					Event consists of 10 beloved ranked maps, <a href="https://beatsaver.com/playlists/701888">Genres Of Halloween</a> from
					TGMappingGroup, and a few new cool maps.<br />
					Thank you, Zephyr for making Chirality mod and thanks to all the mappers making maps for the festive mood!❤️<br />
					<b>Happy Halloween, have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 65}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					An anonymous Beat Saber mapping contest with a $1000 prize pool is nearing its final.<br />
					Mappers submitted their work and judges picked 15 best maps.<br />
					<b>Now it's your turn to decide what will be ranked on both leaderboards!</b><br />
				</span>
				<div class="downloadButtons">
					<a href="https://forms.gle/dDSfZgwJBU6AGvpy7" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-check-to-slot" label="Vote" type="green" />
					</a>
				</div>
				<span>
					<br />
					We are also having a competition on selected maps, get a badge for making it to the top 3 and try maps for real to make sure only the
					best will be ranked.<br />
					If you want to know more about "Building Blocks 2024", check the info page:<br />
					<div class="downloadButtons">
						<a href="/event/building-blocks-2024" target="_blank" rel="noreferrer">
							<Button iconFa="fas fa-info" label="Info" />
						</a>
					</div>
					<b>Have fun and let's find the best map!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 69}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" style="background-image: url(/assets/bswc2025background.webp) !important" />
				<div class="bswcbgblur" style="filter: brightness(0.9);" />
				<div class="bswc-container" style="color: black">
					<span>
						<b>Beat Saber World Cup 2025 has started!</b> Make a reminder for a match of your favorite team and while waiting try your own
						skill on the maps for champions.<br /><br />
					</span>
					<span style="margin-bottom: 0.5em;">
						On the first week of the tournament 16 teams from different countries will fight for the place in the next round.
					</span>

					<div class="downloadButtons bswc-2025-buttons">
						<a href="https://www.twitch.tv/CubeCommunity" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span>
						<br />
						<b>Good luck to the teams! Let the strongest win and everyone have fun! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 70}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" style="background-image: url(/assets/bswc2025background.webp) !important" />
				<div class="bswcbgblur" style="filter: brightness(0.9);" />
				<div class="bswc-container" style="color: black">
					<span>
						<b>Week 2 of BSWC 2025 is here!</b> It features quarter finals for those in the winners bracket, and the first round for those
						in the losers bracket.<br />
						Try your skill on the maps, make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings
						from the last week on the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons bswc-2025-buttons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Good luck to the teams! And good luck in our fan event! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 71}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" style="background-image: url(/assets/bswc2025background.webp) !important" />
				<div class="bswcbgblur" style="filter: brightness(0.9);" />
				<div class="bswc-container" style="color: black">
					<span>
						<b>Week 3 of BSWC 2025 is here!</b> US vs Israel and UK vs Canada in a semi-final! I hope you saved some points to bet on
						matches this week, because it's going to be close.<br />
						No need to spend points in our events, only your kilocalories in exchange for fun and a badge for the champion.<br />
						Make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings from the last week on
						the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons bswc-2025-buttons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Good luck to the teams! And good luck in our fan event! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 72}
			<ContentBox cls={(modalShown ? 'inner-modal' : '') + 'bswc-box'}>
				<div class="bswcbg" style="background-image: url(/assets/bswc2025background.webp) !important" />
				<div class="bswcbgblur" style="filter: brightness(0.9);" />
				<div class="bswc-container" style="color: black">
					<span>
						<b>Week 4 of BSWC 2025 is here!</b> First Final - <b>US vs Canada</b>: {formatDateRelative(dateFromUnix(1753034400))}🍿<br />
						Team members from previous weeks are elegible for this fan event. Have fun!<br />
						Make a reminder for matches and keep an eye out for the banner on top when they go live. Or check recordings from the last week on
						the BSWC website.
						<br /><br />
					</span>

					<div class="downloadButtons bswc-2025-buttons">
						<a href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader" target="_blank">
							<Button iconFa="fab fa-twitch" type="twitch" label="Watch matches" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025" target="_blank">
							<Button iconFa="fas fa-circle-info" label="BSWC Info" />
						</a>
						<a href="https://cube.community/tournaments/bswc-2025/bracket" target="_blank">
							<Button iconFa="fas fa-diagram-project" label="Bracket" />
						</a>
					</div>

					<span style="margin-top: 0.5em">
						<b>Let the best win! </b>
					</span>
				</div>
			</ContentBox>
		{/if}
		{#if eventId == 73}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Are you sitting bored at home with nothing to do, just sweating to death?<br />
					Well, fortunately for you, <PlayerMention playerId="76561199125063205" /> and <PlayerMention playerId="76561199066888403" /> bring
					you the latest seasonal project:<br /><br />
					<b>BEAT THE HEAT</b><br /><br />
					<PlayerMention playerId="76561199125063205" />
					<PlayerMention playerId="76561199066888403" />
					<PlayerMention playerId="76561198357265984" />
					<PlayerMention playerId="76561198826449821" />
					<PlayerMention playerId="76561199237802861" />
					<PlayerMention playerId="76561198335894744" />
					<PlayerMention playerId="76561198136823393" />
					<PlayerMention playerId="76561198058652116" />
					<PlayerMention playerId="76561199001767132" />
					<PlayerMention playerId="76561199108348236" />
					<PlayerMention playerId="76561198119612390" />
					<PlayerMention playerId="3407080552717504" />
					and <PlayerMention playerId="76561198062524183" /> have come together to make some absolute heater maps for you to enjoy, each with
					its own little summer theme to them.<br />
					Huge thanks to <PlayerMention playerId="76561198101853765" /> for providing artwork for the event ❤️ <br /><br />
					The event will go from July 21st 06:00UTC through July 31st 06:00UTC. There will be an achievement for playing all the maps, and there
					will also be event badges given out to the top 3 players who have the most event pp at the end of the event, so make sure you play
					while you can!
				</span>
				<span>
					<br /><br />
					<b>Prepare your swimsuit, towel, and dive into a refreshing set of new maps! Good luck!🤽</b>
				</span>
			</ContentBox>
		{/if}
		<ContentBox cls={modalShown ? 'inner-modal' : ''}>
			{#each params as param}
				{#if param.type}
					<section class="filter">
						<label>{param?.label ?? param?.key ?? ''}</label>

						{#if param?.type === 'input'}
							<input
								type="text"
								placeholder={param.placeholder ?? null}
								value={param.value}
								on:input={debounce(param.onChange, FILTERS_DEBOUNCE_MS)} />
						{:else if param?.type === 'countries'}
							<Countries countries={param.value} on:change={param.onChange} on:open={e => (modalShown = e.detail)} />
						{/if}
					</section>
				{/if}
			{/each}
		</ContentBox>

		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Ranking

				{#if isLoading}
					<Spinner />
				{/if}
			</h1>

			<RankingTable
				page={currentPage}
				filters={currentFilters}
				playerClickFilter={`eventId=${currentEvent?.id ?? ''}`}
				eventId={currentEventId}
				on:players-fetched={onPlayersFetched}
				on:page-changed={onPageChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
		{#if eventId == 54}
			<span class="star-message">
				* The BSWC Team is not responsible for any damages to controllers that occur while using "cheatreal". If you use "cheatreal" and
				your controller is damaged, you are solely responsible for the cost of repair or replacement. The BSWC Team will not reimburse you
				for any damages to your controller, regardless of the cause. By using "cheatreal", you agree to the terms of this disclaimer. If you
				do not agree to the terms of this disclaimer, you should not use "cheatreal".
			</span>
		{/if}
	</article>

	{#if mainPlayerId && topPlayerId && (mainPlayerId == topPlayerId || (eventId == 50 && (mainPlayerId == tenthPlayerId || mainPlayerId == fifteethPlayerId))) && currentEvent && Date.now() / 1000 < currentEvent.endDate + WEEKSECONDS}
		<div class="confetti">
			<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} size="20" infinite duration="5000" amount="200" fallDistance="100vh" />
		</div>
	{/if}
</section>

{#if currentEvent}
	<EventMeta event={currentEvent} />
{/if}

<style>
	.align-content {
		display: flex;
		justify-content: flex-start;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	aside {
		width: 25em;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
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

	.bswcbg {
		background-image: url(https://cdn.cube.community/1706455892406-Artboard_1_copy_3.webp) !important;
		background-size: cover !important;
		background-position: center !important;
		z-index: 1;
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		border-radius: 8px;
		left: 0;
	}

	.bswcbgblur {
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		filter: brightness(0.5);
		z-index: 2;
		width: 100%;
		position: absolute;
		height: 100%;
		top: 0;
		left: 0;
		border-radius: 8px;
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
	}

	.bswc-container {
		position: relative;
		display: flex;
		flex-direction: column;
		z-index: 3;
	}

	:global(.bswc-2025-buttons button) {
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4) !important;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.star-message {
		font-size: 0.875em;
		color: var(--faded);
		margin: 1em;
		display: block;
	}

	:global(.inner-modal) {
		z-index: 10;
		position: relative;
	}

	:global(.bswc-box) {
		position: relative !important;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
