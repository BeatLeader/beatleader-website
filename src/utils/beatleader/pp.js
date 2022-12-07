import {formatNumber} from '../../utils/format';


export const WEIGHT_COEFFICIENT = 0.965;


export const getTotalPpFromSortedPps = (ppArray, startIdx = 0) =>
	ppArray.reduce((cum, pp, idx) => cum + Math.pow(WEIGHT_COEFFICIENT, idx + startIdx) * pp, 0);


export const getFCPPTitle = (fcPp, suffix) => {
	if (!fcPp | fcPp <= 0) {
		return '';
	}
	return `Full combo PP: ${formatNumber(fcPp)}${suffix}`;
}


export const buildCurve = (acc, stars) => {
	var l = 1 - (0.03 * (stars - 3.0)) / 11.0;
	var a = 0.96 * l;
	var f = 1.2 - (0.6 * stars) / 14.0;
	return Math.pow(Math.log10(l / (l - acc)) / Math.log10(l / (l - a)), f);
}


export const getPPFromAcc = (acc, stars) => {
	return buildCurve(acc, stars - 0.5) * (stars + 0.5) * 42;
}


export const computeModifierStars = (stars, mods) => {

	// Make sure we have a valid modifiers array
	if (!mods || !Array.isArray(mods) || mods.length === 0) {
		return stars;
	}

	const positiveModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value > 0 ? mod.value : 0), 0) ?? 0;
	const negativeModifiersSum = mods?.reduce((sum, mod) => sum + (mod.value < 0 ? mod.value : 0), 0) ?? 0;
	const modifiedStars = stars * (1 + positiveModifiersSum + negativeModifiersSum);

	return modifiedStars;

}
