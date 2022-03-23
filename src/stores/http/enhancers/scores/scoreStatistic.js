import {opt} from '../../../../utils/js'
import {BL_API_URL} from '../../../../network/queues/beatleader/api-queue'

export default async (data) => {
    if (!data || data.beatSavior) return;

    let response = await fetch(BL_API_URL + "score/statistic/" + data.score.id);
    let statistic = await response.json();
    let beatSavior = {};

    var stats = statistic.accuracyTracker;

    stats.missedNotes = data.score.missedNotes;
    stats.badCuts = data.score.badCuts;
    stats.bombHit = data.score.bombCuts;
    stats.wallHit = data.score.wallsHit;
    stats.miss = stats.missedNotes + stats.badCuts + stats.bombHit + stats.wallHit;
    stats.maxCombo = statistic.hitTracker.maxCombo;
    stats.leftMiss = statistic.hitTracker.leftMiss;
    stats.rightMiss = statistic.hitTracker.rightMiss;
    stats.leftBadCuts = statistic.hitTracker.leftBadCuts;
    stats.rightBadCuts = statistic.hitTracker.rightBadCuts;
    stats.leftBombs = statistic.hitTracker.leftBombs;
    stats.rightBombs = statistic.hitTracker.rightBombs;

    stats.won = statistic.winTracker.won;
    stats.pauses = statistic.winTracker.nbOfPause;

    beatSavior.songJumpDistance = statistic.winTracker.jumpDistance;
    beatSavior.stats = stats;
    beatSavior.trackers = statistic;

    data.beatSavior = beatSavior;
}