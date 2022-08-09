import queue from '../../queues/queues'
import createClient from '../generic'
import { dateFromString, formatDateRelative } from '../../../utils/date'
import { LEADERBOARD_SCORES_PER_PAGE } from '../../../utils/accsaber/consts'

const process = response => {
  if (!response || !Array.isArray(response.responses) || response.responses.length !== 2 || !Array.isArray(response.responses[0])) return [];

  const page = response?.fetchOptions.page ?? 1;
  const totalItems = response.responses[0].length;
  const pageQty = Math.ceil(totalItems / LEADERBOARD_SCORES_PER_PAGE);
  const leaderboardId = response?.fetchOptions.leaderboardId ?? null;

  const mapInfo = response.responses[1];

  let {
    songHash: hash,
    songName: name,
    songSubName: subName,
    songAuthorName: authorName,
    levelAuthorName,
    beatsaverKey,
    complexity,
    categoryDisplayName,
    difficulty,
  } = mapInfo;

  const song = { hash, name, subName, authorName, levelAuthorName, beatsaverKey };
  const diffInfo = { type: 'Standard', diff: difficulty?.toLowerCase()?.replace('plus', 'Plus') }
  const leaderboard = { leaderboardId, song, diffInfo, complexity, categoryDisplayName };

  return {
    page,
    pageQty,
    totalItems,
    leaderboard,
    scores: response.responses[0].map(s => {
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
          playerInfo: { avatar: `https://cdn.accsaber.com/avatars/${playerId}.jpg` },
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

const get = async ({ leaderboardId, page = 1, priority = queue.PRIORITY.FG_HIGH, ...queueOptions } = {}) => {
  const responses = await Promise.all([
    queue.ACCSABER.leaderboard(leaderboardId, page, priority, queueOptions),
    queue.ACCSABER.leaderboardInfo(leaderboardId, priority, queueOptions)
  ]);

  return { ...responses[0], body: { responses: responses.map(r => r.body), fetchOptions: { leaderboardId, page } } }
}

const client = createClient(get, process);

export default client;