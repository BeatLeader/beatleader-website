import createBeatSaverService from '../../services/beatsaver'
import {opt} from '../js'

// rankeds with incorrect maxScore in SS
const FUCKED_UP_RANKEDS = {"1950":798675,"1962":747155,"2720":468395,"2895":651475,"2900":531875,"3231":374555,"4022":262315,"6004":516235,"8270":176755,"9007":476675,"9023":324875,"9025":181355,"9028":141795,"11909":340515,"17020":449995,"18691":237475,"18728":438955,"19580":491395,"21628":357075,"21670":254035,"23871":594435,"29546":227355,"30818":383755,"33282":639515,"40338":311995,"40892":249435,"41481":605475,"45370":539235,"50288":824435,"50328":526355,"51360":946795,"58409":597195,"58412":721395,"59096":424235,"59409":320275,"61728":2001115,"66449":771995,"66930":875035,"66944":599035,"78657":426075,"79636":576035,"84513":487715,"99196":492315};

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

export function getFixedLeaderboardMaxScore(leaderboardId, maxScore = null) {
  return leaderboardId && FUCKED_UP_RANKEDS[leaderboardId] ? FUCKED_UP_RANKEDS[leaderboardId] : maxScore;
}

export function getAccFromScore(score, maxSongScore = null, percentageInsteadOfAcc = false) {
  if (!score) return null;

  const leaderboardId = score.leaderboardId;
  const maxScore = getFixedLeaderboardMaxScore(leaderboardId, maxSongScore);

  const scoreMult = !percentageInsteadOfAcc && score.unmodifiedScore && score.score ? score.score / score.unmodifiedScore : 1

  return maxScore
    ? score.score / maxScore / scoreMult * 100
    : (score.maxScore
      ? score.score / score.maxScore / scoreMult * 100
      : null)
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