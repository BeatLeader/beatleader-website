import stringify from 'json-stable-stringify';
import eventBus from '../../utils/broadcast-channel-pubsub';
import createHttpStore from './http-store';
import createApiPlayerWithScoresProvider from './providers/api-player-with-scores';
import createPlayerService from '../../services/beatleader/player';
import {addToDate, MINUTE} from '../../utils/date';
import {writable} from 'svelte/store';

export default (
	playerId = null,
	service = 'scores',
	serviceParams = {type: 'date', page: 1},
	initialState = null,
	initialStateType = 'initial'
) => {
	let currentPlayerId = playerId;
	let currentService = service;
	let currentServiceParams = serviceParams;

	const {subscribe: subscribeParams, set: setParams} = writable(null);

	let lastRecentPlay = null;
	let playerForLastRecentPlay = null;

	const onNewData = ({fetchParams}) => {
		currentPlayerId = fetchParams?.playerId ?? null;
		currentService = fetchParams?.service ?? null;
		currentServiceParams = fetchParams?.serviceParams ?? null;

		setParams({currentPlayerId, currentService, currentServiceParams});
	};

	const provider = createApiPlayerWithScoresProvider();

	const httpStore = createHttpStore(
		provider,
		playerId ? {playerId, service, serviceParams} : null,
		initialState,
		{
			onInitialized: onNewData,
			onAfterStateChange: onNewData,
		},
		initialStateType
	);

	const fetch = async (playerId = currentPlayerId, service = currentService, serviceParams = currentServiceParams, force = false) => {
		if (
			(!playerId || playerId === currentPlayerId) &&
			(!service || stringify(service) === stringify(currentService)) &&
			(!serviceParams || stringify(serviceParams) === stringify(currentServiceParams)) &&
			!force
		)
			return false;

		// reset recent play if player has changed
		if (playerId !== playerForLastRecentPlay) {
			lastRecentPlay = null;
			playerForLastRecentPlay = playerId;
		}

		return httpStore.fetch({playerId, service, serviceParams}, force, provider, !playerId || playerId !== currentPlayerId || force);
	};

	const refresh = async () => fetch(currentPlayerId, currentService, currentServiceParams, true);

	const playerRecentPlayUpdatedUnsubscribe = eventBus.on('player-recent-play-updated', async ({playerId, recentPlay}) => {
		if (!playerId || !currentPlayerId || playerId !== currentPlayerId) return;

		if (!recentPlay || !lastRecentPlay || recentPlay <= lastRecentPlay) {
			if (recentPlay) {
				lastRecentPlay = recentPlay;
				playerForLastRecentPlay = playerId;
			}
			return;
		}

		lastRecentPlay = recentPlay;
		playerForLastRecentPlay = playerId;

		await refresh();
	});

	const subscribe = fn => {
		const storeUnsubscribe = httpStore.subscribe(fn);

		return () => {
			storeUnsubscribe();
			playerRecentPlayUpdatedUnsubscribe();
		};
	};

	return {
		...httpStore,
		subscribe,
		fetch,
		refresh,
		params: {subscribe: subscribeParams},
		getPlayerId: () => currentPlayerId,
		getService: () => currentService,
		setService: type => {
			currentService = type;
			setParams({currentPlayerId, currentService, currentServiceParams});
		},
		getServiceParams: () => currentServiceParams,
		setServiceParams: page => {
			currentServiceParams = page;
			setParams({currentPlayerId, currentService, currentServiceParams});
		},
	};
};
