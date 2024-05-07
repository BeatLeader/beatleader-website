import accSaberPlayerRankHistoryApiClient from '../network/clients/accsaber/api-player-rank-history';

import keyValueRepository from '../db/repository/key-value';
import log from '../utils/logger';
import {addToDate, toAccSaberMidnight, formatDate, HOUR, MINUTE, dateFromString, truncateDate} from '../utils/date';
import {PRIORITY} from '../network/queues/http-queue';
import {getServicePlayerGain, serviceFilterFunc} from './utils';
import {PLAYER_SCORES_PER_PAGE} from '../utils/accsaber/consts';
import {roundToPrecision} from '../utils/format';
import {configStore} from '../stores/config';

const SCORES_NETWORK_TTL = MINUTE * 5;
const HISTOGRAM_AP_PRECISION = 5;

const ACCSABER_GRAPHQL_API = 'https://gql.accsaber.com/graphql';

let service = null;
export default () => {
	if (service) return service;

	const fetchGraphQL = async (query, variables) => {
		try {
			const options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({query, variables}),
			};

			const response = await fetch(ACCSABER_GRAPHQL_API, options);
			const jsonResponse = await response.json();

			if (response.errors) {
				console.debug('Error fetching or processing AccSaber data:', response.errors);
				return null;
			}

			return jsonResponse;
		} catch (error) {
			console.debug('Error fetching or processing AccSaber data:', error);
			return null;
		}
	};

	const getCategories = () => [
		{
			name: 'overall',
			displayName: 'Overall',
			countsTowardsOverall: null,
			description: 'Overall',
		},
		{
			displayName: 'True Acc',
			name: 'true',
			countsTowardsOverall: true,
			description: 'True acc',
		},
		{
			displayName: 'Standard Acc',
			name: 'standard',
			countsTowardsOverall: true,
			description: 'Standard acc',
		},
		{
			displayName: 'Tech Acc',
			name: 'tech',
			countsTowardsOverall: true,
			description: 'Tech standard acc',
		},
	];

	const getPlayer = async playerId => {
		let result = [];

		const rankingResponse = await fetchGraphQL(
			`
		  query GetPlayerRanking( $playerId: BigInt) {
			categoryAccSaberPlayers(condition: { playerId: $playerId} ) {
			  nodes {
				ap
				categoryName
				rankingLastWeek
				ranking
				averageAcc
				rankedPlays
			  }
			}
			overallAccSaberPlayers(condition: { playerId: $playerId} ) {
			  nodes {
				ap
				rankingLastWeek
				ranking
				averageAcc
				rankedPlays
			  }
			}
		  }
			
		  `,
			{playerId}
		);

		rankingResponse.data.categoryAccSaberPlayers.nodes.forEach(element => {
			result.push({
				...element,
				playerId,
				category: element.categoryName,
				rank: parseInt(element.ranking),
			});
		});
		const overallNode = rankingResponse.data.overallAccSaberPlayers.nodes[0];

		result.push({
			...overallNode,
			playerId,
			category: 'overall',
			rank: parseInt(overallNode.ranking),
			rankedPlays: parseInt(overallNode.rankedPlays),
		});

		if (result.length) {
			return result;
		} else {
			return null;
		}
	};

	let playersMap = {};
	const isDataForPlayerAvailable = async playerId => {
		if (!playerId || !configStore.get('preferences').showAccSaber) return false;
		if (playersMap[playerId] === undefined) {
			playersMap[playerId] = fetchGraphQL(
				`
		query FindPlayer($playerId: BigInt) {
			players: overallAccSaberPlayers(condition: {playerId: $playerId}) {
				totalCount
			}
		}
		`,
				{playerId}
			).then(r => r.data.players.totalCount > 0);
		}
		return await playersMap[playerId];
	};

	const getPlayerGain = (playerHistory, daysAgo = 1, maxDaysAgo = 7) =>
		getServicePlayerGain(playerHistory, toAccSaberMidnight, 'accSaberDate', daysAgo, maxDaysAgo);

	const getScoresHistogramDefinition = (serviceParams = {type: 'overall', sort: 'ap', order: 'desc'}) => {
		const scoreType = serviceParams?.type ?? 'overall';
		const sort = serviceParams?.sort ?? 'ap';
		const order = serviceParams?.order ?? 'desc';

		const commonFilterFunc = serviceFilterFunc(serviceParams);

		let round = 2;
		let bucketSize = 1;
		let minBucketSize = null;
		let maxBucketSize = null;
		let bucketSizeStep = null;
		let bucketSizeValues = null;
		let type = 'linear';
		let valFunc = s => s;
		let filterFunc = s => commonFilterFunc(s) && (scoreType === 'overall' || s?.leaderboard?.category === scoreType);
		let histogramFilterFunc = s => s;
		let roundedValFunc = (s, type = type, precision = bucketSize) =>
			type === 'linear' ? roundToPrecision(valFunc(s), precision) : truncateDate(valFunc(s), precision);
		let prefix = '';
		let prefixLong = '';
		let suffix = '';
		let suffixLong = '';

		switch (sort) {
			case 'ap':
				valFunc = s => s?.ap;
				type = 'linear';
				bucketSize = HISTOGRAM_AP_PRECISION;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 1;
				round = 0;
				suffix = ' AP';
				suffixLong = ' AP';
				break;

			case 'date':
				valFunc = s => s?.timeSet;
				type = 'time';
				bucketSize = 'day';
				break;

			case 'acc':
				valFunc = s => s?.acc;
				type = 'linear';
				bucketSize = 0.05;
				minBucketSize = 0.05;
				maxBucketSize = 1;
				bucketSizeStep = 0.05;
				round = 2;
				suffix = '%';
				suffixLong = '%';
				break;

			case 'rank':
				valFunc = s => s?.score?.rank;
				type = 'linear';
				bucketSize = 5;
				minBucketSize = 1;
				maxBucketSize = 100;
				bucketSizeStep = 1;
				round = 0;
				prefix = '';
				prefixLong = '#';
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
		};
	};

	const formatSort = originalSort => {
		switch (originalSort) {
			case 'date':
				return 'TIME_SET';
			case 'acc':
				return 'ACCURACY';
			case 'rank':
				return 'RANKING';

			default:
				return originalSort.toUpperCase();
		}
	};

	const getPlayerScores = async playerId => {
		try {
			return await getPlayerScoresPage(playerId);
		} catch (err) {
			return [];
		}
	};

	const getPlayerScoresPage = async (playerId, serviceParams = {sort: 'date', order: 'desc', type: 'overall', page: 1}) => {
		let page = serviceParams?.page ?? 1;
		if (page < 1) page = 1;

		const NO_SCORES = {metadata: {total: 0}, data: []};

		let category = serviceParams.type;

		let playerScores;
		let totalCount;
		try {
			const response = await fetchGraphQL(
				`
			query GetPlayerScores( $playerId: BigInt,${
				category == 'overall' ? '' : '$category: String,'
			} $offset: Int, $count: Int, $order: [AccSaberScoresOrderBy!]) {
				accSaberScores(
				  condition: { playerId: $playerId${category == 'overall' ? '' : ', categoryName: $category'} }, 
				  orderBy: $order,
				  offset: $offset, 
					first: $count) {
				  nodes {
					songHash
					songName
					songAuthorName
					levelAuthorName
					complexity
					ranking
					categoryDisplayName
					difficulty
					timeSet
					leaderboardId
					accuracy
					ap
					weightedAp
					score
					score
					beatSaverKey
					categoryName
				  }
				  totalCount
				}
			}	
			`,
				{
					playerId,
					category,
					count: PLAYER_SCORES_PER_PAGE,
					offset: PLAYER_SCORES_PER_PAGE * (page - 1),
					order: formatSort(serviceParams.sort) + '_' + serviceParams.order.toUpperCase(),
				}
			);

			totalCount = response.data.accSaberScores.totalCount;
			playerScores = response.data.accSaberScores.nodes.map(s => {
				let {
					songHash: hash,
					songName: name,
					songAuthorName: authorName,
					levelAuthorName,
					beatsaverKey,
					complexity,
					categoryName,
					difficulty,
					leaderboardId,
					accuracy: acc,
					ap,
					weightedAp,
					ranking,
					score,
					...originalScore
				} = s;

				if (acc && Number.isFinite(acc)) acc *= 100;
				leaderboardId = parseInt(leaderboardId, 10);
				if (isNaN(leaderboardId)) leaderboardId = null;

				const song = {hash, name, subName: '', authorName, levelAuthorName, beatsaverKey};
				const diffInfo = {type: 'Standard', diff: difficulty?.toLowerCase()?.replace('plus', 'Plus')};
				const leaderboard = {leaderboardId, song, diffInfo, complexity, category: categoryName};

				const timeSet = dateFromString(s.timeSet);
				return {
					id: `${playerId}-${s.leaderboardId}`,
					playerId,
					leaderboardId,
					timeSet,
					ap,
					acc,
					leaderboard,
					score: {
						...originalScore,
						ap,
						rank: parseInt(ranking),
						unmodifiedScore: score,
						score,
						mods: null,
						timeSet,
						acc,
						percentage: acc,
						weightedAp,
					},
					fetchedAt: new Date(),
					lastUpdated: new Date(),
				};
			});
		} catch (err) {
			console.log(err);
			return NO_SCORES;
		}

		if (!playerScores?.length) return NO_SCORES;

		return {
			metadata: {
				total: totalCount,
				itemsPerPage: PLAYER_SCORES_PER_PAGE,
				page,
			},
			data: playerScores,
		};
	};

	const getPlayerHistory = async (playerId, priority = PRIORITY.FG_LOW, {...options} = {}) => {
		if (!options) options = {};
		if (!options.hasOwnProperty('cacheTtl')) options.cacheTtl = SCORES_NETWORK_TTL;

		return accSaberPlayerRankHistoryApiClient.getProcessed({...options, playerId, priority});
	};

	async function getMiniRanking(rank, category = 'overall', numOfPlayers = 5) {
		if (!Number.isFinite(numOfPlayers)) numOfPlayers = 5;

		let firstPlayerRank = Math.max(1, rank - (numOfPlayers - (numOfPlayers > 2 ? 2 : 1)));

		const query = `
			query GetPlayerMiniRankingByCategory($offset: Int) {
				players: ${category == 'overall' ? 'overall' : 'category'}AccSaberPlayers(orderBy: AP_DESC, first:5, offset: $offset${
			category == 'overall' ? '' : ', condition: { categoryName: "' + category + '"}'
		}) {
					nodes {
						playerId
						ap
						rankingLastWeek
						ranking
						averageAcc
						rankedPlays
						playerName
					}
				  }
			}
		`;

		try {
			const rankingResponse = await fetchGraphQL(query, {offset: firstPlayerRank - 1});

			return rankingResponse.data.players.nodes.map(player => ({
				...player,
				rank: parseInt(player.ranking),
			}));
		} catch (err) {
			console.error('Error fetching ranking data:', err);
			return null;
		}
	}

	const destroyService = () => {
		service = null;
	};

	service = {
		isDataForPlayerAvailable,
		getPlayer,
		getCategories,
		getMiniRanking,
		getPlayerHistory,
		getPlayerGain,
		getScoresHistogramDefinition,
		getPlayerScores,
		getPlayerScoresPage,
		destroyService,
	};

	return service;
};
