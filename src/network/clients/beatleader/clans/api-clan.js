import queue, {getResponseBody} from '../../../queues/queues'
import createClient from '../../generic'

const process = response => {
  if (!response?.metadata || !Array.isArray(response?.data)) return null;

  return {
    metadata: response.metadata,
    container: response.container,
    data: response.data.map(player => {
      let {avatar, country, countryRank, histories: history, id: playerId, name, pp, rank, lastTwoWeeksTime, allTime} = player;
      const rankHistory =
       history && history.length
            ? history.split(',').map(r => parseInt(r, 10)).filter(r => !isNaN(r))
            : []
      let difference = (rankHistory.length > 1 ? parseInt(rankHistory[rankHistory.length > 7 ? rankHistory.length - 7 : 0]) - parseInt(rankHistory[rankHistory.length - 1]) : null);

      if (avatar && !avatar.startsWith('http')) {
        avatar = `${queue.BEATLEADER_API.BL_API_URL}${!avatar.startsWith('/') ? '/' : ''}${avatar}`;
      }

      return {
        playerId,
        name,
        playerInfo: {
          avatar,
          countries: [{country, rank: countryRank}],
          pp,
          lastTwoWeeksTime,
          allTime,
          rank,
          rankHistory,
        },
        others: {
          difference,
        },
      }
    })
  };
};

const get = async ({clanId, page = 1, filters = {}, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => queue.BEATLEADER_API.clan(clanId, page, filters, priority, queueOptions);

const create = async ({name, tag, description, bio, color, icon, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanCreate(name, tag, description, bio, color, icon, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const update = async ({name, tag, description, bio, color, icon, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanUpdate(name, tag, description, bio, color, icon, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const accept = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanAccept(clanId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const reject = async ({clanId, ban = false, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanReject(clanId, ban, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const leave = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanLeave(clanId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const remove = async ({priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanRemove(priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const unban = async ({clanId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanUnban(clanId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const kick = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanKick(playerId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const invite = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanInvite(playerId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const cancelInvite = async ({playerId, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanCancelInvite(playerId, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const createClanClient = () => {
  const client = createClient(get, process);

  return {
    ...client,
    create,
    update,
    accept,
    reject,
    remove,
    leave,
    unban,
    kick,
    invite,
    cancelInvite,
  }
}

const client = createClanClient();

export default client;