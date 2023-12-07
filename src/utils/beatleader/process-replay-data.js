import {NoteEventType} from './open-replay-decoder';
import {NoteCutDirection, NoteLineLayer, NoteScoringType} from './note-constants';

//region AccGraphs

const accGraphResolution = 100;
const smoothPeriodPercentage = 0.02;
const weightFunctionSteepness = 3.0;

export function processAccGraphs(replay) {
	if (replay == null) return null;

	let result = {
		times: [],
		fullSwingBySaber: {red: [], blue: [], total: []},
		realScoreBySaber: {red: [], blue: [], total: []},
	};

	if (!replay?.notes?.length) return result;

	const lastNoteTime = replay.notes[replay.notes.length - 1].eventTime;
	const distanceWeightFunction = createDistanceWeightFunction(lastNoteTime * smoothPeriodPercentage, weightFunctionSteepness);

	for (let i = 0.0; i < accGraphResolution; i += 1.0) {
		const time = lastNoteTime * (i / (accGraphResolution - 1));

		let sumsBySaber = {red: [0.0, 0.0], blue: [0.0, 0.0], total: [0.0, 0.0]};
		let dividerBySaber = {red: 0.0, blue: 0.0, total: 0.0};

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

			sumsBySaber.total[0] += fullSwing * weight;
			sumsBySaber.total[1] += realScore * weight;
			dividerBySaber.total += weight;

			const saberType = note.noteCutInfo.saberType === 0 ? 'red' : 'blue';
			sumsBySaber[saberType][0] += fullSwing * weight;
			sumsBySaber[saberType][1] += realScore * weight;
			dividerBySaber[saberType] += weight;
		}

		result.times.push(time);

		['red', 'blue', 'total'].forEach(saberType => {
			result.fullSwingBySaber[saberType].push(
				dividerBySaber[saberType] === 0 ? 0.0 : sumsBySaber[saberType][0] / dividerBySaber[saberType]
			);
			result.realScoreBySaber[saberType].push(
				dividerBySaber[saberType] === 0 ? 0.0 : sumsBySaber[saberType][1] / dividerBySaber[saberType]
			);
		});
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

	if (!replay?.notes?.length) return result;

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

	if (!replay?.notes?.length) return result;

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
		totalLeftCount: 0.0,
		leftCount: [],
		leftTD: [],

		totalRightCount: 0.0,
		rightCount: [],
		rightTD: [],

		timeDeviation: [],

		maxCount: 0,
		maxTD: 0.0,
		maxTimeDeviation: 0.0,
	};

	if (!replay?.notes?.length) return result;

	const timings = [];

	for (let i = 0; i <= 15; i++) {
		result.leftCount.push(0.0);
		result.leftTD.push(0.0);
		result.rightCount.push(0.0);
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
			result.totalLeftCount += 1.0;
			result.leftCount[acc] += 1.0;
			result.leftTD[acc] += td;
		} else {
			result.totalRightCount += 1.0;
			result.rightCount[acc] += 1.0;
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

		result.leftCount[i] /= result.totalLeftCount;
		result.rightCount[i] /= result.totalRightCount;

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

const createMultiplierCounter = () => {
	const MAX_MULTIPLIER = 8;

	let value = 1;
	let progress = 1;

	const inc = () => {
		if (value >= MAX_MULTIPLIER) return MAX_MULTIPLIER;

		if (progress + 1 >= value * 2) {
			value *= 2;
			progress = 0;
		} else {
			progress++;
		}

		return value;
	};
	const dec = () => {
		if (value > 1) {
			value /= 2;
		}

		progress = 1;

		return value;
	};

	return {
		get: () => value,
		inc,
		dec,
	};
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const getNoteType = noteId => {
	if (!Number.isFinite(noteId) || noteId >= 80000) return null;

	return Math.floor(noteId / 10000);
};

const getNoteScore = (noteData, noteCutInfo) => {
	let beforeCut = 0,
		accuracy = 0,
		afterCut = 0;

	if (noteData.scoringType === NoteScoringType.SliderTail) {
		beforeCut = 70;
	} else if (noteData.scoringType !== NoteScoringType.BurstSliderElement) {
		beforeCut = Math.round(clamp(noteCutInfo.beforeCutRating * 70, 0, 70));
	}

	if (noteData.scoringType === NoteScoringType.SliderHead) {
		afterCut = 30;
	} else if (![NoteScoringType.BurstSliderElement, NoteScoringType.BurstSliderHead].includes(noteData.scoringType)) {
		afterCut = Math.round(clamp(noteCutInfo.afterCutRating * 30, 0, 30));
	}

	if (noteData.scoringType === NoteScoringType.BurstSliderElement) {
		accuracy = 20;
	} else {
		accuracy = Math.round(15 * (1 - clamp(noteCutInfo.cutDistanceToCenter / 0.3, 0, 1)));
	}

	return beforeCut + accuracy + afterCut;
};

export function processUnderswings(replay) {
	if (!replay) return null;

	if (!replay?.notes?.length)
		return {
			count: 0,
			acc: 0,
			fcAcc: 0,
			noUnderswingsAcc: 0,
			noUnderswingsFcAcc: 0,
			score: 0,
			fcScore: 0,
			noUnderswingsScore: 0,
			noUnderswingsFcScore: 0,
			maxCutScore: 0,
			maxSongScore: 0,
		};

	const multiplier = createMultiplierCounter();
	const fcMultiplier = createMultiplierCounter();

	const result = [...replay.notes, ...(replay.walls ?? [])]
		.map((e, idx) => ({...e, idx, eventTime: e?.eventTime ?? e?.time}))
		.sort((a, b) => (a.eventTime === b.eventTime ? a.idx - b.idx : a.eventTime - b.eventTime))
		.reduce(
			(acc, event) => {
				if (!Number.isFinite(event?.eventType) || NoteEventType.bomb === event.eventType) {
					acc.multiplier.dec();
					return acc;
				}

				const noteData = decodeNoteData(event.noteID);
				if (noteData < NoteScoringType.Normal) return acc;

				const maxNoteScore = getNoteScore(noteData, {cutDistanceToCenter: 0, beforeCutRating: 1, afterCutRating: 1});

				switch (event.eventType) {
					case NoteEventType.good:
						const realScore = getNoteScore(noteData, event.noteCutInfo);
						const fullSwing = getNoteScore(noteData, {
							cutDistanceToCenter: event.noteCutInfo.cutDistanceToCenter,
							beforeCutRating: 1,
							afterCutRating: 1,
						});

						acc.count++;
						acc.score += realScore * multiplier.get();
						acc.noUnderswingsScore += fullSwing * multiplier.get();
						acc.fcScore += realScore * fcMultiplier.get();
						acc.noUnderswingsFcScore += fullSwing * fcMultiplier.get();
						acc.maxCutScore += maxNoteScore * fcMultiplier.get();
						acc.multiplier.inc();
						break;

					case NoteEventType.bad:
					case NoteEventType.miss:
						acc.multiplier.dec();
						break;
				}

				acc.maxSongScore += maxNoteScore * fcMultiplier.get();
				acc.fcMultiplier.inc();

				return acc;
			},
			{
				count: 0,
				maxCutScore: 0,
				maxSongScore: 0,
				score: 0,
				fcScore: 0,
				noUnderswingsScore: 0,
				noUnderswingsFcScore: 0,
				multiplier,
				fcMultiplier,
			}
		);

	const {multiplier: foo, fcMultiplier: bar, ...rest} = result;

	return {
		...rest,
		maxCutScore: result.maxCutScore,
		maxSongScore: result.maxSongScore,
		acc: result.maxSongScore ? (result.score / result.maxSongScore) * 100 : 0,
		fcAcc: result.maxCutScore ? (result.fcScore / result.maxCutScore) * 100 : 0,
		noUnderswingsAcc: result.maxSongScore ? (result.noUnderswingsScore / result.maxSongScore) * 100 : 0,
		noUnderswingsFcAcc: result.maxCutScore ? (result.noUnderswingsFcScore / result.maxCutScore) * 100 : 0,
	};
}
