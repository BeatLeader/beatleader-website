<script>
	import Badge from '../components/Common/Badge.svelte';
	import Button from '../components/Common/Button.svelte';
	import ClanAccuracy from '../components/Clans/ClanAccuracy.svelte'
	import ClanInfo from '../components/Clans/ClanInfo.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import createClanService from '../services/beatleader/clan';
	import createClanStore from '../stores/http/http-clan-store';
	import createAccountStore from '../stores/beatleader/account';
	import {createEventDispatcher, getContext} from 'svelte';
	import {debounce} from '../utils/debounce';
	import Dialog from '../components/Common/Dialog.svelte';
	import Error from '../components/Common/Error.svelte';
	import Icons from '../components/Song/Icons.svelte';
	import {navigate} from 'svelte-routing';
	import Pager from '../components/Common/Pager.svelte';
	import PlayerCard from '../components/Ranking/PlayerCard.svelte';
	import Pp from '../components/Score/Pp.svelte';
	import Rain from '../components/Common/Rain.svelte';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import SongCover from '../components/Player/SongCover.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ssrConfig from '../ssr-config';
	import {SsrHttpResponseError} from '../network/errors';
	import stringify from 'json-stable-stringify';
	import Switcher from '../components/Common/Switcher.svelte';
	import Value from '../components/Common/Value.svelte';
	

	import {fade, fly} from 'svelte/transition';
	import {flip} from 'svelte/animate';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import {opt, capitalize} from '../utils/js';
	import Avatar from '../components/Common/Avatar.svelte';
	import ClanBadges from '../components/Player/ClanBadges.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../utils/date';
	import Accuracy from '../components/Common/Accuracy.svelte';
	import {
		getIconNameForDiff,
		describeModifiersAndMultipliers,
		getDescriptionForDiff,
		mapTypeFromMask,
		votingsForTypeStats,
		formatDiffStatus,
		DifficultyStatus,
	} from '../utils/beatleader/format';
	import {formatNumber} from '../utils/format';

	export let clanId;
	export let type = 'players';
	export let page = 1;
	export let location;
	export let dontNavigate = false;
	export let dontChangeType = false;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');

	const account = createAccountStore();

	const clanService = createClanService();

	const dispatch = createEventDispatcher();

	let openedDetails = [];
	let showClanRankingScores = false;
	let currentClanId = clanId;

	// FILTERS ---------------------------------------------------------------------------------

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const buildFiltersFromLocation = location => {
		const processString = val => val?.toString() ?? '';

		const params = [{key: 'search', default: '', process: processString}];

		const searchParams = new URLSearchParams(location?.search ?? '');

		return params.reduce(
			(cum, param) => ({
				...cum,
				[param.key]: param.process(searchParams.get(param.key)) ?? param.default,
			}),
			{}
		);
	};
	const buildSearchFromFilters = filters => {
		if (!filters) return '';

		const searchParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => searchParams.append(key, value));

		return searchParams.toString();
	};

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	function scrollToTop() {
		if (boxEl) scrollToTargetAdjusted(boxEl, 44);
	}

	// TYPES -----------------------------------------------------------------------------------

	let currentType = type;

	let availableTypeOptions = [
		{
			type: 'players',
			label: 'Players',
			iconFa: 'fas fa-user-friends',
			url: `/clan/${currentClanId}/players`,
			filters: {countries: ''},
		},
		{
			type: 'capturedLeaderboards',
			label: 'Captured Leaderboards',
			iconFa: 'fas fa-globe-americas',
			url: `/clan/${currentClanId}/capturedLeaderboards`,
			filters: {countries: ''},
		}
	]
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

	// EVENTS ----------------------------------------------------------------------------------

	const clanStore = createClanStore(currentClanId, currentType, page, currentFilters)

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	function changeParams(newClanId, newType, newPage, newLocation) {
		if (newLocation === undefined) newLocation = {search: `?${buildSearchFromFilters(currentFilters)}`};

		currentFilters = buildFiltersFromLocation(newLocation);

		currentClanId = newClanId;

		currentType = newType;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;

		currentPage = newPage;
		clanStore.fetch(currentClanId, currentType, currentPage, {...currentFilters});
	}

	function changePageAndFilters(clanId, newPage, newLocation) {
		if (!clanId) return;

		currentFilters = buildFiltersFromLocation(newLocation);

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		clanStore.fetch(clanId, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/clan/${currentClanId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		const newFilters = {...currentFilters, ...(event?.detail?.filters ?? null)};
		if (!dontNavigate) navigate(`/clan/${currentClanId}/${newType}/1?${buildSearchFromFilters(newFilters)}`);
		else if (!dontChangeType) changeParams(currentClanId, newType, 1, {search: `?${buildSearchFromFilters(newFilters)}`});

		dispatch('type-changed', {clanId: currentClanId, type: newType, page: currentPage, filters: newFilters});
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/clan/${currentClanId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onSearchChanged(e) {
		currentFilters.search = e.target.value ?? '';
		navigateToCurrentPageAndFilters();
	}

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800) {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink: previewLink});
		}
	};

	function toggleOpen(scoreId) {
		if (!scoreId) return;

		if (openedDetails.includes(scoreId)) {
			openedDetails = openedDetails.filter(id => id !== scoreId);
		} else {
			openedDetails = [...openedDetails, scoreId];
		}
	}

	const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

	const canBeKicked = (clan, player) => clan?.leaderID && clan.leaderID !== player?.playerId;

	let kickedPlayer = null;
	let kickingError = null;
	async function onKick(player) {
		if (!player?.playerId) return;

		try {
			kickingError = null;

			await clanService.kick(player);

			kickedPlayer = null;

			await clanStore.refresh();
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				kickingError = htmlError?.length ? htmlError : err;
			} else {
				kickingError = err;capturesPage
			}
		}
	}

	// REACTIVES -------------------------------------------------------------------------------

	$: changeParams(clanId, type, page, location);

	$: isLoading = clanStore.isLoading;
	$: pending = clanStore.pending;
	$: numOfItems = $clanStore ? $clanStore?.metadata?.total : null;
	$: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;

	//$: changePageAndFilters(currentClanId, page, location);
	$: scrollToTop($pending);

	$: clan = $clanStore?.container ?? null;
	$: playersPage = $clanStore?.data ?? [];
	$: capturedLeaderboards = clan?.capturedLeaderboards ?? [];

	$: clanLeaderId = clan?.leaderID ?? null;
	$: isFounder = clan?.id && clanLeaderId === $account?.player?.playerId;

	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>{clan?.name ?? ''} / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

