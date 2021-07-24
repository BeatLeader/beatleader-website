import queue from '../../network/queues/queues'
import {opt} from '../js'

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
  const songInfo = await queue.BEATSAVER.byHash(hash, forceUpdate, cacheOnly);
  const songCharacteristics = opt(songInfo, 'metadata.characteristics');
  return getMaxScoreFromSongCharacteristics(songCharacteristics, diffInfo, maxScorePerBlock)
}