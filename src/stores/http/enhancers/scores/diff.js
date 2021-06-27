import createScoresService from '../../../../services/scoresaber/scores';
import calculateAcc from '../common/acc-calc'
import {opt} from '../../../../utils/js'

let scoresService;

export default async (data, playerId = null) => {
  if (!data || !data.score) return data;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');

  if (!scoresService) scoresService = createScoresService();

  const playerScores = scoresService.convertScoresToObject(await scoresService.getPlayerScores(playerId));

  // skip if no cached score
  if (!playerScores[leaderboardId]) return data;

  // compare to cached score if cached is equal to current or to cached history score otherwise
  let prevScore = playerScores[leaderboardId].score.score === data.score.score
    ? (playerScores[leaderboardId].history && playerScores[leaderboardId].history.length ? playerScores[leaderboardId].history[0] : null)
    : playerScores[leaderboardId].score;

  // skip if no score to compare
  if (!prevScore) return data;

  const diffInfo = opt(data, 'leaderboard.diffInfo');
  const characteristics = opt(data, 'leaderboard.beatSaver.metadata.characteristics');

  if (diffInfo && characteristics) {
    prevScore = calculateAcc(prevScore, characteristics, diffInfo);
  }

  data.prevScore = prevScore;

  return data;
}