import queue, {getResponseBody} from '../../../queues/queues';
import createClient from '../../generic';

const process = response => {
	if (!response?.metadata || !Array.isArray(response?.data)) return null;

	return {
		metadata: response.metadata,
		container: response.container,
		data: response.data.map(player => {
			let {
				avatar,
				country,
				countryRank,
				id: playerId,
				name,
				pp,
				rank,
				lastWeekPp,
				lastWeekRank,
				lastWeekCountryRank,
				profileSettings,
			} = player;
			const difference = lastWeekRank > 0 ? lastWeekRank - rank : null;

			if (avatar && !avatar.startsWith('http')) {
				avatar = `${queue.BEATLEADER_API.BL_API_URL}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
			}

			return {
				playerId,
				name,
				playerInfo: {
					avatar,
					countries: [{country, rank: countryRank, lastWeekCountryRank}],
					pp,
					rank,
					lastWeekPp,
					lastWeekRank,
					lastWeekCountryRank,
				},
				others: {
					difference,
				},
				profileSettings: profileSettings ?? null,
			};
		}),
	};
};

const get = async ({presetId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.reepreset(presetId, page, filters, priority, queueOptions);

const create = async options => {
	const response = await queue.BEATLEADER_API.reepresetCreate({...options});

	return getResponseBody(response);
};

const update = async options => {
	const response = await queue.BEATLEADER_API.reepresetUpdate({...options});

	return getResponseBody(response);
};

const react = async ({presetId, reaction, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.reactToPreset(presetId, reaction, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const reject = async ({clanId, ban = false, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanReject(clanId, ban, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const leave = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanLeave(clanId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const remove = async ({presetId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.presetRemove(presetId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const unban = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanUnban(clanId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const kick = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanKick(playerId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const invite = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanInvite(playerId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const cancelInvite = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanCancelInvite(playerId, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const createClanClient = () => {
	const client = createClient(get, process);

	return {
		...client,
		create,
		update,
		react,
		reject,
		remove,
		leave,
		unban,
		kick,
		invite,
		cancelInvite,
	};
};

const client = createClanClient();

export default client;
