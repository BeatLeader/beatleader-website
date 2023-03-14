import {formatNumber} from '../../utils/format';

export const WEIGHT_COEFFICIENT = 0.965;

export const getTotalPpFromSortedPps = (ppArray, startIdx = 0) =>
	ppArray.reduce((cum, pp, idx) => cum + Math.pow(WEIGHT_COEFFICIENT, idx + startIdx) * pp, 0);

export const getFCPPTitle = (fcPp, suffix) => {
	if (!fcPp | (fcPp <= 0)) {
		return '';
	}
	return `Full combo PP: ${formatNumber(fcPp)}${suffix}`;
};

const pointList = [
	[1, 7],
	[0.999, 5.8],
	[0.9975, 4.7],
	[0.995, 3.76],
	[0.9925, 3.17],
	[0.99, 2.73],
	[0.9875, 2.38],
	[0.985, 2.1],
	[0.9825, 1.88],
	[0.98, 1.71],
	[0.9775, 1.57],
	[0.975, 1.45],
	[0.9725, 1.37],
	[0.97, 1.31],
	[0.965, 1.2],
	[0.96, 1.11],
	[0.955, 1.045],
	[0.95, 1],
	[0.94, 0.94],
	[0.93, 0.885],
	[0.92, 0.835],
	[0.91, 0.79],
	[0.9, 0.75],
	[0.875, 0.655],
	[0.85, 0.57],
	[0.825, 0.51],
	[0.8, 0.47],
	[0.75, 0.4],
	[0.7, 0.34],
	[0.65, 0.29],
	[0.6, 0.25],
	[0.0, 0.0],
];

const Curve2 = acc => {
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

function Inflate(peepee) {
	return (650 * Math.pow(peepee, 1.3)) / Math.pow(650, 1.3);
}

export const buildCurve = (accuracy, passRating, accRating, techRating) => {
	var passPP = 15.2 * Math.exp(Math.pow(passRating, 1 / 2.62)) - 15.2;
	var accPP = Curve2(accuracy) * accRating * 34;
	var techPP = Math.exp(1.9 * accuracy) * techRating;
	return Inflate(passPP + accPP + techPP);
};

export const getPPFromAcc = (acc, passRating, accRating, techRating, mode) => {
	return mode == 'rhythmgamestandard' ? acc * passRating * 55 : buildCurve(acc, passRating, accRating, techRating);
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
			if (modifiersRating[mod.name.toLowerCase() + ratingName]) {
				rating = modifiersRating[mod.name.toLowerCase() + ratingName];
				mods = mods.filter(m => m != mod);
				break;
			}
		}
	}

	const positiveModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value > 0 ? mod.value : 0), 0) ?? 0;
	const negativeModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value < 0 ? mod.value : 0), 0) ?? 0;
	return rating * (1 + positiveModifiersSum + negativeModifiersSum);
};
