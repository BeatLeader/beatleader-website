import {capitalize} from '../js';
import createBeatMapsService from '../../services/beatmaps';

export const getMaxScore = (blocks, maxScorePerBlock = 115) =>
	Math.floor(
		(blocks >= 14 ? 8 * maxScorePerBlock * (blocks - 13) : 0) +
			(blocks >= 6 ? 4 * maxScorePerBlock * (Math.min(blocks, 13) - 5) : 0) +
			(blocks >= 2 ? 2 * maxScorePerBlock * (Math.min(blocks, 5) - 1) : 0) +
			Math.min(blocks, 1) * maxScorePerBlock
	);

export function getAccFromScore(score, maxSongScore = null, percentageInsteadOfAcc = false) {
	if (!score) return null;

	const leaderboardId = score.leaderboardId;
	const maxScore = maxSongScore;

	const scoreMult = !percentageInsteadOfAcc && score.unmodifiedScore && score.score ? score.score / score.unmodifiedScore : 1;

	return maxScore ? (score.score / maxScore / scoreMult) * 100 : score.maxScore ? (score.score / score.maxScore / scoreMult) * 100 : null;
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

export async function getSongMaxScore(
	hash,
	diffInfo,
	leaderboardId = null,
	cacheOnly = false,
	forceUpdate = false,
	maxScorePerBlock = 115
) {
	if (!diffInfo?.diff || !diffInfo?.type) return null;

	const beatmapsService = createBeatMapsService();

	const songInfo = await beatmapsService.byHash(hash, forceUpdate, cacheOnly);
	const diffStats = (songInfo?.versions?.[0]?.diffs ?? []).find(
		d => d.characteristic === diffInfo.type && d.difficulty === capitalize(diffInfo.diff)
	);
	if (!diffStats || !diffStats?.notes) return null;

	return getMaxScore(diffStats.notes);
}

export async function getSongDiffInfo(hash, diffAndType, leaderboardId = null, cacheOnly = false) {
	if (!diffAndType?.diff || !diffAndType?.type) return null;

	const beatmapsService = createBeatMapsService();

	const songInfo = await beatmapsService.byHash(hash, false, cacheOnly);
	if (!songInfo) return null;

	const diffInfo = (songInfo?.versions?.[0]?.diffs ?? []).find(
		d => d.characteristic === diffAndType.type && d.difficulty === capitalize(diffAndType.diff)
	);
	const bpm = songInfo?.metadata?.bpm ?? null;

	return Object.assign({bpm, maxScore: await getSongMaxScore(hash, diffAndType, leaderboardId, true)}, songInfo, diffInfo);
}
