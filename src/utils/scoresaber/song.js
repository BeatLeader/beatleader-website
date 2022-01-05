import {capitalize} from '../js'
import createBeatMapsService from '../../services/beatmaps'

// rankeds with incorrect maxScore in SS
const FUCKED_UP_RANKEDS = {"1950":798675,"1962":747155,"2720":468395,"2895":651475,"2900":531875,"3231":374555,"4022":262315,"6004":516235,"8270":176755,"9007":476675,"9023":324875,"9025":181355,"9028":141795,"11909":340515,"17020":449995,"18691":237475,"18728":438955,"19580":491395,"21628":357075,"21670":254035,"23871":594435,"29546":227355,"30818":383755,"33282":639515,"40338":311995,"40892":249435,"41481":605475,"45370":539235,"50288":824435,"50328":526355,"51360":946795,"58409":597195,"58412":721395,"59096":424235,"59409":320275,"61728":2001115,"66449":771995,"66930":875035,"66944":599035,"78657":426075,"79636":576035,"84513":487715,"99196":492315};

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
  if (!characteristics || !Array.isArray(characteristics) || !diffAndType || !diffAndType.type || !diffAndType.diff) return null;

  return characteristics.reduce((cum, ch) => {
    if (ch.name === diffAndType.type) {
      return ch.difficulties ? ch.difficulties[diffAndType.diff] : null;
    }

    return cum;
  }, null);
}

export function findDiffInfoWithDiffAndTypeFromBeatMaps(diffs, diffAndType) {
  return !diffs || !Array.isArray(diffs) || !diffAndType || !diffAndType.type || !diffAndType.diff
    ? null
    : diffs.find(diff => diff.characteristic === diffAndType.type && diff.difficulty === capitalize(diffAndType.diff));
}

export function getMaxScoreFromSongCharacteristics(songCharacteristics, diffInfo, maxScorePerBlock = 115) {
  const songDiffInfo = findDiffInfoWithDiffAndType(songCharacteristics, diffInfo);

  return songDiffInfo && songDiffInfo.length && songDiffInfo.notes ? getMaxScore(songDiffInfo.notes, maxScorePerBlock) : 0;
}

export async function getSongMaxScore(hash, diffInfo, leaderboardId = null, cacheOnly = false, forceUpdate = false, maxScorePerBlock = 115) {
  if (leaderboardId && getFixedLeaderboardMaxScore(leaderboardId)) {
    const leaderboardMaxScore = getFixedLeaderboardMaxScore(leaderboardId);
    if (leaderboardMaxScore) return leaderboardMaxScore;
  }

  if (!diffInfo?.diff || !diffInfo?.type) return null;

  const beatmapsService = createBeatMapsService();

  const songInfo = await beatmapsService.byHash(hash, forceUpdate, cacheOnly);
  const diffStats = (songInfo?.versions?.[0]?.diffs ?? []).find(d => d.characteristic === diffInfo.type && d.difficulty === capitalize(diffInfo.diff))
  if (!diffStats || !diffStats?.notes) return null;

  return getMaxScore(diffStats.notes);
}

export async function getSongDiffInfo(hash, diffAndType, leaderboardId = null, cacheOnly = false) {
  if (!diffAndType?.diff || !diffAndType?.type) return null;

  const beatmapsService = createBeatMapsService();

  const songInfo = await beatmapsService.byHash(hash, false, cacheOnly);
  if (!songInfo) return null;

  const diffInfo = (songInfo?.versions?.[0]?.diffs ?? []).find(d => d.characteristic === diffAndType.type && d.difficulty === capitalize(diffAndType.diff));
  const bpm = songInfo?.metadata?.bpm ?? null;

  return Object.assign(
      {bpm, maxScore: await getSongMaxScore(hash, diffAndType, leaderboardId, true)},
      songInfo,
      diffInfo
  );
}
