import {PRIORITY} from '../network/queues/http-queue';
import createPlayerService from '../services/beatleader/player';

let pagePromise = null;
let pageReady = false;

export const preloadPlayerPage = () => {
	if (!pagePromise) {
		pagePromise = import('../pages/Player.svelte').then(module => {
			pageReady = true;
			return module;
		});
	}

	return pagePromise;
};

export const isPlayerPageReady = () => pageReady;

export const prefetchPlayerProfile = player => {
	if (!player?.playerId) return;

	preloadPlayerPage();

	createPlayerService()
		.fetchHydratedPlayer(player.alias ?? player.playerId, undefined, PRIORITY.BG_NORMAL)
		.then(playerData => {
			const fullAvatar = playerData?.playerInfo?.avatar;
			if (fullAvatar && fullAvatar !== player?.playerInfo?.avatar) {
				new Image().src = fullAvatar;
			}
		})
		.catch(() => {});
};
