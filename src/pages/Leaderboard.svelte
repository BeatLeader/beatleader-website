<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade, fly, slide} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import createLeaderboardStore from '../stores/http/http-leaderboard-store';
	import createVotingStore from '../stores/beatleader/rankVoting';
	import createBeatSaverService from '../services/beatmaps';
	import scoreStatisticEnhancer from '../stores/http/enhancers/scores/scoreStatistic';
	import {opt, capitalize} from '../utils/js';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import stringify from 'json-stable-stringify';
	import ssrConfig from '../ssr-config';
	import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../utils/accsaber/consts';
	import Value from '../components/Common/Value.svelte';
	import Avatar from '../components/Common/Avatar.svelte';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import Pp from '../components/Score/Pp.svelte';
	import Badge from '../components/Common/Badge.svelte';
	import Accuracy from '../components/Common/Accuracy.svelte';
	import Difficulty from '../components/Song/Difficulty.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import Button from '../components/Common/Button.svelte';
	import Icons from '../components/Song/Icons.svelte';
	import RankingVoting from '../components/Leaderboard/RankingVoting.svelte';
	import RankUpdate from '../components/Leaderboard/RankUpdate.svelte';
	import BeatSaviorDetails from '../components/BeatSavior/Details.svelte';

	import {formatNumber} from '../utils/format';
	import {
		getIconNameForDiff,
		describeModifiersAndMultipliers,
		getDescriptionForDiff,
		mapTypeFromMask,
		votingsForTypeStats,
		formatDiffStatus,
		DifficultyStatus,
	} from '../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../utils/date';
	import LeaderboardStats from '../components/Leaderboard/LeaderboardStats.svelte';
	import {buildSearchFromFilters, createBuildFiltersFromLocation, processStringFilter} from '../utils/filters';
	import ClanBadges from '../components/Player/ClanBadges.svelte';
	import {flip} from 'svelte/animate';
	import playerScoreApiClient from '../network/clients/beatleader/scores/api-player-score';
	import SongScoreDetails from '../components/Player/SongScoreDetails.svelte';
	import PpCurve from '../components/Leaderboard/PPCurve.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import QualificationApproval from '../components/Leaderboard/QualificationApproval.svelte';
	import QualificationStatus from '../components/Leaderboard/QualificationStatus.svelte';
	import RankedApproval from '../components/Leaderboard/RankedApproval.svelte';
	import MapTypeDescription from '../components/Leaderboard/MapTypeDescription.svelte';
	import ReweightStatus from '../components/Leaderboard/ReweightStatus.svelte';
	import ReweightStatusRanked from '../components/Leaderboard/ReweightStatusRanked.svelte';
	import Preview from '../components/Common/Preview.svelte';
	import LeaderboardMeta from '../components/Leaderboard/LeaderboardMeta.svelte';
	import produce from 'immer';
	import {configStore} from '../stores/config';

	export let leaderboardId;
	export let type = 'global';
	export let page = 1;
	export let location;
	export let withHeader = true;
	export let dontNavigate = false;
	export let withoutDiffSwitcher = false;
	export let withoutHeader = false;
	export let dontChangeType = false;
	export let scrollOffset = 45;
	export let fixedBrowserTitle = null;
	export let higlightedScore = null;
	export let iconsInInfo = false;
	export let noReplayInLeaderboard = false;
	export let separatePage = false;
	export let showCurve = false;

	export let autoScrollToTop = true;
	export let showStats = true;

	export let showApproveRequest = false;

	if (!dontNavigate) document.body.classList.add('slim');

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const votingStore = createVotingStore();

	const params = [{key: 'countries', default: '', process: processStringFilter}];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params);

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentLeaderboardId = leaderboardId;
	let currentType = type;
	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;
	let leaderboard = null;

	let modifiedStars = null;

	let openedDetails = [];

	let itemsPerPage = type === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;

	let availableTypeOptions = [
		{
			type: 'global',
			label: 'Global',
			iconFa: 'fas fa-globe-americas',
			url: `/leaderboard/global/${currentLeaderboardId}/1`,
			filters: {countries: ''},
		},
	].concat(
		type === 'accsaber'
			? [
					{
						type: 'accsaber',
						label: 'AccSaber',
						icon: '<div class="accsaber-icon">',
						url: `/leaderboard/accsaber/${currentLeaderboardId}/1`,
						filters: {countries: ''},
					},
			  ]
			: []
	);

	let typeOptions = availableTypeOptions.map(to => to);

	const stringifyFilters = (query, keys) =>
		stringify((keys ?? Object.keys(query)).reduce((obj, k) => ({...obj, [k]: query?.[k] ?? ''}), {})).toLowerCase();
	const findCurrentTypeOption = (type, filters) => {
		const exactMatch = typeOptions.find(
			to => to?.type === type && stringifyFilters(to?.filters ?? {}) === stringifyFilters(filters, Object.keys(to?.filters ?? []))
		);
		if (exactMatch) return exactMatch;

		return typeOptions.find(to => to?.type === type) ?? null;
	};

	let currentTypeOption = findCurrentTypeOption(currentType, currentFilters) ?? typeOptions[0];

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	function scrollToTop() {
		if (autoScrollToTop && boxEl) scrollToTargetAdjusted(boxEl, scrollOffset);
	}

	const leaderboardStore = createLeaderboardStore(leaderboardId, type, page, currentFilters);

	function changeParams(newLeaderboardId, newType, newPage, newLocation) {
		if (newLocation === undefined) newLocation = {search: `?${buildSearchFromFilters(currentFilters)}`};

		currentFilters = buildFiltersFromLocation(newLocation);

		currentLeaderboardId = newLeaderboardId;

		currentType = newType;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;

		currentPage = newPage;
		leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		const newPage = event.detail.page + 1;

		if (!dontNavigate) navigate(`/leaderboard/${currentType}/${currentLeaderboardId}/${newPage}?${buildSearchFromFilters(currentFilters)}`);

		dispatch('page-changed', {leaderboardId: currentLeaderboardId, type: currentType, page: newPage, filters: currentFilters});
	}

	function onDiffChange(event) {
		const newLeaderboardId = opt(event, 'detail.leaderboardId');
		if (!newLeaderboardId) return;

		if (!dontNavigate) navigate(`/leaderboard/${currentType}/${newLeaderboardId}/1?${buildSearchFromFilters(currentFilters)}`);
		else changeParams(newLeaderboardId, currentType, 1, {search: `?${buildSearchFromFilters(currentFilters)}`});
	}

	function onTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		const newFilters = {...currentFilters, ...(event?.detail?.filters ?? null)};
		if (!dontNavigate) navigate(`/leaderboard/${newType}/${currentLeaderboardId}/1?${buildSearchFromFilters(newFilters)}`);
		else if (!dontChangeType) changeParams(currentLeaderboardId, newType, 1, {search: `?${buildSearchFromFilters(newFilters)}`});

		dispatch('type-changed', {leaderboardId: currentLeaderboardId, type: newType, page: currentPage, filters: newFilters});
	}

	function onSelectedGroupEntryChanged(event) {
		const newLeaderboardId = selectedGroupEntry;
		if (!dontNavigate) navigate(`/leaderboard/${currentType}/${newLeaderboardId}/1?${buildSearchFromFilters(currentFilters)}`);
		else changeParams(newLeaderboardId, currentType, 1, {search: `?${buildSearchFromFilters(currentFilters)}`});
	}

	function processDiffs(diffArray, song) {
		if (song) {
			const idLength = song?.id?.length;
			diffArray = diffArray.sort(function (a, b) {
				let diffNumA = parseInt(a.leaderboardId[idLength]);
				let diffNumB = parseInt(b.leaderboardId[idLength]);
				if (diffNumA < diffNumB) return -1;
				if (diffNumA > diffNumB) return 1;
				return 0;
			});
			diffArray = diffArray.sort(function (a, b) {
				let diffNumA = parseInt(a.leaderboardId.substring(idLength + 1));
				let diffNumB = parseInt(b.leaderboardId.substring(idLength + 1));
				if (diffNumA < diffNumB) return -1;
				if (diffNumA > diffNumB) return 1;
				return 0;
			});
		}

		return diffArray.map(d => ({
			...d,
			label: d.name,
			url: `/leaderboard/${currentType}/${d.leaderboardId}`,
			icon: `<div class="${getIconNameForDiff(d)}" title="${getDescriptionForDiff(d)}">`,
		}));
	}

	function updateTypeOptions(country, playerHasFriends) {
		if (!country?.length && !playerHasFriends) return;

		typeOptions = availableTypeOptions
			.map(to => to)
			.concat(
				playerHasFriends
					? [
							{
								type: 'friends',
								label: 'Friends',
								iconFa: 'fas fa-user-friends',
								url: `/leaderboard/friends/${currentLeaderboardId}/1`,
								filters: {countries: ''},
							},
					  ]
					: []
			)
			.concat(
				isRT
					? [
							{
								type: 'voters',
								label: 'Voters',
								iconFa: 'fas fa-user-friends',
								url: `/leaderboard/voters/${currentLeaderboardId}/1`,
								filters: {countries: ''},
							},
					  ]
					: []
			)
			.concat(
				country?.length
					? [
							{
								type: 'global',
								label: 'Country',
								icon: `<img src="/assets/flags/${country.toLowerCase()}.png" loading="lazy" class="country">`,
								url: `/leaderboard/global/${currentLeaderboardId}/1?countries=${country}`,
								filters: {countries: country},
							},
					  ]
					: []
			);

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;
	}

	let ssCoverDoesNotExists = false;

	let batleRoyaleDraft = false;
	let draftList = [];

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800) {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink: previewLink});
		}
	};

	function startBattleRoyale() {
		let link = `https://royale.beatleader.xyz/?hash=${hash}&difficulty=${capitalize(diffInfo.diff)}&players=${draftList.join(',')}`;
		window.open(link, '_blank');
	}

	function toggleOpen(scoreId) {
		if (!scoreId) return;

		if (openedDetails.includes(scoreId)) {
			openedDetails = openedDetails.filter(id => id !== scoreId);
		} else {
			openedDetails = [...openedDetails, scoreId];
		}
	}

	let userScore = null;
	let userScoreHash = null;
	async function fetchUserScore(playerId, hash, diff, type, userScoreOnCurrentPage = null) {
		if (!playerId?.length || !hash?.length || !diff?.length || !type?.length) {
			userScore = null;
			return;
		}

		const currentHash = `${playerId}${hash}:${diff}:${type}`;
		if (userScoreHash === currentHash) return;

		userScoreHash = currentHash;
		if (userScoreOnCurrentPage) {
			userScore = userScoreOnCurrentPage;
			return;
		}

		try {
			userScore = await playerScoreApiClient.getProcessed({playerId, hash, diff, type});

			if (userScore && !userScore?.player?.clans?.length) {
				userScore.player.clans = $account?.player?.playerInfo?.clans ?? [];
			}
		} catch (err) {
			userScore = null;
		}
	}

	function updateVoteFeedback(score, value) {
		votingStore.voteFeedback(score.id, value, () => {
			if (!score.rankVoting.feedbacks) {
				score.rankVoting.feedbacks = [];
			}

			score.rankVoting.feedbacks.push({
				rtMember: $account.id,
				value,
			});

			scoresWithUser = scoresWithUser;
		});
	}

	let mapVoting = false;
	let rtvoting = false;
	let qualificationUpdate = false;
	let rankUpdate = false;
	let scoresWithUser;

	let verifiedMapperId;
	let generalMapperId;
	let qualificationLimitError;

	let selectedGroupEntry;
	function updateGroupSelection(leaderboardGroup) {
		selectedGroupEntry = currentLeaderboardId;
	}

	function updateScoresWithUser(userScoreOnCurrentPage, scores, userScore) {
		scoresWithUser =
			!userScoreOnCurrentPage && scores?.length && userScore
				? (userScore?.score?.rank < scores?.[0]?.score?.rank ? [{...userScore, isUserScore: true, userScoreTop: true}] : [])
						.concat(scores)
						.concat(
							userScore?.score?.rank > scores?.[scores.length - 1]?.score?.rank
								? [{...userScore, isUserScore: true, userScoreTop: false}]
								: []
						)
				: scores;
	}

	async function updateVerifiedMapperId(mapperId, hash) {
		if (mapperId) {
			let beatSaverService = createBeatSaverService();
			const mapperInfoValue = await beatSaverService.getMapper(mapperId);

			var timeToNomination;
			if (mapperInfoValue.verifiedMapper) {
				timeToNomination = 7;
				verifiedMapperId = mapperId;
			} else {
				timeToNomination = 30;
				verifiedMapperId = 0;
			}
			generalMapperId = mapperId;

			account.refreshLastQualificationTime(hash, time => {
				const currentSeconds = new Date().getTime() / 1000;
				if (currentSeconds - time < 60 * 60 * 24 * timeToNomination) {
					qualificationLimitError =
						'You can nominate new map after ' + Math.round(timeToNomination - (currentSeconds - time) / (60 * 60 * 24)) + ' day(s)';
				} else {
					qualificationLimitError = null;
				}
			});
		}
	}

	let latestHash;

	async function checkMapHash(hash) {
		if (hash) {
			let beatSaverService = createBeatSaverService();

			const songInfoValue = await beatSaverService.byHash(hash, true);

			latestHash = songInfoValue.versions[0].hash.toLowerCase() == hash.toLowerCase();
		}
	}

	let isRankable;
	function calculateIsRankable(isRT, qualification) {
		if (isRT && qualification && qualification.criteriaMet == 1 && qualification.mapperAllowed && qualification.approved) {
			const currentSeconds = new Date().getTime() / 1000;
			isRankable = currentSeconds - qualification.approvalTime < 60 * 60 * 24 * 7;
		} else {
			isRankable = false;
		}
	}

	let showAverageStats = false;

	$: isLoading = leaderboardStore.isLoading;
	$: pending = leaderboardStore.pending;
	$: enhanced = leaderboardStore.enhanced;

	$: changeParams(leaderboardId, type, page, location);
	$: scrollToTop($pending);
	$: scores = opt($leaderboardStore, 'scores', null);
	$: if ($leaderboardStore || $enhanced) leaderboard = opt($leaderboardStore, 'leaderboard', null);
	$: song = opt($leaderboardStore, 'leaderboard.song', null);
	$: leaderboardGroup = opt($leaderboardStore, 'leaderboard.leaderboardGroup', null);
	$: diffs = processDiffs(opt($leaderboardStore, 'diffs', []), song);
	$: currentDiff = diffs ? diffs.find(d => d.leaderboardId === currentLeaderboardId) : null;
	$: currentlyLoadedDiff = $pending && diffs ? diffs.find(d => d.leaderboardId === $pending.leaderboardId) : null;
	$: hash = opt($leaderboardStore, 'leaderboard.song.hash');
	$: diffInfo = opt($leaderboardStore, 'leaderboard.diffInfo');
	$: beatSaverCoverUrl = opt($leaderboardStore, 'leaderboard.beatMaps.versions.0.coverURL');
	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	$: isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	$: isNominated = isQualified || leaderboard?.stats?.status === DifficultyStatus.nominated;
	$: isInEvent = leaderboard?.stats?.status === DifficultyStatus.inevent;
	$: qualification = leaderboard?.qualification;
	$: reweight = leaderboard?.reweight;
	$: calculateIsRankable(isRT, qualification);

	$: higlightedPlayerId = higlightedScore?.playerId ?? $account?.id;
	$: mainPlayerCountry = $account?.player?.playerInfo?.countries?.[0]?.country ?? null;
	$: isRT =
		$account.player &&
		$account.player.playerInfo.role &&
		($account.player.playerInfo.role.includes('admin') || $account.player.playerInfo.role.includes('rankedteam'));
	$: isjuniorRT = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('juniorrankedteam');

	$: playerHasFriends = !!$account?.friends?.length;
	$: updateTypeOptions(mainPlayerCountry, playerHasFriends);
	$: if (song?.mapperId == $account?.player?.playerInfo.mapperId) updateVerifiedMapperId($account?.player?.playerInfo.mapperId, hash);

	$: userScoreOnCurrentPage = scores?.find(s => s?.player?.playerId === higlightedPlayerId);
	$: fetchUserScore(higlightedPlayerId, song?.hash, leaderboard?.diffInfo?.diff, leaderboard?.diffInfo?.type, userScoreOnCurrentPage);
	$: updateScoresWithUser(userScoreOnCurrentPage, scores, userScore);
	$: updateGroupSelection(leaderboardGroup);
	$: votingStore.fetchStatus(hash, diffInfo?.diff, diffInfo?.type);
	$: votingStatus = $votingStore[hash + diffInfo?.diff + diffInfo?.type];
	$: if (separatePage && isRT) votingStore.fetchResults(leaderboardId);
	$: votingStats = $votingStore[leaderboardId];
	$: votingLoading = $votingStore.loading;

	$: beatSaviorPromise = showAverageStats ? scoreStatisticEnhancer(leaderboard, leaderboard) : null;
	$: if (showAverageStats) checkMapHash(song.hash);

	$: modifiers = $leaderboardStore?.leaderboard?.difficultyBl?.modifierValues ?? null;

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	$: leaderboardStatsShown = $configStore?.preferences?.leaderboardStatsShown;
	$: curveShown = $configStore?.preferences?.curveShown;
	$: qualificationInfoShown = $configStore?.preferences?.qualificationInfoShown;
