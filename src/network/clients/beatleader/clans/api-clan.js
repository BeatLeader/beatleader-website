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
				clanOrder,
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
					clanOrder,
				},
				others: {
					difference,
				},
				profileSettings: profileSettings ?? null,
			};
		}),
	};
};

const get = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.clan(clanId, page, filters, priority, queueOptions);

const getWithMaps = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) =>
	queue.BEATLEADER_API.clanMaps(clanId, page, filters, priority, queueOptions);

const create = async ({
	name,
	tag,
	description,
	bio,
	color,
	icon,
	playerChangesCallback,
	clanRankingDiscordHook,
	priority = queue.PRIORITY.FG_HIGH,
	fullResponse = false,
	...queueOptions
} = {}) => {
	const response = await queue.BEATLEADER_API.clanCreate(
		name,
		tag,
		description,
		bio,
		color,
		icon,
		playerChangesCallback,
		clanRankingDiscordHook,
		priority,
		queueOptions
	);

	return fullResponse ? response : getResponseBody(response);
};

const update = async ({
	name,
	tag,
	description,
	bio,
	color,
	icon,
	playerChangesCallback,
	clanRankingDiscordHook,
	priority = queue.PRIORITY.FG_HIGH,
	fullResponse = false,
	...queueOptions
} = {}) => {
	const response = await queue.BEATLEADER_API.clanUpdate(
		name,
		tag,
		description,
		bio,
		color,
		icon,
		playerChangesCallback,
		clanRankingDiscordHook,
		priority,
		queueOptions
	);

	return fullResponse ? response : getResponseBody(response);
};

const editRichBio = async ({value, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanEditRichBio(value, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const updatePlaylist = async ({
	id,
	title,
	link,
	description,
	icon,
	priority = queue.PRIORITY.FG_HIGH,
	fullResponse = false,
	...queueOptions
} = {}) => {
	const response = await queue.BEATLEADER_API.clanUpdatePlaylist(id, title, link, description, icon, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const deletePlaylist = async ({id, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanDeletePlaylist(id, priority, queueOptions);

	return fullResponse ? response : getResponseBody(response);
};

const accept = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanAccept(clanId, priority, queueOptions);

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

const remove = async ({priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
	const response = await queue.BEATLEADER_API.clanRemove(priority, queueOptions);

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
		getWithMaps,
		create,
		update,
		editRichBio,
		updatePlaylist,
		deletePlaylist,
		accept,
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
