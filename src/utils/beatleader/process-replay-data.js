import {NoteEventType} from './open-replay-decoder';
import {NoteCutDirection, NoteLineLayer, NoteScoringType} from './note-constants';

//region AccGraphs

const accGraphResolution = 100;
const weightedPeriodSeconds = 5.0;
const weightFunctionSteepness = 3.0;

export function processAccGraphs(replay) {
	if (replay == null) return null;

	let result = {
		times: [],
		fullSwing: [],
		realScore: []
	};

	if (replay.notes.length === 0) return result;

	const lastNoteTime = replay.notes[replay.notes.length - 1].eventTime;
	const distanceWeightFunction = createDistanceWeightFunction(weightedPeriodSeconds, weightFunctionSteepness);

	for (let i = 0.0; i < accGraphResolution; i += 1.0) {
		const time = lastNoteTime * (i / (accGraphResolution - 1));

		let sums = [0.0, 0.0, 0.0];
		let divider = 0.0;

		for (let j = 0; j < replay.notes.length; j++) {
			const note = replay.notes[j];
			if (note.eventType !== NoteEventType.good) continue;
			const noteData = decodeNoteData(note.noteID);
			if (noteData.scoringType !== NoteScoringType.Normal) continue;

			const weight = distanceWeightFunction.getWeight(note.eventTime - time);

			const acc = getAccForDistance(note.noteCutInfo.cutDistanceToCenter);
			const pre = getPreSwingScore(note.noteCutInfo.beforeCutRating);
			const post = getPostSwingScore(note.noteCutInfo.afterCutRating);

			const fullSwing = acc + 100;
			const realScore = acc + pre + post;

			sums[0] += fullSwing * weight;
			sums[1] += realScore * weight;
			divider += weight;
		}

		const fullSwing = divider === 0 ? 0.0 : sums[0] / divider;
		const realScore = divider === 0 ? 0.0 : sums[1] / divider;

		result.times.push(time);
		result.fullSwing.push(fullSwing);
		result.realScore.push(realScore);
	}

	return result;
}

function createDistanceWeightFunction(bellWidth, steepnessPower) {
	return {
		divider: -(2 * Math.pow(bellWidth, steepnessPower)),
		halfPower: steepnessPower / 2,
		getWeight: function (distance) {
			const sqr = distance * distance;
			const expPower = Math.pow(sqr, this.halfPower) / this.divider;
			return Math.exp(expPower);
		},
	};
}

//endregion

//region SliceSummary

export function processSliceSummary(replay) {
	if (replay == null) return null;

	function createEmptySummary(label) {
		return {
			label,
			left: {count: 0, averageScore: 0.0, averageTD: 0.0},
			right: {count: 0, averageScore: 0.0, averageTD: 0.0},
		};
	}

	let result = [
		createEmptySummary('Midlanes'),
		createEmptySummary('Outerlanes'),
		createEmptySummary('Crossovers'),
		createEmptySummary('Forehands'),
		createEmptySummary('Backhands'),
	];

	function getLaneSummaryEntry(noteLineIndex, saberType) {
		let summaryGroup = getLaneSummaryGroup(noteLineIndex, saberType);
		return saberType === 0 ? result[summaryGroup].left : result[summaryGroup].right;
	}

	function getParitySummaryEntry(noteCutInfo, saberType) {
		let summaryGroup = getParitySummaryGroup(noteCutInfo);
		return saberType === 0 ? result[summaryGroup].left : result[summaryGroup].right;
	}

	function addScore(handSummary, score, td) {
		handSummary.count += 1;
		handSummary.averageScore += score;
		handSummary.averageTD += td;
	}

	function applyAverage(handSummary) {
		if (handSummary.count === 0) return;
		handSummary.averageScore /= handSummary.count;
		handSummary.averageTD /= handSummary.count;
	}

	for (let i = 0; i < replay.notes.length; i++) {
		const note = replay.notes[i];
		if (note.eventType !== NoteEventType.good) continue;
		const noteData = decodeNoteData(note.noteID);
		if (noteData.scoringType !== NoteScoringType.Normal) continue;

		let laneSummaryEntry = getLaneSummaryEntry(noteData.lineIndex, note.noteCutInfo.saberType);
		let paritySummaryEntry = getParitySummaryEntry(note.noteCutInfo, note.noteCutInfo.saberType);

		const score = getScore(note.noteCutInfo);
		const td = Math.abs(note.noteCutInfo.cutNormal.z);
		addScore(laneSummaryEntry, score, td);
		addScore(paritySummaryEntry, score, td);
	}

	result.forEach(summary => {
		applyAverage(summary.left);
		applyAverage(summary.right);
	});

	return result;
}

//endregion

//region SliceDetails

