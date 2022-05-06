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

const create = async ({name, tag, color, icon, priority = queue.PRIORITY.FG_HIGH, fullResponse = false, ...queueOptions} = {}) => {
  const response = await queue.BEATLEADER_API.clanCreate(name, tag, color, icon, priority, queueOptions);

  return fullResponse ? response : getResponseBody(response);
}

const createClanClient = () => {
  const client = createClient(get, process);

  return {
    ...client,
    create
  }
}

const client = createClanClient();

export default client;