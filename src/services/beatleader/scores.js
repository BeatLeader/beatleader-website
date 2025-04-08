import createPlayerService from './player';
import {PRIORITY} from '../../network/queues/http-queue';
import scoresApiClient from '../../network/clients/beatleader/scores/api';
import scoreStatsApiClient from '../../network/clients/beatleader/scores/api-stats';
import {dateFromUnix, DAY, HOUR, MINUTE, truncateDate} from '../../utils/date';
import {opt} from '../../utils/js';
import makePendingPromisePool from '../../utils/pending-promises';
import {roundToPrecision} from '../../utils/format';
import {serviceFilterFunc} from '../utils';
import {SPECIAL_PLAYER_ID, ALL_SCORES_PLAYER_ID} from '../../network/queues/beatleader/api-queue';

const HISTOGRAM_DATE_PRECISION = 'day';
const HISTOGRAM_PP_PRECISION = 5;
const HISTOGRAM_PAUSES_PRECISION = 1;
const HISTOGRAM_MAX_STREAK_PRECISION = 1;
const HISTOGRAM_REPLAYS_WATCHED_PRECISION = 1;
const HISTOGRAM_PLAY_COUNT_PRECISION = 1;
const HISTOGRAM_RANK_PRECISION = 5;
const HISTOGRAM_ACC_PRECISION = 0.25;
const HISTOGRAM_STARS_PRECISION = 0.1;
const HISTOGRAM_MISTAKES_PRECISION = 1;

