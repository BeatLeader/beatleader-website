import {getCurrentLocale} from '../stores/config';

var lcount = 3;
if (window.location.host.includes('localhost')) {
	lcount = 1;
}
if (parseInt(location.host.split('.')[location.host.split('.').length - 1])) {
	lcount = 4;
}
export var GLOBAL_LEADERBOARD_TYPE = location.host.split('.').length > lcount ? location.host.split('.')[0] : 'general';

export function setLeaderboardType(newType) {
	GLOBAL_LEADERBOARD_TYPE = newType;
}

export const substituteVars = (url, vars, clearUnused = false, clearEmptyQuery = false, process = v => v) => {
	vars.leaderboardContext = GLOBAL_LEADERBOARD_TYPE;

	let replaced = Object.keys(vars).reduce((cum, key) => cum.replace(new RegExp('\\${' + key + '}', 'gi'), process(vars[key] ?? '')), url);

	if (clearUnused) replaced = replaced.replace(new RegExp('\\${.*?}', 'gi'), '');

	if (clearEmptyQuery && replaced.length) {
		if (replaced[0] === '/') replaced = window.location.protocol + '//' + window.location.host + replaced;

		const urlObj = new URL(replaced);
		[...urlObj.searchParams.entries()].forEach(([k, v]) => {
			if ((clearEmptyQuery === 'null-only' && (v === null || v === undefined)) || (clearEmptyQuery === true && !v?.toString()?.length))
				urlObj.searchParams.delete(k);
		});

		replaced = urlObj.toString();
	}

	return replaced;
};

export function formatNumber(num, digits = 2, addSign = false, notANumber = null) {
	if (!Number.isFinite(num)) {
		return notANumber;
	}

	return (
		(addSign && num > 0 ? '+' : '') +
		num.toLocaleString(getCurrentLocale(), {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits,
		})
	);
}

export const padNumber = (num, pad = 2) => (Array(pad).fill('0').join('') + num).slice(-pad);

export const round = (val, places = 2) => {
	if (!Number.isFinite(val)) return null;

	const mult = Math.pow(10, places);
	return Math.round((val + Number.EPSILON) * mult) / mult;
};

export function roundToPrecision(num, precision = 0.1) {
	return round(Math.floor(num / precision) * precision);
}