{#if clan?.tag == 'BSFR' || clan?.tag == 'BB'}
	<Rain baguete={clan?.tag == 'BSFR'} />
{/if}

<section class="align-content">
	<article class="page-content">
		<ContentBox bind:box={boxEl}>
			<ClanInfo
				{clan}
				on:removed={() => navigate('/clans?refresh=true')}
				on:accepted={() => clanStore.refresh()}
				on:left={() => clanStore.refresh()} />

			{#if $isLoading}<Spinner />{/if}

			{#if kickedPlayer}
				<Dialog
					type="confirm"
					title="Are you sure?"
					okButton="Yeah!"
					cancelButton="Hell no!"
					on:confirm={() => onKick(kickedPlayer)}
					on:cancel={() => (kickedPlayer = null)}>
					<div slot="content">
						<div>You will kick <strong>{kickedPlayer?.name ?? '<Unknown player>'}</strong> out of the clan...</div>

						{#if kickingError}
							<Error error={kickingError} />
						{/if}
					</div>
				</Dialog>
			{/if}
			<Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged} />
			{#if currentType === 'players'}
				{#if playersPage?.length}
					<div class="players grid-transition-helper" class:with-icons={isFounder}>
						{#each playersPage as player, idx (player.playerId)}
							<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
								<PlayerCard
									{player}
									playerId={mainPlayerId}
									withCrown={clanLeaderId === player.playerId}
									selectedClanTag={clan?.tag}
									value={player?.playerInfo?.pp}
									valueProps={{suffix: 'pp', zero: '-'}} />

								{#if isFounder && canBeKicked(clan, player)}
									<Button
										iconFa="fas fa-trash-alt"
										title="Kick a player out of the clan"
										type="danger"
										noMargin={true}
										on:click={() => (kickedPlayer = player)} />
								{/if}
							</div>
						{/each}
					</div>

					<Pager
						totalItems={numOfItems}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={numOfItems ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
				{:else if !$isLoading}
					<p>No clans found.</p>
				{/if}
			{:else if currentType === 'capturedLeaderboards'}
				{#if capturedLeaderboards?.length}
					<div class="songs grid-transition-helper">
						{#each capturedLeaderboards as leaderboard, idx (opt(leaderboard, 'leaderboard.leaderboardId'))}
							<div class={`song-line row-${idx}`} in:fly={{delay: idx * 10, x: 100}}>
								<div class="mobile-only">
									{#if opt(leaderboard, 'leaderboard.song.hash').length}
										<Icons hash={opt(leaderboard, 'leaderboard.song.hash')} diffInfo={opt(leaderboard, 'leaderboard.diffInfo')} />
									{/if}
								</div>

								<div class="main">
									<div class="mobile-first-line">
										<SongCover capturedLeaderboard={opt(leaderboard, 'leaderboard')} url={`/leaderboard/global/${opt(leaderboard, 'leaderboard.leaderboardId')}/1`} />

										<div class="songinfo">
											<a href={`/leaderboard/global/${opt(leaderboard, 'leaderboard.leaderboardId')}/1`} on:click|preventDefault={() => navigate(`/leaderboard/global/${opt(leaderboard, 'leaderboard.leaderboardId')}/1`)}>
												<span class="name">{opt(leaderboard, 'leaderboard.song.name')}</span>
												<div class="author">{opt(leaderboard, 'leaderboard.song.authorName')} <small>{opt(leaderboard, 'leaderboard.song.levelAuthorName')}</small></div>
											</a>
										</div>
									</div>
									<div class="mobile-second-line">
										<div class="score-options-section">
											<!-- svelte-ignore a11y-click-events-have-key-events -->
											<span
												class="beat-savior-reveal clickable"
												class:opened={showClanRankingScores}
												on:click={() => (showClanRankingScores = !showClanRankingScores)}
												title="Show Scores">
												{#if showClanRankingScores}
													Hide Scores
												{:else}
													Show Scores
												{/if}
												<i class="fas fa-chevron-down" />
											</span>
										</div>
										<div class="pp with-badge">
											<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
												<span slot="label">
													<Pp
														pp={leaderboard.clanRanking[0].clanpp}
														inline={false}
														color="white" />
												</span>
											</Badge>
										</div>
										<div class="percentage with-badge">
											<ClanAccuracy accuracy={leaderboard.clanRanking[0].clanAverageAccuracy * 100} />
										</div>
										<div class="score with-badge">
											<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
												<span slot="label">
													<Value value={leaderboard.clanRanking[0].clanTotalScore} inline={false} digits={0} />
												</span>
											</Badge>
										</div>
	
										{#if opt(leaderboard, 'leaderboard.song.hash').length}
											<div class="tablet-and-up">
												<Icons hash={opt(leaderboard, 'leaderboard.song.hash')} diffInfo={{diff: opt(leaderboard, 'leaderboard.difficultyBl.difficultyName'), type: opt(leaderboard, 'leaderboard.difficultyBl.modeName')}} />
											</div>
										{/if}
									</div>
								</div>
								<div class="main">
									{#if showClanRankingScores}
										<div class="scores-subgrid grid-transition-helper">
											{#each opt(leaderboard.clanRanking[0], 'scores') as score, idx ((opt(score, 'score.id', '')) + (opt(score, 'player.playerId', '')))}
												<div
													class={`row-${idx}`}
													class:user-score={score?.isUserScore}
													class:user-score-top={score?.userScoreTop}
													in:fly={!score?.isUserScore ? {x: 200, delay: idx * 20, duration: 500} : {duration: 300}}
													out:fade={!score?.isUserScore ? {duration: 100} : {duration: 300}}
													animate:flip={score?.isUserScore ? {duration: 300} : {duration: 300}}>
													<div class={'player-score'}>
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
										
																<!--<ClanBadges player={score.player} />-->
															</div>
															<div class="timeset above-tablet">
																<span style="color: {getTimeStringColor(opt(score, 'score.timeSetString', ''))}; ">
																	{opt(score, 'score.timeSetString', '-')}
																</span>
															</div>
															<div class="timeset mobile-only">
																<span style="color: {getTimeStringColor(opt(score, 'score.timeSetString', ''))}; ">
																	{score?.score?.timeSetStringShort ?? ''}
																</span>
															</div>
														</div>
														<div class="mobile-second-line">
															<div class="replay">
																<Button
																	url={`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`}
																	on:click={showPreview(`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`)}
																	cls="replay-button-alt"
																	icon="<div class='replay-icon-alt'></div>"
																	title="Replay"
																	noMargin={true} />
								
																<!-- svelte-ignore a11y-click-events-have-key-events -->
																<span
																	class="beat-savior-reveal clickable"
																	class:opened={openedDetails.includes(score?.score?.id)}
																	on:click={() => toggleOpen(score?.score?.id)}
																	title="Show details">
																	<i class="fas fa-chevron-down" />
																</span>
															</div>
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
																					{leaderboard}
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
										
																		<small title={describeModifiersAndMultipliers(opt(score, 'score.mods'), opt(leaderboard, 'leaderboard.difficultyBl.modifierValues'))}
																			>{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
																	</span>
																</Badge>
															</div>
														</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<Pager
						totalItems={capturedLeaderboards.length}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={capturedLeaderboards.length ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
				{:else}
					<p>No captured leaderboards found.</p>
				{/if}
			{/if}
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		align-items: flex-start !important;
		justify-content: center !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
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

	.players {
		margin-top: 1rem;
		grid-gap: 0.5em;
	}

	.players:not(.with-icons) .ranking-grid-row {
		grid-template-columns: 1fr;
	}

	.players :global(> *:last-child) {
		border-bottom: none !important;
	}

	.scores-subgrid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
		border-top: 1px solid var(--row-separator);
		padding-left: 2em;
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

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.songs :global(> *:last-child) {
		border-bottom: none !important;
	}

	.song-line {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.song-line .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.song-line .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.75em;
	}

	.song-line .main > *:last-child {
		margin-right: 0;
	}

	.songinfo {
		flex-grow: 1;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo small {
		margin-left: 0.25em;
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.icons {
		width: 7em;
		font-size: 0.75em;
		text-align: right;
		margin-right: 0;
		margin-bottom: 0.5em;
	}

	.icons:empty {
		margin-bottom: 0 !important;
	}

	.icons :global(> *) {
		margin-bottom: 0.25em !important;
	}

	.playlist-buttons {
		display: flex;
		margin-top: 1em;
		column-gap: 0.5em;
		flex-wrap: wrap;
	}

	.duplicateDiffsContainer {
		display: flex;
	}

	:global(.playlist-button) {
		height: 1.6em;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column-reverse;
			align-items: center;
		}
	}

	@media screen and (max-width: 767px) {
		.icons {
			margin-bottom: 0.5em;
			width: 100%;
		}

		.playlist-buttons {
			flex-direction: column;
		}
	}

	@media screen and (max-width: 520px) {
		.song-line .main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			grid-column-gap: 0.75em;
		}

		.songinfo {
			text-align: center;
		}
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
</style>