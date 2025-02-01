import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVarsUrl} from '../../../utils/format';

const BEATSAVIOR_API_URL = '/cors/beat-savior';
const PLAYER_URL = BEATSAVIOR_API_URL + '/${playerId}';

export default (options = {}) => {
	const queue = createQueue(options);

	const {fetchJson, fetchHtml, ...queueToReturn} = queue;

	const player = async (playerId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(substituteVarsUrl(PLAYER_URL, {playerId}), options, priority);

	return {
		player,
		...queueToReturn,
	};
};
