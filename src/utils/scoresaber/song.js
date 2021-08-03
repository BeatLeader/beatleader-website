import createBeatSaverService from '../../services/beatsaver'
import {opt} from '../js'

const beatSaverService = createBeatSaverService();

export const getMaxScore = (blocks, maxScorePerBlock = 115) =>
  Math.floor(
    (blocks >= 14 ? 8 * maxScorePerBlock * (blocks - 13) : 0) +
    (blocks >= 6
      ? 4 * maxScorePerBlock * (Math.min(blocks, 13) - 5)
      : 0) +
    (blocks >= 2
      ? 2 * maxScorePerBlock * (Math.min(blocks, 5) - 1)
      : 0) +
    Math.min(blocks, 1) * maxScorePerBlock
  );

export function getAccFromScore(score, maxSongScore = null, percentageInsteadOfAcc = false) {
  if (!score) return null;

  const scoreMult = !percentageInsteadOfAcc && score.unmodifiedScore && score.score ? score.score / score.unmodifiedScore : 1

  return maxSongScore
    ? score.score / maxSongScore / scoreMult * 100
    : (score.maxScore
      ? score.score / score.maxScore / scoreMult * 100
      : null)
}

export const getAccFromRankedScore = (score, rankedsCache, percentageInsteadOfAcc = false) => {
  if (!score || !rankedsCache) return getAccFromScore(score.score, null, percentageInsteadOfAcc);
  const hash = opt(score, 'leaderboard.song.hash') ? score.leaderboard.song.hash.toLowerCase() : null;

  const diffInfo = opt(score, 'leaderboard.diffInfo');

  if (!hash || !diffInfo || !diffInfo.type || !diffInfo.diff) return getAccFromScore(score.score, null, percentageInsteadOfAcc);

  const notesCount = rankedsCache[hash] && rankedsCache[hash][diffInfo.type] && rankedsCache[hash][diffInfo.type][diffInfo.diff]
    ? rankedsCache[hash][diffInfo.type][diffInfo.diff]
    : null;
  if (!Number.isFinite(notesCount) || isNaN(notesCount)) return getAccFromScore(score.score, null, percentageInsteadOfAcc);

  return getAccFromScore(score.score, getMaxScore(notesCount), percentageInsteadOfAcc);
}

export function findDiffInfoWithDiffAndType(characteristics, diffAndType) {
  if (!characteristics || !Array.isArray(characteristics) || !diffAndType || !diffAndType.type) return null;

  return characteristics.reduce((cum, ch) => {
    if (ch.name === diffAndType.type) {
      return ch.difficulties ? ch.difficulties[diffAndType.diff] : null;
    }

    return cum;
  }, null);
}

export function getMaxScoreFromSongCharacteristics(songCharacteristics, diffInfo, maxScorePerBlock = 115) {
  const songDiffInfo = findDiffInfoWithDiffAndType(songCharacteristics, diffInfo);

  return songDiffInfo && songDiffInfo.length && songDiffInfo.notes ? getMaxScore(songDiffInfo.notes, maxScorePerBlock) : 0;
}

export async function getSongMaxScore(hash, diffInfo, cacheOnly = false, forceUpdate = false, maxScorePerBlock = 115) {
  const songInfo = await beatSaverService.byHash(hash, forceUpdate, cacheOnly);
  const songCharacteristics = opt(songInfo, 'metadata.characteristics');
  return getMaxScoreFromSongCharacteristics(songCharacteristics, diffInfo, maxScorePerBlock)
}