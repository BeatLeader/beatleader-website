// The curve and pp formula should be consistent between RatingAPI, website and server. Check portaBLe for detailed comments.

const formula = {
	passScale: 12.3,
	passExponent: 2.62,
	passOffset: 30,
	passInner: 0.85966,
	accWeight: 21.584,
	accRatingPower: 1.2163,
	accCurvePower: 0.9,
	lowStarCurvePower: 1.0,
	lowStarCurveStart: 7,
	lowStarCurveEnd: 10,
	veryLowStarCurvePower: 1.08,
	veryLowStarCurveStart: 3,
	veryLowStarCurveEnd: 5,
	techWeight: 0.1612,
	techRatingPower: 1.2477,
	techAccExponent: 3.5,
	starDivisor: 83.6925,
	starScale: 1.2131,
	starExponent: 1.17507,
	ppMultiplier: 1.0369,
	lowStarBonus: 0.006,
	lowStarBonusEnd: 9,
	lowStarBonusPower: 1.36,
	passTopKnee: 10.4,
	passTopSlope: 0.5,
	techTopKnee: 12,
	techTopSlope: 0.33,
};

export const STAR_ACCURACY = 0.96;

const passPp = passRating => {
	let pass = passRating;
	if (pass > formula.passTopKnee) pass = formula.passTopKnee + (pass - formula.passTopKnee) * formula.passTopSlope;
	let result = formula.passScale * Math.exp(formula.passInner * Math.pow(pass, 1 / formula.passExponent)) - formula.passOffset;
	if (!Number.isFinite(result) || result < 0) result = 0;
	return result;
};

const curvePowerAt = stars => {
	if (formula.veryLowStarCurvePower != formula.lowStarCurvePower && stars < formula.veryLowStarCurveEnd) {
		if (stars <= formula.veryLowStarCurveStart) return formula.veryLowStarCurvePower;
		return (
			formula.veryLowStarCurvePower +
			((formula.lowStarCurvePower - formula.veryLowStarCurvePower) * (stars - formula.veryLowStarCurveStart)) /
				(formula.veryLowStarCurveEnd - formula.veryLowStarCurveStart)
		);
	}
	if (formula.lowStarCurvePower == formula.accCurvePower || !(stars < formula.lowStarCurveEnd)) return formula.accCurvePower;
	if (stars <= formula.lowStarCurveStart) return formula.lowStarCurvePower;
	return (
		formula.lowStarCurvePower +
		((formula.accCurvePower - formula.lowStarCurvePower) * (stars - formula.lowStarCurveStart)) /
			(formula.lowStarCurveEnd - formula.lowStarCurveStart)
	);
};

const accCurve = (curveValue, curveAt96, power) => {
	if (power == 1 || !(curveValue > 0) || !(curveAt96 > 0)) return curveValue;
	return curveAt96 * Math.pow(curveValue / curveAt96, power);
};

const accPp = (curveValue, accRating) => (accRating > 0 ? curveValue * formula.accWeight * Math.pow(accRating, formula.accRatingPower) : 0);

const techPp = (accuracy, techRating) => {
	if (!(techRating > 0)) return 0;
	let tech = techRating;
	if (tech > formula.techTopKnee) tech = formula.techTopKnee + (tech - formula.techTopKnee) * formula.techTopSlope;
	return Math.exp(formula.techAccExponent * accuracy) * formula.techWeight * Math.pow(tech, formula.techRatingPower);
};

const starsFromPpNoBonus = ppAt96 => {
	const basis = ppAt96 / formula.starDivisor;
	return basis > 0 ? formula.starScale * Math.pow(basis, formula.starExponent) : basis;
};

export const lowStarMultiplier = stars => {
	if (formula.lowStarBonus <= 0 || Number.isNaN(stars) || stars >= formula.lowStarBonusEnd) return 1;
	return 1 + formula.lowStarBonus * Math.pow(formula.lowStarBonusEnd - Math.max(stars, 0), formula.lowStarBonusPower);
};

