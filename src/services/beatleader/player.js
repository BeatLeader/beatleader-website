import playerApiClient from '../../network/clients/beatleader/player/api';
import playerBySaverApiClient from '../../network/clients/beatleader/player/api-saver';
import playerFindApiClient from '../../network/clients/beatleader/players/api-player-find';
import playerAccGraphApiClient from '../../network/clients/beatleader/accgraph/api';
import {PRIORITY} from '../../network/queues/http-queue';
import log from '../../utils/logger';
import {addToDate, MINUTE, SECOND, toBlMidnight} from '../../utils/date';
import makePendingPromisePool from '../../utils/pending-promises';
import {getServicePlayerGain} from '../utils';
import createAccountStore from '../../stores/beatleader/account';

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 20;

let service = null;
let serviceCreationCount = 0;
let accountStore = null;

export default () => {
	serviceCreationCount++;
	if (service) return service;

	let mainPlayerId = null;
	let playerAndFollowed = [];

	let accountStoreUnsubscriber = null;
	if (!accountStore) {
		accountStore = createAccountStore();

		accountStoreUnsubscriber = accountStore.subscribe(account => {
			playerAndFollowed = account?.id ? [account].concat(account?.followed?.length ? account?.followed : []) : [];

			mainPlayerId = account?.id ?? null;
		});
	}

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const isMainPlayer = playerId => mainPlayerId && playerId === mainPlayerId;

	const getAll = async () => Promise.resolve(playerAndFollowed);

	const getAllActive = async () => {
		const players = await getAll();
		if (!players) return [];

		return players.filter(player => player && player.playerInfo && !player.playerInfo.inactive && !player.playerInfo.banned);
	};

	const getPlayerGain = (playerHistory, daysAgo = 1, maxDaysAgo = 7) =>
		getServicePlayerGain(playerHistory, toBlMidnight, 'ssDate', daysAgo, maxDaysAgo);

	const isPlayerMain = playerId => playerId === mainPlayerId;

	const getProfileFreshnessDate = (player, refreshInterval = null) => {
		const lastUpdated = player && player.profileLastUpdated ? player.profileLastUpdated : null;
		if (!lastUpdated) return addToDate(-SECOND);

		const REFRESH_INTERVAL = refreshInterval
			? refreshInterval
			: isPlayerMain(player.playerId)
			? MAIN_PLAYER_REFRESH_INTERVAL
			: PLAYER_REFRESH_INTERVAL;

		return addToDate(REFRESH_INTERVAL, lastUpdated);
	};

	const isProfileFresh = (player, refreshInterval = null) => getProfileFreshnessDate(player, refreshInterval) > new Date();

	const isResponseCached = response => playerApiClient.isResponseCached(response);
	const getDataFromResponse = response => playerApiClient.getDataFromResponse(response);

	const fetchPlayer = async (playerId, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) =>
		resolvePromiseOrWaitForPending(`apiClient/${playerId}/${fullResponse}/${options.maxAge ?? MINUTE}`, () =>
			playerApiClient.getProcessed({...options, playerId, priority, fullResponse})
		);
	const fetchPlayerSaver = async (playerId, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) =>
		resolvePromiseOrWaitForPending(`apiClient/${playerId}/${fullResponse}/${options.maxAge ?? MINUTE}`, () =>
			playerBySaverApiClient.getProcessed({...options, playerId, priority, fullResponse})
		);

	const findPlayer = async (query, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) =>
		resolvePromiseOrWaitForPending(`apiClient/find/${query}/${fullResponse}`, () =>
			playerFindApiClient.getProcessed({...options, query, priority, fullResponse})
		);

	const fetchPlayerOrGetFromCache = async (playerId, refreshInterval = MINUTE, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		fetchPlayer(playerId, priority, {signal, cacheTtl: MINUTE, maxAge: force ? 0 : refreshInterval});

	const fetchAccGraph = async (playerId, type, no_unranked_stars, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
		try {
			log.trace(`Starting fetching player "${playerId}" acc graph...`, 'PlayerService');

			if (!playerId) {
				log.warn(`Can not fetch player acc graph if an empty playerId is given`, 'PlayerService');

				return null;
			}

			const accGraph = resolvePromiseOrWaitForPending(`apiClient/accgraph/${type}/${playerId}/${no_unranked_stars}`, () =>
				playerAccGraphApiClient.getProcessed({playerId, type, no_unranked_stars, priority})
			);

			log.debug(`Player acc graph fetched.`, 'PlayerService', accGraph);

			return accGraph;
		} catch (e) {
			if (throwErrors) throw e;

			log.debug(`Fetching player acc graph error${e.toString ? `: ${e.toString()}` : ''}`, 'PlayerService', e);

			return null;
		}
	};

	const destroyService = () => {
		serviceCreationCount--;

		if (serviceCreationCount === 0) {
			if (accountStoreUnsubscriber) accountStoreUnsubscriber();

			service = null;
		}
	};

	service = {
		isMainPlayer,
		getAll,
		getAllActive,
		getPlayerGain,
		getProfileFreshnessDate,
		isProfileFresh,
		fetchPlayer,
		fetchPlayerOrGetFromCache,
		fetchPlayerSaver,
		findPlayer,
		fetchAccGraph,
		destroyService,
		isResponseCached,
		getDataFromResponse,
	};

	return service;
};
