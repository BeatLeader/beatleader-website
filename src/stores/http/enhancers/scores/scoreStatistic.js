import createScoresService from '../../../../services/beatleader/scores';
import createLeaderboardService from '../../../../services/beatleader/leaderboard';

let scoresService = null;
let leaderboardService = null;

export default async (data, leaderboard) => {
	if (!data) return null;
	if (data.beatSavior) return data.beatSavior;

	try {
		if (leaderboard) {
			if (!leaderboardService) leaderboardService = createLeaderboardService();
		} else {
			if (!scoresService) scoresService = createScoresService();
		}

		const statistic = leaderboard
			? await leaderboardService.fetchLeaderboardStats(leaderboard.leaderboardId)
			: await scoresService.fetchScoreStats(data.score.id);

		const beatSavior = {};

		const stats = statistic.accuracyTracker;

		stats.missedNotes = data.score?.missedNotes ?? (statistic?.hitTracker?.leftMiss ?? 0) + (statistic?.hitTracker?.leftMiss ?? 0);
		stats.badCuts = data.score?.badCuts ?? (statistic?.hitTracker?.leftBadCuts ?? 0) + (statistic?.hitTracker?.rightBadCuts ?? 0);
		stats.bombHit = data.score?.bombCuts ?? (statistic?.hitTracker?.leftBombs ?? 0) + (statistic?.hitTracker?.rightBombs ?? 0);
		stats.wallHit = data.score?.wallsHit ?? 0;
		stats.miss = stats.missedNotes + stats.badCuts;
		stats.maxCombo = statistic.hitTracker.maxCombo;
		stats.leftMiss = statistic.hitTracker.leftMiss;
		stats.rightMiss = statistic.hitTracker.rightMiss;
		stats.leftBadCuts = statistic.hitTracker.leftBadCuts;
		stats.rightBadCuts = statistic.hitTracker.rightBadCuts;
		stats.leftBombs = statistic.hitTracker.leftBombs;
		stats.rightBombs = statistic.hitTracker.rightBombs;

		stats.won = statistic.winTracker.won;
		stats.pauses = statistic.winTracker.nbOfPause;

		statistic.scoreTracker = {rawRatio: data.score?.unmodifiedAcc ? data.score.unmodifiedAcc / 100 : null};

		beatSavior.songJumpDistance = statistic.winTracker.jumpDistance;
		beatSavior.stats = stats;
		beatSavior.trackers = statistic;

		return beatSavior;
	} catch (err) {}

	return null;
};