const starsFromPp = ppAt96 => {
	const stars = starsFromPpNoBonus(ppAt96);
	if (!(ppAt96 > 0) || formula.lowStarBonus <= 0 || stars >= formula.lowStarBonusEnd) return stars;

	let lo = stars;
	let hi = formula.lowStarBonusEnd;
	while (hi - lo > 1e-6) {
		const mid = (lo + hi) / 2;
		if (mid < starsFromPpNoBonus(ppAt96 * lowStarMultiplier(mid))) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
};

const scale = pp => formula.ppMultiplier * pp;

const baseTable = [
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

const baseValue = acc => {
	let i = 0;
	for (; i < baseTable.length; i++) {
		if (baseTable[i][0] <= acc) break;
	}
	if (i == 0) i = 1;
	if (i >= baseTable.length) i = baseTable.length - 1;
	const middleDis = (acc - baseTable[i - 1][0]) / (baseTable[i][0] - baseTable[i - 1][0]);
	return baseTable[i - 1][1] + middleDis * (baseTable[i][1] - baseTable[i - 1][1]);
};

const smooth = (() => {
	const points = [...baseTable].sort((a, b) => a[0] - b[0]);
	const n = points.length;
	const xs = points.map(p => p[0]);
	const ys = points.map(p => p[1]);
	const h = new Array(n - 1);
	const d = new Array(n - 1);
	const slopes = new Array(n).fill(0);
	for (let i = 0; i < n - 1; i++) {
		h[i] = xs[i + 1] - xs[i];
		d[i] = (ys[i + 1] - ys[i]) / h[i];
	}
	slopes[0] = d[0];
	slopes[n - 1] = d[n - 2];
	for (let i = 1; i < n - 1; i++) {
		if (d[i - 1] * d[i] <= 0) continue;
		const w1 = 2 * h[i] + h[i - 1];
		const w2 = h[i] + 2 * h[i - 1];
		slopes[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
	}
	return {xs, ys, slopes};
})();

const smoothBaseValue = acc => {
	const {xs, ys, slopes} = smooth;
	if (acc <= xs[0]) return ys[0];
	if (acc >= xs[xs.length - 1]) return ys[ys.length - 1];
	let i = 0;
	while (xs[i + 1] < acc) i++;
	const h = xs[i + 1] - xs[i];
	const t = (acc - xs[i]) / h;
	const t2 = t * t;
	const t3 = t2 * t;
	return (
		(2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * slopes[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * slopes[i + 1]
	);
};

const modifiableCurve = ({Y0 = 0.256, K = 4.86, W = 0.6, K2 = 2.88, P2 = 2.46, C = 1.0, A = 1.0} = {}) => {
	const getM = () => {
		const term1 = (1.0 - Y0) / 0.35;
		const term2 = 1.0 - W + (W * (K * Math.exp(K))) / (Math.exp(K) - 1.0);
		return term1 * term2;
	};
	const getF1 = x => {
		const u = (x - 0.6) / 0.35;
		const blend = (1.0 - W) * u + (W * (Math.exp(K * u) - 1.0)) / (Math.exp(K) - 1.0);
		return Y0 + (1.0 - Y0) * blend;
	};
	const getF2 = x => {
		const m = getM();
		const u2 = (x - 0.95) / 0.05;
		const expTerm = (Math.exp(K2 * Math.pow(u2, P2)) - 1.0) / (Math.exp(K2) - 1.0);
		return 1.0 + m * (x - 0.95) + (6.424 - 0.05 * m) * expTerm;
	};
	const getS = () => {
		const m = getM();
		const uA = (A - 0.95) / 0.05;
		const uAPower = uA > 0 ? Math.pow(uA, P2) : 0;
		const uAPowerMinus1 = uA > 0 ? Math.pow(uA, P2 - 1.0) : 0;
		const expTerm = Math.exp(K2 * uAPower) / (Math.exp(K2) - 1.0);
		const derivativeFactor = ((K2 * P2) / 0.05) * uAPowerMinus1;
		return m + (6.424 - 0.05 * m) * expTerm * derivativeFactor;
	};
	const getL = x => {
		const s = getS();
		const s1 = s * (1.0 - C);
		const f2A = getF2(A);
		if (Math.abs(A - 1.0) < 1e-9) return f2A + s1 * (x - A);
		const expTerm = 1.0 - Math.exp(-(x - A) / (1.0 - A));
		return f2A + s1 * (x - A) + (s - s1) * (1.0 - A) * expTerm;
	};
	return {
		A,
		getValue: x => {
			if (x <= 0.6) return (Y0 / 0.6) * x;
			if (x <= 0.95) return getF1(x);
			if (x <= A) return getF2(x);
			return getL(x);
		},
	};
};

const curveSettings = {
	enabled: true,
	table: [
		{predictedAcc: 0.955, A: 1.0, C: -5.3, K: 4.86, W: 0.6, K2: 2.88, P2: 2.46},
		{predictedAcc: 0.96, A: 0.99, C: -3.0, K: 4.3, W: 0.66, K2: 4.8, P2: 1.85},
		{predictedAcc: 0.965, A: 0.988, C: -2.4, K: 4.5, W: 0.64, K2: 4.5, P2: 1.95},
		{predictedAcc: 0.97, A: 0.986, C: -2.2, K: 4.7, W: 0.62, K2: 4.2, P2: 2.05},
		{predictedAcc: 0.975, A: 0.985, C: -1.8, K: 4.86, W: 0.6, K2: 3.8, P2: 2.15},
		{predictedAcc: 0.98, A: 0.985, C: -1.4, K: 4.86, W: 0.6, K2: 3.35, P2: 2.3},
		{predictedAcc: 0.985, A: 0.985, C: -1.2, K: 4.86, W: 0.6, K2: 2.88, P2: 2.46},
		{predictedAcc: 0.99, A: 0.9915, C: -1.2, K: 4.86, W: 0.6, K2: 2.88, P2: 2.46},
		{predictedAcc: 0.995, A: 0.9915, C: -1.2, K: 4.86, W: 0.6, K2: 2.88, P2: 2.46},
	],
	maxC: 1,
	sliderTilt: 0.2,
	sliderTiltRange: 0.015,
	lowNoteStart: 115,
	lowNoteRefNotes: 20,
	lowNoteRefMultiplier: 0.8,
	lowNoteMinMultiplier: 0.5,
};

const lowNoteMultiplier = notes => {
	const s = curveSettings;
	if (s.lowNoteStart <= 0 || notes <= 0 || notes >= s.lowNoteStart) return 1;
	const nerf = ((1 - s.lowNoteRefMultiplier) * Math.log(s.lowNoteStart / notes)) / Math.log(s.lowNoteStart / s.lowNoteRefNotes);
	return Math.max(1 - nerf, s.lowNoteMinMultiplier);
};

const isDefaultRow = r => r.A >= 0.9995 && r.K == 4.86 && r.W == 0.6 && r.K2 == 2.88 && r.P2 == 2.46;

const paramsAt = predictedAcc => {
	const rows = [...curveSettings.table].sort((a, b) => a.predictedAcc - b.predictedAcc);
	const clamp = r => ({A: r.A, C: Math.min(r.C, curveSettings.maxC), K: r.K, W: r.W, K2: r.K2, P2: r.P2});
	if (predictedAcc <= rows[0].predictedAcc) return clamp(rows[0]);
	for (let i = 1; i < rows.length; i++) {
		if (predictedAcc <= rows[i].predictedAcc) {
			const p = rows[i - 1];
			const n = rows[i];
			const t = (predictedAcc - p.predictedAcc) / (n.predictedAcc - p.predictedAcc);
			const L = (x, y) => x + t * (y - x);
			return clamp({A: L(p.A, n.A), C: L(p.C, n.C), K: L(p.K, n.K), W: L(p.W, n.W), K2: L(p.K2, n.K2), P2: L(p.P2, n.P2)});
		}
	}
	return clamp(rows[rows.length - 1]);
};

const perMapCurves = predictedAcc => {
	if (!curveSettings.enabled || predictedAcc <= 0.6 || predictedAcc >= 0.9995) return null;
	const row = paramsAt(predictedAcc);
	if (isDefaultRow(row)) return null;
	const A = Math.min(Math.max(row.A, 0.951), 1.0);
	return {modified: modifiableCurve({...row, A}), standard: modifiableCurve()};
};

const perMapValue = (curves, x) => {
	const base = smoothBaseValue(x);
	const reference = curves.standard.getValue(x);
	const value = reference > 0 ? (base * curves.modified.getValue(x)) / reference : base;
	return Math.min(base, value);
};

const sliderTiltAt = (sliderPercentage, predictedAcc) => {
	if (!curveSettings.enabled || curveSettings.sliderTilt == 0 || predictedAcc <= 0.6 || predictedAcc >= 0.9995) return 0;
	return curveSettings.sliderTilt * sliderPercentage;
};

const round6 = x => Math.round(x * 1e6) / 1e6;

const curveCache = new Map();

export const buildAccCurve = (predictedAcc, sliderPercentage, noteCount) => {
	predictedAcc = predictedAcc ?? 0;
	sliderPercentage = sliderPercentage ?? 0;
	noteCount = noteCount ?? 0;

	const key = `${predictedAcc}|${sliderPercentage}|${noteCount}`;
	const cached = curveCache.get(key);
	if (cached) return cached;

	const nerf = lowNoteMultiplier(noteCount);
	const curves = perMapCurves(predictedAcc);
	const tilt = sliderTiltAt(sliderPercentage, predictedAcc);
	let result;
	if (!curves && tilt == 0) {
		result = baseTable.map(([x, y]) => [x, y * nerf]);
	} else {
		const a = curves?.modified.A ?? 1.0;
		const xs = new Set();
		baseTable.forEach(([x]) => xs.add(round6(x)));
		for (let i = 0; i < 71; i++) xs.add(round6(0.6 + i * 0.005));
		for (let i = 0; i < 101; i++) xs.add(round6(0.95 + i * 0.0005));
		xs.add(round6(a));
		result = [...xs]
			.filter(x => x >= 0 && x <= 1)
			.sort((x, y) => y - x)
			.map(x => {
				let value = curves ? perMapValue(curves, x) : baseValue(x);
				if (tilt != 0) {
					const distance = Math.min(Math.max(x - predictedAcc, -curveSettings.sliderTiltRange), curveSettings.sliderTiltRange);
					value *= Math.exp(tilt * distance * 100);
				}
				return [x, value * nerf];
			});
	}

	if (curveCache.size > 5000) curveCache.clear();
	curveCache.set(key, result);
	return result;
};

export const curveValue = (acc, curve) => {
	if (!curve || curve.length < 2) return baseValue(acc);

	let i = 0;
	let hi = curve.length;
	while (i < hi) {
		const mid = (i + hi) >> 1;
		if (curve[mid][0] <= acc) hi = mid;
		else i = mid + 1;
	}
	if (i == 0) i = 1;
	if (i >= curve.length) i = curve.length - 1;

	const middleDis = (acc - curve[i - 1][0]) / (curve[i][0] - curve[i - 1][0]);
	return curve[i - 1][1] + middleDis * (curve[i][1] - curve[i - 1][1]);
};

export const getPpParts = (accuracy, accRating, passRating, techRating, curve, stars, golf = false) => {
	const power = stars === undefined || stars === null ? formula.accCurvePower : curvePowerAt(stars);
	let acc;
	if (golf) {
		acc = accuracy * accRating * 42;
	} else {
		let value = curveValue(accuracy, curve);
		if (power != 1) value = accCurve(value, curveValue(STAR_ACCURACY, curve), power);
		acc = accPp(value, accRating);
	}
	return [passPp(passRating), acc, techPp(accuracy, techRating)];
};

export const toStars = (accRating, passRating, techRating, curve) => {
	const [pass, acc, tech] = getPpParts(STAR_ACCURACY, accRating, passRating, techRating, curve);
	return starsFromPp(pass + acc + tech);
};

export const scorePp = (accuracy, ratings, golf = false) => {
	if (!(accuracy > 0) || accuracy > 1) return [0, 0, 0, 0];

	const [pass, acc, tech] = getPpParts(accuracy, ratings.accRating, ratings.passRating, ratings.techRating, ratings.curve, ratings.stars, golf);
	const sum = pass + acc + tech;
	let total = scale(sum) * lowStarMultiplier(ratings.stars);
	if (!Number.isFinite(total)) total = 0;
	const increase = sum > 0 ? total / sum : 0;
	return [total, pass * increase, acc * increase, tech * increase];
};