export function processSliceDetails(replay) {
	if (replay == null) return null;

	let result = {
		mainGrid: [],
		summaryGrids: [],
	};

	for (let i = 0; i < 12; i++) {
		let mainGridCell = {count: 0, averageScore: 0.0, left: [], right: []};
		for (let j = 0; j < 9; j++) {
			mainGridCell.left.push({count: 0, averageScore: 0.0});
			mainGridCell.right.push({count: 0, averageScore: 0.0});
		}
		result.mainGrid.push(mainGridCell);
	}

	for (let summaryGroup = 0; summaryGroup < 5; summaryGroup++) {
		let summaryGrid = [];
		for (let i = 0; i < 12; i++) {
			summaryGrid.push({count: 0, averageScore: 0.0});
		}
		result.summaryGrids.push(summaryGrid);
	}

	function addScore(cell, score) {
		cell.count += 1;
		cell.averageScore += score;
	}

	function applyAverageScore(cell) {
		if (cell.count === 0) return;
		cell.averageScore /= cell.count;
	}

	for (let i = 0; i < replay.notes.length; i++) {
		const note = replay.notes[i];
		if (note.eventType !== NoteEventType.good) continue;
		const noteData = decodeNoteData(note.noteID);
		if (noteData.scoringType !== NoteScoringType.Normal) continue;

		let mainGridIndex = getMainGridIndex(noteData.noteLineLayer, noteData.lineIndex);
		let secondaryGridIndex = getSecondaryGridIndex(noteData.cutDirection);
		let laneSummaryGroup = getLaneSummaryGroup(noteData.lineIndex, note.noteCutInfo.saberType);
		let paritySummaryGroup = getParitySummaryGroup(note.noteCutInfo);

		const mainCell = result.mainGrid[mainGridIndex];
		let secondaryCell;
		if (note.noteCutInfo.saberType === 0) {
			secondaryCell = mainCell.left[secondaryGridIndex];
		} else {
			secondaryCell = mainCell.right[secondaryGridIndex];
		}
		const laneSummaryCell = result.summaryGrids[laneSummaryGroup][mainGridIndex];
		const paritySummaryCell = result.summaryGrids[paritySummaryGroup][mainGridIndex];

		const score = getScore(note.noteCutInfo);
		addScore(mainCell, score);
		addScore(secondaryCell, score);
		addScore(laneSummaryCell, score);
		addScore(paritySummaryCell, score);
	}

	for (let i = 0; i < 12; i++) {
		const mainCell = result.mainGrid[i];
		applyAverageScore(mainCell);

		for (let j = 0; j < 9; j++) {
			applyAverageScore(mainCell.left[j]);
			applyAverageScore(mainCell.right[j]);
		}
	}

	for (let summaryGroup = 0; summaryGroup < 5; summaryGroup++) {
		let summaryGrid = result.summaryGrids[summaryGroup];
		for (let i = 0; i < 12; i++) {
			applyAverageScore(summaryGrid[i]);
		}
	}

	return result;
}

function getMainGridIndex(noteLineLayer, noteLineIndex) {
	switch (noteLineLayer) {
		case NoteLineLayer.Top:
			return noteLineIndex;
		case NoteLineLayer.Upper:
			return noteLineIndex + 4;
		case NoteLineLayer.Base:
			return noteLineIndex + 8;
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

//endregion

//region AccuracySpread

export function processAccuracySpread(replay) {
	if (replay == null) return null;

	let result = {
		leftCount: [],
		leftTD: [],

		rightCount: [],
		rightTD: [],

		timeDeviation: [],

		maxCount: 0,
		maxTD: 0.0,
		maxTimeDeviation: 0.0,
	};

	const timings = [];

	for (let i = 0; i <= 15; i++) {
		result.leftCount.push(0);
		result.leftTD.push(0.0);
		result.rightCount.push(0);
		result.rightTD.push(0.0);
		result.timeDeviation.push(0.0);
		timings.push([]);
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

		result.timeDeviation[acc] += note.noteCutInfo.timeDeviation;
		timings[acc].push(note.noteCutInfo.timeDeviation);
	}

	for (let i = 0; i <= 15; i++) {
		//<-- Averages ---
		const totalCount = result.rightCount[i] + result.leftCount[i];
		result.leftTD[i] = result.leftCount[i] > 0 ? result.leftTD[i] / result.leftCount[i] : null;
		result.rightTD[i] = result.rightCount[i] > 0 ? result.rightTD[i] / result.rightCount[i] : null;
		result.timeDeviation[i] = totalCount > 0 ? result.timeDeviation[i] / totalCount : null;

		//<-- TimeDeviation ---
		result.timeDeviation[i] = getStandardDeviation(timings[i], result.timeDeviation[i]);

		//<-- Min / Max ---
		if (result.leftCount[i] > result.maxCount) result.maxCount = result.leftCount[i];
		if (result.rightCount[i] > result.maxCount) result.maxCount = result.rightCount[i];

		if (result.leftTD[i] > result.maxTD) result.maxTD = result.leftTD[i];
		if (result.rightTD[i] > result.maxTD) result.maxTD = result.rightTD[i];

		if (result.timeDeviation[i] > result.maxTimeDeviation) result.maxTimeDeviation = result.timeDeviation[i];
	}

	return result;
}

//endregion

//region Utils

function getParitySummaryGroup(noteCutInfo) {
	const isForehand = noteCutInfo.cutNormal.x < 0;
	return isForehand ? SummaryGroup.Forehands : SummaryGroup.Backhands;
}

function getLaneSummaryGroup(noteLineIndex, saberType) {
	switch (saberType) {
		case 0:
			if (noteLineIndex >= 2) return SummaryGroup.Crossovers;
			break;
		case 1:
			if (noteLineIndex <= 1) return SummaryGroup.Crossovers;
			break;
	}
	if (noteLineIndex === 1 || noteLineIndex === 2) return SummaryGroup.Midlanes;
	return SummaryGroup.Outerlanes;
}

const SummaryGroup = {
	Midlanes: 0,
	Outerlanes: 1,
	Crossovers: 2,
	Forehands: 3,
	Backhands: 4,
};

function getStandardDeviation(numArray, mean) {
	if (numArray.length === 0) return null;

	let sqrSum = 0.0;
	numArray.forEach(num => {
		sqrSum += Math.pow(num - mean, 2);
	});
	return Math.sqrt(sqrSum / numArray.length);
}

function getScore(noteCutInfo) {
	let score = 0.0;
	score += getAccForDistance(noteCutInfo.cutDistanceToCenter);
	score += getPreSwingScore(noteCutInfo.beforeCutRating);
	score += getPostSwingScore(noteCutInfo.afterCutRating);
	return score;
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
	let result = {};

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
