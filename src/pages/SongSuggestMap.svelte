<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {MetaTags} from 'svelte-meta-tags';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Button from '../components/Common/Button.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import MapSuggestionCard from '../components/Maps/MapSuggestionCard.svelte';
	import Select from '../components/Settings/Select.svelte';
	import {debounce} from '../utils/debounce';
	import createAccountStore from '../stores/beatleader/account';
	import createPlaylistStore from '../stores/playlists';
	import ssrConfig from '../ssr-config';
	import {BL_API_MAPS_URL, BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import {GLOBAL_LEADERBOARD_TYPE, substituteVarsUrl} from '../utils/format';
	import {SORT_BY_VALUES} from '../components/Maps/List/constants';

	export let leaderboardId = null;
	export let location = null;

	const account = createAccountStore();
	const playlists = createPlaylistStore();

	const MAPS_PER_PAGE = 12;
	const MAX_SUGGESTIONS = 24;
	const SUGGESTION_LOOKAHEAD = 60;

	const typeOptions = [
		{key: 'all', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
		{key: 'ost', label: 'OST', iconFa: 'fa fa-compact-disc', color: 'var(--beatleader-primary)'},
		{key: 'nominated', label: 'Nominated', iconFa: 'fa fa-rocket', color: 'var(--beatleader-primary)'},
		{key: 'qualified', label: 'Qualified', iconFa: 'fa fa-check', color: 'var(--beatleader-primary)'},
		{key: 'ranked', label: 'Ranked', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
	];

	const sortOptions = SORT_BY_VALUES.map(option => ({
		value: option.value,
		name: option.name,
		title: option.title,
		icon: option.icon,
	}));

	let browserFilters = {
		search: '',
		type: 'ranked',
		sortBy: 'timestamp',
		order: 'desc',
	};
	let browserPage = 1;
	let browserItemsPerPage = MAPS_PER_PAGE;
	let browserTotalItems = 0;
	let browserMaps = [];
	let browserLoading = false;
	let browserError = null;
	let browserRequestId = 0;

	let selectedSeeds = [];

	let datasetsLoading = true;
	let datasetsError = null;
	let suggestionPlayers = [];
	let suggestionSongsById = {};

	let includeAlreadyPlayed = false;
	let suggestionsLoading = false;
	let suggestionsError = null;
	let suggestions = [];
	let suggestionRunId = 0;

	let generatingPlaylist = false;

	let leaderboardCache = new Map();
	let playedCache = new Map();
	let preloadedLeaderboardId = null;

	document.body.classList.remove('slim');

	function normalizeHash(hash) {
		return (hash ?? '').toLowerCase();
	}

	function lowerFirst(value) {
		return value ? value.charAt(0).toLowerCase() + value.slice(1) : '';
	}

	function getDifficulty(map, preferredLeaderboardId = null) {
		if (!map?.difficulties?.length) return null;

		if (preferredLeaderboardId) {
			const exact = map.difficulties.find(d => d?.leaderboardId == preferredLeaderboardId);
			if (exact) return exact;
		}

		return [...map.difficulties].sort((a, b) => {
			if (!!a?.applicable !== !!b?.applicable) return a?.applicable ? -1 : 1;
			if ((b?.value ?? 0) !== (a?.value ?? 0)) return (b?.value ?? 0) - (a?.value ?? 0);
			return (b?.stars ?? 0) - (a?.stars ?? 0);
		})[0];
	}

	function cloneMapForDifficulty(map, difficulty) {
		if (!map || !difficulty) return null;

		return {
			...map,
			difficulties: [{...difficulty, applicable: true}],
		};
	}

	function createSeed(map, preferredLeaderboardId = null) {
		const difficulty = getDifficulty(map, preferredLeaderboardId);
		if (!difficulty) return null;

		return {
			hash: normalizeHash(map.hash),
			leaderboardId: difficulty.leaderboardId,
			name: map.name,
			map: cloneMapForDifficulty(map, difficulty),
		};
	}

	function hasSeed(hash) {
		const normalizedHash = normalizeHash(hash);
		return selectedSeeds.some(seed => seed.hash === normalizedHash);
	}

	function addSeed(map, preferredLeaderboardId = null) {
		const seed = createSeed(map, preferredLeaderboardId);
		if (!seed || hasSeed(seed.hash)) return;

		selectedSeeds = [seed, ...selectedSeeds];
		recomputeSuggestions();
	}

	function removeSeed(hash) {
		const normalizedHash = normalizeHash(hash);
		selectedSeeds = selectedSeeds.filter(seed => seed.hash !== normalizedHash);
		recomputeSuggestions();
	}

	async function fetchBrowserMaps() {
		const requestId = ++browserRequestId;
		browserLoading = true;
		browserError = null;

		try {
			const response = await fetch(
				substituteVarsUrl(
					BL_API_MAPS_URL,
					{
						page: browserPage,
						count: browserItemsPerPage,
						type: browserFilters.type,
						search: browserFilters.search,
						sortBy: browserFilters.sortBy,
						order: browserFilters.order,
					},
					true,
					true
				),
				{credentials: 'include'}
			);

			if (!response.ok) {
				throw new Error(`Map browser request failed with ${response.status}`);
			}

			const payload = await response.json();
			if (requestId !== browserRequestId) return;

			browserMaps = payload?.data ?? [];
			browserTotalItems = payload?.metadata?.total ?? 0;
			browserItemsPerPage = payload?.metadata?.itemsPerPage ?? MAPS_PER_PAGE;
		} catch (error) {
			if (requestId !== browserRequestId) return;
			browserMaps = [];
			browserTotalItems = 0;
			browserError = error?.message ?? 'Could not load maps.';
		} finally {
			if (requestId === browserRequestId) {
				browserLoading = false;
			}
		}
	}

	const debouncedFetchBrowserMaps = debounce(() => {
		browserPage = 1;
		fetchBrowserMaps();
	}, 250);

	function onBrowserSearch(event) {
		browserFilters = {...browserFilters, search: event?.target?.value ?? ''};
		debouncedFetchBrowserMaps();
	}

	function onBrowserTypeChanged(typeKey) {
		if (!typeKey || typeKey === browserFilters.type) return;
		browserFilters = {...browserFilters, type: typeKey};
		browserPage = 1;
		fetchBrowserMaps();
	}

	function onSortChanged(event) {
		if (!event?.detail?.value || event.detail.value === browserFilters.sortBy) return;
		browserFilters = {...browserFilters, sortBy: event.detail.value};
		browserPage = 1;
		fetchBrowserMaps();
	}

	function onOrderChanged() {
		browserFilters = {...browserFilters, order: browserFilters.order === 'asc' ? 'desc' : 'asc'};
		browserPage = 1;
		fetchBrowserMaps();
	}

	function onBrowserPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event?.detail?.page)) return;
		browserPage = event.detail.page + 1;
		fetchBrowserMaps();
	}

	async function loadDatasets() {
		datasetsLoading = true;
		datasetsError = null;

		try {
			const [playersResponse, songsResponse] = await Promise.all([
				fetch(`${BL_API_URL}songsuggest?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`),
				fetch(`${BL_API_URL}songsuggest/songs`),
			]);

			if (!playersResponse.ok || !songsResponse.ok) {
				throw new Error('Could not load suggestion datasets.');
			}

			const [playersPayload, songsPayload] = await Promise.all([playersResponse.json(), songsResponse.json()]);

			suggestionPlayers = Array.isArray(playersPayload) ? playersPayload : [];
			suggestionSongsById = Object.fromEntries(
				(Array.isArray(songsPayload) ? songsPayload : []).map(song => [
					song.ID,
					{
						...song,
						hash: normalizeHash(song.hash),
					},
				])
			);
		} catch (error) {
			datasetsError = error?.message ?? 'Could not load suggestion data.';
			suggestionPlayers = [];
			suggestionSongsById = {};
		} finally {
			datasetsLoading = false;
		}

		recomputeSuggestions();
	}

	function buildSuggestionCandidates() {
		const selectedIds = new Set(selectedSeeds.map(seed => seed.leaderboardId));
		const selectedHashes = new Set(selectedSeeds.map(seed => seed.hash));
		const candidates = new Map();

		for (const player of suggestionPlayers) {
			const scores = player?.top10kScore ?? [];
			const matches = scores.filter(score => selectedIds.has(score.songID));

			if (!matches.length) continue;

			const matchStrength = matches.reduce((sum, score) => sum + (22 - (score?.rank ?? 20)), 0);
			const playerWeight = (matches.length * matches.length * matchStrength) / Math.log2((player?.rank ?? 1000) + 2);

			for (const score of scores) {
				const meta = suggestionSongsById?.[score?.songID];
				if (!meta) continue;
				if (selectedIds.has(score.songID) || selectedHashes.has(meta.hash)) continue;

				const candidateKey = meta.hash;
				const rankBoost = 22 - (score?.rank ?? 20);
				const contribution = playerWeight * (score?.pp ?? 0) * rankBoost;

				if (!candidates.has(candidateKey)) {
					candidates.set(candidateKey, {
						hash: meta.hash,
						leaderboardId: score.songID,
						name: meta.name,
						difficulty: meta.difficulty,
						mode: meta.mode,
						stars: meta.stars ?? 0,
						totalScore: 0,
						playerIds: new Set(),
						matchIds: new Set(),
						bestContribution: Number.NEGATIVE_INFINITY,
					});
				}

				const candidate = candidates.get(candidateKey);
				candidate.totalScore += contribution;
				candidate.playerIds.add(player.id);
				matches.forEach(match => candidate.matchIds.add(match.songID));

				if (contribution > candidate.bestContribution) {
					candidate.bestContribution = contribution;
					candidate.leaderboardId = score.songID;
					candidate.name = meta.name;
					candidate.difficulty = meta.difficulty;
					candidate.mode = meta.mode;
					candidate.stars = meta.stars ?? 0;
				}
			}
		}

		return [...candidates.values()]
			.map(candidate => ({
				...candidate,
				playerCount: candidate.playerIds.size,
				matchCount: candidate.matchIds.size,
			}))
			.sort((a, b) => {
				if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
				if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount;
				if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
				return (b.stars ?? 0) - (a.stars ?? 0);
			});
	}

	async function fetchLeaderboardMap(leaderboardId) {
		if (!leaderboardId) return null;

		if (!leaderboardCache.has(leaderboardId)) {
			leaderboardCache.set(
				leaderboardId,
				fetch(
					`${BL_API_URL}leaderboard/${leaderboardId}?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}&page=1&count=1`,
					{credentials: 'include'}
				)
					.then(response => {
						if (!response.ok) {
							throw new Error(`Could not load leaderboard ${leaderboardId}`);
						}
						return response.json();
					})
					.then(payload => {
						const song = payload?.song;
						const difficulty = getDifficulty(song, leaderboardId);
						return cloneMapForDifficulty(song, difficulty);
					})
					.catch(() => null)
			);
		}

		return await leaderboardCache.get(leaderboardId);
	}

	async function hasPlayedSong(hash) {
		if (!$account?.id || !hash) return false;

		const normalizedHash = normalizeHash(hash);
		if (!playedCache.has(normalizedHash)) {
			playedCache.set(
				normalizedHash,
				fetch(
					substituteVarsUrl(
						BL_API_MAPS_URL,
						{
							page: 1,
							count: 1,
							type: 'all',
							search: normalizedHash,
							mytype: 'played',
						},
						true,
						true
					),
					{credentials: 'include'}
				)
					.then(response => (response.ok ? response.json() : null))
					.then(payload =>
						Array.isArray(payload?.data)
							? payload.data.some(map => normalizeHash(map?.hash) === normalizedHash)
							: false
					)
					.catch(() => false)
			);
		}

		return await playedCache.get(normalizedHash);
	}

	async function buildSuggestionCards(candidates, runId) {
		const results = [];
		const effectiveIncludeAlreadyPlayed = !$account?.id ? true : includeAlreadyPlayed;
		const candidatesToCheck = candidates.slice(0, SUGGESTION_LOOKAHEAD);

		for (let index = 0; index < candidatesToCheck.length && results.length < MAX_SUGGESTIONS; index += 6) {
			if (runId !== suggestionRunId) return [];

			const chunk = candidatesToCheck.slice(index, index + 6);
			const prepared = await Promise.all(
				chunk.map(async candidate => {
					if (!effectiveIncludeAlreadyPlayed && (await hasPlayedSong(candidate.hash))) {
						return null;
					}

					const map = await fetchLeaderboardMap(candidate.leaderboardId);
					if (!map) return null;

					return {
						...candidate,
						map,
					};
				})
			);

			for (const item of prepared) {
				if (!item) continue;
				results.push(item);
				if (results.length >= MAX_SUGGESTIONS) break;
			}
		}

		return results;
	}

	async function recomputeSuggestions() {
		const runId = ++suggestionRunId;
		suggestionsError = null;

		if (!selectedSeeds.length || datasetsLoading || datasetsError) {
			suggestions = [];
			suggestionsLoading = false;
			return;
		}

		suggestionsLoading = true;

		try {
			const candidates = buildSuggestionCandidates();
			const cards = await buildSuggestionCards(candidates, runId);
			if (runId !== suggestionRunId) return;

			suggestions = cards;
		} catch (error) {
			if (runId !== suggestionRunId) return;
			suggestions = [];
			suggestionsError = error?.message ?? 'Could not build suggestions.';
		} finally {
			if (runId === suggestionRunId) {
				suggestionsLoading = false;
			}
		}
	}

	async function preloadLeaderboardSeed(id) {
		if (!id || preloadedLeaderboardId === id) return;
		preloadedLeaderboardId = id;

		const map = await fetchLeaderboardMap(id);
		if (map) {
			addSeed(map, id);
		}
	}

	function suggestionBadges(suggestion) {
		return [
			`${suggestion.playerCount} player${suggestion.playerCount === 1 ? '' : 's'}`,
			`${suggestion.matchCount} seed match${suggestion.matchCount === 1 ? '' : 'es'}`,
			`${suggestion.difficulty} ${suggestion.mode}`,
		];
	}

	function playlistSongFromSuggestion(suggestion) {
		const difficulty = suggestion?.map?.difficulties?.[0];
		if (!suggestion?.map || !difficulty) return null;

		return {
			hash: suggestion.hash,
			songName: suggestion.map.name,
			levelAuthorName: suggestion.map.mapper,
			difficulties: [
				{
					name: lowerFirst(difficulty.difficultyName),
					characteristic: difficulty.modeName,
				},
			],
		};
	}

	async function imageToDataUrl(path) {
		const response = await fetch(path);
		const blob = await response.blob();

		return await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	async function generatePlaylistFromSuggestions() {
		if (!suggestions?.length) return;

		generatingPlaylist = true;

		try {
			const songs = suggestions.map(playlistSongFromSuggestion).filter(Boolean);
			if (!songs.length) return;

			await playlists.create(null, {
				playlistTitle: 'Map suggestions',
				playlistAuthor: 'BeatLeader',
				songs,
				image: await imageToDataUrl('/assets/defaultplaylisticon.png'),
			});

			navigate('/playlists');
		} finally {
			generatingPlaylist = false;
		}
	}

	let accountId = null;

	$: if (($account?.id ?? null) !== accountId) {
		accountId = $account?.id ?? null;
		playedCache = new Map();
		recomputeSuggestions();
	}

	$: location?.pathname;

	$: if (leaderboardId && leaderboardId !== preloadedLeaderboardId) {
		preloadLeaderboardSeed(leaderboardId);
	}

	$: emptySuggestionState =
		!selectedSeeds.length
			? 'Select one or more maps above to generate suggestions.'
			: datasetsLoading
				? 'Loading suggestion data...'
				: !suggestionsLoading && !suggestions.length && !suggestionsError
					? 'No suggestions matched the current seed maps.'
					: null;

	$: effectiveIncludeAlreadyPlayed = !$account?.id ? true : includeAlreadyPlayed;
	$: metaDescription = 'Build Beat Saber map suggestions from your selected ranked maps and turn the result into a playlist.';

	onMount(() => {
		fetchBrowserMaps();
		loadDatasets();
		if (leaderboardId) {
			preloadLeaderboardSeed(leaderboardId);
		}
	});
</script>

<svelte:head>
	<title>Map Suggestions</title>
</svelte:head>

<section class="align-content">
	<article class="page-content">
		<div class="page-grid">
			<ContentBox cls="section-box">
				<div class="section-header">
					<div>
						<p class="eyebrow">Step 1</p>
						<h1>Selected maps</h1>
					</div>
					<div class="section-note">{selectedSeeds.length} selected</div>
				</div>

				{#if selectedSeeds.length}
					<div class="maps-grid selected-grid">
						{#each selectedSeeds as seed (seed.hash)}
							<MapSuggestionCard
								map={seed.map}
								actionLabel="Remove"
								actionIconFa="fas fa-xmark"
								actionType="danger"
								actionTitle="Remove from selected maps"
								on:action={() => removeSeed(seed.hash)} />
						{/each}
					</div>
				{:else}
					<div class="empty-state">
						<p>No maps selected yet.</p>
						<span>Use the browser below to add seed maps for recommendations.</span>
					</div>
				{/if}
			</ContentBox>

			<ContentBox cls="section-box browser-box">
				<div class="section-header">
					<div>
						<p class="eyebrow">Step 2</p>
						<h2>Browse maps</h2>
					</div>
					<div class="section-note">Compact maps list</div>
				</div>

				<div class="browser-controls">
					<input
						class="search-input"
						type="text"
						placeholder="Search by song, artist, mapper, or hash"
						value={browserFilters.search}
						on:input={onBrowserSearch} />

					<div class="inline-controls">
						<div class="types-row">
							{#each typeOptions as option}
								<Button
									cls="type-button"
									iconFa={option.iconFa}
									label={option.label}
									type={browserFilters.type === option.key ? 'primary' : 'default'}
									noMargin={true}
									on:click={() => onBrowserTypeChanged(option.key)} />
							{/each}
						</div>

						<div class="sort-row">
							<Select bind:value={browserFilters.sortBy} options={sortOptions} on:change={onSortChanged} fontSize="0.8" />
							<Button
								cls="order-button"
								iconFa={`fas ${browserFilters.order === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'}`}
								label={browserFilters.order === 'asc' ? 'Ascending' : 'Descending'}
								noMargin={true}
								on:click={onOrderChanged} />
						</div>
					</div>
				</div>

				<div class="browser-body">
					{#if browserLoading}
						<div class="state-block">
							<Spinner />
						</div>
					{:else if browserError}
						<div class="state-block">
							<p>{browserError}</p>
						</div>
					{:else if browserMaps.length}
						<div class="maps-grid browser-grid">
							{#each browserMaps as map (map.hash)}
								<MapSuggestionCard
									{map}
									actionLabel={hasSeed(map.hash) ? 'Selected' : 'Select'}
									actionIconFa={hasSeed(map.hash) ? 'fas fa-check' : 'fas fa-circle-check'}
									actionType={hasSeed(map.hash) ? 'green' : 'primary'}
									actionTitle="Add to selected maps"
									actionDisabled={hasSeed(map.hash)}
									on:action={() => addSeed(map)} />
							{/each}
						</div>
					{:else}
						<div class="state-block">
							<p>No maps found.</p>
						</div>
					{/if}
				</div>

				<div class="browser-footer">
					<Pager
						totalItems={browserTotalItems}
						itemsPerPage={browserItemsPerPage}
						itemsPerPageValues={null}
						currentPage={browserPage - 1}
						loadingPage={browserLoading ? browserPage - 1 : null}
						mode={browserTotalItems ? 'pages' : 'simple'}
						on:page-changed={onBrowserPageChanged} />
				</div>
			</ContentBox>

			<ContentBox cls="section-box">
				<div class="section-header">
					<div>
						<p class="eyebrow">Step 3</p>
						<h2>Suggestions</h2>
					</div>
					<div class="section-note">From the song suggestion API</div>
				</div>

				<div class="options-row">
					<label class:disabled={!$account?.id}>
						<input
							type="checkbox"
							checked={effectiveIncludeAlreadyPlayed}
							disabled={!$account?.id}
							on:change={event => {
								includeAlreadyPlayed = event.currentTarget.checked;
								recomputeSuggestions();
							}} />
						<span>Include already played</span>
					</label>

					{#if !$account?.id}
						<span class="options-hint">Sign in to filter out already played maps.</span>
					{/if}
				</div>

				{#if datasetsError}
					<div class="empty-state">
						<p>{datasetsError}</p>
					</div>
				{:else if suggestionsLoading}
					<div class="state-block suggestions-loading">
						<Spinner />
						<span>Scoring candidate maps...</span>
					</div>
				{:else if suggestionsError}
					<div class="empty-state">
						<p>{suggestionsError}</p>
					</div>
				{:else if suggestions.length}
					<div class="maps-grid suggestions-grid">
						{#each suggestions as suggestion (suggestion.hash)}
							<MapSuggestionCard map={suggestion.map} badges={suggestionBadges(suggestion)} />
						{/each}
					</div>
				{:else if emptySuggestionState}
					<div class="empty-state">
						<p>{emptySuggestionState}</p>
					</div>
				{/if}

				<div class="playlist-actions">
					<Button
						cls="playlist-button"
						iconFa={generatingPlaylist ? 'fas fa-spinner fa-spin' : 'fas fa-wand-magic-sparkles'}
						label="Generate playlist from suggestions"
						noMargin={true}
						disabled={!suggestions.length || generatingPlaylist}
						on:click={generatePlaylistFromSuggestions} />
				</div>
			</ContentBox>
		</div>
	</article>
</section>

<MetaTags
	title={ssrConfig.name + ' - Map Suggestions'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Map Suggestions',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Map Suggestions',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		width: 100%;
		max-width: 106em;
	}

	.page-grid {
		display: grid;
		gap: 1.2em;
		padding: 0 0.75em 2em;
	}

	:global(.section-box) {
		padding: 1.25em;
		border-radius: 16px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1em;
		margin-bottom: 1em;
	}

	.section-header h1,
	.section-header h2 {
		margin: 0.1em 0 0;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78em;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--beatleader-primary);
	}

	.section-note {
		font-size: 0.9em;
		color: var(--faded);
		text-align: right;
	}

	.maps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(25em, 1fr));
		gap: 1em;
		align-items: start;
	}

	.selected-grid {
		max-height: 25em;
		overflow: auto;
		padding-right: 0.2em;
	}

	:global(.browser-box) {
		display: flex;
		flex-direction: column;
		min-height: 48em;
		max-height: 72vh;
	}

	.browser-controls {
		display: grid;
		gap: 0.9em;
		margin-bottom: 1em;
	}

	.search-input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
		padding: 0.6em 0;
	}

	.inline-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
	}

	.types-row {
		display: flex;
		gap: 0.45em;
		flex-wrap: wrap;
	}

	.sort-row {
		display: flex;
		align-items: center;
		gap: 0.45em;
		flex-wrap: wrap;
	}

	:global(.type-button) {
		height: 2.15em;
		border-radius: 999px !important;
	}

	:global(.order-button) {
		height: 2.15em;
		border-radius: 999px !important;
	}

	.browser-body {
		flex: 1;
		overflow: auto;
		min-height: 18em;
		padding-right: 0.15em;
	}

	.browser-footer {
		padding-top: 0.8em;
	}

	.state-block,
	.empty-state {
		min-height: 10em;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 0.5em;
		text-align: center;
		color: var(--faded);
	}

	.options-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.8em;
		margin-bottom: 1em;
	}

	.options-row label {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		font-weight: 600;
	}

	.options-row label.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.options-hint {
		color: var(--faded);
		font-size: 0.9em;
	}

	.suggestions-loading {
		min-height: 14em;
	}

	.playlist-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.2em;
	}

	:global(.playlist-button) {
		height: 2.4em;
		border-radius: 999px !important;
	}

	@media screen and (max-width: 900px) {
		.maps-grid {
			grid-template-columns: 1fr;
		}

		:global(.browser-box) {
			max-height: none;
			min-height: 34em;
		}

		.inline-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.sort-row {
			justify-content: space-between;
		}

		.playlist-actions {
			justify-content: stretch;
		}
	}

	@media screen and (max-width: 767px) {
		.page-grid {
			padding-inline: 0;
		}

		:global(.section-box) {
			padding: 0.85em;
			border-radius: 0;
		}

		.section-header {
			flex-direction: column;
			gap: 0.4em;
		}

		.section-note {
			text-align: left;
		}

		.types-row {
			width: 100%;
		}

		.options-row {
			align-items: flex-start;
		}
	}
</style>
