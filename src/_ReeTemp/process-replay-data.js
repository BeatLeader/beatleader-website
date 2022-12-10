import {NoteEventType, useReplayOrNull} from "./open-replay-decoder";
import {ColorType, NoteCutDirection, NoteLineLayer, NoteScoringType} from "./note-constants";

//region SliceDetails

export function processSliceDetails(replay) {
    if (replay == null) return null;

    let result = [];

    for (let i = 0; i < 12; i++) {
        let mainGridCell = {count: 0, averageScore: 0.0, left: [], right: []};
        for (let j = 0; j < 9; j++) {
            mainGridCell.left.push({count: 0, averageScore: 0.0})
            mainGridCell.right.push({count: 0, averageScore: 0.0})
        }
        result.push(mainGridCell);
    }

    for (let i = 0; i < replay.notes.length; i++) {
        const note = replay.notes[i];
        if (note.eventType !== NoteEventType.good) continue;
        const noteData = decodeNoteData(note.noteID);
        if (noteData.scoringType !== NoteScoringType.Normal) continue;

        let score = 0.0;
        score += getAccForDistance(note.noteCutInfo.cutDistanceToCenter);
        score += getPreSwingScore(note.noteCutInfo.beforeCutRating);
        score += getPostSwingScore(note.noteCutInfo.afterCutRating);

        let mainGridIndex = getMainGridIndex(noteData.noteLineLayer, noteData.lineIndex);
        let secondaryGridIndex = getSecondaryGridIndex(noteData.cutDirection);

        const mainCell = result[mainGridIndex];
        let secondaryCell;
        if (note.noteCutInfo.saberType === 0) {
            secondaryCell = mainCell.left[secondaryGridIndex];
        } else {
            secondaryCell = mainCell.right[secondaryGridIndex];
        }

        mainCell.count += 1;
        mainCell.averageScore += score;
        secondaryCell.count += 1;
        secondaryCell.averageScore += score;
    }

    for (let i = 0; i < 12; i++) {
        const mainCell = result[i];
        mainCell.averageScore /= mainCell.count;

        for (let j = 0; j < 9; j++) {
            const l = mainCell.left[j];
            l.averageScore /= l.count;
            const r = mainCell.right[j];
            r.averageScore /= r.count;
        }
    }

    return result;
}

//endregion

//region AccuracySpread

export function processAccuracySpread(replay) {
    if (replay == null) return null;

    let result = {
        leftCount: [],
        leftTD: [],

        rightCount: [],
        rightTD: [],

        maxCount: 0,
        maxTD: 0.0
    };

    for (let i = 0; i <= 15; i++) {
        result.leftCount.push(0);
        result.leftTD.push(0);
        result.rightCount.push(0);
        result.rightTD.push(0);
    }

    for (let i = 0; i < replay.notes.length; i++) {
        const note = replay.notes[i];
        if (note.eventType !== NoteEventType.good) continue;
        const noteData = decodeNoteData(note.noteID);
        if (noteData.scoringType !== NoteScoringType.Normal) continue;
        const acc = getAccForDistance(note.noteCutInfo.cutDistanceToCenter);
        const td = Math.abs(note.noteCutInfo.cutNormal.z);

        if (note.noteCutInfo.saberType === 0) {
            result.leftCount[acc] += 1;
            result.leftTD[acc] += td;
        } else {
            result.rightCount[acc] += 1;
            result.rightTD[acc] += td;
        }
    }

    for (let i = 0; i <= 15; i++) {
        result.leftTD[i] = (result.leftCount[i] > 0) ? (result.leftTD[i] / result.leftCount[i]) : null;
        result.rightTD[i] = (result.rightCount[i] > 0) ? (result.rightTD[i] / result.rightCount[i]) : null;

        if (result.leftCount[i] > result.maxCount) result.maxCount = result.leftCount[i];
        if (result.rightCount[i] > result.maxCount) result.maxCount = result.rightCount[i];

        if (result.leftTD[i] > result.maxTD) result.maxTD = result.leftTD[i];
        if (result.rightTD[i] > result.maxTD) result.maxTD = result.rightTD[i];
    }

    return result;
}

//endregion

//region Utils

function getMainGridIndex(noteLineLayer, noteLineIndex) {
    switch (noteLineLayer) {
        case NoteLineLayer.Top: return noteLineIndex;
        case NoteLineLayer.Upper: return noteLineIndex + 4;
        case NoteLineLayer.Base: return noteLineIndex + 8;
    }
    return -1;
}

function getSecondaryGridIndex(noteCutDirection) {
    switch (noteCutDirection) {
        case NoteCutDirection.UpLeft:
            return 0;
        case NoteCutDirection.Up:
            return 1;
        case NoteCutDirection.UpRight:
            return 2;
        case NoteCutDirection.Left:
            return 3;
        case NoteCutDirection.Any:
            return 4;
        case NoteCutDirection.Right:
            return 5;
        case NoteCutDirection.DownLeft:
            return 6;
        case NoteCutDirection.Down:
            return 7;
        case NoteCutDirection.DownRight:
            return 8;
    }
    return -1;
}

function getPreSwingScore(preSwingRating) {
    if (preSwingRating > 1) preSwingRating = 1;
    if (preSwingRating < 0) preSwingRating = 0;
    return Math.round(preSwingRating * 70);
}

function getPostSwingScore(postSwingRating) {
    if (postSwingRating > 1) postSwingRating = 1;
    if (postSwingRating < 0) postSwingRating = 0;
    return Math.round(postSwingRating * 30);
}

function getAccForDistance(cutDistanceToCenter) {
    let mul = 1 - cutDistanceToCenter / 0.3;
    if (mul > 1) mul = 1;
    if (mul < 0) mul = 0;
    return Math.round(15.0 * mul);
}

function decodeNoteData(noteId) {
    let result = {}

    result.cutDirection = Math.round(noteId % 10);
    noteId /= 10;
    result.colorType = Math.round(noteId % 10);
    noteId /= 10;
    result.noteLineLayer = Math.round(noteId % 10);
    noteId /= 10;
    result.lineIndex = Math.round(noteId % 10);
    noteId /= 10;
    result.scoringType = Math.round((noteId -= 2) < -1 ? noteId + 3 : noteId);

    return result;
}

//endregion