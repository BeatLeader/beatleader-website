import {GLOBAL_LEADERBOARD_TYPE, formatNumber} from '../../utils/format';

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

const pointList2 = [
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
	[0.96, 1.094],
	[0.955, 1.039],
	[0.95, 1.0],
	[0.94, 0.931],
	[0.93, 0.867],
	[0.92, 0.813],
	[0.91, 0.768],
	[0.9, 0.729],
	[0.875, 0.65],
	[0.85, 0.581],
	[0.825, 0.522],
	[0.8, 0.473],
	[0.75, 0.404],
	[0.7, 0.345],
	[0.65, 0.296],
	[0.6, 0.256],
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

const Curve2 = acc => {
	var i = 0;
	for (; i < pointList2.length; i++) {
		if (pointList2[i][0] <= acc) {
			break;
		}
	}

	if (i == 0) {
		i = 1;
	}

	var middle_dis = (acc - pointList2[i - 1][0]) / (pointList2[i][0] - pointList2[i - 1][0]);
	return pointList2[i - 1][1] + middle_dis * (pointList2[i][1] - pointList2[i - 1][1]);
};

function Inflate(peepee) {
	return (650 * Math.pow(peepee, 1.3)) / Math.pow(650, 1.3);
}

export const buildCurve = (accuracy, passRating, accRating, techRating, golf) => {
	var passPP = 15.2 * Math.exp(Math.pow(passRating, 1 / 2.62)) - 30;
	if (!isFinite(passPP) || isNaN(passPP) || passPP < 0) {
		passPP = 0;
	}
	var accPP = golf ? accuracy * accRating * 42 : Curve2(accuracy) * accRating * 34;
	var techPP = Math.exp(1.9 * accuracy) * 1.08 * techRating;
	const totalPp = Inflate(passPP + accPP + techPP);
	const inflation = totalPp / (passPP + accPP + techPP);

	return [totalPp, passPP * inflation, accPP * inflation, techPP * inflation];
};

export const getPPFromAcc = (acc, passRating, accRating, techRating, mode) => {
	if (GLOBAL_LEADERBOARD_TYPE == 'golf') {
		return buildCurve(1 - acc, passRating, accRating, techRating, true);
	} else if (mode == 'rhythmgamestandard') {
		return acc * passRating * 55;
	} else {
		return buildCurve(acc, passRating, accRating, techRating);
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

export const computeStarRating = (passRating, accRating, techRating) =>
	Number.isFinite(passRating) && Number.isFinite(accRating) && Number.isFinite(techRating)
		? buildCurve(0.96, passRating, accRating, techRating)[0] / 52
		: null;
