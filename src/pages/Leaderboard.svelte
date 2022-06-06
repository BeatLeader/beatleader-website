<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade, fly} from 'svelte/transition';
	import createLeaderboardStore from '../stores/http/http-leaderboard-store';
	import createModifiersStore from '../stores/beatleader/modifiers';
	import {opt, capitalize} from '../utils/js';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import {configStore} from '../stores/config';
	import createVotingStore from '../stores/beatleader/rankVoting';
	import stringify from 'json-stable-stringify';
	import createPlayerService from '../services/beatleader/player';
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

	import {formatNumber} from '../utils/format';
	import {
		getIconNameForDiff,
		describeModifiersAndMultipliers,
		getDescriptionForDiff,
		mapTypeFromMask,
		votingsForTypeStats,
	} from '../utils/beatleader/format';
	import {isValidDate, dateFromUnix} from '../utils/date';
	import LeaderboardStats from '../components/Leaderboard/LeaderboardStats.svelte';
	import {buildSearchFromFilters, createBuildFiltersFromLocation, processStringFilter} from '../utils/filters';
	import ClanBadges from '../components/Player/ClanBadges.svelte';

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
	export let higlightedPlayerId = null;
	export let iconsInInfo = false;
	export let noReplayInLeaderboard = false;
	export let showVotings = false;

	export let autoScrollToTop = true;
	export let showStats = true;

	if (!dontNavigate) document.body.classList.add('slim');

	const dispatch = createEventDispatcher();

	const playerService = createPlayerService();
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

	let itemsPerPage = type === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;

	let availableTypeOptions = [
		{
			type: 'global',
			label: 'Global',
			iconFa: 'fas fa-globe-americas',
			url: `/leaderboard/global/${currentLeaderboardId}/1`,
			filters: {countries: ''},
		},
		{
			type: 'friends',
			label: 'Friends',
			iconFa: 'fas fa-user-friends',
			url: `/leaderboard/friends/${currentLeaderboardId}/1`,
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

		navigate(`/u/${playerId}/beatleader/date/1`);
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
		leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage, {
			...currentFilters,
		});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		const newPage = event.detail.page + 1;

		if (!dontNavigate) navigate(`/leaderboard/${currentType}/${currentLeaderboardId}/${newPage}?${buildSearchFromFilters(currentFilters)}`);

		dispatch('page-changed', {
			leaderboardId: currentLeaderboardId,
			type: currentType,
			page: newPage,
			filters: currentFilters,
		});
	}

	function onDiffChange(event) {
		const newLeaderboardId = opt(event, 'detail.leaderboardId');
		if (!newLeaderboardId) return;

		if (!dontNavigate) navigate(`/leaderboard/${currentType}/${newLeaderboardId}/1?${buildSearchFromFilters(currentFilters)}`);
		else
			changeParams(newLeaderboardId, currentType, 1, {
				search: `?${buildSearchFromFilters(currentFilters)}`,
			});
	}

	function onTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		const newFilters = {
			...currentFilters,
			...(event?.detail?.filters ?? null),
		};
		if (!dontNavigate) navigate(`/leaderboard/${newType}/${currentLeaderboardId}/1?${buildSearchFromFilters(newFilters)}`);
		else if (!dontChangeType)
			changeParams(currentLeaderboardId, newType, 1, {
				search: `?${buildSearchFromFilters(newFilters)}`,
			});

		dispatch('type-changed', {
			leaderboardId: currentLeaderboardId,
			type: newType,
			page: currentPage,
			filters: newFilters,
		});
	}

	function processDiffs(diffArray, song) {
		if (song) {
			const idLength = song.id.length;
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

	const freshScoreAgeMillis = 0;
	const oldScoreAgeMillis = 1000 * 60 * 60 * 24 * 30 * 8; //~8 months
	const freshScoreBrightness = 255;
	const oldScoreBrightness = 128;
	let now = new Date().getTime();

	function getTimeStringColor(timeSet) {
		if (!timeSet) return '#ffffff';
		const scoreAgeMillis = now - (isValidDate(timeSet) ? timeSet : dateFromUnix(timeSet)).getTime();
		let ratio = (scoreAgeMillis - freshScoreAgeMillis) / (oldScoreAgeMillis - freshScoreAgeMillis);
		if (ratio < 0) ratio = 0;
		if (ratio > 1) ratio = 1;
		ratio = Math.pow(1 - ratio, 3);
		const brightnessInt = (oldScoreBrightness + (freshScoreBrightness - oldScoreBrightness) * ratio) | 0;
		const brightnessHex = brightnessInt.toString(16);
		return '#' + brightnessHex + brightnessHex + brightnessHex;
	}

	let mainPlayer = null;
	async function updateMainPlayer(playerId) {
		if (!playerId) {
			mainPlayer = null;
			return;
		}

		mainPlayer = await playerService.get(playerId);
	}

	function updateTypeOptions(country) {
		if (!country?.length) return;

		typeOptions = availableTypeOptions
			.map(to => to)
			.concat([
				{
					type: 'global',
					label: 'Country',
					icon: `<img src="https://cdn.beatleader.xyz/flags/${country.toLowerCase()}.png" loading="lazy" class="country">`,
					url: `/leaderboard/global/${currentLeaderboardId}/1?countries=${country}`,
					filters: {countries: country},
				},
			]);

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;
	}

	const modifiersStore = createModifiersStore();

	let ssCoverDoesNotExists = false;

	let batleRoyaleDraft = false;
	let draftList = [];

	function startBattleRoyale() {
		let link = `https://www.royale.beatleader.xyz/?hash=${hash}&difficulty=${capitalize(diffInfo.diff)}&players=${draftList.join(',')}`;
		window.open(link, '_blank');
	}

	let mapVoting = false;
	$: isLoading = leaderboardStore.isLoading;
	$: pending = leaderboardStore.pending;
	$: enhanced = leaderboardStore.enhanced;

	$: changeParams(leaderboardId, type, page, location);
	$: scrollToTop($pending);
	$: higlightedPlayerId = higlightedPlayerId ?? higlightedScore?.player?.playerId;
	$: scores = opt($leaderboardStore, 'scores', null);
	$: if ($leaderboardStore || $enhanced) leaderboard = opt($leaderboardStore, 'leaderboard', null);
	$: song = opt($leaderboardStore, 'leaderboard.song', null);
	$: diffs = processDiffs(opt($leaderboardStore, 'diffs', []), song);
	$: currentDiff = diffs ? diffs.find(d => d.leaderboardId === currentLeaderboardId) : null;
	$: currentlyLoadedDiff = $pending && diffs ? diffs.find(d => d.leaderboardId === $pending.leaderboardId) : null;
	$: hash = opt($leaderboardStore, 'leaderboard.song.hash');
	$: diffInfo = opt($leaderboardStore, 'leaderboard.diffInfo');
	$: beatSaverCoverUrl = opt($leaderboardStore, 'leaderboard.beatMaps.versions.0.coverURL');
	$: isRanked = leaderboard && leaderboard.stats && leaderboard.stats.status && leaderboard.stats.status === 'Ranked';

	$: mainPlayerId = opt($configStore, 'users.main');
	$: votingStore.fetchStatus(hash, diffInfo?.diff, diffInfo?.type);
	$: votingStatus = $votingStore[hash + diffInfo?.diff + diffInfo?.type];
	$: if (showVotings) votingStore.fetchResults(leaderboardId);
	$: votingStats = $votingStore[leaderboardId];
	$: updateMainPlayer = updateMainPlayer(mainPlayerId);
	$: mainPlayerCountry = mainPlayer?.playerInfo?.countries?.[0]?.country ?? null;
	$: updateTypeOptions(mainPlayerCountry);
</script>

<svelte:head>
	<title
		>{fixedBrowserTitle
			? fixedBrowserTitle
			: `${opt(song, 'name', 'Leaderboard')} / ${currentDiff ? currentDiff.name + ' / ' : ''} ${page} - ${ssrConfig.name}`}</title>
</svelte:head>

{#if mapVoting}
	<RankingVoting {votingStore} {hash} diff={diffInfo?.diff} mode={diffInfo?.type} on:finished={() => (mapVoting = false)} />
{/if}
<section class="align-content">
	<article bind:this={boxEl} class="page-content" transition:fade>
		<div
			class="leaderboard {type === 'accsaber' ? 'no-cover-image' : ''}"
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
						<header transition:fade>
							<h1 class="title is-4">
								<span class="name">{song.name} {song.subName ? song.subName : ''}</span>
								<span class="author">{song.authorName}</span>
								<small class="level-author">{song.levelAuthorName}</small>
							</h1>

							<h2 class="title is-6" class:unranked={!isRanked}>
								{#if leaderboard.categoryDisplayName}
									<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
										<span slot="label">
											{leaderboard.categoryDisplayName}
											{#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★" />{/if}
										</span>
									</Badge>
								{/if}

								{#if leaderboard.stats && leaderboard.stats.status}<span>{leaderboard.stats.status}</span>{/if}
								{#if leaderboard.stats && leaderboard.stats.stars}
									<Value value={leaderboard.stats.stars} digits={2} zero="" suffix="★" />
								{/if}
								{#if leaderboard.diffInfo}<span class="diff"><Difficulty diff={leaderboard.diffInfo} reverseColors={true} /></span>{/if}

								<span class="icons"><Icons {hash} {diffInfo} playerId={higlightedPlayerId} /></span>
								<Button
									cls="replay-button-alt battleroyalebtn"
									icon={`<div class='battleroyale${batleRoyaleDraft ? 'stop' : ''}-icon'></div>`}
									title="Draft battle royal"
									noMargin={true}
									on:click={() => (batleRoyaleDraft = !batleRoyaleDraft)} />
								{#if batleRoyaleDraft && draftList && draftList.length > 0}
									<Button
										cls="replay-button-alt battleroyalebtn"
										icon="<div class='battleroyalestart-icon'></div>"
										title="Let the battle begin!"
										noMargin={true}
										on:click={() => startBattleRoyale()} />
								{/if}
							</h2>
						</header>
					{/if}
					{#if showStats && leaderboard.stats}
						<div class="stats-with-icons">
							<LeaderboardStats {leaderboard} />

							{#if iconsInInfo}
								<span class="icons"><Icons {hash} {diffInfo} playerId={higlightedPlayerId} /></span>
							{/if}
						</div>
					{/if}
				{/if}

				{#if type !== 'accsaber'}
					<div class={votingStatus ? 'switch-and-button' : ''}>
						{#if votingStatus == 2}
							<Button
								cls="voteButton"
								iconFa="fas fa-comment-dots"
								title="Vote this map for ranking!"
								noMargin={true}
								on:click={() => (mapVoting = !mapVoting)} />
						{:else if votingStatus == 1}
							<Button cls="voteButton" disabled={true} iconFa="fas fa-lock" title="Pass this diff to vote on the map" noMargin={true} />
						{:else if votingStatus == 3}
							<Button cls="voteButton" type="green" iconFa="fas fa-clipboard-check" title="Thank your for the vote!" noMargin={true} />
						{/if}
						<nav class="diff-switch">
							{#if !withoutDiffSwitcher && diffs && diffs.length}
								<Switcher values={diffs} value={currentDiff} on:change={onDiffChange} loadingValue={currentlyLoadedDiff} />
							{/if}

							<Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged} loadingValue={currentlyLoadedDiff} />
						</nav>
					</div>
				{/if}

				{#if scores && scores.length}
					<div class="scores-grid grid-transition-helper">
						{#each scores as score, idx}
							{#key opt(score, 'player.playerId')}
								<div
									class={`player-score row-${idx} ${score.player.playerId == higlightedPlayerId ? 'highlight' : ''}`}
									in:fly={{x: 200, delay: idx * 20, duration: 500}}
									out:fade={{duration: 100}}>
									<div class="mobile-container">
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
													type={type === 'accsaber' ? 'accsaber/date' : 'beatleader/date'}
													on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null} />

												<ClanBadges player={score.player} />
											</div>
											<div class="timeset">
												<span style="color: {getTimeStringColor(opt(score, 'score.timeSet', 'null'))}; ">
													{opt(score, 'score.timeSetString', '-')}
												</span>
											</div>
										</div>
										<div class="mobile-second-line">
											{#if !noReplayInLeaderboard}
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
																icon="<div class='battleroyaleescape-icon'></div>"
																title="Remove from battle royal"
																noMargin={true}
																on:click={() => (draftList = draftList.filter(el => el != score.player.playerId))} />
														{/if}
													{:else}
														<Icons {hash} {diffInfo} icons={['replay']} playerId={score.player.playerId} />
													{/if}
												</div>
											{/if}
											{#if type === 'accsaber' || isRanked}
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
												<Accuracy score={score.score} showPercentageInstead={type !== 'accsaber'} noSecondMetric={true} showMods={false} />
											</div>
											<div class="score with-badge">
												<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
													<span slot="label">
														<Value value={opt(score, 'score.score')} inline={false} digits={0} />

														<small title={describeModifiersAndMultipliers(opt(score, 'score.mods'), $modifiersStore)}
															>{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
													</span>
												</Badge>
											</div>
										</div>
									</div>
									{#if showVotings && score.score.rankVoting}
										<div class="rank-voting">
											<div class="score with-badge">
												<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
													<span slot="label">
														<small title="Rankability">{score.score.rankVoting.rankability ? 'YES' : 'NO'} </small>
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
										</div>
									{/if}
								</div>
							{/key}
						{/each}
						{#if votingStats}
							<div class="rank-voting">
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
								<div class="score with-badge">
									<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
										<span slot="label">
											<small class="nowrap-label" title="Map type">{votingsForTypeStats(votingStats.type)}</small>
										</span>
									</Badge>
								</div>
							</div>
						{/if}
					</div>

					<Pager
						totalItems={$leaderboardStore.totalItems}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={$leaderboardStore.totalItems ? 'pages' : 'simple'}
						hide={!['global', 'accsaber'].includes(currentType)}
						on:page-changed={onPageChanged} />
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
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	.diff-switch {
		display: flex;
		justify-content: center;
		margin-bottom: 1em;
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
	}

	header .title {
		color: inherit !important;
	}

	header h1 {
		font-size: 1.5em !important;
		margin-bottom: 0.5em;
	}

	header h1 span.name {
		font-size: 0.875em;
	}

	header h2.title {
		font-size: 1em !important;
		margin-top: 0;
		color: var(--increase, #42b129) !important;
		margin-bottom: 0.5em;
	}

	header h2.title.unranked {
		color: var(--decrease, #f94022) !important;
	}

	header .icons {
		font-size: 0.65em;
	}

	.stats-with-icons {
		display: flex;
		align-content: center;
		justify-content: space-evenly;
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
		grid-row-gap: 0.2em;
		max-width: 100%;
		position: relative;
	}

	.replay-button {
		background-color: transparent;
	}

	.player-score {
		display: flex;
		flex-direction: column;
		grid-gap: 0.4em;
		overflow: hidden;
		border-bottom: 1px solid var(--faded);
		padding-bottom: 0.2em;
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
		padding: 4px;
		margin: -4px -4px 0px -4px;
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
	}

  .nowrap-label {
    white-space: nowrap;
  }

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	:global(.voteButton) {
		margin-top: 1.4em !important;
		margin-bottom: -5em !important;
		height: 1.8em;
	}

	@media screen and (max-width: 767px) {
		.diff-switch {
			flex-direction: column;
		}

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
	}

	img.dummy {
		display: none;
	}
</style>
