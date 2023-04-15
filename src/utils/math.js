Number.prototype.clamp = function (min, max) {
	return clamp(this, min, max);
}

export function clamp(f, min, max) {
	return Math.min(Math.max(f, min), max);
}
