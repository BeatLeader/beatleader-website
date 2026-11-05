const PERCENTILES = 100;

export const curveAt = (curve, v) => {
	if (!(v > 0)) return 0;
	if (!curve?.length) return v;

	let [x0, y0] = [0, 0];
	for (const [x1, y1] of curve) {
		if (v <= x1) return y0 + ((y1 - y0) * (v - x0)) / (x1 - x0);
		[x0, y0] = [x1, y1];
	}

	const [fromX, fromY] = curve[Math.max(0, curve.length - 1 - PERCENTILES / 20)];
	const slope = x0 > fromX ? (y0 - fromY) / (x0 - fromX) : 0;
	return y0 + slope * (v - x0);
};

// The curve's values, scaled so they average to the rating (the shown modifier's: a speed modifier's lines rise)
export const effectiveStars = (raw, rating, curve = null) => {
	const stars = (raw ?? []).map(v => curveAt(curve, v));
	const mean = stars.length ? stars.reduce((sum, v) => sum + v, 0) / stars.length : 0;
	return stars.map(v => (mean > 0 ? Math.round((v / mean) * rating * 1000) / 1000 : 0));
};