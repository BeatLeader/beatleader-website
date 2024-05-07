<script>
	import {formatDate, formatDateWithOptions, truncateDate} from '../../utils/date';
	import {PLAYER_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
	import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
	import {formatNumber} from '../../utils/format';
	import blApiScoresHistogramClient from '../../network/clients/beatleader/scores/api-histogram';
	import createScoresService from '../../services/beatleader/scores';
	import createAccSaberService from '../../services/accsaber';
	import ChartBrowser from '../Common/ChartBrowser.svelte';
	import Pager from '../Common/Pager.svelte';
	import {debounce} from '../../utils/debounce';
	import stringify from 'json-stable-stringify';
	import {configStore} from '../../stores/config';

	export let playerId = null;
	export let service = null;
	export let serviceParams = null;
	export let totalItems = null;
	export let currentPage = 0;
	export let loadingPage = null;
	export let fixedItemsPerPage = null;

	const DEBOUNCE_THRESHOLD = 1000;

	const scoresService = createScoresService();
	const accSaberService = createAccSaberService();

	let playerScores = null;
	let groupedPlayerScores = null;
	let playerScoresHistogram = null;
	let playerScoresHistogramBucketSize = null;
	let playerScoresHistogramBucketSizeHash = null;

	const getHistogramBucketSizeHash = (playerId, service, serviceParams) =>
		`${playerId ?? ''}::${service ?? ''}::${serviceParams?.sort ?? ''}`;

	const groupScores = (scores, keyFunc = score => truncateDate(score?.timeSet)?.getTime(), order = 'desc') =>
		Object.values(
			scores.reduce((scores, score) => {
				const key = keyFunc(score);
				if (key === null || key === undefined) return scores;

				if (!scores[key]) scores[key] = [];

				scores[key].push({key, score});

				return scores;
			}, {})
		)
			.sort((a, b) => (order === 'asc' ? a?.[0]?.key - b?.[0]?.key : b?.[0].key - a?.[0].key))
			.reduce((cum, values) => {
				if (!values?.length) return cum;

				const x = values[0].key;
				const y = values.length;

				const prevTotal = cum.length ? cum[cum.length - 1].total : 0;
				const page = Math.floor(prevTotal / (service === 'accsaber' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE));
				const total = prevTotal + y;

				cum.push({
					x,
					y,
					firstScore: values[0].score,
					page,
					total,
				});

				return cum;
			}, [])
			.sort((a, b) => (order === 'asc' ? a.x - b.x : b.x - a.x));

	async function refreshAllPlayerServiceScores(playerId, service, serviceParams) {
		if (!playerId) return;

		let serviceObj = null;
		switch (service) {
			case 'beatleader':
				serviceObj = scoresService;
				break;

			case 'accsaber':
				serviceObj = accSaberService;
				break;
		}

		if (!serviceObj) return;

		playerScoresHistogram = serviceObj.getScoresHistogramDefinition(serviceParams);

		const currentHistogramBucketSizeHash = getHistogramBucketSizeHash(playerId, service, serviceParams);
		if (playerScoresHistogramBucketSizeHash !== currentHistogramBucketSizeHash) {
			playerScoresHistogramBucketSize = playerScoresHistogram.bucketSize;
			playerScoresHistogramBucketSizeHash = currentHistogramBucketSizeHash;
		}

		playerScores = null;
	}

	let lastBlParams = null;
	const getCurrentServiceParamsHash = () => {
		const {page, ...restParams} = serviceParams ?? {};
		return stringify(restParams) + `::${playerScoresHistogramBucketSize}::${service}::${playerId}`;
	};
	const shouldRefreshBlHistogram = () => {
		const currentBlParams = getCurrentServiceParamsHash(serviceParams);
		return !(currentBlParams === lastBlParams);
	};

	function resetCurrentValues() {
		playerScores = null;

		if (service !== 'beatleader' || shouldRefreshBlHistogram()) {
			groupedPlayerScores = null;
			playerScoresHistogram = null;
		}

		if (playerScoresHistogramBucketSizeHash !== getHistogramBucketSizeHash(playerId, service, serviceParams))
			playerScoresHistogramBucketSize = null;
	}

	async function fetchBlHistogram(hash) {
		if (!playerId || !playerScoresHistogram) return;

		try {
			const params = JSON.parse(JSON.stringify(serviceParams));
			if (!params.filters) params.filters = {};
			params.filters.batch = playerScoresHistogram.bucketSizeServerConvert(playerScoresHistogramBucketSize);
			params.filters.count = itemsPerPage;

			const histogram = await blApiScoresHistogramClient.getProcessed({playerId, params});
			if (!histogram) throw 'Data error';

			if (hash === playerScoresHistogramBucketSizeHash) {
				groupedPlayerScores = Object.entries(histogram)
					.map(([key, data]) => {
						return {
							x: playerScoresHistogram.getValue(key),
							y: data?.Value ?? 0,
							page: data?.Page ?? 1,
						};
					})
					.filter(h => h.y);
			}
		} catch (err) {
			groupedPlayerScores = null;
		}
	}

	function refreshGroupedScores() {
		if (service === 'beatleader') {
			if (shouldRefreshBlHistogram()) {
				lastBlParams = getCurrentServiceParamsHash();

				fetchBlHistogram(playerScoresHistogramBucketSizeHash);
			}

			return;
		}

		groupedPlayerScores =
			playerScores?.length && playerScoresHistogram
				? groupScores(
						playerScores,
						playerScoresHistogram.getRoundedValue(playerScoresHistogramBucketSize),
						playerScoresHistogram.order
				  ).filter(playerScoresHistogram.histogramFilter)
				: null;
	}

	const debouncedRefreshGroupedScores = debounce(() => refreshGroupedScores(), DEBOUNCE_THRESHOLD);

	function chartBrowserTooltipTitle(ctx) {
		if (playerScoresHistogram?.type === 'time') {
			return formatDate(new Date(ctx?.raw?.x), 'long', ['hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'short' : null);
		} else {
			var result = `${playerScoresHistogram.prefixLong ?? playerScoresHistogram.prefix}${formatNumber(
				ctx?.raw?.x,
				playerScoresHistogram.round
			)}`;

			if (playerScoresHistogramBucketSize != 1) {
				result += `${` - ${formatNumber(ctx?.raw?.x + playerScoresHistogramBucketSize, playerScoresHistogram.round)}`}`;
			}

			result += playerScoresHistogram.suffixLong ?? playerScoresHistogram.suffix;

			if (playerScoresHistogramBucketSize == 1 && ctx?.raw?.x > 1) {
				result += 's';
			}

			return result;
		}
	}

	const chartBrowserTooltipLabel = ctx =>
		(ctx?.raw?.page ?? null) !== null ? [`${formatNumber(ctx?.raw?.y, 0)} score(s)`, '', `Go to page ${ctx.raw.page + 1}`] : null;

	function chartBrowserTickFormat(val, idx, ticks) {
		if (playerScoresHistogram?.type === 'time') {
			return formatDateWithOptions(new Date(ticks?.[idx]?.value), {
				localeMatcher: 'best fit',
				year: ['year'].includes(playerScoresHistogramBucketSize) ? 'numeric' : '2-digit',
				month: ['month', 'day', 'hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'short' : undefined,
				day: ['hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'numeric' : undefined,
			});
		} else {
			if (playerScoresHistogram.round == 0 && !Number.isInteger(ticks?.[idx]?.value)) return null;
			return `${playerScoresHistogram.prefix}${formatNumber(ticks?.[idx]?.value, playerScoresHistogram.round)}${
				playerScoresHistogram.suffix
			}`;
		}
	}

	$: playerId, service, serviceParams, resetCurrentValues();
	$: refreshAllPlayerServiceScores(playerId, service, serviceParams);
	$: if ($configStore.profileParts.histogram)
		debouncedRefreshGroupedScores(playerScores, playerScoresHistogram, playerScoresHistogramBucketSize);

	$: itemsPerPage = fixedItemsPerPage
		? fixedItemsPerPage
		: service === 'accsaber'
		? ACCSABER_PLAYER_SCORES_PER_PAGE
		: PLAYER_SCORES_PER_PAGE;
</script>

<Pager
	{totalItems}
	{itemsPerPage}
	itemsPerPageValues={null}
	{currentPage}
	{loadingPage}
	mode={totalItems ? 'pages' : 'simple'}
	on:page-changed />

{#if $configStore.profileParts.histogram && groupedPlayerScores?.length}
	<section class="scores-date-browse">
		<ChartBrowser
			data={groupedPlayerScores}
			type={playerScoresHistogram?.type}
			order={playerScoresHistogram?.order ?? 'desc'}
			tooltipTitleFunc={chartBrowserTooltipTitle}
			tooltipLabelFunc={chartBrowserTooltipLabel}
			tickFormatFunc={chartBrowserTickFormat}
			on:page-changed />
	</section>

	{#if playerScoresHistogramBucketSize && playerScoresHistogram?.minBucketSize && playerScoresHistogram?.maxBucketSize && playerScoresHistogram?.bucketSizeStep}
		<div class="histogram-controls">
			<div class="range" title="Change histogram bucket size">
				<input
					type="range"
					bind:value={playerScoresHistogramBucketSize}
					min={playerScoresHistogram.minBucketSize}
					max={playerScoresHistogram.maxBucketSize}
					step={playerScoresHistogram.bucketSizeStep} />

				<span
					>{`${formatNumber(playerScoresHistogramBucketSize, playerScoresHistogram?.round ?? 2)}${
						playerScoresHistogram.suffixLong ?? playerScoresHistogram.suffix
					}`}</span>

				<i
					class="fa fa-undo"
					title="Reset bucket size to default value"
					on:click={() => (playerScoresHistogramBucketSize = playerScoresHistogram.bucketSize)} />
			</div>
		</div>
	{/if}
{/if}

<style>
	.scores-date-browse {
		margin-top: 1rem;
		width: 100%;
		height: 100px;
	}

	.histogram-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.range {
		display: inline-flex;
	}

	.range > *:not(:last-child) {
		margin-right: 0.5em;
	}

	.range i.fa {
		cursor: pointer;
		padding-top: 0.25em;
	}
</style>
