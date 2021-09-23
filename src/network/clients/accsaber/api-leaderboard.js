import queue from '../../queues/queues'
import createClient from '../generic'
import {dateFromString, formatDateRelative} from '../../../utils/date'
import {LEADERBOARD_SCORES_PER_PAGE} from '../../../utils/accsaber/consts'

const process = response => {
  if (!response?.response || !Array.isArray(response.response)) return [];

  const page = response?.fetchOptions.page ?? 1;
  const totalItems = response.response.length;
  const pageQty = Math.ceil(totalItems / LEADERBOARD_SCORES_PER_PAGE)

  return {
    page,
    pageQty,
    totalItems,
    scores: response.response.map(s => {
      let {
        accuracy: acc,
        ap,
        rank,
        score,
        timeSet,
        playerId,
        playerName: name,
        ...rest
      } = s;

      if (acc && Number.isFinite(acc)) acc *= 100;

      timeSet = dateFromString(timeSet)
      const timeSetString = formatDateRelative(timeSet);

      return {
        player: {
          name,
          playerId,
          playerInfo: {avatar: `https://new.scoresaber.com/api/static/avatars/${playerId}.jpg`},
        },
        score: {
          acc,
          percentage: acc,
          ap,
          rank,
          score,
          timeSet,
          timeSetString,
        },
        other: rest,
      }
    }),
  };
}

const get = async ({leaderboardId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions} = {}) => {
  const response = await queue.ACCSABER.leaderboard(leaderboardId, page, priority, queueOptions);

  return {...response, body: {response: response.body, fetchOptions: {leaderboardId, page}}}
}

const client = createClient(get, process);

export default client;