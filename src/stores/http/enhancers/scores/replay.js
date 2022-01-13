import createReplaysService from '../../../../services/scoresaber/replays'
import {configStore} from '../../../config'
import {opt} from '../../../../utils/js'

let service;

export default async (data, playerId = null) => {
  if (!playerId) return;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');
  if (!leaderboardId) return;

  const pp = opt(data, 'score.pp');
  if (!pp) return;

  if (!service) service = createReplaysService();

  data.score.hasReplay = await service.replaysExists(playerId, leaderboardId);
}