</script>

<svelte:head>
	<title
		>{fixedBrowserTitle
			? fixedBrowserTitle
			: `${opt(song, 'name', 'Leaderboard')} / ${currentDiff ? currentDiff.name + ' / ' : ''} ${page} - ${ssrConfig.name}`}</title>
</svelte:head>

{#if mapVoting}
	<RankingVoting
		{votingStore}
		{leaderboard}
		insideLeaderboard={!separatePage}
		playerId={$account.id}
		{rtvoting}
		{isjuniorRT}
		{qualificationUpdate}
		hideStarSlider={rtvoting && verifiedMapperId != generalMapperId}
		on:finished={() => {
			mapVoting = false;
			rtvoting = false;
			qualificationUpdate = false;
		}} />
{/if}

{#if rankUpdate}
	<RankUpdate
		{votingStore}
		{leaderboard}
		playerId={$account.id}
		reweight={reweight && !reweight.finished ? reweight : null}
		on:finished={() => {
			rankUpdate = false;
		}} />
{/if}

<section class="align-content">
	<article bind:this={boxEl} class="page-content" transition:fade>
		{#if !showApproveRequest && separatePage && qualification && !qualification.mapperAllowed && isRT}
			<a href={window.location.href.replace('leaderboard', 'leaderboard/approval')}>Link for the mapper approval</a>
		{/if}

		{#if (showApproveRequest || (qualification?.mapperAllowed == false && $account?.player?.playerInfo.mapperId == song?.mapperId)) && leaderboard && qualification}
			<ContentBox>
				<div class="qualification-container">
					<QualificationApproval {leaderboard} {account} />
				</div>
			</ContentBox>
		{/if}

		{#if isRankable}
			<ContentBox>
				<div class="qualification-container">
					<RankedApproval {hash} {leaderboard} {votingStore} diff={diffInfo?.diff} mode={diffInfo?.type} />
				</div>
			</ContentBox>
		{/if}

		<div
			class="leaderboard content-box {type === 'accsaber' ? 'no-cover-image' : ''}"
			style={opt($leaderboardStore, 'leaderboard.song.imageUrl')
				? `background: linear-gradient(#303030e2, #101010e5, #101010e5, #101010e5, #303030e2), url(${
						ssCoverDoesNotExists && beatSaverCoverUrl ? beatSaverCoverUrl : $leaderboardStore.leaderboard.song.imageUrl
				  }); background-repeat: no-repeat; background-size: cover; background-position: center;`
				: ''}>
			{#if !$leaderboardStore && $isLoading}
				<div class="align-spinner">
					<Spinner />
				</div>
			{/if}

			{#if $leaderboardStore}
				{#if leaderboard && song && withHeader}
					{#if !withoutHeader}
						<header class="header" transition:fade>
							<div class="header-container">
								<h1 class="title is-4">
									<span class="name" title="Song name">{song.name} {song.subName ? song.subName : ''}</span>
									<span class="author" title="Song author name">{song.authorName}</span>
									<small class="level-author" title="Mapper">{song.levelAuthorName}</small>
								</h1>
							</div>

							<div>
								{#if leaderboardGroup && leaderboardGroup.length > 1}
									<select class="group-select" bind:value={selectedGroupEntry} on:change={onSelectedGroupEntryChanged}>
										{#each leaderboardGroup as option (option.id)}
											<option class="group-option" value={option.id}>
												{#if option.timestamp}
													{formatDateRelative(dateFromUnix(option.timestamp))} - {formatDiffStatus(option.status)}
												{:else}
													{formatDiffStatus(option.status)}
												{/if}
											</option>
										{/each}
									</select>
								{/if}

								{#if !votingLoading}
									{#if votingStatus == 2}
										<Button
											cls="voteButton"
											iconFa={'fas fa-comment-dots'}
											title={'Vote this map for ranking!'}
											noMargin={true}
											on:click={() => (mapVoting = !mapVoting)} />
									{:else if votingStatus == 1}
										<Button
											cls="voteButton"
											disabled={true}
											iconFa="fas fa-lock"
											title="Pass this diff to vote on the map"
											noMargin={true} />
									{:else if votingStatus == 3}
										<Button
											cls="voteButton"
											type="green"
											iconFa="fas fa-clipboard-check"
											title="Thank your for the vote!"
											noMargin={true} />
									{/if}
									{#if separatePage && generalMapperId != 101330 && (isRT || (generalMapperId == leaderboard?.song.mapperId && !isRanked)) && !isNominated}
										{#if !isRT && qualificationLimitError}
											<Button cls="voteButton" disabled={true} iconFa="fas fa-lock" title={qualificationLimitError} noMargin={true} />
										{:else}
											<Button
												cls="voteButton"
												iconFa={isRanked ? 'fas fa-star' : 'fas fa-rocket'}
												title={isRanked ? 'Update map stars' : 'Nominate this map!'}
												noMargin={true}
												on:click={() => {
													mapVoting = !mapVoting;
													rtvoting = true;
												}} />
										{/if}
									{/if}
									{#if separatePage && isRanked && isRT && (!reweight || reweight.rtMember == $account?.id || reweight.finished || !isjuniorRT)}
										<Button
											cls="voteButton"
											iconFa="fa fa-scale-balanced"
											title={reweight && !reweight.finished
												? reweight.rtMember == $account?.id
													? 'Update'
													: 'Approve reweight'
												: 'Start map reweight!'}
											noMargin={true}
											on:click={() => {
												rankUpdate = !rankUpdate;
											}} />
									{/if}
									{#if separatePage && isRT && (leaderboard?.stats?.status === DifficultyStatus.nominated || (!isjuniorRT && isQualified))}
										<Button
											cls="voteButton"
											iconFa="fas fa-list-check"
											title="Update qualification details"
											noMargin={true}
											on:click={() => {
												mapVoting = !mapVoting;
												rtvoting = true;
												qualificationUpdate = true;
											}} />
									{/if}
								{:else}
									<Spinner />
								{/if}
							</div>

							<div class="title-and-buttons">
								<h2 class="title is-6" class:unranked={!isRanked}>
									{#if leaderboard.categoryDisplayName}
										<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
											<span slot="label">
												{leaderboard.categoryDisplayName}
												{#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★" />{/if}
											</span>
										</Badge>
									{/if}

									{#if leaderboard.stats}<span>{formatDiffStatus(leaderboard.stats.status)}</span>{/if}
									{#if leaderboard.stats && leaderboard.stats.stars}
										<Value value={leaderboard.stats.stars} digits={2} zero="" suffix="★" />
									{/if}
									{#if diffs?.length == 1 && leaderboard.diffInfo}<span class="diff"
											><Difficulty diff={leaderboard.diffInfo} reverseColors={true} /></span
										>{/if}
									{#if leaderboard?.stats?.type}
										<MapTypeDescription type={leaderboard?.stats.type} />
									{/if}
								</h2>
								<Icons {hash} {diffInfo} mapCheck={true} batleRoyale={true} bind:batleRoyaleDraft />
							</div>

							{#if batleRoyaleDraft}
								<div class="royale-title-container">
									<span class="royale-title">Select players from the leaderboard to join</span>
									<Button
										type="purple"
										label="Let the battle begin!"
										title="Use the button to the right of timeset for every score to toggle player"
										disabled={!draftList || draftList.length == 0}
										on:click={() => startBattleRoyale()} />
								</div>
							{/if}
						</header>
					{/if}
				{/if}

				{#if type !== 'accsaber'}
					<nav class="diff-switch">
						{#if !separatePage}
							{#if !votingLoading}
								<div class="embeded-voting">
									{#if votingStatus == 2}
										<Button
											cls="voteButton"
											iconFa={'fas fa-comment-dots'}
											title={'Vote this map for ranking!'}
											noMargin={true}
											on:click={() => (mapVoting = !mapVoting)} />
									{:else if votingStatus == 1}
										<Button
											cls="voteButton"
											disabled={true}
											iconFa="fas fa-lock"
											title="Pass this diff to vote on the map"
											noMargin={true} />
									{:else if votingStatus == 3}
										<Button
											cls="voteButton"
											type="green"
											iconFa="fas fa-clipboard-check"
											title="Thank your for the vote!"
											noMargin={true} />
									{/if}
								</div>
							{:else}
								<Spinner />
							{/if}
						{/if}
						{#if !withoutDiffSwitcher && diffs && diffs.length}
							<Switcher values={diffs} value={currentDiff} on:change={onDiffChange} loadingValue={currentlyLoadedDiff} />
						{/if}

						<Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged} loadingValue={currentlyLoadedDiff} />
					</nav>
				{/if}

				{#if scoresWithUser?.length}
					<div class="scores-grid grid-transition-helper">
						{#each scoresWithUser as score, idx ((score?.score?.id ?? '') + (score?.player?.playerId ?? ''))}
							<div
								class={`row-${idx}`}
								class:user-score={score?.isUserScore}
								class:user-score-top={score?.userScoreTop}
								in:fly={!score?.isUserScore ? {x: 200, delay: idx * 20, duration: 500} : {duration: 300}}
								out:fade={!score?.isUserScore ? {duration: 100} : {duration: 300}}
								animate:flip={score?.isUserScore ? {duration: 300} : {duration: 300}}>
								<div class={'player-score' + (score.player.playerId === higlightedPlayerId ? ' highlight' : '')}>
									<div class="mobile-first-line">
										<div class="rank with-badge">
											<Badge
												onlyLabel={true}
												color="white"
												bgColor={opt(score, 'score.rank') === 1
													? 'darkgoldenrod'
													: opt(score, 'score.rank') === 2
													? '#888'
													: opt(score, 'score.rank') === 3
													? 'saddlebrown'
													: opt(score, 'score.rank') >= 10000
													? 'small'
													: 'var(--dimmed)'}>
												<span slot="label">
													#<Value value={opt(score, 'score.rank')} digits={0} zero="?" />
												</span>
											</Badge>
										</div>
										<div class="player">
											<Avatar player={score.player} />
											<PlayerNameWithFlag
												player={score.player}
												type={type === 'accsaber' ? 'accsaber/date' : null}
												on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null} />

											<ClanBadges player={score.player} />
										</div>
										<div class="timeset above-tablet">
											<span style="color: {getTimeStringColor(opt(score, 'score.timeSet', 'null'))}; ">
												{opt(score, 'score.timeSetString', '-')}
											</span>
										</div>
										<div class="timeset mobile-only">
											<span style="color: {getTimeStringColor(score?.score.timeSet ?? '')}; ">
												{score?.score?.timeSetStringShort ?? ''}
											</span>
										</div>
									</div>
									<div class="mobile-second-line">
										{#if !noReplayInLeaderboard && type !== 'accsaber'}
											<div class="replay">
												{#if batleRoyaleDraft}
													{#if !draftList.includes(score.player.playerId) && draftList.length < 10}
														<Button
															cls="replay-button-alt"
															icon="<div class='battleroyalejoin-icon'></div>"
															title="Join battle royal"
															noMargin={true}
															on:click={() => {
																draftList.push(score.player.playerId);
																draftList = draftList;
															}} />
													{:else if draftList.includes(score.player.playerId)}
														<Button
															cls="replay-button-alt"
															icon="<div class='battleroyalestop-icon'></div>"
															title="Remove from battle royal"
															noMargin={true}
															on:click={() => (draftList = draftList.filter(el => el != score.player.playerId))} />
													{/if}
												{:else}
													<Button
														url={`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`}
														on:click={showPreview(`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`)}
														cls="replay-button-alt"
														icon="<div class='replay-icon-alt'></div>"
														title="Replay"
														noMargin={true} />

													<span
														class="beat-savior-reveal clickable"
														class:opened={openedDetails.includes(score?.score?.id)}
														on:click={() => toggleOpen(score?.score?.id)}
														title="Show details">
														<i class="fas fa-chevron-down" />
													</span>
												{/if}
											</div>
										{/if}
										{#if type === 'accsaber' || opt(score, 'score.pp')}
											<div class="pp with-badge">
												<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
													<span slot="label">
														{#if type === 'accsaber'}
															<Pp
																playerId={opt(score, 'player.playerId')}
																pp={opt(score, 'score.ap')}
																weighted={opt(score, 'score.weightedAp')}
																zero={formatNumber(0)}
																withZeroSuffix={true}
																inline={false}
																suffix="AP"
																color="white" />
														{:else}
															<Pp
																playerId={opt(score, 'player.playerId')}
																{leaderboardId}
																pp={opt(score, 'score.pp')}
																whatIf={opt(score, 'score.whatIfPp')}
																inline={false}
																color="white" />
														{/if}
													</span>
												</Badge>
											</div>
										{/if}
										<div class="percentage with-badge">
											<Accuracy score={score.score} showPercentageInstead={type !== 'accsaber'} showMods={false} />
										</div>
										<div class="score with-badge">
											<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
												<span slot="label">
													<Value value={opt(score, 'score.score')} inline={false} digits={0} />

													<small title={describeModifiersAndMultipliers(opt(score, 'score.mods'), modifiers)}
														>{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
												</span>
											</Badge>
										</div>
									</div>
								</div>

								{#if openedDetails.includes(score?.score?.id)}
									<div>
										<SongScoreDetails
											playerId={score?.player?.playerId}
											songScore={score}
											{fixedBrowserTitle}
											noSsLeaderboard={true}
											showAccSaberLeaderboard={false} />
									</div>
								{/if}

								{#if separatePage && score.score.rankVoting}
									<div class="rank-voting">
										<div class="voting-result">
											<div class="score with-badge">
												<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
													<span slot="label">
														<small title="Rankability">{score.score.rankVoting.rankability > 0 ? 'YES' : 'NO'} </small>
													</span>
												</Badge>
											</div>
											{#if score.score.rankVoting.stars}
												<div class="score with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
														<span slot="label">
															<Value title="Stars" value={score.score.rankVoting.stars} inline={false} digits={2} />
														</span>
													</Badge>
												</div>
											{/if}
											{#if score.score.rankVoting.type}
												<div class="score with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
														<span slot="label">
															<small class="nowrap-label" title="Map type">{mapTypeFromMask(score.score.rankVoting.type)}</small>
														</span>
													</Badge>
												</div>
											{/if}
											{#if score.score.rankVoting.timeset}
												<div class="score with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
														<span slot="label">
															<small class="nowrap-label" title="Timeset"
																>{formatDateRelative(dateFromUnix(score.score.rankVoting.timeset))}</small>
														</span>
													</Badge>
												</div>
											{/if}
										</div>
										{#if opt(score, 'player.playerId') != $account?.id}
											<div class="voter-feedback">
												{#if score.score.rankVoting.feedbacks && score.score.rankVoting.feedbacks.filter(f => f.rtMember == $account.id).length}
													{score.score.rankVoting.feedbacks.filter(f => f.rtMember == $account.id)[0].value ? 'Good voter' : 'Bad voter'}
												{:else}
													<Button
														cls="voter-feedback-button"
														type="danger"
														label="Bad voter"
														title="Mark this vote as of bad quality."
														noMargin={true}
														on:click={() => updateVoteFeedback(score.score, 0)} />
													<Button
														cls="voter-feedback-button"
														type="green"
														label="Good voter"
														title="This vote is decently represent the map."
														noMargin={true}
														on:click={() => updateVoteFeedback(score.score, 1)} />
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					{#if votingStats}
						<div class="voting-result">
							<span>Average: </span>
							<div class="score with-badge">
								<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
									<span slot="label">
										<Value title="Average rankability" value={votingStats.rankability} inline={false} digits={2} />
									</span>
								</Badge>
							</div>
							<div class="score with-badge">
								<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
									<span slot="label">
										<Value title="Average stars" value={votingStats.stars} inline={false} digits={2} />
									</span>
								</Badge>
							</div>
							{#if votingsForTypeStats(votingStats.type)}
								<div class="score with-badge">
									<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
										<span slot="label">
											<small class="nowrap-label" title="Map type">{votingsForTypeStats(votingStats.type)}</small>
										</span>
									</Badge>
								</div>
							{/if}
						</div>
					{/if}

					<Pager
						totalItems={$leaderboardStore.totalItems}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={$leaderboardStore.totalItems ? 'pages' : 'simple'}
						hide={!['global', 'accsaber'].includes(currentType)}
						on:page-changed={onPageChanged} />

					{#if !separatePage}
						{#if showStats && leaderboard?.stats}
							<div class="stats-with-icons">
								<LeaderboardStats {leaderboard} />

								{#if iconsInInfo}
									<Icons {hash} {diffInfo} mapCheck={true} />
								{/if}
							</div>
						{/if}
					{/if}

					{#if separatePage && type !== 'accsaber'}
						<div class="score-options-section">
							<span
								class="beat-savior-reveal clickable"
								class:opened={showAverageStats}
								on:click={() => (showAverageStats = !showAverageStats)}
								title="Show average difficulty stats">
								{#if showAverageStats}
									Hide map statistic
								{:else}
									Show map statistic
								{/if}

								<i class="fas fa-chevron-down" />
							</span>
						</div>
						{#if showAverageStats}
							{#await beatSaviorPromise}
								<div class="tab">
									<Spinner />
								</div>
							{:then beatSavior}
								<div transition:slide class="tab">
									<BeatSaviorDetails {beatSavior} />
								</div>
							{/await}
							<small class="level-author">{song.hash}</small>
							{#if latestHash}
								<i class="fa fa-check" style="color: lime;" title="Latest map version" />
							{:else if latestHash == undefined}
								<Spinner />
							{:else}
								<i class="fa fa-xmark" style="color: red;" title="Outdated map" />
							{/if}
							{#if !isNominated && leaderboard.qualification}
								<QualificationStatus qualification={leaderboard.qualification} />
							{/if}
							{#if leaderboard.changes}
								<ReweightStatusRanked map={leaderboard} />
							{/if}
						{/if}
					{/if}
				{:else}
					<p transition:fade>No scores found.</p>
				{/if}
			{:else if !$isLoading}
				<p>Leaderboard not found.</p>
			{/if}
		</div>

		{#if opt($leaderboardStore, 'leaderboard.song.imageUrl')}
			<img class="dummy" src={$leaderboardStore.leaderboard.song.imageUrl} alt="dummy" on:error={() => (ssCoverDoesNotExists = true)} />
		{/if}
	</article>
	{#if separatePage}
		<aside>
			{#if !leaderboardStatsShown}
				<div class="score-options-section">
					<span class="beat-savior-reveal clickable" on:click={() => boolflip('leaderboardStatsShown')} title="Show map details">
						<i class="fas fa-magnifying-glass" />

						<i class="fas fa-chevron-right" />
					</span>
				</div>
			{:else}
				<ContentBox>
					<div class="score-options-section to-the-left">
						<span class="beat-savior-reveal clickable" on:click={() => boolflip('leaderboardStatsShown')} title="Hide map details">
							<i class="fas fa-chevron-left" />
						</span>
					</div>
					{#if showStats && leaderboard?.stats}
						<div class="stats-with-icons">
							<LeaderboardStats {leaderboard} curve={true} />

							{#if iconsInInfo}
								<Icons {hash} {diffInfo} mapCheck={true} />
							{/if}
						</div>
					{/if}
				</ContentBox>
			{/if}

			{#if (isNominated && qualification) || (leaderboard?.reweight && !leaderboard?.reweight.finished)}
				{#if !qualificationInfoShown}
					<div class="score-options-section">
						<span
							class="beat-savior-reveal clickable"
							on:click={() => boolflip('qualificationInfoShown')}
							title="Show qualification details">
							<i class="fas fa-list-ul" />

							<i class="fas fa-chevron-right" />
						</span>
					</div>
				{:else}
					<ContentBox>
						<div class="score-options-section to-the-left">
							<span
								class="beat-savior-reveal clickable"
								on:click={() => boolflip('qualificationInfoShown')}
								title="Hide qualification details">
								<i class="fas fa-chevron-left" />
							</span>
						</div>
						{#if isNominated && qualification}
							<QualificationStatus {qualification} />
						{/if}

						{#if leaderboard?.reweight && !leaderboard?.reweight.finished}
							<ReweightStatus map={leaderboard} />
						{/if}
					</ContentBox>
				{/if}
			{/if}
			{#if showCurve && (isRanked || isNominated || isInEvent) && leaderboard?.stats?.stars}
				{#if !curveShown}
					<div class="score-options-section">
						<span class="beat-savior-reveal clickable" on:click={() => boolflip('curveShown')} title="Show pp curve">
							<i class="fas fa-bezier-curve" />
							<i class="fas fa-chevron-right" />
						</span>
					</div>
				{:else}
					<ContentBox>
						<div class="score-options-section to-the-left">
							<span class="beat-savior-reveal clickable" on:click={() => boolflip('curveShown')} title="Hide pp curve">
								<i class="fas fa-chevron-left" />
							</span>
						</div>
						<h2 class="title is-5">
							PP curve (<Value value={modifiedStars} prevValue={leaderboard?.stats?.stars ?? 0} inline="true" suffix="*" />)
						</h2>
						<PpCurve
							stars={leaderboard?.stats?.stars}
							{modifiers}
							mode={leaderboard?.difficultyBl?.modeName.toLowerCase()}
							on:modified-stars={e => (modifiedStars = e?.detail ?? 0)} />
					</ContentBox>
				{/if}
			{/if}
		</aside>
	{/if}
</section>

{#if separatePage}
	<LeaderboardMeta {leaderboard} {song} />
{/if}

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	aside {
		max-width: 35em;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	.diff-switch {
		display: flex;
		justify-content: center;
		margin-bottom: 1em;
		gap: 0.6em;
		flex-wrap: wrap;
	}

	.diff-switch :global(> *:not(:last-child)) {
		margin-right: 1em;
	}

	.align-spinner {
		display: grid;
		justify-items: center;
	}

	.leaderboard {
		padding: 0.4em 0.6em;
		margin: 6px 10px 16px;
		border-radius: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 33%);
	}

	.leaderboard.no-cover-image {
		background: var(--graph-gradient);
	}

	.leaderboard:before {
		position: absolute;
		content: ' ';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.1;
		background-image: var(--background-image);
		background-repeat: no-repeat;
		background-size: cover;
		pointer-events: none;
	}

	header {
		color: var(--alternate);
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.2em;
		margin-top: 1em;
	}

	header .title {
		color: inherit !important;
	}

	header h1 {
		font-size: 1em !important;
		margin-bottom: 0.5em;
	}

	header h1 span.name {
		font-size: 1.8em;
	}

	header h2.title {
		font-size: 1em !important;
		color: var(--increase, #42b129) !important;
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	header h2.title.unranked {
		color: var(--decrease, #f94022) !important;
	}

	header .icons {
		font-size: 0.65em;
	}

	.header-container {
		display: flex;
		justify-content: space-between;
	}

	.group-select {
		height: fit-content;
		padding: 0.175rem;
		text-align: center;
		white-space: nowrap;
		border: 0;
		border-radius: 0.2em;
		cursor: pointer;
		color: var(--color, #363636);
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0.4em;
	}

	.group-option {
		color: black;
		font-family: inherit;
	}

	.stats-with-icons {
		display: flex;
		align-content: center;
		justify-content: space-evenly;
		flex-direction: column;
		padding: 1em;
	}

	header small {
		font-size: 0.75em;
		color: var(--ppColour);
	}

	header .diff :global(.reversed) {
		display: inline-block;
		padding: 0.1em 0.25em 0.25em 0.25em;
		margin-left: 0.5em;
		margin-right: 0.5em;
		border-radius: 0.25em;
	}

	.scores-grid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
	}

	.scores-grid > *:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}

	.replay-button {
		background-color: transparent;
	}

	.player-score {
		display: flex;
		flex-direction: row;
		grid-gap: 0.4em;
		overflow: hidden;
		padding: 0.2em 0;
		min-width: 19em;
		justify-content: center;
	}

	.mobile-first-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		flex-grow: 1;
	}

	.mobile-second-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	.player-score.highlight {
		background: linear-gradient(45deg, #defb6996, transparent, transparent);
		border-radius: 4px;
		padding: 0.2em;
		margin: 0 -0.2em;
		max-width: 130%;
	}

	.player-score .rank {
		font-size: 0.875em;
		min-width: 2em;
		flex: none;
	}

	.player-score .player {
		display: flex;
		grid-gap: 0.4em;
		flex-grow: 1;
	}

	.player-score .timeset {
		text-align: center;
		min-width: 6.9em;
		flex: none;
	}

	.player-score .replay {
		height: 1.8em;
		min-width: 1.8em;
		flex: none;
	}

	.player-score .pp {
		min-width: 5.5em;
		flex: none;
	}

	.player-score .percentage {
		min-width: 4.5em;
		flex: none;
	}

	.player-score .score {
		min-width: 6em;
		flex: none;
	}

	.player-score :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
		height: 100%;
	}

	.player-score :global(.clan-badges .badge) {
		margin-right: 0.15em !important;
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.player-score :global(.clan-badges) {
		height: 1.2em !important;
	}

	.player-score :global(.badge span) {
		width: 100%;
	}

	.player-score :global(.badge small) {
		display: block;
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.player-score :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.player-score .player :global(.player-name) {
		cursor: pointer;
	}

	.player-score .player :global(figure) {
		width: 1.5em;
		height: 1.5em;
		min-width: 1.5em;
	}

	.player-score .player :global(.player-name) {
		overflow-x: hidden;
		text-overflow: ellipsis;
	}

	.with-badge {
		height: 100%;
		text-align: center;
	}

	.pp.with-badge {
		position: relative;
	}

	.switch-and-button {
		margin-top: -1.5em;
	}

	.mobile-container {
		display: flex;
		flex-direction: row;
		overflow: hidden;
		min-width: 19em;
	}

	.rank-voting {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		justify-content: space-between;
	}

	.voting-result {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	.voter-feedback {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	:global(.voter-feedback-button) {
		height: 1.8em;
	}

	.nowrap-label {
		white-space: nowrap;
	}

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	.title-and-buttons {
		display: flex;
		align-items: center;
		margin-top: 0.5em;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.6em;
	}

	.royale-title {
		color: white;
		text-align: center;
		padding: 1em;
		font-size: large;
	}

	.royale-title-container {
		flex-direction: column;
		display: flex;
		align-items: center;
	}

	.user-score {
		height: auto !important;
	}
	.user-score:not(.user-score-top) > * {
		padding-top: 2rem;
	}

	.user-score.user-score-top > * {
		padding-bottom: 2rem;
	}

	.qualification-container {
		display: flex;
		justify-content: center;
	}

	:global(.voteButton) {
		margin-top: 0.25em !important;
		height: 1.8em;
	}

	.embeded-voting {
		position: fixed;
		left: 1.5em;
		transform: translateY(-0.28em);
	}

	.to-the-left {
		position: absolute;
		left: 0.1em;
		top: 50%;
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

	@media screen and (max-width: 767px) {
		.diff-switch :global(> *:not(:last-child)) {
			margin-right: 0;
			margin-bottom: 0.5em;
		}

		.player-score {
			flex-direction: column;
		}

		.mobile-container {
			flex-direction: column;
		}

		.player-score .replay {
			order: 1;
		}

		.player-score .pp {
			flex-grow: 1;
		}

		.player-score .percentage {
			flex-grow: 1;
		}

		.player-score .score {
			flex-grow: 1;
		}

		.switch-and-button {
			display: inline-flex;
			margin-top: 0.5em;
		}

		:global(.player .clan-badges) {
			display: none;
		}
	}

	img.dummy {
		display: none;
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

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	.player-score .timeset {
		text-align: right;
		min-width: auto;
	}
</style>
