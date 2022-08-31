import {dateFromUnix} from '../../../../../utils/date';
import processPlayer from '../../player/process';

export const processScore = s => {
	if (!s) return null;

	const {hash, name, subName, author: authorName, mapper: levelAuthorName, duration, coverImage, bpm} = s?.leaderboard?.song ?? {};
	const song = {hash, name, subName, authorName, levelAuthorName, duration, coverImage, bpm};

	const {id: leaderboardId} = s?.leaderboard ?? {};

	const diffInfo = {diff: s?.leaderboard?.difficulty?.difficultyName, type: s?.leaderboard?.difficulty?.modeName};
	const leaderboard = {
		leaderboardId,
		song,
		diffInfo,
		difficulty: s?.leaderboard?.difficulty?.value,
		difficultyBl: s?.leaderboard?.difficulty ?? null,
		stars: s?.leaderboard?.difficulty?.stars ?? null,
	};

	let {baseScore: unmodifiedScore, modifiers: mods, modifiedScore, pp, weight, rank, accuracy: acc, ...score} = s;

	acc *= 100;

	if (mods && typeof mods === 'string')
		mods = mods
			.split(',')
			.map(m => m.trim().toUpperCase())
			.filter(m => m.length);
	else if (!mods) mods = null;

	const ppWeighted = pp * weight;

	const {accuracy: improvedAcc, timeset: improvedTimeset} = s?.scoreImprovement ?? {};

	return {
		leaderboard,
		score: {
			...score,
			pp,
			score: modifiedScore,
			unmodifiedScore,
			mods,
			timeSet: dateFromUnix(score.timeset),
			acc,
			percentage: acc,
			unmodifiedAcc: modifiedScore && unmodifiedScore && acc ? (unmodifiedScore / modifiedScore) * acc : acc,
			ppWeighted,
			rank,
			myScore: s?.myScore ? processScore(s.myScore) : null,
			scoreImprovement: s?.scoreImprovement
				? {
						...s.scoreImprovement,
						accuracy: (improvedAcc ?? 0) * 100,
						timeSet: improvedTimeset ? dateFromUnix(improvedTimeset) : null,
				  }
				: null,
		},
		fetchedAt: new Date(),
		lastUpdated: new Date(),
		player: s?.player ? processPlayer(s?.player) : null,
	};
};