let service = null;
let serviceCreationCount = 0;
export default () => {
	serviceCreationCount++;
	if (service) return service;

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	let playerService = createPlayerService();

	const getPlayerScores = async playerId => resolvePromiseOrWaitForPending(`getPlayerScores/${playerId}`, async () => Promise.resolve([]));

	const convertScoresToObject = (scores, idFunc = score => opt(score, 'leaderboard.leaderboardId'), asArray = false) =>
		scores.reduce((scoresObj, score) => {
			const _id = idFunc(score);
			if (!_id) return scoresObj;

			if (asArray) {
				if (!scoresObj[_id]) scoresObj[_id] = [];

				scoresObj[_id].push({...score});
			} else {
				scoresObj[_id] = {...score};
			}

			return scoresObj;
		}, {});

	const getScoresHistogramDefinition = (serviceParams = {sort: 'date', order: 'desc'}, configStore) => {
		const sort = serviceParams?.sort ?? 'date';
		const order = serviceParams?.order ?? 'desc';

		const commonFilterFunc = serviceFilterFunc(serviceParams);

		let round = 2;
		let bucketSize = HISTOGRAM_PP_PRECISION;
		let bucketSizeServerConvert = v => v;
		let minBucketSize = null;
		let maxBucketSize = null;
		let bucketSizeStep = null;
		let bucketSizeValues = null;
		let type = 'linear';
		let valFunc = s => s;
		let filterFunc = commonFilterFunc;
		let histogramFilterFunc = h => h;
		let roundedValFunc = (s, type = type, precision = bucketSize) =>
			type === 'linear' ? roundToPrecision(valFunc(s), precision) : truncateDate(valFunc(s), precision);
		let prefix = '';
		let prefixLong = '';
		let suffix = '';
		let suffixLong = '';
		let resetBucketSize = null;

		switch (sort) {
			case 'date':
				valFunc = s => dateFromUnix(s);
				type = 'time';
				bucketSize = configStore.histogram.timePrecision;
				bucketSizeServerConvert = bucketSize => {
					switch (bucketSize) {
						case 'year':
							return (DAY * 365) / 1000;
						case 'month':
							return (DAY * 30) / 1000;

						case 'day':
						default:
							return DAY / 1000;
					}
				};
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_DATE_PRECISION;
				};
				break;

			case 'pp':
				valFunc = s => parseFloat(s);
				filterFunc = s => (s?.pp ?? 0) > 0 && commonFilterFunc(s);
				type = 'linear';
				bucketSize = configStore.histogram.ppPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 1;
				round = 0;
				suffix = 'pp';
				suffixLong = 'pp';
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_PP_PRECISION;
				};
				break;

			case 'rank':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.rankPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 1;
				round = 0;
				prefixLong = '#';
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_RANK_PRECISION;
				};
				break;
			case 'pauses':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.pausesPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 0.1;
				round = 0;
				suffixLong = ' pause';
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_PAUSES_PRECISION;
				};
				break;
			case 'maxStreak':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.maxStreakPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 0.1;
				round = 0;
				suffixLong = ` note`;
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_MAX_STREAK_PRECISION;
				};
				break;
			case 'replaysWatched':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.replaysWatchedPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 0.1;
				round = 0;
				suffixLong = ` views`;
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_REPLAYS_WATCHED_PRECISION;
				};
				break;
			case 'playCount':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.playCountPrecision;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 0.1;
				round = 0;
				suffixLong = ` attempts`;
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_PLAY_COUNT_PRECISION;
				};
				break;

			case 'acc':
				(valFunc = s => parseFloat(s) * 100), (filterFunc = s => (valFunc(s) ?? 0) > 0 && commonFilterFunc(s));
				type = 'linear';
				bucketSize = configStore.histogram.accPrecision;
				bucketSizeServerConvert = bucketSize => bucketSize / 100;
				minBucketSize = 0.05;
				maxBucketSize = 10;
				bucketSizeStep = 0.05;
				round = 2;
				suffix = '%';
				suffixLong = '%';
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_ACC_PRECISION;
				};
				break;

			case 'stars':
				(valFunc = s => parseFloat(s)), (filterFunc = s => (s?.leaderboard?.stars ?? 0) > 0 && commonFilterFunc(s));
				type = 'linear';
				bucketSize = configStore.histogram.starsPrecision;
				minBucketSize = 0.1;
				maxBucketSize = 10;
				bucketSizeStep = 0.1;
				round = 2;
				suffix = '★';
				suffixLong = '★';
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_STARS_PRECISION;
				};
				break;
			case 'mistakes':
				valFunc = s => parseInt(s, 10);
				type = 'linear';
				bucketSize = configStore.histogram.mistakesPrecision;
				minBucketSize = 1;
				maxBucketSize = 10;
				bucketSizeStep = 1;
				round = 0;
				suffixLong = ` mistakes`;
				resetBucketSize = () => {
					bucketSize = HISTOGRAM_MISTAKES_PRECISION;
				};
				break;
		}

		return {
			getValue: valFunc,
			getRoundedValue:
				(bucketSize = bucketSize) =>
				s =>
					roundedValFunc(s, type, bucketSize),
			filter: filterFunc,
			histogramFilter: histogramFilterFunc,
			sort: (a, b) => (order === 'asc' ? valFunc(a) - valFunc(b) : valFunc(b) - valFunc(a)),
			type,
			bucketSize,
			bucketSizeServerConvert,
			minBucketSize,
			maxBucketSize,
			bucketSizeStep,
			bucketSizeValues,
			round,
			prefix,
			prefixLong,
			suffix,
			suffixLong,
			order,
			resetBucketSize,
		};
	};

	const fetchScoresPage = async (
		playerId,
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		priority = PRIORITY.FG_LOW,
		{...options} = {}
	) => scoresApiClient.getProcessed({...options, playerId, page: serviceParams?.page ?? 1, priority, params: serviceParams});

	const fetchFollowedScoresPage = async (
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		priority = PRIORITY.FG_LOW,
		{...options} = {}
	) =>
		scoresApiClient.getProcessed({
			...options,
			playerId: SPECIAL_PLAYER_ID,
			page: serviceParams?.page ?? 1,
			priority,
			params: serviceParams,
		});

	const fetchAllScoresPage = async (
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		priority = PRIORITY.FG_LOW,
		{...options} = {}
	) =>
		scoresApiClient.getProcessed({
			...options,
			playerId: ALL_SCORES_PLAYER_ID,
			page: serviceParams?.page ?? 1,
			priority,
			params: serviceParams,
		});

	const fetchScoreStats = async (scoreId, priority = PRIORITY.FG_LOW, {...options} = {cacheTtl: HOUR, maxAge: HOUR}) =>
		scoreStatsApiClient.getProcessed({...options, scoreId, priority});

	const fetchScoresPageOrGetFromCache = async (
		playerId,
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		refreshInterval = MINUTE,
		priority = PRIORITY.FG_LOW,
		signal = null
	) => {
		if (!playerId) return null;

		return fetchScoresPage(playerId, serviceParams, priority, {signal, cacheTtl: MINUTE, maxAge: refreshInterval});
	};

	const fetchFollowedScores = async (
		serviceParams = {sort: 'date', order: 'desc', page: 1},
		refreshInterval = MINUTE,
		priority = PRIORITY.FG_LOW,
		signal = null
	) => fetchFollowedScoresPage(serviceParams, priority, {signal, cacheTtl: MINUTE, maxAge: refreshInterval});

	const destroyService = () => {
		serviceCreationCount--;
		if (serviceCreationCount === 0) {
			playerService.destroyService();

			service = null;
		}
	};

	service = {
		getPlayerScores,
		fetchScoresPage,
		fetchScoresPageOrGetFromCache,
		fetchFollowedScores,
		fetchAllScoresPage,
		fetchScoreStats,
		getScoresHistogramDefinition,
		destroyService,
		convertScoresToObject,
	};

	return service;
};
