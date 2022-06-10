import createScoresService from '../../../../services/beatleader/scores'

let scoresService = null;

export default async (data) => {
    if (!data || data.beatSavior) return;

    try {
        if (!scoresService) scoresService = createScoresService();

        const statistic = await scoresService.fetchScoreStats(data.score.id);

        const beatSavior = {};

        const stats = statistic.accuracyTracker;

        stats.missedNotes = data.score.missedNotes;
        stats.badCuts = data.score.badCuts;
        stats.bombHit = data.score.bombCuts;
        stats.wallHit = data.score.wallsHit;
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

        data.beatSavior = beatSavior;
    }
    catch(err) {}
}