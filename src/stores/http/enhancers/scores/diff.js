import createScoresService from '../../../../services/beatleader/scores';
import calculateAcc from '../common/acc-calc'
import {opt} from '../../../../utils/js'
import {findDiffInfoWithDiffAndTypeFromBeatMaps} from '../../../../utils/beatleader/song'

let scoresService;

export default async (data, playerId = null) => {
  if (!data || !data.score) return;

  if (data.prevScore) delete data.prevScore;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId');

  if (!scoresService) scoresService = createScoresService();

  const playerScores = scoresService.convertScoresToObject(await scoresService.getPlayerScores(playerId));

  // skip if no cached score
  if (!playerScores[leaderboardId]) return;

  // compare to cached score if cached is equal to current or to cached history score otherwise
  let prevScore = playerScores[leaderboardId].score.score === data.score.score
    ? (playerScores[leaderboardId].history && playerScores[leaderboardId].history.length ? playerScores[leaderboardId].history[0] : null)
    : playerScores[leaderboardId].score;

  // skip if no score to compare
  if (!prevScore) return;

  const diffInfo = opt(data, 'leaderboard.diffInfo');
  const versions = opt(data, 'leaderboard.beatMaps.versions')
  const versionsLastIdx = versions && Array.isArray(versions) && versions.length ? versions.length - 1 : 0;
  const bmStats = findDiffInfoWithDiffAndTypeFromBeatMaps(opt(data, `leaderboard.beatMaps.versions.${versionsLastIdx}.diffs`), diffInfo);

  data.prevScore = calculateAcc(prevScore, bmStats, leaderboardId);
}