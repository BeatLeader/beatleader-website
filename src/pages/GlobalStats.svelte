<script>
	import {fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import Section from '../components/GlobalStats/Section.svelte';
	import ShareChart from '../components/GlobalStats/ShareChart.svelte';
	import LinesChart from '../components/GlobalStats/LinesChart.svelte';
	import StarsChart from '../components/GlobalStats/StarsChart.svelte';
	import StreakChart from '../components/GlobalStats/StreakChart.svelte';
	import RecordChart from '../components/GlobalStats/RecordChart.svelte';
	import RankingBars from '../components/GlobalStats/RankingBars.svelte';
	import RaceChart from '../components/GlobalStats/RaceChart.svelte';
	import {formatNumber} from '../utils/format';
	import {formatDate, dateFromUnix} from '../utils/date';
	import {buildSearchFromFiltersWithDefaults, createBuildFiltersFromLocation, processStringFilter} from '../utils/filters';
	import {
		DAY,
		PERIODS,
		RANGES,
		TRACKING_MARKERS,
		globalStat,
		headsetLabel,
		modVersionLabel,
		platformLabel,
	} from '../components/GlobalStats/utils';

	export let tab = '';
	export let location;

	const TABS = [
		{value: 'players', label: 'Players', iconFa: 'fas fa-users'},
		{value: 'hardware', label: 'Hardware', iconFa: 'fas fa-vr-cardboard'},
		{value: 'versions', label: 'Versions', iconFa: 'fas fa-code-branch'},
		{value: 'maps', label: 'Maps', iconFa: 'fas fa-music'},
		{value: 'records', label: 'Records', iconFa: 'fas fa-trophy'},
		{value: 'mappers', label: 'Mappers', iconFa: 'fas fa-drafting-compass'},
	];

	const METRICS = [
		{value: 'players', label: 'Players'},
		{value: 'attempts', label: 'Attempts'},
		{value: 'clears', label: 'Clears'},
		{value: 'playtime', label: 'Hours played'},
	];

	const TILES = [METRICS[0], {value: 'new', label: 'New players'}, ...METRICS.slice(1)];

	const ACTIVE_LINES = [
		{key: '30d', label: 'Last 30 days'},
		{key: '7d', label: 'Last 7 days'},
		{key: '1d', label: 'Last day'},
	];

	const NEW_PLAYER_LINES = [
		{key: 'returning', label: 'Returning'},
		{key: 'new', label: 'New'},
	];

	const URL_PARAMS = [
		{key: 'range', default: '1y', process: processStringFilter},
		{key: 'metric', default: 'players', process: processStringFilter},
		{key: 'period', default: 'week', process: processStringFilter},
	];
	const filtersFromLocation = createBuildFiltersFromLocation(URL_PARAMS);

	const recent = globalStat(`DailyPlayers?from=${Math.floor(Date.now() / 1000) - 9 * DAY}`);

	$: filters = filtersFromLocation(location);
	$: range = RANGES.find(r => r.value === filters.range) ?? RANGES[1];
	$: metric = METRICS.find(m => m.value === filters.metric) ?? METRICS[0];
	$: period = PERIODS.find(p => p.value === filters.period) ?? PERIODS[1];
	$: tabs = TABS.map(t => ({...t, url: statsUrl(t.value, filters), cls: 'ranking-tab-button'}));
	$: currentTab = tabs.find(t => t.value === tab?.split('/')[0]) ?? tabs[0];
	$: tiles = latestTiles($recent.data);

	function statsUrl(tab, filters) {
		const query = buildSearchFromFiltersWithDefaults(filters, URL_PARAMS);
		return `/stats/${tab}${query ? `?${query}` : ''}`;
	}

	const setFilter = (key, value) => navigate(statsUrl(currentTab.value, {...filters, [key]: value}));

	function latestTiles(data) {
		const last = (data?.timestamps.length ?? 0) - 1;
		if (last < 0) return null;

		const items = TILES.flatMap(tile => {
			const values = data.series.find(s => s.key === tile.value)?.values;
			if (!values) return [];

			const before = values.slice(0, last).filter(v => v != null);
			const average = before.reduce((sum, v) => sum + v, 0) / before.length;
			const value = values[last] ?? 0;
			return [{...tile, value, change: average ? ((value - average) / average) * 100 : null}];
		});
		return {timestamp: data.timestamps[last], items};
	}

	const metaDescription =
		'Beat Saber community stats from BeatLeader: active players, VR headsets, game versions, map difficulties and records over time.';
</script>

<svelte:head>
	<title>Stats - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="toolbar">
			<div class="ranking-switcher">
				<TabSwitcher values={tabs} value={currentTab} on:change={e => navigate(e.detail.url)} class="ranking" />
			</div>
			<div class="range">
				<Switcher values={RANGES} value={range} on:change={e => setFilter('range', e.detail.value)} />
			</div>
		</div>

		{#if currentTab.value === 'players'}
			{#if tiles}
				<div class="stat-tiles">
					{#each tiles.items as tile}
						<div class="stat-tile">
							<div class="stat-tile-label">{tile.label}</div>
							<div class="stat-tile-value">{formatNumber(tile.value, 0)}</div>
							{#if tile.change != null}
								<div class="stat-tile-change">
									{tile.change >= 0 ? '+' : ''}{formatNumber(tile.change, 1)}% vs the week before
								</div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="stat-tiles-date">{formatDate(dateFromUnix(tiles.timestamp), 'full', null)}, every uploaded play</div>
			{/if}

			<Section
				title="Daily activity"
				description="Every uploaded play of the day, including fails, restarts and practice, merged with the scores posted that day. Before attempts were saved, the counts only include plays that set a new best.">
				<svelte:fragment slot="controls">
					<Switcher values={METRICS} value={metric} on:change={e => setFilter('metric', e.detail.value)} />
				</svelte:fragment>
				<LinesChart
					type="DailyPlayers"
					range={range.value}
					lines={[{key: metric.value, label: metric.label}]}
					digits={metric.value === 'playtime' ? 1 : 0}
					markers={TRACKING_MARKERS} />
			</Section>

			<Section
				title="New and returning players"
				description="Players of the day who had no plays in the nightly snapshot before it are new, everyone else is returning.">
				<LinesChart type="DailyPlayers" range={range.value} lines={NEW_PLAYER_LINES} stacked markers={TRACKING_MARKERS} />
			</Section>

			<Section title="Active players" description="Players who set a new score within the window, from the nightly player snapshots.">
				<LinesChart type="ActivePlayers" range={range.value} lines={ACTIVE_LINES} />
			</Section>
		{:else if currentTab.value === 'hardware'}
			<Section title="VR headsets" description="Players active in the last 30 days, by the headset of most of their last 50 scores.">
				<ShareChart type="Headset" range={range.value} labelFor={headsetLabel} unit="active players" height={360} />
			</Section>

			<Section title="Platforms" description="Players active in the last 30 days, by the platform of most of their last 50 scores.">
				<ShareChart type="Platform" range={range.value} labelFor={platformLabel} unit="active players" height={280} />
			</Section>
		{:else if currentTab.value === 'versions'}
			<Section
				title="Game versions"
				description="Players of the day, by the game version of their last play. Recorded since score uploads were saved, Aug 3, 2023.">
				<ShareChart type="GameVersion" range={range.value} rankBy="peak" height={360} />
			</Section>

			<Section
				title="Mod versions"
				description="Players of the day, by the BeatLeader mod version of their last play. Recorded since Aug 3, 2023.">
				<ShareChart type="ModVersion" range={range.value} labelFor={modVersionLabel} rankBy="peak" height={360} />
			</Section>
		{:else if currentTab.value === 'maps'}
			<Section title="Most played maps" description="Songs by the players who played any of their difficulties, per day.">
				<svelte:fragment slot="controls">
					<Switcher values={PERIODS} value={period} on:change={e => setFilter('period', e.detail.value)} />
				</svelte:fragment>
				<RankingBars type="TopPlayedMap" days={period.days} />
			</Section>

			<Section
				title="#1 trending map"
				description="The most played song of the day among the ones uploaded in the 30 days before. Bars show how long it stayed on top, click one to open the map.">
				<StreakChart type="TrendingMap" range={range.value} valueFormat={v => `${formatNumber(v, 0)} players`} />
			</Section>

			<Section
				title="Star difficulty played"
				description="Share of attempts by map stars. Ranked counts maps ranked at the time of the attempt, unranked uses the estimated stars of the rest.">
				<StarsChart range={range.value} />
			</Section>
		{:else if currentTab.value === 'records'}
			<Section
				title="#1 player"
				description="Each bar is a day, its height is how many days in a row that player had been #1. Click a bar to open the profile.">
				<StreakChart type="TopPlayer" range={range.value} valueFormat={v => `${formatNumber(v, 2)}pp`} />
			</Section>

			<Section
				title="Highest pp score"
				description="The top pp play at each point in time. Past days use today's pp values, so reweights aren't replayed.">
				<RecordChart type="TopPpScore" range={range.value} label="pp" valueFormat={v => `${formatNumber(v, 2)}pp`} />
			</Section>

			<Section
				title="Highest star ranked map"
				description="The highest stars among maps ranked by then, with their current star values.">
				<RecordChart type="TopStarMap" range={range.value} label="Stars" valueFormat={v => `${formatNumber(v, 2)}★`} />
			</Section>
		{:else if currentTab.value === 'mappers'}
			<Section title="Ranked maps by mapper" description="Ranked songs including collabs, week by week. Maps get ranked on Fridays.">
				<RaceChart type="MapperRankedMaps" range={range.value} unit="ranked maps" />
			</Section>

			<Section title="Mappers by players" description="Players who played any map by the mapper, per day.">
				<svelte:fragment slot="controls">
					<Switcher values={PERIODS} value={period} on:change={e => setFilter('period', e.detail.value)} />
				</svelte:fragment>
				<RankingBars type="MapperPlayers" days={period.days} />
			</Section>
		{/if}
	</article>
</section>

<MetaTags
	title="Beat Saber Stats"
	description={metaDescription}
	openGraph={{
		title: 'Beat Saber Stats',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'Beat Saber Stats',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 70em;
		width: 100%;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5em;
		margin: 0.5em 0.8em 0;
	}

	.range {
		margin-bottom: 0.4em;
	}

	.stat-tiles {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.75em;
		margin: 0.5em 10px 0;
	}

	.stat-tile {
		background-color: var(--foreground);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		border-radius: 6px;
		padding: 0.9em 1em;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
	}

	.stat-tile-label,
	.stat-tile-change,
	.stat-tiles-date {
		color: var(--faded);
	}

	.stat-tile-value {
		font-size: 2em;
		font-weight: 700;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.stat-tile-change {
		font-size: 0.8em;
	}

	.stat-tiles-date {
		font-size: 0.85em;
		margin: 0.4em 10px 0.75em;
	}

	@media screen and (max-width: 767px) {
		.toolbar {
			margin: 0.5em 0 0;
		}

		.stat-tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			margin: 0.5em 0 0;
		}

		.stat-tiles-date {
			margin: 0.4em 0 0.75em;
		}
	}
</style>
