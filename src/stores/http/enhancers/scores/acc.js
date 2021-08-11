import {opt} from '../../../../utils/js'
import calculateAcc from '../common/acc-calc'
import {findDiffInfoWithDiffAndTypeFromBeatMaps} from '../../../../utils/scoresaber/song'

export default async (data) => {
  if (!data || !data.score) return;

  const leaderboardId = opt(data, 'leaderboard.leaderboardId')
  const diffInfo = opt(data, 'leaderboard.diffInfo');

  const versions = opt(data, 'leaderboard.beatMaps.versions')
  const versionsLastIdx = versions && Array.isArray(versions) && versions.length ? versions.length - 1 : 0;
  const bmStats = findDiffInfoWithDiffAndTypeFromBeatMaps(opt(data, `leaderboard.beatMaps.versions.${versionsLastIdx}.diffs`), diffInfo);

  data.score = calculateAcc(data.score, bmStats, leaderboardId);
}