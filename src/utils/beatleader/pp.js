import {GLOBAL_LEADERBOARD_TYPE, formatNumber} from '../../utils/format';
import {buildAccCurve, scorePp, toStars} from './rebalanced-pp';

export const WEIGHT_COEFFICIENT = 0.965;

export const getTotalPpFromSortedPps = (ppArray, startIdx = 0) =>
	ppArray.reduce((cum, pp, idx) => cum + Math.pow(WEIGHT_COEFFICIENT, idx + startIdx) * pp, 0);

export const getFCPPTitle = (fcPp, suffix) => {
	if (!fcPp || fcPp <= 0) {
		return '';
	}
	return `Full combo PP: ${formatNumber(fcPp)}${suffix}`;
};

const pointList = [
	[1.0, 7.424],
	[0.999, 6.241],
	[0.9975, 5.158],
	[0.995, 4.01],
	[0.9925, 3.241],
	[0.99, 2.7],
	[0.9875, 2.303],
	[0.985, 2.007],
	[0.9825, 1.786],
	[0.98, 1.618],
	[0.9775, 1.49],
	[0.975, 1.392],
	[0.9725, 1.315],
	[0.97, 1.256],
	[0.965, 1.167],
	[0.96, 1.101],
	[0.955, 1.047],
	[0.95, 1.0],
	[0.94, 0.919],
	[0.93, 0.847],
	[0.92, 0.786],
	[0.91, 0.734],
	[0.9, 0.692],
	[0.875, 0.606],
	[0.85, 0.537],
	[0.825, 0.48],
	[0.8, 0.429],
	[0.75, 0.345],
	[0.7, 0.286],
	[0.65, 0.246],
	[0.6, 0.217],
	[0.0, 0.0],
];

const Curve = acc => {
	var i = 0;
	for (; i < pointList.length; i++) {
		if (pointList[i][0] <= acc) {
			break;
		}
	}

	if (i == 0) {
		i = 1;
	}

	var middle_dis = (acc - pointList[i - 1][0]) / (pointList[i][0] - pointList[i - 1][0]);
	return pointList[i - 1][1] + middle_dis * (pointList[i][1] - pointList[i - 1][1]);
};

export const getModifiedRatings = (difficulty, mods) => {
	const modifiersRating = difficulty?.modifiersRating ?? null;
	let passRating = difficulty?.passRating ?? 0;
	let accRating = difficulty?.accRating ?? 0;
	let techRating = difficulty?.techRating ?? 0;
	let curveInputs = [difficulty?.predictedAcc, difficulty?.sliderPercentage, difficulty?.notes];
	let multiplierMods = Array.isArray(mods) ? mods : [];

	if (modifiersRating) {
		for (const mod of multiplierMods) {
			const name = mod?.name?.toLowerCase();
			if (name && modifiersRating[name + 'AccRating'] !== undefined) {
				passRating = modifiersRating[name + 'PassRating'] ?? 0;
				accRating = modifiersRating[name + 'AccRating'] ?? 0;
				techRating = modifiersRating[name + 'TechRating'] ?? 0;
				if (['ss', 'fs', 'sf'].includes(name)) {
					curveInputs = [modifiersRating[name + 'PredictedAcc'], modifiersRating[name + 'SliderPercentage'], difficulty?.notes];
				}
				break;
			}
		}
		multiplierMods = multiplierMods.filter(mod => !['ss', 'fs', 'sf'].includes(mod?.name?.toLowerCase()));
	}

	const multiplier = 1 + multiplierMods.reduce((sum, mod) => sum + (mod?.value ?? 0), 0);
	const curve = buildAccCurve(...curveInputs);

	return {
		passRating: passRating * multiplier,
		accRating: accRating * multiplier,
		techRating: techRating * multiplier,
		curve,
		stars: toStars(accRating, passRating, techRating, curve),
		multiplier,
	};
};

export const getPPFromAcc = (acc, ratings, mode) => {
	if (GLOBAL_LEADERBOARD_TYPE == 'golf') {
		return scorePp(1 - acc, ratings, true);
	} else if (mode == 'rhythmgamestandard') {
		return [acc * (ratings?.passRating ?? 0) * 55, 0, 0, 0];
	} else {
		return scorePp(acc, ratings);
	}
};

export const AccRatingFromAIAcc = (predictedAcc, passRating, techRating) => {
	var difficulty_to_acc;
	if (predictedAcc > 0) {
		difficulty_to_acc = 15 / Curve((predictedAcc ?? 0) + 0.0022);
	} else {
		var tiny_tech = 0.0208 * (techRating ?? 0) + 1.1284;
		difficulty_to_acc = (-MathF.Pow(tiny_tech, -(passRating ?? 0)) + 1) * 8 + 2 + 0.01 * (techRating ?? 0) * (passRating ?? 0);
	}
	if (!isFinite(difficulty_to_acc) || isNaN(difficulty_to_acc)) {
		difficulty_to_acc = 0;
	}
	return difficulty_to_acc;
};

export const computeModifiedRating = (rating, ratingName, modifiersRating, mods) => {
	// Make sure we have a valid modifiers array
	rating = rating ?? 0;
	if (!mods || !Array.isArray(mods) || mods.length === 0) {
		return rating;
	}

	if (modifiersRating) {
		for (let index = 0; index < mods.length; index++) {
			const mod = mods[index];
			if (modifiersRating[mod.name?.toLowerCase() + ratingName]) {
				rating = modifiersRating[mod.name?.toLowerCase() + ratingName];
				mods = mods.filter(m => m != mod);
				break;
			}
		}
	}

	const positiveModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value > 0 ? mod.value : 0), 0) ?? 0;
	const negativeModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value < 0 ? mod.value : 0), 0) ?? 0;
	return rating * (1 + positiveModifiersSum + negativeModifiersSum);
};

export const computeStarRating = ratings =>
	Number.isFinite(ratings?.passRating) && Number.isFinite(ratings?.accRating) && Number.isFinite(ratings?.techRating)
		? toStars(ratings.accRating, ratings.passRating, ratings.techRating, ratings.curve)
		: null;
