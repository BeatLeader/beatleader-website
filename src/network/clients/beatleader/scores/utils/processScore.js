import {dateFromUnix} from '../../../../../utils/date';
import processPlayer from '../../player/process';

export const processScore = s => {
	if (!s) return null;

	const {
		hash,
		name,
		subName,
		author: authorName,
		id: songId,
		mapper: levelAuthorName,
		duration,
		coverImage,
		bpm,
	} = s?.leaderboard?.song ?? {};
	const song = {hash, name, subName, authorName, id: songId, levelAuthorName, duration, coverImage, bpm};

	const {id: leaderboardId} = s?.leaderboard ?? {};

	const diffInfo = {diff: s?.leaderboard?.difficulty?.difficultyName, type: s?.leaderboard?.difficulty?.modeName};
	const leaderboard = {
		leaderboardId,
		song,
		diffInfo,
		difficulty: s?.leaderboard?.difficulty?.value,
		difficultyBl: s?.leaderboard?.difficulty ?? null,
	};

	let {baseScore: unmodifiedScore, modifiers: mods, modifiedScore, replaysWatched, pp, weight, rank, accuracy: acc, ...score} = s;

	acc *= 100;

	if (mods && typeof mods === 'string')
		mods = mods
			.split(',')
			.map(m => m.trim().toUpperCase())
			.filter(m => m.length);
	else if (!mods) mods = null;

	const ppWeighted = pp * weight;

	const {
		accuracy: improvedAcc,
		timepost: improvedTimepost,
		timeset: improvedTimeset,
		rank: improvedRank,
		totalRank: improvedTotalRank,
		modifiers: oldModifiers,
	} = s?.scoreImprovement ?? {};
	const improvedTime = improvedTimepost && improvedTimepost > 0 ? improvedTimepost : improvedTimeset;

	return {
		leaderboard,
		score: {
			...score,
			pp,
			score: modifiedScore,
			unmodifiedScore,
			mods,
			timeSet: dateFromUnix(score.timepost > 0 ? score.timepost : score.timeset),
			acc,
			percentage: acc,
			unmodifiedAcc: modifiedScore && unmodifiedScore && acc ? (unmodifiedScore / modifiedScore) * acc : acc,
			ppWeighted,
			rank,
			replaysWatched,
			improvedRank,
			improvedTotalRank,
			myScore: s?.myScore ? processScore(s.myScore) : null,
			scoreImprovement: s?.scoreImprovement
				? {
						...s.scoreImprovement,
						accuracy: (improvedAcc ?? 0) * 100,
						timeSet: improvedTime ? dateFromUnix(improvedTime) : null,
						mods: oldModifiers
							?.split(',')
							.map(m => m.trim().toUpperCase())
							.filter(m => m.length),
					}
				: null,
		},
		fetchedAt: new Date(),
		lastUpdated: new Date(),
		player: s?.player ? processPlayer(s?.player) : null,
	};
};
